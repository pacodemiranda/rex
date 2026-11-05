import { session, onChange, sync } from './store.js';
import { isOnboarded } from './rules.js';
import * as V from './views.js';

export const APP_VERSION = '0.1.0';
V.ui.version = APP_VERSION;
const root = document.getElementById('app');
const ROUTES = { login: V.login, onb1: V.onb1, onb2: V.onb2, onb3: V.onb3, jornada: V.jornada, checkin: V.checkin, armario: V.armario, evolucao: V.evolucao, grupo: V.grupo, perfil: V.perfil, editar: V.editar };
V.setGo(h => { if (location.hash === h) render(); else location.hash = h; });

function current() {
  let name = location.hash.replace(/^#\//, '').split('?')[0] || 'jornada';
  if (!session()) return 'login';
  if (name === 'login') name = 'jornada';
  if (!isOnboarded() && !name.startsWith('onb')) return 'onb1';
  if (isOnboarded() && name.startsWith('onb')) return 'jornada';
  return ROUTES[name] ? name : 'jornada';
}
let lastName = null;
let rendering = false, again = false;
function render() {
  if (rendering) { again = true; return; }
  rendering = true;
  try { draw(); } finally { rendering = false; }
  if (again) { again = false; render(); }
}
function draw() {
  const name = current();
  if (lastName === 'editar' && name !== 'editar') V.leaveEdit();
  lastName = name;
  const keep = document.querySelector('.scroll')?.scrollTop || 0;
  const v = ROUTES[name]();
  root.innerHTML = v.html + (V.ui.toast ? `<div class="toast" style="max-width:390px;margin:0 auto">${V.ui.toast}</div>` : '');
  if (V.ui.toast) setTimeout(() => { V.ui.toast = null; }, 4000);
  const sc = document.querySelector('.scroll'); if (sc && lastRoute === name) sc.scrollTop = keep;
  lastRoute = name;
  v.after && v.after();
}
let lastRoute = null;
window.__render = render;

root.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = V.A[el.dataset.act]; if (!fn) return;
  const r = fn(el, e);
  if (r && r.then) r.finally(render); else render();
});
root.addEventListener('input', e => { const b = e.target.dataset.bind; if (b) V.ob[b] = e.target.value; });
addEventListener('hashchange', () => { V.ui.sheet = null; render(); });
onChange(() => { if (!document.activeElement || !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) render(); });

render(); sync();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
