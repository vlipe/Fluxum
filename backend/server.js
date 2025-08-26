
const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { logger, requestId, httpLogger, metricsRoute } = require('./utils/observability');

dotenv.config();

const { pool } = require('./database/db');


const containerEventsRoutes = require('./routes/containerEvents.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();


app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());


app.use(requestId());
app.use(httpLogger());


const limiter = rateLimit({
  windowMs: 60_000,
  max: 300
});

const speed = slowDown({
  windowMs: 60_000,
  delayAfter: 200,
  delayMs: () => 5,          
  validate: { delayMs: false }
});

app.use(limiter);
app.use(speed);


metricsRoute(app);


app.get('/health', (_req, res) => res.json({ ok: true }));


app.use('/api', containerEventsRoutes);
app.use('/api', statsRoutes);


app.use((req, res) => res.status(404).json({ error: 'Not Found' }));


app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});


const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`API on http://localhost:${PORT}`);
});


server.setTimeout(30_000);

async function shutdown() {
  logger.info('Graceful shutdown...');
  server.close(async () => {
    try { await pool.end(); } finally { process.exit(0); }
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
