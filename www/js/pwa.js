/* ============================================================
   pwa.js — instalación como app y sin conexión
   ============================================================ */

const Pwa = {
  prompt: null,   // evento de instalación que ofrece Chrome/Edge en Android y escritorio

  // Dentro del APK (Capacitor) los archivos ya viven en el teléfono
  native: () => !!window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function'
    ? window.Capacitor.isNativePlatform() : !!window.Capacitor,

  // La app instalada se abre sin barra del navegador
  standalone: () => Pwa.native() ||
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,

  // Solo funciona publicada en internet (https); abierta como archivo no hay service worker
  supported: () => 'serviceWorker' in navigator && /^https?:$/.test(location.protocol),

  init() {
    // en el APK no hace falta el service worker
    if (Pwa.supported() && !Pwa.native()) navigator.serviceWorker.register('sw.js').catch(() => {});
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      Pwa.prompt = e;
      if (!$('pg-profile').classList.contains('hide')) ProfileUI.render();
    });
    window.addEventListener('appinstalled', () => {
      Pwa.prompt = null;
      toast('App instalada');
      if (!$('pg-profile').classList.contains('hide')) ProfileUI.render();
    });
  },

  async install() {
    if (!Pwa.prompt) return;
    Pwa.prompt.prompt();
    await Pwa.prompt.userChoice.catch(() => {});
    Pwa.prompt = null;
    if (!$('pg-profile').classList.contains('hide')) ProfileUI.render();
  },

  // Bloque de la pestaña Duelista
  html() {
    if (Pwa.standalone()) return '<p class="muted">Ya estás usando Duel Codex como app instalada.</p>';
    if (Pwa.prompt) return '<button class="btn" id="pwa-install">Instalar app</button>';
    if (!Pwa.supported()) {
      return '<p class="muted">Para instalarla en el celular primero hay que publicar la carpeta en internet. Los pasos están en el README.</p>';
    }
    return `<p class="muted">En Android con Chrome: abre el menú ⋮ y toca Instalar app o Agregar a la pantalla de inicio.
      En iPhone con Safari: toca Compartir y después Agregar a pantalla de inicio.</p>`;
  },
};
