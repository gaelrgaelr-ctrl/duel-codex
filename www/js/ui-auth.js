/* ============================================================
   ui-auth.js — pantalla de login
   ============================================================ */

const AuthUI = {
  mode: 'in',   // 'in' | 'up'

  setMode(m) {
    AuthUI.mode = m;
    $('t-in').classList.toggle('on', m === 'in');
    $('t-up').classList.toggle('on', m === 'up');
    $('a-pass2').classList.toggle('hide', m !== 'up');
    $('a-go').textContent = m === 'in' ? 'Entrar' : 'Crear cuenta';
    $('a-pass').autocomplete = m === 'in' ? 'current-password' : 'new-password';
    $('a-err').textContent = '';
  },

  // Fondo: collage con el arte de cartas vistas antes; si no hay, un círculo arcano
  paintBackdrop() {
    const urls = Store.get('dc_art', []);
    $('auth-art').innerHTML = urls.length >= 6
      ? '<div class="collage">' + urls.slice(0, 15).map(u => `<img src="${esc(u)}" alt="">`).join('') + '</div>'
      : Art.arcane();
    $('auth-mark').innerHTML = Art.back();
  },

  show() {
    $('app').classList.add('hide');
    $('auth').classList.remove('hide');
    $('a-user').value = '';
    $('a-pass').value = '';
    $('a-pass2').value = '';
    AuthUI.paintBackdrop();
    AuthUI.setMode('in');
  },

  hide() { $('auth').classList.add('hide'); },

  async submit() {
    const user = $('a-user').value.trim().toLowerCase();
    const pass = $('a-pass').value;
    $('a-err').textContent = '';
    let err;
    if (AuthUI.mode === 'up') {
      err = await Auth.register(user, pass, $('a-pass2').value);
    } else {
      err = await Auth.login(user, pass);
    }
    if (err) { $('a-err').textContent = err; return; }
    enterApp(user);   // definido en app.js
  },

  bind() {
    $('t-in').onclick = () => AuthUI.setMode('in');
    $('t-up').onclick = () => AuthUI.setMode('up');
    $('a-go').onclick = AuthUI.submit;
    $('a-guest').onclick = () => enterApp(Auth.GUEST);
    ['a-user', 'a-pass', 'a-pass2'].forEach(id =>
      $(id).addEventListener('keydown', e => { if (e.key === 'Enter') AuthUI.submit(); }));
  },
};
