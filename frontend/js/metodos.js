// Métodos de clasificación compartidos por entrenar y predecir

const NOMBRES_METODOS = {
  red: 'Red neuronal',
  arbol: 'Árbol de decisión',
  svm: 'SVM',
  knn: 'KNN',
};

async function pedirProyecto(ruta, datos) {
  const id = sessionStorage.getItem('neurofai:proyectoId');
  if (!id) throw new Error('No hay un proyecto abierto.');

  const opciones = datos && {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  };

  const respuesta = await fetch(`/api/proyectos/${encodeURIComponent(id)}${ruta}`, opciones);
  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo conectar con el servidor.');
  return cuerpo;
}

async function cargarModelos() {
  return (await pedirProyecto('/modelos')).modelos;
}

function crearElemento(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function puntosEspera() {
  const puntos = crearElemento('span', 'estado-puntos');
  puntos.setAttribute('aria-hidden', 'true');
  return puntos;
}
