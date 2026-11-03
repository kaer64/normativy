// Офлайн-режим: приложение открывается и без интернета.
// При обновлении файлов на хостинге поменяй VERSION, чтобы телефон забрал новую версию.
const VERSION = "nv-202611031410";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "vendor/supabase.js",
  "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  const own = url.origin === location.origin && !url.search;
  if (!fonts && !own) return; // данные (Supabase) и всё чужое всегда из сети, без кэша
  const fresh = req.mode === "navigate" || (url.origin === location.origin && /(\/|\.html|config\.js)$/.test(url.pathname));
  if (fresh) {
    // сначала сеть, без сети из кэша
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // шрифты, иконки, библиотека: из кэша, иначе из сети с сохранением
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
    return r;
  })));
});
