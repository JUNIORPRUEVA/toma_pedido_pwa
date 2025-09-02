// URL base del backend. Si el frontend se sirve desde el mismo dominio y puerto,
// puede usarse una ruta relativa. Para desarrollo local con puertos diferentes,
// cambia API_URL a "http://localhost:3000/api/productos"
const API_URL = '/api/productos';

const productoInput = document.getElementById('productoInput');
const cantidadInput = document.getElementById('cantidadInput');
const addBtn = document.getElementById('addBtn');
const listaDiv = document.getElementById('lista');

// Variable para saber si estamos editando. Si null, se creará un nuevo producto.
let editId = null;

// Cargar la lista al iniciar la página
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
  if (items.length === 0) {
    listaDiv.innerHTML = '<p>No hay productos</p>';
    return;
  }
  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'item';
    const span = document.createElement('span');
    span.textContent = `${item.producto} (Cantidad: ${item.cantidad})`;
    div.appendChild(span);
    const editButton = document.createElement('button');
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => {
      prepararEdicion(item);
    });
    div.appendChild(editButton);
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Eliminar';
    deleteButton.className = 'delete';
    deleteButton.addEventListener('click', () => {
      eliminarProducto(item.id);
    });
    div.appendChild(deleteButton);
    listaDiv.appendChild(div);
  });
}

function prepararEdicion(item) {
  editId = item.id;
  productoInput.value = item.producto;
  cantidadInput.value = item.cantidad;
  addBtn.textContent = 'Actualizar';
}

async function crearProducto(producto, cantidad) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ producto, cantidad }),
    });
    if (!response.ok) {
      throw new Error('Error al crear producto');
    }
    // Limpiar campos
    productoInput.value = '';
    cantidadInput.value = '';
    cargarLista();
  } catch (err) {
    console.error(err);
    alert('No se pudo crear el producto');
  }
}

async function actualizarProducto(id, producto, cantidad) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ producto, cantidad }),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar producto');
    }
    // Restablecer edición
    editId = null;
    addBtn.textContent = 'Añadir';
    productoInput.value = '';
    cantidadInput.value = '';
    cargarLista();
  } catch (err) {
    console.error(err);
    alert('No se pudo actualizar el producto');
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
    return;
  }
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar producto');
    }
    cargarLista();
  } catch (err) {
    console.error(err);
    alert('No se pudo eliminar el producto');
  }
}
