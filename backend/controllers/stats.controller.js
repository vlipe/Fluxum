const { query } = require('../database/db');

function pushCond(where, params, cond, val) {
  if (val !== undefined && val !== null && val !== '') {
    params.push(val);
    where.push(cond.replace('$X', '$' + params.length));
  }
}

exports.movementsPerDay = async (req, res) => {
  const { from, to, location, containerId } = req.query;
  const where = [], params = [];
  pushCond(where, params, 'COALESCE(ts_iso, created_at) >= $X', from);
  pushCond(where, params, 'COALESCE(ts_iso, created_at) <= $X', to);
  pushCond(where, params, 'location = $X', location);
  pushCond(where, params, 'container_id = $X', containerId);

  const sql = `
    SELECT date_trunc('day', COALESCE(ts_iso, created_at))::date AS day,
           COUNT(*)::int AS total
    FROM container_movements
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY 1
    ORDER BY 1
  `;
  try {
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.byLocation = async (req, res) => {
  const { from, to } = req.query;
  const where = [], params = [];
  pushCond(where, params, 'COALESCE(ts_iso, created_at) >= $X', from);
  pushCond(where, params, 'COALESCE(ts_iso, created_at) <= $X', to);

  const sql = `
    SELECT COALESCE(location, 'UNKNOWN') AS location,
           COUNT(*)::int AS total
    FROM container_movements
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY 1
    ORDER BY total DESC
  `;
  try {
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.topContainers = async (req, res) => {
  const { from, to, limit = 10 } = req.query;
  const where = [], params = [];
  pushCond(where, params, 'COALESCE(ts_iso, created_at) >= $X', from);
  pushCond(where, params, 'COALESCE(ts_iso, created_at) <= $X', to);

  const sql = `
    SELECT container_id, COUNT(*)::int AS total
    FROM container_movements
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    GROUP BY 1
    ORDER BY total DESC, container_id ASC
    LIMIT $${params.length + 1}
  `;
  try {
    const r = await query(sql, [...params, Math.max(1, parseInt(limit, 10) || 10)]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
