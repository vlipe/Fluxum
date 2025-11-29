// controllers/live.controller.js
const { pool } = require('../database/db');

// Retorna TODOS os navios (viagens) da conta como FeatureCollection.
// Se não houver posição real (container_movements), usa a origem da viagem.
// controllers/live.controller.js
exports.ships = async (req, res) => {
  const accountId = req.account_id;

  const q = await pool.query(`
    WITH last AS (
      SELECT cm.voyage_id,
             MAX(COALESCE(cm.ts_iso, cm.created_at)) AS last_ts
        FROM container_movements cm
       GROUP BY cm.voyage_id
    ),
    pos AS (
      SELECT cm.voyage_id, cm.lat, cm.lng, l.last_ts
        FROM container_movements cm
        JOIN last l
          ON l.voyage_id = cm.voyage_id
         AND l.last_ts = COALESCE(cm.ts_iso, cm.created_at)
    )
    SELECT jsonb_build_object(
      'type','FeatureCollection',
      'features', COALESCE(jsonb_agg(
        jsonb_build_object(
          'type','Feature',
          'geometry', jsonb_build_object(
            'type','Point',
            'coordinates', jsonb_build_array(
              COALESCE(p.lng, v.origin_lng),
              COALESCE(p.lat, v.origin_lat)
            )
          ),
          'properties', jsonb_build_object(
            'voyage_id',   v.voyage_id,
            'voyage_code', v.voyage_code,
            'ship_id',     s.ship_id,
            'imo',         s.imo,
            'name',        s.name,
            'status',      v.status,
            'ts_iso',      COALESCE(p.last_ts, v.created_at)
          )
        )
      ) FILTER (WHERE v.voyage_id IS NOT NULL), '[]'::jsonb)
    ) AS fc
      FROM voyages v
      JOIN ships s
        ON s.ship_id = v.ship_id
       WHERE s.account_id = $1
       AND v.status NOT IN ('COMPLETED','ARRIVED')                
      LEFT JOIN pos p
        ON p.voyage_id = v.voyage_id        -- <<< FALTAVA ESTE JOIN
  `, [accountId]);

  res.json(q.rows[0]?.fc ?? { type: 'FeatureCollection', features: [] });
};

 

// controllers/live.controller.js

exports.containers = async (_req, res) => {
  const { rows } = await pool.query(`
    WITH latest AS (
      SELECT DISTINCT ON (cm.container_id)
        cm.container_id,
        cm.voyage_id,                -- <- GARANTA que existe essa coluna na tabela
        cm.voyage_code,
        cm.imo,
        CASE WHEN trim(cm.lat::text) ~ '^-?\\d+(\\.\\d+)?$' THEN cm.lat::float8 ELSE NULL END AS lat,
        CASE WHEN trim(cm.lng::text) ~ '^-?\\d+(\\.\\d+)?$' THEN cm.lng::float8 ELSE NULL END AS lng,
        COALESCE(
          CASE WHEN cm.ts_iso IS NOT NULL AND trim(cm.ts_iso::text) ~ '^\\d{4}-\\d{2}-\\d{2}'
               THEN cm.ts_iso::timestamptz END,
          cm.created_at
        ) AS ts_iso
      FROM container_movements cm
      WHERE cm.lat IS NOT NULL AND cm.lng IS NOT NULL
      ORDER BY cm.container_id,
               COALESCE(
                 CASE WHEN cm.ts_iso IS NOT NULL AND trim(cm.ts_iso::text) ~ '^\\d{4}-\\d{2}-\\d{2}'
                      THEN cm.ts_iso::timestamptz END,
                 cm.created_at
               ) DESC
    )
    SELECT l.*
      FROM latest l
      LEFT JOIN voyages v ON v.voyage_id = l.voyage_id
     WHERE l.lat IS NOT NULL AND l.lng IS NOT NULL
       AND (v.voyage_id IS NULL OR v.status NOT IN ('COMPLETED','ARRIVED'))
     ORDER BY ts_iso DESC
     LIMIT 5000;
  `);

  res.json({
    type: "FeatureCollection",
    features: rows.map(r => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
      properties: r
    }))
  });
};
