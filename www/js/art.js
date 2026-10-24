/* ============================================================
   art.js — ilustraciones propias (SVG) para rellenar espacios
   Son diseños originales: reverso de carta y círculo arcano.
   ============================================================ */

const Art = {
  // Reverso de carta. Se usa como imagen de relleno y en estados vacíos.
  back(cls) {
    let ticks = '';
    for (let i = 0; i < 12; i++) {
      ticks += `<line x1="0" y1="-36" x2="0" y2="-43" transform="rotate(${i * 30})" stroke-width="2"/>`;
    }
    return `<svg ${cls ? 'class="' + cls + '"' : ''} viewBox="0 0 120 172" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Reverso de carta">
<rect x="2" y="2" width="116" height="168" rx="8" fill="#14284A" stroke="#D8B25A" stroke-width="3"/>
<rect x="9" y="9" width="102" height="154" rx="5" fill="none" stroke="#D8B25A" stroke-opacity=".55"/>
<g transform="translate(60 86)" fill="none" stroke="#D8B25A">
<circle r="36" stroke-width="2"/><circle r="28" stroke-opacity=".6"/>${ticks}
<rect x="-14" y="-14" width="28" height="28" transform="rotate(45)" stroke-width="2"/>
<circle r="5" fill="#D8B25A" stroke="none"/></g>
<g fill="#D8B25A" fill-opacity=".7"><path d="M60 16l4 5-4 5-4-5z"/><path d="M60 146l4 5-4 5-4-5z"/></g>
</svg>`;
  },

  // Círculo arcano grande, de fondo cuando aún no hay arte guardado
  arcane() {
    let ticks = '';
    for (let i = 0; i < 48; i++) {
      const long = i % 4 === 0;
      ticks += `<line x1="0" y1="-196" x2="0" y2="${long ? -178 : -186}" transform="rotate(${i * 7.5})" stroke-width="${long ? 2 : 1}"/>`;
    }
    return `<svg class="ring" viewBox="-210 -210 420 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<g fill="none" stroke="#D8B25A" stroke-opacity=".28">
<circle r="200" stroke-width="2"/><circle r="170"/><circle r="120" stroke-opacity=".5"/>
${ticks}
<rect x="-85" y="-85" width="170" height="170" transform="rotate(45)" stroke-width="1.5"/>
<rect x="-85" y="-85" width="170" height="170" stroke-width="1.5"/>
<circle r="22" stroke-width="2"/></g></svg>`;
  },

  // Marca pequeña de la cabecera
  mark() {
    return `<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<rect x="9" y="3" width="14" height="20" rx="2.5" fill="none" stroke="#D8B25A" stroke-width="1.6" transform="rotate(10 16 13)"/>
<rect x="5" y="5" width="14" height="20" rx="2.5" fill="#14284A" stroke="#D8B25A" stroke-width="1.8" transform="rotate(-8 12 15)"/>
<path d="M12 11.5l3 3.5-3 3.5-3-3.5z" fill="#D8B25A" transform="rotate(-8 12 15)"/></svg>`;
  },
};

// Imagen de relleno cuando una carta no carga
Art.backURI = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Art.back());

// Si una imagen falla, se cambia por el reverso (una sola vez por imagen)
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && !t.dataset.fb) { t.dataset.fb = '1'; t.src = Art.backURI; }
}, true);
