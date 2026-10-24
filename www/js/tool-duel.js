/* ============================================================
   tool-duel.js — contador de puntos de vida (LP) para dos jugadores
   El duelo se guarda solo, así que sigue ahí si cierras la app.
   ============================================================ */

const ToolDuel = {
  state: null,
  el: null,

  key: () => 'duel_' + Profile.user,

  fresh(start, keep) {
    return {
      start, turn: 1, saved: false, rotate: keep ? keep.rotate : false,
      p: [{ name: keep ? keep.p[0].name : 'Tú', lp: start }, { name: keep ? keep.p[1].name : 'Oponente', lp: start }],
      log: [],
    };
  },

  load() {
    const s = Store.get(ToolDuel.key(), null);
    ToolDuel.state = (s && Array.isArray(s.p) && s.p.length === 2) ? s : ToolDuel.fresh(8000);
  },
  save() { Store.set(ToolDuel.key(), ToolDuel.state); },

  // Suma o resta puntos al jugador i
  change(i, delta) {
    const s = ToolDuel.state, p = s.p[i], from = p.lp;
    p.lp = Math.max(0, from + delta);
    if (p.lp === from) return;
    s.log.unshift({ i, from, to: p.lp, turn: s.turn });
    s.log = s.log.slice(0, 60);
    if (s.p[0].lp > 0 && s.p[1].lp > 0) s.saved = false;
    ToolDuel.save();
    ToolDuel.draw();
  },

  // La mitad se redondea hacia arriba, como en las reglas del juego
  half(i) { const p = ToolDuel.state.p[i]; ToolDuel.change(i, Math.ceil(p.lp / 2) - p.lp); },

  undo() {
    const s = ToolDuel.state, l = s.log.shift();
    if (!l) return;
    s.p[l.i].lp = l.from;
    s.saved = false;
    ToolDuel.save();
    ToolDuel.draw();
  },

  // Resultado visto desde "Tú" (jugador 0): 'win' | 'loss' | 'draw' | null
  result() {
    const [a, b] = ToolDuel.state.p;
    if (a.lp === 0 && b.lp === 0) return 'draw';
    if (a.lp === 0) return 'loss';
    if (b.lp === 0) return 'win';
    return null;
  },

  panel(i) {
    const s = ToolDuel.state, p = s.p[i];
    const pct = Math.max(0, Math.min(100, p.lp / s.start * 100));
    const btn = d => `<button data-d="${d}" data-i="${i}">${d > 0 ? '+' : '−'}${Math.abs(d)}</button>`;
    return `<section class="lp ${i === 1 && s.rotate ? 'flip' : ''} ${p.lp === 0 ? 'zero' : ''}">
      <input type="text" class="lp-name" data-name="${i}" value="${esc(p.name)}" maxlength="16" aria-label="Nombre del jugador ${i + 1}">
      <div class="lp-num" aria-live="polite" aria-label="${p.lp} puntos de vida">${p.lp}</div>
      <div class="lp-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <div class="lp-btns minus">${[-1000, -500, -100].map(btn).join('')}</div>
      <div class="lp-btns plus">${[100, 500, 1000].map(btn).join('')}</div>
      <div class="lp-custom">
        <input type="number" inputmode="numeric" min="0" id="amt${i}" placeholder="Otra cantidad" aria-label="Otra cantidad para el jugador ${i + 1}">
        <button data-act="minus" data-i="${i}" aria-label="Restar">−</button>
        <button data-act="plus" data-i="${i}" aria-label="Sumar">+</button>
        <button data-act="half" data-i="${i}" title="Mitad (redondeo hacia arriba)">½</button>
      </div></section>`;
  },

  draw() {
    const s = ToolDuel.state, r = ToolDuel.result();
    const res = {
      win: '¡Ganaste el duelo!', loss: 'Perdiste el duelo.', draw: 'El duelo terminó en empate.',
    };
    ToolDuel.el.innerHTML = `<div class="duel">
      ${ToolDuel.panel(1)}
      <div class="mid">
        <div class="turn"><button class="btn sec small" data-act="turn-" aria-label="Turno anterior">−</button>
          <span>Turno <b>${s.turn}</b></span>
          <button class="btn sec small" data-act="turn+" aria-label="Turno siguiente">+</button></div>
        <button class="btn sec small" data-act="undo" ${s.log.length ? '' : 'disabled'}>Deshacer</button>
        <button class="btn sec small" data-act="rotate" aria-pressed="${s.rotate}">Girar oponente</button>
      </div>
      ${ToolDuel.panel(0)}
      ${r ? `<div class="banner">${res[r]}
          ${s.saved ? '<span class="muted">Guardado en el historial.</span>'
            : '<button class="btn" data-act="save">Guardar en el historial</button>'}</div>` : ''}
      <div class="mid">
        <label class="muted" for="lp-start">Puntos iniciales</label>
        <select id="lp-start" aria-label="Puntos de vida iniciales">
          ${[8000, 4000, 16000].map(v => `<option value="${v}" ${v === s.start ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <button class="btn sec small" data-act="reset">Duelo nuevo</button>
      </div>
      ${s.log.length ? `<ul class="log">${s.log.slice(0, 8).map(l =>
        `<li>Turno ${l.turn} · ${esc(s.p[l.i].name)}: ${l.from} → ${l.to} (${l.to - l.from > 0 ? '+' : '−'}${Math.abs(l.to - l.from)})</li>`).join('')}</ul>` : ''}
    </div>`;
  },

  onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const s = ToolDuel.state, i = +b.dataset.i;
    if (b.dataset.d) return ToolDuel.change(i, +b.dataset.d);
    switch (b.dataset.act) {
      case 'minus': case 'plus': {
        const v = parseInt($('amt' + i).value, 10);
        if (!(v > 0)) { toast('Escribe una cantidad mayor que 0'); return; }
        return ToolDuel.change(i, b.dataset.act === 'minus' ? -v : v);
      }
      case 'half': return ToolDuel.half(i);
      case 'undo': return ToolDuel.undo();
      case 'turn+': s.turn++; ToolDuel.save(); return ToolDuel.draw();
      case 'turn-': s.turn = Math.max(1, s.turn - 1); ToolDuel.save(); return ToolDuel.draw();
      case 'rotate': s.rotate = !s.rotate; ToolDuel.save(); return ToolDuel.draw();
      case 'reset':
        if (!s.log.length || confirm('¿Empezar un duelo nuevo? Se borrarán los puntos actuales.')) {
          ToolDuel.state = ToolDuel.fresh(s.start, s); ToolDuel.save(); ToolDuel.draw();
        }
        return;
      case 'save': {
        const r = ToolDuel.result();
        if (!r) return;
        Profile.addDuel(r, s.p[1].name, Deck.name());
        s.saved = true; ToolDuel.save(); ToolDuel.draw();
        toast('Duelo guardado en el historial');
      }
    }
  },

  render(el) {
    ToolDuel.el = el;
    ToolDuel.load();
    ToolDuel.draw();
    el.onclick = ToolDuel.onClick;
    el.onchange = e => {
      const s = ToolDuel.state;
      if (e.target.dataset.name != null) {
        s.p[+e.target.dataset.name].name = e.target.value.trim().slice(0, 16) || (e.target.dataset.name === '0' ? 'Tú' : 'Oponente');
        ToolDuel.save(); ToolDuel.draw();
      } else if (e.target.id === 'lp-start') {
        const v = +e.target.value;
        if (!s.log.length || confirm('¿Empezar un duelo nuevo con ' + v + ' puntos?')) {
          ToolDuel.state = ToolDuel.fresh(v, s); ToolDuel.save();
        }
        ToolDuel.draw();
      }
    };
  },
};

Tools.register({
  k: 'duel', icon: '⚔️', title: 'Contador de LP',
  desc: 'Puntos de vida de los dos jugadores, turnos y deshacer.',
  render: ToolDuel.render,
});
