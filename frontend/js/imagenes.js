const inputImagenes = document.getElementById("fImg");
const botonElegirDispositivo = document.getElementById("elegir-dispositivo");
const zonaArrastre = document.getElementById("drop-zone");
const botonAgregarImagenes = document.getElementById("agregar-imagenes");
const botonCancelarSubida = document.getElementById("cancelar-subida");
const botonCerrarSubida = document.getElementById("cerrar-subida");

let imagenesSeleccionadas = [];


botonElegirDispositivo.addEventListener("click", () => {
    inputImagenes.click();
});

// Procesar archivos seleccionados
function procesarImagenes(archivos) {
    const imagenes = Array.from(archivos).filter(archivo =>
        archivo.type.startsWith("image/")
    );

    imagenesSeleccionadas = [
        ...imagenesSeleccionadas,
        ...imagenes
    ];

    botonAgregarImagenes.disabled =
        imagenesSeleccionadas.length === 0;
}

// Selección con el explorador de archivos
inputImagenes.addEventListener("change", () => {
    procesarImagenes(inputImagenes.files);
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
        procesarImagenes(evento.dataTransfer.files);
    }
});

// Convertir archivo a imagen que pueda utilizar agregarMuestra()
function leerImagen(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();

        lector.onload = () => resolve(lector.result);
        lector.onerror = () => reject(lector.error);

        lector.readAsDataURL(archivo);
    });
}

// Agregar imágenes a la categoría
botonAgregarImagenes.addEventListener("click", async () => {

    if (imagenesSeleccionadas.length === 0) return;

    botonAgregarImagenes.disabled = true;

    try {
        for (const archivo of imagenesSeleccionadas) {
            const imagen = await leerImagen(archivo);
            agregarMuestra(categoriaDestino, imagen);
        }

        imagenesSeleccionadas = [];
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

botonCancelarSubida.addEventListener("click", cerrarModalSubida);
botonCerrarSubida.addEventListener("click", cerrarModalSubida);