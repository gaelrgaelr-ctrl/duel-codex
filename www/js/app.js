/* ============================================================
   app.js — navegación, sesión y arranque (se carga al final)
   ============================================================ */

// Muestra una pantalla: 'search' | 'detail' | 'deck' | 'profile'
function show(page) {
  ['search', 'detail', 'deck', 'tools', 'profile'].forEach(p => $('pg-' + p).classList.toggle('hide', p !== page));
  if (page !== 'detail') {
    State.tab = page;
    $('n-search').classList.toggle('on', page === 'search');
    $('n-deck').classList.toggle('on', page === 'deck');
    $('n-tools').classList.toggle('on', page === 'tools');
    $('n-profile').classList.toggle('on', page === 'profile');
  }
  if (page === 'search') { Hero.refreshText(); Explore.renderChips(); }
  window.scrollTo(0, 0);
}

// Avatar y nombre de la cabecera
function refreshHeader() {
  const a = Profile.data.avatar;
  $('who-av').innerHTML = a ? `<img src="${esc(a.art)}" alt="">` : Art.back();
  $('who').textContent = Profile.name();
}

function enterApp(user) {
  Auth.setSession(user);
  Profile.load(user);
  Profile.apply();
  Deck.load(user);
  refreshHeader();
  AuthUI.hide();
  $('app').classList.remove('hide');
  Tools.hub();
  show('search');
  if (!State.appStarted) {
    State.appStarted = true;
    Explore.start();
  } else {
    // otro usuario entró sin recargar la página: se renuevan saludo y categorías
    Hero.refreshText();
    Explore.renderChips();
  }
}

function logout() {
  Auth.clearSession();
  Deck.clearMemory();
  Profile.clear();
  AuthUI.show();
}

function openProfile() { ProfileUI.render(); show('profile'); }

// Botón "atrás" del celular: desde una ficha regresa a la lista en lugar de cerrar la app
function openedDetail() {
  try { history.pushState({ d: 1 }, ''); } catch (e) { /* sin historial: se usa el botón Volver */ }
}
function goBack() {
  if (history.state && history.state.d) history.back();
  else show(State.tab);
}
window.addEventListener('popstate', () => {
  if (!$('pg-detail').classList.contains('hide')) show(State.tab);
  else if (State.tab === 'tools' && Tools.sub) Tools.hub();
});

function boot() {
  Pwa.init();
  Api.initCache();
  $('logo-mark').innerHTML = Art.mark();
  AuthUI.bind();
  Hero.bind();
  Explore.bind();
  $('n-search').onclick = () => show('search');
  $('n-deck').onclick = () => { DeckUI.render(); show('deck'); };
  $('n-tools').onclick = () => { Tools.hub(); show('tools'); };
  $('n-profile').onclick = openProfile;
  $('who-btn').onclick = openProfile;
  $('logout').onclick = logout;

  const s = Auth.getSession();
  if (Auth.validSession(s)) enterApp(s);
  else AuthUI.show();
}

boot();
