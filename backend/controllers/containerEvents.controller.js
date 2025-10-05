// backend/controllers/containerEvents.controller.js
const { pool } = require("../database/db");
const { logger } = require("../utils/observability");
const { v4: uuidv4 } = require('uuid');
const transferService = require('../services/transferService');

// --- FUNÇÃO PARA CRIAR UM EVENTO (AGORA MAIS INTELIGENTE) ---
exports.createEvent = async (req, res) => {
    let { container_id } = req.body || {}; 
    const {
        event_type, location, site, gpio, device_id, tag, ts_iso,
        lat, lng, geohash, meta, idempotency_key, source, voyage_id,
        battery_percent, temp_c, humidity, pressure_hpa,
        sog_kn, cog_deg, voyage_code, imo
    } = req.body || {};

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ======================================================================
        // --- LÓGICA DE ASSOCIAÇÃO APRIMORADA ---
        // ======================================================================
        
        // Define o tipo de evento e a fonte se não vierem da IoT
        const final_event_type = event_type || (tag ? 'RFID_DETECTED' : 'HEARTBEAT');
        const final_source = source || 'iot-device';

        // Se o evento é um HEARTBEAT da UMC (iot-device) e não temos o container_id
        if (final_source === 'iot-device' && device_id && !container_id) {
            logger.debug({ device_id }, `Heartbeat: Buscando container associado ao dispositivo...`);
            const result = await client.query(`SELECT id FROM containers WHERE iot_device_id = $1`, [device_id]);
            if (result.rows.length > 0) {
                container_id = result.rows[0].id;
                logger.debug({ container_id }, `Container ${container_id} encontrado para o dispositivo.`);
            } else {
                logger.warn({ device_id }, `Heartbeat recebido, mas dispositivo não está associado a nenhum container.`);
            }
        }
        // Se o evento é um SCAN do LMO (handheld-reader) e não temos o container_id
        else if (final_source === 'handheld-reader' && tag && !container_id) {
            logger.debug({ tag }, `Scan: Buscando container associado à tag RFID...`);
            const result = await client.query(`SELECT id FROM containers WHERE rfid_tag_id = $1`, [tag]);
            if (result.rows.length > 0) {
                container_id = result.rows[0].id;
            } else {
                logger.warn({ tag }, `Scan recebido, mas a tag RFID não está associada a nenhum container.`);
            }
        }
        
        // Se após todas as tentativas, ainda não temos um container_id, a requisição é inválida
        if (!container_id) {
            await client.query('ROLLBACK');
            logger.error({ body: req.body }, "Não foi possível encontrar o container correspondente ao evento.");
            return res.status(404).json({ error: "Não foi possível encontrar o container correspondente ao dispositivo ou tag RFID." });
        }
        
        // ======================================================================

        const final_ts_iso = ts_iso || new Date().toISOString();

        const insertQuery = `
            INSERT INTO container_movements
              (container_id, event_type, site, location, gpio, device_id, tag, ts_iso,
               lat, lng, geohash, meta, idempotency_key, source, voyage_id,
               battery_percent, temp_c, humidity, pressure_hpa, sog_kn, cog_deg, voyage_code, imo)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING id`;
            
        const insertValues = [
            container_id, final_event_type, site, location, gpio, device_id, tag, final_ts_iso,
            lat, lng, geohash, meta || null, idempotency_key, final_source, voyage_id,
            battery_percent, temp_c, humidity, pressure_hpa,
            sog_kn != null ? Number(sog_kn) : null,
            cog_deg != null ? Number(cog_deg) : null,
            voyage_code || null,
            imo || null
        ];

        const r = await client.query(insertQuery, insertValues);

        // --- LÓGICA DE VERIFICAÇÃO DE ALERTA ---
        if (container_id && temp_c != null) {
            const containerRules = await client.query('SELECT min_temp, max_temp FROM containers WHERE id = $1', [container_id]);
            if (containerRules.rows.length > 0) {
                const { min_temp, max_temp } = containerRules.rows[0];
                if (min_temp != null && max_temp != null) {
                    if (parseFloat(temp_c) > parseFloat(max_temp) || parseFloat(temp_c) < parseFloat(min_temp)) {
                        const alertType = parseFloat(temp_c) > parseFloat(max_temp) ? 'TEMP_HIGH' : 'TEMP_LOW';
                        const message = `Alerta! Temperatura (${temp_c}°C) fora do limite (${min_temp} a ${max_temp}°C).`;
                        logger.warn({ containerId: container_id, message }, "GERANDO ALERTA DE TEMPERATURA!");
                        await client.query(
                            `INSERT INTO alerts (id, alert_type, container_id, message, severity) VALUES ($1, $2, $3, $4, $5)`,
                            [uuidv4(), alertType, container_id, message, 3]
                        );
                    }
                }
            }
        }
        
        // --- LÓGICA DE TRANSFERÊNCIA RFID ---
        if (final_event_type === 'RFID_DETECTED' && tag) {
            logger.debug({ tag }, "Evento de RFID detectado. Processando lógica de transferência...");
            await transferService.processRfidScan(tag);
        }

        await client.query('COMMIT');
        res.status(201).json({ id: r.rows[0].id });

    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        logger.error({ err: e }, 'Erro ao criar evento de container');
        res.status(400).json({ error: "Bad Request" });
    } finally {
        if (client) client.release();
    }
};

// --- FUNÇÃO PARA LISTAR EVENTOS (sem alterações) ---
exports.listEvents = async (req, res) => {
    const { from, to, location, containerId } = req.query;
    const where = [];
    const params = [];

    if (from) { params.push(from); where.push(`(ts_iso >= $${params.length} OR ts_iso IS NULL)`); }
    if (to) { params.push(to); where.push(`(ts_iso <= $${params.length} OR ts_iso IS NULL)`); }
    if (location) { params.push(location); where.push(`location = $${params.length}`); }
    if (containerId){ params.push(containerId); where.push(`container_id = $${params.length}`); }

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
    logger.error({ err: e }, 'Erro ao listar eventos de container');
    return res.status(500).json({ error: e.message });
  }
};