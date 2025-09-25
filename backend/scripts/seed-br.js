// backend/scripts/seed-br.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
});

async function createSafetyObjects() {
  const client = await pool.connect();
  try {
    // Fora de transação: se falhar, não “aborta” o resto.
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_voyages_code_idx ON voyages (voyage_code);
    `);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'latest_container_positions'
        ) THEN
          -- cria um stub inicial para evitar 1a chamada falhar em ambientes vazios
          CREATE VIEW latest_container_positions AS
          SELECT NULL::int AS id, NULL::text AS container_id, NULL::text AS voyage_code,
                 NULL::text AS imo, NULL::double precision AS lat, NULL::double precision AS lon,
                 NULL::numeric AS speed_kn, NOW() AS ts_iso
          WHERE FALSE;
        END IF;
      END$$;
    `);
  } finally {
    client.release();
  }
}

async function upsertShipByIMO(client, { name, imo, flag = "BR" }) {
  const sql = `
    INSERT INTO ships (name, imo, flag)
    VALUES ($1,$2,$3)
    ON CONFLICT (imo) DO UPDATE
      SET name = EXCLUDED.name,
          flag = EXCLUDED.flag
    RETURNING ship_id
  `;
  const r = await client.query(sql, [name, imo, flag]);
  return r.rows[0].ship_id;
}

async function upsertVoyageByCode(client, obj) {
  const {
    ship_id, voyage_code, departure_port, arrival_port,
    origin_lat, origin_lng, dest_lat, dest_lng,
    status = "ACTIVE"
  } = obj;

  const sql = `
    INSERT INTO voyages (ship_id, voyage_code, departure_port, arrival_port,
                         origin_lat, origin_lng, dest_lat, dest_lng, status, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
    ON CONFLICT (voyage_code) DO UPDATE
      SET ship_id = EXCLUDED.ship_id,
          departure_port = EXCLUDED.departure_port,
          arrival_port = EXCLUDED.arrival_port,
          origin_lat = EXCLUDED.origin_lat,
          origin_lng = EXCLUDED.origin_lng,
          dest_lat = EXCLUDED.dest_lat,
          dest_lng = EXCLUDED.dest_lng,
          status = EXCLUDED.status
    RETURNING voyage_id
  `;
  const r = await client.query(sql, [
    ship_id, voyage_code, departure_port, arrival_port,
    origin_lat, origin_lng, dest_lat, dest_lng, status
  ]);
  return r.rows[0].voyage_id;
}

async function insertMovement(client, m) {
  const sql = `
    INSERT INTO container_movements
      (container_id, event_type, location, ts_iso, created_at,
       lat, lng, voyage_id, battery_percent, temp_c, source)
    VALUES
      ($1,$2,$3,$4,NOW(),$5,$6,$7,$8,$9,$10)
    ON CONFLICT DO NOTHING
  `;
  const args = [
    m.container_id,
    m.event_type || "MOVE",
    m.location || null,
    m.ts_iso,
    m.lat,
    m.lng,
    m.voyage_id || null,
    m.battery_percent ?? null,
    m.temp_c ?? null,
    m.source || "seed-br",
  ];
  await client.query(sql, args);
}

async function recreateLatestPositionsView(client) {
  await client.query(`
    DROP VIEW IF EXISTS latest_container_positions;
    CREATE VIEW latest_container_positions AS
    SELECT DISTINCT ON (cm.container_id)
      cm.id,
      cm.container_id,
      v.voyage_code,
      s.imo,
      cm.lat AS lat,
      cm.lng AS lon,
      NULL::numeric AS speed_kn,
      COALESCE(cm.ts_iso, cm.created_at) AS ts_iso
    FROM container_movements cm
    LEFT JOIN voyages v ON v.voyage_id = cm.voyage_id
    LEFT JOIN ships   s ON s.ship_id   = v.ship_id
    WHERE cm.lat IS NOT NULL AND cm.lng IS NOT NULL
    ORDER BY cm.container_id, COALESCE(cm.ts_iso, cm.created_at) DESC;
  `);
}

async function main() {
  await createSafetyObjects();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const shipIdA = await upsertShipByIMO(client, { name: "MV Atlântico", imo: "IMO 9745378", flag: "BR" });
    const shipIdB = await upsertShipByIMO(client, { name: "MV Guanabara", imo: "IMO 9654321", flag: "BR" });

    const voyA = await upsertVoyageByCode(client, {
      ship_id: shipIdA,
      voyage_code: "VOY-2025-09A",
      departure_port: "BRSSZ",
      arrival_port: "BRRIO",
      origin_lat: -27.0, origin_lng: -48.6,
      dest_lat: -22.9,  dest_lng: -43.2,
      status: "ACTIVE",
    });

    const voyB = await upsertVoyageByCode(client, {
      ship_id: shipIdB,
      voyage_code: "VOY-2025-09B",
      departure_port: "BRRIO",
      arrival_port: "BRSSA",
      origin_lat: -22.9,   origin_lng: -43.2,
      dest_lat:  -12.97,   dest_lng:  -38.51,
      status: "ACTIVE",
    });

    const now = new Date();
    const tMinus = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

    await insertMovement(client, { container_id: "CONT-123", ts_iso: tMinus(48), lat: -27.05, lng: -48.63, voyage_id: voyA, battery_percent: 88, temp_c: 6.5 });
    await insertMovement(client, { container_id: "CONT-123", ts_iso: tMinus(24), lat: -25.5,  lng: -46.3,  voyage_id: voyA, battery_percent: 79, temp_c: 7.2 });
    await insertMovement(client, { container_id: "CONT-123", ts_iso: tMinus(4),  lat: -23.0,  lng: -44.5,  voyage_id: voyA, battery_percent: 72, temp_c: 8.0 });

    await insertMovement(client, { container_id: "CONT-456", ts_iso: tMinus(30), lat: -22.95, lng: -43.2,  voyage_id: voyA, battery_percent: 90, temp_c: 5.0 });
    await insertMovement(client, { container_id: "CONT-456", ts_iso: tMinus(8),  lat: -22.5,  lng: -42.0,  voyage_id: voyA, battery_percent: 84, temp_c: 5.5 });

    await insertMovement(client, { container_id: "CONT-789", ts_iso: tMinus(36), lat: -22.9,  lng: -43.2,  voyage_id: voyB, battery_percent: 91, temp_c: 4.0 });
    await insertMovement(client, { container_id: "CONT-789", ts_iso: tMinus(12), lat: -15.0,  lng: -38.9,  voyage_id: voyB, battery_percent: 83, temp_c: 4.8 });

    await recreateLatestPositionsView(client);

    await client.query("COMMIT");
    console.log("Seed BR concluído.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
