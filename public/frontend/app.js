// Si el frontend se sirve del mismo host, usa ruta relativa:
const API_URL = '/api/productos';

const productoInput = document.getElementById('productoInput');
const cantidadInput = document.getElementById('cantidadInput');
const addBtn        = document.getElementById('addBtn');
const listaDiv      = document.getElementById('lista');

// Opcionales (si están en el HTML)
const imagenInput = document.getElementById('imagenInput');
const videoInput  = document.getElementById('videoInput');
const imgPreview  = document.getElementById('imgPreview');
const vidPreview  = document.getElementById('vidPreview');

// Estado de edición: si es null se crea, si tiene ID se actualiza
let editId = null;

// ======== Previews rápidos (si existen inputs de archivo) ========
if (imagenInput && imgPreview) {
  imagenInput.addEventListener('change', () => {
    imgPreview.innerHTML = '';
    const f = imagenInput.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = document.createElement('img');
    img.src = url;
    imgPreview.appendChild(img);
  });
}

if (videoInput && vidPreview) {
  videoInput.addEventListener('change', () => {
    vidPreview.innerHTML = '';
    const f = videoInput.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const v = document.createElement('video');
    v.src = url;
    v.controls = true;
    vidPreview.appendChild(v);
  });
}

// ======== Cargar lista al iniciar ========
window.addEventListener('DOMContentLoaded', cargarLista);

addBtn.addEventListener('click', () => {
  const producto = productoInput.value.trim();
  const cantidad = parseInt(cantidadInput.value, 10);

  if (!producto || isNaN(cantidad) || cantidad <= 0) {
    alert('Por favor, introduce un nombre de producto y una cantidad válida');
    return;
  }

  if (editId) {
    actualizarProducto(editId, producto, cantidad);
  } else {
    crearProducto(producto, cantidad);
  }
});

// ======== CRUD ========
async function cargarLista() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    mostrarLista(data);
  } catch (err) {
    console.error('Error al cargar lista:', err);
    listaDiv.innerHTML = '<p>Error al cargar la lista</p>';
  }
}

function mostrarLista(items) {
  listaDiv.innerHTML = '';
  if (!items || items.length === 0) {
    listaDiv.innerHTML = '<p>No hay productos</p>';
    return;
  }

  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'item';

    const title = document.createElement('span');
    title.textContent = `${item.producto} (Cantidad: ${item.cantidad})`;
    div.appendChild(title);

    // Medios (si existen)
    const media = document.createElement('div');
    media.className = 'item-media';
    if (item.imagen) {
      const img = document.createElement('img');
      img.src = item.imagen;
      img.alt = 'img';
      img.style.maxWidth = '120px';
      img.style.maxHeight = '120px';
      img.style.borderRadius = '8px';
      media.appendChild(img);
    }
    if (item.video) {
      const vid = document.createElement('video');
      vid.src = item.video;
      vid.controls = true;
      vid.style.maxWidth = '200px';
      vid.style.maxHeight = '140px';
      vid.style.borderRadius = '8px';
      media.appendChild(vid);
    }
    if (media.children.length) div.appendChild(media);

    // Botones
    const editButton = document.createElement('button');
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => prepararEdicion(item));
    div.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Eliminar';
    deleteButton.className = 'delete';
    deleteButton.addEventListener('click', () => eliminarProducto(item.id));
    div.appendChild(deleteButton);

    listaDiv.appendChild(div);
  });
}

function prepararEdicion(item) {
  editId = item.id;
  productoInput.value = item.producto;
  cantidadInput.value = item.cantidad;

  // No podemos pre-cargar archivos en inputs por seguridad del navegador.
  if (imagenInput) {
    imagenInput.value = '';
    if (imgPreview) imgPreview.innerHTML = '';
  }
  if (videoInput) {
    videoInput.value = '';
    if (vidPreview) vidPreview.innerHTML = '';
  }

  addBtn.textContent = 'Actualizar';
}

async function crearProducto(producto, cantidad) {
  try {
    const fd = new FormData();
    fd.append('producto', producto);
    fd.append('cantidad', String(cantidad));

    if (imagenInput && imagenInput.files && imagenInput.files[0]) {
      fd.append('imagen', imagenInput.files[0]);
    }
    if (videoInput && videoInput.files && videoInput.files[0]) {
      fd.append('video', videoInput.files[0]);
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      body: fd, // NO pongas Content-Type
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear producto');
    }

    // Reset
    productoInput.value = '';
    cantidadInput.value = '';
    if (imagenInput) imagenInput.value = '';
    if (videoInput) videoInput.value = '';
    if (imgPreview) imgPreview.innerHTML = '';
    if (vidPreview) vidPreview.innerHTML = '';

    cargarLista();
  } catch (err) {
    console.error(err);
    alert('No se pudo crear el producto');
  }
}

async function actualizarProducto(id, producto, cantidad) {
  try {
    const fd = new FormData();
    fd.append('producto', producto);
    fd.append('cantidad', String(cantidad));

    // Si el usuario seleccionó nuevos archivos, los enviamos. Si no, el backend mantiene los anteriores.
    if (imagenInput && imagenInput.files && imagenInput.files[0]) {
      fd.append('imagen', imagenInput.files[0]);
    }
    if (videoInput && videoInput.files && videoInput.files[0]) {
      fd.append('video', videoInput.files[0]);
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      body: fd, // NO pongas Content-Type
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar producto');
    }

    // Restablecer edición
    editId = null;
    addBtn.textContent = 'Añadir';
    productoInput.value = '';
    cantidadInput.value = '';
    if (imagenInput) imagenInput.value = '';
    if (videoInput) videoInput.value = '';
    if (imgPreview) imgPreview.innerHTML = '';
    if (vidPreview) vidPreview.innerHTML = '';

    cargarLista();
  } catch (err) {
    console.error(err);
    alert('No se pudo actualizar el producto');
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar producto');
    cargarLista();
  } catch (err) {
    console.error(err);
    alert('No se pudo eliminar el producto');
  }
}
