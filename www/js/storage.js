/* ============================================================
   storage.js — ÚNICO punto de acceso al almacenamiento.
   Hoy usa localStorage. Al pasar a app móvil o a un backend
   (Firebase, etc.) solo hay que cambiar este archivo.
   ============================================================ */

const Store = {
  // valores JSON (objetos, listas)
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  },
  // texto plano (por ejemplo, el nombre de la sesión)
  getRaw(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  setRaw(key, val) {
    try { localStorage.setItem(key, val); return true; } catch (e) { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  },
};
