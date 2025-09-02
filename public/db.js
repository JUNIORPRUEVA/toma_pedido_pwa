require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'tu_usuario',        // Cambia por tu usuario de PostgreSQL
  host: 'localhost',         // Cambia si tu base está en otro host
  database: 'tu_base',       // Cambia por el nombre de tu base de datos
  password: 'tu_password',   // Cambia por tu contraseña
  port: 5432,                // Puerto por defecto de PostgreSQL
});

module.exports = { pool };
