// Red neuronal y partículas compartidas por entrenar y predecir

const escenario  = document.getElementById('escenario');
const red        = document.getElementById('red');
const lienzo     = document.getElementById('particulas');
const ctx        = lienzo.getContext('2d');

const SVG_NS     = 'http://www.w3.org/2000/svg';
const N_ENTRADA  = 6;
const N_OCULTA   = 5;
const N_ENTRADA_VERTICAL = 4;
const N_OCULTA_VERTICAL  = 3;
const GRILLA     = 24;
const LADO_MUESTREO = 160;
const CENTRO_VERTICAL = 300;
const VISTA_HORIZONTAL = red.getAttribute('viewBox');
const VISTA_VERTICAL = '0 0 600 500';

const redVertical = window.matchMedia('(max-width: 600px)');

const datos = JSON.parse(sessionStorage.getItem('neurofai:datos') || '[]');

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

let redAvanzada = false;
const ESCALA_MIN = 0.7;
const ESCALA_MAX = 1.3;


// Red
const capas = [];
const conexiones = [];

function crearRed(nSalida) {
  const vertical = redVertical.matches;

  red.setAttribute('viewBox', vertical ? VISTA_VERTICAL : VISTA_HORIZONTAL);
  red.replaceChildren();
  capas.length = 0;
  conexiones.length = 0;

  const columnas = [
    { pos: vertical ? 60 : 90,   n: vertical ? N_ENTRADA_VERTICAL : N_ENTRADA, nombre: 'Entrada', simbolo: 'x', ultimo: 'n' },
    { pos: vertical ? 230 : 300, n: vertical ? N_OCULTA_VERTICAL : N_OCULTA,   nombre: 'Capa oculta', simbolo: 'w', ultimo: 'm' },
    { pos: vertical ? 400 : 510, n: nSalida, nombre: 'Salida', simbolo: 'y' },
  ];

  const centro  = vertical ? CENTRO_VERTICAL : 185;
  const espacio = vertical ? 560 : 300;
  const pasoMax = vertical ? 150 : 60;

  const huecos = [];

  const posiciones = columnas.map(({ n, ultimo }, c) => {
    const puntos = redAvanzada && Boolean(ultimo);
    const lugares = puntos ? n + 1 : n;
    const paso = Math.min(espacio / lugares, pasoMax);
    const inicio = centro - (paso * (lugares - 1)) / 2;
    if (puntos) huecos[c] = { centro: inicio + (n - 1) * paso, paso };
    return Array.from({ length: n }, (_, i) => inicio + (puntos && i === n - 1 ? n : i) * paso);
  });

  const enCapa = (pos, a) => (vertical ? { x: a, y: pos } : { x: pos, y: a });
  const punto = (c, i) => enCapa(columnas[c].pos, posiciones[c][i]);
  const radio = vertical ? 24 : 16;

  for (let c = 0; c < columnas.length - 1; c++) {
    conexiones.push(posiciones[c].map((_, i) => posiciones[c + 1].map((_, j) => {
      const desde = punto(c, i);
      const hasta = punto(c + 1, j);
      const linea = document.createElementNS(SVG_NS, 'line');
      linea.setAttribute('x1', desde.x);
      linea.setAttribute('y1', desde.y);
      linea.setAttribute('x2', hasta.x);
      linea.setAttribute('y2', hasta.y);
      linea.classList.add('red-conexion');
      red.append(linea);
      return linea;
    })));
  }

  columnas.forEach(({ pos, nombre }, c) => {
    const nodos = posiciones[c].map((_, i) => {
      const { x, y } = punto(c, i);
      const nodo = document.createElementNS(SVG_NS, 'circle');
      nodo.setAttribute('cx', x);
      nodo.setAttribute('cy', y);
      nodo.setAttribute('r', radio);
      nodo.classList.add('nodo');
      red.append(nodo);
      return nodo;
    });
    capas.push(nodos);

    const texto = document.createElementNS(SVG_NS, 'text');
    texto.setAttribute('x', vertical ? CENTRO_VERTICAL : pos);
    texto.setAttribute('y', vertical ? pos - 42 : 390);
    texto.classList.add('red-capa');
    texto.textContent = nombre;
    red.append(texto);

    if (!redAvanzada) return;

    if (huecos[c]) {
      for (const d of [-1, 0, 1]) {
        const { x, y } = enCapa(pos, huecos[c].centro + d * huecos[c].paso * 0.2);
        const p = document.createElementNS(SVG_NS, 'circle');
        p.setAttribute('cx', x);
        p.setAttribute('cy', y);
        p.setAttribute('r', vertical ? 4 : 2.5);
        p.classList.add('red-puntos');
        red.append(p);
      }
    }

    nodos.forEach((_, i) => {
      const indice = columnas[c].ultimo && i === nodos.length - 1 ? columnas[c].ultimo : i + 1;
      etiquetar(punto(c, i), radio * ESCALA_MAX, columnas[c].simbolo, indice, vertical, c === 2);
    });
  });
}

function etiquetar({ x, y }, r, simbolo, indice, vertical, arriba) {
  const texto = document.createElementNS(SVG_NS, 'text');
  texto.setAttribute('x', vertical ? x - r * 0.8 : x - r - 2);
  if (!vertical) texto.setAttribute('y', y - r * 0.3);
  else texto.setAttribute('y', arriba ? y - r - 4 : y + r + 20);
  texto.classList.add('red-etiqueta');

  const sub = document.createElementNS(SVG_NS, 'tspan');
  sub.setAttribute('dy', '0.3em');
  sub.classList.add('red-etiqueta-indice');
  sub.textContent = indice;

  texto.append(simbolo, sub);
  red.append(texto);
}

function dibujarRed() {
  crearRed(Math.min(Math.max(datos.length, 2), 8));
  ajustarLienzo();
}

const pulsos = new WeakMap();

function pulsar(el, clase = 'nodo-activo') {
  el.classList.add(clase);
  clearTimeout(pulsos.get(el));
  pulsos.set(el, setTimeout(() => el.classList.remove(clase), 250));
}

const RETARDO_CAPA = 250;

function encenderConexion(linea, clase = '') {
  const senal = linea.cloneNode();
  senal.setAttribute('class', `senal ${clase}`.trim());
  senal.setAttribute('pathLength', 1);
  senal.style.setProperty('--recorrido', `${RETARDO_CAPA}ms`);
  red.insertBefore(senal, capas[0][0]);

  senal.addEventListener('animationend', (event) => {
    if (event.animationName === 'apagar') senal.remove();
  });
}

function propagar(entrada, categoria) {
  const oculta = Math.floor(Math.random() * capas[1].length);
  encenderConexion(conexiones[0][entrada % capas[0].length][oculta]);

  setTimeout(() => {
    pulsar(capas[1][oculta]);
    encenderConexion(conexiones[1][oculta][categoria]);
  }, RETARDO_CAPA);

  setTimeout(() => pulsar(capas[2][categoria]), RETARDO_CAPA * 2);
}

// Retropropagación
function algunos(cantidad, max) {
  const indices = Array.from({ length: cantidad }, (_, i) => i);
  indices.sort(() => Math.random() - 0.5);
  return indices.slice(0, 1 + Math.floor(Math.random() * max));
}

function ajustarPeso(nodo) {
  const actual = Number(nodo.dataset.escala || 1);
  const nueva = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, actual + Math.random() * 0.3 - 0.12));
  nodo.dataset.escala = nueva;
  nodo.style.setProperty('--escala', nueva);
}

async function retropropagar(categoria, tasaError) {
  const salida = capas[2]?.[categoria];
  if (!salida) return;

  if (Math.random() > tasaError) {
    salida.classList.add('nodo-aprendido');
    await esperar(600);
    salida.classList.remove('nodo-aprendido');
    return;
  }

  const ocultas = algunos(capas[1].length, 2);
  const entradas = algunos(capas[0].length, 2);
  const nodosOcultos = ocultas.map((i) => capas[1][i]);
  const nodosEntrada = entradas.map((i) => capas[0][i]);
  const errados = [salida, ...nodosOcultos, ...nodosEntrada];

  salida.classList.add('nodo-error');
  for (const o of ocultas) encenderConexion(conexiones[1][o][categoria], 'senal-error');
  await esperar(RETARDO_CAPA);

  nodosOcultos.forEach((n) => n.classList.add('nodo-error'));
  for (const e of entradas) {
    for (const o of ocultas) encenderConexion(conexiones[0][e][o], 'senal-error');
  }
  await esperar(RETARDO_CAPA);

  nodosEntrada.forEach((n) => n.classList.add('nodo-error'));
  await esperar(500);

  errados.forEach((n) => n.classList.replace('nodo-error', 'nodo-aprendido'));
  [...nodosOcultos, ...nodosEntrada].forEach(ajustarPeso);
  await esperar(700);

  errados.forEach((n) => n.classList.remove('nodo-aprendido'));
}

function destacarPesos() {
  for (const capa of capas.slice(0, 2)) {
    const orden = [...capa].sort((a, b) => (a.dataset.escala || 1) - (b.dataset.escala || 1));
    orden.forEach((nodo, i) => {
      const escala = ESCALA_MIN + ((ESCALA_MAX - ESCALA_MIN) * i) / Math.max(orden.length - 1, 1);
      nodo.dataset.escala = escala;
      nodo.style.setProperty('--escala', escala);
    });
  }
  guardarPesos();
}

function clavePesos() {
  return `neurofai:pesos:${sessionStorage.getItem('neurofai:proyectoId') || ''}`;
}

function guardarPesos() {
  const pesos = capas.slice(0, 2).map((capa) => capa.map((n) => Number(n.dataset.escala || 1)));
  sessionStorage.setItem(clavePesos(), JSON.stringify(pesos));
}

function aplicarPesos() {
  const pesos = JSON.parse(sessionStorage.getItem(clavePesos()) || 'null');
  if (!pesos) return;

  capas.slice(0, 2).forEach((capa, c) => {
    const guardados = pesos[c] || [];
    capa.forEach((nodo, i) => {
      const escala = i === capa.length - 1 ? guardados.at(-1) : guardados[i];
      if (escala === undefined) return;
      nodo.dataset.escala = escala;
      nodo.style.setProperty('--escala', escala);
    });
  });
}

// Partículas
let particulas = [];
let animando = true;
let bucleActivo = false;

function ajustarLienzo() {
  const r = escenario.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  lienzo.width = r.width * dpr;
  lienzo.height = r.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function centroRelativo(el) {
  const base = escenario.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
}

function suavizar(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function leerPixeles(fuente) {
  const muestreo = document.createElement('canvas');
  muestreo.width = LADO_MUESTREO;
  muestreo.height = LADO_MUESTREO;
  const mctx = muestreo.getContext('2d', { willReadFrequently: true });
  mctx.drawImage(fuente, 0, 0, LADO_MUESTREO, LADO_MUESTREO);
  const { data } = mctx.getImageData(0, 0, LADO_MUESTREO, LADO_MUESTREO);

  const celda = LADO_MUESTREO / GRILLA;
  const pixeles = [];

  for (let fila = 0; fila < GRILLA; fila++) {
    for (let col = 0; col < GRILLA; col++) {
      let mejor = null;
      let minLuz = 200;

      for (let y = Math.floor(fila * celda); y < Math.floor((fila + 1) * celda); y++) {
        for (let x = Math.floor(col * celda); x < Math.floor((col + 1) * celda); x++) {
          const i = (y * LADO_MUESTREO + x) * 4;
          const luz = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (luz < minLuz) {
            minLuz = luz;
            mejor = `rgb(${data[i]} ${data[i + 1]} ${data[i + 2]})`;
          }
        }
      }

      if (mejor) pixeles.push({ fila, col, color: mejor });
    }
  }
  return pixeles;
}

function fragmentar(fuente, categoria) {
  const base = escenario.getBoundingClientRect();
  const r = fuente.getBoundingClientRect();
  const origenX = r.left - base.left + fuente.clientLeft;
  const origenY = r.top - base.top + fuente.clientTop;
  const lado = fuente.clientWidth / GRILLA;

  const entradas = capas[0];
  const destinos = entradas.map(centroRelativo);
  const pixeles = leerPixeles(fuente);

  if (!pixeles.length) return Promise.resolve();

  return new Promise((resolver) => {
    let pendientes = pixeles.length;
    const ahora = performance.now();

    pixeles.sort((a, b) => a.fila - b.fila || a.col - b.col);

    for (const [orden, { fila, col, color }] of pixeles.entries()) {
      const indice = Math.floor((orden / pixeles.length) * entradas.length);

      const desde = { x: origenX + (col + 0.5) * lado, y: origenY + (fila + 0.5) * lado };
      const hasta = destinos[indice];

      particulas.push({
        desde,
        hasta,
        control: {
          x: (desde.x + hasta.x) / 2,
          y: (desde.y + hasta.y) / 2 + (Math.random() - 0.5) * 120,
        },
        lado: lado - 1,
        color,
        inicio: ahora + ((GRILLA - col) / GRILLA) * 600 + Math.random() * 300,
        duracion: 900 + Math.random() * 400,
        alLlegar() {
          pulsar(entradas[indice]);
          propagar(indice, categoria);
          //if (Math.random() < 0.3) propagar(indice, categoria);
          if (--pendientes === 0) resolver();
        },
      });
    }
  });
}

function cuadro(t) {
  ctx.clearRect(0, 0, lienzo.width, lienzo.height);

  particulas = particulas.filter((p) => {
    const avance = Math.max(0, (t - p.inicio) / p.duracion);

    if (avance >= 1) {
      p.alLlegar();
      return false;
    }

    const e = suavizar(avance);
    const u = 1 - e;
    const x = u * u * p.desde.x + 2 * u * e * p.control.x + e * e * p.hasta.x;
    const y = u * u * p.desde.y + 2 * u * e * p.control.y + e * e * p.hasta.y;
    const lado = p.lado + (4 - p.lado) * e;

    ctx.fillStyle = p.color;
    ctx.fillRect(x - lado / 2, y - lado / 2, lado, lado);
    return true;
  });

  if (animando || particulas.length) requestAnimationFrame(cuadro);
  else bucleActivo = false;
}

function iniciarCuadros() {
  if (bucleActivo) return;
  bucleActivo = true;
  requestAnimationFrame(cuadro);
}
