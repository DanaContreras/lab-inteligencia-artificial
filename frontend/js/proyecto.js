// Gestion de categorias

const lista          = document.getElementById('lista-categorias');
const plantilla      = document.getElementById('tpl-categoria');
const btnAgregar     = document.getElementById('agregar-categoria');

const MIN_CATEGORIAS = 2;
let contador = 0;


// Clona la plantilla y agrega una categoría al final de la lista.
function crearCategoria(nombre) {
  contador += 1;

  const tarjeta = plantilla.content.firstElementChild.cloneNode(true);

  tarjeta.querySelector('[data-nombre]').value = nombre ?? `Categoría ${contador}`;

  tarjeta.querySelector('[data-eliminar]').addEventListener('click', () => {
    tarjeta.remove();
    actualizarBotonesEliminar();
  });

  tarjeta.querySelector('[data-agregar-muestra]').addEventListener('click', () => {
    abrirModal(tarjeta);
  });

  lista.append(tarjeta);
  actualizarBotonesEliminar();
  return tarjeta;
}


/**
 * Habilita o deshabilita los botones de eliminar según cuántas
 * categorías queden.
 */
function actualizarBotonesEliminar() {
  const puedeEliminar = lista.children.length > MIN_CATEGORIAS;

  for (const tarjeta of lista.children) {
    const btn = tarjeta.querySelector('[data-eliminar]');
    btn.disabled = !puedeEliminar;
    btn.classList.toggle('invisible', !puedeEliminar);
  }
}


// Agregar
btnAgregar.addEventListener('click', () => {
  const tarjeta = crearCategoria();
  const campo = tarjeta.querySelector('[data-nombre]');
  campo.focus();
  campo.select();

  tarjeta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});


// Nombres
lista.addEventListener('blur', (event) => {
  const campo = event.target.closest('[data-nombre]');
  if (!campo) return;

  const limpio = campo.value.trim();
  campo.value = limpio || `Categoría ${lista.children.length}`;
}, true);

lista.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.closest('[data-nombre]')) {
    event.preventDefault();
    event.target.blur();
  }
});


// Modal de nueva muestra
const modal = document.getElementById('modal-muestra');

// Categoría desde la que se abrió el modal: es a la que va a ir el dibujo
// o la foto que se elija.
let categoriaActiva = null;

function abrirModal(tarjeta) {
  categoriaActiva = tarjeta;
  modal.showModal();
}

// showModal() pone el fondo oscuro dentro del propio <dialog>, así que un
// clic ahí llega con el <dialog> como target y no con su contenido.
modal.addEventListener('click', (event) => {
  if (event.target === modal) modal.close();
});

modal.addEventListener('close', () => {
  categoriaActiva = null;
});

for (const boton of modal.querySelectorAll('[data-tipo]')) {
  boton.addEventListener('click', () => {
    // TODO(paso siguiente): abrir el canvas de dibujo o la cámara y sumar
    // la muestra a categoriaActiva.
    modal.close();
  });
}


// Estado inicial: dos categorias
crearCategoria();
crearCategoria();
