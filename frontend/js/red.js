// Red neuronal y partículas compartidas por entrenar y predecir

const escenario  = document.getElementById('escenario');
const red        = document.getElementById('red');
const lienzo     = document.getElementById('particulas');
const ctx        = lienzo.getContext('2d');

const SVG_NS     = 'http://www.w3.org/2000/svg';
const N_ENTRADA  = 6;
const N_OCULTA   = 5;
const GRILLA     = 24;
const LADO_MUESTREO = 160;

const datos = JSON.parse(sessionStorage.getItem('neurofai:datos') || '[]');

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));


// Red
const capas = [];
const conexiones = [];

function crearRed(nSalida) {
  const columnas = [
    { x: 90,  n: N_ENTRADA, nombre: 'Entrada' },
    { x: 300, n: N_OCULTA,  nombre: 'Capa oculta' },
    { x: 510, n: nSalida,   nombre: 'Salida' },
  ];

  const ys = columnas.map(({ n }) => {
    const paso = Math.min(300 / n, 60);
    const inicio = 185 - (paso * (n - 1)) / 2;
    return Array.from({ length: n }, (_, i) => inicio + i * paso);
  });

  for (let c = 0; c < columnas.length - 1; c++) {
    conexiones.push(ys[c].map((y1) => ys[c + 1].map((y2) => {
      const linea = document.createElementNS(SVG_NS, 'line');
      linea.setAttribute('x1', columnas[c].x);
      linea.setAttribute('y1', y1);
      linea.setAttribute('x2', columnas[c + 1].x);
      linea.setAttribute('y2', y2);
      linea.classList.add('red-conexion');
      red.append(linea);
      return linea;
    })));
  }

  columnas.forEach(({ x, nombre }, c) => {
    const nodos = ys[c].map((y) => {
      const nodo = document.createElementNS(SVG_NS, 'circle');
      nodo.setAttribute('cx', x);
      nodo.setAttribute('cy', y);
      nodo.setAttribute('r', 16);
      nodo.classList.add('nodo');
      red.append(nodo);
      return nodo;
    });
    capas.push(nodos);

    const texto = document.createElementNS(SVG_NS, 'text');
    texto.setAttribute('x', x);
    texto.setAttribute('y', 390);
    texto.classList.add('red-capa');
    texto.textContent = nombre;
    red.append(texto);
  });
}

const pulsos = new WeakMap();

function pulsar(el, clase = 'nodo-activo') {
  el.classList.add(clase);
  clearTimeout(pulsos.get(el));
  pulsos.set(el, setTimeout(() => el.classList.remove(clase), 250));
}

const RETARDO_CAPA = 250;

function encenderConexion(linea) {
  const senal = linea.cloneNode();
  senal.setAttribute('class', 'senal');
  senal.setAttribute('pathLength', 1);
  senal.style.setProperty('--recorrido', `${RETARDO_CAPA}ms`);
  red.insertBefore(senal, capas[0][0]);

  senal.addEventListener('animationend', (event) => {
    if (event.animationName === 'apagar') senal.remove();
  });
}

function propagar(entrada, categoria) {
  const oculta = Math.floor(Math.random() * capas[1].length);
  encenderConexion(conexiones[0][entrada][oculta]);

  setTimeout(() => {
    pulsar(capas[1][oculta]);
    encenderConexion(conexiones[1][oculta][categoria]);
  }, RETARDO_CAPA);

  setTimeout(() => pulsar(capas[2][categoria]), RETARDO_CAPA * 2);
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
