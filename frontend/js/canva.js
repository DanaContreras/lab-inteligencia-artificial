
/*Dibujo */
const ctx = canvas.getContext('2d');

let drawColor = '#000000';
let lineWidth = 3;
let erasing = false;
let isDrawing = false;
let ultimo = { x: 0, y: 0 };

function prepararLienzo() {
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width;
  canvas.height = r.height;
  limpiarLienzo();
}

function limpiarLienzo() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function posicion(event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (canvas.width / r.width),
    y: (event.clientY - r.top) * (canvas.height / r.height),
  };
}

function trazar(desde, hasta) {
  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.strokeStyle = erasing ? '#ffffff' : drawColor;
  ctx.lineWidth = erasing ? 20 : lineWidth;
  ctx.moveTo(desde.x, desde.y);
  ctx.lineTo(hasta.x, hasta.y);
  ctx.stroke();
}

canvas.addEventListener('pointerdown', (event) => {
  isDrawing = true;
  canvas.setPointerCapture(event.pointerId);
  ultimo = posicion(event);
  trazar(ultimo, ultimo); 
});

canvas.addEventListener('pointermove', (event) => {
  if (!isDrawing) return;
  const actual = posicion(event);
  trazar(ultimo, actual);
  ultimo = actual;
});

for (const evento of ['pointerup', 'pointercancel']) {
  canvas.addEventListener(evento, () => { isDrawing = false; });
}


const botonesHerramienta = document.querySelectorAll('[data-herramienta]');

function elegirHerramienta(nombre) {
  erasing = nombre === 'goma';
  for (const b of botonesHerramienta) {
    const activo = b.dataset.herramienta === nombre;
    b.classList.toggle('herramienta-activa', activo);
    b.setAttribute('aria-pressed', activo);
  }
}

for (const b of botonesHerramienta) {
  b.addEventListener('click', () => elegirHerramienta(b.dataset.herramienta));
}

function changeColor(color) {
  drawColor = color;
  elegirHerramienta('lapiz'); 
  document.querySelectorAll('.circulo').forEach((c) => c.classList.remove('active'));
  event.currentTarget.classList.add('active');
}


document.getElementById('limpiar-dibujo').addEventListener('click', limpiarLienzo);

document.getElementById('guardar-dibujo').addEventListener('click', () => {
  const tarjeta = categoriaActiva;
  const imagen = canvas.toDataURL('image/jpg');

  const enlace = document.createElement('a');
  //enlace.download = 'mi-dibujo.png';


  //agregarMuestra(tarjeta, imagen);
  modalDibujo.close();
});



/* FOTOS */
const video =document.getElementById('video');
const canvasFoto = document.getElementById('canvas');
const foto = document.getElementById('foto');


async function iniciarCamara() {
  try {
    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'La cámara no está disponible. Usa HTTPS o localhost.'
      );
    }

    stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
    });

    video.srcObject = stream;
    await video.play();

  } catch (error) {
      console.error('Error de cámara:', error);

      alert('No se pudo acceder a la cámara: ' + error.name + ' - ' + error.message);
  }
}

function detenerCamara() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  video.srcObject = null;
}

document.getElementById('cerrar-modal').addEventListener('click', () => {detenerCamara(); modal.close();});

modal.addEventListener('close', detenerCamara);