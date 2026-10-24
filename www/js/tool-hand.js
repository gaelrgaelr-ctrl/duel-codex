/* ============================================================
   tool-hand.js — simulador de manos y cálculo de probabilidades
   Las probabilidades son exactas (hipergeométrica), no simulaciones.
   ============================================================ */

const Prob = {
  comb(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let r = 1;
    for (let i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return r;
  },
  // Probabilidad de ver exactamente x cartas de un grupo de K copias
  // al robar n cartas de un mazo de N
  exact(N, K, n, x) { return Prob.comb(K, x) * Prob.comb(N - K, n - x) / Prob.comb(N, n); },
  // Probabilidad de ver al menos m
  atLeast(N, K, n, m) {
    n = Math.min(n, N); K = Math.min(K, N);
    if (m <= 0) return 1;
    let s = 0;
    for (let x = 0; x < m; x++) s += Prob.exact(N, K, n, x);
    return Math.min(1, Math.max(0, 1 - s));
  },
  pct: p => (p * 100).toFixed(1) + '%',
};

const ToolHand = {
  el: null,
  first: true,                       // true: empiezas (5 cartas); false: segundo (6)
  hand: [],
  groups: { a: [], b: [], m: [] },   // ids de cartas: A, B y muertas

  gkey: () => 'hand_' + Profile.user + '_' + Deck.activeId,
  loadGroups() {
    const g = Store.get(ToolHand.gkey(), null);
    ToolHand.groups = g && g.a && g.b && g.m ? g : { a: [], b: [], m: [] };
  },
  saveGroups() { Store.set(ToolHand.gkey(), ToolHand.groups); },

  size: () => ToolHand.first ? 5 : 6,
  uniq: () => [...new Map(Deck.main().map(c => [c.id, c])).values()]
    .sort((a, b) => Card.shownName(a).localeCompare(Card.shownName(b))),
  copiesIn(ids) { const s = new Set(ids); return Deck.main().filter(c => s.has(c.id)).length; },

  // Baraja el Main Deck y reparte una mano
  draw() {
    const pool = Deck.main().slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    ToolHand.hand = pool.slice(0, ToolHand.size());
    ToolHand.drawHand();
  },

  drawHand() {
    $('hand-area').innerHTML = `<div class="hand">${ToolHand.hand.map((c, i) =>
      `<button data-h="${i}" style="--fc:${Card.frame(c).color};--d:${i * 0.07}s" aria-label="Abrir ${esc(Card.shownName(c))}">
        <img src="${esc(Card.imgSmall(c))}" alt="${esc(Card.shownName(c))}"></button>`).join('')}</div>`;
  },

  // Filas de resultados según las cartas marcadas
  rows() {
    const N = Deck.main().length, h = ToolHand.size(), g = ToolHand.groups;
    const KA = ToolHand.copiesIn(g.a), KB = ToolHand.copiesIn(g.b), KM = ToolHand.copiesIn(g.m);
    const KU = ToolHand.copiesIn([...new Set([...g.a, ...g.b])]);
    const PA = Prob.atLeast(N, KA, h, 1), PB = Prob.atLeast(N, KB, h, 1), PU = Prob.atLeast(N, KU, h, 1);
    const rows = [];
    if (KA) rows.push({ label: 'Al menos 1 carta A', p: PA });
    if (KB) rows.push({ label: 'Al menos 1 carta B', p: PB });
    if (KA && KB) rows.push({ label: 'Cartas A y B juntas', p: PA + PB - PU });
    if (KA || KB) rows.push({ label: 'Ninguna A ni B', p: 1 - PU, bad: true });
    if (KM) {
      rows.push({ label: 'Al menos 1 carta muerta', p: Prob.atLeast(N, KM, h, 1), bad: true });
      rows.push({ label: '2 o más cartas muertas', p: Prob.atLeast(N, KM, h, 2), bad: true });
    }
    return rows;
  },

  drawResults() {
    const rows = ToolHand.rows();
    $('hand-res').innerHTML = rows.length
      ? `<div class="res">${rows.map(r => `<div class="r ${r.bad ? 'bad' : ''}">
          <div class="lbl"><span>${r.label}</span><b>${Prob.pct(r.p)}</b></div>
          <div class="bar2" aria-hidden="true"><i style="width:${(r.p * 100).toFixed(1)}%"></i></div></div>`).join('')}</div>
        <p class="muted small">Cálculo exacto para una mano de ${ToolHand.size()} cartas de tu Main Deck (${Deck.main().length} cartas).</p>`
      : '<p class="muted">Marca cartas con A, B o ✖ para ver las probabilidades de tu mano inicial.</p>';
  },

  render(el) {
    ToolHand.el = el;
    ToolHand.loadGroups();
    const N = Deck.main().length;
    if (N < 6) {
      el.innerHTML = `<div class="empty">${Art.back()}<h3>Faltan cartas</h3>
        <p>Necesitas al menos 6 cartas en el Main Deck de «${esc(Deck.name())}» para probar manos.</p>
        <button class="btn" id="hand-go">Explorar cartas</button></div>`;
      $('hand-go').onclick = () => show('search');
      return;
    }
    const g = ToolHand.groups;
    el.innerHTML = `
      <p class="muted">Deck: <b>${esc(Deck.name())}</b> · Main Deck de ${N} cartas.</p>
      <div class="seg" role="group" aria-label="Quién empieza">
        <button id="seg-first" class="${ToolHand.first ? 'on' : ''}">Empiezo yo · 5 cartas</button>
        <button id="seg-second" class="${ToolHand.first ? '' : 'on'}">Empiezo segundo · 6 cartas</button>
      </div>
      <div id="hand-area"></div>
      <p><button class="btn" id="hand-draw">Robar otra mano</button></p>

      <h2>Qué tan consistente es tu deck</h2>
      <p class="muted">A y B son las cartas que quieres ver en tu mano inicial (por ejemplo, tus iniciadores).
        ✖ marca las cartas muertas, las que no quieres robar.</p>
      <div id="hand-res"></div>
      <div class="panel" style="margin-top:12px"><table class="grp"><tbody>
        ${ToolHand.uniq().map(c => `<tr>
          <td><b>${esc(Card.shownName(c))}</b> <span class="muted">×${Deck.copies(c)}</span></td>
          ${[['a', 'A'], ['b', 'B'], ['m', '✖']].map(([k, t]) =>
            `<td><button class="tg ${k === 'm' ? 'x' : ''} ${g[k].includes(c.id) ? 'on' : ''}" data-id="${c.id}" data-g="${k}"
              aria-pressed="${g[k].includes(c.id)}" aria-label="${t === '✖' ? 'Carta muerta' : 'Grupo ' + t}: ${esc(Card.shownName(c))}">${t}</button></td>`).join('')}
        </tr>`).join('')}
      </tbody></table></div>`;

    $('seg-first').onclick = () => { ToolHand.first = true; ToolHand.render(el); ToolHand.draw(); };
    $('seg-second').onclick = () => { ToolHand.first = false; ToolHand.render(el); ToolHand.draw(); };
    $('hand-draw').onclick = ToolHand.draw;
    $('hand-area').onclick = e => {
      const b = e.target.closest('[data-h]');
      if (b && ToolHand.hand[+b.dataset.h]) Detail.open(ToolHand.hand[+b.dataset.h]);
    };
    el.querySelector('table.grp').onclick = e => {
      const b = e.target.closest('.tg');
      if (!b) return;
      const id = +b.dataset.id, list = ToolHand.groups[b.dataset.g], i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1); else list.push(id);
      b.classList.toggle('on', i < 0);
      b.setAttribute('aria-pressed', i < 0);
      ToolHand.saveGroups();
      ToolHand.drawResults();
    };
    ToolHand.draw();
    ToolHand.drawResults();
  },
};

Tools.register({
  k: 'hand', icon: '🖐️', title: 'Simulador de manos',
  desc: 'Roba manos de tu deck y calcula qué tan consistente es.',
  render: ToolHand.render,
});
