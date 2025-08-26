
const { query, pool } = require('../database/db');

// POST /api/container-events
exports.createEvent = async (req, res) => {
  const {
    containerId,
    eventType = 'RFID_DETECTED',
    site = null,
    location,
    gpio = null,
    deviceId = null,
    tag = null,
    timestamp = null
  } = req.body;

  if (!containerId || !location || !eventType) {
    return res.status(400).json({ error: 'containerId, location e eventType são obrigatórios' });
  }

  try {
    const sql = `
      INSERT INTO container_movements
        (container_id, event_type, site, location, gpio, device_id, tag, ts_iso)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
    `;
    const params = [containerId, eventType, site, location, gpio, deviceId, tag, timestamp];

    const r = await query(sql, params);
    return res.status(201).json({ message: 'Evento registrado', id: r.rows[0].id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// GET /api/container-events?from=&to=&location=&containerId=
exports.listEvents = async (req, res) => {
  const { from, to, location, containerId } = req.query;
  const where = [];
  const params = [];

  if (from)      { params.push(from);      where.push('(ts_iso >= $'+params.length+' OR ts_iso IS NULL)'); }
  if (to)        { params.push(to);        where.push('(ts_iso <= $'+params.length+' OR ts_iso IS NULL)'); }
  if (location)  { params.push(location);  where.push('location = $'+params.length); }
  if (containerId){params.push(containerId);where.push('container_id = $'+params.length); }

  const sql = `
    SELECT id, container_id, event_type, site, location, gpio, device_id, tag, ts_iso, created_at
    FROM container_movements
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY COALESCE(ts_iso, created_at) DESC, id DESC
    LIMIT 500
  `;

  try {
    const r = await query(sql, params);
    return res.json(r.rows);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
