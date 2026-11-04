
const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const app = express();
const PUERTO = 3000;

const carpetaBackend = __dirname;
const carpetaFrontend = path.join(__dirname, "..", "frontend");
const carpetaProyectos = path.join(carpetaBackend, "proyectos");


app.use(express.static(carpetaFrontend));

app.use(express.json({ limit: "50mb" }));



app.post("/api/proyectos/:id/entrenar", async (req, res) => {
    try {
        const { id } = req.params;
        const { datos } = req.body;

        if (
            !Array.isArray(datos) ||
            datos.length < 2
        ) {
            return res.status(400).json({
                error: "Se necesitan al menos dos categorías."
            });
        }

        // Localizar el proyecto existente.
        const carpetaProyecto = path.join(
            carpetaProyectos,
            id
        );

        const rutaProyecto = path.join(
            carpetaProyecto,
            "proyecto.json"
        );

        let proyecto;

        try {
            proyecto = JSON.parse(
                await fs.readFile(rutaProyecto, "utf8")
            );
        } catch {
            return res.status(404).json({
                error: "No se encontró el proyecto."
            });
        }

        const { categoriasGuardadas, totalImagenes } =
            await guardarDataset(carpetaProyecto, datos);

        const carpetaDataset = path.join(
            carpetaProyecto,
            "dataset"
        );

        // Actualizar los metadatos del proyecto.
        proyecto.categorias = categoriasGuardadas;
        proyecto.fechaModificacion = new Date().toISOString();

        await fs.writeFile(
            rutaProyecto,
            JSON.stringify(proyecto, null, 2),
            "utf8"
        );

        // Ejecutar el entrenamiento Python.
        const carpetaModelo = path.join(
            carpetaProyecto,
            "modelos"
        );

        await fs.mkdir(carpetaModelo, {
            recursive: true
        });

        const scriptPython = path.join(
            __dirname,
            "/modelos/entrenar.py"
        );

        const resultadoPython = await new Promise(
            (resolve, reject) => {
                const proceso = spawn(
                    process.env.PYTHON || "python",
                    [
                        scriptPython,
                        carpetaDataset,
                        carpetaModelo
                    ],
                    { cwd: __dirname }
                );

                let salida = "";
                let errores = "";

                proceso.stdout.on("data", (dato) => {
                    salida += dato.toString();
                });

                proceso.stderr.on("data", (dato) => {
                    errores += dato.toString();
                });

                proceso.on("error", reject);

                proceso.on("close", (codigo) => {
                    if (codigo === 0) {
                        resolve(salida);
                    } else {
                        reject(
                            new Error(
                                errores || `Python terminó con código ${codigo}`
                            )
                        );
                    }
                });
            }
        );

        return res.status(200).json({
            mensaje: "Imágenes guardadas y entrenamiento finalizado.",
            totalImagenes,
            categorias: categoriasGuardadas,
            resultado: resultadoPython
        });

    } catch (error) {
        console.error("Error al procesar el dataset:", error);

        return res.status(500).json({
            error: error.message || "No se pudo procesar el dataset."
        });
    }
});

function validarCategoria(categoria) {
    return (
        typeof categoria === "string" &&
        categoria.trim().length > 0 &&
        categoria.trim().length <= 50 &&
        /^[\p{L}\p{N} _-]+$/u.test(categoria.trim())
    );
}

async function guardarDataset(carpetaProyecto, datos) {
    const carpetaDataset = path.join(
        carpetaProyecto,
        "dataset"
    );

    // Evitar que queden imágenes de una exportación anterior.
    await fs.rm(carpetaDataset, {
        recursive: true,
        force: true
    });

    await fs.mkdir(carpetaDataset, {
        recursive: true
    });

    const categoriasGuardadas = [];
    const nombresUsados = new Set();
    let totalImagenes = 0;

    for (const categoria of datos) {
        const nombre = categoria.nombre?.trim();

        if (
            !validarCategoria(nombre) ||
            nombresUsados.has(nombre.normalize("NFC")) ||
            !Array.isArray(categoria.muestras) ||
            categoria.muestras.length === 0
        ) {
            throw new Error(
                "Categoría inválida, repetida o sin muestras."
            );
        }

        nombresUsados.add(nombre.normalize("NFC"));

        const nombreCategoria = nombre.normalize("NFC");
        const carpetaCategoria = path.join(
            carpetaDataset,
            nombreCategoria
        );

        await fs.mkdir(carpetaCategoria, {
            recursive: true
        });

        let numero = 0;

        for (const imagen of categoria.muestras) {
            numero++;

            const png = /^data:image\/png;base64,(.+)$/.exec(imagen);

            if (!png) {
                throw new Error("Muestra inválida: se esperaba una imagen PNG.");
            }

            const buffer = Buffer.from(png[1], "base64");

            const nombreArchivo =
                `muestra_${String(numero).padStart(4, "0")}.png`;

            await fs.writeFile(
                path.join(carpetaCategoria, nombreArchivo),
                buffer,
                { flag: "wx" }
            );

            totalImagenes++;
        }

        categoriasGuardadas.push({
            nombre: nombreCategoria,
            cantidad: numero
        });
    }

    return { categoriasGuardadas, totalImagenes };
}

function validarNombreProyecto(nombre) {
    return (
        typeof nombre === "string" &&
        nombre.trim().length > 0 &&
        nombre.trim().length <= 50
    );
}

async function leerProyecto(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

    const carpeta = path.join(carpetaProyectos, id);
    const ruta = path.join(carpeta, "proyecto.json");

    try {
        const proyecto = JSON.parse(await fs.readFile(ruta, "utf8"));
        return { proyecto, carpeta, ruta };
    } catch {
        return null;
    }
}

app.get("/api/proyectos", async (req, res) => {
    try {
        const entradas = await fs.readdir(carpetaProyectos, {
            withFileTypes: true
        }).catch((error) => {
            if (error.code === "ENOENT") return [];
            throw error;
        });

        const leidos = await Promise.all(
            entradas
                .filter((entrada) => entrada.isDirectory())
                .map((entrada) => leerProyecto(entrada.name))
        );

        const proyectos = leidos
            .filter(Boolean)
            .map((leido) => leido.proyecto)
            .sort((a, b) =>
                b.fechaModificacion.localeCompare(a.fechaModificacion)
            );

        return res.json({ proyectos });

    } catch (error) {
        console.error("Error al listar los proyectos:", error);

        return res.status(500).json({
            error: "No se pudieron cargar los proyectos."
        });
    }
});

app.get("/api/proyectos/:id", async (req, res) => {
    try {
        const leido = await leerProyecto(req.params.id);

        if (!leido) {
            return res.status(404).json({
                error: "No se encontró el proyecto."
            });
        }

        const datos = [];

        for (const { nombre } of leido.proyecto.categorias) {
            const carpetaCategoria = path.join(
                leido.carpeta,
                "dataset",
                nombre
            );

            const archivos = (await fs.readdir(carpetaCategoria))
                .filter((archivo) => archivo.endsWith(".png"))
                .sort();

            const muestras = await Promise.all(
                archivos.map(async (archivo) => {
                    const contenido = await fs.readFile(
                        path.join(carpetaCategoria, archivo)
                    );

                    return `data:image/png;base64,${contenido.toString("base64")}`;
                })
            );

            datos.push({ nombre, muestras });
        }

        return res.json({ proyecto: leido.proyecto, datos });

    } catch (error) {
        console.error("Error al abrir el proyecto:", error);

        return res.status(500).json({
            error: "No se pudo abrir el proyecto."
        });
    }
});

app.patch("/api/proyectos/:id", async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!validarNombreProyecto(nombre)) {
            return res.status(400).json({
                error: "El nombre debe tener entre 1 y 50 caracteres."
            });
        }

        const leido = await leerProyecto(req.params.id);

        if (!leido) {
            return res.status(404).json({
                error: "No se encontró el proyecto."
            });
        }

        leido.proyecto.nombre = nombre.trim();
        leido.proyecto.fechaModificacion = new Date().toISOString();

        await fs.writeFile(
            leido.ruta,
            JSON.stringify(leido.proyecto, null, 2),
            "utf8"
        );

        return res.json({ proyecto: leido.proyecto });

    } catch (error) {
        console.error("Error al renombrar el proyecto:", error);

        return res.status(500).json({
            error: "No se pudo renombrar el proyecto."
        });
    }
});

app.post("/api/proyectos/importar", async (req, res) => {
    const { nombre, datos = [] } = req.body;

    if (!validarNombreProyecto(nombre) || !Array.isArray(datos)) {
        return res.status(400).json({
            error: "El archivo no contiene un proyecto válido."
        });
    }

    const id = crypto.randomUUID();
    const carpetaProyecto = path.join(carpetaProyectos, id);

    try {
        await fs.mkdir(carpetaProyecto, { recursive: true });

        const { categoriasGuardadas } =
            await guardarDataset(carpetaProyecto, datos);

        const fechaActual = new Date().toISOString();

        const proyecto = {
            version: 1,
            id,
            nombre: nombre.trim(),
            fechaCreacion: fechaActual,
            fechaModificacion: fechaActual,
            categorias: categoriasGuardadas
        };

        await fs.writeFile(
            path.join(carpetaProyecto, "proyecto.json"),
            JSON.stringify(proyecto, null, 2),
            "utf8"
        );

        return res.status(201).json({ proyecto });

    } catch (error) {
        console.error("Error al importar el proyecto:", error);

        await fs.rm(carpetaProyecto, { recursive: true, force: true });

        return res.status(400).json({
            error: "El archivo no contiene un proyecto válido."
        });
    }
});

app.post("/api/proyectos", async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!validarNombreProyecto(nombre)) {
            return res.status(400).json({
                error: "El nombre debe tener entre 1 y 50 caracteres."
            });
        }

        const nombreProyecto = nombre.trim();

        // Generar un identificador único.
        const idProyecto = crypto.randomUUID();

        // Crear la carpeta del proyecto.
        const carpetaProyecto = path.join(
            carpetaProyectos,
            idProyecto
        );

        await fs.mkdir(carpetaProyecto, {
            recursive: true
        });

        // Definir los datos iniciales del proyecto.
        const fechaActual = new Date().toISOString();

        const proyecto = {
            version: 1,
            id: idProyecto,
            nombre: nombreProyecto,
            fechaCreacion: fechaActual,
            fechaModificacion: fechaActual,
            categorias: []
        };

        // Guardar los datos en proyecto.json.
        const rutaArchivo = path.join(
            carpetaProyecto,
            "proyecto.json"
        );

        await fs.writeFile(
            rutaArchivo,
            JSON.stringify(proyecto, null, 2),
            {
                encoding: "utf8",
                flag: "wx"
            }
        );

        // Informar que el proyecto se creó correctamente.
        return res.status(201).json({
            mensaje: "Proyecto creado correctamente.",
            proyecto: proyecto
        });

    } catch (error) {
        console.error("Error al crear el proyecto:", error);

        return res.status(500).json({
            error: "No se pudo crear el proyecto."
        });
    }
});



app.get("/", (req, res) => {
    res.sendFile(path.join(carpetaFrontend, "index.html"));
});


app.use((err, req, res, next) => {
    if (err.type === "request.aborted") {
        console.error("La petición se interrumpió:", {
            url: req.url,
            codigo: err.code,
            esperado: err.expected,
            recibido: err.received
        });

        if (!res.headersSent && !res.destroyed) {
            return res.status(400).json({
                error: "El envío de datos se interrumpió. Intenta de nuevo."
            });
        }

        return;
    }

    next(err);
});

app.listen(PUERTO, () => {
    console.log(
        `Servidor iniciado en http://localhost:${PUERTO}`
    );
});

