// Predicción

const pizarra     = document.getElementById('pizarra');
const pctx        = pizarra.getContext('2d');
const btnLimpiar  = document.getElementById('limpiar-pizarra');
const btnPredecir = document.getElementById('predecir');
const estado      = document.getElementById('estado');
const btnDibujo = document.getElementById('modo-dibujo');
const btnFoto = document.getElementById('modo-foto');
const btnCapturar = document.getElementById('tomar-foto');
const entrada = document.getElementById('entrada-prediccion')

const TEXTO_INICIAL = 'Dibuja algo y presiona Predecir';

let resultado = null;

//let drawColor = '#000000';
//let lineWidth = 7;
//let erasing = false;
//let isDrawing = false;
//let ultimo = { x: 0, y: 0 };

// Pizarra
function limpiarPizarra() {
  pctx.fillStyle = '#ffffff';
  pctx.fillRect(0, 0, pizarra.width, pizarra.height);
  quitarResultado();
}

btnLimpiar.addEventListener('click', limpiarPizarra);


async function clasificar(imagen) {
    bloquear(true);
  btnPredecir.textContent = 'Prediciendo…';
  quitarResultado();

  const puntos = document.createElement('span');
  puntos.className = 'estado-puntos';
  puntos.setAttribute('aria-hidden', 'true');
  estado.replaceChildren('Prediciendo, espera un momento', puntos);

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
      return resultado.resultado

  } catch (error) {
      console.error("Error:", error);
      alert("No se pudo realizar la predicción.");
  }
}


// Resultado
function recortar(texto, max = 12) {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}




function mostrarResultado(respuesta) {
  const {prediccion, indice, categorias} = respuesta
  const nodoGanador = capas[2][indice]
  nodoGanador.classList.add('nodo-ganador');

  const vertical = redVertical.matches;

  const textos = capas[2].map((nodo, i) => {
    const esGanador = i === indice;

    const x = vertical ? Number(nodo.getAttribute('cx')) : Number(nodo.getAttribute('cx')) + 28;
    const texto = document.createElementNS(SVG_NS, 'text');
    texto.setAttribute('y', vertical ? 475 : nodo.getAttribute('cy'));
    texto.classList.add('red-resultado');

    if (esGanador) {
      const titulo = document.createElementNS(SVG_NS, 'tspan');
      titulo.setAttribute('x', x);
      titulo.setAttribute('dy', '-0.8em');
      titulo.classList.add('red-resultado-titulo');
      titulo.textContent = 'Creo que es:';
      texto.append(titulo);
    }

    //Nombre categoria
    const nombre = document.createElementNS(SVG_NS, 'tspan');
    nombre.setAttribute('x', x);
    nombre.setAttribute('dy', esGanador ? '1em' : '0em');
    nombre.textContent = recortar(categorias[i]+' ');

    //Porcentaje
    const porcentaje = document.createElementNS(SVG_NS, 'tspan');
    porcentaje.classList.add('red-resultado-titulo');
    porcentaje.textContent = (prediccion[0][i] * 100).toFixed(1) + '%';

    texto.append(nombre, porcentaje);
    red.append(texto);
    return texto;
  });

  resultado = { nodoGanador, textos };
  estado.textContent = TEXTO_INICIAL;
}

function quitarResultado() {
  if (!resultado) return;
  console.log("QUITAR RESULTADO")
  resultado.nodoGanador.classList.remove('nodo-ganador');
  resultado.textos.forEach(texto => {texto.remove();});
  resultado = null;
  estado.textContent = TEXTO_INICIAL;
}

function bloquear(valor) {
  btnLimpiar.disabled = valor;
  entrada.disabled = valor
  btnPredecir.disabled = valor;
}

btnPredecir.addEventListener('click', async () => {
  if (!leerPixeles(pizarra).length) {
    estado.textContent = 'Primero dibuja algo';
    return;
  }

  const copia = document.createElement('canvas');
  copia.width = 160;
  copia.height = 160;
  copia.getContext('2d').drawImage(pizarra,
                        0, 0, pizarra.width, pizarra.height,
                        0, 0, 160, 160);
  const imagen = copia.toDataURL("image/png");
  

  console.log("Se envió la imagen al servidor para prediccion.")

  bloquear(true);
  btnPredecir.textContent = "Prediciendo..."
  quitarResultado();

  const puntos = document.createElement('span');
  puntos.className = 'estado-puntos';
  puntos.setAttribute('aria-hidden', 'true');
  estado.replaceChildren('Pensando', puntos);

  let ganador;
  let resultado;
  try {
    resultado = await clasificar(imagen);
    ganador = resultado.indice; // ajusta al nombre real del campo que devuelve tu backend
    console.log("GANADOR: ",resultado)
  
  } catch (error) {
    console.error("Error:", error);
    estado.textContent = error.name === 'AbortError'
      ? 'El servidor tardó demasiado'
      : 'No se pudo realizar la predicción';
    bloquear(false);
    return;
  }

  pizarra.classList.add('fragmentado');
  iniciarCuadros();
  await fragmentar(pizarra, ganador);
  await esperar(RETARDO_CAPA * 2 + 400);

  pizarra.classList.remove('fragmentado');
  mostrarResultado(resultado);
  btnPredecir.textContent = 'Predecir';
  bloquear(false);
});


// Inicio
function dibujarRedPrediccion() {
  quitarResultado();
  redAvanzada = document.body.dataset.nivel === 'avanzado';
  dibujarRed();
  if (redAvanzada) aplicarPesos();
}

if (datos.length) {
  animando = false;
  dibujarRedPrediccion();
  redVertical.addEventListener('change', dibujarRedPrediccion);
  document.addEventListener('nivel', dibujarRedPrediccion);
  window.addEventListener('resize', ajustarLienzo);
  limpiarPizarra();
} else {
  escenario.hidden = true;
  estado.hidden = true;
  document.getElementById('sin-datos').hidden = false;
}

//Selector de entrada
entrada.addEventListener('click', async () => {
  modal.showModal();
})


function mostrarDibujoEnPizarra(imagenBase64) {
    const imagen = new Image();

    imagen.onload = () => {
        limpiarPizarra();

        pctx.drawImage(
            imagen,
            0, 0,
            pizarra.width,
            pizarra.height
        );
    };

    imagen.src = imagenBase64;
}