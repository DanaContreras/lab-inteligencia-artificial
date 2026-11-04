const listaProyectos = document.getElementById('lista-proyectos');
const plantillaProyecto = document.getElementById('tpl-proyecto');
const mensaje = document.getElementById('proyectos-mensaje');
const modalNombre = document.getElementById('modal-nombre');
const campoNombre = document.getElementById('campo-nombre');
const entradaArchivo = document.getElementById('archivo-proyecto');

let alAceptarNombre = null;


async function pedirJSON(url, opciones = {}) {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: { 'Content-Type': 'application/json' },
  });

  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(resultado.error || 'No se pudo completar la operación.');
  }

  return resultado;
}

async function intentar(accion) {
  try {
    await accion();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}


function abrirProyecto({ id, nombre }) {
  sessionStorage.setItem('neurofai:proyectoId', id);
  sessionStorage.setItem('neurofai:proyectoNombre', nombre);
  sessionStorage.removeItem('neurofai:datos');
  sessionStorage.removeItem('neurofai:resultado');
  location.href = './proyecto.html';
}

function pedirNombre(titulo, inicial, alAceptar) {
  document.getElementById('modal-nombre-titulo').textContent = titulo;
  campoNombre.value = inicial;
  alAceptarNombre = alAceptar;
  modalNombre.showModal();
  campoNombre.select();
}

document.getElementById('form-nombre').addEventListener('submit', (event) => {
  const nombre = campoNombre.value.trim();

  if (!nombre) {
    event.preventDefault();
    return;
  }

  intentar(() => alAceptarNombre(nombre));
});

document.getElementById('cancelar-nombre').addEventListener('click', () => {
  modalNombre.close();
});


function crearFila(proyecto) {
  const fila = plantillaProyecto.content.firstElementChild.cloneNode(true);

  fila.querySelector('[data-nombre]').textContent = proyecto.nombre;
  fila.querySelector('[data-abrir]').addEventListener('click', () => abrirProyecto(proyecto));

  fila.querySelector('[data-renombrar]').addEventListener('click', () => {
    pedirNombre('Cambiar nombre', proyecto.nombre, async (nombre) => {
      await pedirJSON(`/api/proyectos/${proyecto.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ nombre }),
      });
      await cargarProyectos();
    });
  });

  fila.querySelector('[data-guardar-equipo]').addEventListener('click', (event) => {
    event.target.closest('details').open = false;
    intentar(() => guardarEnEquipo(proyecto));
  });

  return fila;
}

async function cargarProyectos() {
  const { proyectos } = await pedirJSON('/api/proyectos');

  listaProyectos.replaceChildren(...proyectos.map(crearFila));
  mensaje.textContent = proyectos.length ? '' : 'Todavía no hay proyectos. Crea el primero.';
}


async function guardarEnEquipo({ id }) {
  const { proyecto, datos } = await pedirJSON(`/api/proyectos/${id}`);

  const zip = new JSZip();
  zip.file('proyecto.json', JSON.stringify(proyecto, null, 2));

  for (const { nombre, muestras } of datos) {
    muestras.forEach((muestra, indice) => {
      const archivo = `muestra_${String(indice + 1).padStart(4, '0')}.png`;
      zip.file(`dataset/${nombre}/${archivo}`, muestra.split(',')[1], { base64: true });
    });
  }

  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }));
  enlace.download = `${proyecto.nombre}.zip`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

async function abrirDesdeEquipo(archivo) {
  const zip = await JSZip.loadAsync(archivo).catch(() => {
    throw new Error('El archivo no es un .zip válido.');
  });

  const metadatos = zip.file('proyecto.json');

  if (!metadatos) {
    throw new Error('El archivo no contiene un proyecto de NeuroFAI.');
  }

  const { nombre } = JSON.parse(await metadatos.async('string'));
  const categorias = new Map();

  for (const entrada of zip.file(/^dataset\/[^/]+\/[^/]+\.png$/i)) {
    const [, categoria] = entrada.name.split('/');
    const contenido = await entrada.async('base64');

    if (!categorias.has(categoria)) categorias.set(categoria, []);
    categorias.get(categoria).push(`data:image/png;base64,${contenido}`);
  }

  const datos = [...categorias].map(([nombre, muestras]) => ({ nombre, muestras }));

  await pedirJSON('/api/proyectos/importar', {
    method: 'POST',
    body: JSON.stringify({ nombre, datos }),
  });

  await cargarProyectos();
}


document.getElementById('crear-proyecto').addEventListener('click', () => {
  pedirNombre('Nuevo proyecto', 'Mi proyecto', async (nombre) => {
    const { proyecto } = await pedirJSON('/api/proyectos', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
    });
    abrirProyecto(proyecto);
  });
});

document.getElementById('abrir-equipo').addEventListener('click', (event) => {
  event.target.closest('details').open = false;
  entradaArchivo.click();
});

entradaArchivo.addEventListener('change', () => {
  const [archivo] = entradaArchivo.files;
  entradaArchivo.value = '';

  if (archivo) intentar(() => abrirDesdeEquipo(archivo));
});

document.addEventListener('click', (event) => {
  for (const desplegable of document.querySelectorAll('.desplegable[open]')) {
    if (!desplegable.contains(event.target)) desplegable.open = false;
  }
});

intentar(cargarProyectos);
