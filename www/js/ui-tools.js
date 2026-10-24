/* ============================================================
   ui-tools.js — pestaña "Herramientas": menú y navegación
   Cada herramienta vive en su propio archivo (tool-*.js) y se
   registra aquí con Tools.register({ k, icon, title, desc, render }).
   ============================================================ */

const Tools = {
  list: [],
  sub: null,     // herramienta abierta (null = menú)

  register(t) { Tools.list.push(t); },

  hub() {
    Tools.sub = null;
    $('pg-tools').innerHTML = `
      <h1 class="pg-title">Herramientas</h1>
      <p class="muted">Para armar, probar y jugar tus duelos.</p>
      <div class="tiles">${Tools.list.map(t =>
        `<button class="tile" data-k="${t.k}"><span class="ti" aria-hidden="true">${t.icon}</span><b>${t.title}</b><small>${t.desc}</small></button>`).join('')}</div>`;
    $('pg-tools').onclick = e => { const b = e.target.closest('.tile'); if (b) Tools.open(b.dataset.k); };
    window.scrollTo(0, 0);
  },

  open(k, push = true) {
    const t = Tools.list.find(x => x.k === k);
    if (!t) return;
    Tools.sub = k;
    $('pg-tools').onclick = null;
    $('pg-tools').innerHTML = `
      <button class="btn sec small" id="tool-back">← Herramientas</button>
      <h1 class="pg-title">${t.title}</h1>
      <div id="tool-body"></div>`;
    $('tool-back').onclick = Tools.back;
    t.render($('tool-body'));
    // el botón "atrás" del celular regresa al menú en lugar de cerrar la app
    if (push) { try { history.pushState({ t: 1 }, ''); } catch (e) { /* sin historial */ } }
    window.scrollTo(0, 0);
  },

  back() {
    if (history.state && history.state.t) history.back();
    else Tools.hub();
  },

  // Desde otras pestañas (por ejemplo, el botón "Probar manos" del deck)
  openFromElsewhere(k) {
    show('tools');
    Tools.open(k);
  },
};
