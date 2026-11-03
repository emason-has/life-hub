// The "service worker": a small helper that saves a copy of the app's files on
// your phone so the app still opens with no internet.
//
// When you change any app file later, bump the version number below
// (v1 -> v2) so phones know to grab the fresh copy.
const CACHE = "life-hub-v18";

const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./data.js",
  "./exercises.js",
  "./app.js",
  "./fitness.js",
  "./workout.js",
  "./progress.js",
  "./meals.js",
  "./house.js",
  "./health.js",
  "./dump.js",
  "./surf.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

// Exercise form photos, saved so the library works offline at the gym.
const IMAGES = [
  "./ex-img/back-extension-0.jpg",
  "./ex-img/back-extension-1.jpg",
  "./ex-img/band-ham-curl-0.jpg",
  "./ex-img/band-ham-curl-1.jpg",
  "./ex-img/band-lateral-raise-0.jpg",
  "./ex-img/band-lateral-raise-1.jpg",
  "./ex-img/band-pull-apart-0.jpg",
  "./ex-img/band-pull-apart-1.jpg",
  "./ex-img/bench-dips-0.jpg",
  "./ex-img/bench-dips-1.jpg",
  "./ex-img/bulgarian-0.jpg",
  "./ex-img/bulgarian-1.jpg",
  "./ex-img/bw-squat-0.jpg",
  "./ex-img/bw-squat-1.jpg",
  "./ex-img/cable-crunch-0.jpg",
  "./ex-img/cable-crunch-1.jpg",
  "./ex-img/cable-pull-through-0.jpg",
  "./ex-img/cable-pull-through-1.jpg",
  "./ex-img/cable-row-0.jpg",
  "./ex-img/cable-row-1.jpg",
  "./ex-img/cat-cow-0.jpg",
  "./ex-img/cat-cow-1.jpg",
  "./ex-img/childs-pose-0.jpg",
  "./ex-img/childs-pose-1.jpg",
  "./ex-img/close-pushup-0.jpg",
  "./ex-img/close-pushup-1.jpg",
  "./ex-img/db-overhead-tricep-0.jpg",
  "./ex-img/db-overhead-tricep-1.jpg",
  "./ex-img/db-rdl-0.jpg",
  "./ex-img/db-rdl-1.jpg",
  "./ex-img/db-row-0.jpg",
  "./ex-img/db-row-1.jpg",
  "./ex-img/db-shoulder-press-0.jpg",
  "./ex-img/db-shoulder-press-1.jpg",
  "./ex-img/dead-bug-0.jpg",
  "./ex-img/dead-bug-1.jpg",
  "./ex-img/donkey-kicks-0.jpg",
  "./ex-img/donkey-kicks-1.jpg",
  "./ex-img/face-pull-0.jpg",
  "./ex-img/face-pull-1.jpg",
  "./ex-img/frog-pumps-0.jpg",
  "./ex-img/frog-pumps-1.jpg",
  "./ex-img/glute-bridge-0.jpg",
  "./ex-img/glute-bridge-1.jpg",
  "./ex-img/glute-kickback-0.jpg",
  "./ex-img/glute-kickback-1.jpg",
  "./ex-img/goblet-squat-0.jpg",
  "./ex-img/goblet-squat-1.jpg",
  "./ex-img/ham-curl-0.jpg",
  "./ex-img/ham-curl-1.jpg",
  "./ex-img/hip-abduction-0.jpg",
  "./ex-img/hip-abduction-1.jpg",
  "./ex-img/hip-thrust-0.jpg",
  "./ex-img/hip-thrust-1.jpg",
  "./ex-img/lat-pulldown-0.jpg",
  "./ex-img/lat-pulldown-1.jpg",
  "./ex-img/lateral-raise-0.jpg",
  "./ex-img/lateral-raise-1.jpg",
  "./ex-img/lateral-walks-0.jpg",
  "./ex-img/lateral-walks-1.jpg",
  "./ex-img/leg-press-0.jpg",
  "./ex-img/leg-press-1.jpg",
  "./ex-img/mountain-climbers-0.jpg",
  "./ex-img/mountain-climbers-1.jpg",
  "./ex-img/overhead-tricep-0.jpg",
  "./ex-img/overhead-tricep-1.jpg",
  "./ex-img/pallof-0.jpg",
  "./ex-img/pallof-1.jpg",
  "./ex-img/plank-0.jpg",
  "./ex-img/plank-1.jpg",
  "./ex-img/rear-delt-fly-0.jpg",
  "./ex-img/rear-delt-fly-1.jpg",
  "./ex-img/reverse-crunch-0.jpg",
  "./ex-img/reverse-crunch-1.jpg",
  "./ex-img/reverse-fly-0.jpg",
  "./ex-img/reverse-fly-1.jpg",
  "./ex-img/reverse-lunge-0.jpg",
  "./ex-img/reverse-lunge-1.jpg",
  "./ex-img/russian-twist-0.jpg",
  "./ex-img/russian-twist-1.jpg",
  "./ex-img/seated-ham-curl-0.jpg",
  "./ex-img/seated-ham-curl-1.jpg",
  "./ex-img/side-plank-0.jpg",
  "./ex-img/side-plank-1.jpg",
  "./ex-img/single-leg-bridge-0.jpg",
  "./ex-img/single-leg-bridge-1.jpg",
  "./ex-img/smith-squat-0.jpg",
  "./ex-img/smith-squat-1.jpg",
  "./ex-img/step-ups-0.jpg",
  "./ex-img/step-ups-1.jpg",
  "./ex-img/straight-arm-pulldown-0.jpg",
  "./ex-img/straight-arm-pulldown-1.jpg",
  "./ex-img/sumo-squat-0.jpg",
  "./ex-img/sumo-squat-1.jpg",
  "./ex-img/superman-0.jpg",
  "./ex-img/superman-1.jpg",
  "./ex-img/tricep-kickback-0.jpg",
  "./ex-img/tricep-kickback-1.jpg",
  "./ex-img/tricep-pushdown-0.jpg",
  "./ex-img/tricep-pushdown-1.jpg"
];

// First install: save all the files.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.concat(IMAGES))));
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
  if (event.request.url.includes("open-meteo.com")) return;   // surf forecast: always live, never cached here
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
