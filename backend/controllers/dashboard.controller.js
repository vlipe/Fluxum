const { pool } = require('../database/db');

function row(r){return r.rows&&r.rows[0]?r.rows[0]:null;}

exports.summary = async (_req, res) => {
  const rCnt = await pool.query(`select count(*) as n from containers`);
  const containersCount = Number(rCnt.rows[0]?.n || 0);

  const rTemp = await pool.query(`select id,container_id,message,created_at from alerts where alert_type in ('TEMP_HIGH','TEMPERATURE_HIGH','TEMP_ALERT') order by created_at desc limit 1`);
  const rDev = await pool.query(`select id,container_id,message,created_at from alerts where alert_type='ROUTE_DEVIATION' order by created_at desc limit 1`);
  const rDone = await pool.query(`select id,container_id,message,created_at from alerts where alert_type='ROUTE_COMPLETED' order by created_at desc limit 1`);

  const rBat = await pool.query(`select battery_percent, coalesce(ts_iso,created_at) as ts from container_movements where battery_percent is not null or (meta ? 'battery_percent') order by coalesce(ts_iso,created_at) desc limit 1`);
  let batteryPercent = row(rBat)?.battery_percent ?? null;
  if (batteryPercent == null) {
    const rBF = await pool.query(`select (meta->>'battery_percent')::numeric as bp from container_movements where meta ? 'battery_percent' order by coalesce(ts_iso,created_at) desc limit 1`);
    batteryPercent = row(rBF)?.bp ?? null;
  }

  const rTempNow = await pool.query(`select temp_c, coalesce(ts_iso,created_at) as ts from container_movements where temp_c is not null or (meta ? 'temp_c') order by coalesce(ts_iso,created_at) desc limit 1`);
  let tempC = row(rTempNow)?.temp_c ?? null;
  if (tempC == null) {
    const rTF = await pool.query(`select (meta->>'temp_c')::numeric as tc from container_movements where meta ? 'temp_c' order by coalesce(ts_iso,created_at) desc limit 1`);
    tempC = row(rTF)?.tc ?? null;
  }

  const rLU = await pool.query(`select max(coalesce(ts_iso,created_at)) as last_update_iso from container_movements`);
  const last_update_iso = row(rLU)?.last_update_iso || null;

  function card(label, r) {
    const x = row(r);
    return { label, ts_iso: x?.created_at ? new Date(x.created_at).toISOString() : null, container_id: x?.container_id || null, message: x?.message || null };
    }

  res.json({
    containersCount,
    cards: [card('Temperatura elevada', rTemp), card('Rota desviada', rDev), card('Rota concluída', rDone)],
    battery: { percent: batteryPercent },
    temperature: { celsius: tempC },
    last_update_iso
  });
};
