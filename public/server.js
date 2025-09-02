const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { pool } = require('./db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// ====== Prep carpeta de uploads y servirla como estático ======
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Configuración Multer (guardar en /uploads)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, `${unique}${ext}`);
  }
});
// (Opcional) filtros y límites
const fileFilter = (_req, file, cb) => {
  const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
  cb(ok ? null : new Error('Solo imágenes o videos'), ok);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos del frontend
const frontendPath = path.resolve(__dirname, 'frontend');
console.log('FrontendPath =>', frontendPath, 'exists:', fs.existsSync(frontendPath));
app.use(express.static(frontendPath));

// ======================= RUTAS API =======================

// Ruta de salud
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mensaje: 'API de toma de pedidos funcionando' });
});

// Obtener todos los productos
app.get('/api/productos', async (_req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error interno al obtener productos' });
  }
});

// Crear un nuevo producto (con imagen y/o video)
app.post(
  '/api/productos',
  upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { producto } = req.body;
      const cantidad = Number(req.body.cantidad);
      if (!producto || !Number.isInteger(cantidad)) {
        return res.status(400).json({ error: 'producto (string) y cantidad (int) son requeridos' });
      }

      const imagenFile = req.files?.imagen?.[0];
      const videoFile = req.files?.video?.[0];

      const imagen = imagenFile ? `/uploads/${imagenFile.filename}` : null;
      const video = videoFile ? `/uploads/${videoFile.filename}` : null;

      const r = await pool.query(
        'INSERT INTO productos (producto, cantidad, imagen, video) VALUES ($1, $2, $3, $4) RETURNING *',
        [producto, cantidad, imagen, video]
      );
      res.status(201).json(r.rows[0]);
    } catch (err) {
      console.error('Error al crear producto:', err);
      res.status(500).json({ error: 'Error interno al crear producto' });
    }
  }
);

// Actualizar producto (puede reemplazar imagen/video)
app.put(
  '/api/productos/:id',
  upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'video', maxCount: 1 }]),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });

      const actual = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
      if (actual.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

      const prev = actual.rows[0];

      const producto = req.body.producto ?? prev.producto;
      const cantidad = (req.body.cantidad !== undefined) ? Number(req.body.cantidad) : prev.cantidad;

      const imagenFile = req.files?.imagen?.[0];
      const videoFile = req.files?.video?.[0];

      const imagen = imagenFile ? `/uploads/${imagenFile.filename}` : prev.imagen;
      const video = videoFile ? `/uploads/${videoFile.filename}` : prev.video;

      const r = await pool.query(
        'UPDATE productos SET producto=$1, cantidad=$2, imagen=$3, video=$4 WHERE id=$5 RETURNING *',
        [producto, cantidad, imagen, video, id]
      );
      res.json(r.rows[0]);
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      res.status(500).json({ error: 'Error interno al actualizar producto' });
    }
  }
);

// Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });

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
app.get('*', (_req, res) => {
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
