import { esc, today, monday, dow, uid } from './util.js';
import { ic, sheet, banner } from './ui.js';
import { put, list } from './store.js';
import * as R from './rules.js';
import { ui, ck, A, nav, num } from './state.js';
import { screen, sheetHtml } from './onboarding.js';

const KEY = 'rex.wk';
let wk = null;
try { wk = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
const save = () => { try { if (wk) localStorage.setItem(KEY, JSON.stringify(wk)); else localStorage.removeItem(KEY); } catch (e) {} };
export const getWk = () => wk;
export const hasWk = () => !!(wk && R.program()?.workouts.some(w => w.id === wk.id));

// última carga usada em cada exercício
function ultimo(ex) {
  const ss = list('sessao').map(r => r.data).sort((a, b) => (b.date + (b.at || '')).localeCompare(a.date + (a.at || '')));
  for (const s of ss) { const f = (s.sets || []).filter(x => x.ex === ex && x.kg).pop(); if (f) return f; }
  return null;
}
A.wkStart = el => {
  const id = el.dataset.id, w = R.program()?.workouts.find(x => x.id === id); if (!w) return;
  if (!wk || wk.id !== id || wk.date !== today()) {
    wk = { id, date: today(), start: Date.now(), sets: {}, restEnd: 0, minutes: 0 };
    w.exercises.forEach((e, i) => { const u = ultimo(e.ex); for (let s = 0; s < (+e.sets || 3); s++) wk.sets[`${i}-${s}`] = { kg: u?.kg ? String(u.kg) : '', reps: '', done: false }; });
  }
  save(); ui.sheet = null; nav.go('#/treino');
};
let tm = null;
const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export function treino() {
  const p = R.program(), w = p.workouts.find(x => x.id === wk.id);
  const total = w.exercises.reduce((a, e) => a + (+e.sets || 3), 0), feitas = Object.values(wk.sets).filter(x => x.done).length;
  const resting = wk.restEnd > Date.now();
  return { html: screen(`<header class="topbar"><a class="icobtn" href="#/jornada" aria-label="Voltar para a jornada">${ic('back')}</a><div class="tb-title"><div class="sub">${esc(w.focus || 'TREINO').toUpperCase()}</div><div>${esc(w.name)}</div></div><div class="wkt" id="wkt">0:00</div></header>
    <div class="scroll" style="padding-bottom:${resting ? 150 : 90}px">
      ${(Array.isArray(w.warmup) && w.warmup.length) ? `<div class="card soft"><h2>Aquecimento</h2>${w.warmup.map(x => `<p class="small">• ${esc(x)}</p>`).join('')}</div>` : ''}
      ${w.exercises.map((e, i) => {
        const ex = p.exercises[e.ex] || { name: e.ex }, n = +e.sets || 3, time = e.mode === 'time';
        return `<div class="card"><div class="row2"><div><h2>${esc(ex.name)}</h2><p class="small mut">${n} x ${esc(time ? e.seconds + 's' : e.reps || '')}${e.side ? ' por lado' : ''} · descanso ${e.rest || w.rest || 60}s</p></div>${ex.video ? `<a class="icobtn sm" href="https://youtu.be/${esc(ex.video)}" target="_blank" rel="noopener" aria-label="Ver vídeo">${ic('chev', '#4A0268', 16)}</a>` : ''}</div>
          ${Array.isArray(ex.cues) && ex.cues.length ? `<p class="small mut">${ex.cues.map(esc).join(' · ')}</p>` : ''}${ex.warn ? banner(esc(ex.warn), 'amb') : ''}
          <div class="sethead"><span></span><span>KG</span><span>${time ? 'SEG' : 'REPS'}</span><span></span></div>
          ${Array.from({ length: n }, (_, s) => { const k = `${i}-${s}`, v = wk.sets[k] || (wk.sets[k] = { kg: '', reps: '', done: false });
            return `<div class="setrow ${v.done ? 'done' : ''}"><span class="sn">${s + 1}</span><input class="field sm" inputmode="decimal" data-wk="${k}|kg" placeholder="-" value="${esc(v.kg)}"><input class="field sm" inputmode="numeric" data-wk="${k}|reps" placeholder="${esc(time ? e.seconds : String(e.reps || '').split('-')[0])}" value="${esc(v.reps)}"><button class="setchk" data-act="wkSet" data-k="${k}" data-r="${e.rest || w.rest || 60}" aria-label="Série ${s + 1} feita">${ic('check', v.done ? '#fff' : '#9A92A0', 20, 3.5)}</button></div>`; }).join('')}
        </div>`; }).join('')}
      <button class="link" data-act="wkDiscard" style="color:var(--mut)">Descartar este treino</button>
    </div>
    <div class="restbar" id="restbar" style="${resting ? '' : 'display:none'}"><span>Descanso <b id="rt">${fmt(wk.restEnd - Date.now())}</b></span><button data-act="wkSkip">PULAR</button></div>
    <div class="foot"><button class="btn" data-act="wkFinish">FINALIZAR TREINO · ${feitas}/${total}</button></div>${sheetHtml()}`),
    after() {
      clearInterval(tm);
      const tick = () => { const t = document.getElementById('wkt'); if (!t) return clearInterval(tm); t.textContent = fmt(Date.now() - wk.start);
        const bar = document.getElementById('restbar'), rt = document.getElementById('rt');
        if (bar && wk.restEnd) { const left = wk.restEnd - Date.now(); if (left > 0) { bar.style.display = ''; rt.textContent = fmt(left); } else { bar.style.display = 'none'; wk.restEnd = 0; try { navigator.vibrate && navigator.vibrate(200); } catch (e) {} } } };
      tick(); tm = setInterval(tick, 500);
    } };
}
export function wkInput(s, val) { const [k, f] = s.split('|'); if (wk && wk.sets[k]) { wk.sets[k][f] = val; save(); } }
A.wkSet = el => { const v = wk.sets[el.dataset.k]; v.done = !v.done; wk.restEnd = v.done ? Date.now() + +el.dataset.r * 1000 : 0; save(); };
A.wkSkip = () => { wk.restEnd = 0; save(); };
A.wkDiscard = () => { if (confirm('Descartar este treino? As séries marcadas serão perdidas.')) { wk = null; save(); nav.go('#/jornada'); } };
function openFinish() {
  const feitas = Object.values(wk.sets).filter(x => x.done).length;
  ui.sheet = () => sheet(`<h2>Finalizar treino</h2><p class="mut">${feitas} séries feitas. Confirme a duração.</p>
    <div class="stepper"><button data-act="wkMin" data-n="-5" aria-label="Diminuir 5 minutos">${ic('minus', '#4A0268', 22)}</button><b>${wk.minutes} min</b><button data-act="wkMin" data-n="5" aria-label="Aumentar 5 minutos">${ic('plus', '#4A0268', 22)}</button></div>
    <p class="small mut">Abaixo de ${R.MIN_VALIDO} min o treino é salvo, mas não pontua.</p><button class="btn" data-act="wkSave">SALVAR TREINO</button><button class="link" data-act="sheetClose">Continuar treinando</button>`);
}
A.wkFinish = () => { wk.minutes = Math.max(5, Math.round((Date.now() - wk.start) / 60000)); openFinish(); };
A.wkMin = el => { wk.minutes = Math.max(5, Math.min(300, wk.minutes + +el.dataset.n)); openFinish(); };
A.wkSave = () => {
  const p = R.program(), w = p.workouts.find(x => x.id === wk.id), sets = [];
  w.exercises.forEach((e, i) => { for (let s = 0; s < (+e.sets || 3); s++) { const v = wk.sets[`${i}-${s}`]; if (v && v.done) sets.push({ ex: e.ex, n: s + 1, kg: num(v.kg), reps: v.reps || '' }); } });
  const date = wk.date, pr = R.pontosDoCheckin(date, wk.minutes), plan = R.weekPlan(monday(date))[dow(date)] || [], at = new Date().toISOString();
  const rec = { date, acts: ['w:' + w.id], names: [w.name], minutes: wk.minutes, planned: plan.includes('w:' + w.id), pts: pr.pts, coins: pr.coins, at };
  put('sessao', `${date}-${uid()}`, { date, workout: w.id, name: w.name, minutes: wk.minutes, sets, at });
  put('checkin', `${date}-${uid()}`, rec);
  ck.done = rec; ck.date = date; wk = null; save(); clearInterval(tm); ui.sheet = null; nav.go('#/checkin');
};
