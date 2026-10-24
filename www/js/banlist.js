/* ============================================================
   banlist.js — lista de prohibidas, limitadas y semi-limitadas (TCG)
   Estado de cada carta, copias permitidas y la lista completa.
   ============================================================ */

const Ban = {
  LEVELS: {
    banned:  { max: 0, label: 'Prohibida',     cls: 'b0' },
    limited: { max: 1, label: 'Limitada',      cls: 'b1' },
    semi:    { max: 2, label: 'Semi-limitada', cls: 'b2' },
  },

  // La API trae el estado en banlist_info.ban_tcg; se aceptan variantes de escritura
  status(c) {
    let b = c.banlist_info;
    if (Array.isArray(b)) b = b[0];
    const v = String(b?.ban_tcg || '').toLowerCase().replace(/[\s_]+/g, '-');
    if (v === 'banned' || v === 'forbidden') return 'banned';
    if (v === 'semi-limited') return 'semi';
    if (v === 'limited') return 'limited';
    return null;
  },
  info(c) { return Ban.LEVELS[Ban.status(c)] || null; },
  // Copias permitidas según la lista (3 si no está en ella)
  max(c) { const i = Ban.info(c); return i ? i.max : CONFIG.MAX_COPIES; },
  badge(c) { const i = Ban.info(c); return i ? `<span class="ban ${i.cls}">${i.label}</span>` : ''; },

  items: null,      // lista resumida: [{ id, name, type, banlist_info, card_images, misc_info }]
  fetched: 0,       // cuándo se consultó (milisegundos)

  // Carga la lista. Se guarda un día para no repetir la consulta; force = consultar de nuevo.
  async load(force) {
    if (!force && Ban.items) return Ban.items;
    const cached = Store.get('banlist_tcg', null);
    if (!force && cached && Date.now() - cached.ts < 864e5) {
      Ban.items = cached.items; Ban.fetched = cached.ts;
      return Ban.items;
    }
    const cards = await Api.banlist();
    if (!cards.length) {
      if (cached) { Ban.items = cached.items; Ban.fetched = cached.ts; return Ban.items; }
      throw new Error('lista no disponible');
    }
    // se guarda solo lo necesario para ahorrar espacio
    Ban.items = cards.filter(c => Ban.status(c)).map(c => ({
      id: c.id, name: c.name, type: c.type,
      banlist_info: { ban_tcg: Ban.status(c) === 'semi' ? 'Semi-Limited' : Ban.status(c) === 'banned' ? 'Banned' : 'Limited' },
      misc_info: Card.konamiId(c) ? [{ konami_id: Card.konamiId(c) }] : undefined,
      card_images: [{ image_url_small: Card.imgSmall(c), image_url_cropped: Card.art(c) }],
    }));
    Ban.fetched = Date.now();
    Store.set('banlist_tcg', { ts: Ban.fetched, items: Ban.items });
    return Ban.items;
  },
};
