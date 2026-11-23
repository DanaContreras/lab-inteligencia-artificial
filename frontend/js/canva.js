
/*Dibujo */
const rangeInput = document.getElementById("grosor");
const ctxt = canvas.getContext('2d');

let drawColor = '#000000';
let lineWidth = 7;
let erasing = false;
let isDrawing = false;
let ultimo = { x: 0, y: 0 };

rangeInput.addEventListener("input",grosorLinea);

function prepararLienzo() {
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width;
  canvas.height = r.height;
  limpiarLienzo();
}

function limpiarLienzo() {
  ctxt.fillStyle = '#ffffff';
  ctxt.fillRect(0, 0, canvas.width, canvas.height);
}

function posicion(event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (canvas.width / r.width),
    y: (event.clientY - r.top) * (canvas.height / r.height),
  };
}

function trazar(desde, hasta) {
  ctxt.beginPath();
  ctxt.lineCap = 'round';
  ctxt.strokeStyle = erasing ? '#ffffff' : drawColor;
  ctxt.lineWidth = erasing ? 20 : lineWidth;
  ctxt.moveTo(desde.x, desde.y);
  ctxt.lineTo(hasta.x, hasta.y);
  ctxt.stroke();
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


function grosorLinea() {
  lineWidth = this.value;
}

document.getElementById('limpiar-dibujo').addEventListener('click', limpiarLienzo);

document.getElementById('guardar-dibujo').addEventListener('click', () => {
  if (categoriaDestino) {
    console.log("Categoria Destino:", categoriaDestino)
    agregarMuestra(categoriaDestino, miniaturaLienzo());
    //guardarDibujo(categoriaDestino);
    limpiarLienzo();
  }else{
    mostrarDibujoEnPizarra(miniaturaLienzo())
    limpiarLienzo()
  }
});

function miniaturaLienzo(lado = 160) {
  const copia = document.createElement('canvas');
  copia.width = lado;
  copia.height = lado;
  copia.getContext('2d').drawImage(canvas,
                        0, 0, canvas.width, canvas.height,
                        0, 0, lado, lado);
  return copia.toDataURL('image/jpeg', 0.85);
}

/* FOTOS */
const video =document.getElementById('video');
const canvasFoto = document.getElementById('canvas');
const foto = document.getElementById('foto');

const botonTomar = document.getElementById('startbutton');
const botonCerrar = document.getElementById('cerrar-modal');


let stream = null;

// function miniaturaVideo(video, lado = 160) {
//   const copia = document.createElement('canvas');
//   copia.width = lado;
//   copia.height = lado;

//   // Recorte cuadrado centrado, para no deformar la imagen
//   const min = Math.min(video.videoWidth, video.videoHeight);
//   const sx = (video.videoWidth - min) / 2;
//   const sy = (video.videoHeight - min) / 2;

//   copia.getContext('2d').drawImage(video, sx, sy, min, min, 0, 0, lado, lado);
//   return copia.toDataURL('image/jpeg', 0.85);
// }

function miniaturaVideo(fuente, lado = 160) {
  // <video> expone videoWidth/videoHeight; ImageBitmap y canvas usan width/height
  const ancho = fuente.videoWidth || fuente.width;
  const alto = fuente.videoHeight || fuente.height;

  const copia = document.createElement('canvas');
  copia.width = lado;
  copia.height = lado;

  // Recorte cuadrado centrado, para no deformar la imagen
  const min = Math.min(ancho, alto);
  const sx = (ancho - min) / 2;
  const sy = (alto - min) / 2;

  copia.getContext('2d').drawImage(fuente, sx, sy, min, min, 0, 0, lado, lado);
  return copia.toDataURL('image/jpeg', 0.85);
}

function procesarFoto(fotoCapturada) {
  if (categoriaDestino) {
    agregarMuestra(categoriaDestino, fotoCapturada);
  } else {
    mostrarDibujoEnPizarra(fotoCapturada);
  }
}

const camaraDisponible =
  window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

const inputFotoNativa = document.getElementById('inputFotoNativa');

async function iniciarCamara() {
  // Sin HTTPS: no hay vista previa, se usará el input nativo al pulsar "tomar"
  if (!camaraDisponible) {
    video.hidden = true;   // oculta el visor vacío
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });
    video.hidden = false;
    video.srcObject = stream;
    await video.play();
  } catch (error) {
    console.error('Error de cámara:', error);
    alert('No se pudo acceder a la cámara: ' + error.name + ' - ' + error.message);
  }
}

// async function iniciarCamara() {
//   try {
//     if (!navigator.mediaDevices ||
//         !navigator.mediaDevices.getUserMedia) {
//       throw new Error(
//         'La cámara no está disponible. Usa HTTPS o localhost.'
//       );
//     }

//     stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: 'user' },
//         audio: false
//     });

//     video.srcObject = stream;
//     await video.play();

//   } catch (error) {
//       console.error('Error de cámara:', error);

//       alert('No se pudo acceder a la cámara: ' + error.name + ' - ' + error.message);
//   }
// }


botonTomar.addEventListener('click', () => {
  // Respaldo: abrir la cámara nativa del celular
  if (!camaraDisponible) {
    inputFotoNativa.click();
    return;
  }

  try {
    if (!video.videoWidth || !video.videoHeight) {
      alert('La cámara todavía no está lista.');
      return;
    }

    const ctxt = canvasFoto.getContext('2d');
    canvasFoto.width = video.videoWidth;
    canvasFoto.height = video.videoHeight;
    ctxt.drawImage(video, 0, 0, canvasFoto.width, canvasFoto.height);

    procesarFoto(miniaturaVideo(video));
  } catch (error) {
    console.error('Error al agregar la muestra:', error);
    alert('Error al agregar la muestra: ' + error.message);
  }
});

inputFotoNativa.addEventListener('change', async () => {
  const archivo = inputFotoNativa.files[0];
  if (!archivo) return;

  try {
    // 'from-image' corrige la rotación EXIF de las fotos de celular
    const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    procesarFoto(miniaturaVideo(bitmap));
    bitmap.close();
  } catch (error) {
    console.error('Error al procesar la foto:', error);
    alert('Error al procesar la foto: ' + error.message);
  } finally {
    inputFotoNativa.value = '';   // permite repetir la misma foto
  }
});

// botonTomar.addEventListener('click', () => {
//   try {

//     if (!video.videoWidth || !video.videoHeight) {
//       alert('La cámara todavía no está lista.');
//       return;
//     }

//     const ctxt = canvasFoto.getContext('2d');

//     canvasFoto.width = video.videoWidth;
//     canvasFoto.height = video.videoHeight;

//     ctxt.drawImage(
//       video,
//       0,
//       0,
//       canvasFoto.width,
//       canvasFoto.height
//     );

//     //const fotoCapturada = canvasFoto.toDataURL('image/jpeg', 0.9);

//     const fotoCapturada = miniaturaVideo(video)
//     if(categoriaDestino){
//       agregarMuestra(categoriaDestino, fotoCapturada);
//     }else{
//       mostrarDibujoEnPizarra(fotoCapturada)
//     }
    

//   } catch (error) {
//     console.error('Error al agregar la muestra:', error);
//     alert('Error al agregar la muestra: ' + error.message);
//   }
// });


function detenerCamara() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  video.pause();
  video.srcObject = null;
}




//modal.addEventListener('close', detenerCamara);





