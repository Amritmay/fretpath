// Offline support: cache the app shell, serve cache-first, refresh in background.
const VERSION = 'fretpath-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './icons/icon.svg', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  './js/app.js', './js/data/curriculum.js', './js/data/extras.js', './js/lib/visuals.js', './js/views/recall.js', './js/tools/library.js',
  './js/lib/actions.js', './js/lib/audio.js', './js/lib/music.js', './js/lib/scheduler.js', './js/lib/store.js', './js/lib/ui.js',
  './js/tools/index.js', './js/tools/metronome.js', './js/tools/drums.js', './js/tools/tuner.js', './js/tools/fretboard.js',
  './js/tools/ear.js', './js/tools/changes.js', './js/tools/songpad.js',
  './js/views/today.js', './js/views/session.js', './js/views/path.js', './js/views/progress.js', './js/views/misc.js', './js/views/onboarding.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
