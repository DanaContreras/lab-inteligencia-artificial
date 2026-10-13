// Entrenamiento

const dibujo       = document.getElementById('dibujo-actual');
const etiqueta     = document.getElementById('dibujo-categoria');
const btnSiguiente = document.getElementById('siguiente-paso');

const muestras = datos.flatMap((c, categoria) =>
  c.muestras.map((src) => ({ src, nombre: c.nombre, categoria })));


// Secuencia
async function mostrarDibujo({ src, nombre }) {
  dibujo.classList.remove('fragmentado');
  dibujo.classList.add('desvanecido');
  dibujo.src = src;
  await dibujo.decode();

  etiqueta.textContent = nombre;
  dibujo.classList.remove('desvanecido');
  await esperar(300);
}

async function animar() {
  for (const muestra of muestras) {
    await mostrarDibujo(muestra);
    await esperar(700);
    dibujo.classList.add('fragmentado');
    await fragmentar(dibujo, muestra.categoria);
    await esperar(800);
  }

  terminarEntrenamiento();
}

const ESPERA_PREDECIR = 3;

async function terminarEntrenamiento() {
  animando = false;
  etiqueta.textContent = '';

  const estado = document.getElementById('estado');
  for (let segundos = ESPERA_PREDECIR; segundos > 0; segundos--) {
    estado.textContent = `¡Entrenamiento completo! Puedo predecir en ${segundos}…`;
    await esperar(1000);
  }
  location.href = './predecir.html';
}

btnSiguiente.addEventListener('click', () => {
  location.href = './predecir.html';
});

if (muestras.length) {
  crearRed(Math.min(Math.max(datos.length, 2), 8));
  ajustarLienzo();
  window.addEventListener('resize', ajustarLienzo);
  iniciarCuadros();
  animar();
} else {
  escenario.hidden = true;
  document.getElementById('estado').hidden = true;
  document.getElementById('sin-datos').hidden = false;
}
