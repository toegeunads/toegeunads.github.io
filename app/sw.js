// 퇴근애즈 서비스워커 - 앱 화면 오프라인 캐시 (데이터 요청은 캐시하지 않음)
const CACHE = 'toegeunads-v1';
const SHELL = ['./', './index.html', './manifest.json', './config.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase 등 외부 요청은 그대로 통과
  // 네트워크 우선, 실패 시 캐시
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
