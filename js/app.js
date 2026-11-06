import { session, onChange, sync } from './store.js';
import * as R from './rules.js';
import * as V from './views.js';
import * as O from './onboarding.js';
import * as T from './treino.js';
import { nav, setBind } from './state.js';

export const APP_VERSION = '0.7.4';
V.ui.version = APP_VERSION;
const root = document.getElementById('app');
const ROUTES = { bemvindo: O.bemvindo, login: O.login, diag1: () => O.diag(1), diag2: () => O.diag(2), diag3: () => O.diag(3), diag4: () => O.diag(4), diag5: () => O.diag(5), atv: O.atv, progcolar: O.progColar, programa: O.programa, treino: T.treino, onb2: V.onb2, jornada: V.jornada, checkin: V.checkin, armario: V.armario, evolucao: V.evolucao, grupo: V.grupo, perfil: V.perfil, editar: V.editar };
nav.go = h => { if (location.hash === h) render(); else location.hash = h; };

function current() {
  let name = location.hash.replace(/^#\//, '').split('?')[0] || 'jornada';
  if (!session()) return O.welcomed() ? 'login' : 'bemvindo';
  if (name === 'login' || name === 'bemvindo') name = 'jornada';
  if (!R.routine() || !R.cycle()) return (name === 'atv' || name === 'onb2') ? name : 'atv';
  if (name === 'onb2') return 'jornada';
  if (name === 'treino' && !T.hasWk()) return 'jornada';
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
  if (lastName && lastName.startsWith('diag') && !name.startsWith('diag')) O.leaveDiag();
  if (name === 'jornada' && lastName !== 'jornada') V.resetJ();
  lastName = name;
  const keep = document.querySelector('.scroll')?.scrollTop || 0;
  let v;
  try { v = ROUTES[name](); } catch (err) { console.error(err); V.ui.toast = 'Erro ao abrir a tela: ' + (err && err.message); location.hash = '#/jornada'; v = ROUTES.jornada(); }
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
  let r;
  try { r = fn(el, e); } catch (err) { V.ui.toast = 'Erro: ' + (err && err.message); }
  if (r && r.then) r.catch(err => { V.ui.toast = 'Erro: ' + (err && err.message); }).finally(render); else render();
});
root.addEventListener('input', e => { if (e.target.dataset.wk) { T.wkInput(e.target.dataset.wk, e.target.value); return; } const b = e.target.dataset.bind; if (b) { setBind(b, e.target.value); if (b === 'ui.texto') V.ui.val = null; const nb = document.querySelector('[data-act="diagNext"]'); if (nb) nb.disabled = !O.stepOk(+nb.dataset.n); } });
addEventListener('hashchange', () => { V.ui.sheet = null; render(); });
onChange(() => { if (!document.activeElement || !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) render(); });

render(); sync();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
