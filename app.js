// =====================================================================
// LIFE HUB: the app's logic
// Sections:
//   1. Saving and loading your data (stays on your phone)
//   2. Date helpers
//   3. Your programme: weeks, phases, habits, wake-up time
//   4. Ticks
//   5. Line chart (used by the Fitness charts)
//   6. Screens (Home, Body measurements, Settings, Routines)
//   7. Buttons: what happens when you tap things
//   8. Backup: export and import
//   9. Start the app
// =====================================================================


// ---------- 1. Saving and loading your data ----------
// Everything is saved in your phone's browser storage ("localStorage").
// Nothing is sent anywhere. No login, no server.
const STORE_KEY = "lifehub-data";

function blankData() {
  return {
    version: 1,
    settings: {
      startDate: todayKey(),     // the day your programme started (week 1)
      baliDate: "2027-02-15",
      createdOn: todayKey(),
      lastBackup: null
    },
    ticks: {},        // { "2026-10-20": { "tue-gym": true, ... } }
    weekModes: {},    // { "2026-10-19": "minimum" }  (keyed by the Monday)
    log: {},          // { "hip-thrust": [ { date, weight, reps: [10,10,10,10] } ] }
    measurements: [], // [ { date, waist, hips, weight } ]
    photos: [],       // [ "2026-10-20" ]  (just the dates; photos stay in your Photos app)
    feelings: [],     // [ { date, energy, notes } ]
    tiimoAdded: {},   // { "t-bed": true, "t-wake": "6:30am" }  (reminders already set up in Tiimo)
    recipes: JSON.parse(JSON.stringify(STARTER_RECIPES)),  // your recipe library
    mealPlans: {},    // { "2026-10-26": { "Mon-dinner": "r-pasta", ... } }  (keyed by the Monday)
    shopping: {},     // { "2026-10-26": { checked: { "oat": true }, extras: ["Coffee pods"] } }
    storeFor: {},     // { "protein powder": "Woolworths" }  (remembered store for each item)
    staples: STAPLES.slice(),
    chores: CLEANING_TASKS.map((c) => ({ ...c, lastDone: null })),  // cleaning tasks + when last done
    seenStarters: STARTER_RECIPES.map((r) => r.id),  // starter recipes already offered (so deleted ones stay deleted)
    inbox: [],        // brain dump: [ { id, text, list: "inbox" | "today" | "week" | "later", done } ]
    focus: { sessions: [], running: null }, // finished sprints [ { date, mins } ] + the sprint in progress
    health: {}        // from Apple Health: { "2026-10-20": { steps, sleep, resting, weight, workouts } }
  };
}

function loadData() {
  const fresh = blankData();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && typeof saved === "object") {
      const merged = { ...fresh, ...saved, settings: { ...fresh.settings, ...saved.settings } };
      // The trip moved from "around 25 Feb" to arriving 15 Feb.
      if (merged.settings.baliDate === "2027-02-25") merged.settings.baliDate = "2027-02-15";
      // New starter recipes added in later updates appear once (deleted ones don't come back).
      const firstTen = ["r-oats", "r-bowls", "r-stirfry", "r-steak", "r-pasta", "r-balls", "r-banana-bread", "r-yoghurt", "r-smoothie", "r-chilli"];
      const seen = saved.seenStarters || (saved.recipes ? firstTen : STARTER_RECIPES.map((r) => r.id));
      STARTER_RECIPES.filter((r) => !seen.includes(r.id)).forEach((r) => merged.recipes.push(JSON.parse(JSON.stringify(r))));
      merged.seenStarters = STARTER_RECIPES.map((r) => r.id);
      return merged;
    }
  } catch (e) { /* nothing saved yet, or unreadable: start fresh */ }
  return fresh;
}

function saveData() {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

let data = loadData();
saveData();


// ---------- 2. Date helpers ----------
// Dates are stored as simple text like "2026-10-20" (year-month-day).
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toKey(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function todayKey() { return toKey(new Date()); }
function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}
function daysBetween(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}
function mondayOf(key) {
  const day = fromKey(key).getDay();          // 0 = Sun, 1 = Mon ...
  return addDays(key, day === 0 ? -6 : 1 - day);
}
function dayName(key) { return DAY_NAMES[fromKey(key).getDay()]; }
function niceDate(key) {
  const d = fromKey(key);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}


// ---------- 3. Your programme ----------
// Which week of the programme a date falls in (week 1 = your start week).
function weekNumber(key = todayKey()) {
  return Math.max(1, Math.floor(daysBetween(data.settings.startDate, key) / 7) + 1);
}

// Phase index 0-3 based on the week number.
function phaseIndex(key = todayKey()) {
  const w = weekNumber(key);
  if (w <= 2) return 0;
  if (w <= 4) return 1;
  if (w <= 6) return 2;
  return 3;
}

// This week's wake-up target: 6:45, then 6:30, then 6:15 and stays there.
function wakeTarget(key = todayKey()) {
  return WAKE_TIMES[Math.min(weekNumber(key) - 1, WAKE_TIMES.length - 1)];
}

// The habits that apply on a given day: all habits from phase 1 up to
// the current phase, keeping only the ones meant for that weekday.
function habitsFor(key) {
  const day = dayName(key);
  return PHASES.slice(0, phaseIndex(key) + 1)
    .flatMap((p) => p.habits)
    .filter((h) => !h.days || h.days.includes(day))
    .map((h) => h.id === "woke-on-time" ? { ...h, label: `Woke up by ${wakeTarget(key)}am` } : h);
}


// ---------- 4. Ticks ----------
// Habits and checklists are ticks. Workouts, streaks and the weekly score
// live in fitness.js.
function isTicked(key, id) {
  return !!(data.ticks[key] && data.ticks[key][id]);
}
function setTick(key, id, on) {
  data.ticks[key] = data.ticks[key] || {};
  if (on) data.ticks[key][id] = true;
  else delete data.ticks[key][id];
  if (Object.keys(data.ticks[key]).length === 0) delete data.ticks[key];
  saveData();
}

// ---------- 5. Line chart ----------
// What we chart: the weight, or the best reps if there's no weight.
function chartValue(s) {
  return s.weight || Math.max(0, ...s.reps);
}


// ---------- 6. Screens ----------
// Each screen is built as a chunk of HTML text, then shown on the page.

// Makes your typed text safe to show on screen.
function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function tickHTML(key, item, extra = "") {
  const on = isTicked(key, item.id);
  return `<button class="tick ${on ? "on" : ""}" data-action="tick" data-date="${key}" data-id="${item.id}" aria-pressed="${on}">
      <span class="box"></span><span class="label">${esc(item.label)}</span>${extra}
    </button>`;
}

let feelingEnergy = null;

const SCREENS = {
  home: homeScreen,
  routines: routinesScreen,
  settings: settingsScreen
};

function render() {
  const [screen, ...rest] = (location.hash.slice(1) || "home").split("/");
  const draw = SCREENS[screen] || homeScreen;
  document.getElementById("app").innerHTML = draw(...rest);
  // Screens that live under another tab (a workout is part of Fitness, etc.)
  const parentTab = { session: "fitness", tpl: "fitness", ex: "fitness", pickex: "fitness", train: "fitness", wlog: "fitness",
    recipe: "meals", pick: "meals", settings: "home", health: "home" };
  const tab = parentTab[screen] || (SCREENS[screen] ? screen : "home");
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
}

// ----- Home -----
function homeScreen() {
  const today = todayKey();
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const phase = PHASES[phaseIndex()];
  const stats = weekScore(mondayOf(today));
  const streak = dayStreak();
  const weekWins = weekWinStreak();

  return `
    <div class="row between">
      <h1>${hello} 🌊</h1>
      <a class="btn secondary" href="#settings" aria-label="Settings">⚙️</a>
    </div>
    <p class="sub">${niceDate(today)} · Week ${weekNumber()} of your plan</p>

    ${backupReminderHTML()}

    ${baliHTML()}

    ${fit().active ? `<a class="btn full" href="#train" style="margin-bottom:14px">▶️ Back to your workout</a>` : ""}

    ${todayFitnessHTML()}

    ${statusHomeHTML()}

    <div class="card">
      <div class="row between"><h2>Today's habits</h2><span class="pill">Phase ${phase.num}</span></div>
      ${habitsFor(today).map((h) => tickHTML(today, h)).join("")}
    </div>

    ${routinesSummaryHTML()}

    ${todaysMealsHTML()}

    ${focusHomeHTML()}

    ${healthHomeHTML()}

    <div class="card soft">
      <div class="row between">
        <h2>This week</h2>
        ${stats.win ? `<span class="pill win">Week won! 🎉</span>` : `<span class="pill">${WEEK_SUGGESTIONS[stats.mode].label} week</span>`}
      </div>
      <p><strong>${stats.summary}</strong></p>
      <p>🔥 ${streak}-day streak · 🏆 ${weekWins} week${weekWins === 1 ? "" : "s"} won in a row</p>
      ${needsComeback() ? `<p class="small">Never miss twice: anything small today keeps your streak going 💛</p>` : ""}
    </div>

    <div class="card">
      <h2>Current phase</h2>
      <p><strong>${phase.weeks}:</strong> ${esc(phase.name)}</p>
      <p class="muted">Wake-up target this week: <strong>${wakeTarget()}am</strong></p>
    </div>

    ${progressRemindersHTML()}

    ${cleaningHomeHTML()}
  `;
}

function routinesSummaryHTML() {
  const today = todayKey();
  const part = (name, items) => {
    const done = doneCount(today, items);
    return `<span class="pill ${done === items.length ? "win" : ""}">${name} ${done}/${items.length}</span>`;
  };
  return `<a class="card" href="#routines" style="display:block;text-decoration:none;color:inherit">
      <div class="row between"><h2>Routines 🌅</h2><span class="muted small">Open ›</span></div>
      <div class="row wrap" style="gap:8px">${part("Morning", MORNING)} ${part("Habits", DAILY_HABITS)} ${part("Evening", EVENING)}</div>
    </a>`;
}

// The Bali countdown, with the trip plan underneath.
function baliHTML() {
  const today = todayKey();
  const days = daysBetween(today, data.settings.baliDate);
  const end = BALI_TRIP[BALI_TRIP.length - 1].to;
  const stay = BALI_TRIP.find((s) => today >= s.from && today < s.to);
  const plan = BALI_TRIP.map((s) => `${s.place}: ${niceDate(s.from).slice(4)} to ${niceDate(s.to).slice(4)}`).join(" · ");
  let big = "🌴", line;
  if (days > 0) { big = days; line = `days to go (${Math.ceil(days / 7)} weeks)`; }
  else if (stay) line = `You're in ${stay.place}! Enjoy every second.`;
  else if (today <= end) line = "You're in Bali! Enjoy every second.";
  else line = "Hope Bali was amazing!";
  return `<div class="card ocean">
      <div class="row between">
        <div>
          <div class="muted">Bali countdown</div>
          <div class="big-number">${big}</div>
          <div>${line}</div>
        </div>
        <div style="font-size:54px">🏝️</div>
      </div>
      <p class="small" style="margin:10px 0 0;opacity:0.9">🌴 ${plan}</p>
    </div>`;
}

function backupReminderHTML() {
  const last = data.settings.lastBackup;
  const since = daysBetween(last || data.settings.createdOn, todayKey());
  if (since < (last ? 30 : 7)) return "";
  return `<div class="card warm">
      <h3>Time for a quick backup 💾</h3>
      <p class="small">${last ? `Your last backup was ${since} days ago.` : "You haven't made a backup yet."} It takes 10 seconds and keeps your progress safe.</p>
      <a class="btn full" href="#settings">Back up now</a>
    </div>`;
}

function progressRemindersHTML() {
  const today = todayKey();
  const lastM = data.measurements.map((m) => m.date).sort().pop();
  const lastP = data.photos.slice().sort().pop();
  const notes = [];
  if (!lastM || daysBetween(lastM, today) >= 14) notes.push("📏 Measurements are due (waist and hips).");
  if (!lastP || daysBetween(lastP, today) >= 30) notes.push("📸 Monthly progress photo time.");
  if (!notes.length) return "";
  return `<div class="card">
      <h2>Little check-ins</h2>
      ${notes.map((n) => `<p>${n}</p>`).join("")}
      <a class="btn secondary full" href="#fitness/progress">Open progress</a>
    </div>`;
}

// ----- Line chart -----
// Draws a simple line chart as an SVG picture.
function lineChart(sessions, goal) {
  const W = 320, H = 170, padL = 24, padR = 12, padT = 12, padB = 26;
  const values = sessions.map(chartValue);
  const top = Math.max(...values, goal || 0) * 1.08 || 10;
  const bottom = Math.min(...values) * 0.9;
  const x = (i) => padL + (sessions.length === 1 ? (W - padL - padR) / 2 : (i / (sessions.length - 1)) * (W - padL - padR));
  const y = (v) => padT + (1 - (v - bottom) / (top - bottom || 1)) * (H - padT - padB);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const first = sessions[0].date, last = sessions[sessions.length - 1].date;
  // Show the number above the first and last dots (and every dot if there are only a few).
  const labelled = (i) => values.length <= 6 || i === 0 || i === values.length - 1;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">
    <line class="axis" x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}"/>
    ${goal ? `<line class="goal" x1="${padL}" x2="${W - padR}" y1="${y(goal)}" y2="${y(goal)}"/><text x="${W - padR}" y="${y(goal) - 5}" text-anchor="end">Goal ${goal}</text>` : ""}
    <polyline class="line" points="${points}"/>
    ${values.map((v, i) => `<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="4.5"/>${labelled(i) ? `<text x="${x(i)}" y="${y(v) - 9}" text-anchor="middle">${v}</text>` : ""}`).join("")}
    <text x="${padL}" y="${H - 6}" text-anchor="middle">${niceDate(first).slice(4)}</text>
    ${last !== first ? `<text x="${W - padR}" y="${H - 6}" text-anchor="end">${niceDate(last).slice(4)}</text>` : ""}
  </svg>`;
}

// ----- Body (shown under Fitness > Progress > Body) -----
function measurementsHTML() {
  const list = data.measurements.slice().sort((a, b) => b.date.localeCompare(a.date));
  const first = list[list.length - 1];
  const next = list[0] ? addDays(list[0].date, 14) : todayKey();
  const change = (m, field) => {
    if (!first || m === first || !m[field] || !first[field]) return "";
    const diff = Math.round((m[field] - first[field]) * 10) / 10;
    return diff ? ` <span class="small muted">(${diff > 0 ? "+" : ""}${diff})</span>` : "";
  };
  return `<div class="card">
    <h2>Measurements 📏</h2>
    <p class="muted small">Every 2 weeks. Next: ${daysBetween(todayKey(), next) <= 0 ? "<strong>due now</strong>" : niceDate(next)}</p>
    <div class="row">
      <label class="field grow">Waist (cm)<input id="m-waist" type="number" inputmode="decimal" step="0.1"></label>
      <label class="field grow">Hips (cm)<input id="m-hips" type="number" inputmode="decimal" step="0.1"></label>
    </div>
    <label class="field">Weight (kg, optional)<input id="m-weight" type="number" inputmode="decimal" step="0.1"></label>
    <button class="full" data-action="save-measure">Save measurements</button>
    ${list.length ? `<ul class="list" style="margin-top:10px">${list.map((m) => `
      <li class="row between">
        <span><strong>${niceDate(m.date)}</strong><br>
          <span class="small">Waist ${m.waist ?? "-"}${change(m, "waist")} · Hips ${m.hips ?? "-"}${change(m, "hips")}${m.weight ? ` · ${m.weight}kg${change(m, "weight")}` : ""}</span></span>
        <button class="ghost" data-action="delete" data-list="measurements" data-date="${m.date}" aria-label="Delete">✕</button>
      </li>`).join("")}</ul>` : ""}
  </div>`;
}

function photoHTML() {
  const last = data.photos.slice().sort().pop();
  const tookToday = last === todayKey();
  return `<div class="card">
    <h2>Progress photo 📸</h2>
    <p class="muted small">Once a month. Photos stay in your Photos app; this just keeps track of the date.</p>
    <p>${last ? `Last photo: <strong>${niceDate(last)}</strong>. Next around ${niceDate(addDays(last, 30))}.` : "No photo logged yet."}</p>
    <button class="full ${tookToday ? "secondary" : ""}" data-action="photo">${tookToday ? "✓ Logged today" : "I took my photo today"}</button>
  </div>`;
}

function feelingsHTML() {
  const recent = data.feelings.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return `<div class="card">
    <h2>How I feel 💛</h2>
    <p class="small muted">Energy today (1 = low, 5 = great)</p>
    <div class="energy">
      ${[1, 2, 3, 4, 5].map((n) => `<button class="${feelingEnergy === n ? "on" : ""}" data-action="energy" data-n="${n}">${n}</button>`).join("")}
    </div>
    <label class="field">How are my clothes fitting?<textarea id="f-notes" placeholder="e.g. jeans feel looser around the waist"></textarea></label>
    <button class="full" data-action="save-feeling">Save</button>
    ${recent.length ? `<ul class="list" style="margin-top:10px">${recent.map((f) => `
      <li class="row between">
        <span><strong>${niceDate(f.date)}</strong> · Energy ${f.energy || "-"}/5${f.notes ? `<br><span class="small">${esc(f.notes)}</span>` : ""}</span>
        <button class="ghost" data-action="delete" data-list="feelings" data-date="${f.date}" aria-label="Delete">✕</button>
      </li>`).join("")}</ul>` : ""}
  </div>`;
}

// ----- Settings -----
function settingsScreen() {
  const s = data.settings;
  return `
    <a class="back" href="#home">‹ Home</a>
    <h1>Settings ⚙️</h1>
    <p class="sub">Your data lives only on this phone.</p>

    <div class="card">
      <h2>Dates</h2>
      <label class="field">Bali trip date<input type="date" data-setting="baliDate" value="${s.baliDate}"></label>
      <label class="field">Programme start date (week 1)<input type="date" data-setting="startDate" value="${s.startDate}"></label>
      <label class="field">Daily step goal<input type="number" inputmode="numeric" data-setting="stepGoal" value="${s.stepGoal || 8000}"></label>
      <p class="small muted">Your phase and wake-up target are worked out from the start date.</p>
    </div>

    <div class="card">
      <h2>Backup 💾</h2>
      <p class="small">${s.lastBackup ? `Last backup: <strong>${niceDate(s.lastBackup)}</strong>` : "No backup yet."} Aim for once a month. I'll remind you on the Home screen.</p>
      <button class="full" data-action="export" style="margin-bottom:10px">Export backup</button>
      <button class="full secondary" data-action="import">Import backup</button>
      <input type="file" id="import-file" accept=".json,application/json" hidden>
      <p class="small muted" style="margin-top:10px">Export saves a file of all your data. On iPhone, choose "Save to Files" (iCloud Drive is a good spot). To restore, tap Import and pick that file.</p>
    </div>

    ${targetsSettingsHTML()}

    <a class="btn secondary full" href="#health" style="margin-bottom:14px">❤️ Apple Health setup</a>

    <div class="card soft">
      <h3>Coming soon</h3>
      <p class="small">The Saves tab arrives in Stage 5.</p>
    </div>
  `;
}


// ----- Routines (Stage 2) -----
// Swaps "{wake}" in a label for this week's wake-up time.
function withWake(text, key = todayKey()) {
  return text.replace("{wake}", wakeTarget(key) + "am");
}

function checklistHTML(key, items) {
  return items.map((i) => tickHTML(key, { ...i, label: withWake(i.label, key) })).join("");
}

function doneCount(key, items) {
  return items.filter((i) => isTicked(key, i.id)).length;
}

// Finishing a whole checklist also ticks the matching habit.
function autoTicks(key) {
  if (MORNING.every((i) => isTicked(key, i.id))) setTick(key, "morning-routine", true);
  if (POSTURE_HOME.every((i) => isTicked(key, i.id))) setTick(key, "posture-routine", true);
}

function routinesScreen(sub = "today") {
  const tabs = [["today", "Today"], ["posture", "Posture"], ["sunday", "Sunday"], ["tiimo", "Tiimo"]];
  const draw = { posture: postureScreen, sunday: sundayScreen, tiimo: tiimoScreen }[sub] || routinesToday;
  return `
    <h1>Routines 🌅</h1>
    <p class="sub">Small steps, every day. Wake-up target: ${wakeTarget()}am</p>
    <nav class="subtabs">
      ${tabs.map(([id, label]) => `<a href="#routines/${id}" class="${(sub || "today") === id ? "on" : ""}">${label}</a>`).join("")}
    </nav>
    ${draw()}`;
}

function routinesToday() {
  const today = todayKey();
  const card = (title, emoji, items, doneText) => {
    const done = doneCount(today, items);
    return `<div class="card">
        <div class="row between"><h2>${title} ${emoji}</h2><span class="pill ${done === items.length ? "win" : ""}">${done}/${items.length}</span></div>
        ${checklistHTML(today, items)}
        ${done === items.length ? `<p class="saved-flag" style="margin-top:6px">${doneText}</p>` : ""}
      </div>`;
  };
  return `
    ${wakePlanHTML()}
    ${card("Morning", "☀️", MORNING, "Morning done! Great start ☀️")}
    ${card("Daily habits", "🌿", DAILY_HABITS, "Every habit ticked today. Amazing!")}
    ${card("Evening", "🌙", EVENING, "All set for tomorrow. Sleep well 🌙")}
    ${dayName(today) === "Sun" ? `<a class="btn full" href="#routines/sunday">Open Sunday reset 🧺</a>` : ""}
  `;
}

// Shows 6:45 > 6:30 > 6:15 with this week highlighted.
function wakePlanHTML() {
  const now = wakeTarget();
  const last = wakeTarget(addDays(todayKey(), -7));
  const changed = now !== last && weekNumber() > 1;
  const next = wakeTarget(addDays(todayKey(), 7));
  return `<div class="card soft">
      <h2>Wake-up plan ⏰</h2>
      <p class="small">Stepping 15 min earlier each week, for an 8am start with a 45-60 min commute.</p>
      <div class="row" style="gap:8px;margin:10px 0">
        ${WAKE_TIMES.map((t) => `<span class="pill ${t === now ? "win" : ""}" style="flex:1;text-align:center;padding:8px">${t}</span>`).join("")}
      </div>
      <p><strong>This week: ${now}am.</strong> ${next !== now ? `Next week: ${next}am.` : "You've reached your goal time. Nice!"}</p>
      ${changed ? `<p class="small">New time this week! <a href="#routines/tiimo">Update your wake-up reminder in Tiimo</a>.</p>` : ""}
    </div>`;
}

function postureScreen() {
  const today = todayKey();
  return `
    <div class="card">
      <div class="row between"><h2>5 min home routine</h2><span class="pill">${doneCount(today, POSTURE_HOME)}/${POSTURE_HOME.length}</span></div>
      <p class="muted small">For shoulders that roll forward at a desk. Gentle is fine.</p>
      ${POSTURE_HOME.map((p) => `
        ${tickHTML(today, { id: p.id, label: `${p.name} (${p.time})` })}
        <p class="small muted" style="margin:0 4px 12px">${esc(p.how)}</p>`).join("")}
      <div class="note">💛 ${UPPER_BODY_NOTE}</div>
    </div>

    <div class="card">
      <div class="row between"><h2>Work check-ins</h2><span class="pill">${doneCount(today, POSTURE_WORK)}/${POSTURE_WORK.length}</span></div>
      <p class="muted small">Tiny resets tied to things you already do.</p>
      ${POSTURE_WORK.map((p) => `
        ${tickHTML(today, { id: p.id, label: p.when })}
        <p class="small muted" style="margin:0 4px 12px">${esc(p.what)}</p>`).join("")}
    </div>`;
}

function sundayScreen() {
  const today = todayKey();
  const sunday = dayName(today) === "Sun" ? today : addDays(mondayOf(today), 6);
  const items = [...SUNDAY_RESET, { id: "sun-prep", label: "Meal prep" }];
  const done = doneCount(sunday, items);
  return `
    <div class="card">
      <div class="row between"><h2>Sunday reset 🧺</h2><span class="pill ${done === items.length ? "win" : ""}">${done}/${items.length}</span></div>
      <p class="muted small">${niceDate(sunday)} · About 10 minutes (plus meal prep). Put a couple of songs on.</p>
      ${checklistHTML(sunday, items)}
      ${done === items.length ? `<p class="saved-flag" style="margin-top:6px">Week sorted. Future you says thanks! 🎉</p>` : ""}
    </div>`;
}

// The Tiimo list. Ticking "Added to Tiimo" is remembered (not daily).
// For the wake-up reminder we remember the time, so it un-ticks when the time changes.
function tiimoText(t) {
  return `${t.title}: ${withWake(t.time)} (${t.days})`;
}

function tiimoScreen() {
  const now = wakeTarget() + "am";
  return `
    <p class="muted">Tiimo does your reminders and visual schedule. Add each of these once, then tick it off here.</p>
    ${TIIMO.map((t) => {
      const saved = data.tiimoAdded[t.id];
      const added = t.id === "t-wake" ? saved === now : !!saved;
      const outdated = t.id === "t-wake" && saved && saved !== now;
      return `<div class="card">
          <div class="row between"><h3>${esc(t.title)}</h3><span class="pill">${esc(withWake(t.time))}</span></div>
          <p class="muted small">${esc(t.days)}</p>
          ${outdated ? `<div class="note">Time changed! Update it in Tiimo from ${esc(saved)} to ${now}.</div>` : ""}
          <button class="tick ${added ? "on" : ""}" data-action="tiimo" data-id="${t.id}" aria-pressed="${added}">
            <span class="box"></span><span class="label">${added ? "Added to Tiimo" : "Tick when added to Tiimo"}</span>
          </button>
        </div>`;
    }).join("")}
    <button class="full secondary" data-action="copy-tiimo">📋 Copy list as text</button>
    <p class="small muted" style="margin-top:10px">Want different times? Tell me and I'll change them, or edit the TIIMO list in data.js.</p>
  `;
}

// Copies text so you can paste it into another app (like Minimalist).
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const box = document.createElement("textarea");
    box.value = text;
    document.body.appendChild(box);
    box.select();
    document.execCommand("copy");
    box.remove();
  }
  toast("Copied! Ready to paste 📋");
}


// ---------- 7. Buttons ----------
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}
function cheer() { return CHEERS[Math.floor(Math.random() * CHEERS.length)]; }

const ACTIONS = {
  tick({ date, id }) {
    const on = !isTicked(date, id);
    setTick(date, id, on);
    if (on) autoTicks(date);
    render();
  },

  "save-measure"() {
    const num = (id) => { const v = parseFloat(document.getElementById(id).value); return isNaN(v) ? null : v; };
    const m = { date: todayKey(), waist: num("m-waist"), hips: num("m-hips"), weight: num("m-weight") };
    if (m.waist === null && m.hips === null && m.weight === null) return toast("Pop in at least one number first.");
    data.measurements = data.measurements.filter((x) => x.date !== m.date);
    data.measurements.push(m);
    saveData();
    toast("Measurements saved 📏");
    render();
  },

  photo() {
    if (!data.photos.includes(todayKey())) data.photos.push(todayKey());
    saveData();
    toast("Photo logged 📸");
    render();
  },

  energy({ n }) {
    const notes = document.getElementById("f-notes").value;
    feelingEnergy = Number(n);
    render();
    document.getElementById("f-notes").value = notes;
  },

  "save-feeling"() {
    const notes = document.getElementById("f-notes").value.trim();
    if (!feelingEnergy && !notes) return toast("Pick an energy number or add a note.");
    data.feelings = data.feelings.filter((f) => f.date !== todayKey());
    data.feelings.push({ date: todayKey(), energy: feelingEnergy, notes });
    feelingEnergy = null;
    saveData();
    toast("Saved. Thanks for checking in 💛");
    render();
  },

  delete({ list, date }) {
    if (!confirm("Delete this entry?")) return;
    data[list] = data[list].filter((x) => x.date !== date);
    saveData();
    render();
  },

  tiimo({ id }) {
    if (data.tiimoAdded[id] && !(id === "t-wake" && data.tiimoAdded[id] !== wakeTarget() + "am")) delete data.tiimoAdded[id];
    else data.tiimoAdded[id] = id === "t-wake" ? wakeTarget() + "am" : true;
    saveData();
    render();
  },

  "copy-tiimo"() { copyText(TIIMO.map(tiimoText).join("\n")); },

  export() { exportBackup(); },
  import() { document.getElementById("import-file").click(); }
};

// One listener for every button: it reads data-action and runs the match above.
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || !ACTIONS[el.dataset.action]) return;
  e.preventDefault();
  ACTIONS[el.dataset.action](el.dataset, el);
});

// Dropdowns, date boxes and the import file picker.
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.setting && el.value) {
    data.settings[el.dataset.setting] = el.value;
    saveData();
    toast("Saved ✓");
  }
  if (el.id === "import-file" && el.files[0]) importBackup(el.files[0]);
});

window.addEventListener("hashchange", () => { window.scrollTo(0, 0); render(); });


// ---------- 8. Backup ----------
async function exportBackup() {
  const name = `life-hub-backup-${todayKey()}.json`;
  const file = new File([JSON.stringify(data, null, 2)], name, { type: "application/json" });
  try {
    // On iPhone this opens the Share sheet so you can "Save to Files".
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Life Hub backup" });
    } else {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    }
    data.settings.lastBackup = todayKey();
    saveData();
    toast("Backup ready 💾");
    render();
  } catch (err) {
    if (err.name !== "AbortError") toast("Couldn't make the backup. Try again?");
  }
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = JSON.parse(reader.result);
      if (!incoming || !incoming.settings || !incoming.ticks) throw new Error("not a backup");
      if (!confirm("Replace the data on this phone with this backup?")) return;
      localStorage.setItem(STORE_KEY, JSON.stringify(incoming));
      data = loadData();
      saveData();
      toast("Backup restored ✓");
      render();
    } catch (e) {
      toast("That file doesn't look like a Life Hub backup.");
    }
  };
  reader.readAsText(file);
  document.getElementById("import-file").value = "";
}


// ---------- 9. Start the app ----------
// Waits until every file (fitness.js, meals.js ...) has loaded, then draws the screen.
document.addEventListener("DOMContentLoaded", render);

// Save the app files for offline use (only works once it's online at a real web address).
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js");
}
