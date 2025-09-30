const express = require("express");
const { pool } = require("../database/db");
const router = express.Router();

router.get("/voyages/map", async (req, res) => {
  const q = `
  select
    v.voyage_id,
    v.voyage_code,
    v.origin_lat, v.origin_lng,
    v.dest_lat,   v.dest_lng,
    v.status,
    s.ship_id, s.imo,
    cm.lat as cur_lat, cm.lng as cur_lng, cm.ts as ts_iso,
    vcc.containers_onboard

  from voyages v
  left join ships s on s.ship_id = v.ship_id
  left join lateral (
    select lat,lng,coalesce(ts_iso,created_at) as ts
    from container_movements
    where voyage_id = v.voyage_id and lat is not null and lng is not null
    order by coalesce(ts_iso,created_at) desc
    limit 1
  ) cm on true
   left join voyage_container_counts vcc on vcc.voyage_code = v.voyage_code
  where coalesce(cm.lat, v.origin_lat) is not null
    and coalesce(cm.lng, v.origin_lng) is not null
  `;
  const r = await pool.query(q);
  const fc = {
    type: "FeatureCollection",
    features: r.rows.map(row => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          Number(row.cur_lng ?? row.origin_lng),
          Number(row.cur_lat ?? row.origin_lat)
        ]
      },
      properties: {
        voyage_id: row.voyage_id,
        voyage_code: row.voyage_code,
        ship_id: row.ship_id,
        imo: row.imo,
        status: row.status,
       ts_iso: row.ts_iso || null,
              containers_onboard: row.containers_onboard || 0
      }
    }))
  };
  res.json(fc);
});

router.get("/voyages/:id/track.geojson", async (req, res) => {
   const raw = String(req.params.id || '');
   const byId = /^\d+$/.test(raw);
   const sql = `
     select coalesce(ts_iso,created_at) as ts, lat, lng
       from container_movements
      where ${byId ? 'voyage_id = $1' : 'voyage_id = (select voyage_id from voyages where voyage_code = $1)'}
        and lat is not null and lng is not null
      order by coalesce(ts_iso,created_at) asc`;
  const r = await pool.query(sql, [raw]);
  if (!r.rows.length) {
    return res.json({ type: "FeatureCollection", features: [] });
  }
  const coords = r.rows.map(x => [Number(x.lng), Number(x.lat)]);
  const fc = {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: { voyage_id: id } }]
  };
  res.json(fc);
});

router.get("/voyages/:id/great-circle", async (req, res) => {
   const raw = String(req.params.id || '');
   const byId = /^\d+$/.test(raw);
   const sql = `
     select coalesce(ts_iso,created_at) as ts, lat, lng
       from container_movements
      where ${byId ? 'voyage_id = $1' : 'voyage_id = (select voyage_id from voyages where voyage_code = $1)'}
        and lat is not null and lng is not null
      order by coalesce(ts_iso,created_at) asc`;
  const r = await pool.query(sql, [raw]);
  if (!r.rows[0] || r.rows[0].origin_lat == null || r.rows[0].dest_lat == null) {
    return res.json({ type: "FeatureCollection", features: [] });
  }
  const { origin_lat, origin_lng, dest_lat, dest_lng } = r.rows[0];
  const coords = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    coords.push([
      origin_lng + (dest_lng - origin_lng) * t,
      origin_lat + (dest_lat - origin_lat) * t
    ]);
  }
  const fc = {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: { voyage_id: id, mode: "gc_approx" } }]
  };
  res.json(fc);
});

module.exports = router;
