require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'n8n_user',
  host: process.env.DB_HOST || 'postgresql_postgres-n8n',
  database: process.env.DB_NAME || 'lista_compras',
  password: process.env.DB_PASSWORD || 'Ayleen10.yahaira',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

module.exports = { pool };
