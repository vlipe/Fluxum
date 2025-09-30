// routes/ships.live.routes.js
const { Router } = require("express");
const { pool } = require("../database/db");

const r = Router();

// Agrega "navios" por voyage_code a partir das últimas posições dos containers
r.get("/ships/live", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (cm.container_id)
          cm.container_id,
          cm.voyage_code,
          cm.lat,
          cm.lng,
          COALESCE(cm.ts_iso, cm.created_at) AS ts_iso
        FROM container_movements cm
        WHERE cm.lat IS NOT NULL AND cm.lng IS NOT NULL
        ORDER BY cm.container_id, COALESCE(cm.ts_iso, cm.created_at) DESC
      )
      SELECT
        voyage_code,
        AVG(lat)  AS lat,
        AVG(lng)  AS lon,
        MAX(ts_iso) AS ts_iso,
        COUNT(*)::int AS containers_onboard
      FROM latest
      WHERE voyage_code IS NOT NULL
      GROUP BY voyage_code
      ORDER BY ts_iso DESC
    `);

    const fc = {
      type: "FeatureCollection",
      features: rows.map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [Number(r.lon), Number(r.lat)] },
        properties: {
          ship_key: r.voyage_code,
          voyage_code: r.voyage_code,
          containers_onboard: r.containers_onboard,
          ts_iso: r.ts_iso
        }
      }))
    };
    res.json(fc);
  } catch (err) {
    console.error("ships/live", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = r;
