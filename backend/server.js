

require('dotenv').config();

console.log('🔧 Variáveis carregadas:');
console.log('  PORT:', process.env.PORT);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅' : '❌');
console.log('  JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? '✅' : '❌');

const express = require("express");
const dns = require("node:dns/promises");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { logger, requestId, httpLogger, metricsRoute } = require("./utils/observability");
const { pool } = require("./database/db");
const path = require('path');
const reportsRoutes = require("./routes/reports.routes");

const v1Transfers = require("./routes/transfers.routes");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const statsRoutes = require("./routes/stats.routes");
const oauthRoutes = require("./routes/oauth.routes");
const containerEventsRoutes = require("./routes/containerEvents.routes");
const v1Ships = require("./routes/ships.routes");
const v1Voyages = require("./routes/voyages.routes");
const v1Containers = require("./routes/container.routes");
const v1Devices = require("./routes/devices.routes");
const v1Telemetry = require("./routes/telemetry.routes");
const v1Alerts = require("./routes/alerts.routes");
const v1Dashboard = require("./routes/dashboard.routes");
const v1GeoContainers = require("./routes/geo.containers.routes");
const voyagesMapRouter = require("./routes/voyages_map.routes");

// Força DNS confiável no Node (alguns ISPs 4G falham em domínios .tech)
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
  console.log("🛰️  DNS override ativo: 1.1.1.1, 8.8.8.8");
} catch (e) {
  console.warn("Não consegui setar DNS override:", e.message);
}

if (!process.env.DATABASE_URL) {
  console.error("❌ Faltando DATABASE_URL no .env");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);

const FRONTEND_URLS = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowlist = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,                   
  allowedHeaders: ["Content-Type","Authorization"],
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
}));


app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(requestId());
app.use(httpLogger());

const limiter = rateLimit({ windowMs: 60_000, max: 300 });
const speed = slowDown({ windowMs: 60_000, delayAfter: 200, delayMs: () => 5, validate: { delayMs: false } });
app.use(limiter);
app.use(speed);

metricsRoute(app);
app.get("/health", (_req, res) => res.json({ ok: true }));

async function waitDns(host, tries=5){
  for (let i=1;i<=tries;i++){
    try { await dns.lookup(host); return true; }
    catch(e){ await new Promise(r=>setTimeout(r, i*1000)); }
  }
  return false;
}

let DB_HOST;
try {
  DB_HOST = new URL(process.env.DATABASE_URL).host;
} catch (e) {
  console.error("DATABASE_URL inválida:", e.message);
  process.exit(1);
}

async function waitDns(host, tries = 5) {
  for (let i = 1; i <= tries; i++) {
    try {
      // resolve4 respeita dns.setServers – melhor p/ teste
      await dns.resolve4(host);
      return true;
    } catch (_e) {
      await new Promise((r) => setTimeout(r, i * 1000));
    }
  }
  return false;
}


async function safeCall(fn, label){
  try { return await fn(); }
  catch(e){
    if (e?.code === "ENOTFOUND") console.warn(label, "DNS falhou; vou tentar de novo depois.");
    else console.error(label, e);
  }
}

async function fetchContainersFC() {
 const { rows } = await pool.query(`
    WITH latest AS (
  SELECT DISTINCT ON (cm.container_id)
    cm.container_id,
    cm.voyage_code,
    cm.voyage_id,
    cm.imo,
    CASE WHEN trim(cm.lat::text) ~ '^-?\d+(\.\d+)?$' THEN cm.lat::float8 ELSE NULL END AS lat,
    CASE WHEN trim(cm.lng::text) ~ '^-?\d+(\.\d+)?$' THEN cm.lng::float8 ELSE NULL END AS lng,
    COALESCE(
      CASE WHEN cm.ts_iso IS NOT NULL AND trim(cm.ts_iso::text) ~ '^\d{4}-\d{2}-\d{2}'
           THEN cm.ts_iso::timestamptz END,
      cm.created_at
    ) AS ts_iso
  FROM container_movements cm
  WHERE cm.lat IS NOT NULL AND cm.lng IS NOT NULL
  ORDER BY cm.container_id,
           COALESCE(
             CASE WHEN cm.ts_iso IS NOT NULL AND trim(cm.ts_iso::text) ~ '^\d{4}-\d{2}-\d{2}'
                  THEN cm.ts_iso::timestamptz END,
             cm.created_at
           ) DESC
)
SELECT l.*
  FROM latest l
  LEFT JOIN voyages v ON v.voyage_id = l.voyage_id
 WHERE l.lat IS NOT NULL AND l.lng IS NOT NULL
   AND (v.voyage_id IS NULL OR v.status NOT IN ('COMPLETED','ARRIVED'))
 ORDER BY l.ts_iso DESC
 LIMIT 5000;
  `);

  return {
    type: "FeatureCollection",
    features: rows.map(r => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
      properties: r
    }))
  };
}


async function fetchShipsFC() {
  const { rows } = await pool.query(`
    WITH latest AS (
  SELECT DISTINCT ON (cm.container_id)
    cm.container_id,
    cm.voyage_code,
    CASE WHEN trim(cm.lat::text) ~ '^-?\d+(\.\d+)?$' THEN cm.lat::float8 ELSE NULL END AS lat,
    CASE WHEN trim(cm.lng::text) ~ '^-?\d+(\.\d+)?$' THEN cm.lng::float8 ELSE NULL END AS lng,
    COALESCE(
      CASE WHEN cm.ts_iso IS NOT NULL AND trim(cm.ts_iso::text) ~ '^\d{4}-\d{2}-\d{2}'
           THEN cm.ts_iso::timestamptz END,
      cm.created_at
    ) AS ts_iso
  FROM container_movements cm
  WHERE cm.voyage_code IS NOT NULL
  ORDER BY cm.container_id, ts_iso DESC
),
agg AS (
  SELECT
    voyage_code,
    AVG(lat)::float8 AS lat,
    AVG(lng)::float8 AS lng,
    MAX(ts_iso)      AS ts_iso,
    COUNT(*)::int    AS containers_onboard
  FROM latest
  WHERE lat IS NOT NULL AND lng IS NOT NULL
  GROUP BY voyage_code
)
SELECT a.*, v.voyage_id, v.status, s.imo, s.name
      FROM agg a
      JOIN voyages v ON v.voyage_code = a.voyage_code
      JOIN ships   s ON s.ship_id = v.ship_id
     WHERE v.status NOT IN ('COMPLETED','ARRIVED')
     ORDER BY a.ts_iso DESC;
  `);

  return {
    type: "FeatureCollection",
    features: rows.map(r => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
      properties: {
        ship_key: r.voyage_code,
        voyage_id: r.voyage_id,
        voyage_code: r.voyage_code,
        status: r.status,
        imo: r.imo,
        name: r.name,
        containers_onboard: r.containers_onboard,
        ts_iso: r.ts_iso
      }
    }))
  };
}


app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes);
app.use("/api/users", usersRoutes);
app.use("/api", statsRoutes);
app.use("/api", containerEventsRoutes);

app.use("/api/v1", v1Ships);
app.use("/api/v1", v1Transfers);
app.use("/api/v1", v1Voyages);
app.use("/api/v1", v1Containers);
app.use("/api/v1", v1Devices);
app.use("/api/v1", v1Telemetry);
app.use("/api/v1", v1Alerts);
app.use("/api/v1", v1Dashboard);
app.use("/api/v1", v1GeoContainers);
app.use("/api/v1", require("./routes/maritime.routes"));
app.use("/api/v1", voyagesMapRouter);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(reportsRoutes);
app.use('/api/v1', require('./routes/live.routes'));





app.get("/api/health", (_req, res) => res.json({ ok: true }));

const { Router } = require("express");
const v1Alias = Router();
v1Alias.use("/alerts", v1Alerts);
v1Alias.use("/dashboard", v1Dashboard);
app.use("/api", v1Alias);



// server.js

async function pruneOldAlerts(days) {
  const sql = `delete from alerts where created_at < now() - ($1 || ' days')::interval returning id`;
  try {
    const r = await pool.query(sql, [String(days)]);
    console.log(`[pruneOldAlerts] removed=${r.rowCount} older_than_days=${days}`);
  } catch (e) {
    console.error("pruneOldAlerts error:", e);
  }
}

const PRUNE_DAYS = Number(process.env.ALERTS_PRUNE_DAYS || 0); 
if (PRUNE_DAYS > 0) {
  
  setInterval(() => pruneOldAlerts(PRUNE_DAYS), 60 * 60 * 1000);
  pruneOldAlerts(PRUNE_DAYS); 
} else {
  console.log("[pruneOldAlerts] disabled (ALERTS_PRUNE_DAYS=0)");
}



app.use((req, res) => res.status(404).json({ error: "Not Found" }));
app.use((err, _req, res, _next) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`API on http://localhost:${PORT}`);
});
server.setTimeout(30_000);

const WebSocket = require("ws");
const wss = new WebSocket.Server({ server, path: "/ws/positions" });

wss.on("connection", async (ws, req) => {
  console.log("WS client connected:", req.url);
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  try {
    const [ships, containers] = await Promise.all([
      safeCall(fetchShipsFC, "ws ships first"),
      safeCall(fetchContainersFC, "ws cont first"),
    ]);
    if (ships) ws.send(JSON.stringify({ type: "ships", data: ships }));
    if (containers) ws.send(JSON.stringify({ type: "containers", data: containers }));
  } catch (e) {
    console.error("ws first send error:", e);
  }
});

wss.on("error", (e) => {
  console.error("WSS error:", e);
});

setInterval(async () => {
  // Só tenta se o DNS estiver resolvendo o host do Neon (rápido: 2 tentativas)
  const dnsOk = await waitDns(DB_HOST, 2);
  if (!dnsOk) {
    console.warn("tick: DNS ainda indisponível para", DB_HOST);
    return;
  }

  const ships = await safeCall(fetchShipsFC, "ws ships tick");
  const containers = await safeCall(fetchContainersFC, "ws cont tick");

  wss.clients.forEach((ws) => {
    if (ws.readyState !== ws.OPEN) return;
    if (ships) ws.send(JSON.stringify({ type: "ships", data: ships }));
    if (containers) ws.send(JSON.stringify({ type: "containers", data: containers }));
  });
}, 5000);

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {}
  });
}, 30000);

async function shutdown() {
  logger.info("Graceful shutdown...");
  server.close(async () => {
    try {
      await pool.end();
    } finally {
      process.exit(0);
    }
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
