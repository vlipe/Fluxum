const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { logger, requestId, httpLogger, metricsRoute } = require("./utils/observability");

dotenv.config();

const { pool } = require("./database/db");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const statsRoutes = require("./routes/stats.routes");
const oauthRoutes = require("./routes/oauth.routes");
const containerEventsRoutes = require("./routes/containerEvents.routes");
const v1Ships = require('./routes/ships.routes');
const v1Voyages = require('./routes/voyages.routes');
const v1Containers = require('./routes/container.routes');
const v1Devices = require('./routes/devices.routes');
const v1Telemetry = require('./routes/telemetry.routes');
const v1Alerts = require('./routes/alerts.routes');
const v1Dashboard = require('./routes/dashboard.routes');
const v1GeoContainers = require("./routes/geo.containers.routes");






const app = express();
app.set("trust proxy", 1);

const FRONTEND_URLS = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: FRONTEND_URLS, credentials: true }));
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


app.get("/api/health", (_req, res) => res.json({ ok: true }));


const { Router } = require("express");
const v1Alias = Router();
v1Alias.use("/alerts", v1Alerts);
v1Alias.use("/dashboard", v1Dashboard);
app.use("/api", v1Alias);



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

async function fetchPositionsFC() {
  const { rows } = await pool.query(
    `SELECT container_id, lat, lon, speed_kn, heading_deg, voyage_code, imo, ts_iso
       FROM container_positions
     ORDER BY ts_iso DESC
     LIMIT 2000`
  );
  return {
    type: "FeatureCollection",
    features: rows.map(r => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.lon, r.lat] },
      properties: {
        container_id: r.container_id,
        voyage_code: r.voyage_code,
        imo: r.imo,
        speed_kn: r.speed_kn,
        heading_deg: r.heading_deg,
        ts_iso: r.ts_iso
      }
    }))
  };
}

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });
  fetchPositionsFC().then(fc => { try { ws.send(JSON.stringify({ type: "positions", data: fc })); } catch(e){} });
});

setInterval(async () => {
  const fc = await fetchPositionsFC().catch(() => null);
  if (!fc) return;
  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      try { ws.send(JSON.stringify({ type: "positions", data: fc })); } catch(e){}
    }
  });
}, 5000);

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch(e){}
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
