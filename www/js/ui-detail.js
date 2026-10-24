/* ============================================================
   ui-detail.js — ficha de una carta
   ============================================================ */

const Detail = {
  // quiet = true vuelve a dibujar sin cambiar de pantalla
  open(c, quiet) {
    State.detail = c;
    if (!quiet) Profile.pushRecent(c);

    const fr = Card.frame(c);
    const p = c.card_prices?.[0] || {};
    const prices = [['TCGPlayer', p.tcgplayer_price], ['Cardmarket (EUR)', p.cardmarket_price],
                    ['eBay', p.ebay_price], ['Amazon', p.amazon_price], ['CoolStuffInc', p.coolstuffinc_price]];
    const sets = c.card_sets || [];
    const esText = c.es?.esText;
    const name = Card.shownName(c);
    const lv = Card.levelInfo(c);
    const at = CONFIG.ATTR[c.attribute];
    const tags = [
      `<span class="tag" style="--fc:${fr.color}">${esc(c.type)}</span>`,
      Ban.badge(c),
      at ? `<span class="tag">${at.icon} ${at.es}</span>` : '',
      c.race && Card.isMonster(c) ? `<span class="tag">${esc(c.race)}</span>` : '',
      lv ? `<span class="tag">${esc(lv.label)}</span>` : '',
    ].join('');
    const stats = Card.isMonster(c) ? `<div class="stats">
        <div class="stat"><b>${c.atk ?? '—'}</b><span>Ataque</span></div>
        ${c.def != null ? `<div class="stat"><b>${c.def}</b><span>Defensa</span></div>` : ''}</div>` : '';

    $('pg-detail').innerHTML = `
      <div class="dt-top" style="--art:url('${esc(Card.art(c))}');--fc:${fr.color}">
        <button class="btn sec small" id="back">← Volver</button>
        <div class="dt-head">
          <div class="dt-img"><img src="${esc(Card.img(c))}" alt="Carta ${esc(name)}"></div>
          <div class="dt-info">
            <h1>${esc(name)}</h1>
            ${name !== c.name ? '<div class="en">' + esc(c.name) + '</div>' : ''}
            <div class="tags">${tags}</div>
            ${lv && lv.stars ? `<div class="stars" aria-hidden="true">${lv.stars}</div>` : ''}
            ${stats}
            <div class="effect">
              <p>${esc(esText || c.desc).replace(/\n/g, '<br>')}</p>
              ${esText ? '<details><summary>Ver texto en inglés</summary><p style="margin-top:6px">' + esc(c.desc).replace(/\n/g, '<br>') + '</p></details>' : ''}
            </div>
            <div class="actions">
              <button class="btn" id="add">${Deck.addLabel(c)}</button>
              <button class="btn sec" id="avatar">Usar como avatar</button>
              ${c.archetype ? `<button class="btn sec" id="arch">Ver arquetipo ${esc(c.archetype)}</button>` : ''}
            </div>
          </div>
        </div>
      </div>
      <h2>Precios estimados</h2>
      <div class="panel"><table>${prices.map(x => `<tr><td>${x[0]}</td><td>${x[1] ? esc(x[1]) : '-'}</td></tr>`).join('')}</table>
      <p class="muted small">Valores aproximados en USD (salvo Cardmarket). Son solo referencia.</p></div>
      <h2>Expansiones (${sets.length})</h2>
      <div class="panel">${sets.length ? '<table>' + sets.map(s =>
        `<tr><td>${esc(s.set_name)}<br><small class="muted">${esc(s.set_code)}</small> <span class="rar">${esc(s.set_rarity)}</span></td><td>${s.set_price && s.set_price !== '0.00' ? '$' + esc(s.set_price) : ''}</td></tr>`).join('') + '</table>'
        : '<p class="muted">Sin información de expansiones.</p>'}</div>`;

    $('back').onclick = goBack;
    $('add').onclick = () => {
      toast(Deck.add(c) || (Card.shownName(c) + ' agregada a ' + Deck.name() + ' (' + Deck.copies(c) + '/' + Deck.max(c) + ')'));
      $('add').textContent = Deck.addLabel(c);
    };
    $('avatar').onclick = () => { Profile.setAvatar(c); refreshHeader(); toast('Avatar actualizado'); };
    if ($('arch')) $('arch').onclick = () => Explore.byArchetype(c.archetype);
    if (!quiet) {
      // si ya estábamos en una ficha (por ejemplo, tras ver un arquetipo), no se duplica el historial
      if ($('pg-detail').classList.contains('hide')) openedDetail();
      show('detail');
    }

    // Si la carta aún no tiene texto en español, se intenta traer en segundo plano
    if (!c.es) {
      Api.enrichEs(c).then(ok => {
        if (ok && State.detail === c && !$('pg-detail').classList.contains('hide')) Detail.open(c, true);
      });
    }
  },
};
