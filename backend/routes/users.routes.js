// routes/users.routes.js
const express = require('express');
const argon2 = require('argon2');
const { query } = require('../database/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const { userUpdateValidator } = require('../validators/users.validators');

const router = express.Router();

function isUuid(v) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(v));
}

router.get('/me', authRequired, async (req, res) => {
  const result = await query(
    `SELECT id, name, email, role, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [req.user.sub]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json(result.rows[0]);
});

router.get('/lookup', authRequired, requireRole('admin'), async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Parâmetro email é obrigatório' });

  const result = await query(
    `SELECT id, name, email, role, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json(result.rows[0]);
});

router.post('/promote', authRequired, requireRole('admin'), async (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Campo email é obrigatório' });

  const result = await query(
    `UPDATE users
        SET role = 'admin', updated_at = NOW()
      WHERE email = $1
  RETURNING id, name, email, role, created_at, updated_at`,
    [email]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json(result.rows[0]);
});

router.get('/', authRequired, async (_req, res) => {
  const result = await query(
    `SELECT id, name, email, role, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`
  );
  return res.json(result.rows);
});

router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: 'id inválido (UUID esperado)' });

  const result = await query(
    `SELECT id, name, email, role, created_at, updated_at
     FROM users
     WHERE id=$1`,
    [id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json(result.rows[0]);
});

router.post('/', authRequired, requireRole('admin'), async (req, res) => {
  const { name, email, password, role = 'user' } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email e password são obrigatórios' });
  }
  const emailNorm = String(email).trim().toLowerCase();
  const exists = await query('SELECT id FROM users WHERE email=$1', [emailNorm]);
  if (exists.rowCount > 0) return res.status(409).json({ error: 'Email já cadastrado' });

  const password_hash = await argon2.hash(password);
  const insert = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, emailNorm, password_hash, role]
  );
  return res.status(201).json(insert.rows[0]);
});

router.patch('/:id', authRequired, userUpdateValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: 'id inválido (UUID esperado)' });

  if (req.user.role !== 'admin' && req.user.sub !== id) {
    return res.status(403).json({ error: 'Você só pode editar sua própria conta' });
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (typeof req.body.name === 'string') {
    fields.push(`name = $${idx++}`);
    values.push(req.body.name.trim());
  }
  if (typeof req.body.email === 'string') {
    const emailNorm = req.body.email.trim().toLowerCase();
    const conflict = await query('SELECT 1 FROM users WHERE email=$1 AND id<>$2', [emailNorm, id]);
    if (conflict.rowCount > 0) return res.status(409).json({ error: 'Email já cadastrado' });
    fields.push(`email = $${idx++}`);
    values.push(emailNorm);
  }
  if (typeof req.body.password === 'string') {
    const password_hash = await argon2.hash(req.body.password);
    fields.push(`password_hash = $${idx++}`);
    values.push(password_hash);
  }
  if (req.user.role === 'admin' && typeof req.body.role === 'string') {
    fields.push(`role = $${idx++}`);
    values.push(req.body.role);
  }

  if (fields.length === 0) return res.status(400).json({ error: 'Nada para atualizar' });
  fields.push(`updated_at = NOW()`);

  const sql = `
    UPDATE users
       SET ${fields.join(', ')}
     WHERE id = $${idx}
     RETURNING id, name, email, role, created_at, updated_at
  `;
  values.push(id);

  const result = await query(sql, values);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json(result.rows[0]);
});

router.delete('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: 'id inválido (UUID esperado)' });

  if (req.user.role !== 'admin' && req.user.sub !== id) {
    return res.status(403).json({ error: 'Você só pode deletar sua própria conta' });
  }
  const result = await query('DELETE FROM users WHERE id=$1 RETURNING id', [id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.status(204).send();
});

module.exports = router;
