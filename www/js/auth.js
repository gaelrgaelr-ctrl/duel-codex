/* ============================================================
   auth.js — cuentas locales (sin interfaz)
   Las cuentas viven en el navegador. Para cuentas reales en
   varios dispositivos hay que reemplazar register() y login()
   por llamadas a un backend; el resto de la app no cambia.
   ============================================================ */

const Auth = {
  GUEST: 'invitado',

  users: () => Store.get('dc_users', {}),
  getSession: () => Store.getRaw('dc_session'),
  setSession: u => Store.setRaw('dc_session', u),
  clearSession: () => Store.remove('dc_session'),

  // ¿La sesión guardada sigue siendo válida?
  validSession(s) { return !!s && (s === Auth.GUEST || !!Auth.users()[s]); },

  randomSalt() {
    try {
      const a = new Uint8Array(16);
      crypto.getRandomValues(a);
      return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return String(Math.random()).slice(2) + Date.now(); }
  },

  // Respaldo para navegadores sin crypto.subtle (los hashes empiezan con "f")
  weakHash(pw, salt) {
    let h = 5381;
    const s = salt + pw;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return 'f' + (h >>> 0).toString(16);
  },

  async hashPw(pw, salt, forceWeak) {
    if (!forceWeak) {
      try {
        if (window.crypto && crypto.subtle) {
          const enc = new TextEncoder();
          const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
          const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
          return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
      } catch (e) { /* se usa el respaldo */ }
    }
    return Auth.weakHash(pw, salt);
  },

  // Devuelven un mensaje de error, o null si todo salió bien
  async register(user, pass, pass2) {
    if (!/^[a-z0-9_.-]{3,20}$/.test(user)) return 'Usuario: 3 a 20 caracteres (letras, números, _ . -).';
    if (user === Auth.GUEST) return 'Ese nombre está reservado.';
    const users = Auth.users();
    if (users[user]) return 'Ese usuario ya existe.';
    if (pass.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (pass !== pass2) return 'Las contraseñas no coinciden.';
    const salt = Auth.randomSalt();
    users[user] = { salt, hash: await Auth.hashPw(pass, salt) };
    Store.set('dc_users', users);
    return null;
  },

  async login(user, pass) {
    const u = Auth.users()[user];
    const bad = 'Usuario o contraseña incorrectos.';
    if (!u) return bad;
    const h = await Auth.hashPw(pass, u.salt, u.hash.startsWith('f'));
    return h === u.hash ? null : bad;
  },
};
