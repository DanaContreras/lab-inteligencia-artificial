// Predicción avanzada

const panelAvanzado   = document.getElementById('avanzado');
const lugarBasico     = pizarra.parentElement;
const lugarAvanzado   = document.getElementById('lugar-pizarra');
const listaResultados = document.getElementById('resultados');
const coincidencia    = document.getElementById('coincidencia');
const btnLimpiarAv    = document.getElementById('limpiar-avanzado');
const btnPredecirAv   = document.getElementById('predecir-avanzado');
const estadoAvanzado  = document.getElementById('estado-avanzado');
const entradaAvanzado = document.getElementById('entrada-avanzado')

let modelos = null;
let predicciones = {};


// Métodos entrenados
function entrenados() {
  return Object.keys(NOMBRES_METODOS).filter((m) => modelos?.[m]);
}


// Resultados
function porcentaje(confianza) {
  return `${Math.round(confianza * 100)} %`;
}

function pintarResultados() {
  const metodos = entrenados();
  btnPredecirAv.disabled = !metodos.length;

  if (!metodos.length) {
    listaResultados.replaceChildren();
    coincidencia.textContent = '';
    return;
  }

  listaResultados.replaceChildren(...metodos.map((metodo) => {
    const prediccion = predicciones[metodo];
    console.log("Prediccion:", prediccion)
    const item = crearElemento('li', 'resultado');
    const valor = crearElemento('span', prediccion ? 'resultado-valor resultado-valor-listo' : 'resultado-valor',
      prediccion?.categoria ?? '—');

    if (prediccion?.confianza !== undefined) {
      valor.append(' ', crearElemento('span', 'resultado-confianza', porcentaje(prediccion.confianza)));
    }

    item.append(crearElemento('span', '', NOMBRES_METODOS[metodo]), valor);
    return item;
  }));

  const respuestas = metodos.map((m) => predicciones[m]?.categoria).filter(Boolean);
  coincidencia.textContent = respuestas.length < 2
    ? ''
    : new Set(respuestas).size === 1
      ? 'Todos los métodos coinciden.'
      : 'Los métodos no coinciden: cada uno aprendió algo distinto de tus dibujos.';
}


// Pulso del botón mientras haya un dibujo sin predecir
function pulsarPredecir(activo) {
  btnPredecirAv.classList.toggle('pulso-continuo', activo && !btnPredecirAv.disabled);
}

pizarra.addEventListener('pointerdown', () => {
  if (panelAvanzado.hidden || !Object.keys(predicciones).length) return;
  predicciones = {};
  pintarResultados();
});

pizarra.addEventListener('pointerup', () => {
  if (panelAvanzado.hidden) return;
  pulsarPredecir(leerPixeles(pizarra).length > 0);
});


// Acciones
entradaAvanzado.addEventListener('click', async () => {
  modal.showModal();
})

btnLimpiarAv.addEventListener('click', () => {
  limpiarPizarra();
  predicciones = {};
  estadoAvanzado.textContent = '';
  pulsarPredecir(false);
  pintarResultados();
});

btnPredecirAv.addEventListener('click', async () => {
  if (!leerPixeles(pizarra).length) {
    estadoAvanzado.textContent = 'Primero dibuja algo';
    return;
  }

  const metodos = entrenados();
  pulsarPredecir(false);
  btnPredecirAv.disabled = true;
  btnLimpiarAv.disabled = true;
  entradaAvanzado.disabled = true;
  estadoAvanzado.replaceChildren('Prediciendo', puntosEspera());

  try {
    const imagen = pizarra.toDataURL('image/png');
    const otros = metodos.filter((m) => m !== 'red');

    const [red, demas] = await Promise.all([
      metodos.includes('red') ? pedirProyecto('/predecir', { imagen }) : null,
      otros.length ? pedirProyecto('/predecir-modelos', { imagen, metodos: otros }) : null,
    ]);


    predicciones = { ...demas?.resultados };
    if (red) {
      const { categorias, indice, prediccion } = red.resultado;
      categoria = categorias[indice]
      predicciones.red = { categoria, confianza: prediccion?.[0]?.[indice] };
    }
    estadoAvanzado.textContent = '';
  } catch (error) {
    console.error(error);
    predicciones = {};
    estadoAvanzado.textContent = error.message;
  }

  entradaAvanzado.disabled = false
  btnLimpiarAv.disabled = false;
  pintarResultados();
});


// Nivel
async function cargarAvanzado() {
  estadoAvanzado.replaceChildren('Cargando métodos', puntosEspera());
  try {
    modelos = await cargarModelos();
    estadoAvanzado.textContent = entrenados().length
      ? ''
      : 'Todavía no hay métodos entrenados. Vuelve al paso 2 para entrenar.';
  } catch (error) {
    console.error(error);
    modelos = null;
    estadoAvanzado.textContent = error.message;
    btnPredecirAv.disabled = true;
    return;
  }
  pintarResultados();
}

function aplicarNivelPredecir() {
  const avanzado = document.body.dataset.nivel === 'avanzado';
  panelAvanzado.hidden = !avanzado;
  escenario.hidden = avanzado;
  estado.hidden = avanzado;
  (avanzado ? lugarAvanzado : lugarBasico).prepend(pizarra);
  if (avanzado && !modelos) cargarAvanzado();
}

if (datos.length) {
  aplicarNivelPredecir();
  document.addEventListener('nivel', aplicarNivelPredecir);
}
