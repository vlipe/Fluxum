
// controllers/voyages.controller.js
const { pool } = require('../database/db');

exports.create = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      ship_id,
      ship_imo,
      voyage_code,
      departure_port,
      arrival_port,
      origin_lat,
      origin_lng,
      dest_lat,
      dest_lng,
      departure_date,
      arrival_date
    } = req.body || {};

    let shipId = ship_id ?? null;
    if (!shipId && ship_imo) {
      const r = await client.query('SELECT ship_id FROM ships WHERE imo=$1 LIMIT 1', [String(ship_imo)]);
      if (r.rowCount > 0) shipId = r.rows[0].ship_id;
    }
    if (!shipId) {
      return res.status(400).json({ error: 'ship_id ou ship_imo é obrigatório' });
    }

    const rIns = await client.query(
      `INSERT INTO voyages (
         ship_id, voyage_code, departure_port, arrival_port,
         origin_lat, origin_lng, dest_lat, dest_lng,
         departure_date, arrival_date
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
       )
       RETURNING voyage_id, ship_id, voyage_code, departure_port, arrival_port,
                 origin_lat, origin_lng, dest_lat, dest_lng, status, created_at`,
      [
        shipId,
        voyage_code || null,
        departure_port || null,
        arrival_port || null,
        origin_lat ?? null,
        origin_lng ?? null,
        dest_lat ?? null,
        dest_lng ?? null,
        departure_date ?? null,
        arrival_date ?? null
      ]
    );

    return res.status(201).json(rIns.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao criar viagem' });
  } finally {
    client.release();
  }
};

exports.start = async (req, res) => {
  const id = req.params.id;
  const speed_kmh = Number(req.body.speed_kmh || 25);
  const r = await pool.query(`select origin_lat,origin_lng,dest_lat,dest_lng from voyages where voyage_id=$1`, [id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Not Found' });
  const v = r.rows[0];
  let eta = null;
  if (v.origin_lat != null && v.dest_lat != null) {
    const dist = haversineKm(v.origin_lat, v.origin_lng, v.dest_lat, v.dest_lng);
    const hours = dist / Math.max(1, speed_kmh);
    eta = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  }
  await pool.query(`update voyages set status='IN_TRANSIT', started_at=now(), eta=$2 where voyage_id=$1`, [id, eta]);
  res.json({ ok: true, eta });
};

exports.arrive = async (req, res) => {
  const id = req.params.id;
  await pool.query(`update voyages set status='ARRIVED', arrived_at=now() where voyage_id=$1`, [id]);
  res.json({ ok: true });
};

exports.complete = async (req, res) => {
  const id = req.params.id;
  await pool.query(`update voyages set status='COMPLETED', completed_at=now() where voyage_id=$1`, [id]);
  res.json({ ok: true });
};

exports.lastUpdate = async (req, res) => {
  const id = req.params.id;
  const r = await pool.query(
    `select max(coalesce(ts_iso,created_at)) as last_update_iso
     from container_movements where voyage_id=$1`,
    [id]
  );
  res.json({ last_update_iso: r.rows[0].last_update_iso });
};

exports.addContainers = async (req, res) => {
  const id = req.params.id;
  const items = Array.isArray(req.body) ? req.body : [];
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const it of items) {
      await client.query(
        `insert into containers(id,container_type,owner,description) values($1,null,null,null) on conflict (id) do nothing`,
        [it.container_id]
      );
      await client.query(
        `insert into voyage_containers(voyage_id,container_id,loaded_at) values($1,$2,$3)
         on conflict (voyage_id,container_id) do update set loaded_at=excluded.loaded_at`,
        [id, it.container_id, it.loaded_at || new Date().toISOString()]
      );
    }
    await client.query('commit');
    res.json({ ok: true });
  } catch (e) {
    await client.query('rollback');
    res.status(400).json({ error: 'Bad Request' });
  } finally {
    client.release();
  }
};

exports.listContainers = async (req, res) => {
  const id = req.params.id;
  const search = String(req.query.search || '').trim();
  if (!search) {
    const r = await pool.query(
      `select vc.container_id, vc.loaded_at
       from voyage_containers vc where vc.voyage_id=$1 order by vc.loaded_at desc nulls last`,
      [id]
    );
    return res.json(r.rows);
  }
  const r = await pool.query(
    `select vc.container_id, vc.loaded_at
     from voyage_containers vc
     where vc.voyage_id=$1 and vc.container_id ilike $2
     order by vc.loaded_at desc nulls last`,
    [id, `%${search}%`]
  );
  res.json(r.rows);
};

exports.trail = async (req, res) => {
  const id = req.params.id;
  const containerId = req.query.container_id || null;
  const since = req.query.since || null;
  const params = [id];
  let where = `voyage_id=$1`;
  if (containerId) { params.push(containerId); where += ` and container_id=$${params.length}`; }
  if (since) { params.push(since); where += ` and coalesce(ts_iso,created_at) >= $${params.length}`; }
  const r = await pool.query(
    `select container_id, coalesce(ts_iso,created_at) as ts, lat, lng, temp_c, battery_percent
     from container_movements where ${where}
     and lat is not null and lng is not null
     order by coalesce(ts_iso,created_at) asc limit 10000`,
    params
  );
  res.json(r.rows);
};
