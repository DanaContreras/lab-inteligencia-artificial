const inputImagenes = document.getElementById("fImg");
const botonElegirDispositivo = document.getElementById("elegir-dispositivo");
const zonaArrastre = document.getElementById("drop-zone");
const botonAgregarImagenes = document.getElementById("agregar-imagenes");
const botonCancelarSubida = document.getElementById("cancelar-subida");
const botonCerrarSubida = document.getElementById("cerrar-subida");
const cantidadImagenes = document.getElementById("cantidad-imagenes");

let imagenesSeleccionadas = [];


botonElegirDispositivo.addEventListener("click", () => {
    inputImagenes.click();
});

// Procesar archivos seleccionados
function procesarImagenes(archivos) {
    const imagenes = Array.from(archivos).filter(archivo =>
        archivo.type.startsWith("image/")
    );

    if(categoriaDestino){
        imagenesSeleccionadas = [
            ...imagenesSeleccionadas,
            ...imagenes
        ];
    }else{
        imagenesSeleccionadas = [imagenes[0]]
    }

    botonAgregarImagenes.disabled = imagenesSeleccionadas.length === 0;
}

// Selección con el explorador de archivos
inputImagenes.addEventListener("change", () => {
    const nuevasImagenes = Array.from(inputImagenes.files);

    procesarImagenes(nuevasImagenes);

    const cantidad = imagenesSeleccionadas.length;

    if (cantidad === 0) {
        cantidadImagenes.textContent = "No hay imágenes seleccionadas";
    } else if (cantidad === 1) {
        cantidadImagenes.textContent = "Se seleccionó 1 imagen";
    } else {
        cantidadImagenes.textContent = `Se seleccionaron ${cantidad} imágenes`;
    }

    inputImagenes.value = "";
    
});

// Permitir arrastrar imágenes
zonaArrastre.addEventListener("dragenter", evento => {
    evento.preventDefault();
    zonaArrastre.classList.add("arrastrando");
});

zonaArrastre.addEventListener("dragover", evento => {
    evento.preventDefault();
});

zonaArrastre.addEventListener("dragleave", evento => {
    evento.preventDefault();

    if (!zonaArrastre.contains(evento.relatedTarget)) {
        zonaArrastre.classList.remove("arrastrando");
    }
});

zonaArrastre.addEventListener("drop", evento => {
    evento.preventDefault();
    zonaArrastre.classList.remove("arrastrando");

    if (evento.dataTransfer) {
        const nuevasImagenes = Array.from(evento.dataTransfer.files);
        procesarImagenes(nuevasImagenes);

        const cantidad = imagenesSeleccionadas.length;

        if (cantidad === 0) {
            cantidadImagenes.textContent = "No hay imágenes seleccionadas";
        } else if (cantidad === 1) {
            cantidadImagenes.textContent = "Se seleccionó 1 imagen";
        } else {
            cantidadImagenes.textContent = `Se seleccionaron ${cantidad} imágenes`;
        }
    }
});

// // Convertir archivo a imagen que pueda utilizar agregarMuestra()
// function leerImagen(archivo) {
//     return new Promise((resolve, reject) => {
//         const lector = new FileReader();

//         lector.onload = () => resolve(lector.result);
//         lector.onerror = () => reject(lector.error);

//         lector.readAsDataURL(archivo);
//     });
// }



async function leerImagen(archivo, lado = 160) {
    // createImageBitmap respeta la orientación EXIF de las fotos de celular
    const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });

    const canvas = document.createElement("canvas");
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext("2d");

    // Fondo blanco: los PNG transparentes saldrían negros al convertir a JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lado, lado);

    // Recorte cuadrado centrado, para no deformar la imagen
    const min = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - min) / 2;
    const sy = (bitmap.height - min) / 2;

    ctx.drawImage(bitmap, sx, sy, min, min, 0, 0, lado, lado);
    bitmap.close();

    return canvas.toDataURL("image/jpeg", 0.85);
}

// Agregar imágenes a la categoría
botonAgregarImagenes.addEventListener("click", async () => {

    if (imagenesSeleccionadas.length === 0) return;
    console.log("Se seleccionaron imagenes: ", imagenesSeleccionadas.length)

    botonAgregarImagenes.disabled = true;

    try {
        console.log("CARGANDO DATOS PARA ENTRENAR")
        if(categoriaDestino){
            for (const archivo of imagenesSeleccionadas) {
                const imagen = await leerImagen(archivo);
                agregarMuestra(categoriaDestino, imagen);
            }
        }else{
            const imagen = await leerImagen(imagenesSeleccionadas[0]);
            await mostrarDibujoEnPizarra(imagen);
        }
        
        imagenesSeleccionadas = [];
        cantidadImagenes.textContent = "No hay imágenes seleccionadas";
        cerrarModalSubida();

    } catch (error) {
        console.error("Error al cargar imágenes:", error);
        alert("Ocurrió un error al cargar las imágenes.");
        botonAgregarImagenes.disabled = imagenesSeleccionadas.length === 0;
    }
});



function cerrarModalSubida() {
    if (modalSubida.open) {
        modalSubida.close();
    }

    imagenesSeleccionadas = [];
    inputImagenes.value = "";
    botonAgregarImagenes.disabled = true;
    zonaArrastre.classList.remove("arrastrando");
}

//botonCancelarSubida.addEventListener("click", cerrarModalSubida);
//botonCerrarSubida.addEventListener("click", cerrarModalSubida);
