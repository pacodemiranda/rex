import { esc, today } from './util.js';
import { validCount } from './rules.js';
const P = {
  close: '<path d="M6 6l12 12M18 6L6 18"/>', back: '<path d="M15 5l-7 7 7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M6 12h12"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', chev: '<path d="M9 5l7 7-7 7"/>', moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
  dumb: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>', warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'
};
export const ic = (n, c = '#4A0268', s = 20, w = 3) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;color:${c}">${P[n]}</svg>`;
export const rex = (k, w = 90, h) => `<img class="rex" src="assets/rex/${k}.png" alt="Rex" style="width:${w}px;height:${h || w}px">`;
export const bubble = (rx, t) => `<div class="bubble-row">${rx}<div class="bubble">${t}</div></div>`;
export const chip = (t, on, attrs = '') => `<button class="chip${on ? ' on' : ''}" ${attrs}>${esc(t)}</button>`;
export const medal = (sz = 84, num) => `<div class="medal" style="width:${sz}px;height:${sz}px"><div class="medal-in" style="width:${sz * .8}px;height:${sz * .8}px"><svg width="${sz * .44}" height="${sz * .44}" viewBox="0 0 24 24" fill="#FFF8E7">${P.star.replace(' fill="currentColor"', '')}</svg></div>${num ? `<div class="medal-n">${num}</div>` : ''}</div>`;
export const TABS = [
  ['editar', 'Rotina', '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'],
  ['programa', 'Programa', '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>'],
  ['jornada', 'Jornada', ''],
  ['grupo', 'Grupo', '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 6 1.5 6 5"/>'],
  ['perfil', 'Perfil', '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/>']
];
export const tabbar = active => {
  const feito = validCount(today()) > 0;
  return `<nav class="tabbar">${TABS.map(([id, t, p]) => id === 'jornada'
    ? `<a href="#/jornada" data-act="tabMedal" class="mid ${id === active ? 'on' : ''}" aria-label="Jornada e check-in de hoje"><span class="mbtn ${feito ? 'ok' : ''}">${feito ? ic('check', '#fff', 34, 4) : ic('star', '#fff', 34, 2)}</span>${t}</a>`
    : `<a href="#/${id}" class="${id === active ? 'on' : ''}"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>${t}</a>`).join('')}</nav>`;
};
export const topbar = (title, back, sub) => `<header class="topbar"><a class="icobtn" href="${back}" aria-label="Voltar">${ic('back')}</a><div class="tb-title">${sub ? `<div class="sub">${esc(sub)}</div>` : ''}<div>${esc(title)}</div></div><div style="width:44px"></div></header>`;
export const sheet = inner => `<div class="sheet-back" data-act="sheetClose"></div><div class="sheet"><div class="grip"></div>${inner}</div>`;
export const banner = (t, kind = 'amb') => `<div class="banner ${kind}">${t}</div>`;
