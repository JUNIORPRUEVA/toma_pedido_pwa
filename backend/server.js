const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { pool } = require('./db');
const path = require('path');

// Creamos una aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para habilitar CORS y parsear JSON
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Ruta para comprobar que la API está en funcionamiento
app.get('/api', (req, res) => {
  res.json({ mensaje: 'API de toma de pedidos funcionando' });
});

/**
 * Obtener todos los productos.
 * Devuelve un arreglo de objetos con las propiedades: id, producto, cantidad.
 */
app.get('/api/productos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error interno al obtener productos' });
  }
});

/**
 * Crear un nuevo producto.
 * Espera un cuerpo JSON con "producto" y "cantidad".
 */
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

/**
 * Actualizar un producto existente.
 * Se debe proporcionar el ID en la ruta y el cuerpo con producto y/o cantidad.
 */
app.put('/api/productos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { producto, cantidad } = req.body;
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    // Obtener el producto actual para mantener valores si no se envían nuevos
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

/**
 * Eliminar un producto por ID.
 */
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

// Cualquier otra ruta (no API) devuelve la aplicación frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
