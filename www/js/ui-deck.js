/* ============================================================
   ui-deck.js — pestaña "Mi deck": varios decks, resumen y lista
   ============================================================ */

const DeckUI = {
  panel: false,    // panel "Mis decks" abierto
  mode: null,      // null | 'new' | 'rename'
  filter: '',      // búsqueda por nombre

  // "Mano" de cartas abierta en abanico con las más valiosas del deck
  fan() {
    const uniq = [...new Map(Deck.cards.map(c => [c.id, c])).values()]
      .sort((a, b) => Card.price(b) - Card.price(a)).slice(0, 7);
    const mid = (uniq.length - 1) / 2;
    return uniq.map((c, i) => {
      const d = i - mid;
      return `<img src="${esc(Card.imgSmall(c))}" alt="" style="--rot:${(d * 7).toFixed(1)}deg;--y:${(Math.abs(d) * 4).toFixed(1)}px">`;
    }).join('');
  },

  panelHtml() {
    const q = norm(DeckUI.filter);
    const list = Deck.decks.filter(d => !q || norm(d.name).includes(q));
    const price = d => d.cards.reduce((s, c) => s + Card.price(c), 0);
    const form = DeckUI.mode ? `<div class="deckform">
        <input type="text" id="deck-name" maxlength="30" placeholder="Nombre del deck" aria-label="Nombre del deck"
          value="${DeckUI.mode === 'rename' ? esc(Deck.name()) : ''}">
        <button class="btn" id="deck-ok">Guardar</button>
        <button class="btn sec" id="deck-cancel">Cancelar</button></div>` : '';
    return `<div class="decks-panel">
      ${Deck.decks.length > 4 ? `<input type="text" id="deck-q" placeholder="Buscar deck por nombre" aria-label="Buscar deck" value="${esc(DeckUI.filter)}">` : ''}
      ${list.map(d => `<div class="row deck-row ${d.id === Deck.activeId ? 'sel' : ''}" data-id="${d.id}" role="button" tabindex="0">
          <div class="t"><b>${esc(d.name)}</b><small>${d.cards.length} carta${d.cards.length === 1 ? '' : 's'} · $${price(d).toFixed(2)}</small></div>
          ${d.id === Deck.activeId ? '<span class="tag">En uso</span>' : ''}</div>`).join('')
        || '<p class="muted">Ningún deck tiene ese nombre.</p>'}
      ${form}
      <div class="actions">
        <button class="btn sec small" id="deck-new">Nuevo deck</button>
        <button class="btn sec small" id="deck-dup">Duplicar</button>
        <button class="btn sec small" id="deck-ren">Renombrar</button>
        ${Deck.decks.length > 1 ? '<button class="btn sec small" id="deck-del">Eliminar</button>' : ''}
      </div></div>`;
  },

  render() {
    const m = Deck.main(), e = Deck.extra();
    const head = `<div class="deck-head">
        <h1 class="pg-title">${esc(Deck.name())}</h1>
        <button class="btn sec small" id="deck-toggle" aria-expanded="${DeckUI.panel}">Mis decks (${Deck.decks.length})</button>
      </div>${DeckUI.panel ? DeckUI.panelHtml() : ''}`;

    if (!Deck.cards.length) {
      $('pg-deck').innerHTML = head + `<div class="empty" style="padding-top:36px">${Art.back()}
        <h3>Este deck está vacío</h3>
        <p>Abre una carta y toca Agregar al deck. Aquí verás el total, el precio y consejos para mejorarlo.</p>
        <button class="btn" id="go-explore">Explorar cartas</button>
        <button class="btn sec" id="deck-io" style="margin-left:6px">Importar un deck</button></div>`;
      DeckUI.bind();
      return;
    }

    const top = [...Deck.cards].sort((a, b) => Card.price(b) - Card.price(a))[0];
    const mon = m.filter(Card.isMonster).length, sp = m.filter(Card.isSpell).length, tr = m.filter(Card.isTrap).length;
    const pct = n => m.length ? (n / m.length * 100).toFixed(1) : 0;

    const group = (title, list) => {
      if (!list.length) return '';
      const uniq = [...new Map(list.map(c => [c.id, c])).values()];
      return `<h2>${title}</h2>` + uniq.map((c, i) =>
        `<div class="row" data-src="${title}" data-i="${i}" style="--fc:${Card.frame(c).color}">
          <img src="${esc(Card.imgSmall(c))}" alt="">
          <div class="t"><b>${esc(Card.shownName(c))}</b><small>×${Deck.copies(c)} · ${esc(c.type)}</small></div>
          ${Deck.copies(c) > Deck.max(c) ? '<span class="ban b0">Sobran copias</span>' : Ban.badge(c)}
          <button class="btn sec small rm" data-id="${c.id}" aria-label="Quitar una copia de ${esc(Card.shownName(c))}">−</button></div>`).join('');
    };

    $('pg-deck').innerHTML = head + `
      <div class="deck-hero" style="--art:url('${esc(Card.art(top))}')">
        <div class="muted">Main ${m.length}/${CONFIG.MAIN_MAX} · Extra ${e.length}/${CONFIG.EXTRA_MAX} · Precio estimado $${Deck.total().toFixed(2)}</div>
        <div class="fan" aria-hidden="true">${DeckUI.fan()}</div>
        <div class="progress" aria-hidden="true"><i style="width:${Math.min(100, m.length / 40 * 100)}%"></i></div>
        <div class="muted small">${m.length >= 40 ? 'Ya llegaste al mínimo de 40 cartas.' : 'Faltan ' + (40 - m.length) + ' cartas para el mínimo de 40.'}</div>
        ${m.length ? `<div class="comp" aria-hidden="true">
          <i style="width:${pct(mon)}%;background:var(--f-effect)"></i><i style="width:${pct(sp)}%;background:var(--f-spell)"></i><i style="width:${pct(tr)}%;background:var(--f-trap)"></i></div>
          <div class="legend"><span style="--c:var(--f-effect)">${mon} monstruos</span><span style="--c:var(--f-spell)">${sp} hechizos</span><span style="--c:var(--f-trap)">${tr} trampas</span></div>` : ''}
        <div class="advice">${Deck.advice().map(t => `<div>• ${esc(t)}</div>`).join('')}</div>
      </div>
      <div class="actions" style="margin:12px 0 0">
        <button class="btn sec small" id="deck-hand">Probar manos</button>
        <button class="btn sec small" id="deck-io">Importar o exportar</button>
        <button class="btn sec small" id="deck-refresh">Actualizar precios y lista</button>
      </div>
      ${group('Main Deck', m)}${group('Extra Deck', e)}
      <p><button class="btn sec" id="clear">Vaciar deck</button></p>`;
    DeckUI.bind();
  },

  bind() {
    const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
    on('deck-toggle', () => { DeckUI.panel = !DeckUI.panel; DeckUI.mode = null; DeckUI.render(); });
    on('go-explore', () => show('search'));
    on('deck-io', () => Tools.openFromElsewhere('deckio'));
    on('deck-hand', () => Tools.openFromElsewhere('hand'));
    on('deck-new', () => { DeckUI.mode = 'new'; DeckUI.render(); $('deck-name').focus(); });
    on('deck-ren', () => { DeckUI.mode = 'rename'; DeckUI.render(); $('deck-name').focus(); });
    on('deck-cancel', () => { DeckUI.mode = null; DeckUI.render(); });
    on('deck-ok', () => {
      const name = $('deck-name').value;
      if (DeckUI.mode === 'new') Deck.create(name); else Deck.rename(name);
      DeckUI.mode = null; DeckUI.panel = false; DeckUI.render(); Hero.refreshText();
      toast('Deck guardado');
    });
    on('deck-dup', () => { Deck.duplicate(); DeckUI.panel = false; DeckUI.render(); toast('Deck duplicado'); });
    on('deck-del', () => {
      if (confirm('¿Eliminar el deck «' + Deck.name() + '»?')) { Deck.remove(Deck.activeId); DeckUI.render(); Hero.refreshText(); }
    });
    on('deck-refresh', async () => {
      const b = $('deck-refresh'); b.disabled = true; b.textContent = 'Actualizando...';
      try {
        const n = await Deck.refresh();
        toast(n ? 'Precios y lista actualizados (' + n + ' cartas)' : 'No se pudo actualizar. Revisa tu internet.');
      } catch (e) { toast('No se pudo actualizar. Revisa tu internet.'); }
      DeckUI.render();
    });
    on('clear', () => { if (confirm('¿Vaciar todo el deck?')) { Deck.clear(); DeckUI.render(); Hero.refreshText(); } });

    const q = $('deck-q');
    if (q) q.oninput = e => {
      DeckUI.filter = e.target.value; DeckUI.render();
      const nq = $('deck-q'); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length);
    };
    document.querySelectorAll('#pg-deck .deck-row').forEach(r => {
      const pick = () => { Deck.switchTo(r.dataset.id); DeckUI.panel = false; DeckUI.render(); Hero.refreshText(); };
      r.onclick = pick;
      r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
    });
    document.querySelectorAll('#pg-deck .rm').forEach(b => b.onclick = ev => {
      ev.stopPropagation();
      Deck.removeOne(b.dataset.id);
      DeckUI.render();
    });
    const m = Deck.main(), e = Deck.extra();
    document.querySelectorAll('#pg-deck .row[data-src]').forEach(r => r.onclick = () => {
      const list = r.dataset.src === 'Main Deck' ? m : e;
      const uniq = [...new Map(list.map(c => [c.id, c])).values()];
      Detail.open(uniq[+r.dataset.i]);
    });
  },
};
