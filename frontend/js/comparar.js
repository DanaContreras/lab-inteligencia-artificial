// Comparación de modelos

const comparacion  = document.getElementById('comparacion');
const soloBasico   = document.getElementById('solo-basico');
const metodos      = document.getElementById('metodos');
const detalle      = document.getElementById('detalle');
const detalleTitulo = document.getElementById('detalle-titulo');
const listaGenerales = document.getElementById('resultados-generales');

const NOMBRES = {
  red: 'Red neuronal',
  arbol: 'Árbol de decisión',
  svm: 'SVM',
  knn: 'KNN',
};

// Valores de ejemplo hasta conectar el backend
const resultados = {
  red:   { aciertos: 8, total: 10, tiempo: 4.2,   parametros: { epocas: 30, neuronas: 50 } },
  arbol: { aciertos: 6, total: 10, tiempo: 0.012, parametros: { profundidad: 5 } },
  svm:   { aciertos: 7, total: 10, tiempo: 0.008, parametros: { kernel: 'rbf', c: 1 } },
  knn:   { aciertos: 7, total: 10, tiempo: 0.003, parametros: { k: 3 } },
};


// Métodos
metodos.addEventListener('change', (event) => {
  const metodo = event.target.value;
  detalleTitulo.textContent = event.target.nextElementSibling.textContent;
  for (const campos of detalle.querySelectorAll('.parametros')) {
    campos.hidden = campos.dataset.metodo !== metodo;
  }
});


// Plegables
const plegables = document.querySelectorAll('.plegable');

function abrirPlegable(abierto) {
  for (const plegable of plegables) {
    const abrir = plegable === abierto;
    plegable.classList.toggle('plegable-abierto', abrir);
    plegable.querySelector('.plegable-encabezado').setAttribute('aria-expanded', String(abrir));
    plegable.querySelector('.plegable-cuerpo').hidden = !abrir;
  }
  for (const seccion of comparacion.querySelectorAll('[data-modo]')) {
    seccion.hidden = seccion.dataset.modo !== abierto.dataset.plegable;
  }
}

for (const plegable of plegables) {
  plegable.querySelector('.plegable-encabezado').addEventListener('click', () => {
    const abierto = plegable.classList.contains('plegable-abierto');
    abrirPlegable(abierto ? [...plegables].find((p) => p !== plegable) : plegable);
  });
}


// Parámetros
for (const rango of detalle.querySelectorAll('input[type="range"]')) {
  const salida = detalle.querySelector(`output[data-para="${rango.name}"]`);
  rango.addEventListener('input', () => { salida.textContent = rango.value; });
}


// Resultados generales
function formatoTiempo(segundos) {
  return segundos < 1
    ? `${Math.round(segundos * 1000)} ms`
    : `${segundos.toLocaleString('es', { maximumFractionDigits: 1 })} s`;
}

function formatoParametros(metodo, p) {
  if (metodo === 'red') return `${p.epocas} épocas · ${p.neuronas} neuronas`;
  if (metodo === 'arbol') return `profundidad ${p.profundidad}`;
  if (metodo === 'svm') return `kernel ${p.kernel === 'linear' ? 'lineal' : 'RBF'} · C = ${p.c}`;
  return `k = ${p.k}`;
}

function crear(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function pintarGenerales() {
  const entrenados = Object.keys(NOMBRES).filter((m) => resultados[m]);
  const mejor = Math.max(...entrenados.map((m) => resultados[m].aciertos / resultados[m].total));

  listaGenerales.replaceChildren(...Object.keys(NOMBRES).map((metodo) => {
    const r = resultados[metodo];
    const item = crear('li', 'general');
    item.append(crear('span', 'general-nombre', NOMBRES[metodo]));

    if (!r) {
      item.append(crear('span', 'general-pendiente', 'Sin entrenar'));
      return item;
    }

    const precision = r.aciertos / r.total;
    const porcentaje = Math.round(precision * 100);
    item.classList.toggle('general-mejor', entrenados.length > 1 && precision === mejor);

    const barra = crear('span', 'general-barra');
    barra.setAttribute('aria-hidden', 'true');
    const relleno = crear('span');
    relleno.style.setProperty('--valor', `${porcentaje}%`);
    barra.append(relleno);

    item.append(
      crear('span', 'general-precision', `${porcentaje} %`),
      barra,
      crear('span', 'general-detalle', `${r.aciertos} de ${r.total} aciertos · ${formatoTiempo(r.tiempo)}`),
      crear('span', 'general-detalle', formatoParametros(metodo, r.parametros)),
    );
    return item;
  }));
}


// Nivel
function aplicarNivelComparar() {
  const avanzado = document.body.dataset.nivel === 'avanzado';
  comparacion.hidden = !avanzado;
  soloBasico.hidden = avanzado;
}


// Inicio
if (sessionStorage.getItem('neurofai:proyectoId')) {
  pintarGenerales();
  aplicarNivelComparar();
  document.addEventListener('nivel', aplicarNivelComparar);
} else {
  comparacion.hidden = true;
  document.getElementById('sin-datos').hidden = false;
}
