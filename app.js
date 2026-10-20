// =====================================================================
// LIFE HUB: the app's logic
// Sections:
//   1. Saving and loading your data (stays on your phone)
//   2. Date helpers
//   3. Your programme: weeks, phases, habits, wake-up time
//   4. Ticks, weekly score and streaks
//   5. Strength log helpers
//   6. Screens (Home, Fitness, Workout, Progress, Settings, Routines)
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
    focus: { sessions: [], running: null }  // finished sprints [ { date, mins } ] + the sprint in progress
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

function planFor(key) {
  return WEEK_PLAN.find((p) => p.day === dayName(key));
}


// ---------- 4. Ticks, weekly score and streaks ----------
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

// What kind of thing a tick is (gym, surf, home ...), so we can count it.
function kindOf(id) {
  if (id === LOW_ENERGY.id) return "low";
  if (id.startsWith("extra-")) return id === "extra-home" ? "home" : "gym";
  for (const p of WEEK_PLAN) {
    const item = p.items.find((i) => i.id === id);
    if (item) return item.kind;
  }
  return "habit";
}

const WORKOUT_KINDS = ["gym", "surf", "home", "run", "light", "low"];

// Works out the score for the week starting on the given Monday.
function weekStats(monday) {
  let workoutDays = 0, gymDays = 0, surfHomeDays = 0;
  for (let i = 0; i < 7; i++) {
    const kinds = Object.keys(data.ticks[addDays(monday, i)] || {}).map(kindOf);
    if (kinds.some((k) => WORKOUT_KINDS.includes(k))) workoutDays++;
    if (kinds.includes("gym")) gymDays++;
    if (kinds.some((k) => ["surf", "home", "low"].includes(k))) surfHomeDays++;
  }
  const mode = data.weekModes[monday] || "normal";
  const win = mode === "minimum"
    ? gymDays >= 2 && surfHomeDays >= 1
    : workoutDays >= 3;
  const summary = mode === "minimum"
    ? `${Math.min(gymDays, 2)}/2 gym + ${Math.min(surfHomeDays, 1)}/1 surf or home`
    : `${workoutDays}/3 workouts`;
  return { workoutDays, gymDays, surfHomeDays, mode, win, summary };
}

// "Never miss twice" streak: counts the days you did something.
// One missed day is fine. Only two missed days in a row ends the streak.
// Today doesn't count against you until it's over.
function dayStreak() {
  const start = data.settings.startDate;
  let streak = 0, missedInARow = 0;
  let key = todayKey();
  if (!data.ticks[key]) key = addDays(key, -1);
  while (daysBetween(start, key) >= 0) {
    if (data.ticks[key]) { streak++; missedInARow = 0; }
    else if (++missedInARow >= 2) break;
    key = addDays(key, -1);
  }
  return streak;
}

// True when yesterday was missed and today isn't ticked yet.
function needsComeback() {
  const y = addDays(todayKey(), -1);
  return daysBetween(data.settings.startDate, y) >= 0 && !data.ticks[y] && !data.ticks[todayKey()];
}

// How many weeks in a row you've hit your weekly goal.
function weekWinStreak() {
  const thisMonday = mondayOf(todayKey());
  let count = weekStats(thisMonday).win ? 1 : 0;
  let monday = addDays(thisMonday, -7);
  while (daysBetween(mondayOf(data.settings.startDate), monday) >= 0 && weekStats(monday).win) {
    count++;
    monday = addDays(monday, -7);
  }
  return count;
}


// ---------- 5. Strength log helpers ----------
const ALL_EXERCISES = Object.values(WORKOUTS).flatMap((w) => w.exercises || []);
function findExercise(id) { return ALL_EXERCISES.find((e) => e.id === id); }

function history(exId) {
  return (data.log[exId] || []).slice().sort((a, b) => a.date.localeCompare(b.date));
}

// The last session before today (so today's numbers don't hide it).
function lastSession(exId) {
  const past = history(exId).filter((s) => s.date < todayKey());
  return past[past.length - 1];
}
function todaysSession(exId) {
  return history(exId).find((s) => s.date === todayKey());
}

function hitAllReps(ex, session) {
  return session.reps.length >= ex.sets && session.reps.every((r) => r >= ex.reps);
}

// Suggest going up when the last 2 sessions hit every rep at the same weight.
function weightSuggestion(ex) {
  const h = history(ex.id);
  if (h.length < 2 || !ex.unit) return null;
  const [a, b] = h.slice(-2);
  if (!b.weight || a.weight !== b.weight || !hitAllReps(ex, a) || !hitAllReps(ex, b)) return null;
  return b.weight + (ex.step || 2.5);
}

function bestWeight(exId) {
  return Math.max(0, ...history(exId).map((s) => s.weight || 0));
}

// What we chart: the weight, or the best reps if there's no weight.
function chartValue(s) {
  return s.weight || Math.max(0, ...s.reps);
}

// Numbers you've typed on the workout screen but not saved yet.
let drafts = {};
let draftsDay = todayKey();
function draftFor(ex) {
  if (draftsDay !== todayKey()) { drafts = {}; draftsDay = todayKey(); }
  if (!drafts[ex.id]) {
    const t = todaysSession(ex.id), last = lastSession(ex.id);
    drafts[ex.id] = {
      weight: t ? t.weight : last ? last.weight : "",
      reps: t ? t.reps.slice() : Array(ex.sets).fill(ex.reps)
    };
  }
  return drafts[ex.id];
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

// A tick plus an "Open" button for items that have a workout to open.
function planItemHTML(key, item) {
  if (!item.workout) return tickHTML(key, item);
  return `<div class="row">${tickHTML(key, item)}
    <a class="btn secondary" href="#workout/${item.workout}">Open</a></div>`;
}

let weekOffset = 0;          // 0 = this week, -1 = last week ...
let chartExercise = "leg-press";
let feelingEnergy = null;

const SCREENS = {
  home: homeScreen,
  fitness: fitnessScreen,
  workout: workoutScreen,
  routines: routinesScreen,
  settings: settingsScreen
};

function render() {
  const [screen, ...rest] = (location.hash.slice(1) || "home").split("/");
  const draw = SCREENS[screen] || homeScreen;
  document.getElementById("app").innerHTML = draw(...rest);
  // Screens that live under another tab (a workout is part of Fitness, etc.)
  const parentTab = { workout: "fitness", recipe: "meals", pick: "meals", settings: "home" };
  const tab = parentTab[screen] || (SCREENS[screen] ? screen : "home");
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
}

// ----- Home -----
function homeScreen() {
  const today = todayKey();
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const phase = PHASES[phaseIndex()];
  const plan = planFor(today);
  const stats = weekStats(mondayOf(today));
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

    <div class="card">
      <div class="row between"><h2>Today's workout</h2><span class="pill">${plan.day}</span></div>
      <p class="muted">${esc(plan.title)}</p>
      ${plan.items.map((i) => planItemHTML(today, i)).join("")}
      ${tickHTML(today, LOW_ENERGY)}
    </div>

    <div class="card">
      <div class="row between"><h2>Today's habits</h2><span class="pill">Phase ${phase.num}</span></div>
      ${habitsFor(today).map((h) => tickHTML(today, h)).join("")}
    </div>

    ${routinesSummaryHTML()}

    ${todaysMealsHTML()}

    ${focusHomeHTML()}

    <div class="card soft">
      <div class="row between">
        <h2>This week</h2>
        ${stats.win ? `<span class="pill win">Week won! 🎉</span>` : `<span class="pill">${stats.mode === "minimum" ? "Minimum week" : "Normal week"}</span>`}
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

// ----- Fitness -----
function fitnessScreen(sub = "week") {
  const tabs = [["week", "This week"], ["workouts", "Workouts"], ["progress", "Progress"]];
  const body = sub === "workouts" ? workoutsList() : sub === "progress" ? progressScreen() : weekScreen();
  return `
    <h1>Fitness 💪</h1>
    <p class="sub">Week ${weekNumber()} · Phase ${PHASES[phaseIndex()].num}</p>
    <nav class="subtabs">
      ${tabs.map(([id, label]) => `<a href="#fitness/${id}" class="${(sub || "week") === id ? "on" : ""}">${label}</a>`).join("")}
    </nav>
    ${body}`;
}

function weekScreen() {
  const today = todayKey();
  const monday = addDays(mondayOf(today), weekOffset * 7);
  const stats = weekStats(monday);
  const label = weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : weekOffset === 1 ? "Next week" : `Week of ${niceDate(monday)}`;

  const days = [];
  for (let i = 0; i < 7; i++) {
    const key = addDays(monday, i);
    const plan = planFor(key);
    days.push(`
      <div class="card ${key === today ? "today" : ""}">
        <div class="row between">
          <h3>${niceDate(key)}${key === today ? " · Today" : ""}</h3>
        </div>
        <p class="muted small">${esc(plan.title)}</p>
        ${plan.items.map((item) => planItemHTML(key, item)).join("")}
        ${tickHTML(key, LOW_ENERGY)}
      </div>`);
  }

  return `
    <div class="row between">
      <button class="ghost" data-action="week" data-step="-1" aria-label="Previous week">‹ Prev</button>
      <button class="ghost" data-action="week" data-step="0"><strong>${label}</strong></button>
      <button class="ghost" data-action="week" data-step="1" aria-label="Next week">Next ›</button>
    </div>

    <div class="seg" role="group" aria-label="Week type">
      <button class="${stats.mode === "normal" ? "on" : ""}" data-action="mode" data-monday="${monday}" data-mode="normal">Normal week</button>
      <button class="${stats.mode === "minimum" ? "on" : ""}" data-action="mode" data-monday="${monday}" data-mode="minimum">Minimum week</button>
    </div>

    <div class="card soft">
      <div class="row between">
        <strong>${stats.summary}</strong>
        ${stats.win ? `<span class="pill win">Win! 🎉</span>` : ""}
      </div>
      <p class="small muted" style="margin-top:6px">
        ${stats.mode === "minimum"
          ? "Busy week? 2 gym sessions + 1 surf or home session is still a win."
          : "Aim for 3 workouts. Low-energy yoga or Pilates counts too."}
      </p>
    </div>

    ${days.join("")}
  `;
}

function workoutsList() {
  return `
    <p class="muted">5 min warm-up first. Rest 60-90 sec between sets.</p>
    ${Object.entries(WORKOUTS).map(([key, w]) => {
      const ids = (w.exercises || []).map((e) => e.id);
      const dates = ids.flatMap((id) => history(id).map((s) => s.date)).sort();
      const last = dates.pop();
      return `<a class="card" href="#workout/${key}" style="display:block;text-decoration:none;color:inherit">
          <div class="row between"><h3>${esc(w.name)}</h3><span class="pill">${w.day}</span></div>
          <p class="muted small">${w.length}${last ? ` · Last logged ${niceDate(last)}` : ""}</p>
        </a>`;
    }).join("")}
  `;
}

// ----- One workout -----
function workoutScreen(key) {
  const w = WORKOUTS[key];
  if (!w) return `<a class="back" href="#fitness/workouts">‹ Workouts</a><p>Workout not found.</p>`;
  const body = w.blocks ? homeSessionHTML(key, w) : w.exercises.map(exerciseHTML).join("");
  return `
    <a class="back" href="#fitness/workouts">‹ Workouts</a>
    <h1>${esc(w.name)}</h1>
    <p class="sub">${w.day} · ${w.length} · 5 min warm-up · rest 60-90 sec</p>
    ${w.kit ? `<p class="muted small">You'll need: ${esc(w.kit)}</p>` : ""}
    ${body}
    <button class="full" data-action="workout-done" data-workout="${key}">${doneTodayLabel(key)}</button>
  `;
}

function homeSessionHTML(key, w) {
  const today = todayKey();
  return w.blocks.map((b) => `
    <div class="card">
      ${tickHTML(today, { id: b.id, label: `${b.name} (${b.mins} min)` })}
      <p class="muted small">${esc(b.moves)}</p>
      ${b.upper ? `<div class="note">💛 ${UPPER_BODY_NOTE}</div>` : ""}
    </div>`).join("");
}

function exerciseHTML(ex) {
  const d = draftFor(ex);
  const last = lastSession(ex.id);
  const saved = todaysSession(ex.id);
  const suggestion = weightSuggestion(ex);
  const repWord = ex.repsLabel || "reps";
  return `
    <div class="card exercise">
      <div class="row between">
        <h3>${esc(ex.name)}</h3>
        <span class="pill">${ex.sets} x ${ex.reps}${ex.repsLabel ? " " + ex.repsLabel : ""}</span>
      </div>
      ${ex.note ? `<p class="muted small">${esc(ex.note)}</p>` : ""}
      ${ex.upper ? `<div class="note">💛 ${UPPER_BODY_NOTE}</div>` : ""}
      <p class="last">${last ? `Last time (${niceDate(last.date)}): ${last.weight ? `${last.weight} ${ex.unit} · ` : ""}${last.reps.join(", ")} ${repWord}` : "First time logging this one. Start light!"}</p>
      ${suggestion ? `<div class="suggest">🌟 You hit every rep twice in a row. Ready to try ${suggestion} ${ex.unit}?</div>` : ""}

      ${ex.unit ? `
        <label class="small muted">Weight (${ex.unit})</label>
        <div class="stepper">
          <button class="secondary" data-action="step" data-ex="${ex.id}" data-dir="-1" aria-label="Less weight">−</button>
          <input type="number" inputmode="decimal" step="0.5" min="0" data-draft="weight" data-ex="${ex.id}" value="${esc(d.weight)}" placeholder="kg">
          <button class="secondary" data-action="step" data-ex="${ex.id}" data-dir="1" aria-label="More weight">+</button>
        </div>` : ""}

      <label class="small muted">${repWord[0].toUpperCase() + repWord.slice(1)} per set</label>
      <div class="reps">
        ${d.reps.map((r, i) => `<input type="number" inputmode="numeric" min="0" data-draft="rep" data-ex="${ex.id}" data-set="${i}" value="${esc(r)}" aria-label="Set ${i + 1}">`).join("")}
      </div>

      <div class="row between">
        <span class="saved-flag">${saved ? "✓ Saved today" : ""}</span>
        <button class="small-btn" data-action="save-ex" data-ex="${ex.id}">${saved ? "Update" : "Save"}</button>
      </div>
    </div>`;
}

// The plan tick that matches this workout today (if it's scheduled today).
function workoutTickId(key) {
  const item = planFor(todayKey()).items.find((i) => i.workout === key);
  if (item) return item.id;
  return key === "home" ? "extra-home" : "extra-gym";
}
function doneTodayLabel(key) {
  return isTicked(todayKey(), workoutTickId(key)) ? "✓ Done today (tap to undo)" : "Mark workout done 🎉";
}

// ----- Progress -----
function progressScreen() {
  return goalsHTML() + chartHTML() + measurementsHTML() + photoHTML() + feelingsHTML();
}

function goalsHTML() {
  return `<div class="card">
    <h2>Goals by Bali 🏝️</h2>
    ${daysBetween(todayKey(), data.settings.baliDate) > 0 ? `<p class="small muted">${Math.ceil(daysBetween(todayKey(), data.settings.baliDate) / 7)} weeks to go. Small steps add up.</p>` : ""}
    ${GOALS.map((g) => {
      const best = bestWeight(g.exercise);
      const pct = best ? Math.max(0, Math.min(100, ((best - g.start) / (g.target - g.start)) * 100)) : 0;
      return `<div style="margin-bottom:12px">
          <div class="row between"><strong>${g.label}</strong><span class="small muted">Goal ${g.text}</span></div>
          <div class="bar"><span style="width:${best >= g.target ? 100 : pct}%"></span></div>
          <div class="small muted">${best ? `Best so far: ${best} ${g.unit}${best >= g.target ? " · Goal reached! 🎉" : ""}` : "No sessions logged yet"}</div>
        </div>`;
    }).join("")}
  </div>`;
}

function chartHTML() {
  const ex = findExercise(chartExercise) || ALL_EXERCISES[0];
  const h = history(ex.id);
  const goal = GOALS.find((g) => g.exercise === ex.id);
  const options = Object.values(WORKOUTS).filter((w) => w.exercises).map((w) =>
    `<optgroup label="${esc(w.name)}">${w.exercises.map((e) =>
      `<option value="${e.id}" ${e.id === ex.id ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</optgroup>`).join("");

  return `<div class="card">
    <h2>Strength chart 📈</h2>
    <select data-action-change="chart">${options}</select>
    ${h.length ? lineChart(h, goal ? goal.target : null) : `<p class="muted" style="margin-top:10px">Log a session of this exercise to see your chart.</p>`}
    ${h.length ? `<p class="small muted">${ex.unit ? `Weight (${ex.unit})` : `Best ${ex.repsLabel || "reps"}`} each session${goal ? " · dashed line = Bali goal" : ""}</p>` : ""}
  </div>`;
}

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
    if (on && WORKOUT_KINDS.includes(kindOf(id))) toast(cheer());
    render();
  },

  week({ step }) {
    weekOffset = Number(step) === 0 ? 0 : weekOffset + Number(step);
    render();
  },

  mode({ monday, mode }) {
    if (mode === "normal") delete data.weekModes[monday];
    else data.weekModes[monday] = mode;
    saveData();
    if (mode === "minimum") toast("Minimum week on. Busy weeks still count! 💛");
    render();
  },

  step({ ex, dir }) {
    const e = findExercise(ex);
    const d = draftFor(e);
    const next = Math.max(0, (Number(d.weight) || 0) + Number(dir) * (e.step || 2.5));
    d.weight = Math.round(next * 10) / 10;
    render();
  },

  "save-ex"({ ex }) {
    const e = findExercise(ex);
    const d = draftFor(e);
    const session = {
      date: todayKey(),
      weight: Number(d.weight) || 0,
      reps: d.reps.map((r) => Number(r) || 0)
    };
    data.log[ex] = (data.log[ex] || []).filter((s) => s.date !== session.date);
    data.log[ex].push(session);
    saveData();
    toast(hitAllReps(e, session) ? "Every rep done! 💪" : "Saved. Nice work!");
    render();
  },

  "workout-done"({ workout }) {
    const id = workoutTickId(workout);
    const on = !isTicked(todayKey(), id);
    setTick(todayKey(), id, on);
    if (on) toast("Workout done! 🎉 " + cheer());
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

// Typing in the workout boxes updates the unsaved draft.
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset.draft) {
    const d = draftFor(findExercise(el.dataset.ex));
    if (el.dataset.draft === "weight") d.weight = el.value;
    else d.reps[Number(el.dataset.set)] = el.value;
  }
});

// Dropdowns, date boxes and the import file picker.
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.actionChange === "chart") { chartExercise = el.value; render(); }
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
// Waits until every file (including meals.js) has loaded, then draws the screen.
document.addEventListener("DOMContentLoaded", render);

// Save the app files for offline use (only works once it's online at a real web address).
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js");
}
