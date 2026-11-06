const VERSION = 'rex-0.7.3';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/app.js', 'js/views.js', 'js/rules.js', 'js/store.js', 'js/ui.js', 'js/util.js', 'js/config.js', 'js/state.js', 'js/onboarding.js', 'js/program.js', 'js/path.js', 'js/treino.js',
  'assets/rex/base.png', 'assets/rex/determinado.png', 'assets/rex/empolgado.png', 'assets/rex/cansado.png', 'assets/rex/orgulhoso.png', 'assets/cenario/trilha.jpg', 'assets/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('supabase.co')) return;
  if (u.origin === location.origin) {
    // rede primeiro (pega versão nova), cache como reserva offline
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
  } else if (u.hostname.includes('fonts.g')) {
    e.respondWith(caches.open(VERSION).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }))));
  }
});
