/* ============================================================
   config.js — constantes y estado compartido
   ============================================================ */

const CONFIG = {
  API:        'https://db.ygoprodeck.com/api/v7/cardinfo.php',
  API_RANDOM: 'https://db.ygoprodeck.com/api/v7/randomcard.php',
  API_ARCH:   'https://db.ygoprodeck.com/api/v7/archetypes.php',
  YGORES:     'https://db.ygoresources.com',   // nombres y efectos en español
  PAGE: 24,                                    // cartas por "página" al explorar
  MAX_COPIES: 3,
  MAIN_MAX: 60,
  EXTRA_MAX: 15,

  // Color del marco según el tipo de carta (como en el juego)
  FRAMES: {
    normal: '#D6B550', effect: '#D27A33', ritual: '#4F86D6', fusion: '#9A63D6',
    synchro: '#E4E4DA', xyz: '#8C8FA3', link: '#2F8AC8', pendulum: '#58B89B',
    spell: '#25B4A0', trap: '#C9488F', token: '#8A94A6',
  },

  // Temas de color del usuario (uno por atributo, más el oro por defecto)
  THEMES: {
    oro:    { label: 'Oro',        acc: '#D8B25A' },
    dark:   { label: 'Oscuridad',  acc: '#A98BFF' },
    light:  { label: 'Luz',        acc: '#F2D95C' },
    fire:   { label: 'Fuego',      acc: '#FF7A4D' },
    water:  { label: 'Agua',       acc: '#4DB3FF' },
    earth:  { label: 'Tierra',     acc: '#C9A06B' },
    wind:   { label: 'Viento',     acc: '#4FD6A0' },
  },

  ATTR: {
    DARK:   { es: 'Oscuridad', icon: '🌑' }, LIGHT: { es: 'Luz',    icon: '☀️' },
    FIRE:   { es: 'Fuego',     icon: '🔥' }, WATER: { es: 'Agua',   icon: '💧' },
    EARTH:  { es: 'Tierra',    icon: '⛰️' }, WIND:  { es: 'Viento', icon: '🌪️' },
    DIVINE: { es: 'Divino',    icon: '✨' },
  },
};

const MON = ['Effect Monster', 'Normal Monster', 'Flip Effect Monster', 'Tuner Monster', 'Normal Tuner Monster',
  'Ritual Monster', 'Ritual Effect Monster', 'Pendulum Effect Monster', 'Pendulum Normal Monster',
  'Spirit Monster', 'Toon Monster', 'Gemini Monster', 'Union Effect Monster'].join(',');
const EXTRA = ['Fusion Monster', 'Synchro Monster', 'XYZ Monster', 'Link Monster'].join(',');

// Categorías de la página principal. "p" son parámetros de la API de YGOPRODeck.
const CHIPS = [
  { k: 'staple', label: '⭐ Destacadas', p: { staple: 'yes' } },
  { k: 'new',    label: '🆕 Nuevas',     p: { sort: 'new' } },
  { k: 'random', label: '🎲 Aleatorias' },
  { k: 'mon',    label: '👹 Monstruos',  p: { type: MON } },
  { k: 'spell',  label: '✨ Hechizos',   p: { type: 'Spell Card' } },
  { k: 'trap',   label: '🪤 Trampas',    p: { type: 'Trap Card' } },
  { k: 'extra',  label: '🌀 Extra Deck', p: { type: EXTRA } },
  { k: 'all',    label: '🃏 Todas',      p: {} },
];

// Estado de la interfaz
const State = {
  tab: 'search',        // 'search' | 'deck' | 'profile'
  mode: 'browse',       // 'browse' | 'search'
  results: [],          // cartas que se están mostrando (lista o cuadrícula)
  detail: null,         // carta abierta en la ficha
  appStarted: false,
};
