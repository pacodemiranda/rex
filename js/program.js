import { put, getRec } from './store.js';
import { emptyPlan } from './rules.js';
import { esc } from './util.js';

export const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';

// Valida um programa no formato JSON (mesmo formato do PACO: 0 = domingo em "schedule")
export function validar(texto) {
  let j;
  try { j = JSON.parse(texto.trim()); } catch (e) { return { ok: false, erros: ['O texto não é um JSON válido. Cole o bloco inteiro, do { ao }.'] }; }
  const erros = [], avisos = [];
  if (!j || typeof j !== 'object') return { ok: false, erros: ['Formato inesperado.'] };
  if (!Array.isArray(j.workouts) || !j.workouts.length) erros.push('Faltam os treinos ("workouts").');
  if (!j.exercises || typeof j.exercises !== 'object') erros.push('Falta o dicionário de exercícios ("exercises").');
  const ids = new Set();
  (j.workouts || []).forEach((w, i) => {
    if (!w.id || !w.name) erros.push(`Treino ${i + 1}: falta "id" ou "name".`);
    if (ids.has(w.id)) erros.push(`Treino repetido: ${w.id}.`); ids.add(w.id);
    if (!Array.isArray(w.exercises) || !w.exercises.length) erros.push(`Treino "${w.name || i + 1}" sem exercícios.`);
    (w.exercises || []).forEach(e => { if (!j.exercises || !j.exercises[e.ex]) erros.push(`Exercício "${e.ex}" (treino ${w.name}) não existe em "exercises".`); });
  });
  Object.entries(j.exercises || {}).forEach(([id, e]) => { if (!e.name) erros.push(`Exercício "${id}" sem nome.`); else if (!e.video) avisos.push(`${e.name}: sem vídeo (você pode colocar depois).`); });
  if (erros.length) return { ok: false, erros };
  const exUsados = new Set(j.workouts.flatMap(w => w.exercises.map(e => e.ex)));
  return { ok: true, j, avisos, resumo: { treinos: j.workouts.length, exercicios: exUsados.size, rotina: !!j.schedule } };
}

// Rotina sugerida pelo programa -> plano interno (0 = segunda)
export function planoDoSchedule(j) {
  const plan = emptyPlan();
  Object.entries(j.schedule || {}).forEach(([k, v]) => {
    const i = (Number(k) + 6) % 7; if (!(i in plan) || !v) return;
    if (v.w) plan[i].push('w:' + v.w); else if (v.a) plan[i].push(v.a);
  });
  return plan;
}

export function salvarPrograma(j, origem) {
  put('program', 'current', { name: j.name || 'Meu programa', phase: j.phase || '', source: origem, workouts: j.workouts, exercises: j.exercises, schedule: j.schedule || null, reminders: j.reminders || null, importedAt: new Date().toISOString() });
}
export function programaVazio() { return { name: 'Meu programa', phase: '', workouts: [], exercises: {}, schedule: null }; }
export const formato = `{
  "name": "Nome do programa",
  "phase": "Fase 1",
  "schedule": { "0": null, "1": {"w":"a"}, "5": {"a":"Natação"} },
  "workouts": [{
    "id": "a", "name": "Treino A", "focus": "Pernas", "minutes": 50, "rest": 60,
    "warmup": ["Mobilidade de quadril"],
    "exercises": [{ "ex": "leg-press", "sets": 3, "reps": "12", "rest": 60 }]
  }],
  "exercises": { "leg-press": { "name": "Leg press 45°", "video": "", "cues": ["Pés na largura do quadril"], "warn": "" } }
}`;
