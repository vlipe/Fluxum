// routes/auth.routes.js
const express = require('express');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const { query } = require('../database/db');
const { loginValidator, registerValidator } = require('../validators/users.validators');
const { validationResult } = require('express-validator');

const router = express.Router();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10);

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function refreshCookieOpts() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // HTTPS em prod
    sameSite: 'lax',
    path: '/auth',
    maxAge: REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000
  };
}

function getRefreshFromReq(req) {
  return (req.cookies && req.cookies.refreshToken) || (req.body && req.body.refreshToken) || null;
}

async function createRefresh(userId, familyId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (user_id, token, family_id, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, token, familyId, expiresAt]
  );
  return token;
}

async function rotateRefresh(oldRow) {
  await query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE id=$1', [oldRow.id]);
  return createRefresh(oldRow.user_id, oldRow.family_id);
}

// Registro
router.post('/register', registerValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  const emailNorm = String(email).trim().toLowerCase();

  const exists = await query('SELECT id FROM users WHERE email=$1', [emailNorm]);
  if (exists.rowCount > 0) return res.status(409).json({ error: 'Email já cadastrado' });

  const password_hash = await argon2.hash(password);
  const insert = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, emailNorm, password_hash]
  );
  const user = insert.rows[0];

  const accessToken = signAccessToken(user);
  const familyId = uuid();
  const refreshToken = await createRefresh(user.id, familyId);

  res.cookie('refreshToken', refreshToken, refreshCookieOpts());
  return res.status(201).json({ user, accessToken, refreshToken });
});

// Login
router.post('/login', loginValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const emailNorm = String(req.body.email).trim().toLowerCase();
  const result = await query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email=$1',
    [emailNorm]
  );
  if (result.rowCount === 0) return res.status(401).json({ error: 'Credenciais inválidas' });

  const user = result.rows[0];
  const ok = await argon2.verify(user.password_hash, req.body.password);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  const accessToken = signAccessToken(user);
  const familyId = uuid();
  const refreshToken = await createRefresh(user.id, familyId);

  res.cookie('refreshToken', refreshToken, refreshCookieOpts());
  delete user.password_hash;
  return res.json({ user, accessToken, refreshToken });
});

// Refresh (rotação)
router.post('/refresh', async (req, res) => {
  const token = getRefreshFromReq(req);
  if (!token) return res.status(401).json({ error: 'Refresh ausente' });

  const q = await query('SELECT * FROM refresh_tokens WHERE token=$1 LIMIT 1', [token]);
  if (q.rowCount === 0) return res.status(401).json({ error: 'Refresh inválido' });

  const row = q.rows[0];
  if (row.revoked_at) return res.status(401).json({ error: 'Refresh revogado' });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE id=$1', [row.id]);
    return res.status(401).json({ error: 'Refresh expirado' });
  }

  const uq = await query('SELECT id, name, email, role FROM users WHERE id=$1', [row.user_id]);
  if (uq.rowCount === 0) return res.status(401).json({ error: 'Usuário não encontrado' });
  const user = uq.rows[0];

  const newRefresh = await rotateRefresh(row);
  const accessToken = signAccessToken(user);

  res.cookie('refreshToken', newRefresh, refreshCookieOpts());
  return res.json({ accessToken, refreshToken: newRefresh });
});

// Logout
router.post('/logout', async (req, res) => {
  const token = getRefreshFromReq(req);
  if (token) {
    await query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE token=$1 AND revoked_at IS NULL', [token]);
    res.clearCookie('refreshToken', { path: '/auth' });
  }
  return res.status(204).send();
});

module.exports = router;
