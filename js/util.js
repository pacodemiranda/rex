export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
export const today = () => ymd(new Date());
// Semana de segunda (0) a domingo (6)
export const dow = s => (parse(s).getDay() + 6) % 7;
export const monday = s => addDays(s, -dow(s));
export const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DIAS_LONGO = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
export const fmtData = s => { const d = parse(s); return `${DIAS[dow(s)]}, ${d.getDate()}/${pad(d.getMonth() + 1)}`; };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
