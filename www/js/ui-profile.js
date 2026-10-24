/* ============================================================
   ui-profile.js — pestaña "Duelista"
   ============================================================ */

const ProfileUI = {
  render() {
    const d = Profile.data;
    const distinct = new Set(Deck.cards.map(c => c.id)).size;
    const av = d.avatar ? `<img src="${esc(d.avatar.art)}" alt="Avatar: ${esc(d.avatar.name)}">` : Art.back();
    const arts = Explore.archList.includes(d.favArch) || !d.favArch ? Explore.archList : [d.favArch, ...Explore.archList];

    $('pg-profile').innerHTML = `
      <div class="pf-head" ${d.avatar ? `style="--art:url('${esc(d.avatar.art)}')"` : ''}>
        <div class="pf-av">${av}</div>
        <div style="flex:1;min-width:0">
          <input type="text" id="pf-name" class="pf-name" maxlength="20" value="${esc(Profile.name())}" aria-label="Nombre para mostrar">
          <div class="rank">${esc(Profile.rank())}</div>
          ${d.duels.length ? (r => `<div class="muted rec">Duelos: ${r.win} ganados · ${r.loss} perdidos${r.draw ? ' · ' + r.draw + ' empates' : ''}</div>`)(Profile.record()) : ''}
        </div>
      </div>
      <div class="stats3">
        <div class="stat"><b>${Deck.cards.length}</b><span>cartas en el deck</span></div>
        <div class="stat"><b>${distinct}</b><span>cartas distintas</span></div>
        <div class="stat"><b>$${Deck.total().toFixed(0)}</b><span>valor estimado</span></div>
      </div>

      <h2>Color de tu tema</h2>
      <div class="swatches" role="group" aria-label="Color del tema">
        ${Object.entries(CONFIG.THEMES).map(([k, t]) =>
          `<button class="sw ${d.theme === k ? 'on' : ''}" data-theme="${k}" style="--c:${t.acc}" title="${t.label}" aria-label="${t.label}" aria-pressed="${d.theme === k}"></button>`).join('')}
      </div>
      <p class="muted" id="pf-theme-name">Tema: ${CONFIG.THEMES[d.theme].label}</p>

      <h2>Arquetipo favorito</h2>
      <select id="pf-arch" aria-label="Arquetipo favorito">
        <option value="">Ninguno</option>
        ${arts.map(n => `<option value="${esc(n)}" ${n === d.favArch ? 'selected' : ''}>${esc(n)}</option>`).join('')}
      </select>
      <p class="muted">Aparece como «Para ti» al empezar en la pestaña Cartas.</p>

      <h2>Elige tu avatar</h2>
      ${d.recents.length
        ? `<div class="strip">${d.recents.map((r, i) =>
            `<button data-r="${i}" class="${d.avatar && d.avatar.id === r.id ? 'on' : ''}" aria-label="Usar ${esc(r.name)} como avatar"><img src="${esc(r.art)}" alt=""></button>`).join('')}</div>
           <p class="muted small">Son las últimas cartas que abriste. Toca una para usarla de avatar.</p>`
        : `<div class="empty" style="padding:14px 0">${Art.back()}<p>Abre algunas cartas y aparecerán aquí para que elijas tu avatar.</p></div>`}

      <h2>Instalar en tu celular</h2>
      ${Pwa.html()}`;

    if ($('pwa-install')) $('pwa-install').onclick = Pwa.install;

    $('pf-name').onchange = e => {
      Profile.data.display = e.target.value.trim().slice(0, 20);
      Profile.save();
      refreshHeader();
      Hero.refreshText();
      ProfileUI.render();
    };
    document.querySelectorAll('#pg-profile .sw').forEach(b => b.onclick = () => {
      Profile.data.theme = b.dataset.theme;
      Profile.save();
      Profile.apply();
      ProfileUI.render();
    });
    $('pf-arch').onchange = e => {
      Profile.data.favArch = e.target.value;
      Profile.save();
      Explore.renderChips();
    };
    document.querySelectorAll('#pg-profile .strip button').forEach(b => b.onclick = () => {
      const r = Profile.data.recents[+b.dataset.r];
      Profile.data.avatar = { id: r.id, name: r.name, art: r.art };
      Profile.save();
      refreshHeader();
      toast('Avatar actualizado');
      ProfileUI.render();
    });
  },
};
