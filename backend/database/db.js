// database/db.js (CommonJS)
const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon usa TLS
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
