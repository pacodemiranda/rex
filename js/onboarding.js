import { esc, today } from './util.js';
import { ic, rex, bubble, chip, banner, sheet, topbar, tabbar } from './ui.js';
import { put, list } from './store.js';
import * as R from './rules.js';
import { ui, ob, A, nav, loadDiag, num } from './state.js';
import * as P from './program.js';

export const screen = (inner, extra = '') => `<div class="screen ${extra}${inner.includes('class="tabbar"') ? ' bar' : ''}">${inner}</div>`;
export const sheetHtml = () => (ui.sheet ? ui.sheet() : '');
const TOTAL = 8;
const prog = n => `<div class="progress"><div class="bar"><i style="width:${n * 100 / TOTAL}%"></i></div><span>${n} de ${TOTAL}</span></div>`;

// ---------- abertura (3 slides) ----------
const TILES = R.CATALOGO.slice(0, 12).map(([n, e]) => `<span class="tile mini"><i>${e}</i>${esc(n.split(' ')[0])}</span>`).join('');
const SLIDES = [
  { h: 'Organize sua rotina de exercícios', p: 'Monte sua semana e acompanhe cada dia.', art: () => rex('empolgado', 170, 202) },
  { h: 'Qualquer atividade conta', p: 'Academia, esporte, luta, natação, corrida... tudo vira ponto.', art: () => `<div class="tiles-mini">${TILES}</div>` },
  { h: 'Com a turma, é mais divertido', p: 'Chame os amigos, compare a constância e ganhem medalhas.', art: () => `<div class="slots" style="width:100%">${[0, 1, 2, 3].map(i => `<div class="slot ${i === 0 ? 'me' : ''}">${i === 0 ? rex('base', 44) : ic('plus', '#6B6272', 22)}<small>${i === 0 ? 'Você' : 'Amigo'}</small></div>`).join('')}</div>` }
];
export function bemvindo() {
  const n = ui.slide || 0, sl = SLIDES[n], last = n === SLIDES.length - 1;
  return { html: screen(`<div class="slide-top"><button class="link" data-act="welcomeGo" data-m="up">Pular</button></div>
    <div class="scroll" style="justify-content:center;align-items:center;text-align:center;gap:18px"><div class="slide-art">${sl.art()}</div><h1 style="font-size:28px">${sl.h}</h1><p class="mut" style="font-size:17px">${sl.p}</p>
      <div class="dots slide-dots">${SLIDES.map((_, i) => `<i class="${i === n ? 'on' : ''}"></i>`).join('')}</div></div>
    <div class="foot">${last ? '<button class="btn" data-act="welcomeGo" data-m="up">COMEÇAR</button>' : '<button class="btn" data-act="slideNext">PRÓXIMO</button>'}<button class="link" data-act="welcomeGo" data-m="in">Já tenho conta</button></div>`) };
}
A.slideNext = () => { ui.slide = (ui.slide || 0) + 1; };
A.welcomeGo = el => { try { localStorage.setItem('rex.welcomed', '1'); } catch (e) {} ui.mode = el.dataset.m; };
export const welcomed = () => { try { return !!localStorage.getItem('rex.welcomed'); } catch (e) { return false; } };

// ---------- login ----------
export function login() {
  const up = ui.mode === 'up';
  return { html: screen(`<div class="scroll" style="justify-content:center">
    <div class="center" style="display:flex;flex-direction:column;gap:10px;align-items:center">${rex('base', 130, 148)}<h1>Rex</h1><p class="mut">${up ? 'Crie sua conta para guardar seu progresso.' : 'Bom te ver de novo.'}</p></div>
    <div class="card"><h2>${up ? 'Criar conta' : 'Entrar'}</h2>
      <input class="field" id="email" type="email" inputmode="email" autocomplete="email" placeholder="E-mail" autocapitalize="none" value="${esc(ui.email)}">
      <input class="field" id="senha" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="Senha (mínimo 6 caracteres)">
      ${ui.err ? banner(esc(ui.err), 'err') : ''}
      <button class="btn" data-act="auth" ${ui.busy ? 'disabled' : ''}>${ui.busy ? 'AGUARDE...' : (up ? 'CRIAR CONTA' : 'ENTRAR')}</button>
    </div>
    <button class="link" data-act="authMode">${up ? 'Já tenho conta' : 'Criar uma conta'}</button>
    <button class="link" data-act="goWelcome" style="font-weight:700;color:var(--mut)">Ver apresentação</button></div>`) };
}
A.goWelcome = () => { try { localStorage.removeItem('rex.welcomed'); } catch (e) {} };
A.authMode = () => { ui.mode = ui.mode === 'up' ? 'in' : 'up'; ui.err = ''; };
A.auth = async () => {
  const email = document.getElementById('email').value.trim(), senha = document.getElementById('senha').value;
  if (!email || !senha) { ui.err = 'Preencha e-mail e senha.'; return; }
  ui.email = email; ui.busy = true; ui.err = ''; window.__render();
  try {
    const { signIn, signUp } = await import('./store.js');
    if (ui.mode === 'up') { const r = await signUp(email, senha); if (r === 'confirm') { ui.err = ''; ui.mode = 'in'; ui.toast = 'Conta criada. Confirme o e-mail pelo link e depois entre.'; } else await signIn(email, senha); }
    else await signIn(email, senha);
  } catch (e) { ui.err = e.message || 'Não deu certo.'; }
  ui.busy = false;
};

// ---------- diagnóstico (anamnese) ----------
const d = () => ob.d;
const opts = (key, list, multi) => `<div class="chips">${list.map(o => chip(o, multi ? d()[key].includes(o) : d()[key] === o, `data-act="${multi ? 'tog' : 'pick'}" data-k="${key}" data-v="${esc(o)}"`)).join('')}</div>`;
const field = (label, key, ph, mode = 'decimal', unit = '') => `<div class="fld"><label class="lab">${label}</label><div class="inl"><input class="field" inputmode="${mode}" data-bind="d.${key}" placeholder="${ph}" value="${esc(d()[key])}">${unit ? `<span class="unit">${unit}</span>` : ''}</div></div>`;
const yn = (key, q) => `<div class="card"><p style="font-weight:800">${q}</p><div class="chips">${[['sim', 'Sim'], ['nao', 'Não']].map(([v, t]) => chip(t, d()[key] === v, `data-act="pick" data-k="${key}" data-v="${v}"`)).join('')}</div></div>`;
const OBJ = ['Emagrecer', 'Ganhar força', 'Ganhar massa', 'Criar constância', 'Saúde e disposição', 'Voltar a praticar esporte', 'Reabilitação / aliviar dores', 'Performance no esporte'];
const LOCAIS = ['Academia', 'Em casa', 'Ao ar livre', 'Piscina', 'Estúdio', 'Quadra ou areia'];
const STEPS = {
  1: { t: 'Sobre você', msg: 'Vou fazer algumas perguntas, como numa avaliação. Isso ajuda o profissional a montar um treino que faz sentido para você.', ok: () => num(d().idade) >= 10 && num(d().idade) <= 100 && num(d().altura) >= 100 && num(d().altura) <= 250 && num(d().peso) >= 30 && num(d().peso) <= 300 && d().sexo,
    body: () => `<div class="card"><h2>Dados básicos</h2><div class="g2">${field('IDADE', 'idade', '36', 'numeric', 'anos')}${field('ALTURA', 'altura', '177', 'numeric', 'cm')}</div><div class="g2">${field('PESO ATUAL', 'peso', '80,5', 'decimal', 'kg')}<div></div></div>
      <div class="lab">SEXO</div>${opts('sexo', ['Masculino', 'Feminino', 'Prefiro não dizer'])}</div>` },
  2: { t: 'Seus objetivos', msg: 'O que você quer conquistar? Pode marcar mais de um.', ok: () => d().objetivos.length > 0,
    body: () => `<div class="card"><h2>Objetivos</h2>${opts('objetivos', OBJ, true)}</div>
      <div class="card"><h2>Meta de peso <span class="opt">OPCIONAL</span></h2>${field('PESO DESEJADO', 'metaPeso', 'Ex.: 75', 'decimal', 'kg')}<div class="lab">EM QUANTO TEMPO?</div>${opts('prazo', ['1 a 3 meses', '3 a 6 meses', '6 a 12 meses', 'Sem pressa'])}</div>` },
  3: { t: 'Saúde', msg: 'Perguntas rápidas de segurança. Seus dados de saúde ficam só na sua conta.', ok: () => ['cardio', 'dorPeito', 'osso', 'medicamento', 'liberacao'].every(k => d()[k]),
    body: () => `${yn('cardio', 'Algum médico já disse que você tem problema no coração ou pressão alta?')}${yn('dorPeito', 'Sente dor no peito, tontura ou falta de ar forte ao se exercitar?')}${yn('osso', 'Tem problema nos ossos, articulações ou coluna que piora com exercício?')}${yn('medicamento', 'Usa algum medicamento de uso contínuo?')}${yn('liberacao', 'Tem liberação médica para se exercitar?')}
      ${(['cardio', 'dorPeito'].some(k => d()[k] === 'sim') && d().liberacao !== 'sim') ? banner('Com essas respostas, vale passar por um médico antes de treinar forte. O profissional vai considerar isso.', 'amb') : ''}
      <div class="card"><h2>Lesões, cirurgias ou dores <span class="opt">OPCIONAL</span></h2><textarea class="field" data-bind="d.lesoes" placeholder="Ex.: cirurgia no joelho há 3 anos, dor lombar ao agachar...">${esc(d().lesoes)}</textarea></div>` },
  4: { t: 'O que você curte', msg: 'O melhor treino é o que você faz. Marque o que gosta e pretende fazer.', ok: () => d().atividades.length > 0 && d().locais.length > 0,
    body: () => `<div class="card"><h2>Atividades que você gosta ou quer fazer</h2>${opts('atividades', R.PREFERENCIAS, true)}</div>
      <div class="card"><h2>Onde você pode treinar?</h2>${opts('locais', LOCAIS, true)}</div>
      <div class="card"><h2>Algo que você não gosta ou quer evitar <span class="opt">OPCIONAL</span></h2><textarea class="field" data-bind="d.evitar" placeholder="Ex.: esteira, bicicleta, corrida...">${esc(d().evitar)}</textarea></div>` },
  5: { t: 'Sua rotina', msg: 'Última etapa. Quanto tempo e disposição você tem de verdade?', ok: () => ['experiencia', 'parado', 'diasSemana', 'minutos', 'horario'].every(k => d()[k]),
    body: () => `<div class="card"><h2>Experiência com treino</h2>${opts('experiencia', ['Iniciante', 'Intermediário', 'Avançado'])}</div>
      <div class="card"><h2>Como está sua atividade hoje?</h2>${opts('parado', ['Treino regularmente', 'Parado há menos de 3 meses', 'Parado há 3 a 12 meses', 'Parado há mais de 1 ano', 'Nunca treinei'])}</div>
      <div class="card"><h2>Dias por semana disponíveis</h2>${opts('diasSemana', ['2', '3', '4', '5', '6'])}</div>
      <div class="card"><h2>Tempo por sessão</h2>${opts('minutos', ['30 min', '45 min', '60 min', '90 min'])}</div>
      <div class="card"><h2>Melhor horário</h2>${opts('horario', ['Manhã', 'Almoço', 'Tarde', 'Noite'])}</div>
      <div class="card"><h2>Sono por noite <span class="opt">OPCIONAL</span></h2>${opts('sono', ['Menos de 6h', '6 a 7h', '7 a 8h', 'Mais de 8h'])}</div>` }
};
export function diag(n) {
  if (!ob.dLoaded) { loadDiag(); ob.dLoaded = true; ob.dEdit = R.diagOk(); }
  const s = STEPS[n], ok = !!s.ok(), last = n === 5;
  const top = topbar('Ficha para o profissional', ob.dFor === 'pedido' ? '#/programa' : '#/perfil', `PASSO ${n} DE 5`);
  return { html: screen(`${top}<div class="scroll">${bubble(rex('base', 70), s.msg)}<h1 style="font-size:22px">${s.t}</h1>${s.body()}</div>
    <div class="foot"><button class="btn" data-act="diagNext" data-n="${n}" ${ok ? '' : 'disabled'}>${last ? (ob.dFor === 'pedido' ? 'ENVIAR PARA O PROFISSIONAL' : 'SALVAR FICHA') : 'CONTINUAR'}</button>${n > 1 ? `<button class="link" data-act="go" data-to="#/diag${n - 1}">Voltar</button>` : ''}</div>`) };
}
A.pick = el => { ob.d[el.dataset.k] = el.dataset.v; };
A.tog = el => { const a = ob.d[el.dataset.k], v = el.dataset.v, i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); };
A.go = el => nav.go(el.dataset.to);
A.diagNext = el => {
  const n = +el.dataset.n;
  if (n < 5) return nav.go(`#/diag${n + 1}`);
  const D = ob.d, t = today(), p = R.profile() || {};
  const peso = num(D.peso);
  put('profile', 'me', { ...p, ...D, idade: num(D.idade), altura: num(D.altura), peso, metaPeso: num(D.metaPeso), diagOk: true, diagAt: t });
  put('medida', t, { peso, date: t });
  const pedido = ob.dFor === 'pedido'; ob.dLoaded = false; ob.dFor = null;
  if (pedido) { put('request', 'programa', { status: 'pedido', at: new Date().toISOString() }); ui.toast = 'Pedido enviado. Seu treino chega em até 24h.'; nav.go('#/programa'); }
  else { ui.toast = 'Ficha atualizada.'; nav.go('#/perfil'); }
};
export const stepOk = n => !!STEPS[n].ok();
export function leaveDiag() { ob.dLoaded = false; }

// ---------- atividades ----------
export function atv() {
  const edit = R.isOnboarded();
  if (!ob.atvLoaded) { ob.atv = [...(R.profile()?.atividades || [])]; ob.atvLoaded = true; }
  const todas = [...R.CATALOGO, ...ob.atv.filter(a => !R.ATIVIDADES.includes(a)).map(a => [a, '⭐'])];
  const top = edit ? topbar('Minhas atividades', '#/perfil') : `<div class="progress"><div class="bar"><i style="width:50%"></i></div><span>1 de 2</span></div>`;
  return { html: screen(`${top}<div class="scroll"><h1 style="font-size:24px">O que você quer organizar?</h1>
    <p class="mut">Marque o que você já faz ou quer fazer. Cada dia ativo conta. Dá para mudar depois.</p>
    <div class="tiles">${todas.map(([n, e]) => `<button class="tile ${ob.atv.includes(n) ? 'on' : ''}" data-act="atvTog" data-v="${esc(n)}"><i>${e}</i>${esc(n)}${R.temPrograma(n) ? '<em>com treino</em>' : ''}</button>`).join('')}
      <button class="tile add" data-act="atvOutra"><i>+</i>Outra</button></div></div>
    <div class="foot"><button class="btn" data-act="atvNext" ${ob.atv.length ? '' : 'disabled'}>${edit ? 'SALVAR' : 'CONTINUAR'}</button></div>${sheetHtml()}`) };
}
A.atvTog = el => { const v = el.dataset.v, i = ob.atv.indexOf(v); if (i >= 0) ob.atv.splice(i, 1); else ob.atv.push(v); };
A.atvOutra = () => {
  ui.f = { nome: '' };
  ui.sheet = () => sheet(`<h2>Outra atividade</h2><input class="field" data-bind="f.nome" maxlength="24" placeholder="Ex.: Remo, Escalada, Capoeira" value="${esc(ui.f.nome)}"><button class="btn" data-act="atvAdd">ADICIONAR</button><button class="link" data-act="sheetClose">Cancelar</button>`);
};
A.atvAdd = () => { const n = (ui.f.nome || '').trim(); if (n && !ob.atv.includes(n)) ob.atv.push(n); ui.sheet = null; };
A.atvNext = () => {
  const edit = R.isOnboarded();
  put('profile', 'me', { ...(R.profile() || {}), atividades: [...ob.atv] });
  ob.atvLoaded = false;
  if (edit) { ui.toast = 'Atividades atualizadas.'; nav.go('#/perfil'); } else { ob.planInit = false; nav.go('#/onb2'); }
};
A.pedirPro = () => { ob.dFor = 'pedido'; ob.dLoaded = false; nav.go('#/diag1'); };

// ---------- colar programa ----------
export function progColar() {
  const v = ui.val, onb = R.isOnboarded();
  return { html: screen(`${topbar('Colar programa', '#/programa')}<div class="scroll">
    <p class="mut">Cole aqui o programa no formato JSON que o profissional (ou o Claude) te enviou.</p>
    <textarea class="field code" data-bind="ui.texto" placeholder='{ "name": "...", "workouts": [ ... ] }'>${esc(ui.texto)}</textarea>
    <button class="btn2" data-act="colarClip">COLAR DA ÁREA DE TRANSFERÊNCIA</button>
    ${v ? (v.ok ? `<div class="banner grn"><b>Programa válido.</b> ${v.resumo.treinos} treinos, ${v.resumo.exercicios} exercícios${v.resumo.rotina ? ', com rotina sugerida' : ''}.${v.avisos.length ? `<br><span class="small">${v.avisos.length} exercício(s) sem vídeo.</span>` : ''}</div>` : `<div class="banner err"><b>Ajustes necessários:</b><br>${v.erros.slice(0, 6).map(e => '• ' + esc(e)).join('<br>')}</div>`) : ''}
  </div><div class="foot">${v && v.ok ? '<button class="btn" data-act="importar">IMPORTAR PROGRAMA</button>' : '<button class="btn" data-act="validar">VERIFICAR PROGRAMA</button>'}</div>`) };
}
A.colarClip = async () => { try { ui.texto = await navigator.clipboard.readText(); ui.val = null; } catch (e) { ui.toast = 'Não consegui acessar a área de transferência. Cole no campo.'; } };
A.validar = () => { ui.val = P.validar(ui.texto); };
A.importar = () => {
  const j = ui.val?.j; if (!j) return;
  P.salvarPrograma(j, 'colado');
  ui.texto = ''; ui.val = null;
  ui.toast = 'Programa importado. Ajuste a rotina se quiser.'; nav.go('#/programa');
};

// ---------- construir/ver programa ----------
export function programa() {
  const p = R.program() || P.programaVazio(), tem = p.workouts.length > 0, pend = R.pedido() && !R.program();
  const caminhos = `${pend ? banner('Seu pedido ao profissional está em andamento. Chega em até 24h. Quando o programa chegar, é só colar aqui.', 'amb') : `<div class="card opt-card"><span class="tag">COM AJUDA</span><h2>Chamar um profissional</h2><p class="mut">Um profissional monta o treino com base no seu perfil e no que você gosta. Entrega em até 24 horas.</p><button class="btn" data-act="pedirPro">CHAMAR UM PROFISSIONAL</button></div>`}
    <div class="card opt-card"><h2>Já tenho um programa</h2><p class="mut">Cole o programa que você recebeu e o app cria os treinos.</p><button class="btn2" data-act="go" data-to="#/progcolar">COLAR PROGRAMA</button></div>
    <div class="card opt-card"><h2>Criar o meu treino</h2><p class="mut">Cadastre seus treinos e exercícios do seu jeito.</p><button class="btn2" data-act="novoTreino">CRIAR MEU TREINO</button></div>`;
  return { html: screen(`<div class="scroll"><h1 style="padding-top:14px">Meu programa</h1>
    ${tem ? `${pend ? banner('Seu pedido ao profissional está em andamento. Chega em até 24h.', 'amb') : ''}${p.workouts.map(w => `<div class="card"><div class="row2"><div><h2>${esc(w.name)}</h2><p class="small mut">${esc(w.focus || '')}${w.minutes ? ' · ' + w.minutes + ' min' : ''}</p></div><button class="icobtn sm" data-act="rmTreino" data-id="${esc(w.id)}" aria-label="Remover treino">${ic('close', '#6B6272', 16)}</button></div>
      ${w.exercises.map(e => `<div class="exrow"><span>${esc(p.exercises[e.ex]?.name || e.ex)}</span><b>${e.sets}x ${esc(e.mode === 'time' ? e.seconds + 's' : e.reps)}</b></div>`).join('') || '<p class="small mut">Sem exercícios ainda.</p>'}
      <button class="btn2" data-act="novoEx" data-id="${esc(w.id)}">+ EXERCÍCIO</button></div>`).join('')}
    <button class="btn2" data-act="novoTreino">+ NOVO TREINO</button>
    <button class="link" data-act="go" data-to="#/progcolar">Colar um programa pronto (substitui o atual)</button>${pend ? '' : '<button class="link" data-act="pedirPro">Chamar um profissional</button>'}`
    : `<p class="mut">Atividades como musculação e funcional têm treino com exercícios e cargas. Como você quer montar o seu?</p>${caminhos}`}
  </div>${tabbar('programa')}${sheetHtml()}`) };
}
const salvaProg = p => put('program', 'current', { ...p, source: p.source || 'manual' });
A.novoTreino = () => {
  ui.f = { nome: '', foco: '' };
  ui.sheet = () => sheet(`<h2>Novo treino</h2><input class="field" data-bind="f.nome" placeholder="Nome (ex.: Treino A)" value="${esc(ui.f.nome)}"><input class="field" data-bind="f.foco" placeholder="Foco (ex.: Pernas e core)" value="${esc(ui.f.foco)}"><button class="btn" data-act="criaTreino">CRIAR</button><button class="link" data-act="sheetClose">Cancelar</button>`);
};
A.criaTreino = () => {
  if (!ui.f.nome.trim()) return;
  const p = R.program() || P.programaVazio(); let id = P.slug(ui.f.nome); while (p.workouts.some(w => w.id === id)) id += '-2';
  salvaProg({ ...p, workouts: [...p.workouts, { id, name: ui.f.nome.trim(), focus: ui.f.foco.trim(), minutes: 50, rest: 60, exercises: [] }] }); ui.sheet = null;
};
A.rmTreino = el => { const p = R.program(); if (!p || !confirm('Remover este treino?')) return; salvaProg({ ...p, workouts: p.workouts.filter(w => w.id !== el.dataset.id) }); };
A.novoEx = el => {
  const id = el.dataset.id; ui.f = { nome: '', series: '3', reps: '10-12' };
  ui.sheet = () => sheet(`<h2>Novo exercício</h2><input class="field" data-bind="f.nome" placeholder="Nome do exercício" value="${esc(ui.f.nome)}"><div class="g2"><input class="field" inputmode="numeric" data-bind="f.series" placeholder="Séries" value="${esc(ui.f.series)}"><input class="field" data-bind="f.reps" placeholder="Repetições" value="${esc(ui.f.reps)}"></div><button class="btn" data-act="criaEx" data-id="${esc(id)}">ADICIONAR</button><button class="link" data-act="sheetClose">Cancelar</button>`);
};
A.criaEx = el => {
  if (!ui.f.nome.trim()) return;
  const p = R.program(); if (!p) return; let ex = P.slug(ui.f.nome);
  const exercises = { ...p.exercises }; if (!exercises[ex]) exercises[ex] = { name: ui.f.nome.trim(), video: '', cues: [], warn: '' };
  salvaProg({ ...p, exercises, workouts: p.workouts.map(w => w.id === el.dataset.id ? { ...w, exercises: [...w.exercises, { ex, sets: num(ui.f.series) || 3, reps: ui.f.reps || '10', rest: 60 }] } : w) }); ui.sheet = null;
};
