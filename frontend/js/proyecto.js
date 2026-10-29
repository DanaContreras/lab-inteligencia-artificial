// Gestion de categorias

const lista          = document.getElementById('lista-categorias');
const plantilla      = document.getElementById('tpl-categoria');
const btnAgregar     = document.getElementById('agregar-categoria');
const btnSiguiente   = document.getElementById('siguiente-paso');

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
    actualizarSiguiente();
  });

  tarjeta.querySelector('[data-agregar-muestra]').addEventListener('click', () => {
    abrirModal(tarjeta);
  });

  lista.append(tarjeta);
  actualizarBotonesEliminar();
  actualizarSiguiente();
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

// Muestras
function agregarMuestra(tarjeta, imagen) {
  const miniatura = document.createElement('img');
  miniatura.src = imagen;
  miniatura.alt = '';
  miniatura.className = 'muestra';
  miniatura.dataset.muestra = '';

  tarjeta.querySelector('[data-agregar-muestra]').before(miniatura);
  actualizarSiguiente();
}

function actualizarSiguiente() {
  const listo = [...lista.children].every((t) => t.querySelector('[data-muestra]'));
  btnSiguiente.disabled = !listo;
  btnSiguiente.title = listo ? 'Entrenar' : 'Agrega al menos un dato en cada categoría';
}


// Paso 2
// btnSiguiente.addEventListener('click', () => {
//   const datos = [...lista.children].map((tarjeta) => ({
//     nombre: tarjeta.querySelector('[data-nombre]').value.trim(),
//     muestras: [...tarjeta.querySelectorAll('[data-muestra]')].map((img) => img.src),
//   }));

//   sessionStorage.setItem('neurofai:datos', JSON.stringify(datos));
//   location.href = './entrenar.html';
// });

// Estado inicial
const guardados = new URLSearchParams(location.search).has('continuar')
  ? JSON.parse(sessionStorage.getItem('neurofai:datos') || '[]')
  : [];

if (guardados.length) {
  for (const { nombre, muestras } of guardados) {
    const tarjeta = crearCategoria(nombre);
    muestras.forEach((imagen) => agregarMuestra(tarjeta, imagen));
  }
} else {
  crearCategoria();
  crearCategoria();
}


//Eliminar muestra

function eliminarMuestra(miniatura) {
  const contenedor = document.createElement('div');
  contenedor.className = 'muestra-contenedor';

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'eliminar-muestra';
  boton.innerHTML = '&times;';
  boton.title = 'Eliminar muestra';
  boton.setAttribute('aria-label', 'Eliminar muestra');

  boton.addEventListener('click', () => {
    contenedor.remove();
    actualizarSiguiente();
  });

  miniatura.before(contenedor);
  contenedor.append(miniatura, boton);
}

document.querySelectorAll('.muestra').forEach(imagen => {
  eliminarMuestra(imagen);
});


async function convertirImagenAPNG(img) {
  if (!img.complete || !img.naturalWidth) {
    await new Promise((resolve, reject) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar una imagen.")),
        { once: true }
      );
    });
  }

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  canvas.getContext("2d").drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}





async function convertirImagenAPNG(img) {
  if (!img.complete || !img.naturalWidth) {
    await new Promise((resolve, reject) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar una imagen.")),
        { once: true }
      );
    });
  }

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d").drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

btnSiguiente.addEventListener("click", async () => {
  btnSiguiente.disabled = true;

  try {
    const idProyecto = sessionStorage.getItem("neurofai:proyectoId");
    if (!idProyecto) throw new Error("No se encontró el proyecto actual.");

    // 1Datos para el servidor (PNG convertidos)
    const datos = [];

    for (const tarjeta of lista.children) {
      const nombre = tarjeta.querySelector("[data-nombre]").value.trim();
      const imagenes = [...tarjeta.querySelectorAll("[data-muestra]")];

      if (!nombre || imagenes.length === 0) {
        throw new Error("Cada categoría debe tener nombre y muestras.");
      }

      const muestras = await Promise.all(imagenes.map(convertirImagenAPNG));
      datos.push({ nombre, muestras });
    }

    //Enviar al servidor y esperar la respuesta
    const respuesta = await fetch(
      `/api/proyectos/${encodeURIComponent(idProyecto)}/entrenar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datos })
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "Falló el entrenamiento.");
    }

    sessionStorage.setItem("neurofai:resultado", JSON.stringify(resultado));

    //Datos para la animación 
    const datosAnimacion = [...lista.children].map((tarjeta) => ({
      nombre: tarjeta.querySelector("[data-nombre]").value.trim(),
      muestras: [...tarjeta.querySelectorAll("[data-muestra]")].map((img) => img.src),
    }));

    try {
      sessionStorage.setItem("neurofai:datos", JSON.stringify(datosAnimacion));
    } catch (e) {
      console.warn("No se pudo guardar neurofai:datos para la animación:", e);
    }

    location.href = "./entrenar.html";

  } catch (error) {
    console.error(error);
    alert(error.message || "No se pudo completar el entrenamiento.");
    btnSiguiente.disabled = false;
  }
});