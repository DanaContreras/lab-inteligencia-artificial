// Predicción

const pizarra     = document.getElementById('pizarra');
const pctx        = pizarra.getContext('2d');
const btnLimpiar  = document.getElementById('limpiar-pizarra');
const btnPredecir = document.getElementById('predecir');
const estado      = document.getElementById('estado');

const TEXTO_INICIAL = 'Dibuja algo y presiona Predecir';

let resultado = null;


// Pizarra
function limpiarPizarra() {
  pctx.fillStyle = '#ffffff';
  pctx.fillRect(0, 0, pizarra.width, pizarra.height);
  quitarResultado();
}

btnLimpiar.addEventListener('click', limpiarPizarra);


// Clasificación provisoria: elige una categoría al azar hasta que haya un modelo
function clasificar() {
  return Math.floor(Math.random() * datos.length);
}


// Resultado
function recortar(texto, max = 12) {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

function mostrarResultado(categoria) {
  const nodo = capas[2][categoria];
  nodo.classList.add('nodo-ganador');

  const x = Number(nodo.getAttribute('cx')) + 28;
  const texto = document.createElementNS(SVG_NS, 'text');
  texto.setAttribute('y', nodo.getAttribute('cy'));
  texto.classList.add('red-resultado');

  const titulo = document.createElementNS(SVG_NS, 'tspan');
  titulo.setAttribute('x', x);
  titulo.setAttribute('dy', '-0.6em');
  titulo.classList.add('red-resultado-titulo');
  titulo.textContent = 'Creo que es:';

  const nombre = document.createElementNS(SVG_NS, 'tspan');
  nombre.setAttribute('x', x);
  nombre.setAttribute('dy', '1.2em');
  nombre.textContent = recortar(datos[categoria].nombre);

  texto.append(titulo, nombre);
  red.append(texto);

  resultado = { nodo, texto };
  estado.textContent = TEXTO_INICIAL;
}

function quitarResultado() {
  if (!resultado) return;
  resultado.nodo.classList.remove('nodo-ganador');
  resultado.texto.remove();
  resultado = null;
  estado.textContent = TEXTO_INICIAL;
}

function bloquear(valor) {
  btnLimpiar.disabled = valor;
  btnPredecir.disabled = valor;
}

btnPredecir.addEventListener('click', async () => {
  if (!leerPixeles(pizarra).length) {
    estado.textContent = 'Primero dibuja algo';
    return;
  }

  bloquear(true);
  quitarResultado();

  const puntos = document.createElement('span');
  puntos.className = 'estado-puntos';
  puntos.setAttribute('aria-hidden', 'true');
  estado.replaceChildren('Pensando', puntos);

  const ganador = clasificar();

  pizarra.classList.add('fragmentado');
  iniciarCuadros();
  await fragmentar(pizarra, ganador);
  await esperar(RETARDO_CAPA * 2 + 400);

  pizarra.classList.remove('fragmentado');
  mostrarResultado(ganador);
  bloquear(false);
});


// Inicio
if (datos.length) {
  animando = false;
  crearRed(Math.min(Math.max(datos.length, 2), 8));
  ajustarLienzo();
  window.addEventListener('resize', ajustarLienzo);
  limpiarPizarra();
} else {
  escenario.hidden = true;
  estado.hidden = true;
  document.getElementById('sin-datos').hidden = false;
}
