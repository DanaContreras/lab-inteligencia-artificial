// Predicción

const pizarra     = document.getElementById('pizarra');
const pctx        = pizarra.getContext('2d');
const btnLimpiar  = document.getElementById('limpiar-pizarra');
const btnPredecir = document.getElementById('predecir');
const estado      = document.getElementById('estado');

const TEXTO_INICIAL = 'Dibuja algo y presiona Predecir';

let resultado = null;

let drawColor = '#000000';
let lineWidth = 3;
let erasing = false;
let isDrawing = false;
let ultimo = { x: 0, y: 0 };

// Pizarra
function limpiarPizarra() {
  pctx.fillStyle = '#ffffff';
  pctx.fillRect(0, 0, pizarra.width, pizarra.height);
  quitarResultado();
}

btnLimpiar.addEventListener('click', limpiarPizarra);

function posicion(event) {
  const r = pizarra.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (pizarra.width / r.width),
    y: (event.clientY - r.top) * (pizarra.height / r.height),
  };
}

function trazar(desde, hasta) {
  pctx.beginPath();
  pctx.lineCap = 'round';
  pctx.strokeStyle = erasing ? '#ffffff' : drawColor;
  pctx.lineWidth = erasing ? 20 : lineWidth;
  pctx.moveTo(desde.x, desde.y);
  pctx.lineTo(hasta.x, hasta.y);
  pctx.stroke();
}

pizarra.addEventListener('pointerdown', (event) => {
  isDrawing = true;
  pizarra.setPointerCapture(event.pointerId);
  ultimo = posicion(event);
  trazar(ultimo, ultimo); 
});

pizarra.addEventListener('pointermove', (event) => {
  if (!isDrawing) return;
  const actual = posicion(event);
  trazar(ultimo, actual);
  ultimo = actual;
});

for (const evento of ['pointerup', 'pointercancel']) {
  pizarra.addEventListener(evento, () => { isDrawing = false; });
}




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

  const x = redVertical.matches ? CENTRO_VERTICAL : Number(nodo.getAttribute('cx')) + 28;
  const texto = document.createElementNS(SVG_NS, 'text');
  texto.setAttribute('y', redVertical.matches ? 475 : nodo.getAttribute('cy'));
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

  const imagen = pizarra.toDataURL("image/png");

try {
    console.log("Enviando imagen al servidor");

    const idProyecto = sessionStorage.getItem("neurofai:proyectoId");

    if (!idProyecto) {
        throw new Error("No se encontró el proyecto actual.");
    }

    const respuesta = await fetch(
        `/api/proyectos/${encodeURIComponent(idProyecto)}/predecir`,
        { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imagen })
        }
    );

    console.log("Estado HTTP:", respuesta.status);

    const texto = await respuesta.text();

    console.log("Respuesta del servidor:", texto);

    let resultado;

    try {
        resultado = JSON.parse(texto);
    } catch {
        throw new Error(
            "El servidor devolvió HTML o una respuesta que no es JSON."
        );
    }

    if (!respuesta.ok) {
        throw new Error(
            resultado.error || "No se pudo realizar la predicción."
        );
    }

    console.log("Resultado de la predicción:", resultado);

} catch (error) {
    console.error("Error:", error);
    alert("No se pudo realizar la predicción.");
}

  

  console.log("Se envió la imagen al servidor para prediccion.")

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
  dibujarRed();
  redVertical.addEventListener('change', () => {
    quitarResultado();
    dibujarRed();
  });
  window.addEventListener('resize', ajustarLienzo);
  limpiarPizarra();
} else {
  escenario.hidden = true;
  estado.hidden = true;
  document.getElementById('sin-datos').hidden = false;
}
