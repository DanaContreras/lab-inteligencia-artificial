// Entrenamiento avanzado

const panelAvanzado  = document.getElementById('avanzado');
const listaMetodos   = document.getElementById('metodos');
const detalle        = document.getElementById('detalle');
const detalleTitulo  = document.getElementById('detalle-titulo');
const detalleVacio   = document.getElementById('detalle-vacio');
const btnEntrenar    = document.getElementById('entrenar');
const estadoAvanzado = document.getElementById('estado-avanzado');

let entrenadoAvanzado = false;
const ordenSeleccion = [...listaMetodos.querySelectorAll('input:checked')].map((i) => i.value);


// Selección
listaMetodos.addEventListener('change', ({ target }) => {
  const posicion = ordenSeleccion.indexOf(target.value);
  if (posicion !== -1) ordenSeleccion.splice(posicion, 1);
  if (target.checked) ordenSeleccion.push(target.value);

  btnEntrenar.disabled = !ordenSeleccion.length;
  mostrarDetalle();
});

function mostrarDetalle() {
  const metodo = ordenSeleccion.at(-1);

  detalleTitulo.textContent = metodo ? NOMBRES_METODOS[metodo] : 'Parámetros';
  detalleVacio.hidden = Boolean(metodo);
  for (const campos of detalle.querySelectorAll('.parametros')) {
    campos.hidden = campos.dataset.metodo !== metodo;
  }
}


// Parámetros
for (const rango of detalle.querySelectorAll('input[type="range"]')) {
  const salida = detalle.querySelector(`output[data-para="${rango.name}"]`);
  rango.addEventListener('input', () => { salida.textContent = rango.value; });
}

function leerParametros(metodo) {
  const campos = detalle.querySelector(`.parametros[data-metodo="${metodo}"]`);
  const parametros = {};
  for (const input of campos.querySelectorAll('input')) {
    if (input.type === 'range') parametros[input.name] = Number(input.value);
    else if (input.checked) parametros[input.name] = input.value;
  }
  return parametros;
}


// Flecha a predecir
function actualizarSiguiente() {
  const bloqueado = document.body.dataset.nivel === 'avanzado' && !entrenadoAvanzado;
  btnSiguiente.setAttribute('aria-disabled', String(bloqueado));
}

function pulsarEntrenar() {
  btnEntrenar.classList.remove('pulso');
  void btnEntrenar.offsetWidth;
  btnEntrenar.classList.add('pulso');
}

btnEntrenar.addEventListener('animationend', () => btnEntrenar.classList.remove('pulso'));

document.addEventListener('click', (event) => {
  if (!event.target.closest('#siguiente-paso')) return;
  if (btnSiguiente.getAttribute('aria-disabled') !== 'true') return;
  event.stopPropagation();
  pulsarEntrenar();
}, true);


// Entrenar
function bloquearAvanzado(valor) {
  for (const control of panelAvanzado.querySelectorAll('input, button')) {
    control.disabled = valor;
  }
  if (!valor) btnEntrenar.disabled = !ordenSeleccion.length;
}

btnEntrenar.addEventListener('click', async () => {
  const seleccion = Object.keys(NOMBRES_METODOS).filter((m) => ordenSeleccion.includes(m));
  const errores = [];

  bloquearAvanzado(true);

  for (const [n, metodo] of seleccion.entries()) {
    estadoAvanzado.replaceChildren(
      `Entrenando ${NOMBRES_METODOS[metodo]} (${n + 1} de ${seleccion.length})`, puntosEspera());

    try {
      const parametros = leerParametros(metodo);
      if (metodo === 'red') await pedirProyecto('/entrenar', { parametros });
      else await pedirProyecto('/entrenar-modelo', { metodo, parametros });
    } catch (error) {
      console.error(error);
      errores.push(`${NOMBRES_METODOS[metodo]}: ${error.message}`);
    }
  }

  if (errores.length < seleccion.length) entrenadoAvanzado = true;
  actualizarSiguiente();

  estadoAvanzado.textContent = errores.length
    ? `No se pudo entrenar ${errores.join(' · ')}`
    : '¡Entrenamiento completo! Ya puedes predecir.';
  bloquearAvanzado(false);
});


// Nivel
function aplicarNivelEntrenar() {
  const avanzado = document.body.dataset.nivel === 'avanzado';
  panelAvanzado.hidden = !avanzado;
  escenario.hidden = avanzado;
  document.getElementById('estado').hidden = avanzado;
  actualizarSiguiente();
}

if (muestras.length) {
  mostrarDetalle();
  aplicarNivelEntrenar();
  document.addEventListener('nivel', aplicarNivelEntrenar);
}
