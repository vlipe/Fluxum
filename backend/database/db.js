// database/db.js
require('dotenv').config();

console.log('[DB] PG_OVER_WEBSOCKETS =', process.env.PG_OVER_WEBSOCKETS);
const USE_WSS = String(process.env.PG_OVER_WEBSOCKETS || 'true').toLowerCase() !== 'false';
console.log('[DB] Driver selecionado =', USE_WSS ? '@neondatabase/serverless (WSS/443)' : 'pg (TCP/5432)');

let Pool, neonConfig;

if (USE_WSS) {
  // Driver WebSocket oficial da Neon (funciona na porta 443)
  ({ Pool, neonConfig } = require('@neondatabase/serverless'));
  try {
    neonConfig.webSocketConstructor = require('ws'); // WebSocket para Node
  } catch {}
  // NÃO defina neonConfig.wsProxy para Neon – o default do driver já funciona.
  // (opcional) para ambientes instáveis, você pode ativar HTTP:
  // neonConfig.poolQueryViaFetch = true;
} else {
  // Fallback TCP padrão (porta 5432)
  ({ Pool } = require('pg'));
}

const connectOpts = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS || '5000', 10),
};

// Em TCP/pg usamos SSL; em WSS não precisa passar 'ssl'
if (!USE_WSS) connectOpts.ssl = { rejectUnauthorized: false };

const pool = new Pool(connectOpts);

// Evite listeners verbosos se usar poolQueryViaFetch
pool.on('connect', () => {
  console.log(`Conectado ao PostgreSQL (${USE_WSS ? 'WebSocket 443' : 'TCP 5432'})`);
});

pool.on('error', (err) => {
  console.error('Erro PostgreSQL:', err.code, err.message);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };