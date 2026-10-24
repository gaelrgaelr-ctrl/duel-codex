/* ============================================================
   profile.js — perfil de duelista (se guarda por usuario)
   Tema de color, avatar, nombre, arquetipo favorito y las
   últimas cartas vistas.
   ============================================================ */

const Profile = {
  user: null,
  data: null,

  key: () => 'profile_' + Profile.user,
  defaults: () => ({ theme: 'oro', display: '', avatar: null, favArch: '', recents: [], duels: [] }),

  load(user) {
    Profile.user = user;
    Profile.data = { ...Profile.defaults(), ...(Store.get(Profile.key(), {}) || {}) };
    if (!CONFIG.THEMES[Profile.data.theme]) Profile.data.theme = 'oro';
    if (!Array.isArray(Profile.data.recents)) Profile.data.recents = [];
    if (!Array.isArray(Profile.data.duels)) Profile.data.duels = [];
  },

  // Historial de duelos: result = 'win' | 'loss' | 'draw'
  addDuel(result, opponent, deckName) {
    Profile.data.duels.unshift({ ts: Date.now(), result, opponent: opponent || 'Oponente', deck: deckName || '' });
    Profile.data.duels = Profile.data.duels.slice(0, 100);
    Profile.save();
  },
  removeDuel(ts) {
    Profile.data.duels = Profile.data.duels.filter(d => d.ts !== ts);
    Profile.save();
  },
  record() {
    const r = { win: 0, loss: 0, draw: 0 };
    Profile.data.duels.forEach(d => { if (d.result in r) r[d.result]++; });
    return r;
  },

  save() { Store.set(Profile.key(), Profile.data); },

  // Al salir se vuelve al aspecto por defecto
  clear() { Profile.user = null; Profile.data = Profile.defaults(); Profile.apply(); },

  name() {
    return Profile.data.display || (Profile.user === Auth.GUEST ? 'Invitado' : (Profile.user || ''));
  },

  // Aplica el color del tema a toda la interfaz
  apply() {
    const t = CONFIG.THEMES[Profile.data.theme] || CONFIG.THEMES.oro;
    document.documentElement.style.setProperty('--acc', t.acc);
  },

  pushRecent(c) {
    const e = { id: c.id, name: Card.shownName(c), art: Card.art(c) };
    Profile.data.recents = [e, ...Profile.data.recents.filter(r => r.id !== e.id)].slice(0, 12);
    Profile.save();
  },

  setAvatar(c) {
    Profile.data.avatar = { id: c.id, name: Card.shownName(c), art: Card.art(c) };
    Profile.save();
  },

  // Título según qué tan armado está el deck
  rank() {
    const m = Deck.main().length;
    if (!Deck.cards.length) return 'Aprendiz de duelo';
    if (m >= 40) return 'Maestro del deck';
    if (Deck.cards.length >= 20) return 'Constructor de decks';
    return 'Duelista novato';
  },
};
Profile.data = Profile.defaults();
