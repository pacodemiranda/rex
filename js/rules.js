import { today, monday, addDays, dow } from './util.js';
import { getRec, list, put } from './store.js';

export const CATALOGO = [['Musculação', '🏋️'], ['Funcional', '🔥'], ['Corrida', '🏃'], ['Caminhada', '🚶'], ['Natação', '🏊'], ['Futevôlei', '🏐'], ['Vôlei', '🏐'], ['Futebol', '⚽'], ['Tênis', '🎾'], ['Jiu-jitsu / Lutas', '🥋'], ['Pilates', '🤸'], ['Yoga', '🧘'], ['Dança', '💃'], ['Ciclismo', '🚴']];
export const ATIVIDADES = CATALOGO.map(c => c[0]);
export const PREFERENCIAS = ATIVIDADES;
// Atividades que têm programa de treino (exercícios, séries, carga). As demais são só registro.
export const PROG_ATIV = ['Musculação', 'Funcional', 'Academia'];
export const temPrograma = a => PROG_ATIV.includes(a);
export const MIN_VALIDO = 20;
export const emptyPlan = () => ({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });
export const planOf = r => ({ ...emptyPlan(), ...(r || {}) });

export const profile = () => getRec('profile', 'me')?.data || null;
export const routine = () => getRec('routine', 'current')?.data || null;
export const cycle = () => getRec('cycle', 'current')?.data || null;
export const program = () => getRec('program', 'current')?.data || null;
export const pedido = () => getRec('request', 'programa')?.data || null;
export const diagOk = () => !!profile()?.diagOk;
export const isOnboarded = () => !!(routine() && cycle());
// Itens da rotina: 'w:<id>' é um treino do programa; texto livre é outra atividade
export const label = it => { if (typeof it === 'string' && it.startsWith('w:')) { const w = program()?.workouts?.find(x => x.id === it.slice(2)); return w ? w.name : 'Treino'; } return it; };
export const labels = arr => (arr || []).map(label);

// Plano da semana: congelado na primeira vez em que a semana é vista
export function weekPlan(mon) {
  const w = getRec('week', mon), rt = routine(), cr = profile()?.criado;
  if (w) {
    const plan = planOf(w.data.plan); // dias antes de começar no app mostram a rotina (só não contam)
    if (cr && rt) { const base = planOf(rt.plan); for (let i = 0; i < 7; i++) if (addDays(mon, i) < cr && !plan[i].length) plan[i] = base[i]; }
    return plan;
  }
  const plan = planOf(rt?.plan);
  if (rt && mon <= monday(today())) put('week', mon, { plan });
  return plan;
}

export function checkinsOn(date) { return list('checkin').filter(r => r.data.date === date).map(r => r.data).sort((a, b) => (a.at || '').localeCompare(b.at || '')); }
export const validCount = date => checkinsOn(date).filter(c => c.minutes >= MIN_VALIDO).length;

// Estado de cada dia: pre, done, bonus, absent, rest, today, resttoday, future, restf
export function dayState(date, plan) {
  const t = today(), has = plan.length > 0, valid = validCount(date) > 0, cr = profile()?.criado;
  if (cr && date < cr && !valid) return 'pre'; // antes de começar no app
  if (date > t) return has ? 'future' : 'restf';
  if (date === t) return has ? (valid ? 'done' : 'today') : (valid ? 'bonus' : 'resttoday');
  return has ? (valid ? 'done' : 'absent') : (valid ? 'bonus' : 'rest');
}

export function weekSummary(mon) {
  const plan = weekPlan(mon);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(mon, i), p = plan[i] || [];
    days.push({ i, date, plan: p, state: dayState(date, p), checks: checkinsOn(date) });
  }
  const meta = days.filter(d => d.plan.length && d.state !== 'pre').length;
  const active = days.filter(d => d.checks.some(c => c.minutes >= MIN_VALIDO)).length;
  return { mon, days, meta, active, closed: addDays(mon, 6) < today() };
}

export const isPaused = mon => list('pause').some(p => p.data.from <= addDays(mon, 6) && p.data.to >= mon);

// Etapas (semanas cumpridas) e semana atual do ciclo
export function cycleInfo() {
  const c = cycle(); if (!c) return null;
  const now = monday(today());
  let semana = 0, etapas = 0;
  for (let w = c.start; w <= now; w = addDays(w, 7)) {
    if (isPaused(w)) continue;
    semana++;
    const s = weekSummary(w);
    if (s.closed && s.meta > 0 && s.active >= s.meta) etapas++;
  }
  return { ...c, semana: Math.min(semana, c.duration), etapas, concluido: etapas >= c.duration };
}

// Pontos: 1º check-in do dia vale 40 pts + 5 moedas, 2º vale 20 + 2, depois não pontua
export function pontosDoCheckin(date, minutes) {
  if (minutes < MIN_VALIDO) return { pts: 0, coins: 0 };
  const n = validCount(date);
  if (n === 0) return { pts: 40, coins: 5 };
  if (n === 1) return { pts: 20, coins: 2 };
  return { pts: 0, coins: 0 };
}
export function totais() {
  const cs = list('checkin').map(r => r.data);
  const pts = cs.reduce((a, c) => a + (c.pts || 0), 0);
  const gastas = list('purchase').reduce((a, r) => a + (r.data.cost || 0), 0);
  const coins = cs.reduce((a, c) => a + (c.coins || 0), 0) - gastas;
  return { pts, coins, checkins: cs.length };
}
export const rotinaTemDias = plan => Object.values(plan).some(a => a.length);

// Cenário alterna semana a semana (A e B)
export const cenarioDaSemana = (mon, c) => {
  const start = c?.start || mon; const n = Math.round((new Date(mon) - new Date(start)) / (7 * 864e5));
  return Math.abs(n) % 2 === 0 ? 'a' : 'b';
};
export { dow };
