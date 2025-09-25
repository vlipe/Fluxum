const { pool } = require('../database/db');

exports.create = async (req, res) => {
  const client = await pool.connect();
  try {
    const body = req.body || {};
    const device_id = String(body.device_id || '').trim();
    const alias = body.alias != null ? String(body.alias).trim() : null;
    const model = body.model != null ? String(body.model).trim() : null;
    const site_id = body.site_id || null; // pode ser UUID ou null
    const metadata = typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : null;

    if (!device_id) {
      return res.status(400).json({ error: 'Campo "device_id" é obrigatório (ex.: esp32-abc123).' });
    }

    const r = await client.query(
      `
      INSERT INTO devices (device_id, alias, model, site_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (device_id) DO UPDATE SET
        alias    = COALESCE(EXCLUDED.alias, devices.alias),
        model    = COALESCE(EXCLUDED.model, devices.model),
        site_id  = COALESCE(EXCLUDED.site_id, devices.site_id),
        metadata = COALESCE(EXCLUDED.metadata, devices.metadata)
      RETURNING id, device_id, alias, model, site_id, metadata, last_seen, created_at
      `,
      [device_id, alias, model, site_id, metadata]
    );

    return res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao registrar device' });
  } finally {
    client.release();
  }
};



exports.attachToContainer = async (req, res) => {
  const containerId = String(req.params.id || '').trim();
  const deviceId = String((req.body && req.body.device_id) || '').trim();
  if (!containerId) return res.status(400).json({ error: 'container_id ausente' });
  if (!deviceId) return res.status(400).json({ error: 'device_id ausente' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const c = await client.query('SELECT id FROM containers WHERE id=$1', [containerId]);
    if (c.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Container não encontrado' });
    }

    const d = await client.query('SELECT id FROM devices WHERE device_id=$1', [deviceId]);
    if (d.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Device não encontrado' });
    }

    await client.query(
      `INSERT INTO container_movements
         (container_id, event_type, device_id, ts_iso, meta)
       VALUES
        ($1, 'HEARTBEAT', $2, NOW(), jsonb_build_object('op','attach'))`,
      [containerId, deviceId]
    );

    const u = await client.query(
      `UPDATE container_state
          SET last_device_id=$2, updated_at=NOW()
        WHERE container_id=$1`,
      [containerId, deviceId]
    );

    if (u.rowCount === 0) {
      await client.query(
        `INSERT INTO container_state
           (container_id, last_event_type, last_device_id, updated_at)
         VALUES
           ($1, 'DEVICE_ATTACHED', $2, NOW())`,
        [containerId, deviceId]
      );
    }

    await client.query('COMMIT');
    return res.status(204).send();
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(e);
    return res.status(500).json({ error: 'Erro ao anexar device' });
  } finally {
    client.release();
  }
};

