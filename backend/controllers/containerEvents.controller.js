
// controllers/containerEvents.controller.js
const { pool } = require("../database/db");

exports.createEvent = async (req, res) => {
  const {
    event_type, container_id, location, site, gpio, device_id, tag, ts_iso,
    lat, lng, geohash, meta, idempotency_key, source, voyage_id,
    battery_percent, temp_c, ref_event_id, alert_id,

    // NOVOS (podem vir direto no body)
    sog_kn, cog_deg, voyage_code, imo
  } = req.body || {};

  const client = await pool.connect();
  try {
    if (String(event_type || "").toUpperCase() === "ALERT_RESOLVED") {
      const id = alert_id || ref_event_id;
      if (!id) return res.status(400).json({ error: "alert_id requerido" });
      await client.query(
        `UPDATE alerts
           SET acknowledged_by = COALESCE($2, acknowledged_by),
               acknowledged_at = NOW()
         WHERE id = $1`,
        [id, req.user?.id || null]
      );
      return res.status(200).json({ ok: true });
    }

    const allowed = ['RFID_DETECTED','OPEN','CLOSE','MOVE','ENTER','EXIT','ALERT','HEARTBEAT'];
    if (!allowed.includes(String(event_type || '').toUpperCase())) {
      return res.status(400).json({ error: "event_type inválido" });
    }

    // aceita valores diretos ou via meta
    const sog = sog_kn ?? meta?.sog_kn ?? null;
    const cog = cog_deg ?? meta?.cog_deg ?? null;

    const r = await client.query(
      `INSERT INTO container_movements
         (container_id, event_type, site, location, gpio, device_id, tag, ts_iso,
          lat, lng, geohash, meta, idempotency_key, source, voyage_id,
          battery_percent, temp_c, sog_kn, cog_deg, voyage_code, imo)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20,$21)
       RETURNING id`,
      [
        container_id, event_type, site, location, gpio, device_id, tag, ts_iso,
        lat, lng, geohash, meta || null, idempotency_key, source, voyage_id,
        battery_percent, temp_c,
        sog != null ? Number(sog) : null,
        cog != null ? Number(cog) : null,
        voyage_code || null,
        imo || null
      ]
    );

    res.status(201).json({ id: r.rows[0].id });
  } catch (e) {
    console.error('createEvent error:', e);
    res.status(400).json({ error: "Bad Request" });
  } finally {
    client.release();
  }
};



// GET /api/container-events?from=&to=&location=&containerId=
exports.listEvents = async (req, res) => {
  const { from, to, location, containerId } = req.query;
  const where = [];
  const params = [];

  if (from)       { params.push(from);       where.push('(ts_iso >= $'+params.length+' OR ts_iso IS NULL)'); }
  if (to)         { params.push(to);         where.push('(ts_iso <= $'+params.length+' OR ts_iso IS NULL)'); }
  if (location)   { params.push(location);   where.push('location = $'+params.length); }
  if (containerId){ params.push(containerId);where.push('container_id = $'+params.length); }

  const sql = `
    SELECT
      id, container_id, event_type, site, location, gpio, device_id, tag,
      ts_iso, created_at, lat, lng,
      sog_kn  AS speed_kn,
      cog_deg AS heading_deg,
      voyage_id, voyage_code, imo
    FROM container_movements
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY COALESCE(ts_iso, created_at) DESC, id DESC
    LIMIT 500
  `;

  try {
    const r = await pool.query(sql, params);
    return res.json(r.rows);
  } catch (e) {
    console.error('listEvents error:', e);
    return res.status(500).json({ error: e.message });
  }
};

