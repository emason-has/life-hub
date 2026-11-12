// =====================================================================
// SURF: which days look good at your beaches this week
//
//   1. Your beaches and what "good" means
//   2. Getting the forecast (free Open-Meteo forecast, no account)
//   3. Picking the best time each day
//   4. The card (Train > Week) and Home widget
//   5. Buttons
//
// Only times you can actually go: weekend mornings, and weekdays after
// work (5pm) when there's at least 45 minutes of light before sunset.
// It's a rough guide from the forecast, so check the beach cam before you go.
// =====================================================================

// ---------- 1. Beaches and what "good" means ----------
const SURF_SPOTS = [
  { id: "trigg", name: "Trigg", lat: -31.874, lon: 115.751 },
  { id: "scarborough", name: "Scarborough", lat: -31.894, lon: 115.755 },
  { id: "mullaloo", name: "Mullaloo", lat: -31.783, lon: 115.733 }
];
const AFTER_WORK = 17;          // earliest weekday start (5pm)
const WEEKEND_HOURS = [6, 11];  // weekend morning window
const SURF_KEY = "lifehub-surf";   // forecast is kept apart from your data (it's not worth backing up)

// These beaches face west, so wind from the east is offshore (clean waves).
function windKind(dir, speed) {
  if (speed < 8) return "light";
  if (dir >= 45 && dir <= 135) return "offshore";
  if (dir > 0 && dir < 180) return "cross-offshore";
  return "onshore";
}

// 0 to 7 points: wave size (0-3) + wind (0-3) + 1 for a longer swell.
function surfScore(wave, period, speed, dir) {
  const w = wave < 0.3 ? 0 : wave < 0.5 ? 1 : wave < 0.8 ? 2 : wave <= 1.6 ? 3 : wave <= 2.2 ? 2 : 1;
  const kind = windKind(dir, speed);
  const wind = kind === "light" || (kind === "offshore" && speed < 30) ? 3
    : kind === "cross-offshore" ? (speed < 20 ? 2 : 1) : kind === "onshore" && speed < 12 ? 1 : 0;
  if (w === 0) return 0;
  // A strong sea breeze (onshore 20+ km/h) makes it messy whatever the swell.
  if (kind === "onshore" && speed >= 20) return Math.min(2, w);
  return w + wind + (period >= 9 ? 1 : 0);
}
function surfRating(score) { return score >= 6 ? "Great" : score >= 4 ? "Good" : score >= 3 ? "OK" : "Poor"; }

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function compass(dir) { return COMPASS[Math.round(dir / 45) % 8]; }

// ---------- 2. Getting the forecast ----------
let surfLoading = false;

function surfCache() {
  try { return JSON.parse(localStorage.getItem(SURF_KEY)) || null; } catch (e) { return null; }
}

async function loadSurf(force) {
  const cache = surfCache();
  if (surfLoading || (!force && cache && Date.now() - cache.at < 3 * 3600 * 1000)) return;
  surfLoading = true;
  try {
    const spots = {};
    await Promise.all(SURF_SPOTS.map(async (s) => {
      const where = `latitude=${s.lat}&longitude=${s.lon}&timezone=Australia%2FPerth&forecast_days=7`;
      const [sea, air] = await Promise.all([
        fetch(`https://marine-api.open-meteo.com/v1/marine?${where}&hourly=wave_height,swell_wave_height,swell_wave_period`).then((r) => r.json()),
        fetch(`https://api.open-meteo.com/v1/forecast?${where}&hourly=wind_speed_10m,wind_direction_10m&daily=sunrise,sunset`).then((r) => r.json())
      ]);
      spots[s.id] = { sea: sea.hourly, air: air.hourly, daily: air.daily };
    }));
    localStorage.setItem(SURF_KEY, JSON.stringify({ at: Date.now(), spots }));
  } catch (e) {
    // Offline or the forecast is down: keep showing the last one.
  }
  surfLoading = false;
  if (["fitness", "home"].includes((location.hash.slice(1) || "home").split("/")[0])) render();
}

// ---------- 3. Best time each day ----------
// For each of the next 7 days: the best spot and hour you could go.
function surfDays() {
  const cache = surfCache();
  if (!cache) return [];
  const out = [];
  for (let i = 0; i < 7; i++) {
    const key = addDays(todayKey(), i);
    const weekend = [0, 6].includes(fromKey(key).getDay());
    let best = null;
    for (const spot of SURF_SPOTS) {
      const f = cache.spots[spot.id];
      if (!f || !f.sea || !f.air) continue;
      const di = f.daily.time.indexOf(key);
      if (di < 0) continue;
      const sunrise = Number(f.daily.sunrise[di].slice(11, 13));
      const sunsetH = Number(f.daily.sunset[di].slice(11, 13)) + Number(f.daily.sunset[di].slice(14, 16)) / 60;
      const from = weekend ? Math.max(WEEKEND_HOURS[0], sunrise) : AFTER_WORK;
      const to = weekend ? WEEKEND_HOURS[1] : Math.floor(sunsetH - 0.75);
      for (let h = from; h <= to; h++) {
        const t = `${key}T${String(h).padStart(2, "0")}:00`;
        const si = f.sea.time.indexOf(t), ai = f.air.time.indexOf(t);
        if (si < 0 || ai < 0) continue;
        const wave = f.sea.swell_wave_height[si] ?? f.sea.wave_height[si] ?? 0;
        const period = f.sea.swell_wave_period[si] ?? 0;
        const speed = f.air.wind_speed_10m[ai], dir = f.air.wind_direction_10m[ai];
        const score = surfScore(wave, period, speed, dir);
        if (!best || score > best.score) best = { spot: spot.name, hour: h, wave, period, speed, dir, score };
      }
    }
    out.push({ key, weekend, best, noLight: !weekend && !best });
  }
  return out;
}

function hourLabel(h) { return h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`; }

function surfLine(d) {
  const b = d.best;
  return `${b.spot} ${hourLabel(b.hour)} · ${Math.round(b.wave * 10) / 10}m${b.period ? ` @ ${Math.round(b.period)}s` : ""} · ${compass(b.dir)} ${Math.round(b.speed)} km/h ${windKind(b.dir, b.speed)}`;
}

// ---------- 4. Card and widget ----------
function surfCardHTML() {
  loadSurf();
  const days = surfDays();
  const cache = surfCache();
  if (!days.length) return `<div class="card"><p class="label" style="margin-top:0">Surf this week</p>
      <p class="small muted" style="margin:0">${surfLoading ? "Getting the forecast for Trigg, Scarborough and Mullaloo..." : "Can't get the surf forecast right now. It needs internet."}</p></div>`;
  const usable = days.filter((d) => d.best);
  const picks = usable.filter((d) => d.best.score >= 4).sort((a, b) => b.best.score - a.best.score).slice(0, 2).map((d) => d.key);
  const top = days.find((d) => d.key === picks[0]);
  const planned = (key) => sessionsOn(key).some((s) => s.type === "surf");
  return `<details class="card drop-card surf-card">
      <summary class="li">${icon("wave", "tile")}<span class="grow"><strong>Surf this week</strong>
        <span class="small muted block">${top ? `Best: ${niceDate(top.key)}, ${top.best.spot} ${hourLabel(top.best.hour)}` : "Nothing great in the next 7 days"}</span></span>${icon("down", "chev")}</summary>
      <div class="drop-body">
        ${days.map((d) => {
          const r = d.best ? surfRating(d.best.score) : null;
          return `<div class="li tight surf-day ${picks.includes(d.key) ? "pick" : ""}">
            <span class="grow"><b>${niceDate(d.key)}</b>${picks.includes(d.key) ? ` <span class="status-pill green">Go</span>` : ""}
              <span class="small muted block">${d.best ? surfLine(d) : d.noLight ? "Not enough light after work" : "No forecast"}</span></span>
            ${r ? `<span class="status-pill ${{ Great: "green", Good: "green", OK: "amber", Poor: "red" }[r]}">${r}</span>` : ""}
            ${d.best && d.best.score >= 3 && !planned(d.key) ? `<button class="circ sm" data-action="surf-add" data-key="${d.key}" data-note="${esc(`${d.best.spot} ${hourLabel(d.best.hour)}`)}" aria-label="Add surf on ${niceDate(d.key)}">${icon("plus")}</button>` : planned(d.key) ? `<span class="small muted">Planned</span>` : ""}
          </div>`;
        }).join("")}
        <p class="small muted" style="margin:8px 0 0">Weekend mornings and weekdays after 5pm with light left. Offshore = wind from the east, cleanest waves. A rough guide: check the beach cam before you go.
          ${cache ? `Updated ${new Date(cache.at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}.` : ""} <button class="link-btn" data-action="surf-refresh">Refresh</button></p>
      </div>
    </details>`;
}

function surfHomeHTML() {
  loadSurf();
  const usable = surfDays().filter((d) => d.best && d.best.score >= 4).sort((a, b) => b.best.score - a.best.score);
  const d = usable[0];
  return `<a class="card next-card" href="#fitness">
      ${icon("wave", "tile")}
      <span class="grow"><span class="small muted block">Surf</span>
        <b>${d ? `${surfRating(d.best.score)}: ${niceDate(d.key)}, ${d.best.spot} ${hourLabel(d.best.hour)}` : "No great surf in the next week"}</b>
        ${d ? `<span class="small muted block">${Math.round(d.best.wave * 10) / 10}m, ${compass(d.best.dir)} ${Math.round(d.best.speed)} km/h ${windKind(d.best.dir, d.best.speed)}</span>` : ""}</span>
      ${icon("chev", "chev")}
    </a>`;
}

WIDGETS.surf = { name: "Surf forecast", icon: "wave", html: () => surfHomeHTML() };

// ---------- 5. Buttons ----------
Object.assign(ACTIONS, {
  "surf-add"({ key, note }) {
    const s = addSession(key, newSession("surf", null, key));
    s.note = note;
    saveData();
    toast(`Surf added for ${niceDate(key)}`);
    render();
  },
  "surf-refresh"() { loadSurf(true); toast("Getting the latest forecast"); }
});
