// server.js (CommonJS)
const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const pino = require('pino');
const pinoHttp = require('pino-http');
const client = require('prom-client');
const { v4: uuid } = require('uuid');

// *** AQUI trocamos para sua pasta database/ ***
const { pool, query } = require('./database/db');

// Suas rotas IoT existentes
const containerRoutes = require('./routes/containerRoutes');

// Nossas rotas novas (colocaremos em ./routes/)
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy/IP real
app.set('trust proxy', 1);

// Segurança básica
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
const origins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: origins.length ? origins : false,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PATCH','DELETE','OPTIONS']
}));

// Body & cookies
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

// Logs e request-id
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use((req, _res, next) => { req.id = req.headers['x-request-id'] || uuid(); next(); });
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id || uuid(),
  customProps: (req) => ({ reqId: req.id })
}));

// Métricas
const register = new client.Registry();
client.collectDefaultMetrics({ register });
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Rate limiting global + slow down (compatível c/ express-slow-down v3)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });

const speed = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,      // após 100 reqs na janela, aplica atraso
  delayMs: () => 250,   // v3: função que retorna o atraso fixo (250ms)
  // validate: { delayMs: false }, // (opcional) suprime validações/avisos
});



app.use(limiter);
app.use(speed);


// Rate específico para login
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: 'Muitas tentativas, tente depois.' });
app.use('/auth/login', authLimiter);

// Health & readiness
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/ready', async (_req, res) => {
  try { await query('SELECT 1'); res.json({ ready: true }); }
  catch { res.status(500).json({ ready: false }); }
});

// Suas rotas IoT
app.use('/api/containers', containerRoutes);

// Nossas rotas novas
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// Erro global
app.use((err, req, res, _next) => {
  logger.error({ err, reqId: req.id }, 'Unhandled error');
  res.status(500).json({ error: 'Erro interno', reqId: req.id });
});

// Subir servidor
const server = app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
});

// Timeouts + graceful shutdown
server.setTimeout(30_000);
async function shutdown() {
  logger.info('Encerrando com graceful shutdown...');
  server.close(async () => {
    try { await pool.end(); } finally { process.exit(0); }
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
