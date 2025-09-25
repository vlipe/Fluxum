const { pool } = require('../database/db');

exports.create = async (req, res) => {
  const client = await pool.connect();
  try {
    const body = req.body || {};
    const id = String(body.id || body.container_id || '').trim();
    const container_type = body.container_type ? String(body.container_type).trim() : null;
    const owner = body.owner ? String(body.owner).trim() : null;
    const description = body.description ? String(body.description).trim() : null;

    if (!id) {
      return res.status(400).json({ error: 'Campo "id" é obrigatório (ex.: MSCU1234567). Você também pode enviar "container_id".' });
    }

    const r = await client.query(
      `INSERT INTO containers (id, container_type, owner, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         container_type = COALESCE(EXCLUDED.container_type, containers.container_type),
         owner          = COALESCE(EXCLUDED.owner, containers.owner),
         description    = COALESCE(EXCLUDED.description, containers.description)
       RETURNING id, container_type, owner, description, created_at`,
      [id, container_type, owner, description]
    );

    return res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar container' });
  } finally {
    client.release();
  }
};
