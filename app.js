// =====================================================================
// LIFE HUB: the app's logic
// Sections:
//   1. Saving and loading your data (stays on your phone)
//   2. Date helpers
//   3. Your programme (week number, Tiimo wake-up time)
//   4. Ticks (kept for older saved data)
//   5. Line chart (used by the Train charts)
//   6. Screens (icons, Home widgets, More, Body, Settings, Tiimo)
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

// This week's wake-up target for Tiimo: 6:45, then 6:30, then 6:15 and stays there.
function wakeTarget(key = todayKey()) {
  return WAKE_TIMES[Math.min(weekNumber(key) - 1, WAKE_TIMES.length - 1)];
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

// Simple line icons (drawn as SVG so they stay crisp at any size).
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  dumbbell: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 4-3 7h3"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  arrow: '<path d="M7 17L17 7M9 7h8v8"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  sponge: '<rect x="4" y="8" width="16" height="10" rx="3"/><path d="M8 8V6M12 8V5M16 8V6"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  house: '<path d="M4 10l8-6 8 6v10H4z"/><path d="M10 20v-6h4v6"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7"/>',
  run: '<circle cx="13" cy="4" r="2"/><path d="M10 21l2-6-3-3 2-4 3 3h3M8 12l-2 3"/>',
  wave: '<path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M7 11c0-4 3-7 7-7"/>',
  lotus: '<path d="M12 20c-4 0-8-2-9-6 3 0 6 1 9 4 3-3 6-4 9-4-1 4-5 6-9 6zM12 18c-2-3-2-8 0-12 2 4 2 9 0 12z"/>',
  posture: '<circle cx="12" cy="4" r="2"/><path d="M12 7v7M8 10l4-1 4 1M10 21l2-7 2 7"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  heart: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
  cart: '<path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  palm: '<path d="M12 22c0-6 1-10 3-13M15 9c-2-3-6-3-9-1 3 0 5 1 7 3M15 9c1-3 5-4 7-2-3 0-5 1-6 3M15 9c2-1 5 0 6 3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  drag: '<circle cx="9" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="17" r="1.2"/><circle cx="15" cy="17" r="1.2"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  save: '<path d="M5 4h11l3 3v13H5zM8 4v5h8M8 20v-6h8v6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>'
};
function icon(name, cls = "") {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.more}</svg>`;
}

// A big two-line headline, like "Let's make / today count".
function headline(light, bold) {
  return `<h1 class="head">${light}<b>${bold}</b></h1>`;
}

// The top bar used on every main screen: a back button or a caption, and round buttons.
function topBar(left, right = "") {
  return `<div class="topbar">${left}<div class="row" style="gap:8px">${right}</div></div>`;
}
function backBtn(href, label = "Back") {
  return `<a class="circ" href="${href}" aria-label="${label}">${icon("back")}</a>`;
}

let feelingEnergy = null;
let homeEdit = false;      // Home edit mode (remove, reorder, add widgets)
let quickOpen = false;     // the + menu

const SCREENS = {
  home: homeScreen,
  more: moreScreen,
  settings: settingsScreen,
  tiimo: tiimoScreen
};

function render() {
  const [screen, ...rest] = (location.hash.slice(1) || "home").split("/");
  const draw = SCREENS[screen] || homeScreen;
  document.getElementById("app").innerHTML = draw(...rest) + (quickOpen ? quickAddHTML() : "");
  // Screens that live under another tab (a workout is part of Train, etc.)
  const parentTab = { session: "fitness", tpl: "fitness", ex: "fitness", pickex: "fitness", train: "fitness", wlog: "fitness",
    recipe: "meals", pick: "meals", settings: "more", health: "more", house: "more", tiimo: "more" };
  const tab = parentTab[screen] || (SCREENS[screen] ? screen : "home");
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
  // Keep the chosen chip in view when a chip row is wider than the screen.
  document.querySelectorAll(".tabs-chips").forEach((row) => {
    const on = row.querySelector(".on");
    if (on) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
  });
}

// ----- Home -----
// Home is made of widgets you choose. Each widget is a small function that returns a card.
const WIDGETS = {
  next:   { name: "Up next", icon: "dumbbell", html: () => upNextHTML() },
  week:   { name: "This week", icon: "chart", html: () => weekWidgetHTML() },
  status: { name: "On track check", icon: "check", html: () => statusHomeHTML() },
  clean:  { name: "Cleaning due", icon: "sponge", html: () => cleaningHomeHTML() },
  meals:  { name: "Today's meals", icon: "food", html: () => todaysMealsHTML() },
  shop:   { name: "Shopping list", icon: "cart", html: () => shoppingWidgetHTML() },
  bali:   { name: "Bali countdown", icon: "palm", html: () => baliHTML() },
  health: { name: "Steps & Health", icon: "heart", html: () => healthHomeHTML() }
};
const DEFAULT_HOME = ["next", "week", "status", "clean", "meals"];
function homeWidgets() {
  return (data.settings.home || DEFAULT_HOME).filter((id) => WIDGETS[id]);
}

function homeScreen() {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const d = fromKey(todayKey());
  const longDate = `${d.toLocaleDateString("en-AU", { weekday: "long" })} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const ids = homeWidgets();
  const hidden = Object.keys(WIDGETS).filter((id) => !ids.includes(id));
  return `
    ${topBar(`<div class="hi">${longDate}<b>${hello}</b></div>`,
      `<button class="circ dark" data-action="quick-open" aria-label="Add">${icon("plus")}</button>
       <a class="circ" href="#settings" aria-label="Settings">${icon("gear")}</a>`)}
    ${homeEdit ? headline("Edit", "your widgets") : headline("Let's make", "today count")}
    ${homeEdit ? "" : backupReminderHTML()}
    ${fit().active && !homeEdit ? `<a class="btn full dark" href="#train" style="margin-bottom:12px">${icon("play")} Back to your workout</a>` : ""}
    ${ids.map((id, i) => homeEdit ? `<div class="w-edit">
        <div class="w-edit-bar"><span class="row" style="gap:8px">${icon(WIDGETS[id].icon)}<strong>${WIDGETS[id].name}</strong></span>
          <span class="row" style="gap:4px">
            <button class="circ sm" data-action="w-move" data-id="${id}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Move up">${icon("up")}</button>
            <button class="circ sm" data-action="w-move" data-id="${id}" data-dir="1" ${i === ids.length - 1 ? "disabled" : ""} aria-label="Move down">${icon("down")}</button>
            <button class="circ sm warn" data-action="w-remove" data-id="${id}" aria-label="Remove">${icon("x")}</button>
          </span></div>
      </div>` : WIDGETS[id].html()).join("")}
    ${homeEdit ? `${hidden.length ? `<p class="label">Add a widget</p><div class="card list-card">${hidden.map((id) =>
        `<button class="li" data-action="w-add" data-id="${id}">${icon(WIDGETS[id].icon)}<span class="grow">${WIDGETS[id].name}</span>${icon("plus", "accent")}</button>`).join("")}</div>` : ""}
      <button class="full dark" data-action="home-edit">Done</button>`
      : `<button class="link-btn" data-action="home-edit">${icon("edit")} Edit Home</button>`}
  `;
}

// The dark summary card: this week's workouts, steps and Bali.
function weekWidgetHTML() {
  const monday = mondayOf(todayKey());
  const s = weekScore(monday);
  const target = s.mode === "busy" ? 2 : s.mode === "light" ? 2 : fit().targets.strength;
  const doneN = s.mode === "light" ? s.total : s.strength;
  const pct = Math.min(1, doneN / Math.max(1, target));
  const C = 2 * Math.PI * 32;
  const h = (data.health || {})[todayKey()];
  const bali = daysBetween(todayKey(), data.settings.baliDate);
  return `<div class="dark-card">
      <svg viewBox="0 0 80 80" class="ring" aria-hidden="true"><circle cx="40" cy="40" r="32" class="ring-bg"/><circle cx="40" cy="40" r="32" class="ring-fg" stroke-dasharray="${pct * C} ${C}" transform="rotate(-90 40 40)"/>
        <text x="40" y="46" text-anchor="middle">${doneN}/${target}</text></svg>
      <div class="stats">
        <div class="lbl">${WEEK_SUGGESTIONS[s.mode].label} week${s.win ? " · won" : ""}</div>
        <div><span>${s.mode === "light" ? "Sessions" : "Workouts"}</span><b>${doneN} of ${target}</b></div>
        <div><span>Steps today</span><b>${h && h.steps ? Number(h.steps).toLocaleString() : "-"}</b></div>
        <div><span>Bali</span><b>${bali > 0 ? `${bali} days` : "Now!"}</b></div>
      </div>
    </div>`;
}

function shoppingWidgetHTML() {
  const monday = planMonday();
  const state = shopState(monday);
  const items = shoppingItems(monday).filter((i) => !state.checked[i.key]);
  return `<details class="card drop-card">
      <summary class="li">${icon("cart", "tile")}<span class="grow">Shopping list</span><span class="num">${items.length}</span>${icon("down", "chev")}</summary>
      <div class="drop-body small">${items.slice(0, 8).map((i) => esc(i.text)).join("<br>") || "All done"}${items.length > 8 ? `<br><span class="muted">+${items.length - 8} more</span>` : ""}
        <div class="row" style="margin-top:10px;gap:8px"><a class="btn sm" href="#meals/shop">Open</a><button class="sm ghost" data-action="copy-shop">Copy as text</button></div></div>
    </details>`;
}

// The Bali countdown, with the trip plan underneath.
function baliHTML() {
  const today = todayKey();
  const days = daysBetween(today, data.settings.baliDate);
  const end = BALI_TRIP[BALI_TRIP.length - 1].to;
  const stay = BALI_TRIP.find((s) => today >= s.from && today < s.to);
  const plan = BALI_TRIP.map((s) => `${s.place} ${niceDate(s.from).slice(4)} to ${niceDate(s.to).slice(4)}`).join(" · ");
  let big = "", line;
  if (days > 0) { big = days; line = `days to Bali`; }
  else if (stay) line = `You're in ${stay.place}. Enjoy every second.`;
  else if (today <= end) line = "You're in Bali. Enjoy every second.";
  else line = "Hope Bali was amazing.";
  return `<div class="card bali-card">
      <div><div class="label" style="margin:0">${icon("palm")} Bali</div>
        ${big ? `<div class="big-number">${big}</div>` : ""}<div class="small">${line}</div></div>
      <p class="small muted" style="margin:8px 0 0">${plan}</p>
    </div>`;
}

function backupReminderHTML() {
  const last = data.settings.lastBackup;
  const since = daysBetween(last || data.settings.createdOn, todayKey());
  if (since < (last ? 30 : 7)) return "";
  return `<div class="card notice">
      <div class="grow"><strong>Time for a backup</strong><div class="small muted">${last ? `Last one ${since} days ago.` : "You haven't made one yet."}</div></div>
      <a class="btn sm dark" href="#settings">Back up</a>
    </div>`;
}

// The + menu: quick ways to log or add something.
function quickAddHTML() {
  const today = todayKey();
  const items = [
    ["dumbbell", "Log a session today", `#session/new/${today}`],
    ["calendar", "Plan my week", "#fitness/plan"],
    ["heart", "Paste from Health", null, "health-paste"],
    ["cart", "Add to shopping list", "#meals/shop"],
    ["sponge", "Add a cleaning job", "#house/edit"]
  ];
  return `<div class="overlay" data-action="quick-close"></div>
    <div class="sheet">
      <div class="grab"></div>
      ${items.map(([ic, label, href, action]) => href
        ? `<a class="li" href="${href}" data-action="quick-close">${icon(ic, "tile")}<span class="grow">${label}</span>${icon("chev", "chev")}</a>`
        : `<button class="li" data-action="${action}">${icon(ic, "tile")}<span class="grow">${label}</span>${icon("chev", "chev")}</button>`).join("")}
    </div>`;
}

// ----- More -----
function moreScreen() {
  const due = dueChores().length;
  const row = (href, ic, label, meta = "") => `<a class="li" href="${href}">${icon(ic, "tile")}<span class="grow">${label}</span>${meta ? `<span class="meta">${meta}</span>` : ""}${icon("chev", "chev")}</a>`;
  return `
    ${headline("Everything", "else")}
    <div class="card list-card">
      ${row("#house", "sponge", "House", due ? `${due} due` : "All good")}
      ${row("#fitness/progress/body", "chart", "Body & measurements")}
      ${row("#health", "heart", "Apple Health")}
      ${row("#tiimo", "bell", "Tiimo reminders")}
    </div>
    <div class="card list-card">
      ${row("#settings", "gear", "Settings & backup")}
      <button class="li" data-action="home-edit-go">${icon("edit", "tile")}<span class="grow">Edit Home widgets</span>${icon("chev", "chev")}</button>
    </div>
  `;
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
    <h2>Measurements</h2>
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
        <button class="ghost" data-action="delete" data-list="measurements" data-date="${m.date}" aria-label="Delete">${icon("x")}</button>
      </li>`).join("")}</ul>` : ""}
  </div>`;
}

function photoHTML() {
  const last = data.photos.slice().sort().pop();
  const tookToday = last === todayKey();
  return `<div class="card">
    <h2>Progress photo</h2>
    <p class="muted small">Once a month. Photos stay in your Photos app; this just keeps track of the date.</p>
    <p>${last ? `Last photo: <strong>${niceDate(last)}</strong>. Next around ${niceDate(addDays(last, 30))}.` : "No photo logged yet."}</p>
    <button class="full ${tookToday ? "secondary" : ""}" data-action="photo">${tookToday ? "Logged today" : "I took my photo today"}</button>
  </div>`;
}

function feelingsHTML() {
  const recent = data.feelings.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return `<div class="card">
    <h2>How I feel</h2>
    <p class="small muted">Energy today (1 = low, 5 = great)</p>
    <div class="energy">
      ${[1, 2, 3, 4, 5].map((n) => `<button class="${feelingEnergy === n ? "on" : ""}" data-action="energy" data-n="${n}">${n}</button>`).join("")}
    </div>
    <label class="field">How are my clothes fitting?<textarea id="f-notes" placeholder="e.g. jeans feel looser around the waist"></textarea></label>
    <button class="full" data-action="save-feeling">Save</button>
    ${recent.length ? `<ul class="list" style="margin-top:10px">${recent.map((f) => `
      <li class="row between">
        <span><strong>${niceDate(f.date)}</strong> · Energy ${f.energy || "-"}/5${f.notes ? `<br><span class="small">${esc(f.notes)}</span>` : ""}</span>
        <button class="ghost" data-action="delete" data-list="feelings" data-date="${f.date}" aria-label="Delete">${icon("x")}</button>
      </li>`).join("")}</ul>` : ""}
  </div>`;
}

// ----- Settings -----
function settingsScreen() {
  const s = data.settings;
  return `
    ${topBar(backBtn("#more"))}
    ${headline("Settings", "& backup")}

    <div class="card">
      <p class="label" style="margin-top:0">Backup</p>
      <p class="small">${s.lastBackup ? `Last backup: <strong>${niceDate(s.lastBackup)}</strong>.` : "No backup yet."} Once a month is plenty. Home reminds you.</p>
      <div class="row" style="gap:8px">
        <button class="grow dark" data-action="export">${icon("save")} Export</button>
        <button class="grow" data-action="import">Import</button>
      </div>
      <input type="file" id="import-file" accept=".json,application/json" hidden>
      <p class="small muted" style="margin:10px 0 0">Export, then "Save to Files" (iCloud Drive is a good spot). To restore, tap Import and pick that file.</p>
    </div>

    <div class="card">
      <p class="label" style="margin-top:0">Dates</p>
      <label class="field">Bali trip date<input type="date" data-setting="baliDate" value="${s.baliDate}"></label>
      <label class="field">Programme start (for Tiimo wake-up times)<input type="date" data-setting="startDate" value="${s.startDate}"></label>
      <label class="field" style="margin-bottom:0">Daily step goal<input type="number" inputmode="numeric" data-setting="stepGoal" value="${s.stepGoal || 8000}"></label>
    </div>

    ${targetsSettingsHTML()}
  `;
}

// The Tiimo list. Ticking "Added to Tiimo" is remembered (not daily).
// For the wake-up reminder we remember the time, so it un-ticks when the time changes.
function withWake(text, key = todayKey()) {
  return text.replace("{wake}", wakeTarget(key) + "am");
}
function tiimoText(t) {
  return `${t.title}: ${withWake(t.time)} (${t.days})`;
}

function tiimoScreen() {
  const now = wakeTarget() + "am";
  return `
    ${topBar(backBtn("#more"))}
    ${headline("Tiimo", "reminders")}
    <p class="sub">Set these up in Tiimo once. Tap one when it's in.</p>
    <div class="card list-card">
    ${TIIMO.map((t) => {
      const saved = data.tiimoAdded[t.id];
      const added = t.id === "t-wake" ? saved === now : !!saved;
      const outdated = t.id === "t-wake" && saved && saved !== now;
      return `<button class="li" data-action="tiimo" data-id="${t.id}">
          <span class="circle-tick ${added ? "on" : ""}">${added ? icon("check") : ""}</span>
          <span class="grow">${esc(t.title)}<span class="small muted block">${esc(t.days)}${outdated ? ` · update to ${now}` : ""}</span></span>
          <span class="tag">${esc(withWake(t.time))}</span>
        </button>`;
    }).join("")}
    </div>
    <button class="full" data-action="copy-tiimo">Copy list as text</button>
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
  toast("Copied. Ready to paste");
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
  "quick-open"() { quickOpen = true; render(); },
  "quick-close"(d, el) {
    quickOpen = false;
    if (el && el.getAttribute("href")) location.hash = el.getAttribute("href"); else render();
  },

  "home-edit"() { homeEdit = !homeEdit; window.scrollTo(0, 0); render(); },
  "home-edit-go"() { homeEdit = true; location.hash = "#home"; render(); },
  "w-move"({ id, dir }) {
    const list = homeWidgets();
    const i = list.indexOf(id), j = i + Number(dir);
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    data.settings.home = list;
    saveData();
    render();
  },
  "w-remove"({ id }) { data.settings.home = homeWidgets().filter((x) => x !== id); saveData(); render(); },
  "w-add"({ id }) { data.settings.home = [...homeWidgets(), id]; saveData(); render(); },

  "save-measure"() {
    const num = (id) => { const v = parseFloat(document.getElementById(id).value); return isNaN(v) ? null : v; };
    const m = { date: todayKey(), waist: num("m-waist"), hips: num("m-hips"), weight: num("m-weight") };
    if (m.waist === null && m.hips === null && m.weight === null) return toast("Pop in at least one number first.");
    data.measurements = data.measurements.filter((x) => x.date !== m.date);
    data.measurements.push(m);
    saveData();
    toast("Measurements saved");
    render();
  },

  photo() {
    if (!data.photos.includes(todayKey())) data.photos.push(todayKey());
    saveData();
    toast("Photo logged");
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
    toast("Saved. Thanks for checking in");
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
    toast("Saved");
  }
  if (el.id === "import-file" && el.files[0]) importBackup(el.files[0]);
});

window.addEventListener("hashchange", () => { quickOpen = false; window.scrollTo(0, 0); render(); });


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
    toast("Backup ready");
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
      toast("Backup restored");
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
