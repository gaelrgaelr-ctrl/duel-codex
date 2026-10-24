/* ============================================================
   api.js — todas las llamadas a internet
   - YGOPRODeck: datos, imágenes, precios y expansiones
   - YGOResources: nombres y efectos en español
   ============================================================ */

const Api = {
  esIndex: null,   // { "Mago Oscuro": [4041], ... }
  esRev: null,     // { 4041: "Mago Oscuro", ... }

  /* ---------- YGOPRODeck ---------- */

  // Devuelve una lista de cartas (vacía si no hay resultados)
  async cards(params) {
    const r = await fetch(CONFIG.API + '?' + params);
    if (!r.ok) return [];
    return (await r.json()).data || [];
  },

  async random(n) {
    const reqs = Array.from({ length: n }, () =>
      fetch(CONFIG.API_RANDOM).then(r => r.ok ? r.json() : null).catch(() => null));
    const out = await Promise.all(reqs);
    const seen = new Set();
    return out
      .map(j => !j ? null : (j.data ? (Array.isArray(j.data) ? j.data[0] : j.data) : j))
      .filter(c => c && c.id && !seen.has(c.id) && seen.add(c.id));
  },

  async archetypes() {
    const r = await fetch(CONFIG.API_ARCH);
    if (!r.ok) return [];
    return (await r.json()).map(a => a.archetype_name).filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  },

  searchEnglish(q) {
    return Api.cards('misc=yes&fname=' + encodeURIComponent(q));
  },

  // Varias cartas por su código (id). Se piden en grupos para no alargar la dirección.
  async cardsByIds(ids) {
    const uniq = [...new Set(ids.map(String))];
    const out = [];
    for (let i = 0; i < uniq.length; i += 40) {
      out.push(...await Api.cards('misc=yes&id=' + uniq.slice(i, i + 40).join(',')));
    }
    return out;
  },

  // Todas las cartas que están en la lista de prohibidas, limitadas o semi-limitadas del TCG
  banlist() {
    return Api.cards('banlist=TCG&misc=yes');
  },

  /* ---------- Español (YGOResources) ---------- */

  buildRev() {
    Api.esRev = {};
    for (const [name, ids] of Object.entries(Api.esIndex)) {
      if (ids && ids[0] != null && !(ids[0] in Api.esRev)) Api.esRev[ids[0]] = name;
    }
  },

  // Si el índice ya se descargó antes, se recupera del almacenamiento
  initCache() {
    const cached = Store.get('esIndexV1', null);
    if (cached) { Api.esIndex = cached; Api.buildRev(); }
  },

  async loadEsIndex() {
    if (Api.esIndex) return Api.esIndex;
    const r = await fetch(CONFIG.YGORES + '/data/idx/card/name/es');
    if (!r.ok) throw new Error('índice en español: error ' + r.status);
    Api.esIndex = await r.json();
    Api.buildRev();
    Store.set('esIndexV1', Api.esIndex);
    return Api.esIndex;
  },

  async searchSpanish(q) {
    const idx = await Api.loadEsIndex();
    const nq = norm(q).trim();
    const words = nq.split(/\s+/).filter(Boolean);
    const hits = [];
    for (const [name, ids] of Object.entries(idx)) {
      const n = norm(name);
      if (words.every(w => n.includes(w))) hits.push({ name, n, id: ids[0] });
    }
    hits.sort((a, b) =>
      (b.n === nq) - (a.n === nq) ||
      b.n.startsWith(nq) - a.n.startsWith(nq) ||
      a.name.length - b.name.length);
    const top = hits.slice(0, 15);
    if (!top.length) return [];

    // nombre y efecto en español + nombre en inglés de cada carta
    const infos = await Promise.all(top.map(h =>
      fetch(CONFIG.YGORES + '/data/card/' + h.id).then(r => r.ok ? r.json() : null).catch(() => null)));
    const es = {}, enNames = [];
    infos.forEach(i => {
      const en = i?.cardData?.en?.name;
      if (!en) return;
      enNames.push(en);
      es[en.toLowerCase()] = { esName: i.cardData.es?.name, esText: i.cardData.es?.effectText };
    });
    if (!enNames.length) return [];

    // con los nombres en inglés se piden los datos completos a YGOPRODeck
    const cards = await Api.cards('misc=yes&name=' + encodeURIComponent(enNames.join('|')));
    cards.forEach(c => { c.es = es[c.name.toLowerCase()]; });
    const pos = c => enNames.findIndex(n => n.toLowerCase() === c.name.toLowerCase());
    return cards.sort((a, b) => pos(a) - pos(b));
  },

  // Trae el texto en español de una carta que aún no lo tiene (usa su Konami ID)
  async enrichEs(c) {
    const kid = Card.konamiId(c);
    if (c.es || !kid) return false;
    try {
      const r = await fetch(CONFIG.YGORES + '/data/card/' + kid);
      if (!r.ok) return false;
      const es = (await r.json()).cardData?.es;
      if (es?.name) { c.es = { esName: es.name, esText: es.effectText }; return true; }
    } catch (e) {}
    return false;
  },
};
