// Modal de nueva muestra
const modal = document.getElementById('modal-muestra');
const canvas = document.getElementById('lienzo');
const modalDibujo = document.getElementById('modal-dibujo');
const tituloDibujo = document.getElementById('titulo-dibujo');
const modalFoto = document.getElementById('modal-camara');
const tituloFoto = document.getElementById('titulo-foto');

const modalSubida = document.getElementById("modal-subir-imagenes");

// Categoría desde la que se abrió el modal: es a la que va a ir el dibujo
// o la foto que se elija.
let categoriaActiva = null;
let categoriaDestino = null;


function abrirModal(tarjeta) {
  categoriaActiva = tarjeta;
  //console.log('Abriendo modal para:', categoriaActiva);
  modal.showModal();
}

// showModal() pone el fondo oscuro dentro del propio <dialog>, así que un
// clic ahí llega con el <dialog> como target y no con su contenido.
modal.addEventListener('click', (event) => {
  if (event.target === modal) modal.close();
});

for (const boton of modal.querySelectorAll('[data-tipo]')) {
  boton.addEventListener('click', () => {
    const tipo = boton.dataset.tipo;
    const nombreCategoria = categoriaActiva ? categoriaActiva.querySelector('[data-nombre]').value.trim() : 'Sin nombre'

    categoriaDestino = categoriaActiva;
    modal.close();

    if (tipo === 'dibujo') {
      tituloDibujo.textContent = `${nombreCategoria}`;
      modalDibujo.showModal();
      prepararLienzo();
      elegirHerramienta('lapiz');
    } else if (tipo === 'foto') {
      tituloFoto.textContent = `${nombreCategoria}`;
      modalFoto.showModal();
      iniciarCamara();
    } else{
      modalSubida.showModal();
    }
    modal.close();
  });
}



modal.addEventListener('close', () => {
  categoriaActiva = null;
});