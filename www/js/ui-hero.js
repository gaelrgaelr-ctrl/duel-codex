/* ============================================================
   ui-hero.js — campo de duelo de la página principal
   Cinco zonas con arte de cartas; la grande es la carta del día.
   ============================================================ */

const Hero = {
  items: [],     // cartas con las que se arma el campo
  cards: [],     // las 5 zonas actuales (null = zona vacía)

  // Se llama la primera vez que hay cartas cargadas
  render(items) {
    if (items && items.length) Hero.items = items.filter(c => Card.art(c));
    Hero.draw();
  },

  // Elige 5 cartas; la del día cambia cada fecha, igual para todos
  pick() {
    const it = Hero.items, n = it.length;
    if (!n) return [];
    const d = new Date();
    const seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    const start = seed % n, step = Math.max(1, Math.floor(n / 5));
    const out = [it[start]], used = new Set([start]);
    for (let k = 1; out.length < 5 && k <= n * 2; k++) {
      const i = (start + k * step) % n;
      if (!used.has(i)) { used.add(i); out.push(it[i]); }
    }
    while (out.length < 5) out.push(null);
    return out;
  },

  subtitle() {
    return Deck.cards.length
      ? `Tu deck tiene ${Deck.cards.length} carta${Deck.cards.length === 1 ? '' : 's'}.`
      : 'Tu deck está vacío. Busca una carta y empieza a armarlo.';
  },

  draw() {
    const el = $('hero');
    Hero.cards = Hero.pick();
    if (!Hero.cards.length) { el.classList.add('hide'); return; }
    el.classList.remove('hide');
    const feat = Hero.cards[0];
    const zone = (c, i) => {
      if (!c) return `<div class="zone empty-zone" aria-hidden="true"></div>`;
      const cap = i === 0
        ? `<span class="cap"><small>Carta del día</small><b>${esc(Card.shownName(c))}</b></span>` : '';
      return `<button class="zone ${i === 0 ? 'big' : ''}" data-h="${i}" style="--fc:${Card.frame(c).color};--d:${i * 0.11}s"
        aria-label="Abrir ${esc(Card.shownName(c))}">
        <img src="${esc(Card.art(c))}" alt="">${cap}</button>`;
    };
    el.innerHTML = `
      <div class="hero-text">
        <h1>Hola, ${esc(Profile.name())}</h1>
        <p id="hero-sub">${esc(Hero.subtitle())}</p>
        <button class="btn" data-h="0">Ver ${esc(Card.shownName(feat))}</button>
      </div>
      <div class="field">${Hero.cards.map(zone).join('')}</div>`;
    // se guarda el arte para usarlo de fondo en el login la próxima vez
    // (se combina con lo que ya había, hasta 15 imágenes distintas)
    const merged = [...new Set([...Hero.items.map(Card.art), ...Store.get('dc_art', [])])];
    Store.set('dc_art', merged.slice(0, 15));
  },

  // Actualiza solo los textos (sin repetir la animación)
  refreshText() {
    const h = $('hero').querySelector('h1');
    if (h) h.textContent = 'Hola, ' + Profile.name();
    const s = $('hero-sub');
    if (s) s.textContent = Hero.subtitle();
  },

  bind() {
    $('hero').onclick = e => {
      const b = e.target.closest('[data-h]');
      const c = b && Hero.cards[+b.dataset.h];
      if (c) Detail.open(c);
    };
  },
};
