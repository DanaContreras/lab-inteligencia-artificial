//Menu

const sidebar    = document.getElementById('sidebar');
const overlay    = document.getElementById('overlay');
const menuToggle = document.getElementById('menu-toggle');
const nivelInput = document.getElementById('nivel');
const nuevo = document.getElementById('nuevo-proyecto');

const nivelLabels = document.querySelectorAll('[data-nivel-label]');

const esDesktop = window.matchMedia('(min-width: 768px)');


// Abre o cierra el panel
function setMenu(abierto) {
  sidebar.dataset.open = String(abierto);
  document.body.dataset.menu = abierto ? 'abierto' : 'cerrado';

  menuToggle.setAttribute('aria-expanded', String(abierto));
  menuToggle.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
}

setMenu(false);

menuToggle.addEventListener('click', () => {
  setMenu(sidebar.dataset.open !== 'true');
});

overlay.addEventListener('click', () => setMenu(false));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMenu(false);
  }
});

esDesktop.addEventListener('change', () => setMenu(false));


// Nivel básico / avanzado
const NIVEL_KEY = 'neurofai:nivel';

function aplicarNivel(avanzado) {
  const nivel = avanzado ? 'avanzado' : 'basico';

  const texto = avanzado ? 'Nivel avanzado' : 'Nivel básico';
  nivelLabels.forEach((el) => { el.textContent = texto; });

  document.body.dataset.nivel = nivel;
  localStorage.setItem(NIVEL_KEY, nivel);
}

nivelInput.addEventListener('change', (event) => {
  aplicarNivel(event.target.checked);
});

const nivelGuardado = localStorage.getItem(NIVEL_KEY) === 'avanzado';
nivelInput.checked = nivelGuardado;
aplicarNivel(nivelGuardado);


// Navegación con flechas
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable]')) return;
  if (document.querySelector('dialog[open]')) return;

  const boton = {
    ArrowLeft: document.querySelector('.boton-anterior'),
    ArrowRight: document.getElementById('siguiente-paso'),
  }[event.key];

  if (boton && !boton.disabled) boton.click();
});



 // Crear nuevo proyecto
if (nuevo) {
    nuevo.addEventListener("click", async () => {
        const proyecto = await crearProyecto("Mi proyecto");

        if (!proyecto) return;

        window.location.href = "./proyecto.html";
        
    });
}




async function crearProyecto(nombre) {
    try {


        const respuesta = await fetch("/api/proyectos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "No se pudo crear el proyecto."
            );
        }

        // Guardar el UID generado por el servidor.
        sessionStorage.setItem(
            "neurofai:proyectoId",
            resultado.proyecto.id
        );

        sessionStorage.setItem(
            "neurofai:proyectoNombre",
            resultado.proyecto.nombre
        );

        return resultado.proyecto;

    } catch (error) {
        console.error("Error al crear el proyecto:", error);
        alert(error.message || "No se pudo crear el proyecto.");
        return null;
    }
}
