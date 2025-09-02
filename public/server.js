const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middlewares base
app.use(cors());
app.use(bodyParser.json());

// ---- Subir archivos: carpeta /uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Config storage Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

// Servir archivos subidos
app.use('/uploads', express.static(uploadsDir));

// ---- Frontend estático
const frontendPath = path.resolve(__dirname, 'frontend');
app.use(express.static(frontendPath));

// ---------- RUTAS API ----------
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// LISTAR
app.get('/api/productos', async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// CREAR (con archivos)
// Campos esperados: producto(string), cantidad(number)
// Archivos: imagen (opcional), video (opcional)
app.post(
  '/api/productos',
  upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { producto, cantidad } = req.body;
      const cant = parseInt(cantidad, 10);

      if (!producto || Number.isNaN(cant)) {
        return res
          .status(400)
          .json({ error: 'Se requiere producto y cantidad válidos' });
      }

      const imgFile = req.files?.imagen?.[0];
      const vidFile = req.files?.video?.[0];

      const imagen_url = imgFile ? `/uploads/${imgFile.filename}` : null;
      const video_url = vidFile ? `/uploads/${vidFile.filename}` : null;

      const r = await pool.query(
        `INSERT INTO productos (producto, cantidad, imagen_url, video_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [producto, cant, imagen_url, video_url]
      );

      res.status(201).json(r.rows[0]);
    } catch (e) {
      console.error('Error al crear:', e);
      res.status(500).json({ error: 'Error interno al crear producto' });
    }
  }
);

// ACTUALIZAR (acepta archivos también)
app.put(
  '/api/productos/:id',
  upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const { producto, cantidad } = req.body;
      const cant = cantidad !== undefined ? parseInt(cantidad, 10) : undefined;

      // lee actual
      const a = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
      if (a.rows.length === 0) return res.status(404).json({ error: 'No existe' });

      const current = a.rows[0];

      const imgFile = req.files?.imagen?.[0];
      const vidFile = req.files?.video?.[0];

      const imagen_url = imgFile
        ? `/uploads/${imgFile.filename}`
        : current.imagen_url;
      const video_url = vidFile
        ? `/uploads/${vidFile.filename}`
        : current.video_url;

      const nuevoProducto = producto ?? current.producto;
      const nuevaCantidad =
        typeof cant === 'number' && !Number.isNaN(cant)
          ? cant
          : current.cantidad;

      const r = await pool.query(
        `UPDATE productos
         SET producto=$1, cantidad=$2, imagen_url=$3, video_url=$4
         WHERE id=$5
         RETURNING *`,
        [nuevoProducto, nuevaCantidad, imagen_url, video_url, id]
      );

      res.json(r.rows[0]);
    } catch (e) {
      console.error('Error al actualizar:', e);
      res.status(500).json({ error: 'Error interno al actualizar' });
    }
  }
);

// ELIMINAR
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const r = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'No existe' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Error al eliminar:', e);
    res.status(500).json({ error: 'Error interno al eliminar' });
  }
});

// ---------- FRONTEND fallback ----------
app.get('*', (_req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(200).send('Frontend no encontrado');
});

// ---------- START ----------
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Servidor escuchando en el puerto ${PORT}`)
);
