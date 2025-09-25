// backend/controllers/stats.controller.js
const { pool } = require('../database/db');

exports.movementsPerDay = async (_req, res) => {
  const r = await pool.query(`
    select date_trunc('day', coalesce(ts_iso, created_at)) as day, count(*) as events
    from container_movements
    group by 1
    order by day desc
    limit 60
  `);
  res.json(r.rows);
};

exports.byLocation = async (_req, res) => {
  const r = await pool.query(`
    select coalesce(nullif(location,''), nullif(site,''), 'N/A') as location, count(*) as events
    from container_movements
    group by 1
    order by events desc
    limit 100
  `);
  res.json(r.rows);
};

exports.topContainers = async (_req, res) => {
  const r = await pool.query(`
    select container_id, count(*) as events
    from container_movements
    where container_id is not null and container_id <> ''
    group by 1
    order by events desc
    limit 50
  `);
  res.json(r.rows);
};

exports.listWithVoyage = async (_req, res) => {
  const r = await pool.query(`
    select vc.voyage_id,
           v.voyage_code,
           vc.container_id,
           vc.loaded_at,
           vc.unloaded_at,
           v.status
    from voyage_containers vc
    join voyages v on v.voyage_id = vc.voyage_id
    order by vc.voyage_id desc, vc.loaded_at desc nulls last
    limit 200
  `);
  res.json(r.rows);
};
