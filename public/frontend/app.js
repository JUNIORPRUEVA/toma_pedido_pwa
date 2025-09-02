// Si el frontend se sirve del mismo host, usa ruta relativa:
const API_URL = '/api/productos';

const lista = document.getElementById('lista');
const addBtn = document.getElementById('addBtn');
const productoInput = document.getElementById('productoInput');
const cantidadInput = document.getElementById('cantidadInput');
const imagenInput = document.getElementById('imagenInput');
const videoInput = document.getElementById('videoInput');

let productos = [];

// ======== Previews ========
if (imagenInput) {
  imagenInput.addEventListener('change', () => {
    const file = imagenInput.files[0];
    const preview = document.getElementById('imgPreview');
    preview.innerHTML = file ? `<img src="${URL.createObjectURL(file)}">` : '';
  });
}

if (videoInput) {
  videoInput.addEventListener('change', () => {
    const file = videoInput.files[0];
    const preview = document.getElementById('vidPreview');
    preview.innerHTML = file ? `<video src="${URL.createObjectURL(file)}" controls></video>` : '';
  });
}

// ======== Inicio ========
window.addEventListener('DOMContentLoaded', cargarLista);

addBtn.onclick = async function () {
  const nombre = productoInput.value.trim();
  const cantidad = cantidadInput.value;
  const imagen = imagenInput.files[0];
  const video = videoInput.files[0];

  if (!nombre || !cantidad) return;

  const formData = new FormData();
  formData.append('producto', nombre);
  formData.append('cantidad', cantidad);
  if (imagen) formData.append('imagen', imagen);
  if (video) formData.append('video', video);

  try {
    const res = await fetch('/api/productos', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Error al guardar');
    const nuevo = await res.json();
    // Actualiza la lista con el nuevo producto
    productos.push(nuevo);
    renderLista();
    productoInput.value = '';
    cantidadInput.value = '';
    imagenInput.value = '';
    videoInput.value = '';
    document.getElementById('imgPreview').innerHTML = '';
    document.getElementById('vidPreview').innerHTML = '';
  } catch (err) {
    alert('No se pudo guardar el producto');
  }
};

// ======== CRUD ========
async function cargarLista() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    mostrarLista(data);
  } catch (err) {
    console.error('Error al cargar lista:', err);
    lista.innerHTML = '<p>Error al cargar la lista</p>';
  }
}

function mostrarLista(items) {
  lista.innerHTML = '';
  if (!items || items.length === 0) {
    lista.innerHTML = '<p>No hay productos</p>';
    return;
  }

  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'item';

    const span = document.createElement('span');
    span.textContent = `${item.producto} (Cantidad: ${item.cantidad})`;
    div.appendChild(span);

    // medios
    const media = document.createElement('div');
    media.className = 'item-media';
    if (item.imagen_url) {
      const img = document.createElement('img');
      img.src = item.imagen_url;
      img.alt = 'img';
      img.style.maxWidth = '120px';
      img.style.maxHeight = '120px';
      img.style.borderRadius = '8px';
      media.appendChild(img);
    }
    if (item.video_url) {
      const vid = document.createElement('video');
      vid.src = item.video_url;
      vid.controls = true;
      vid.style.maxWidth = '200px';
      vid.style.maxHeight = '140px';
      vid.style.borderRadius = '8px';
      media.appendChild(vid);
    }
    if (media.children.length) div.appendChild(media);

    // botones
    const editButton = document.createElement('button');
    editButton.textContent = 'Editar';
    editButton.className = 'edit';
    editButton.addEventListener('click', () => prepararEdicion(item));
    div.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Eliminar';
    deleteButton.className = 'delete';
    deleteButton.addEventListener('click', () => eliminarProducto(item.id));
    div.appendChild(deleteButton);

    lista.appendChild(div);
  });
}

function prepararEdicion(item) {
  editId = item.id;
  productoInput.value = item.producto;
  cantidadInput.value = item.cantidad;
  addBtn.textContent = 'Actualizar';

  // limpiar inputs de archivo (por seguridad no se pueden pre-cargar)
  if (imagenInput) {
    imagenInput.value = '';
    document.getElementById('imgPreview').innerHTML = '';
  }
  if (videoInput) {
    videoInput.value = '';
    document.getElementById('vidPreview').innerHTML = '';
  }
}

async function crearProducto(producto, cantidad) {
  try {
    const fd = new FormData();
    fd.append('producto', producto);
    fd.append('cantidad', String(cantidad));
    if (imagenInput?.files?.[0]) fd.append('imagen', imagenInput.files[0]);
    if (videoInput?.files?.[0])  fd.append('video',  videoInput.files[0]);

    const response = await fetch(API_URL, { method: 'POST', body: fd });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear producto');
    }

    // Reset
    productoInput.value = '';
    cantidadInput.value = '';
    if (imagenInput) imagenInput.value = '';
    if (videoInput)  videoInput.value  = '';
    document.getElementById('imgPreview').innerHTML = '';
    document.getElementById('vidPreview').innerHTML = '';

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
    // solo se envían archivos si el usuario seleccionó nuevos
    if (imagenInput?.files?.[0]) fd.append('imagen', imagenInput.files[0]);
    if (videoInput?.files?.[0])  fd.append('video',  videoInput.files[0]);

    const response = await fetch(`${API_URL}/${id}`, { method: 'PUT', body: fd });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar producto');
    }

    editId = null;
    addBtn.textContent = 'Añadir';
    productoInput.value = '';
    cantidadInput.value = '';
    if (imagenInput) imagenInput.value = '';
    if (videoInput)  videoInput.value  = '';
    document.getElementById('imgPreview').innerHTML = '';
    document.getElementById('vidPreview').innerHTML = '';

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
