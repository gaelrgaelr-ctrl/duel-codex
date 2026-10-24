/* ============================================================
   utils.js — utilidades generales y helpers de carta
   ============================================================ */

const $ = id => document.getElementById(id);

const esc = s => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// minúsculas y sin acentos, para comparar textos
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function toast(t) {
  const el = $('toast');
  el.textContent = t;
  el.style.display = 'block';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.style.display = 'none'; }, 2200);
}

// Todo lo que se pregunta sobre una carta (objeto de la API) va aquí
const Card = {
  type:      c => (c.type || '').toLowerCase(),
  isExtra:   c => ['fusion', 'synchro', 'xyz', 'link'].some(k => Card.type(c).includes(k)),
  isMonster: c => Card.type(c).includes('monster'),
  isSpell:   c => Card.type(c).includes('spell'),
  isTrap:    c => Card.type(c).includes('trap'),
  price:     c => parseFloat(c.card_prices?.[0]?.tcgplayer_price) || 0,
  konamiId:  c => c.misc_info?.[0]?.konami_id,
  img:       c => c.card_images?.[0]?.image_url,
  imgSmall:  c => c.card_images?.[0]?.image_url_small,
  // Solo el dibujo de la carta (sin marco). Si no existe, se usa la imagen pequeña.
  art:       c => c.card_images?.[0]?.image_url_cropped || c.card_images?.[0]?.image_url_small,

  // Marco de la carta: clave y color según su tipo
  frame(c) {
    const t = Card.type(c);
    let k = 'normal';
    if (t.includes('spell')) k = 'spell';
    else if (t.includes('trap')) k = 'trap';
    else if (t.includes('link')) k = 'link';
    else if (t.includes('xyz')) k = 'xyz';
    else if (t.includes('synchro')) k = 'synchro';
    else if (t.includes('fusion')) k = 'fusion';
    else if (t.includes('pendulum')) k = 'pendulum';
    else if (t.includes('ritual')) k = 'ritual';
    else if (t.includes('token') || t.includes('skill')) k = 'token';
    else if (t.includes('normal')) k = 'normal';
    else if (t.includes('monster')) k = 'effect';
    return { k, color: CONFIG.FRAMES[k] };
  },

  // Nivel / rango / link con sus estrellas
  levelInfo(c) {
    if (c.linkval) return { label: 'Link ' + c.linkval, stars: '' };
    if (c.level == null) return null;
    const label = (Card.type(c).includes('xyz') ? 'Rango ' : 'Nivel ') + c.level;
    return { label, stars: '★'.repeat(Math.min(c.level, 13)) };
  },

  // Nombre a mostrar: español si lo tenemos, si no el original
  shownName(c) {
    if (c.es?.esName) return c.es.esName;
    const k = Card.konamiId(c);
    if (Api.esRev && k && Api.esRev[k]) return Api.esRev[k];
    return c.name;
  },
  // Texto auxiliar: el nombre en inglés cuando mostramos el español
  subName(c) {
    return Card.shownName(c) !== c.name ? c.name + ' · ' : '';
  },
};
