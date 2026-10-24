/* ============================================================
   tool-banlist.js — lista de prohibidas, limitadas y semi-limitadas (TCG)
   ============================================================ */

const ToolBan = {
  filter: 'all',    // all | banned | limited | semi
  q: '',
  items: [],

  FILTERS: [
    ['all', 'Todas'], ['banned', 'Prohibidas'], ['limited', 'Limitadas'], ['semi', 'Semi-limitadas'],
  ],

  visible() {
    const q = norm(ToolBan.q);
    const order = { banned: 0, limited: 1, semi: 2 };
    return ToolBan.items
      .filter(c => (ToolBan.filter === 'all' || Ban.status(c) === ToolBan.filter) &&
                   (!q || norm(Card.shownName(c)).includes(q) || norm(c.name).includes(q)))
      .sort((a, b) => order[Ban.status(a)] - order[Ban.status(b)] || Card.shownName(a).localeCompare(Card.shownName(b)));
  },

  drawList() {
    const list = ToolBan.visible();
    ToolBan.shown = list;
    const count = k => ToolBan.items.filter(c => Ban.status(c) === k).length;
    $('ban-msg').textContent =
      `${count('banned')} prohibidas · ${count('limited')} limitadas · ${count('semi')} semi-limitadas` +
      (Ban.fetched ? ' · consultada el ' + new Date(Ban.fetched).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
    $('ban-list').innerHTML = list.length
      ? list.map((c, i) => rowHtml(c, 'ban', i, c.type)).join('')
      : '<p class="muted">Ninguna carta coincide con ese filtro.</p>';
  },

  async load(force) {
    $('ban-list').innerHTML = '<p class="muted">Cargando la lista...</p>';
    try {
      ToolBan.items = await Ban.load(force);
      ToolBan.drawList();
    } catch (e) {
      $('ban-msg').textContent = '';
      $('ban-list').innerHTML = `<div class="empty">${Art.back()}<h3>No pudimos cargar la lista</h3>
        <p>Revisa tu internet e intenta de nuevo.</p><button class="btn" id="ban-retry">Reintentar</button></div>`;
      $('ban-retry').onclick = () => ToolBan.load(true);
    }
  },

  render(el) {
    el.innerHTML = `
      <p class="muted">Lista del TCG según YGOPRODeck. Tu deck avisa cuando tiene más copias de las que permite.</p>
      <div class="chips" id="ban-chips">${ToolBan.FILTERS.map(([k, l]) =>
        `<button class="chip ${ToolBan.filter === k ? 'on' : ''}" data-k="${k}">${l}</button>`).join('')}</div>
      <input type="text" id="ban-q" placeholder="Buscar en la lista" aria-label="Buscar en la lista" value="${esc(ToolBan.q)}">
      <p id="ban-msg" class="muted" style="margin:10px 2px"></p>
      <div id="ban-list"></div>
      <p class="center"><button class="btn sec small" id="ban-refresh">Actualizar lista</button></p>`;
    $('ban-chips').onclick = e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      ToolBan.filter = b.dataset.k;
      el.querySelectorAll('#ban-chips .chip').forEach(x => x.classList.toggle('on', x === b));
      ToolBan.drawList();
    };
    $('ban-q').oninput = e => { ToolBan.q = e.target.value; ToolBan.drawList(); };
    $('ban-refresh').onclick = () => ToolBan.load(true);
    // tocar una carta abre su ficha completa
    $('ban-list').onclick = async e => {
      const r = e.target.closest('.row[data-i]');
      const c = r && ToolBan.shown[+r.dataset.i];
      if (!c) return;
      toast('Abriendo ' + Card.shownName(c) + '...');
      try {
        const full = (await Api.cardsByIds([c.id]))[0];
        if (full) Detail.open(full); else toast('No se pudo abrir la carta');
      } catch (err) { toast('No se pudo abrir la carta'); }
    };
    ToolBan.load(false);
  },
};

Tools.register({
  k: 'ban', icon: '🚫', title: 'Prohibidas y limitadas',
  desc: 'La lista del TCG y qué cartas de tu deck no cumplen.',
  render: ToolBan.render,
});
