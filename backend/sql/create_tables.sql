-- Script para crear la tabla principal de la aplicación
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  producto VARCHAR(255) NOT NULL,
  cantidad INTEGER NOT NULL
);
