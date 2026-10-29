
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
  if (categoriaDestino) {
    console.log("Categoria Destino:", categoriaDestino)
    agregarMuestra(categoriaDestino, miniaturaLienzo());
    guardarDibujo(categoriaDestino);
    limpiarLienzo();
  }
});

function miniaturaLienzo(lado = 160) {
  const copia = document.createElement('canvas');
  copia.width = lado;
  copia.height = lado;
  copia.getContext('2d').drawImage(canvas, 0, 0, lado, lado);
  return copia.toDataURL('image/jpeg', 0.85);
}

async function guardarDibujo(categoria){
    const imagen = lienzo.toDataURL("image/png");

    console.log("Tarjeta activa:", categoriaActiva);

    if (!categoriaActiva) {
        console.error("No hay una categoría activa");
        return;
    }


    const campoNombre =  categoriaActiva.querySelector('[data-nombre]');
    console.log("Categoría recibida:", campoNombre.value);

    try {
        const respuesta = await fetch(
            "http://localhost:3000/guardar-dibujo",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    imagen: imagen,
                    categoria: categoria
                })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "No se pudo guardar"
            );
        }

        console.log(resultado.mensaje);
        alert("¡Dibujo guardado correctamente!");

    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo guardar el dibujo");
    }
}


/* FOTOS */
const video =document.getElementById('video');
const canvasFoto = document.getElementById('canvas');
const foto = document.getElementById('foto');

const botonTomar = document.getElementById('startbutton');
const botonCerrar = document.getElementById('cerrar-modal');


let stream = null;



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


botonTomar.addEventListener('click', () => {
  try {

    if (!video.videoWidth || !video.videoHeight) {
      alert('La cámara todavía no está lista.');
      return;
    }

    const ctx = canvasFoto.getContext('2d');

    canvasFoto.width = video.videoWidth;
    canvasFoto.height = video.videoHeight;

    ctx.drawImage(
      video,
      0,
      0,
      canvasFoto.width,
      canvasFoto.height
    );

    const fotoCapturada = canvasFoto.toDataURL('image/jpeg', 0.9);
    agregarMuestra(categoriaDestino, fotoCapturada);

  } catch (error) {
    console.error('Error al agregar la muestra:', error);
    alert('Error al agregar la muestra: ' + error.message);
  }
});


function detenerCamara() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  video.pause();
  video.srcObject = null;
}




modal.addEventListener('close', detenerCamara);





