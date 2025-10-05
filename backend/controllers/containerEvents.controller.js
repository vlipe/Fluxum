
// controllers/containerEvents.controller.js
const { pool } = require("../database/db");
const { logger } = require("../utils/observability"); // Importando seu logger


exports.createEvent = async (req, res) => {
    let { container_id } = req.body || {}; 
    const {
        event_type, location, site, gpio, device_id, tag, ts_iso,
        lat, lng, geohash, meta, idempotency_key, source, voyage_id,
        battery_percent, temp_c, sog_kn, cog_deg, voyage_code, imo
    } = req.body || {};

  const client = await pool.connect();
    try {
        // ======================================================================
        // --- NOVA LÓGICA DE ASSOCIAÇÃO ---
        // Se um 'container_id' não foi enviado no JSON, mas um 'device_id' foi...
        if (!container_id && device_id) {
            logger.debug({ device_id }, `Buscando container associado ao dispositivo...`);
            const result = await client.query(
                `SELECT id FROM containers WHERE iot_device_id = $1`,
                [device_id]
            );
            
            // Se encontramos uma associação no banco de dados...
            if (result.rows.length > 0) {
                container_id = result.rows[0].id; // ...usamos o container_id encontrado!
                logger.debug({ container_id }, `Container ${container_id} encontrado para o dispositivo.`);
            } else {
                logger.warn({ device_id }, `Evento recebido do dispositivo ${device_id}, mas ele não está associado a nenhum container.`);
            }
        }
        // ======================================================================

        // O resto da sua lógica original continua aqui...
        if (String(event_type || "").toUpperCase() === "ALERT_RESOLVED") {
            // ... (sua lógica de resolver alertas)
            return res.status(200).json({ ok: true });
        }

        const allowed = ['RFID_DETECTED','OPEN','CLOSE','MOVE','ENTER','EXIT','ALERT','HEARTBEAT'];
        if (!allowed.includes(String(event_type || '').toUpperCase())) {
            return res.status(400).json({ error: "event_type inválido" });
        }

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
        logger.error({ err: e }, 'Erro ao criar evento de container');
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

