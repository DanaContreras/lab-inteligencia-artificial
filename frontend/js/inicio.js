// Red animada de la portada

const redViva       = document.getElementById('red-viva');
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

const SVG_NS    = 'http://www.w3.org/2000/svg';
const RECORRIDO = 500;
const APAGADO   = 400;
const CADA_ONDA = 1600;

const CAPAS = [
  { x: 70,  n: 4, nombre: 'Entrada' },
  { x: 200, n: 3, nombre: 'Capa oculta' },
  { x: 330, n: 2, nombre: 'Salida' },
];

let visible = false;


// Red
function crear(tipo, atributos, clase) {
  const el = document.createElementNS(SVG_NS, tipo);
  for (const [nombre, valor] of Object.entries(atributos)) el.setAttribute(nombre, valor);
  el.classList.add(clase);
  redViva.append(el);
  return el;
}

const ys = CAPAS.map(({ n }) =>
  Array.from({ length: n }, (_, i) => 130 + (i - (n - 1) / 2) * 62));

const lineas = CAPAS.slice(0, -1).map(({ x }, c) =>
  ys[c].map((y1) => ys[c + 1].map((y2) =>
    crear('line', { x1: x, y1, x2: CAPAS[c + 1].x, y2 }, 'red-viva-conexion'))));

const nodos = CAPAS.map(({ x, nombre }, c) => {
  crear('text', { x, y: 285 }, 'red-viva-capa').textContent = nombre;

  return ys[c].map((y) => {
    const nodo = crear('circle', { cx: x, cy: y, r: 18 }, 'red-viva-nodo');
    nodo.style.animationDelay = `${-Math.random() * 3}s`;
    return nodo;
  });
});


// Señales
function activar(nodo) {
  nodo.classList.add('red-viva-activo');
  setTimeout(() => nodo.classList.remove('red-viva-activo'), 450);
}

function enviar(linea) {
  const senal = linea.cloneNode();
  senal.setAttribute('class', 'red-viva-senal');
  senal.setAttribute('pathLength', 1);
  senal.style.setProperty('--recorrido', `${RECORRIDO}ms`);
  redViva.insertBefore(senal, nodos[0][0]);
  setTimeout(() => senal.remove(), RECORRIDO + APAGADO);
}

const alAzar = (lista) => Math.floor(Math.random() * lista.length);

function onda() {
  let actual = alAzar(nodos[0]);
  activar(nodos[0][actual]);

  for (let c = 1; c < nodos.length; c++) {
    const siguiente = alAzar(nodos[c]);
    const desde = actual;

    setTimeout(() => enviar(lineas[c - 1][desde][siguiente]), (c - 1) * RECORRIDO);
    setTimeout(() => activar(nodos[c][siguiente]), c * RECORRIDO);
    actual = siguiente;
  }
}

setInterval(() => {
  if (visible && !sinMovimiento.matches && !document.hidden) onda();
}, CADA_ONDA);

new IntersectionObserver(([entrada]) => {
  visible = entrada.isIntersecting;
}).observe(redViva);

const revelables = document.querySelectorAll('.seccion-titulo, .seccion-texto, .tarjeta, .paso-inicio, .cierre');

if (!sinMovimiento.matches) {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(({ isIntersecting, target }) => {
      target.classList.toggle('revelado', isIntersecting);
    });
  }, { threshold: 0.15 });

  revelables.forEach((el) => {
    el.classList.add('revelar');
    observador.observe(el);
  });
}