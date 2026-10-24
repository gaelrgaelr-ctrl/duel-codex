/* ============================================================
   tool-misc.js — probabilidades, moneda y dados, historial de duelos
   ============================================================ */

/* ---------- Probabilidades ---------- */
const ToolProb = {
  render(el) {
    const N0 = Deck.main().length >= 6 ? Deck.main().length : 40;
    el.innerHTML = `
      <p class="muted">Calcula la probabilidad de robar una carta (o varias copias) en tu mano inicial y turno tras turno.</p>
      <div class="calc">
        <label>Cartas en el deck<input type="number" inputmode="numeric" id="pc-n" value="${N0}" min="1" max="200"></label>
        <label>Copias de la carta<input type="number" inputmode="numeric" id="pc-k" value="3" min="0" max="60"></label>
        <label>Cartas que ya viste<input type="number" inputmode="numeric" id="pc-s" value="5" min="1" max="60"></label>
        <label>Quieres al menos<input type="number" inputmode="numeric" id="pc-m" value="1" min="1" max="10"></label>
      </div>
      <div class="panel" id="pc-out" style="margin-top:12px"></div>`;
    const calc = () => {
      const N = Math.max(1, +$('pc-n').value || 1), K = Math.min(N, Math.max(0, +$('pc-k').value || 0));
      const S = Math.min(N, Math.max(1, +$('pc-s').value || 1)), M = Math.max(1, +$('pc-m').value || 1);
      let rows = '';
      for (let extra = 0; extra <= 5; extra++) {
        const seen = Math.min(N, S + extra);
        rows += `<tr><td>${extra === 0 ? 'Con ' + seen + ' cartas' : 'Robando ' + extra + ' más (' + seen + ' en total)'}</td><td><b>${Prob.pct(Prob.atLeast(N, K, seen, M))}</b></td></tr>`;
      }
      $('pc-out').innerHTML = `<p style="margin:10px 0 0">Probabilidad de ver al menos ${M} ${M === 1 ? 'copia' : 'copias'}:</p>
        <p class="bignum">${Prob.pct(Prob.atLeast(N, K, S, M))}</p><table><tbody>${rows}</tbody></table>
        <p class="muted small">Cálculo exacto. Un deck de 40 cartas con 3 copias da cerca de 33% en una mano de 5.</p>`;
    };
    el.oninput = calc;
    calc();
  },
};
Tools.register({
  k: 'prob', icon: '🎯', title: 'Probabilidades',
  desc: 'Cuántas copias necesitas para robar una carta a tiempo.',
  render: ToolProb.render,
});

/* ---------- Moneda y dados ---------- */
const ToolDice = {
  count: 1,
  rnd(n) {
    try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
    catch (e) { return Math.floor(Math.random() * n); }
  },
  render(el) {
    el.innerHTML = `
      <p class="muted">Lanza hasta tres a la vez, como piden muchos efectos de cartas.</p>
      <div class="seg" role="group" aria-label="Cantidad">
        ${[1, 2, 3].map(n => `<button data-n="${n}" class="${ToolDice.count === n ? 'on' : ''}">${n}</button>`).join('')}
      </div>
      <div class="actions" style="margin:14px 0">
        <button class="btn" id="roll-dice">Lanzar dados</button>
        <button class="btn" id="roll-coin">Lanzar monedas</button>
      </div>
      <div class="throws" id="throws" aria-live="polite"></div>`;
    el.querySelector('.seg').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      ToolDice.count = +b.dataset.n;
      el.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b));
    };
    const show = (items, cls) => {
      $('throws').innerHTML = items.map((t, i) => `<span class="throw ${cls}" style="--d:${i * 0.08}s">${t}</span>`).join('');
    };
    $('roll-dice').onclick = () => show(Array.from({ length: ToolDice.count }, () => ToolDice.rnd(6) + 1), 'die');
    $('roll-coin').onclick = () => show(Array.from({ length: ToolDice.count }, () => ToolDice.rnd(2) ? 'Cara' : 'Cruz'), 'coin');
  },
};
Tools.register({
  k: 'dice', icon: '🎲', title: 'Moneda y dados',
  desc: 'Lanza hasta tres dados o monedas a la vez.',
  render: ToolDice.render,
});

/* ---------- Historial de duelos ---------- */
const ToolHistory = {
  LABEL: { win: 'Victoria', loss: 'Derrota', draw: 'Empate' },
  render(el) {
    const duels = Profile.data.duels, r = Profile.record();
    const total = r.win + r.loss + r.draw;
    if (!duels.length) {
      el.innerHTML = `<div class="empty">${Art.back()}<h3>Aún no hay duelos</h3>
        <p>Cuando termine un duelo en el contador de LP, toca Guardar en el historial.</p>
        <button class="btn" id="hist-go">Abrir contador de LP</button></div>`;
      $('hist-go').onclick = () => Tools.open('duel');
      return;
    }
    const rate = total ? Math.round(r.win / total * 100) : 0;
    el.innerHTML = `
      <div class="stats3">
        <div class="stat"><b>${r.win}</b><span>victorias</span></div>
        <div class="stat"><b>${r.loss}</b><span>derrotas</span></div>
        <div class="stat"><b>${rate}%</b><span>de victorias</span></div>
      </div>
      <h2>Últimos duelos</h2>
      ${duels.map(d => `<div class="row hist ${d.result}">
        <div class="t"><b>${esc(d.opponent)}</b>
          <small>${new Date(d.ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}${d.deck ? ' · ' + esc(d.deck) : ''}</small></div>
        <span class="tag res-${d.result}">${ToolHistory.LABEL[d.result] || d.result}</span>
        <button class="btn sec small" data-ts="${d.ts}" aria-label="Borrar este duelo">Borrar</button></div>`).join('')}`;
    el.onclick = e => {
      const b = e.target.closest('[data-ts]');
      if (b) { Profile.removeDuel(+b.dataset.ts); ToolHistory.render(el); }
    };
  },
};
Tools.register({
  k: 'hist', icon: '📜', title: 'Historial de duelos',
  desc: 'Tus victorias, derrotas y contra quién jugaste.',
  render: ToolHistory.render,
});
