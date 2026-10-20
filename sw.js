// The "service worker": a small helper that saves a copy of the app's files on
// your phone so the app still opens with no internet.
//
// When you change any app file later, bump the version number below
// (v1 -> v2) so phones know to grab the fresh copy.
const CACHE = "life-hub-v5";

const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./app.js",
  "./meals.js",
  "./house.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

// First install: save all the files.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

// New version: delete old saved copies.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Whenever the app asks for a file: try the internet first (so you get updates),
// and fall back to the saved copy when you're offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() =>
        caches.match(event.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))
      )
  );
});
