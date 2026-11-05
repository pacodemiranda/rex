import { esc, today, addDays, monday, dow, DIAS, DIAS_LONGO, fmtData, parse, uid } from './util.js';
import { ic, rex, bubble, chip, medal, tabbar, topbar, sheet, banner } from './ui.js';
import { getRec, put, list, session, signOut, sync, syncStatus } from './store.js';
import * as R from './rules.js';

export const ui = { sheet: null, toast: null, err: '', busy: false, mode: 'in', email: '', version: '' };
export const ob = { objetivo: 'Criar constância', exp: 'Intermediário', dias: '4 a 5', lesao: '', plan: R.emptyPlan(), nome: 'Rex', edit: false };
export const ck = { date: today(), sel: [], minutes: 45, done: null };
export const A = {}; // ações por data-act
let go = h => { location.hash = h; };
export const setGo = fn => { go = fn; };

const rexNome = () => R.profile()?.nome || 'Rex';
const screen = (inner, extra = '') => `<div class="screen ${extra}">${inner}</div>`;
const sheetHtml = () => (ui.sheet ? ui.sheet() : '');

// ---------- login ----------
export function login() {
  const up = ui.mode === 'up';
  return { html: screen(`<div class="scroll" style="justify-content:center">
    <div class="center" style="display:flex;flex-direction:column;gap:10px;align-items:center">${rex('base', 150, 170)}<h1>Rex</h1><p class="mut">Sua rotina de atividade física, um dia de cada vez.</p></div>
    <div class="card"><h2>${up ? 'Criar conta' : 'Entrar'}</h2>
      <input class="field" id="email" type="email" inputmode="email" autocomplete="email" placeholder="E-mail" autocapitalize="none" value="${esc(ui.email)}">
      <input class="field" id="senha" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="Senha (mínimo 6 caracteres)">
      ${ui.err ? banner(esc(ui.err), 'err') : ''}
      <button class="btn" data-act="auth" ${ui.busy ? 'disabled' : ''}>${ui.busy ? 'AGUARDE...' : (up ? 'CRIAR CONTA' : 'ENTRAR')}</button>
    </div>
    <button class="link" data-act="authMode">${up ? 'Já tenho conta' : 'Criar uma conta'}</button></div>`) };
}
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

// ---------- onboarding ----------
const prog = (n) => `<div class="progress"><div class="bar"><i style="width:${n * 33.4}%"></i></div><span>${n} de 3</span></div>`;
const group = (title, key, opts, grid) => `<div class="card"><h2>${title}</h2><div class="${grid ? 'seg4' : 'chips'}">${opts.map(o => chip(o, ob[key] === o, `data-act="pick" data-k="${key}" data-v="${esc(o)}"`)).join('')}</div></div>`;
export function onb1() {
  return { html: screen(`${prog(1)}<div class="scroll">
    ${bubble(rex('base', 76), 'Antes de começar, me conta como você está. É assim que a gente monta o seu primeiro ciclo.')}
    ${group('Qual é o seu objetivo agora?', 'objetivo', ['Criar constância', 'Ganhar força', 'Emagrecer', 'Voltar a treinar'])}
    ${group('Como é a sua experiência com treino?', 'exp', ['Iniciante', 'Intermediário', 'Avançado'])}
    ${group('Quantos dias por semana você se exercita hoje?', 'dias', ['0 a 1', '2 a 3', '4 a 5', '6 a 7'], true)}
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h2>Alguma lesão ou limitação?</h2><span class="small mut" style="background:var(--soft);padding:4px 10px;border-radius:12px">OPCIONAL</span></div>
      <textarea class="field" data-bind="lesao" placeholder="Ex.: dor lombar, cirurgia no joelho...">${esc(ob.lesao)}</textarea>
      <p class="small mut">É dado de saúde: só você vê. Compartilhar com um profissional só com a sua autorização.</p></div>
  </div><div class="foot"><button class="btn" data-act="go" data-to="#/onb2">CONTINUAR</button></div>`) };
}
A.pick = el => { ob[el.dataset.k] = el.dataset.v; };
A.go = el => go(el.dataset.to);

function weekRows(today_i) {
  return R_DIAS().map((d, i) => {
    const acts = ob.plan[i];
    return `<div class="daterow ${i === today_i ? 'today' : ''}"><div class="d">${d}</div><div class="acts">${acts.length ? acts.map((a, j) => `<button class="pill" data-act="rmAct" data-d="${i}" data-i="${j}" aria-label="Remover ${esc(a)}">${esc(a)}</button>`).join('') : '<span class="pill rest">Descanso</span>'}</div><button class="addbtn" data-act="addAct" data-d="${i}" aria-label="Adicionar atividade em ${DIAS_LONGO[i]}">${ic('plus')}</button></div>`;
  }).join('');
}
const R_DIAS = () => DIAS;
export function onb2() {
  const n = ob.plan && Object.values(ob.plan).filter(a => a.length).length;
  const edit = ob.edit;
  return { html: screen(`${edit ? topbar('Minha rotina', '#/perfil') : prog(2)}<div class="scroll">
    ${edit ? '' : '<h1>Monte a sua semana</h1>'}
    <p class="mut">Toque no + para escolher a atividade de cada dia. Toque na atividade para remover. Mais de uma no mesmo dia vira um número na medalha.</p>
    <div style="display:flex;flex-direction:column;gap:8px">${weekRows(edit ? dow(today()) : -1)}</div>
    <div class="card"><h2>Meta da semana: ${n} ${n === 1 ? 'dia' : 'dias'} com atividade</h2><p class="small mut">A semana (etapa) fecha quando você chega nessa meta.</p></div>
  </div><div class="foot"><button class="btn" data-act="${edit ? 'saveRoutine' : 'go'}" data-to="#/onb3" ${n ? '' : 'disabled'}>${edit ? 'SALVAR' : 'CONTINUAR'}</button>${edit ? '' : '<button class="link" data-act="go" data-to="#/onb1">Voltar</button>'}</div>${sheetHtml()}`) };
}
A.rmAct = el => { ob.plan[+el.dataset.d].splice(+el.dataset.i, 1); };
A.addAct = el => {
  const d = +el.dataset.d;
  ui.sheet = () => sheet(`<h2>${DIAS_LONGO[d]}: escolha a atividade</h2><div class="chips">${R.OPCOES.map(o => chip(o, ob.plan[d].includes(o), `data-act="chooseAct" data-d="${d}" data-v="${esc(o)}"`)).join('')}</div><button class="btn" data-act="sheetClose">PRONTO</button>`);
};
A.chooseAct = el => { const d = +el.dataset.d, v = el.dataset.v, a = ob.plan[d]; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); A.addAct({ dataset: { d } }); };
A.sheetClose = () => { ui.sheet = null; };

export function onb3() {
  return { html: screen(`${prog(3)}<div class="scroll center" style="align-items:stretch">
    <div style="display:flex;justify-content:center;padding-top:10px"><div style="width:190px;height:190px;border-radius:95px;background:#EEF6EA;display:flex;align-items:center;justify-content:center">${rex('empolgado', 130, 154)}</div></div>
    <h1 style="text-align:center">Esse é o seu parceiro de jornada</h1>
    <p class="mut" style="text-align:center">Ele treina com você, comemora cada check-in e nunca te cobra. Dê um nome a ele.</p>
    <input class="field" data-bind="nome" value="${esc(ob.nome)}" maxlength="16" aria-label="Nome do Rex">
    <div class="chips" style="justify-content:center">${['Rex', 'Dino', 'Sauro'].map(n => chip(n, ob.nome === n, `data-act="setNome" data-v="${n}"`)).join('')}</div>
  </div><div class="foot"><button class="btn" data-act="finishOnb">COMEÇAR MINHA JORNADA</button><button class="link" data-act="go" data-to="#/onb2">Voltar</button></div>`) };
}
A.setNome = el => { ob.nome = el.dataset.v; };
A.finishOnb = () => {
  const t = today();
  put('profile', 'me', { nome: (ob.nome || 'Rex').trim() || 'Rex', objetivo: ob.objetivo, experiencia: ob.exp, dias: ob.dias, limitacao: ob.lesao, criado: t });
  put('routine', 'current', { plan: ob.plan, since: t });
  put('cycle', 'current', { n: 1, start: monday(t), duration: 8, objetivo: ob.objetivo });
  go('#/jornada');
};

// ---------- jornada ----------
// pontos do caminho na imagem (px em 390 x 823), de segunda (embaixo) a domingo (no horizonte)
const PTS = [[193.6, 767.3], [270.1, 692.5], [208.6, 617.7], [122.7, 542.9], [228.0, 468.1], [254.0, 393.3], [158.4, 318.5]];
let jdata = null;
function jornadaData() {
  const mon = monday(today()), s = R.weekSummary(mon), c = R.cycleInfo();
  return { s, c, cen: R.cenarioDaSemana(mon, R.cycle()) };
}
export function jornada() {
  const { s, c, cen } = jornadaData(); jdata = { s, cen };
  const t = s.days.find(d => d.date === today());
  const pend = t.state === 'today';
  const nome = t.plan.length ? t.plan.join(' + ') : '';
  const dots = Array.from({ length: Math.min(7, Math.max(s.meta, 1)) }, (_, i) => `<i class="${i < s.active ? 'on' : ''}"></i>`).join('');
  const cta = pend ? `<button class="btn" data-act="goCheck" data-d="${t.date}">REGISTRAR ${t.plan.length > 1 ? 'AS ATIVIDADES DE HOJE' : esc(t.plan[0]).toUpperCase()}</button><button class="link" data-act="goCheck" data-d="${t.date}" data-free="1">Registrar outra atividade</button>`
    : `<button class="btn2" data-act="goCheck" data-d="${t.date}" data-free="1">${t.state === 'done' || t.state === 'bonus' ? 'REGISTRAR OUTRA ATIVIDADE' : 'REGISTRAR UMA ATIVIDADE'}</button><button class="link" data-act="goCheck" data-d="${addDays(today(), -1)}" data-free="1">Esqueceu ontem? Registre aqui</button>`;
  return { html: screen(`<div class="hdr"><div class="row"><div><div class="eyebrow">CICLO ${c.n} · ${esc((c.objetivo || '').toUpperCase())}</div><h1>Semana ${c.semana} de ${c.duration}</h1></div><div class="etp"><b>${c.etapas}/${c.duration}</b><span>ETAPAS</span></div></div>
    <div class="chipweek"><span>${s.active} de ${s.meta} dias ativos nesta semana</span><div class="dots">${dots}</div></div></div>
    <div id="jwin"></div><div class="foot" style="padding-top:8px">${cta}</div>${tabbar('jornada')}${sheetHtml()}`), after: layoutJourney };
}
export function layoutJourney() {
  const win = document.getElementById('jwin'); if (!win || !jdata) return;
  const { s, cen } = jdata, cw = win.clientWidth, ch = win.clientHeight;
  const sc = Math.min(cw / 390, ch / 550), W = 390 * sc, H = 823 * sc, left = (cw - W) / 2, top = ch - 805 * sc;
  let h = `<img class="bg" src="assets/cenario/${cen}.jpg" alt="" style="left:${left}px;top:${top}px;width:${W}px;height:${H}px">`;
  s.days.forEach((d, i) => {
    const x = left + PTS[i][0] * sc, y = top + PTS[i][1] * sc, st = d.state, onLeft = PTS[i][0] < 195;
    const names = d.plan.join(' + ');
    let sz = 52, inner = '', lab = names || 'Descanso', sub = DIAS[i].toUpperCase();
    if (st === 'done') inner = ic('check', '#1F0A2B', 26, 3.5);
    else if (st === 'bonus') { inner = ic('moon', '#1F0A2B', 24, 2.6) + `<div class="star">${ic('star', '#1F0A2B', 15)}</div>`; lab = (names ? names + ' · ' : '') + 'bônus'; if (d.plan.length === 0) lab = 'Descanso · bônus'; }
    else if (st === 'absent') inner = ic('minus', '#6B6272', 22);
    else if (st === 'rest' || st === 'resttoday' || st === 'restf') inner = ic('moon', st === 'restf' ? '#9A92A0' : '#1F0A2B', 24, 2.6);
    else if (st === 'future') inner = ic('dumb', '#9A92A0', 24, 2.6);
    if (st === 'resttoday') sub += ' · HOJE';
    if (st === 'today') {
      const n = d.plan.length > 1 ? d.plan.length : 0, bx = x - 50, by = y - 50;
      h += `<button class="medal-btn" data-act="goCheck" data-d="${d.date}" aria-label="Registrar ${esc(names)}" style="left:${bx}px;top:${by}px;width:100px;height:100px"><div class="halo"></div>${medal(84, n)}</button>`;
      sub += ' · HOJE'; sz = 84;
      const rl = onLeft ? x - 125 : x + 52;
      h += `<img class="rex" src="assets/rex/determinado.png" alt="Rex" style="position:absolute;left:${rl}px;top:${y - 68}px;width:74px;height:88px">`;
    } else h += `<div class="node ${st}" style="left:${x - sz / 2}px;top:${y - sz / 2}px;width:${sz}px;height:${sz}px">${inner}</div>`;
    const off = st === 'today' ? 62 : 40, pos = onLeft ? `left:${x + off}px` : `right:${cw - x + off}px`;
    h += `<div class="nlab ${st === 'today' ? 'today' : st === 'done' ? 'done' : ''}" style="${pos};top:${y - 20}px;text-align:${onLeft ? 'left' : 'right'}"><small>${sub}</small><b>${esc(lab)}</b></div>`;
  });
  win.innerHTML = h;
}
addEventListener('resize', layoutJourney);
A.goCheck = el => {
  ck.date = el.dataset.d || today(); ck.done = null; ck.minutes = 45;
  const p = R.weekPlan(monday(ck.date))[dow(ck.date)] || [];
  ck.sel = el.dataset.free ? [] : [...p]; ck.free = !!el.dataset.free;
  go('#/checkin');
};

// ---------- check-in ----------
export function checkin() {
  if (ck.done) {
    const d = ck.done;
    return { html: screen(`<div class="scroll center" style="justify-content:center;align-items:center">${rex('orgulhoso', 150, 170)}<h1>Check-in salvo!</h1>
      <p class="mut">${d.pts ? 'Boa! Mais um dia na conta.' : d.minutes < R.MIN_VALIDO ? `Registrado, mas abaixo de ${R.MIN_VALIDO} min não pontua.` : 'Registrado. O teto de pontos do dia já foi atingido.'}</p>
      ${d.pts ? `<div class="pts" style="width:100%"><div>Você ganhou</div><div><span class="p">+${d.pts} pts</span><span class="c">+${d.coins} moedas</span></div></div>` : ''}
    </div><div class="foot"><button class="btn" data-act="ckFinish">CONTINUAR</button></div>`) };
  }
  const plan = R.weekPlan(monday(ck.date))[dow(ck.date)] || [];
  const all = [...new Set([...plan, ...ck.sel])];
  const pr = R.pontosDoCheckin(ck.date, ck.minutes), isToday = ck.date === today();
  const dias = [[today(), 'Hoje'], [addDays(today(), -1), 'Ontem']];
  return { html: screen(`<header class="topbar"><a class="icobtn" href="#/jornada" aria-label="Fechar">${ic('close')}</a><div class="tb-title">Registrar atividade</div><div style="width:44px"></div></header><div class="scroll">
    ${bubble(rex('empolgado', 86, 102), isToday ? 'Bora! O que você fez hoje?' : 'Sem problema esquecer. O que você fez nesse dia?')}
    <div style="display:flex;flex-direction:column;gap:8px"><div class="lab">DIA</div><div class="chips">${dias.map(([d, t]) => chip(`${t} · ${fmtData(d)}`, ck.date === d, `data-act="ckDate" data-d="${d}"`)).join('')}</div>${isToday ? '' : '<p class="small mut">Você pode registrar até o fim do dia seguinte.</p>'}</div>
    <div style="display:flex;flex-direction:column;gap:8px"><div class="lab">ATIVIDADE</div><div class="chips">${all.map(a => chip(a, ck.sel.includes(a), `data-act="ckTog" data-v="${esc(a)}"`)).join('')}<button class="chip ghost" data-act="ckOutra">+ Outra</button></div><p class="small mut">Qualquer atividade conta. ${plan.length ? 'A do plano vale a parada do dia.' : 'Em dia de descanso, vira bônus.'}</p></div>
    <div style="display:flex;flex-direction:column;gap:8px"><div class="lab">DURAÇÃO</div><div class="stepper"><button data-act="ckMin" data-n="-5" aria-label="Diminuir 5 minutos">${ic('minus', '#4A0268', 22)}</button><b>${ck.minutes} min</b><button data-act="ckMin" data-n="5" aria-label="Aumentar 5 minutos">${ic('plus', '#4A0268', 22)}</button></div><p class="small mut">Abaixo de ${R.MIN_VALIDO} min o check-in é salvo, mas não pontua.</p></div>
    <div class="pts"><div>Você ganha</div><div><span class="p">+${pr.pts} pts</span><span class="c">+${pr.coins} moedas</span></div></div>
  </div><div class="foot"><button class="btn" data-act="ckSave" ${ck.sel.length ? '' : 'disabled'}>SALVAR CHECK-IN</button><p class="small mut" style="text-align:center">Esqueceu um dia? Registre até o fim do dia seguinte.</p></div>${sheetHtml()}`) };
}
A.ckDate = el => { ck.date = el.dataset.d; const p = R.weekPlan(monday(ck.date))[dow(ck.date)] || []; ck.sel = ck.free ? ck.sel : [...p]; };
A.ckTog = el => { const v = el.dataset.v, i = ck.sel.indexOf(v); if (i >= 0) ck.sel.splice(i, 1); else ck.sel.push(v); };
A.ckMin = el => { ck.minutes = Math.max(5, Math.min(300, ck.minutes + +el.dataset.n)); };
A.ckOutra = () => {
  ui.sheet = () => sheet(`<h2>Outra atividade</h2><div class="chips">${R.OPCOES.filter(o => !o.startsWith('Treino')).map(o => chip(o, ck.sel.includes(o), `data-act="ckPick" data-v="${esc(o)}"`)).join('')}</div>`);
};
A.ckPick = el => { if (!ck.sel.includes(el.dataset.v)) ck.sel.push(el.dataset.v); ui.sheet = null; };
A.ckSave = () => {
  const pr = R.pontosDoCheckin(ck.date, ck.minutes), plan = R.weekPlan(monday(ck.date))[dow(ck.date)] || [];
  const rec = { date: ck.date, acts: [...ck.sel], minutes: ck.minutes, planned: ck.sel.some(a => plan.includes(a)), pts: pr.pts, coins: pr.coins, at: new Date().toISOString() };
  put('checkin', `${ck.date}-${uid()}`, rec); ck.done = rec;
};
A.ckFinish = () => { ck.done = null; go('#/jornada'); };

// ---------- armário ----------
export function armario() {
  const t = R.totais(), c = R.cycleInfo(), falta = c ? Math.max(0, c.duration - c.etapas) : 0;
  return { html: screen(`<div class="scroll"><h1>Armário do ${esc(rexNome())}</h1>
    <div style="display:flex;justify-content:center;background:var(--mint);border-radius:24px;padding:14px">${rex('base', 140)}</div>
    <div style="display:flex;gap:10px"><div style="flex:1;background:var(--pur);color:#fff;border-radius:16px;padding:12px 14px"><div class="small" style="letter-spacing:.06em">PLACAR</div><div style="font-size:24px;font-weight:900">${t.pts.toLocaleString('pt-BR')} pts</div></div>
      <div style="flex:1;background:var(--amb);border-radius:16px;padding:12px 14px"><div class="small" style="letter-spacing:.06em">MOEDAS</div><div style="font-size:24px;font-weight:900">${t.coins}</div></div></div>
    <div class="lab">CONQUISTAS DE CICLO</div>
    <div class="card soft" style="flex-direction:row;align-items:center;gap:14px;border-style:dashed"><div style="width:56px;height:56px;border-radius:28px;background:var(--line);display:flex;align-items:center;justify-content:center">${ic('lock', '#6B6272', 26, 2.5)}</div><div><h2>Medalha do Ciclo ${c ? c.n : 1}</h2><p class="small mut">Cumpra as etapas e leve para o armário. Faltam ${falta}.</p></div></div>
    <div class="lab">ACESSÓRIOS</div>${banner('Em breve: gaste suas moedas em acessórios para o ' + esc(rexNome()) + '.', 'gray')}
  </div>${tabbar('armario')}`) };
}

// ---------- evolução (histórico) ----------
export function evolucao() {
  const cs = list('checkin').map(r => r.data).sort((a, b) => (b.date + b.at).localeCompare(a.date + a.at));
  const dias = new Set(cs.filter(c => c.minutes >= R.MIN_VALIDO).map(c => c.date)).size, t = R.totais();
  return { html: screen(`<div class="scroll"><h1>Evolução</h1>
    <div class="stat"><div><b>${dias}</b><span>DIAS ATIVOS</span></div><div><b>${cs.length}</b><span>CHECK-INS</span></div><div><b>${t.pts}</b><span>PONTOS</span></div><div><b>${Math.round(cs.reduce((a, c) => a + c.minutes, 0) / 60 * 10) / 10} h</b><span>EM MOVIMENTO</span></div></div>
    <div class="lab">HISTÓRICO</div>
    ${cs.length ? `<div class="hist">${cs.slice(0, 40).map(c => `<div class="hrow"><div class="t"><b>${esc(c.acts.join(' + '))}</b><small>${fmtData(c.date)} · ${c.minutes} min</small></div><div class="v">${c.pts ? '+' + c.pts : '0'} pts</div></div>`).join('')}</div>` : banner('Seus check-ins aparecem aqui. Faça o primeiro na Jornada.', 'gray')}
    ${banner('Em breve: gráficos de carga, calendário do mês e relatório do ciclo.', 'gray')}
  </div>${tabbar('evolucao')}`) };
}
export function grupo() {
  return { html: screen(`<div class="scroll"><h1>Grupo</h1><div class="card center" style="align-items:center;padding:24px">${rex('cansado', 100, 106)}<h2>Em breve</h2><p class="mut">Grupos de amigos, ranking da semana e desafios cooperativos.</p></div></div>${tabbar('grupo')}`) };
}

// ---------- perfil e edição da rotina ----------
export function perfil() {
  const p = R.profile(), s = session(), st = syncStatus();
  const msg = { ok: 'Tudo sincronizado.', syncing: 'Sincronizando...', pending: 'Alterações aguardando conexão.', error: 'Não foi possível sincronizar agora.', idle: '' }[st] || '';
  return { html: screen(`<div class="scroll"><div style="display:flex;align-items:center;gap:14px;padding-top:6px"><div style="width:72px;height:72px;border-radius:36px;background:#EEF6EA;display:flex;align-items:center;justify-content:center">${rex('base', 56)}</div><div><h1 style="font-size:22px">${esc(p?.nome || 'Rex')}</h1><p class="small mut">${esc(s?.user?.email || '')}</p></div></div>
    <a class="link-row" href="#/editar">${ic('cal')}<span>Minha rotina</span>${ic('chev', '#6B6272', 18)}</a>
    <div class="card soft"><p class="small">${msg}</p><button class="btn2" data-act="syncNow">SINCRONIZAR AGORA</button></div>
    <button class="btn2" data-act="logout">SAIR DA CONTA</button>
    <p class="small mut" style="text-align:center">Rex versão ${ui.version}</p>
  </div>${tabbar('perfil')}`) };
}
A.syncNow = () => { sync(); };
A.logout = () => { if (confirm('Sair da conta? O que está sincronizado continua salvo na nuvem.')) { signOut(); go('#/login'); } };
export function editar() {
  if (!ob.edit) { ob.edit = true; const rt = R.routine(); ob.plan = JSON.parse(JSON.stringify(R.planOf(rt?.plan))); }
  return onb2();
}
A.saveRoutine = () => {
  ui.sheet = () => sheet(`<h2>Aplicar essa mudança a todas as semanas?</h2><p class="mut">Hoje e os próximos dias da semana mudam de qualquer jeito. Os dias que já passaram ficam como estão.</p>
    <button class="btn" data-act="applyRoutine" data-scope="rotina">MUDAR A ROTINA</button><button class="btn2" data-act="applyRoutine" data-scope="semana">SÓ ESTA SEMANA</button><button class="link" data-act="sheetClose">Cancelar</button>`);
};
A.applyRoutine = el => {
  const t = today(), mon = monday(t), ti = dow(t), plan = JSON.parse(JSON.stringify(ob.plan));
  const wp = R.weekPlan(mon), nw = { ...wp };
  for (let i = ti; i < 7; i++) nw[i] = plan[i];
  put('week', mon, { plan: nw });
  if (el.dataset.scope === 'rotina') put('routine', 'current', { plan, since: t });
  ui.sheet = null; ob.edit = false; go('#/jornada');
};
export function leaveEdit() { ob.edit = false; }
