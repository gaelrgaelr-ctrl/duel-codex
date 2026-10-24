/* ============================================================
   deck.js — los decks del usuario: reglas, guardado y análisis
   (el "sensor" y la retroalimentación del diagrama)
   Cada usuario puede tener varios decks; Deck.cards es siempre
   el deck que está en uso.
   ============================================================ */

const Deck = {
  user: null,
  decks: [],        // [{ id, name, cards }]
  activeId: null,
  cards: [],        // cartas del deck en uso (misma lista que decks[i].cards)

  key: () => 'decks_' + Deck.user,

  // Carga los decks de un usuario. Si solo existía el deck único de versiones
  // anteriores, pasa a ser el primer deck.
  load(user) {
    Deck.user = user;
    let st = Store.get(Deck.key(), null);
    if (!st || !Array.isArray(st.decks) || !st.decks.length) {
      let old = Store.get('deck_' + user, null);
      if (old === null && user !== Auth.GUEST) {
        const legacy = Store.get('deck', null);
        if (legacy) { old = legacy; Store.remove('deck'); }
      }
      st = { activeId: 'd1', decks: [{ id: 'd1', name: 'Mi deck', cards: Array.isArray(old) ? old : [] }] };
    }
    st.decks.forEach(d => { if (!Array.isArray(d.cards)) d.cards = []; });
    Deck.decks = st.decks;
    Deck.activeId = st.decks.some(d => d.id === st.activeId) ? st.activeId : st.decks[0].id;
    Deck.cards = Deck.active().cards;
  },

  save() {
    if (!Store.set(Deck.key(), { activeId: Deck.activeId, decks: Deck.decks })) {
      toast('No se pudo guardar el deck (almacenamiento lleno).');
    }
  },

  clearMemory() { Deck.user = null; Deck.decks = []; Deck.activeId = null; Deck.cards = []; },

  /* ---------- varios decks ---------- */

  active: () => Deck.decks.find(d => d.id === Deck.activeId),
  name: () => (Deck.active() || {}).name || 'Mi deck',

  switchTo(id) {
    const d = Deck.decks.find(x => x.id === id);
    if (!d) return;
    Deck.activeId = id;
    Deck.cards = d.cards;
    Deck.save();
  },

  // Crea un deck (con cartas opcionales) y lo deja en uso
  create(name, cards) {
    const id = 'd' + Date.now().toString(36) + Math.floor(Math.random() * 1e3).toString(36);
    Deck.decks.push({ id, name: (name || '').trim().slice(0, 30) || 'Deck nuevo', cards: cards || [] });
    Deck.switchTo(id);
  },

  rename(name) {
    const n = (name || '').trim().slice(0, 30);
    if (n) { Deck.active().name = n; Deck.save(); }
  },

  duplicate() {
    Deck.create(Deck.name() + ' (copia)', Deck.cards.map(c => ({ ...c })));
  },

  // No se puede eliminar el último deck
  remove(id) {
    if (Deck.decks.length < 2) return;
    Deck.decks = Deck.decks.filter(d => d.id !== id);
    if (Deck.activeId === id) Deck.switchTo(Deck.decks[0].id); else Deck.save();
  },

  /* ---------- cartas ---------- */

  main:   () => Deck.cards.filter(c => !Card.isExtra(c)),
  extra:  () => Deck.cards.filter(Card.isExtra),
  copies: c => Deck.cards.filter(x => x.id === c.id).length,
  total:  () => Deck.cards.reduce((s, c) => s + Card.price(c), 0),

  // Copias permitidas: 3 como máximo, menos si la carta está en la lista del TCG
  max: c => Math.min(CONFIG.MAX_COPIES, Ban.max(c)),

  addLabel(c) {
    const mx = Deck.max(c);
    return mx === 0 ? 'Agregar al deck (prohibida)' : `Agregar al deck (${Deck.copies(c)}/${mx})`;
  },

  // Devuelve un mensaje de error, o null si se agregó
  add(c) {
    const mx = Deck.max(c), name = Card.shownName(c);
    if (mx === 0) return name + ' está prohibida en el TCG';
    if (Deck.copies(c) >= mx) {
      return mx < CONFIG.MAX_COPIES ? `${name}: máximo ${mx} (${Ban.info(c).label})` : 'Máximo 3 copias de ' + name;
    }
    if (Card.isExtra(c) && Deck.extra().length >= CONFIG.EXTRA_MAX) return 'El Extra Deck ya tiene ' + CONFIG.EXTRA_MAX;
    if (!Card.isExtra(c) && Deck.main().length >= CONFIG.MAIN_MAX) return 'El Main Deck ya tiene ' + CONFIG.MAIN_MAX;
    const k = Card.konamiId(c);
    // copia ligera para ahorrar espacio: solo la primera imagen y el Konami ID
    Deck.cards.push({
      ...c,
      misc_info: k ? [{ konami_id: k }] : undefined,
      card_images: c.card_images ? [c.card_images[0]] : undefined,
    });
    Deck.save();
    return null;
  },

  removeOne(id) {
    const i = Deck.cards.findIndex(x => x.id == id);
    if (i >= 0) Deck.cards.splice(i, 1);
    Deck.save();
  },

  clear() { Deck.cards.length = 0; Deck.save(); },

  // Vuelve a pedir precios y estado de la lista de todas las cartas de todos los decks
  async refresh() {
    const ids = [...new Set(Deck.decks.flatMap(d => d.cards.map(c => c.id)))];
    if (!ids.length) return 0;
    const fresh = await Api.cardsByIds(ids);
    if (!fresh.length) return 0;
    const map = new Map(fresh.map(c => [c.id, c]));
    Deck.decks.forEach(d => d.cards.forEach(c => {
      const f = map.get(c.id);
      if (!f) return;
      c.card_prices = f.card_prices;
      if (f.banlist_info) c.banlist_info = f.banlist_info; else delete c.banlist_info;
    }));
    Deck.save();
    return map.size;
  },

  /* ---------- análisis ---------- */

  // Cartas con más copias de las que permite la lista
  violations() {
    const seen = new Map();
    Deck.cards.forEach(c => seen.set(c.id, c));
    const out = [];
    seen.forEach(c => {
      const n = Deck.copies(c), mx = Deck.max(c);
      if (n > mx) out.push({ c, n, max: mx });
    });
    return out;
  },

  // Consejos automáticos según la composición actual del deck
  advice() {
    const m = Deck.main();
    if (!m.length) return ['Agrega cartas desde la pestaña Cartas.'];
    const t = Deck.violations().map(v =>
      `${Card.shownName(v.c)}: tienes ${v.n} y la lista permite ${v.max === 0 ? 'ninguna' : v.max} (${Ban.info(v.c).label}).`);
    if (m.length < 40) t.push(`Main Deck con ${m.length}: necesitas al menos 40.`);
    if (m.length > 40) t.push(`Con ${m.length} cartas baja la consistencia; la mayoría usa 40.`);
    const mon = m.filter(Card.isMonster).length;
    const sp = m.filter(Card.isSpell).length;
    const tr = m.filter(Card.isTrap).length;
    if (m.length >= 20) {
      if (tr > m.length * 0.3) t.push(`Muchas trampas (${tr}); suelen ser más lentas.`);
      if (sp < m.length * 0.15) t.push(`Pocos hechizos (${sp}); quizá falte apoyo.`);
      if (mon < m.length * 0.3) t.push(`Pocos monstruos (${mon}) para una base estable.`);
    }
    if (!t.length) t.push('Tu deck cumple las reglas básicas. ¡Buen trabajo!');
    t.push('(Son guías generales; cada estrategia es distinta.)');
    return t;
  },
};
