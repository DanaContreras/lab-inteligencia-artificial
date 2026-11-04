document.currentScript.insertAdjacentHTML('beforebegin', `
  <button id="menu-toggle"
          type="button"
          class="boton-menu"
          aria-label="Abrir menú"
          aria-expanded="false"
          aria-controls="sidebar">
    <span aria-hidden="true" class="boton-menu-linea"></span>
    <span aria-hidden="true" class="boton-menu-linea"></span>
    <span aria-hidden="true" class="boton-menu-linea"></span>
  </button>

  <div id="overlay" class="fondo-oscuro"></div>

  <aside id="sidebar" class="panel" data-open="false">
    <h1 class="panel-marca">NeuroFAI</h1>

    <div class="nivel">
      <label class="interruptor">
        <input type="checkbox"
               id="nivel"
               class="interruptor-input"
               aria-label="Activar nivel avanzado">
        <span aria-hidden="true" class="interruptor-pista"></span>
        <span aria-hidden="true" class="interruptor-perilla"></span>
      </label>
      <p class="nivel-texto" aria-live="polite">
        <span data-nivel-label>Nivel básico</span>
      </p>
    </div>

    <nav class="panel-nav">
      <a href="./index.html" class="enlace-menu">Inicio</a>
      <a href="./proyectos.html" class="enlace-menu">Proyectos</a>
      <a href="./tutorial.html" class="enlace-menu">Tutorial</a>
    </nav>

    <a href="./sobre-nosotros.html" class="enlace-menu panel-pie">Acerca de nosotros</a>
  </aside>
`);

{
  const pagina = location.pathname.split('/').pop() || 'index.html';
  document.querySelector(`#sidebar a[href="./${pagina}"]`)?.setAttribute('aria-current', 'page');
}
