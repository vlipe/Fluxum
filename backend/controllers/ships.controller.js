// controllers/ships.controller.js
const { query } = require('../database/db');

exports.create = async (req, res) => {
  try {
    const nameRaw = req.body?.name;
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    if (!name) return res.status(400).json({ error: 'Campo "name" é obrigatório' });

    const imo = req.body?.imo ? String(req.body.imo).trim() : null;
    const flag = req.body?.flag ? String(req.body.flag).trim() : null;

    const sql = `
      INSERT INTO ships (name, imo, flag)
      VALUES ($1, NULLIF($2,''), NULLIF($3,''))
      RETURNING ship_id, name, imo, flag, created_at
    `;
    const r = await query(sql, [name, imo, flag]);
    return res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'IMO já cadastrado' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar navio' });
  }
};

exports.list = async (req, res) => {
  const q = String(req.query?.query || '').trim();
  const params = [];
  let where = '';
  if (q) {
    params.push(`%${q}%`);
    where = `WHERE name ILIKE $1 OR imo ILIKE $1`;
  }
  const sql = `
    SELECT ship_id, name, imo, flag, created_at
      FROM ships
      ${where}
     ORDER BY created_at DESC
     LIMIT 200
  `;
  const r = await query(sql, params);
  return res.json(r.rows);
};

exports.getById = async (req, res) => {
  const idStr = String(req.params.ship_id || '').trim();
  const shipId = /^\d+$/.test(idStr) ? Number(idStr) : NaN;
  if (!Number.isFinite(shipId)) {
    return res.status(400).json({ error: 'ship_id inválido (numérico)' });
  }
  const r = await query(
    `SELECT ship_id, name, imo, flag, created_at
       FROM ships
      WHERE ship_id = $1
      LIMIT 1`,
    [shipId]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: 'Navio não encontrado' });
  return res.json(r.rows[0]);
};
