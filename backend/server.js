require('dotenv').config();

console.log('🔧 Variáveis carregadas:');
console.log('  PORT:', process.env.PORT);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅' : '❌');
console.log('  JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? '✅' : '❌');

const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { logger, requestId, httpLogger, metricsRoute } = require("./utils/observability");
const { pool } = require("./database/db");
const path = require('path');
const reportsRoutes = require("./routes/reports.routes");

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





const app = express();
app.set("trust proxy", 1);

const FRONTEND_URLS = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: (process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"]),
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"], 
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

async function fetchContainersFC() {
  const { rows } = await pool.query(`
   WITH latest AS (
  SELECT DISTINCT ON (cm.container_id)
    cm.container_id,
    cm.voyage_code,
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
SELECT *
FROM latest
WHERE lat IS NOT NULL AND lng IS NOT NULL
ORDER BY ts_iso DESC
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
SELECT * FROM agg
ORDER BY ts_iso DESC;

  `);

  return {
    type: "FeatureCollection",
    features: rows.map(r => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number(r.lng), Number(r.lat)] },
      properties: {
        ship_key: r.voyage_code,
        voyage_code: r.voyage_code,
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

app.get("/api/v1/live/containers", async (_req, res) => {
  res.set("Cache-Control", "no-store");   // ← impede 304
  try {
    const fc = await fetchContainersFC();
    res.status(200).json(fc);
  } catch (e) {
    console.error("containers/live error:", e);
    res.status(500).json({ error: "failed to fetch containers" });
  }
});

app.get("/api/v1/live/ships", async (_req, res) => {
  res.set("Cache-Control", "no-store");   // ← impede 304
  try {
    const fc = await fetchShipsFC();
    res.status(200).json(fc);
  } catch (e) {
    console.error("ships/live error:", e);
    res.status(500).json({ error: "failed to fetch ships" });
  }
});


app.get("/api/health", (_req, res) => res.json({ ok: true }));

const { Router } = require("express");
const v1Alias = Router();
v1Alias.use("/alerts", v1Alerts);
v1Alias.use("/dashboard", v1Dashboard);
app.use("/api", v1Alias);



// server.js

async function pruneOldAlerts(days) {
  const sql = `delete from alerts where created_at < now() - ($1 || '7 days')::interval returning id`;
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
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  try {
    const [ships, containers] = await Promise.all([fetchShipsFC(), fetchContainersFC()]);
    ws.send(JSON.stringify({ type: "ships", data: ships }));
    ws.send(JSON.stringify({ type: "containers", data: containers }));
  } catch (e) {
    console.error("ws first send error:", e);
  }
});

wss.on("error", (e) => {
  console.error("WSS error:", e);
});

setInterval(async () => {
  let ships = null,
    containers = null;
  try {
    ships = await fetchShipsFC();
  } catch (e) {
    console.error("ws ships tick:", e);
  }
  try {
    containers = await fetchContainersFC();
  } catch (e) {
    console.error("ws cont tick:", e);
  }
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
