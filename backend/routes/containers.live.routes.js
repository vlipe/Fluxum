// routes/containers.live.routes.js
const { Router } = require("express");
const { pool } = require("../database/db");

const r = Router();

// Última posição por container (sem views, sem funções extras)
r.get("/containers/live", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (cm.container_id)
          cm.container_id,
          cm.voyage_code,
          cm.imo,
          cm.lat,
          cm.lng,
          COALESCE(cm.ts_iso, cm.created_at) AS ts_iso
        FROM container_movements cm
        WHERE cm.lat IS NOT NULL AND cm.lng IS NOT NULL
        ORDER BY cm.container_id, COALESCE(cm.ts_iso, cm.created_at) DESC
      )
      SELECT * FROM latest
      ORDER BY ts_iso DESC
      LIMIT 5000
    `);

    const fc = {
      type: "FeatureCollection",
      features: rows.map((r) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
        properties: {
          container_id: r.container_id,
          voyage_code: r.voyage_code,
          imo: r.imo,
          ts_iso: r.ts_iso
        }
      }))
    };
    res.json(fc);
  } catch (err) {
    console.error("containers/live", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = r;
