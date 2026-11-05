import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
const LS = 'rex.v1';
let S = { session: null, records: {}, dirty: {}, lastPull: null };
const listeners = new Set();
try { S = { ...S, ...JSON.parse(localStorage.getItem(LS) || '{}') }; } catch (e) { /* sem armazenamento: roda em memória */ }
function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { /* ignora */ } }
export const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach(fn => fn());
const k = (kind, id) => `${kind}/${id}`;

// ---------- registros locais ----------
export function getRec(kind, id) { const r = S.records[k(kind, id)]; return r && !r.deleted ? r : null; }
export function list(kind) { return Object.values(S.records).filter(r => r.kind === kind && !r.deleted); }
export function put(kind, id, data) {
  const r = { kind, id, data, updated_at: new Date().toISOString(), deleted: false };
  S.records[k(kind, id)] = r; S.dirty[k(kind, id)] = 1; save(); emit(); syncSoon(); return r;
}
export function del(kind, id) {
  const key = k(kind, id); const cur = S.records[key]; if (!cur) return;
  S.records[key] = { ...cur, deleted: true, updated_at: new Date().toISOString() }; S.dirty[key] = 1; save(); emit(); syncSoon();
}

// ---------- autenticação (API REST do Supabase, sem biblioteca) ----------
const H = (token) => ({ apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
export const session = () => S.session;
function setSession(j) {
  const prevUid = S.session?.user?.id;
  S.session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user?.id, email: j.user?.email } };
  if (prevUid && prevUid !== S.session.user.id) { S.records = {}; S.dirty = {}; S.lastPull = null; }
  save();
}
function authError(j) {
  const m = (j.msg || j.error_description || j.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('already registered')) return 'Esse e-mail já tem conta. Use Entrar.';
  if (m.includes('password')) return 'A senha precisa de pelo menos 6 caracteres.';
  if (m.includes('email not confirmed')) return 'Confirme o e-mail pelo link que enviamos e entre de novo.';
  return j.msg || j.error_description || j.message || 'Não deu certo. Tente de novo.';
}
export async function signIn(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: H(), body: JSON.stringify({ email, password }) });
  const j = await r.json(); if (!r.ok) throw new Error(authError(j));
  setSession(j); await sync(); emit();
}
export async function signUp(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: 'POST', headers: H(), body: JSON.stringify({ email, password }) });
  const j = await r.json(); if (!r.ok) throw new Error(authError(j));
  if (j.access_token) { setSession(j); emit(); return 'ok'; }
  return 'confirm';
}
export function signOut() { S = { session: null, records: {}, dirty: {}, lastPull: null }; save(); emit(); }
async function token() {
  const s = S.session; if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  if (!navigator.onLine) return s.access_token;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: H(), body: JSON.stringify({ refresh_token: s.refresh_token }) });
    const j = await r.json();
    if (r.ok) { setSession(j); return S.session.access_token; }
    if (r.status === 400 || r.status === 401) { S.session = null; save(); emit(); }
  } catch (e) { /* offline */ }
  return s.access_token;
}

// ---------- sincronização (vence a última edição) ----------
let syncing = false, timer = null, status = 'idle';
export const syncStatus = () => status;
export function syncSoon() { clearTimeout(timer); timer = setTimeout(sync, 1200); }
export async function sync() {
  if (syncing || !S.session || !navigator.onLine) return;
  syncing = true; status = 'syncing'; emit();
  try {
    const t = await token(); if (!t) throw new Error('sem sessão');
    const uid = S.session.user.id;
    const keys = Object.keys(S.dirty);
    if (keys.length) {
      const rows = keys.map(key => { const r = S.records[key]; return { user_id: uid, kind: r.kind, id: r.id, data: r.data, updated_at: r.updated_at, deleted: !!r.deleted }; });
      const r = await fetch(`${SUPABASE_URL}/rest/v1/records?on_conflict=user_id,kind,id`, { method: 'POST', headers: { ...H(t), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows) });
      if (!r.ok) throw new Error('push ' + r.status);
      keys.forEach(key => { if (S.records[key] && rows.find(x => x.kind + '/' + x.id === key)?.updated_at === S.records[key].updated_at) delete S.dirty[key]; });
    }
    const q = `select=kind,id,data,updated_at,deleted&order=updated_at.asc&limit=1000${S.lastPull ? `&updated_at=gt.${encodeURIComponent(S.lastPull)}` : ''}`;
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/records?${q}`, { headers: H(t) });
    if (!r2.ok) throw new Error('pull ' + r2.status);
    const rows2 = await r2.json();
    for (const x of rows2) {
      const key = k(x.kind, x.id), cur = S.records[key];
      if (!cur || !S.dirty[key] || x.updated_at > cur.updated_at) { S.records[key] = x; delete S.dirty[key]; }
      if (!S.lastPull || x.updated_at > S.lastPull) S.lastPull = x.updated_at;
    }
    status = Object.keys(S.dirty).length ? 'pending' : 'ok';
  } catch (e) { status = 'error'; }
  syncing = false; save(); emit();
}
addEventListener('online', sync);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });
