const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { pool } = require('./db');
const path = require('path');
const fs = require('fs');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos del frontend
const frontendPath = path.resolve(__dirname, 'frontend'); // frontend está dentro de backend
console.log('FrontendPath =>', frontendPath, 'exists:', fs.existsSync(frontendPath));

app.use(express.static(frontendPath));

// ======================= RUTAS API =======================

// Ruta de prueba para ver si la API está viva
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'API de toma de pedidos funcionando' });
});

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error interno al obtener productos' });
  }
});

// Crear un nuevo producto
app.post('/api/productos', async (req, res) => {
  const { producto, cantidad } = req.body;
  if (!producto || typeof cantidad !== 'number') {
    return res.status(400).json({ error: 'Datos inválidos. Se requiere producto (string) y cantidad (number).' });
  }
  try {
    const resultado = await pool.query(
      'INSERT INTO productos (producto, cantidad) VALUES ($1, $2) RETURNING *',
      [producto, cantidad]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Error al crear producto:', err);
    res.status(500).json({ error: 'Error interno al crear producto' });
  }
});

// Actualizar producto
app.put('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { producto, cantidad } = req.body;
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    const actual = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (actual.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const prodActual = actual.rows[0];
    const nuevoProducto = producto || prodActual.producto;
    const nuevaCantidad = typeof cantidad === 'number' ? cantidad : prodActual.cantidad;

    const resultado = await pool.query(
      'UPDATE productos SET producto = $1, cantidad = $2 WHERE id = $3 RETURNING *',
      [nuevoProducto, nuevaCantidad, id]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ error: 'Error interno al actualizar producto' });
  }
});

// Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    const resultado = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error interno al eliminar producto' });
  }
});

// ======================= FRONTEND =======================
// Cualquier ruta no-API devuelve index.html del frontend
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('NO ENCONTRADO index.html en:', indexPath);
    res.status(200).send(`Frontend no encontrado en: ${indexPath}`);
  }
});

// ======================= INICIO SERVIDOR =======================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
