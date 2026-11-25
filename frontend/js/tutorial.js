// Índice
const enlacesIndice = [...document.querySelectorAll('.indice a')];
const temas = [...document.querySelectorAll('.apartado, .tema, .recuadro')];

function marcarIndice() {
  const limite = 96;
  const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  const actual = alFinal
    ? temas.at(-1)
    : temas.findLast((t) => t.getBoundingClientRect().top <= limite) ?? temas[0];
  const apartado = actual.closest('.apartado') ?? actual;

  for (const enlace of enlacesIndice) {
    const destino = enlace.hash.slice(1);
    if (destino === actual.id || destino === apartado.id) {
      enlace.setAttribute('aria-current', 'true');
    } else {
      enlace.removeAttribute('aria-current');
    }
  }
}

window.addEventListener('scroll', marcarIndice, { passive: true });
marcarIndice();
