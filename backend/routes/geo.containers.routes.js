const express = require("express");
const { greatCircle } = require("@turf/turf");

const router = require("express").Router();
const { pool } = require("../database/db");

router.get("/containers/positions", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT jsonb_build_object(
        'type','FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type','Feature',
            'geometry', jsonb_build_object('type','Point','coordinates', jsonb_build_array(lon,lat)),
            'properties', jsonb_build_object(
              'id', id,
              'container_id', container_id,
              'voyage_code', voyage_code,
              'imo', imo,
              'speed_kn', NULL,  -- não temos essa coluna aqui; mande NULL
              'ts_iso', to_char(ts_iso, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )
          )
        ), '[]'::jsonb)
      ) AS fc
     FROM container_positions;
    `);
    res.json(rows[0]?.fc ?? { type: "FeatureCollection", features: [] });
  } catch (e) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/voyages/:voyageCode/track", async (req, res) => {
  const v = String(req.params.voyageCode);
  const { rows } = await pool.query(
    `SELECT lon, lat
       FROM container_positions
      WHERE voyage_code = $1
      ORDER BY ts_iso ASC`,
    [v]
  );
  res.json({
    type: "Feature",
    geometry: { type: "LineString", coordinates: rows.map(r => [r.lon, r.lat]) },
    properties: { voyage_code: v }
  });
});

router.get("/voyages/:voyageCode/great-circle", async (req, res) => {
  const v = String(req.params.voyageCode);
  const n = Math.max(2, Math.min(500, Number(req.query.npoints || 180)));
  const firstQ = await pool.query(
    `SELECT lon, lat FROM container_positions WHERE voyage_code=$1 ORDER BY ts_iso ASC LIMIT 1`,
    [v]
  );
  const lastQ = await pool.query(
    `SELECT lon, lat FROM container_positions WHERE voyage_code=$1 ORDER BY ts_iso DESC LIMIT 1`,
    [v]
  );
  if (!firstQ.rows[0] || !lastQ.rows[0]) return res.json({ type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: { voyage_code: v } });
  const start = [firstQ.rows[0].lon, firstQ.rows[0].lat];
  const end = [lastQ.rows[0].lon, lastQ.rows[0].lat];
  const gc = greatCircle(start, end, { npoints: n, properties: { voyage_code: v } });
  res.json(gc);
});

module.exports = router;
