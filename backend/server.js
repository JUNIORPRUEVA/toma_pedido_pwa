const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); // (podrías usar express.json(), pero así está OK)
const { pool } = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Servir frontend estático
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Healthcheck rápido (útil para probar desde el navegador)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// API
app.get('/api', (req, res) => {
  res.json({ mensaje: 'API de toma de pedidos funcionando' });
});

app.get('/api/productos', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(r.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error interno al obtener productos' });
  }
});

app.post('/api/productos', async (req, res) => {
  const { producto, cantidad } = req.body;
  if (!producto || typeof cantidad !== 'number') {
    return res.status(400).json({ error: 'Datos inválidos. Se requiere producto (string) y cantidad (number).' });
  }
  try {
    const r = await pool.query(
      'INSERT INTO productos (producto, cantidad) VALUES ($1, $2) RETURNING *',
      [producto, cantidad]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ error: 'Error interno al crear producto' });
  }
});

app.put('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { producto, cantidad } = req.body;
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const actual = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (actual.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    const prev = actual.rows[0];
    const nuevoProducto = producto ?? prev.producto;
    const nuevaCantidad = typeof cantidad === 'number' ? cantidad : prev.cantidad;

    const r = await pool.query(
      'UPDATE productos SET producto = $1, cantidad = $2 WHERE id = $3 RETURNING *',
      [nuevoProducto, nuevaCantidad, id]
    );
    res.json(r.rows[0]);
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: 'Error interno al actualizar producto' });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const r = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error interno al eliminar producto' });
  }
});

// Catch-all: sirve el index del frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Iniciar el servidor (una sola vez)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
