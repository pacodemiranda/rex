import { esc, today, addDays, monday, dow, DIAS, DIAS_LONGO, fmtData, uid } from './util.js';
import { ic, rex, bubble, chip, medal, tabbar, topbar, sheet, banner } from './ui.js';
import { put, list, session, signOut, sync, syncStatus } from './store.js';
import * as R from './rules.js';
import * as P from './program.js';
import { PATH } from './path.js';
import { ui, ob, ck, A, nav, num } from './state.js';
import { screen, sheetHtml, leaveDiag } from './onboarding.js';
export { ui, ob, ck, A, leaveDiag };

const rexNome = () => R.profile()?.nome || 'Rex';

// ---------- rotina (montada a partir do programa) ----------
function weekRows(today_i) {
  return DIAS.map((d, i) => {
    const acts = ob.plan[i];
    return `<div class="daterow ${i === today_i ? 'today' : ''}"><div class="d">${d}</div><div class="acts">${acts.length ? acts.map((a, j) => `<button class="pill" data-act="rmAct" data-d="${i}" data-i="${j}" aria-label="Remover ${esc(R.label(a))}">${esc(R.label(a))}</button>`).join('') : '<span class="pill rest">Descanso</span>'}</div><button class="addbtn" data-act="addAct" data-d="${i}" aria-label="Adicionar atividade em ${DIAS_LONGO[i]}">${ic('plus')}</button></div>`;
  }).join('');
}
export function onb2() {
  const edit = ob.edit;
  if (!edit && !ob.planInit) { const pg = R.program(); ob.plan = pg?.schedule ? P.planoDoSchedule(pg) : R.emptyPlan(); ob.planInit = true; }
  const n = Object.values(ob.plan).filter(a => a.length).length, pg = R.program();
  const sug = pg?.schedule ? 'Já deixei a rotina sugerida pelo seu programa. Ajuste como preferir.' : 'Toque no + para escolher o que fazer em cada dia.';
  return { html: screen(`${edit ? topbar('Minha rotina', '#/perfil') : `<div class="progress"><div class="bar"><i style="width:${7 * 100 / 8}%"></i></div><span>7 de 8</span></div>`}<div class="scroll">
    ${edit ? '' : '<h1>Organize a sua semana</h1>'}
    <p class="mut">${sug} Toque numa atividade para remover. Mais de uma no mesmo dia vira um número na medalha.</p>
    ${!pg && R.pedido() ? banner('Seu treino chega em até 24h. Por ora, marque os dias em que pretende se mexer. Depois você encaixa os treinos.', 'amb') : ''}
    <div style="display:flex;flex-direction:column;gap:8px">${weekRows(edit ? dow(today()) : -1)}</div>
    <div class="card"><h2>Meta da semana: ${n} ${n === 1 ? 'dia' : 'dias'} com atividade</h2><p class="small mut">A semana (etapa) fecha quando você chega nessa meta.</p></div>
  </div><div class="foot"><button class="btn" data-act="${edit ? 'saveRoutine' : 'go'}" data-to="#/onb3" ${n ? '' : 'disabled'}>${edit ? 'SALVAR' : 'CONTINUAR'}</button>${edit ? '' : '<button class="link" data-act="go" data-to="#/prog">Voltar</button>'}</div>${sheetHtml()}`) };
}
A.rmAct = el => { ob.plan[+el.dataset.d].splice(+el.dataset.i, 1); };
A.addAct = el => {
  const d = +el.dataset.d, wk = R.program()?.workouts || [], p = R.profile() || {};
  const prefs = (p.atividades || []).filter(a => a !== 'Outro' && !(wk.length && a === 'Academia'));
  const outras = [...new Set(['Academia', ...R.ATIVIDADES.filter(a => a !== 'Outra atividade')])].filter(a => !prefs.includes(a) && !(wk.length && a === 'Academia'));
  const sec = (t, arr) => arr.length ? `<div class="lab">${t}</div><div class="chips">${arr.map(([v, t2]) => chip(t2, ob.plan[d].includes(v), `data-act="chooseAct" data-d="${d}" data-v="${esc(v)}"`)).join('')}</div>` : '';
  ui.sheet = () => sheet(`<h2>${DIAS_LONGO[d]}: escolha a atividade</h2>${sec('SEUS TREINOS', wk.map(w => ['w:' + w.id, w.name]))}${sec('O QUE VOCÊ GOSTA', prefs.map(a => [a, a]))}${sec('OUTRAS', outras.map(a => [a, a]))}<button class="btn" data-act="sheetClose">PRONTO</button>`);
};
A.chooseAct = el => { const d = +el.dataset.d, v = el.dataset.v, a = ob.plan[d]; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); A.addAct({ dataset: { d } }); };
A.sheetClose = () => { ui.sheet = null; };

export function onb3() {
  return { html: screen(`<div class="progress"><div class="bar"><i style="width:100%"></i></div><span>8 de 8</span></div><div class="scroll center" style="align-items:stretch">
    <div style="display:flex;justify-content:center;padding-top:10px"><div style="width:190px;height:190px;border-radius:95px;background:#EEF6EA;display:flex;align-items:center;justify-content:center">${rex('empolgado', 130, 154)}</div></div>
    <h1 style="text-align:center">Esse é o seu parceiro de jornada</h1>
    <p class="mut" style="text-align:center">Ele treina com você, comemora cada check-in e nunca te cobra. Dê um nome a ele.</p>
    <input class="field" data-bind="nome" value="${esc(ob.nome)}" maxlength="16" aria-label="Nome do Rex">
    <div class="chips" style="justify-content:center">${['Rex', 'Dino', 'Sauro'].map(n => chip(n, ob.nome === n, `data-act="setNome" data-v="${n}"`)).join('')}</div>
  </div><div class="foot"><button class="btn" data-act="finishOnb">COMEÇAR MINHA JORNADA</button><button class="link" data-act="go" data-to="#/onb2">Voltar</button></div>`) };
}
A.setNome = el => { ob.nome = el.dataset.v; };
A.finishOnb = () => {
  const t = today(), p = R.profile() || {};
  put('profile', 'me', { ...p, nome: (ob.nome || 'Rex').trim() || 'Rex', criado: p.criado || t });
  put('routine', 'current', { plan: ob.plan, since: t });
  const mon = monday(t), wp = JSON.parse(JSON.stringify(ob.plan)); // refaz a semana atual (pode haver resto de conta antiga)
  for (let i = 0; i < 7; i++) if (addDays(mon, i) < (p.criado || t)) wp[i] = [];
  put('week', mon, { plan: wp });
  put('cycle', 'current', { n: 1, start: monday(t), duration: 8, objetivo: (p.objetivos && p.objetivos[0]) || 'Criar constância' });
  ob.planInit = false; nav.go('#/jornada');
};

// ---------- jornada ----------
let jdata = null;
export function jornada() {
  const mon = monday(today()), s = R.weekSummary(mon), c = R.cycleInfo(), cen = R.cenarioDaSemana(mon, R.cycle());
  jdata = { s, cen };
  const t = s.days.find(d => d.date === today());
  const pend = t.state === 'today', nm = R.labels(t.plan);
  const dots = Array.from({ length: Math.min(7, Math.max(s.meta, 1)) }, (_, i) => `<i class="${i < s.active ? 'on' : ''}"></i>`).join('');
  const cta = pend ? `<button class="btn" data-act="goCheck" data-d="${t.date}">REGISTRAR ${nm.length > 1 ? 'AS ATIVIDADES DE HOJE' : esc(nm[0]).toUpperCase()}</button><button class="link" data-act="goCheck" data-d="${t.date}" data-free="1">Registrar outra atividade</button>`
    : `<button class="btn2" data-act="goCheck" data-d="${t.date}" data-free="1">${t.state === 'done' || t.state === 'bonus' ? 'REGISTRAR OUTRA ATIVIDADE' : 'REGISTRAR UMA ATIVIDADE'}</button><button class="link" data-act="goCheck" data-d="${addDays(today(), -1)}" data-free="1">Esqueceu ontem? Registre aqui</button>`;
  const pedido = R.pedido() && !R.program() ? `<a class="banner amb pedido" href="#/progcolar"><span>Seu treino chega em até 24h</span><b>Já tenho o programa</b></a>` : '';
  return { html: screen(`<div class="hdr"><div class="row"><div><div class="eyebrow">CICLO ${c.n} · ${esc((c.objetivo || '').toUpperCase())}</div><h1>Semana ${c.semana} de ${c.duration}</h1></div><div class="etp"><b>${c.etapas}/${c.duration}</b><span>ETAPAS</span></div></div>
    <div class="chipweek"><span>${s.active} de ${s.meta} dias ativos nesta semana</span><div class="dots">${dots}</div></div>${pedido}</div>
    <div id="jwin"></div><div class="cta">${cta}</div>${tabbar('jornada')}${sheetHtml()}`, 'jr'), after: layoutJourney };
}
function pathX(imgY) {
  const y = Math.max(PATH[0][0], Math.min(PATH[PATH.length - 1][0], imgY));
  for (let k = 1; k < PATH.length; k++) if (PATH[k][0] >= y) { const [y0, x0] = PATH[k - 1], [y1, x1] = PATH[k]; return y1 === y0 ? x1 : x0 + (x1 - x0) * (y - y0) / (y1 - y0); }
  return PATH[PATH.length - 1][1];
}
export function layoutJourney() {
  const win = document.getElementById('jwin'); if (!win || !jdata) return;
  const { s, cen } = jdata, cw = win.clientWidth, wh = win.clientHeight;
  const sc = Math.max(cw / 390, wh / 823), W = 390 * sc, H = 823 * sc, left = (cw - W) / 2, top = wh - H;
  const cta = document.querySelector('.cta'), wr = win.getBoundingClientRect();
  const ctaTop = cta ? cta.getBoundingClientRect().top - wr.top : wh - 190;
  const base = ctaTop - 62, topM = 40, d = Math.min(75, Math.max(36, (base - topM) / 6)), size = Math.min(52, d * .8), msz = Math.min(84, d * 1.15);
  let h = `<img class="bg" src="assets/cenario/${cen}.jpg" alt="" style="left:${left}px;top:${top}px;width:${W}px;height:${H}px">`;
  s.days.forEach((dd, i) => {
    const y = base - i * d, x = left + pathX((y - top) / sc) * sc, st = dd.state, onLeft = x < cw / 2;
    const names = R.labels(dd.plan).join(' + ');
    let inner = '', lab = names || 'Descanso', sub = DIAS[i].toUpperCase();
    if (st === 'done') inner = ic('check', '#1F0A2B', 26, 3.5);
    else if (st === 'bonus') { inner = ic('moon', '#1F0A2B', 24, 2.6) + `<div class="star">${ic('star', '#1F0A2B', 15)}</div>`; lab = (names ? names + ' · ' : 'Descanso · ') + 'bônus'; }
    else if (st === 'absent') inner = ic('minus', '#6B6272', 22);
    else if (st === 'rest' || st === 'resttoday' || st === 'restf') inner = ic('moon', st === 'restf' ? '#9A92A0' : '#1F0A2B', 24, 2.6);
    else if (st === 'future') inner = ic('dumb', '#9A92A0', 24, 2.6);
    if (st === 'resttoday') sub += ' · HOJE';
    if (st === 'today') {
      const n = dd.plan.length > 1 ? dd.plan.length : 0, bs = msz + 16;
      h += `<button class="medal-btn" data-act="goCheck" data-d="${dd.date}" aria-label="Registrar ${esc(names)}" style="left:${x - bs / 2}px;top:${y - bs / 2}px;width:${bs}px;height:${bs}px"><div class="halo"></div>${medal(msz, n)}</button>`;
      sub += ' · HOJE';
      const rl = Math.max(2, Math.min(cw - 76, onLeft ? x - 128 : x + 56));
      h += `<img class="rex" src="assets/rex/determinado.png" alt="Rex" style="position:absolute;left:${rl}px;top:${y - 62}px;width:74px;height:88px">`;
    } else h += `<div class="node ${st}" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px">${inner}</div>`;
    const off = (st === 'today' ? msz / 2 : size / 2) + 10, pos = onLeft ? `left:${x + off}px` : `right:${cw - x + off}px`;
    h += `<div class="nlab ${st === 'today' ? 'today' : st === 'done' ? 'done' : ''}" style="${pos};top:${y - 20}px;text-align:${onLeft ? 'left' : 'right'}"><small>${sub}</small><b>${esc(lab)}</b></div>`;
  });
  win.innerHTML = h;
}
addEventListener('resize', layoutJourney);
A.goCheck = el => {
  ck.date = el.dataset.d || today(); ck.done = null; ck.minutes = 45;
  const p = R.weekPlan(monday(ck.date))[dow(ck.date)] || [];
  ck.sel = el.dataset.free ? [] : [...p]; ck.free = !!el.dataset.free;
  nav.go('#/checkin');
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
    <div style="display:flex;flex-direction:column;gap:8px"><div class="lab">ATIVIDADE</div><div class="chips">${all.map(a => chip(R.label(a), ck.sel.includes(a), `data-act="ckTog" data-v="${esc(a)}"`)).join('')}<button class="chip ghost" data-act="ckOutra">+ Outra</button></div><p class="small mut">Qualquer atividade conta. ${plan.length ? 'A do plano vale a parada do dia.' : 'Em dia de descanso, vira bônus.'}</p></div>
    <div style="display:flex;flex-direction:column;gap:8px"><div class="lab">DURAÇÃO</div><div class="stepper"><button data-act="ckMin" data-n="-5" aria-label="Diminuir 5 minutos">${ic('minus', '#4A0268', 22)}</button><b>${ck.minutes} min</b><button data-act="ckMin" data-n="5" aria-label="Aumentar 5 minutos">${ic('plus', '#4A0268', 22)}</button></div><p class="small mut">Abaixo de ${R.MIN_VALIDO} min o check-in é salvo, mas não pontua.</p></div>
    <div class="pts"><div>Você ganha</div><div><span class="p">+${pr.pts} pts</span><span class="c">+${pr.coins} moedas</span></div></div>
  </div><div class="foot"><button class="btn" data-act="ckSave" ${ck.sel.length ? '' : 'disabled'}>SALVAR CHECK-IN</button><p class="small mut" style="text-align:center">Esqueceu um dia? Registre até o fim do dia seguinte.</p></div>${sheetHtml()}`) };
}
A.ckDate = el => { ck.date = el.dataset.d; const p = R.weekPlan(monday(ck.date))[dow(ck.date)] || []; ck.sel = ck.free ? ck.sel : [...p]; };
A.ckTog = el => { const v = el.dataset.v, i = ck.sel.indexOf(v); if (i >= 0) ck.sel.splice(i, 1); else ck.sel.push(v); };
A.ckMin = el => { ck.minutes = Math.max(5, Math.min(300, ck.minutes + +el.dataset.n)); };
A.ckOutra = () => {
  ui.sheet = () => sheet(`<h2>Outra atividade</h2><div class="chips">${outras().map(o => chip(R.label(o), ck.sel.includes(o), `data-act="ckPick" data-v="${esc(o)}"`)).join('')}</div>`);
};
A.ckPick = el => { if (!ck.sel.includes(el.dataset.v)) ck.sel.push(el.dataset.v); ui.sheet = null; };
A.ckSave = () => {
  const pr = R.pontosDoCheckin(ck.date, ck.minutes), plan = R.weekPlan(monday(ck.date))[dow(ck.date)] || [];
  const rec = { date: ck.date, acts: [...ck.sel], names: R.labels(ck.sel), minutes: ck.minutes, planned: ck.sel.some(a => plan.includes(a)), pts: pr.pts, coins: pr.coins, at: new Date().toISOString() };
  put('checkin', `${ck.date}-${uid()}`, rec); ck.done = rec;
};
const outras = () => [...(R.program()?.workouts || []).map(w => 'w:' + w.id), ...new Set(['Academia', ...R.ATIVIDADES.filter(a => a !== 'Outra atividade')])];
A.ckFinish = () => { ck.done = null; nav.go('#/jornada'); };

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
    ${cs.length ? `<div class="hist">${cs.slice(0, 40).map(c => `<div class="hrow"><div class="t"><b>${esc((c.names || c.acts).join(' + '))}</b><small>${fmtData(c.date)} · ${c.minutes} min</small></div><div class="v">${c.pts ? '+' + c.pts : '0'} pts</div></div>`).join('')}</div>` : banner('Seus check-ins aparecem aqui. Faça o primeiro na Jornada.', 'gray')}
    ${banner('Em breve: gráficos de carga, calendário do mês e relatório do ciclo.', 'gray')}
  </div>${tabbar('evolucao')}`) };
}
export function grupo() {
  const url = location.origin + location.pathname;
  return { html: screen(`<div class="scroll"><h1>Grupo</h1>
    ${bubble(rex('empolgado', 84, 100), 'Treinar com amigo é bem mais fácil. Chame alguém para entrar na jornada com você!')}
    <div class="card"><h2>Convide seus amigos</h2>
      <div class="benef"><span class="bico">${ic('star', '#fff', 18, 2)}</span><p>Vejam quem se mexeu mais na semana (em breve).</p></div>
      <div class="benef"><span class="bico">${ic('check', '#fff', 18, 3)}</span><p>Um lembra o outro quando o dia aperta.</p></div>
      <div class="benef"><span class="bico">${ic('dumb', '#fff', 18, 2.6)}</span><p>Desafios juntos, com medalha para o grupo (em breve).</p></div>
      <button class="btn" data-act="convidar">CONVIDAR AMIGOS</button>
      <p class="small mut" style="text-align:center">${esc(url.replace('https://', ''))}</p></div>
    <div class="lab">SEU GRUPO</div>
    <div class="slots"><div class="slot me">${rex('base', 44)}<small>Você</small></div>${[1, 2, 3].map(() => `<button class="slot" data-act="convidar" aria-label="Convidar amigo">${ic('plus', '#6B6272', 22)}<small>Convidar</small></button>`).join('')}</div>
  </div>${tabbar('grupo')}${sheetHtml()}`) };
}
A.convidar = async () => {
  const url = location.origin + location.pathname, text = 'Vem treinar comigo no Rex! É um app que transforma a rotina de exercícios em jornada, com pontos e medalhas.';
  try { if (navigator.share) { await navigator.share({ title: 'Rex', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); ui.toast = 'Convite copiado. Cole numa conversa com seus amigos.'; } catch (e) { ui.toast = 'Copie o link: ' + url; }
};

// ---------- perfil e edição da rotina ----------
export function perfil() {
  const p = R.profile(), s = session(), st = syncStatus(), pg = R.program();
  const msg = { ok: 'Tudo sincronizado.', syncing: 'Sincronizando...', pending: 'Alterações aguardando conexão.', error: 'Não foi possível sincronizar agora.', idle: '' }[st] || '';
  const meds = list('medida').map(r => r.data).filter(m => m.peso).sort((a, b) => b.date.localeCompare(a.date));
  const peso = meds[0]?.peso ?? p?.peso;
  const row = (href, icon, t, sub) => `<a class="link-row" href="${href}">${ic(icon)}<span>${t}${sub ? `<small>${esc(sub)}</small>` : ''}</span>${ic('chev', '#6B6272', 18)}</a>`;
  return { html: screen(`<div class="scroll"><div style="display:flex;align-items:center;gap:14px;padding-top:6px"><div style="width:72px;height:72px;border-radius:36px;background:#EEF6EA;display:flex;align-items:center;justify-content:center">${rex('base', 56)}</div><div><h1 style="font-size:22px">${esc(p?.nome || 'Rex')}</h1><p class="small mut">${esc(s?.user?.email || '')}</p></div></div>
    <div class="card"><div class="row2"><div><div class="lab">PESO ATUAL</div><div style="font-size:26px;font-weight:900">${peso ? String(peso).replace('.', ',') + ' kg' : '-'}</div>${p?.metaPeso ? `<p class="small mut">Meta: ${String(p.metaPeso).replace('.', ',')} kg</p>` : ''}</div><button class="btn2" style="width:auto;padding:12px 16px" data-act="pesoSheet">ATUALIZAR</button></div></div>
    ${row('#/diag1', 'warn', 'Meu diagnóstico', 'Revise objetivos, saúde e preferências')}
    ${row('#/programa', 'dumb', 'Meu programa', pg ? `${pg.name} · ${pg.workouts.length} treinos` : (R.pedido() ? 'Pedido ao profissional em andamento' : 'Nenhum programa'))}
    ${row('#/editar', 'cal', 'Minha rotina')}
    <div class="card soft"><p class="small">${msg}</p><button class="btn2" data-act="syncNow">SINCRONIZAR AGORA</button></div>
    <button class="btn2" data-act="logout">SAIR DA CONTA</button>
    <p class="small mut" style="text-align:center">Rex versão ${ui.version}</p>
  </div>${tabbar('perfil')}${sheetHtml()}`) };
}
A.pesoSheet = () => {
  const p = R.profile(); ui.f = { peso: String(p?.peso ?? '').replace('.', ',') };
  ui.sheet = () => sheet(`<h2>Atualizar peso</h2><div class="inl"><input class="field" inputmode="decimal" data-bind="f.peso" placeholder="Ex.: 80,5" value="${esc(ui.f.peso)}"><span class="unit">kg</span></div><button class="btn" data-act="salvaPeso">SALVAR</button><button class="link" data-act="sheetClose">Cancelar</button>`);
};
A.salvaPeso = () => {
  const n = num(ui.f.peso); if (!n || n < 30 || n > 300) { ui.toast = 'Digite um peso válido.'; return; }
  put('profile', 'me', { ...R.profile(), peso: n }); put('medida', today(), { peso: n, date: today() }); ui.sheet = null;
};
A.syncNow = () => { sync(); };
A.logout = () => { if (confirm('Sair da conta? O que está sincronizado continua salvo na nuvem.')) { signOut(); nav.go('#/login'); } };
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
  ui.sheet = null; ob.edit = false; nav.go('#/jornada');
};
export function leaveEdit() { ob.edit = false; }
