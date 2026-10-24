/* ============================================================
   ui-explore.js — página principal: explorar y buscar cartas
   ============================================================ */

const Explore = {
  chip: null,          // categoría activa (null cuando se está buscando)
  offset: 0,
  done: false,
  loading: false,
  items: [],
  archList: [],        // arquetipos disponibles (también los usa el perfil)

  /* ---------- Categorías ---------- */

  // Si el usuario tiene arquetipo favorito, aparece «Para ti» al principio
  chipList() {
    const fav = Profile.data.favArch;
    return fav ? [{ k: 'foryou', label: '💫 Para ti', p: { archetype: fav } }, ...CHIPS] : CHIPS;
  },
  chipDef(k) { return Explore.chipList().find(c => c.k === k) || CHIPS[0]; },
  defaultChip() { return Profile.data.favArch ? 'foryou' : 'staple'; },

  renderChips() {
    $('chips').innerHTML = Explore.chipList().map(c =>
      `<button class="chip ${Explore.chip === c.k ? 'on' : ''}" data-k="${c.k}">${c.label}</button>`).join('');
  },

  pickChip(k) {
    State.mode = 'browse';
    $('q').value = '';
    Explore.chip = k;
    Explore.renderChips();
    Explore.load(true);
  },

  params() {
    const def = Explore.chipDef(Explore.chip);
    const sp = new URLSearchParams(def.p || {});
    if ($('f-arch').value) sp.set('archetype', $('f-arch').value);
    if ($('f-attr').value) sp.set('attribute', $('f-attr').value);
    sp.set('misc', 'yes');
    sp.set('num', CONFIG.PAGE);
    sp.set('offset', Explore.offset);
    return sp;
  },

  /* ---------- Estados de la lista ---------- */

  skeleton() {
    $('results').innerHTML = '<div class="grid">' +
      Array.from({ length: 12 }, () => '<div class="gi sk"><div class="ph"></div><div class="ln"></div></div>').join('') + '</div>';
  },

  emptyHtml(title, text, btn) {
    return `<div class="empty">${Art.back()}<h3>${esc(title)}</h3><p>${esc(text)}</p>${btn || ''}</div>`;
  },

  showError(msg) {
    $('msg').textContent = '';
    $('more').classList.add('hide');
    $('results').innerHTML = Explore.emptyHtml('No pudimos conectar',
      'Revisa tu internet e intenta de nuevo. ' + (msg || ''), '<button class="btn" id="retry">Reintentar</button>');
  },

  /* ---------- Cargar y mostrar ---------- */

  async load(reset) {
    if (Explore.loading) return;
    if (reset) { Explore.offset = 0; Explore.items = []; Explore.done = false; Explore.skeleton(); $('more').classList.add('hide'); }
    Explore.loading = true;
    $('msg').textContent = reset ? '' : 'Cargando...';
    try {
      if (Explore.chip === 'random') {
        Explore.items = await Api.random(8);
        Explore.done = true;
      } else {
        const d = await Api.cards(Explore.params());
        Explore.items.push(...d);
        Explore.offset += d.length;
        if (d.length < CONFIG.PAGE) Explore.done = true;
      }
    } catch (e) {
      Explore.loading = false;
      Explore.showError(e.message);
      return;
    }
    Explore.loading = false;
    // el campo de duelo se arma una vez, con las primeras cartas que lleguen
    if (!Hero.items.length && Explore.chip !== 'random' && Explore.items.length) Hero.render(Explore.items);
    Explore.render();
  },

  gridItem(c, i) {
    const p = Card.price(c), n = Deck.copies(c);
    return `<button class="gi" data-i="${i}" style="--fc:${Card.frame(c).color}">
      <span class="im"><img loading="lazy" src="${esc(Card.imgSmall(c))}" alt="${esc(Card.shownName(c))}">
      ${p ? `<span class="p">$${p.toFixed(2)}</span>` : ''}${n ? `<span class="cnt">×${n}</span>` : ''}${Ban.badge(c)}</span>
      <span class="n">${esc(Card.shownName(c))}</span></button>`;
  },

  render() {
    if (State.mode !== 'browse') return;
    State.results = Explore.items;
    const def = Explore.chipDef(Explore.chip);
    if (!Explore.items.length) {
      $('msg').textContent = '';
      $('results').innerHTML = Explore.emptyHtml('Sin cartas con esos filtros',
        'Quita el arquetipo o el atributo para ver más resultados.');
      $('more').classList.add('hide');
      return;
    }
    $('msg').textContent = `${def.label} · ${Explore.items.length} cartas`;
    $('results').innerHTML = '<div class="grid">' + Explore.items.map(Explore.gridItem).join('') + '</div>';
    const more = $('more');
    if (Explore.chip === 'random') {
      more.textContent = '🎲 Otras aleatorias';
      more.classList.remove('hide');
    } else {
      more.textContent = 'Cargar más';
      more.classList.toggle('hide', Explore.done);
    }
  },

  async loadArchetypes() {
    try {
      Explore.archList = await Api.archetypes();
      $('f-arch').innerHTML = '<option value="">Todos los arquetipos</option>' +
        Explore.archList.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    } catch (e) { /* si falla, el filtro queda solo con "Todos" */ }
  },

  // Desde la ficha de una carta: ver todas las de su arquetipo
  byArchetype(name) {
    if (![...$('f-arch').options].some(o => o.value === name)) $('f-arch').add(new Option(name, name));
    $('f-arch').value = name;
    $('f-attr').value = '';
    show('search');
    Explore.pickChip('all');
  },

  start() {
    Explore.chip = Explore.defaultChip();
    Explore.renderChips();
    Explore.loadArchetypes();
    Explore.load(true);
  },

  /* ---------- Búsqueda (español + inglés) ---------- */

  async search() {
    const q = $('q').value.trim();
    if (!q) return;
    State.mode = 'search';
    Explore.chip = null;
    Explore.renderChips();
    $('more').classList.add('hide');
    $('msg').textContent = 'Buscando...';
    Explore.skeleton();

    const [rs, re] = await Promise.allSettled([Api.searchSpanish(q), Api.searchEnglish(q)]);
    if (State.mode !== 'search') return;      // el usuario cambió de vista mientras buscaba

    if (rs.status === 'rejected' && re.status === 'rejected') { Explore.showError(); return; }
    const esCards = rs.status === 'fulfilled' ? rs.value : [];
    const enCards = re.status === 'fulfilled' ? re.value : [];
    const seen = new Set(), all = [];
    [...esCards, ...enCards].forEach(c => { if (!seen.has(c.id)) { seen.add(c.id); all.push(c); } });
    State.results = all.slice(0, 40);

    const note = rs.status === 'rejected'
      ? ' La búsqueda en español no está disponible ahora (' + rs.reason.message + ').' : '';
    if (!State.results.length) {
      $('msg').textContent = note.trim();
      $('results').innerHTML = Explore.emptyHtml('No encontramos «' + q + '»',
        'Revisa la ortografía o prueba con el nombre en inglés.');
      return;
    }
    $('msg').textContent = State.results.length + ' resultado' + (State.results.length === 1 ? '' : 's') +
      (all.length > 40 ? ' (mostrando 40)' : '') + '.' + note;
    $('results').innerHTML = State.results.map((c, i) => rowHtml(c, 'res', i)).join('');
  },

  /* ---------- Eventos ---------- */

  bind() {
    $('go').onclick = Explore.search;
    $('q').addEventListener('keydown', e => { if (e.key === 'Enter') Explore.search(); });
    $('chips').onclick = e => { const b = e.target.closest('.chip'); if (b) Explore.pickChip(b.dataset.k); };
    $('more').onclick = () => Explore.load(Explore.chip === 'random');
    const onFilter = () => {
      if (!Explore.chip || Explore.chip === 'random') Explore.chip = 'all';
      Explore.pickChip(Explore.chip);
    };
    $('f-arch').onchange = onFilter;
    $('f-attr').onchange = onFilter;
    $('results').onclick = e => {
      if (e.target.id === 'retry') { State.mode === 'search' ? Explore.search() : Explore.load(true); return; }
      const r = e.target.closest('[data-i]');
      if (r && State.results[+r.dataset.i]) Detail.open(State.results[+r.dataset.i]);
    };
  },
};

// Fila de lista (resultados de búsqueda y deck)
function rowHtml(c, src, i, sub) {
  const p = Card.price(c);
  return `<div class="row" data-src="${src}" data-i="${i}" style="--fc:${Card.frame(c).color}">
    <img loading="lazy" src="${esc(Card.imgSmall(c))}" alt="">
    <div class="t"><b>${esc(Card.shownName(c))}</b><small>${esc(sub || (Card.subName(c) + c.type))}</small></div>
    ${Ban.badge(c)}<span class="pr">${p ? '$' + p.toFixed(2) : ''}</span></div>`;
}
