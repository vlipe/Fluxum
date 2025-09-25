const { pool } = require('../database/db');

exports.ingestBatch = async (req, res) => {
  const items = (req.body && Array.isArray(req.body.items)) ? req.body.items : [];
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const it of items) {
      await client.query(
        `insert into container_movements
         (container_id,event_type,site,location,gpio,device_id,tag,ts_iso,lat,lng,geohash,meta,idempotency_key,source,voyage_id,battery_percent,temp_c)
         values ($1,$2,null,null,null,$3,null,$4,$5,$6,null,$7,$8,'esp32',$9,$10,$11)
         on conflict on constraint ux_mov_idempotent do nothing`,
        [
          it.container_id,
          it.event_type || 'HEARTBEAT',
          it.device_id || null,
          it.ts_iso || null,
          it.lat || null,
          it.lng || null,
          it.meta || null,
          it.idempotency_key || null,
          it.voyage_id || null,
          it.battery_percent != null ? Number(it.battery_percent) : null,
          it.temp_c != null ? Number(it.temp_c) : null
        ]
      );
    }
    await client.query('commit');
    res.json({ ok: true, inserted: items.length });
  } catch (e) {
    await client.query('rollback');
    res.status(400).json({ error: 'Bad Request' });
  } finally {
    client.release();
  }
};
