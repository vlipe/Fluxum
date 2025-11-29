
// controllers/voyages.controller.js
const { pool } = require('../database/db');
const { resolvePortCoords } = require('../utils/ports');

exports.create = async (req, res) => {
  const client = await pool.connect();
  try {
    const account_id = req.account_id;
    const body = req.body || {};

    // Entrada
    const ship_id_in  = body.ship_id ? Number(body.ship_id) : null;
    const ship_imo    = body.ship_imo ? String(body.ship_imo).trim() : null;
    const voyage_code = String(body.voyage_code || '').trim();
    const departure_port = String(body.departure_port || '').trim();
    const arrival_port   = String(body.arrival_port || '').trim();
    const departure_date = body.departure_date ? new Date(body.departure_date) : null;
    const arrival_date   = body.arrival_date ? new Date(body.arrival_date) : null;

    let origin_lat = (typeof body.origin_lat === 'number') ? body.origin_lat : null;
    let origin_lng = (typeof body.origin_lng === 'number') ? body.origin_lng : null;
    let dest_lat   = (typeof body.dest_lat   === 'number') ? body.dest_lat   : null;
    let dest_lng   = (typeof body.dest_lng   === 'number') ? body.dest_lng   : null;

    if (!voyage_code) {
      return res.status(400).json({ error: 'voyage_code é obrigatório' });
    }
    if (!departure_port || !arrival_port) {
      return res.status(400).json({ error: 'departure_port e arrival_port são obrigatórios' });
    }
    if (!departure_date || !arrival_date) {
      return res.status(400).json({ error: 'departure_date e arrival_date são obrigatórios' });
    }

    
    let ship_id = ship_id_in;
    if (!ship_id && ship_imo) {
      const qShip = await client.query(
        `SELECT ship_id FROM public.ships WHERE account_id=$1 AND imo=$2 LIMIT 1`,
        [account_id, ship_imo]
      );
      if (qShip.rowCount === 0) {
        return res.status(400).json({ error: 'Navio (ship_imo) não encontrado nesta conta' });
      }
      ship_id = qShip.rows[0].ship_id;
    }
    if (!ship_id) {
      return res.status(400).json({ error: 'Informe ship_id ou ship_imo' });
    }

    
    if (origin_lat == null || origin_lng == null) {
      const c = resolvePortCoords(departure_port);
      if (c) { origin_lat = c.lat; origin_lng = c.lng; }
    }
    if (dest_lat == null || dest_lng == null) {
      const c = resolvePortCoords(arrival_port);
      if (c) { dest_lat = c.lat; dest_lng = c.lng; }
    }


    const q = await client.query(
      `INSERT INTO public.voyages
        (ship_id, voyage_code, departure_port, arrival_port,
         departure_date, arrival_date, origin_lat, origin_lng, dest_lat, dest_lng, status, created_at)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, 'DRAFT', now())
       RETURNING voyage_id, ship_id, voyage_code, departure_port, arrival_port,
                 origin_lat, origin_lng, dest_lat, dest_lng, status, created_at`,
      [ship_id, voyage_code, departure_port, arrival_port,
       departure_date, arrival_date, origin_lat, origin_lng, dest_lat, dest_lng]
    );

    return res.status(201).json(q.rows[0]);
  } catch (e) {
   
    if (e.code === '23505') {
      
      return res.status(409).json({ error: 'voyage_code já existe' });
    }
    if (e.code === '23503') {
      
      return res.status(400).json({ error: 'ship_id inválido ou ship não pertence à conta' });
    }
    console.error('[voyages.create] error:', e);
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
  const voyageId = req.params.id;

  let items = [];
  if (Array.isArray(req.body)) {
    items = req.body;
  } else if (req.body && Array.isArray(req.body.items)) {
    items = req.body.items;
  } else if (req.body && typeof req.body === 'object') {
    items = [req.body]; // aceita objeto único
  }

  if (!items.length) return res.status(400).json({ error: 'Lista vazia' });
 
  const client = await pool.connect();
  try {
    await client.query("begin");

    const v = await client.query(
      `select v.voyage_id, s.account_id
         from voyages v
         join ships s on s.ship_id = v.ship_id
        where v.voyage_id = $1`,
      [voyageId]
    );
    if (v.rowCount === 0) {
      await client.query("rollback");
      return res.status(404).json({ error: "Viagem inexistente" });
    }
    const accountId = v.rows[0].account_id;

    for (const it of items) {
      const cid = String(it.container_id || it.containerId || "").trim();
      if (!cid) {
        await client.query("rollback");
        return res.status(400).json({ error: "container_id obrigatório" });
      }

      const c = await client.query(
        `select id from containers where account_id=$1 and id=$2`,
        [accountId, cid]
      );
      if (c.rowCount === 0) {
        await client.query("rollback");
        return res.status(400).json({ error: `Contêiner ${cid} não pertence à conta ou não existe` });
      }

      await client.query(
        `insert into voyage_containers(voyage_id, container_id, loaded_at)
         values ($1,$2,$3)
         on conflict (voyage_id,container_id)
         do update set loaded_at = excluded.loaded_at`,
        [voyageId, cid, it.loaded_at ? new Date(it.loaded_at).toISOString() : new Date().toISOString()]
      );
    }

    await client.query("commit");
    return res.status(201).json({ ok: true, count: items.length });
  } catch (e) {
    await client.query("rollback");
    console.error("[voyages.addContainers] error:", e);
    return res.status(400).json({ error: "Bad Request" });
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
