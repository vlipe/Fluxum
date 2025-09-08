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

const { sendPasswordReset } = require('../services/mailer');

const RESET_EXPIRES_MIN = parseInt(process.env.RESET_EXPIRES_MIN || '30', 10);


const RAW_FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_URLS = RAW_FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean);


function pickFrontendBase(req) {
  const origin = String(req.headers.origin || '').trim();
  if (origin && FRONTEND_URLS.includes(origin)) return origin;
  const httpsPublic = FRONTEND_URLS.find(u => u.startsWith('https://') && !u.includes('localhost'));
  return httpsPublic || FRONTEND_URLS[0];
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10);

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function refreshCookieOpts(req) {
  const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const isLocal = proto === 'http' && (/^localhost:/.test(host) || /^127\.0\.0\.1:/.test(host));

  const hasCrossSiteHttps = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .some(u => u.startsWith('https://') && !u.includes('localhost'));

  const sameSite = isLocal ? 'lax' : (hasCrossSiteHttps ? 'none' : 'lax');
  const secure = isLocal ? false : (hasCrossSiteHttps || process.env.NODE_ENV === 'production');

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth',
    maxAge: (parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10)) * 24 * 60 * 60 * 1000
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

  res.cookie('refreshToken', refreshToken, refreshCookieOpts(req));
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

  res.cookie('refreshToken', refreshToken, refreshCookieOpts(req));
  delete user.password_hash;
  return res.json({ user, accessToken, refreshToken });
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const okResp = () => res.status(202).json({ message: 'Se o e-mail existir, enviaremos instruções.' });
  if (!email) return okResp();

  try {
    const u = await query('SELECT id, name, email FROM users WHERE email=$1 LIMIT 1', [email]);
    if (u.rowCount === 0) return okResp();
    const user = u.rows[0];

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_EXPIRES_MIN * 60 * 1000);

    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, expiresAt, req.ip, req.headers['user-agent'] || null]
    );

    const base = pickFrontendBase(req);
    const link = `${base.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await sendPasswordReset(user.email, user.name, link);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DEV] Link de reset:', link);
      } else {
        console.error('Falha ao enviar e-mail de reset', e);
      }
    }

    return okResp();
  } catch (e) {
    req.log?.error?.(e, 'forgot-password error');
    return okResp();
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const token = String(req.body?.token || '');
  const newPassword = String(req.body?.password || '');
  const confirm = req.body?.confirmPassword != null ? String(req.body.confirmPassword) : null;

  if (!token || newPassword.length < 6) {
    return res.status(400).json({ error: 'Token inválido e/ou senha muito curta' });
  }
  if (confirm !== null && confirm !== newPassword) {
    return res.status(400).json({ error: 'As senhas não coincidem' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const t = await query(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used_at
         FROM password_resets pr
        WHERE pr.token_hash = $1
        LIMIT 1`,
      [tokenHash]
    );

    if (t.rowCount === 0) return res.status(400).json({ error: 'Token inválido' });
    const row = t.rows[0];

    if (row.used_at) return res.status(400).json({ error: 'Token já utilizado' });
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Token expirado' });

    const password_hash = await argon2.hash(newPassword);

    await query('BEGIN');
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [password_hash, row.user_id]);
    await query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL', [row.user_id]);
    await query('UPDATE password_resets SET used_at=NOW() WHERE id=$1', [row.id]);
    await query('COMMIT');

    return res.status(204).send();
  } catch (e) {
    await query('ROLLBACK').catch(() => {});
    req.log?.error?.(e, 'reset-password error');
    return res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// Validate reset token
router.get('/reset-password/validate', async (req, res) => {
  const token = String(req.query?.token || '');
  if (!token) return res.status(400).json({ valid: false });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const t = await query(
    `SELECT expires_at, used_at FROM password_resets WHERE token_hash=$1 LIMIT 1`,
    [tokenHash]
  );
  if (t.rowCount === 0) return res.json({ valid: false });
  const row = t.rows[0];
  const valid = !row.used_at && new Date(row.expires_at).getTime() >= Date.now();
  return res.json({ valid });
});

// Refresh
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

  res.cookie('refreshToken', newRefresh, refreshCookieOpts(req));
  return res.json({ accessToken, refreshToken: newRefresh });
});

// Logout
router.post('/logout', async (req, res) => {
  const token = getRefreshFromReq(req);
  if (token) {
    await query('UPDATE refresh_tokens SET revoked_at=NOW() WHERE token=$1 AND revoked_at IS NULL', [token]);
    res.clearCookie('refreshToken', { path: '/api/auth' });
  }
  return res.status(204).send();
});

module.exports = router;
