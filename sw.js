/* 앱 화면 파일만 저장해 두는 간단한 서비스 워커.
   항상 최신 파일을 먼저 받아 오고, 인터넷이 안 될 때만 저장본을 보여 줘요.
   가계부 데이터(Supabase)는 여기서 건드리지 않아요. */
const CACHE = 'bbangji-v2';
const SHELL = ['./', 'index.html', 'config.js', 'supabase-shim.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
