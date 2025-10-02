const { pool } = require("../database/db");
const { logger } = require("../utils/observability");
const telemetryService = require("../services/iotMonitoringService");

const ingestBatch = async (req, res) => {
  const items = req.body && Array.isArray(req.body.items) ? req.body.items : [];
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const it of items) {
      await client.query(
        `insert into container_movements
         (container_id,event_type,site,location,gpio,device_id,tag,ts_iso,lat,lng,geohash,meta,idempotency_key,source,voyage_id,battery_percent,temp_c)
         values ($1,$2,null,null,null,$3,null,$4,$5,$6,null,$7,$8,'esp32',$9,$10,$11)
         on conflict on constraint ux_mov_idempotent do nothing`,
        [
          it.container_id,
          it.event_type || "HEARTBEAT",
          it.device_id || null,
          it.ts_iso || null,
          it.lat || null,
          it.lng || null,
          it.meta || null,
          it.idempotency_key || null,
          it.voyage_id || null,
          it.battery_percent != null ? Number(it.battery_percent) : null,
          it.temp_c != null ? Number(it.temp_c) : null,
        ]
      );
    }
    await client.query("commit");
    res.json({ ok: true, inserted: items.length });
  } catch (e) {
    await client.query("rollback");
    res.status(400).json({ error: "Bad Request" });
  } finally {
    client.release();
  }
};


// --- NOSSA NOVA FUNÇÃO, AGORA DENTRO DO MESMO ARQUIVO ---
const receiveIoTPacket = async (req, res) => {
  const telemetryData = req.body;

  if (!telemetryData || Object.keys(telemetryData).length === 0) {
    logger.warn("Recebida requisição de telemetria de IoT vazia.");
    return res.status(400).json({ message: "Nenhum dado recebido." });
  }

  try {
    // A lógica de chamar o serviço continua a mesma
    await telemetryService.processTelemetry(telemetryData);
    res
      .status(200)
      .json({ message: "Dados de telemetria recebidos com sucesso." });
  } catch (error) {
    logger.error(
      { err: error, data: telemetryData },
      "Erro ao processar dados de telemetria da IoT."
    );
    res.status(500).json({ message: "Erro interno no servidor." });
  }
};

module.exports = {
    ingestBatch,
    receiveIoTPacket,
};
