const express = require("express");
const { pool } = require("../database/db");
const { authRequired, requireRole } = require("../middleware/auth");
const { validationResult } = require("express-validator");
const { userUpdateValidator } = require("../validators/users.validators");
const argon2 = require("argon2");
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

function isUuid(v) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(v));
}

router.get('/me', authRequired, async (req, res) => {
  try {
   
    const { rows } = await pool.query(
      `SELECT id, name, email, role, account_id, avatar_url, created_at, updated_at
         FROM users
        WHERE id = $1
        LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.json(rows[0]);
  } catch (e) {
    console.error('[GET /users/me] error:', e);
    return res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
});



router.get("/lookup", authRequired, requireRole("admin"), async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Parâmetro email é obrigatório" });
  const result = await pool.query(
    `SELECT id, name, email, role, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Usuário não encontrado" });
  return res.json(result.rows[0]);
});

router.post("/promote", authRequired, requireRole("admin"), async (req, res) => {
  const email = String((req.body && req.body.email) || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Campo email é obrigatório" });
  const result = await pool.query(
    `UPDATE users
        SET role = 'admin', updated_at = NOW()
      WHERE email = $1
  RETURNING id, name, email, role, created_at, updated_at`,
    [email]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Usuário não encontrado" });
  return res.json(result.rows[0]);
});

router.get("/", authRequired, async (_req, res) => {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`
  );
  return res.json(result.rows);
});

router.get("/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: "id inválido (UUID esperado)" });
  const result = await pool.query(
    `SELECT id, name, email, role, avatar_url, created_at, updated_at
     FROM users
     WHERE id=$1`,
    [id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Usuário não encontrado" });
  return res.json(result.rows[0]);
});

router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  const { name, email, password, role = "user" } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "name, email e password são obrigatórios" });
  const emailNorm = String(email).trim().toLowerCase();
  const exists = await pool.query("SELECT id FROM users WHERE email=$1", [emailNorm]);
  if (exists.rowCount > 0) return res.status(409).json({ error: "Email já cadastrado" });
  const password_hash = await argon2.hash(password);
  const insert = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, emailNorm, password_hash, role]
  );
  return res.status(201).json(insert.rows[0]);
});

router.patch("/:id", authRequired, userUpdateValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: "id inválido (UUID esperado)" });
  if (req.user.role !== "admin" && req.user.sub !== id) return res.status(403).json({ error: "Você só pode editar sua própria conta" });
  const fields = [];
  const values = [];
  let idx = 1;
  if (typeof req.body.name === "string") { fields.push(`name = $${idx++}`); values.push(req.body.name.trim()); }
  if (typeof req.body.email === "string") {
    const emailNorm = req.body.email.trim().toLowerCase();
    const conflict = await pool.query("SELECT 1 FROM users WHERE email=$1 AND id<>$2", [emailNorm, id]);
    if (conflict.rowCount > 0) return res.status(409).json({ error: "Email já cadastrado" });
    fields.push(`email = $${idx++}`); values.push(emailNorm);
  }
  if (typeof req.body.password === "string") {
    const password_hash = await argon2.hash(req.body.password);
    fields.push(`password_hash = $${idx++}`); values.push(password_hash);
  }
  if (req.user.role === "admin" && typeof req.body.role === "string") { fields.push(`role = $${idx++}`); values.push(req.body.role); }
  if (fields.length === 0) return res.status(400).json({ error: "Nada para atualizar" });
  fields.push(`updated_at = NOW()`);
  const sql = `
    UPDATE users
       SET ${fields.join(", ")}
     WHERE id = $${idx}
     RETURNING id, name, email, role, created_at, updated_at
  `;
  values.push(id);
  const result = await pool.query(sql, values);
  if (result.rowCount === 0) return res.status(404).json({ error: "Usuário não encontrado" });
  return res.json(result.rows[0]);
});


const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const id = req.params.id;
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    cb(null, `${id}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') cb(null, true);
    else cb(new Error('Apenas PNG ou JPG'));
  }
});


router.post('/:id/avatar', authRequired, upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) return res.status(400).json({ error: 'id inválido (UUID esperado)' });

    // só o próprio usuário (ou admin)
    if (req.user.role !== 'admin' && req.user.sub !== id) {
      return res.status(403).json({ error: 'Você só pode alterar seu próprio avatar' });
    }

    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

    // apaga avatar antigo local (se for de /uploads/avatars)
    const prev = await pool.query('SELECT avatar_url FROM users WHERE id=$1', [id]);
    const oldUrl = prev.rows?.[0]?.avatar_url;
    if (oldUrl && oldUrl.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(process.cwd(), oldUrl);
      fs.promises.unlink(oldPath).catch(() => {});
    }

    const publicUrl = `/uploads/avatars/${req.file.filename}`;
    const upd = await pool.query(
      `UPDATE users
          SET avatar_url = $1,
              updated_at = NOW()
        WHERE id = $2
      RETURNING id, name, email, role, avatar_url, created_at, updated_at`,
      [publicUrl, id]
    );

    return res.status(200).json(upd.rows[0]);
  } catch (e) {
    console.error('[POST /users/:id/avatar] error:', e);
    return res.status(500).json({ error: 'Erro ao salvar avatar' });
  }
});
 

router.delete('/:id/avatar', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) return res.status(400).json({ error: 'id inválido (UUID esperado)' });

    if (req.user.role !== 'admin' && req.user.sub !== id) {
      return res.status(403).json({ error: 'Você só pode remover seu próprio avatar' });
    }

    const prev = await pool.query('SELECT avatar_url FROM users WHERE id=$1', [id]);
    if (prev.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const oldUrl = prev.rows[0].avatar_url;
    if (oldUrl && oldUrl.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(process.cwd(), oldUrl);
      await fs.promises.unlink(oldPath).catch(() => {});
    }

    const upd = await pool.query(
      `UPDATE users
          SET avatar_url = NULL,
              updated_at = NOW()
        WHERE id = $1
      RETURNING id, name, email, role, avatar_url, created_at, updated_at`,
      [id]
    );

    return res.json(upd.rows[0]);
  } catch (e) {
    console.error('[DELETE /users/:id/avatar] error:', e);
    return res.status(500).json({ error: 'Erro ao remover avatar' });
  }
});
 



router.delete("/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: "id inválido (UUID esperado)" });
  if (req.user.role !== "admin" && req.user.sub !== id) return res.status(403).json({ error: "Você só pode deletar sua própria conta" });
  const result = await pool.query("DELETE FROM users WHERE id=$1 RETURNING id", [id]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Usuário não encontrado" });
  return res.status(204).send();
});





module.exports = router;
