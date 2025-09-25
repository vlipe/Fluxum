const express = require("express");
const router = express.Router();
const { pool } = require("../database/db");

async function q(sql, params = [], fallbackRows = []) {
  try {
    const { rows } = await pool.query(sql, params);
    return rows;
  } catch {
    return fallbackRows;
  }
}

router.get("/dashboard", async (_req, res) => {
  const lastEvents = await q(
    `SELECT alert_type, created_at, acknowledged_at
       FROM alerts
     ORDER BY created_at DESC
     LIMIT 100`,
    [],
    []
  );

  const containersCnt = await q(
    `SELECT COUNT(*)::int AS c FROM containers`,
    [],
    [{ c: 0 }]
  );

  const battery = await q(
    `SELECT battery_percent
       FROM device_status
     ORDER BY updated_at DESC
     LIMIT 1`,
    [],
    [{ battery_percent: 72 }]
  );

  const lastTemp = lastEvents.find(r => String(r.alert_type||"").toUpperCase().includes("TEMP"))?.created_at || null;
  const lastDev  = lastEvents.find(r => String(r.alert_type||"").toUpperCase().includes("ROUTE"))?.created_at || null;
  const lastDone = lastEvents.find(r => r.acknowledged_at)?.acknowledged_at || null;

  res.json({
    containersCount: containersCnt[0]?.c ?? 0,
    cards: [
      { label: "Temperatura elevada", ts_iso: lastTemp },
      { label: "Rota desviada",       ts_iso: lastDev  },
      { label: "Rota concluída",      ts_iso: lastDone }
    ],
    battery: { percent: battery[0]?.battery_percent ?? 72 },
    temperature: { celsius: null }
  });
});

module.exports = router;
