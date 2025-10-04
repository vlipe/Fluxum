const { query } = require("../database/db");

exports.create = async (req, res) => {
  try {
    const account_id = req.account_id;
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ error: 'Campo "name" é obrigatório' });
    const imo = req.body?.imo ? String(req.body.imo).trim() : null;
    const flag = req.body?.flag ? String(req.body.flag).trim() : null;
    const status = req.body?.status ? String(req.body.status).trim() : null;
    const statusfuturo = req.body?.statusfuturo ? String(req.body.statusfuturo).trim() : null;
    const from_port = req.body?.from_port ? String(req.body.from_port).trim() : null;
    const to_port = req.body?.to_port ? String(req.body.to_port).trim() : null;
    const eta_date = req.body?.eta_date ? String(req.body.eta_date).trim() : null;
    const departure_at = req.body?.departure_at ? String(req.body.departure_at).trim() : null;
    const capacity = req.body?.capacity ? Number(req.body.capacity) : null;
    const active = typeof req.body?.active === "boolean" ? req.body.active : true;
    const sql = `
      INSERT INTO ships (account_id, name, imo, flag, status,statusfuturo, from_port, to_port, eta_date, departure_at, capacity, active)
      VALUES ($1, $2, NULLIF($3,''), NULLIF($4,''), NULLIF($5,''), NULLIF($6,''), NULLIF($7,''), NULLIF($8,''), $9::date, $10::timestamptz, $11, $12)
      RETURNING ship_id, account_id, name, imo, flag, status,statusfuturo, from_port, to_port, eta_date, departure_at, capacity, active, created_at
    `;
    const r = await query(sql, [account_id, name, imo, flag, status,statusfuturo, from_port, to_port, eta_date, departure_at, capacity, active]);
    return res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Conflito de duplicidade" });
    return res.status(500).json({ error: "Erro interno" });
  }
};

exports.list = async (req, res) => {
  try {
    const account_id = req.account_id;
    const r = await query(
      `SELECT ship_id, account_id, name, imo, flag, status,statusfuturo, from_port, to_port, eta_date, departure_at, capacity, active, created_at
         FROM ships
        WHERE account_id = $1
        ORDER BY ship_id DESC
        LIMIT 500`,
      [account_id]
    );
    return res.json(r.rows);
  } catch (e) {
    return res.status(500).json({ error: "Erro interno" });
  }
};

exports.getById = async (req, res) => {
  try {
    const account_id = req.account_id;
    const shipId = Number(req.params.ship_id);
    if (!Number.isFinite(shipId)) return res.status(400).json({ error: "ship_id inválido" });
    const r = await query(
      `SELECT ship_id, account_id, name, imo, flag, status,statusfuturo, from_port, to_port, eta_date, departure_at, capacity, active, created_at
         FROM ships
        WHERE account_id = $1 AND ship_id = $2
        LIMIT 1`,
      [account_id, shipId]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: "Navio não encontrado" });
    return res.json(r.rows[0]);
  } catch (e) {
    return res.status(500).json({ error: "Erro interno" });
  }
};

exports.update = async (req, res) => {
  try {
    const account_id = req.account_id;
    const shipId = Number(req.params.ship_id);
    if (!Number.isFinite(shipId)) return res.status(400).json({ error: "ship_id inválido" });
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ error: 'Campo "name" é obrigatório' });
    const imo = req.body?.imo ? String(req.body.imo).trim() : null;
    const flag = req.body?.flag ? String(req.body.flag).trim() : null;
    const status = req.body?.status ? String(req.body.status).trim() : null;
    const statusfuturo = req.body?.statusfuturo ? String(req.body.statusfuturo).trim() : null;
    const from_port = req.body?.from_port ? String(req.body.from_port).trim() : null;
    const to_port = req.body?.to_port ? String(req.body.to_port).trim() : null;
    const eta_date = req.body?.eta_date ? String(req.body.eta_date).trim() : null;
    const departure_at = req.body?.departure_at ? String(req.body.departure_at).trim() : null;
    const capacity = req.body?.capacity ? Number(req.body.capacity) : null;
    const active = typeof req.body?.active === "boolean" ? req.body.active : true;
    const r = await query(
      `UPDATE ships
          SET name = $1,
              imo = NULLIF($2,''),
              flag = NULLIF($3,''),
              status = NULLIF($4,''),
              statusfuturo = NULLIF($5,''),
              from_port = NULLIF($6,''),
              to_port = NULLIF($7,''),
              eta_date = $8::date,
              departure_at = $9::timestamptz,
              capacity = $10,
              active = $11
        WHERE account_id = $12 AND ship_id = $13
        RETURNING ship_id, account_id, name, imo, flag, status,statusfuturo, from_port, to_port, eta_date, departure_at, capacity, active, created_at`,
      [name, imo, flag, status,statusfuturo, from_port, to_port, eta_date, departure_at, capacity, active, account_id, shipId]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: "Navio não encontrado" });
    return res.json(r.rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Conflito de duplicidade" });
    return res.status(500).json({ error: "Erro interno" });
  }
};
