/* ============================================================
   tool-deckio.js — importar y exportar decks en formato .ydk
   El .ydk lo usan simuladores como EDOPro, YGOPro y Master Duel.
   Lleva el código (id) de cada carta, una por línea.
   ============================================================ */

const Ydk = {
  build() {
    return ['#created by Duel Codex', '#main', ...Deck.main().map(c => c.id),
            '#extra', ...Deck.extra().map(c => c.id), '!side', ''].join('\n');
  },

  // Lista legible: "3x Nombre en inglés"
  text() {
    const lines = [];
    const add = (title, list) => {
      if (!list.length) return;
      lines.push(title);
      [...new Map(list.map(c => [c.id, c])).values()].forEach(c => lines.push(`${Deck.copies(c)}x ${c.name}`));
      lines.push('');
    };
    add('Main Deck', Deck.main());
    add('Extra Deck', Deck.extra());
    return lines.join('\n').trim();
  },

  // Devuelve { main: [ids], extra: [ids] }; el side deck se ignora
  parse(txt) {
    const out = { main: [], extra: [] };
    let section = 'main';
    String(txt).split(/\r?\n/).forEach(line => {
      const t = line.trim();
      if (!t) return;
      if (t[0] === '#') {
        const low = t.toLowerCase();
        if (low === '#main') section = 'main'; else if (low === '#extra') section = 'extra';
        return;
      }
      if (t[0] === '!') { section = 'side'; return; }
      if (/^\d{1,10}$/.test(t) && out[section]) out[section].push(t);
    });
    return out;
  },
};

const ToolDeckIO = {
  fileName: '',

  copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => ToolDeckIO.copyOld());
    }
    return Promise.resolve(ToolDeckIO.copyOld());
  },
  copyOld() {
    const ta = $('io-text');
    ta.select();
    try { return document.execCommand('copy'); } catch (e) { return false; }
  },

  download() {
    const blob = new Blob([Ydk.build()], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (Deck.name().replace(/[^\w\- ]+/g, '').trim() || 'deck') + '.ydk';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },

  async importNow() {
    const msg = $('io-msg'), btn = $('io-import');
    const { main, extra } = Ydk.parse($('io-paste').value);
    const ids = [...main, ...extra];
    if (!ids.length) { msg.textContent = 'No encontré cartas. Pega el contenido de un archivo .ydk (una línea por carta).'; return; }
    btn.disabled = true; msg.textContent = 'Buscando ' + new Set(ids).size + ' cartas...';
    try {
      const found = await Api.cardsByIds(ids);
      const map = new Map(found.map(c => [String(c.id), c]));
      const cards = [], missing = new Set();
      ids.forEach(id => {
        const c = map.get(String(id));
        if (!c) { missing.add(id); return; }
        const k = Card.konamiId(c);
        cards.push({ ...c, misc_info: k ? [{ konami_id: k }] : undefined, card_images: c.card_images ? [c.card_images[0]] : undefined });
      });
      if (!cards.length) { msg.textContent = 'No se encontró ninguna carta. Revisa tu internet o el archivo.'; btn.disabled = false; return; }
      Deck.create(ToolDeckIO.fileName || 'Deck importado', cards);
      Hero.refreshText();
      msg.innerHTML = `Listo: ${cards.length} cartas importadas en «${esc(Deck.name())}»` +
        (missing.size ? ` (${missing.size} códigos no se encontraron)` : '') + '. ' +
        '<button class="btn small" id="io-see">Ver deck</button>';
      $('io-see').onclick = () => { DeckUI.render(); show('deck'); };
      toast('Deck importado');
      ToolDeckIO.render($('tool-body'), msg.innerHTML);
    } catch (e) {
      msg.textContent = 'No se pudo importar. Revisa tu internet e intenta de nuevo.';
      btn.disabled = false;
    }
  },

  // note: mensaje que se conserva al volver a dibujar
  render(el, note) {
    const has = Deck.cards.length > 0;
    el.innerHTML = `
      <h2 style="margin-top:6px">Exportar «${esc(Deck.name())}»</h2>
      ${has ? `<div class="actions" style="margin:0 0 10px">
          <button class="btn" id="io-dl">Descargar .ydk</button>
          <button class="btn sec" id="io-copy">Copiar lista de texto</button></div>
        <textarea id="io-text" readonly rows="8" aria-label="Lista del deck">${esc(Ydk.text())}</textarea>
        <p class="muted small">El archivo .ydk sirve para abrir el deck en otros simuladores. Si tu celular no permite descargarlo, copia la lista.</p>`
        : '<p class="muted">Este deck está vacío. Agrega cartas para poder exportarlo.</p>'}

      <h2>Importar un deck</h2>
      <p class="muted">Elige un archivo .ydk o pega su contenido. Se crea un deck nuevo y el que tenías no cambia.</p>
      <input type="file" id="io-file" accept=".ydk,.txt,text/plain" aria-label="Archivo .ydk">
      <textarea id="io-paste" rows="6" placeholder="#main&#10;46986414&#10;..." aria-label="Contenido del archivo .ydk"></textarea>
      <p><button class="btn" id="io-import">Importar como deck nuevo</button></p>
      <p id="io-msg" class="muted" role="status">${note || ''}</p>`;
    if (note) { const see = $('io-see'); if (see) see.onclick = () => { DeckUI.render(); show('deck'); }; }

    if (has) {
      $('io-dl').onclick = ToolDeckIO.download;
      $('io-copy').onclick = async () => toast((await ToolDeckIO.copy(Ydk.text())) ? 'Lista copiada' : 'No se pudo copiar; selecciona el texto a mano');
    }
    $('io-file').onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      ToolDeckIO.fileName = f.name.replace(/\.[^.]+$/, '').slice(0, 30);
      const r = new FileReader();
      r.onload = () => { $('io-paste').value = String(r.result); $('io-msg').textContent = 'Archivo leído. Toca Importar como deck nuevo.'; };
      r.readAsText(f);
    };
    $('io-import').onclick = ToolDeckIO.importNow;
  },
};

Tools.register({
  k: 'deckio', icon: '📦', title: 'Importar y exportar',
  desc: 'Archivos .ydk para pasar tu deck a otros simuladores.',
  render: el => ToolDeckIO.render(el),
});
