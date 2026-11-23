class Modales extends HTMLElement{
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
           <dialog id="modal-muestra" class="modal" aria-labelledby="modal-titulo">
                <p id="modal-titulo" class="modal-titulo">¡Agrega un nuevo dato!</p>

                <div class="modal-panel">
                <button type="button" class="opcion" data-tipo="dibujo">
                    <span class="opcion-icono" aria-hidden="true">
                    <svg><use href="#lapiz" /></svg>
                    </span>
                    <span class="opcion-texto">Dibujo</span>
                </button>

                <button type="button" class="opcion" data-tipo="foto">
                    <span class="opcion-icono" aria-hidden="true">
                    <svg><use href="#camara" /></svg>
                    </span>
                    <span class="opcion-texto">Foto</span>
                </button>

                <button type="button" class="opcion" data-tipo="cargar-foto" id="cargar_imagen">
                    <span class="opcion-icono" aria-hidden="true">
                    <svg><use href="#subir_imagen" /></svg>
                    </span>
                    <span class="opcion-texto">Cargar imágenes</span>
                </button>
                </div>
            </dialog>

            <!-- Modal dibujo -->
            <dialog id="modal-dibujo" class="modal" aria-labelledby="modal-titulo" >
                
                <div class="modal-panel">
                <header class="modal-encabezado">
                    <h1 id="titulo-dibujo"> </h1>

                    <button type="button" class="cerrar-modal"
                            onclick="document.getElementById('modal-dibujo').close()"
                            aria-label="Cerrar">
                        <span class="" aria-hidden="true">
                            <svg class="icono"><use href="#cerrar"></use></svg>
                        </span>
                    </button>
                </header>


                <div class="editor-dibujo">

                    <canvas id="lienzo"></canvas>

                    <aside class="panel-herramientas">
                    <div class="grupo-herramientas">
                        <div class="contenedor-herramientas">
                        <button type="button" class="opcion herramienta-activa"
                                data-herramienta="lapiz" aria-pressed="true">
                            <span class="opcion-icono" aria-hidden="true">
                            <svg class="icono"><use href="#lapiz"></use></svg>
                            </span>
                            <span class="opcion-texto">Lápiz</span>
                        </button>

                        <button type="button" class="opcion"
                                data-herramienta="goma" aria-pressed="false">
                            <span class="opcion-icono" aria-hidden="true">
                            <svg class="icono"><use href="#goma"></use></svg>
                            </span>
                            <span class="opcion-texto">Goma</span>
                        </button>

                        <div class="contenedor-grosor">
                                <i class="ti ti-line-dashed" style="font-size:16px; color:var(--color-text-secondary)" aria-hidden="true"></i>
                                <input id="grosor" type="range" min="7" max="20" value="7"/>
                                <span class="opcion-texto" id="label-grosor">Grosor</span>
                            </div>
                        </div>
                    </div>

                    <div class="contenedor-circulos">
                        <button class="circulo circulo-negro" onclick="changeColor('#000000')"></button>
                        <button class="circulo circulo-rojo" onclick="changeColor('#FF0000')"></button>
                        <button class="circulo circulo-azul" onclick="changeColor('#0B52D6')"></button>
                        <button class="circulo circulo-verde" onclick="changeColor('#21c640')"></button>
                        <button class="circulo circulo-amarillo" onclick="changeColor('#FFD133')"></button>
                        <button class="circulo circulo-violeta" onclick="changeColor('#9d23de')"></button>
                        <button class="circulo circulo-rosa" onclick="changeColor('#e773e0')"></button>
                        <button class="circulo circulo-marron" onclick="changeColor('#89602e')"></button>
                        <button class="circulo circulo-naranja" onclick="changeColor('#FD801A')"></button>
                    </div>
                    </aside>
                </div>
                <div class="acciones-dibujo">
                    <button type="button" id="limpiar-dibujo" class="btn">Limpiar</button>
                    <button type="button" id="guardar-dibujo" class="btn btn-guardar">
                    Guardar dibujo
                    </button>
                </div> 
            </dialog>


            <!-- Modal camara -->
            <dialog id="modal-camara" class="modal" aria-labelledby="modal-titulo" >
                <div class="modal-panel">
                <header class="modal-encabezado">
                    <h1 id="titulo-foto"> </h1>

                    <button type="button" class="cerrar-modal"
                            onclick="document.getElementById('modal-camara').close()"
                            aria-label="Cerrar">
                        <span class="" aria-hidden="true">
                            <svg class="icono"><use href="#cerrar"></use></svg>
                        </span>
                    </button>
                </header>

                <video id="video" autoplay playsinline></video>
                <canvas id="canvas" class="oculto"></canvas>
                <img id="foto" class="oculto" alt="Foto capturada">
                <button id="startbutton" class="btn">Tomar foto</button>
                <input type="file" id="inputFotoNativa" accept="image/*" capture="user" hidden>
                </div>
            </dialog>

            <!-- Modal carga fotos -->
            <dialog id="modal-subir-imagenes" class="modal">
                <div class="modal-panel modal-subida-panel">

                <header class="modal-encabezado">
                    <h2>Agregar imágenes</h2>
                    <button type="button" class="cerrar-modal"
                            onclick="document.getElementById('modal-subir-imagenes').close()"
                            aria-label="Cerrar">
                        <span class="" aria-hidden="true">
                            <svg class="icono"><use href="#cerrar"></use></svg>
                        </span>
                    </button>
                </header>

                <div id="drop-zone" class="zona-arrastre" role="button" tabindex="0"
                    aria-label="Arrastra imágenes aquí">

                    <svg class="icono" aria-hidden="true">
                    <use href="#subir_imagen"></use>
                    </svg>

                    <p><strong>Arrastra tus imágenes aquí</strong></p>

                </div>

                <input
                    type="file"
                    id="fImg"
                    accept="image/*"
                    multiple
                    hidden
                />

                <p id="cantidad-imagenes">No hay imágenes seleccionadas</p>

                <div class="origenes-imagen">
                    <button type="button" id="elegir-dispositivo" class="btn">
                    Mi dispositivo
                    </button>

                    <button type="button" id="elegir-drive" class="btn">
                    Google Drive
                    </button>
                </div>

                <footer class="acciones-subida">
                    <button type="button" id="agregar-imagenes" class="btn" disabled>
                    Agregar imágenes
                    </button>
                </footer>

                </div>
            </dialog>
        `
    }
}

customElements.define('modales-comp', Modales);