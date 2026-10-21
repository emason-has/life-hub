// =====================================================================
// FITNESS: planning, sessions, templates and the exercise library
// Sections:
//   1. Setup (and moving your old ticks and strength log across)
//   2. Weeks and sessions
//   3. Sets per muscle, weekly score and streaks
//   4. Plan my week and "make up missed work" suggestions
//   5. Screens: Fitness tab, Plan, Session, Templates, Library, Exercise page
//   6. Drag and drop sessions between days
//   7. Buttons
// Workout mode is in workout.js. Charts and goals are in progress.js.
// =====================================================================


// ---------- 1. Setup ----------
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function uid(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// All fitness data lives in data.fit. The first time it's needed, it's set up
// and your old ticks and strength log are moved across.
function fit() {
  if (!data.fit || !data.fit.v) setupFitness();
  return data.fit;
}

function setupFitness() {
  const f = data.fit = Object.assign({
    weeks: {},        // { "2026-10-19": { mode, planned, days: { Mon: [session], ... } } }
    templates: clone(DEFAULT_TEMPLATES),
    workouts: [],     // every logged workout
    active: null,     // the workout in progress
    favs: [], avoid: [],
    targets: clone(DEFAULT_TARGETS),
    bump: {},         // { "hip-thrust": 10 } next weight to try
    pending: null     // a "make up missed work" suggestion
  }, data.fit || {});
  f.v = 1;
  migrateOldTicks(f);
  migrateOldLog(f);
  saveData();
}

// Old weekly-plan ticks become finished sessions.
const OLD_TICKS = {
  "mon-light": ["pilates"], "tue-gym": ["full-gym", "t-glutes"], "wed-run": ["run"], "wed-home": ["home", "t-home"],
  "thu-gym": ["full-gym", "t-back"], "fri-surf": ["surf"], "fri-gym": ["full-gym", "t-legs"], "sat-surf": ["surf"],
  "sat-run": ["run"], "sat-legs": ["full-gym", "t-legs"], "sun-surf": ["surf"], "low-energy": ["light-home", "t-light"],
  "extra-gym": ["full-gym"], "extra-home": ["home", "t-home"], "extra-surf": ["surf"], "extra-run": ["run"], "extra-light": ["pilates"]
};
function migrateOldTicks(f) {
  for (const [key, ticks] of Object.entries(data.ticks || {})) {
    for (const id of Object.keys(ticks)) {
      const m = OLD_TICKS[id];
      if (!m) continue;
      const monday = mondayOf(key);
      const w = f.weeks[monday] = f.weeks[monday] || { mode: (data.weekModes || {})[monday] === "minimum" ? "busy" : "normal", planned: false, days: {} };
      const day = dayName(key);
      w.days[day] = w.days[day] || [];
      w.days[day].push({ id: uid("s"), type: m[0], tpl: m[1] || null, status: "done", planned: null });
    }
  }
}

// Old strength log entries become logged workouts, one per day.
function migrateOldLog(f) {
  const byDate = {};
  for (const [ex, entries] of Object.entries(data.log || {})) {
    for (const e of entries) {
      byDate[e.date] = byDate[e.date] || [];
      byDate[e.date].push({ ex, sets: e.reps.map((r) => ({ w: e.weight || "", r, done: true })), rating: null, note: "" });
    }
  }
  for (const [date, exercises] of Object.entries(byDate)) {
    const tpl = f.templates.slice().sort((a, b) => score(b) - score(a))[0];
    function score(t) { return exercises.filter((x) => t.exercises.some((e) => e.ex === x.ex)).length; }
    const wk = { id: uid("w"), date, tpl: tpl.id, name: tpl.name, start: null, end: null, exercises, notes: "" };
    f.workouts.push(wk);
    const w = f.weeks[mondayOf(date)] = f.weeks[mondayOf(date)] || { mode: "normal", planned: false, days: {} };
    const list = w.days[dayName(date)] = w.days[dayName(date)] || [];
    const s = list.find((x) => SESSION_TYPES[x.type].strength && !x.workoutId);
    if (s) { s.workoutId = wk.id; s.tpl = s.tpl || tpl.id; }
    else list.push({ id: uid("s"), type: "full-gym", tpl: tpl.id, status: "done", planned: null, workoutId: wk.id });
  }
}


// ---------- 2. Weeks and sessions ----------
function exById(id) { return EXERCISES.find((e) => e.id === id); }
function tplById(id) { return fit().templates.find((t) => t.id === id); }
function typeInfo(type) { return SESSION_TYPES[type] || SESSION_TYPES.rest; }

function weekOf(monday, create) {
  const f = fit();
  if (!f.weeks[monday] && create) f.weeks[monday] = { mode: "normal", planned: false, days: {} };
  return f.weeks[monday];
}
function sessionsOn(key) {
  const w = fit().weeks[mondayOf(key)];
  return (w && w.days[dayName(key)]) || [];
}
function weekKeys(monday) { return WEEK_DAYS.map((d, i) => addDays(monday, i)); }

function findSession(id) {
  for (const [monday, w] of Object.entries(fit().weeks)) {
    for (const [day, list] of Object.entries(w.days)) {
      const s = list.find((x) => x.id === id);
      if (s) return { s, monday, day, key: addDays(monday, WEEK_DAYS.indexOf(day)), list };
    }
  }
  return null;
}

// A new session. Ones planned for today or later remember what was planned,
// so the calendar can show "planned vs what you actually did".
function newSession(type, tpl, key, optional) {
  const s = { id: uid("s"), type, tpl: tpl || null, status: "planned", planned: null };
  if (optional) s.optional = true;
  if (key >= todayKey()) s.planned = { day: dayName(key), type, tpl: tpl || null };
  return s;
}

function addSession(key, s) {
  const w = weekOf(mondayOf(key), true);
  const day = dayName(key);
  (w.days[day] = w.days[day] || []).push(s);
  return s;
}

// Planning a future day updates the plan; changing today or the past is "what actually happened".
function updatePlanned(found) {
  if (found.key > todayKey()) found.s.planned = { day: found.day, type: found.s.type, tpl: found.s.tpl };
}

// The exercises a session will do: its template plus any extra sets added this week.
function sessionExercises(s) {
  const t = tplById(s.tpl);
  const list = t ? clone(t.exercises) : [];
  for (const [ex, n] of Object.entries(s.extra || {})) {
    const hit = list.find((e) => e.ex === ex);
    if (hit) hit.sets += n;
    else list.push({ ex, sets: n, reps: 12, rest: 60 });
  }
  return list;
}

function sessionTitle(s) {
  const t = tplById(s.tpl);
  return t ? t.name : "";
}


// ---------- 3. Sets per muscle, weekly score and streaks ----------
// Each set counts toward the exercise's main muscle (its first group).
function addSets(total, ex, n) {
  const e = exById(ex);
  if (!e || !n) return;
  const g = e.groups[0];
  total[g] = (total[g] || 0) + n;
}

function plannedSets(s) {
  const out = {};
  sessionExercises(s).forEach((e) => addSets(out, e.ex, e.sets));
  return out;
}

function workoutById(id) { return fit().workouts.find((w) => w.id === id); }

function workoutSets(wk) {
  const out = {};
  wk.exercises.forEach((e) => addSets(out, e.ex, e.sets.filter((x) => x.done).length));
  return out;
}

// Done: what you logged. Skipped or missed: nothing. Still to come: the plan.
// "asPlanned" counts missed sessions as if they happened (used to spot what a change dropped).
function sessionSets(s, key, asPlanned) {
  if (s.status === "done") return s.workoutId && workoutById(s.workoutId) ? workoutSets(workoutById(s.workoutId)) : plannedSets(s);
  if (s.status === "skipped" || (key < todayKey() && !asPlanned)) return {};
  return plannedSets(s);
}

function weekSets(monday, asPlanned) {
  const done = {}, projected = {};
  weekKeys(monday).forEach((key) => sessionsOn(key).forEach((s) => {
    const sets = sessionSets(s, key, asPlanned);
    for (const [g, n] of Object.entries(sets)) {
      projected[g] = (projected[g] || 0) + n;
      if (s.status === "done") done[g] = (done[g] || 0) + n;
    }
  }));
  return { done, projected };
}

function weekScore(monday) {
  const w = fit().weeks[monday];
  const mode = (w && w.mode) || "normal";
  let strength = 0, other = 0, total = 0, runs = 0, plannedStrength = 0;
  weekKeys(monday).forEach((key) => sessionsOn(key).forEach((s) => {
    const strong = typeInfo(s.type).strength;
    if (s.status === "done") {
      total++;
      if (strong) strength++; else other++;
      if (s.type === "run") runs++;
    } else if (s.status === "planned" && key >= todayKey() && strong) plannedStrength++;
  }));
  const target = fit().targets.strength;
  const win = mode === "busy" ? strength >= 2 && other >= 1 : mode === "light" ? total >= 2 : strength >= target;
  const summary = mode === "busy" ? `${Math.min(strength, 2)}/2 gym + ${Math.min(other, 1)}/1 other session`
    : mode === "light" ? `${Math.min(total, 2)}/2 sessions` : `${strength}/${target} strength sessions`;
  return { mode, strength, other, total, runs, plannedStrength, win, summary, planned: !!(w && w.planned) };
}

// A day "counts" if you finished a session or ticked anything.
function activeDay(key) {
  return !!data.ticks[key] || sessionsOn(key).some((s) => s.status === "done");
}
// A planned rest day never breaks your streak.
function restDay(key) {
  const w = fit().weeks[mondayOf(key)];
  return !!(w && w.planned) && sessionsOn(key).every((s) => s.optional || s.type === "rest");
}

// "Never miss twice": one missed day is fine, two in a row starts again.
function dayStreak() {
  const start = data.settings.startDate;
  let streak = 0, missed = 0;
  let key = todayKey();
  if (!activeDay(key)) key = addDays(key, -1);
  while (daysBetween(start, key) >= 0) {
    if (activeDay(key)) { streak++; missed = 0; }
    else if (!restDay(key) && ++missed >= 2) break;
    key = addDays(key, -1);
  }
  return streak;
}

function needsComeback() {
  const y = addDays(todayKey(), -1);
  return daysBetween(data.settings.startDate, y) >= 0 && !activeDay(y) && !restDay(y) && !activeDay(todayKey());
}

// Weeks in a row that were a win. Busy and Light weeks count too.
function weekWinStreak() {
  const thisMonday = mondayOf(todayKey());
  let count = weekScore(thisMonday).win ? 1 : 0;
  let monday = addDays(thisMonday, -7);
  while (daysBetween(mondayOf(data.settings.startDate), monday) >= 0 && weekScore(monday).win) {
    count++;
    monday = addDays(monday, -7);
  }
  return count;
}

// How many Normal, Busy and Light weeks you've had (so the overall trend is visible).
function weekTypeTotals() {
  const out = { normal: 0, busy: 0, light: 0 };
  Object.entries(fit().weeks).forEach(([monday, w]) => {
    if (monday <= mondayOf(todayKey()) && (w.planned || Object.values(w.days).some((l) => l.length))) out[w.mode || "normal"]++;
  });
  return out;
}


// ---------- 4. Plan my week ----------
function suggestedDays(mode, monday) {
  const s = WEEK_SUGGESTIONS[mode];
  const summer = [11, 0, 1].includes(fromKey(monday).getMonth());
  return { ...s.days, ...(summer && s.summer ? s.summer : {}) };
}

// Fills the week from a suggestion. Days that have already happened, and
// anything already done or skipped, are left alone.
function applyPlan(monday, mode, fromWeek) {
  const w = weekOf(monday, true);
  w.mode = mode;
  w.planned = true;
  const days = fromWeek ? copyDays(fromWeek) : suggestedDays(mode, monday);
  weekKeys(monday).forEach((key, i) => {
    if (key < todayKey()) return;
    const day = WEEK_DAYS[i];
    const kept = (w.days[day] || []).filter((s) => s.status !== "planned");
    w.days[day] = kept.concat((days[day] || []).map(([type, tpl, opt]) => newSession(type, tpl, key, opt === "optional")));
  });
}

// "Same as last week": copies session types and templates.
function copyDays(monday) {
  const w = fit().weeks[monday];
  const out = {};
  WEEK_DAYS.forEach((d) => { out[d] = ((w && w.days[d]) || []).map((s) => [s.type, s.tpl, s.optional ? "optional" : ""]); });
  return out;
}

// After a change, if a muscle lost sets, suggest where to fit them later in the week.
const MAKE_UP_ORDER = ["glutes", "back", "triceps", "core", "legs"];
const MAKE_UP_HOME = { glutes: "t-light", legs: "t-light", back: "t-home-upper", triceps: "t-home-upper", core: "t-pilates" };

function checkDrop(monday, before, fromKey) {
  const after = weekSets(monday, true).projected;
  const loss = (m) => (before[m] || 0) - (after[m] || 0);
  // The muscle that lost the most sets (ties go to glutes, then back, triceps, core, legs).
  const g = MAKE_UP_ORDER.filter((m) => loss(m) > 0).sort((a, b) => loss(b) - loss(a))[0];
  if (!g) return;      // nothing dropped: keep any earlier suggestion until you answer it
  fit().pending = null;
  const lost = before[g] - (after[g] || 0);
  const label = MUSCLE_GROUPS.find((m) => m.id === g).word;   // "Glute", "Leg" ...
  const startKey = [todayKey(), addDays(fromKey, 1)].sort()[1];
  const later = weekKeys(monday).filter((k) => k >= startKey);
  // 1st choice: a later session that's still planned (gym first, then home).
  for (const kinds of [["full-gym", "short-gym"], ["home", "light-home"]]) {
    for (const key of later) {
      const s = sessionsOn(key).find((x) => x.status === "planned" && kinds.includes(x.type));
      if (!s) continue;
      const where = typeInfo(s.type).strength ? "gym" : "home";
      const ex = (sessionExercises(s).find((e) => (exById(e.ex) || { groups: [] }).groups[0] === g) || {}).ex || MAKE_UP_EXERCISES[g][where];
      const n = Math.min(3, Math.max(2, lost));
      fit().pending = { monday, kind: "extra", sid: s.id, ex, n,
        text: `${label} work dropped on ${dayLong(fromKey)}. Add ${n} extra ${label.toLowerCase()} sets to ${dayLong(key)}'s ${typeInfo(s.type).label.toLowerCase()}?` };
      return;
    }
  }
  // 2nd choice: a short home session on a free day.
  const free = later.find((k) => !sessionsOn(k).some((s) => s.status !== "skipped"));
  if (free) {
    const tpl = tplById(MAKE_UP_HOME[g]);
    if (tpl) fit().pending = { monday, kind: "add", key: free, tpl: tpl.id, type: tpl.type,
      text: `${label} work dropped on ${dayLong(fromKey)}. Add "${tpl.name}" on ${dayLong(free)}?` };
  }
}

function dayLong(key) {
  return { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" }[dayName(key)];
}

// Changes a session and checks whether any muscle work needs making up.
function changeSession(id, fn) {
  const found = findSession(id);
  if (!found) return;
  const before = weekSets(found.monday, true).projected;
  fn(found);
  updatePlanned(findSession(id) || found);
  checkDrop(found.monday, before, found.key);
  saveData();
}


// ---------- 5. Screens ----------
function fitnessScreen(sub = "plan", arg) {
  const tabs = [["plan", "Plan"], ["workouts", "Workouts"], ["library", "Library"], ["history", "History"], ["progress", "Progress"]];
  const draw = { workouts: templatesScreen, library: libraryScreen, history: historyScreen, progress: fitnessProgressScreen }[sub] || fitnessPlanScreen;
  return `
    <h1>Fitness 💪</h1>
    <p class="sub">Week ${weekNumber()} · Phase ${PHASES[phaseIndex()].num}</p>
    <nav class="subtabs">
      ${tabs.map(([t, label]) => `<a href="#fitness/${t}" class="${(sub || "plan") === t ? "on" : ""}">${label}</a>`).join("")}
    </nav>
    ${draw(arg)}`;
}

// ----- Plan -----
function fitnessPlanScreen(mondayArg) {
  const monday = mondayArg || mondayOf(todayKey());
  const w = fit().weeks[monday];
  const thisWeek = monday === mondayOf(todayKey());
  const label = thisWeek ? "This week" : monday === addDays(mondayOf(todayKey()), 7) ? "Next week"
    : monday === addDays(mondayOf(todayKey()), -7) ? "Last week" : `Week of ${niceDate(monday).slice(4)}`;
  const score = weekScore(monday);
  const pending = fit().pending && fit().pending.monday === monday ? fit().pending : null;
  const lastWeek = fit().weeks[addDays(monday, -7)];

  return `
    <div class="row between">
      <a class="btn ghost" href="#fitness/plan/${addDays(monday, -7)}">‹ Prev</a>
      <a class="btn ghost" href="#fitness/plan/${mondayOf(todayKey())}"><strong>${label}</strong></a>
      <a class="btn ghost" href="#fitness/plan/${addDays(monday, 7)}">Next ›</a>
    </div>

    ${!w || !w.planned ? `<div class="card soft">
      <h2>Plan my week 🗓️</h2>
      <p class="small">How does the week of ${niceDate(monday).slice(4)} look? I'll suggest a plan, then you can change anything.</p>
      ${["normal", "busy", "light"].map((m) => `<button class="full plan-choice" data-action="plan-week" data-monday="${monday}" data-mode="${m}">
          <span style="font-size:22px">${WEEK_SUGGESTIONS[m].emoji}</span>
          <span class="grow" style="text-align:left"><strong>${WEEK_SUGGESTIONS[m].label} week</strong><br><span class="small">${WEEK_SUGGESTIONS[m].about}</span></span>
        </button>`).join("")}
      ${lastWeek && lastWeek.planned ? `<button class="full secondary" data-action="plan-week" data-monday="${monday}" data-mode="${lastWeek.mode}" data-copy="1">↺ Same as last week</button>` : ""}
    </div>` : `<div class="seg" role="group" aria-label="Week type">
      ${["normal", "busy", "light"].map((m) => `<button class="${score.mode === m ? "on" : ""}" data-action="week-mode" data-monday="${monday}" data-mode="${m}">${WEEK_SUGGESTIONS[m].label}</button>`).join("")}
    </div>`}

    ${pending ? `<div class="card warm">
      <p style="margin-bottom:10px">💡 ${esc(pending.text)}</p>
      <div class="row"><button class="grow" data-action="pending-yes">Yes, add it</button><button class="secondary" data-action="pending-no">Not now</button></div>
    </div>` : ""}

    <div class="card soft">
      <div class="row between"><strong>${score.summary}</strong>${score.win ? `<span class="pill win">Week won! 🎉</span>` : `<span class="pill">${WEEK_SUGGESTIONS[score.mode].label} week</span>`}</div>
      ${planVsActualHTML(monday)}
    </div>

    ${weekCheckHTML(monday)}

    ${weekKeys(monday).map((key) => dayCardHTML(key)).join("")}
    <p class="small muted">Drag ⠿ to move a session to another day. Tap a session to change it, even on past days.</p>
  `;
}

// Seven little columns: what was planned on top, what happened underneath.
function planVsActualHTML(monday) {
  const today = todayKey();
  const all = weekKeys(monday).flatMap((k) => sessionsOn(k).map((s) => ({ s, key: k })));
  return `<div class="pva">${weekKeys(monday).map((key) => {
    const day = dayName(key);
    const plannedHere = all.filter(({ s }) => s.planned && s.planned.day === day).map(({ s }) => typeInfo(s.planned.type).emoji);
    const actual = sessionsOn(key);
    const done = actual.filter((s) => s.status === "done");
    const changed = done.some((s) => !s.planned || s.planned.type !== s.type || s.planned.day !== day) || all.some(({ s, key: k }) => s.planned && s.planned.day === day && k !== key);
    const missed = key < today && actual.some((s) => s.status !== "done" && !s.optional);
    let mark = "";
    if (done.length) mark = `<span class="pva-mark ${changed ? "chg" : "ok"}">${done.map((s) => typeInfo(s.type).emoji).join("")}</span>`;
    else if (missed) mark = `<span class="pva-mark miss">·</span>`;
    return `<div class="pva-day ${key === today ? "today" : ""}">
        <span class="small muted">${day[0]}</span>
        <span class="pva-plan">${plannedHere.join("") || (key < today ? "" : "🌴")}</span>
        ${mark || `<span class="pva-mark"></span>`}
      </div>`;
  }).join("")}</div>
  <p class="small muted" style="margin:6px 0 0">Top: planned. Bottom: done (amber = changed from the plan).</p>`;
}

// This week's sets per muscle against your targets.
function weekCheckHTML(monday) {
  const { done, projected } = weekSets(monday);
  const t = fit().targets;
  const rows = ["glutes", "back", "triceps", "core"].map((g) => {
    const [min, max] = t[g];
    const p = projected[g] || 0, d = done[g] || 0;
    const top = Math.max(max || min * 1.4, p, 1);
    const status = p >= min ? "ok" : p >= min * 0.7 ? "amber" : "red";
    const label = MUSCLE_GROUPS.find((m) => m.id === g).label;
    return `<div class="mrow">
        <span class="mlabel">${label}</span>
        <div class="mbar"><span class="mdone" style="width:${(d / top) * 100}%"></span><span class="mplan ${status}" style="width:${(Math.max(0, p - d) / top) * 100}%"></span>
          <i style="left:${(min / top) * 100}%"></i>${max ? `<i style="left:${Math.min(100, (max / top) * 100)}%"></i>` : ""}</div>
        <span class="small">${d}/${p}</span>
      </div>`;
  }).join("");
  return `<div class="card">
      <div class="row between"><h3>Sets this week</h3><span class="small muted">done / planned</span></div>
      ${rows}
      <p class="small muted" style="margin:6px 0 0">Lines show your target range. Change targets in Settings.</p>
    </div>`;
}

function sessionChipHTML(s, key) {
  const info = typeInfo(s.type);
  const today = todayKey();
  const missed = s.status === "planned" && key < today && !s.optional;
  const state = s.status === "done" ? "Done ✓" : s.status === "skipped" ? "Skipped" : missed ? "Missed" : s.optional ? "Optional" : "Planned";
  const canStart = s.tpl && tplById(s.tpl) && s.status === "planned" && key <= today;
  return `<div class="sess ${s.status === "done" ? "s-done" : ""} ${s.status === "skipped" || missed ? "s-off" : ""}" data-sid="${s.id}">
      <span class="drag" data-drag="${s.id}" aria-label="Drag to move">⠿</span>
      <a class="sess-main" href="#session/${s.id}">
        <span class="sess-emoji">${info.emoji}</span>
        <span class="grow"><strong>${info.label}</strong>${sessionTitle(s) ? `<br><span class="small">${esc(sessionTitle(s))}</span>` : ""}</span>
        <span class="small muted">${state}</span>
      </a>
      ${canStart ? `<button class="small-btn" data-action="start-session" data-id="${s.id}">${key < today ? "Log" : "Start"}</button>`
        : s.status === "planned" && !s.tpl && key <= today ? `<button class="small-btn secondary" data-action="sess-status" data-id="${s.id}" data-status="done">✓</button>` : ""}
    </div>`;
}

function dayCardHTML(key) {
  const list = sessionsOn(key);
  return `<div class="card day-card ${key === todayKey() ? "today" : ""}" data-dropday="${key}">
      <div class="row between"><h3>${niceDate(key)}${key === todayKey() ? " · Today" : ""}</h3>
        <span class="row" style="gap:6px">
          ${list.some((s) => s.status === "planned") ? `<button class="ghost small-btn" data-action="rest-day" data-key="${key}">Rest</button>` : ""}
          <a class="btn secondary small-btn" href="#session/new/${key}">+ Add</a>
        </span></div>
      ${list.length ? list.map((s) => sessionChipHTML(s, key)).join("") : `<p class="muted small" style="margin:6px 0 0">🌴 Rest day</p>`}
    </div>`;
}

// ----- One session -----
function sessionScreen(id, keyArg) {
  if (id === "new") return newSessionScreen(keyArg);
  const found = findSession(id);
  if (!found) return `<a class="back" href="#fitness/plan">‹ Plan</a><p>Session not found.</p>`;
  const { s, key, monday } = found;
  const today = todayKey();
  const tpls = fit().templates.slice().sort((a, b) => (b.type === s.type) - (a.type === s.type));
  const exList = sessionExercises(s);
  const wk = s.workoutId && workoutById(s.workoutId);
  const changed = s.planned && (s.planned.type !== s.type || s.planned.day !== found.day);
  return `
    <a class="back" href="#fitness/plan/${monday}">‹ Plan</a>
    <h1>${typeInfo(s.type).emoji} ${niceDate(key)}</h1>
    <p class="sub">${key < today ? "This day has passed: change it to match what you actually did." : key === today ? "Today" : "Coming up"}${changed ? ` · Planned: ${typeInfo(s.planned.type).label} (${s.planned.day})` : ""}</p>

    <div class="card">
      <h3>Session type</h3>
      <div class="type-grid">${Object.entries(SESSION_TYPES).map(([t, info]) =>
        `<button class="${s.type === t ? "on" : "secondary"}" data-action="sess-type" data-id="${s.id}" data-type="${t}">${info.emoji} ${info.label}</button>`).join("")}</div>
    </div>

    ${s.type !== "rest" ? `<div class="card">
      <label class="field">Workout template
        <select data-sess-tpl="${s.id}">
          <option value="">${["run", "surf"].includes(s.type) ? "None (just log it)" : "No template"}</option>
          ${tpls.map((t) => `<option value="${t.id}" ${s.tpl === t.id ? "selected" : ""}>${typeInfo(t.type).emoji} ${esc(t.name)}</option>`).join("")}
        </select></label>
      ${exList.length ? `<ul class="list small">${exList.map((e) => `<li class="row between"><a href="#ex/${e.ex}">${esc((exById(e.ex) || { name: e.ex }).name)}</a><span class="muted">${e.sets} × ${e.reps}${s.extra && s.extra[e.ex] ? ` <span class="pill coral">+${s.extra[e.ex]}</span>` : ""}</span></li>`).join("")}</ul>` : ""}
      ${s.tpl ? `<a class="small" href="#tpl/${s.tpl}">Edit this template ›</a>` : ""}
    </div>` : ""}

    <div class="card">
      <label class="field">Day
        <select data-sess-move="${s.id}">${weekKeys(monday).map((k) => `<option value="${k}" ${k === key ? "selected" : ""}>${niceDate(k)}</option>`).join("")}</select></label>
      <p class="small" style="font-weight:600;margin-bottom:6px">Status</p>
      <div class="seg">${["planned", "done", "skipped"].map((st) =>
        `<button class="${s.status === st ? "on" : ""}" data-action="sess-status" data-id="${s.id}" data-status="${st}">${{ planned: "Planned", done: "Done", skipped: "Skipped" }[st]}</button>`).join("")}</div>
      ${!s.tpl || ["run", "surf"].includes(s.type) ? `<label class="field">Minutes (optional)<input type="number" inputmode="numeric" data-sess-mins="${s.id}" value="${esc(s.mins || "")}"></label>` : ""}
      <label class="field">Note<input data-sess-note="${s.id}" value="${esc(s.note || "")}" placeholder="e.g. felt strong, surf was flat"></label>
    </div>

    ${s.tpl && tplById(s.tpl) ? (wk ? `<a class="btn full" href="#wlog/${wk.id}" style="margin-bottom:10px">View or edit the logged workout</a>`
      : `<button class="full" data-action="start-session" data-id="${s.id}" style="margin-bottom:10px">${key < today ? "Log what I did" : "Start workout"} 💪</button>`) : ""}
    <button class="full secondary" data-action="sess-delete" data-id="${s.id}">Remove this session</button>
  `;
}

function newSessionScreen(key) {
  return `
    <a class="back" href="#fitness/plan/${mondayOf(key)}">‹ Plan</a>
    <h1>Add to ${niceDate(key)}</h1>
    <p class="sub">${key < todayKey() ? "Log something you did that day." : "What would you like to plan?"}</p>
    <div class="type-grid">${Object.entries(SESSION_TYPES).filter(([t]) => t !== "rest").map(([t, info]) =>
      `<button class="secondary" data-action="add-session" data-key="${key}" data-type="${t}">${info.emoji} ${info.label}</button>`).join("")}</div>
  `;
}

// ----- Templates -----
function templatesScreen() {
  return `
    <button class="full" data-action="tpl-new" style="margin-bottom:14px">+ New workout template</button>
    ${fit().templates.map((t) => {
      const sets = {};
      t.exercises.forEach((e) => addSets(sets, e.ex, e.sets));
      const total = t.exercises.reduce((n, e) => n + e.sets, 0);
      return `<a class="card" href="#tpl/${t.id}" style="display:block;text-decoration:none;color:inherit">
          <div class="row between"><h3>${typeInfo(t.type).emoji} ${esc(t.name)}</h3><span class="pill">${typeInfo(t.type).label.split(" (")[0]}</span></div>
          <p class="small muted" style="margin:0">${t.exercises.length} exercises · ${total} sets · ${Object.entries(sets).map(([g, n]) => `${n} ${g}`).join(", ")}</p>
        </a>`;
    }).join("")}
  `;
}

function templateScreen(id) {
  const t = tplById(id);
  if (!t) return `<a class="back" href="#fitness/workouts">‹ Workouts</a><p>Template not found.</p>`;
  return `
    <a class="back" href="#fitness/workouts">‹ Workouts</a>
    <h1>Edit workout</h1>
    <div class="card">
      <label class="field">Name<input data-tpl="${t.id}" data-field="name" value="${esc(t.name)}"></label>
      <label class="field">Type
        <select data-tpl="${t.id}" data-field="type">${Object.entries(SESSION_TYPES).filter(([k]) => !["rest", "run", "surf"].includes(k)).map(([k, info]) =>
          `<option value="${k}" ${t.type === k ? "selected" : ""}>${info.emoji} ${info.label}</option>`).join("")}</select></label>
    </div>
    ${t.exercises.map((e, i) => {
      const ex = exById(e.ex) || { name: e.ex, unit: "", repsLabel: "reps" };
      return `<div class="card tpl-ex">
          <div class="row between"><a href="#ex/${e.ex}"><strong>${i + 1}. ${esc(ex.name)}</strong></a>
            <span class="row" style="gap:2px">
              <button class="ghost" data-action="tpl-move" data-id="${t.id}" data-i="${i}" data-dir="-1" aria-label="Move up">↑</button>
              <button class="ghost" data-action="tpl-move" data-id="${t.id}" data-i="${i}" data-dir="1" aria-label="Move down">↓</button>
              <button class="ghost" data-action="tpl-remove" data-id="${t.id}" data-i="${i}" aria-label="Remove">✕</button>
            </span></div>
          <div class="row">
            <label class="field grow">Sets<input type="number" inputmode="numeric" data-tpl="${t.id}" data-i="${i}" data-field="sets" value="${e.sets}"></label>
            <label class="field grow">${ex.repsLabel === "reps" ? "Reps" : ex.repsLabel}<input type="number" inputmode="numeric" data-tpl="${t.id}" data-i="${i}" data-field="reps" value="${e.reps}"></label>
            <label class="field grow">Rest (s)<input type="number" inputmode="numeric" data-tpl="${t.id}" data-i="${i}" data-field="rest" value="${e.rest ?? 60}"></label>
          </div>
          ${ex.unit ? `<label class="field">Starting weight (${ex.unit})<input type="number" inputmode="decimal" data-tpl="${t.id}" data-i="${i}" data-field="weight" value="${e.weight ?? ""}"></label>` : ""}
        </div>`;
    }).join("")}
    <a class="btn full" href="#pickex/tpl/${t.id}" style="margin-bottom:10px">+ Add exercise</a>
    <div class="row">
      <button class="grow secondary" data-action="tpl-dup" data-id="${t.id}">Duplicate</button>
      <button class="secondary" data-action="tpl-delete" data-id="${t.id}">Delete</button>
    </div>
  `;
}

// ----- Library -----
let libFilter = { muscle: "all", equip: "all", where: "all", favs: false };
const EQUIP_LABELS = { machine: "Gym machine", cable: "Cable", barbell: "Barbell", dumbbells: "Dumbbells", "mini band": "Mini leg band", "long band": "Long band", bodyweight: "Bodyweight" };

function filteredExercises() {
  const f = fit();
  return EXERCISES.filter((e) =>
    (libFilter.muscle === "all" || e.groups.includes(libFilter.muscle)) &&
    (libFilter.equip === "all" || e.equip.includes(libFilter.equip)) &&
    (libFilter.where === "all" || (libFilter.where === "home" ? e.where !== "gym" : e.where !== "home")) &&
    (!libFilter.favs || f.favs.includes(e.id)));
}

function exThumb(e, cls = "thumb") {
  return e.images[0] ? `<img class="${cls}" src="${e.images[0]}" alt="" loading="lazy">`
    : `<span class="${cls} thumb-ph" style="background:${(MUSCLE_GROUPS.find((m) => m.id === e.groups[0]) || {}).color}33">${{ glutes: "🍑", legs: "🦵", back: "🔙", triceps: "💪", core: "🎯", shoulders: "🙆‍♀️", mobility: "🧘‍♀️" }[e.groups[0]] || "•"}</span>`;
}

function exerciseRowHTML(e, action) {
  const f = fit();
  const inner = `${exThumb(e)}
    <span class="grow"><strong>${esc(e.name)}</strong>${f.favs.includes(e.id) ? " ⭐" : ""}${f.avoid.includes(e.id) ? " 🚫" : ""}<br>
      <span class="small muted">${e.groups.map((g) => (MUSCLE_GROUPS.find((m) => m.id === g) || { label: g }).label).join(", ")} · ${e.equip.map((q) => EQUIP_LABELS[q] || q).join(" or ")}</span></span>`;
  const search = esc([e.name, ...e.groups, ...e.equip, ...e.muscles].join(" ").toLowerCase());
  return action
    ? `<button class="ex-row" data-search="${search}" ${action} data-ex="${e.id}">${inner}</button>`
    : `<a class="ex-row" data-search="${search}" href="#ex/${e.id}">${inner}</a>`;
}

function filterChipsHTML() {
  const chip = (key, val, label) => `<button class="chip ${libFilter[key] === val ? "on" : ""}" data-action="lib-filter" data-key="${key}" data-val="${val}">${label}</button>`;
  return `
    <input id="lib-search" type="search" placeholder="Search exercises" style="margin:0 0 10px">
    <div class="chips">${chip("muscle", "all", "All muscles")}${MUSCLE_GROUPS.map((m) => chip("muscle", m.id, m.label)).join("")}</div>
    <div class="chips">${chip("equip", "all", "Any equipment")}${Object.entries(EQUIP_LABELS).map(([k, l]) => chip("equip", k, l)).join("")}</div>
    <div class="chips">${chip("where", "all", "Anywhere")}${chip("where", "gym", "Gym")}${chip("where", "home", "Home")}
      <button class="chip ${libFilter.favs ? "on" : ""}" data-action="lib-filter" data-key="favs" data-val="${!libFilter.favs}">⭐ Favourites</button></div>`;
}

function libraryScreen() {
  const list = filteredExercises();
  return `
    ${filterChipsHTML()}
    <p class="small muted">${list.length} exercises</p>
    <div class="card" style="padding:6px 12px">${list.map((e) => exerciseRowHTML(e)).join("") || `<p class="muted">No matches. Try fewer filters.</p>`}</div>
    <p class="small muted">Photos and step-by-step instructions: free-exercise-db (public domain). Form cues written for you.</p>
  `;
}

// Picking an exercise to add to a template or to the workout in progress.
function pickExerciseScreen(mode, id) {
  const back = mode === "tpl" ? `#tpl/${id}` : "#train";
  return `
    <a class="back" href="${back}">‹ Back</a>
    <h1>Add an exercise</h1>
    ${filterChipsHTML()}
    <div class="card" style="padding:6px 12px">${filteredExercises().filter((e) => !fit().avoid.includes(e.id)).map((e) =>
      exerciseRowHTML(e, `data-action="pick-ex" data-mode="${mode}" data-id="${id}"`)).join("")}</div>
  `;
}

// ----- One exercise -----
function exerciseScreen(id) {
  const e = exById(id);
  if (!e) return `<a class="back" href="#fitness/library">‹ Library</a><p>Exercise not found.</p>`;
  const f = fit();
  const sessions = exerciseHistory(id);
  const best = bestFor(id);
  const tag = (on, yes, no) => on ? `<span class="pill win">${yes}</span>` : no ? `<span class="pill coral">${no}</span>` : "";
  return `
    <a class="back" href="#" data-action="go-back">‹ Back</a>
    <h1>${esc(e.name)}</h1>
    <div class="row wrap" style="gap:6px;margin-bottom:12px">
      ${tag(e.backFriendly, "Back-friendly ✓", "Go gentle on the back")}
      ${tag(e.shoulderFriendly, "Shoulder-friendly ✓", e.upper ? "Watch the shoulders" : "")}
      <span class="pill">${{ gym: "Gym", home: "Home", both: "Gym or home" }[e.where]}</span>
    </div>
    ${e.images.length ? `<div class="form-imgs">${e.images.map((src, i) => `<figure><img src="${src}" alt="${i ? "End" : "Start"} position"><figcaption>${i ? "End" : "Start"}</figcaption></figure>`).join("")}</div>` : ""}
    ${e.upper ? `<div class="note">💛 ${UPPER_BODY_NOTE}</div>` : ""}

    <div class="card">
      <h2>3 key cues</h2>
      <ol class="cues">${e.cues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
    </div>
    <div class="card">
      <h3>Common mistakes</h3>
      <ul style="margin:0;padding-left:20px">${e.mistakes.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
    </div>
    <div class="card">
      <h3>Step by step</h3>
      <ol style="margin:0;padding-left:20px">${e.steps.map((s) => `<li class="small" style="margin-bottom:6px">${esc(s)}</li>`).join("")}</ol>
    </div>
    <div class="card">
      <h3>Muscles worked</h3>
      <div class="row wrap" style="gap:6px;margin-bottom:10px">${e.muscles.map((m) => `<span class="pill ${m.includes("helper") ? "" : "win"}">${esc(m)}</span>`).join("")}</div>
      <h3>Equipment</h3>
      <div class="row wrap" style="gap:6px">${e.equip.map((q) => `<span class="pill">${EQUIP_LABELS[q] || q}</span>`).join("")}</div>
    </div>
    <a class="btn full" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " exercise proper form")}" target="_blank" rel="noopener" style="margin-bottom:10px">▶️ Watch a demo</a>
    <div class="row" style="margin-bottom:14px">
      <button class="grow ${f.favs.includes(id) ? "" : "secondary"}" data-action="ex-fav" data-ex="${id}">${f.favs.includes(id) ? "⭐ Favourite" : "☆ Favourite"}</button>
      <button class="grow ${f.avoid.includes(id) ? "" : "secondary"}" data-action="ex-avoid" data-ex="${id}">${f.avoid.includes(id) ? "🚫 Avoiding" : "Avoid this one"}</button>
    </div>
    ${sessions.length ? `<div class="card">
      <h2>Your history</h2>
      <p>${best ? `Best: <strong>${best}${e.unit ? " " + e.unit : " " + e.repsLabel}</strong>` : ""}</p>
      ${lineChart(sessions.map((x) => ({ date: x.date, weight: x.top, reps: [x.top] })), (GOALS.find((g) => g.exercise === id) || {}).target)}
      <ul class="list small">${sessions.slice(-3).reverse().map((x) => `<li>${niceDate(x.date)}: ${x.sets.map((s) => `${s.w ? s.w + "×" : ""}${s.r}`).join(", ")}</li>`).join("")}</ul>
    </div>` : ""}
    <p class="small muted">${e.source === "free-exercise-db" ? "Photos and steps: free-exercise-db (public domain)." : "Steps written for Life Hub."} Cues written for you.</p>
  `;
}

SCREENS.fitness = fitnessScreen;
SCREENS.session = sessionScreen;
SCREENS.tpl = templateScreen;
SCREENS.ex = exerciseScreen;
SCREENS.pickex = pickExerciseScreen;


// ----- Home screen card -----
function todayFitnessHTML() {
  const today = todayKey();
  const monday = mondayOf(today);
  const w = fit().weeks[monday];
  const nextMonday = addDays(monday, 7);
  const nextPlanned = fit().weeks[nextMonday] && fit().weeks[nextMonday].planned;
  const sundayPrompt = dayName(today) === "Sun" && !nextPlanned
    ? `<a class="btn full" href="#fitness/plan/${nextMonday}" style="margin-top:8px">🗓️ Plan next week</a>` : "";
  if (!w || !w.planned) {
    return `<div class="card soft">
        <h2>Plan your week 🗓️</h2>
        <p class="small">Pick how this week looks and I'll suggest a plan you can edit.</p>
        <div class="row" style="gap:6px">${["normal", "busy", "light"].map((m) =>
          `<button class="grow secondary" data-action="plan-week" data-monday="${monday}" data-mode="${m}" data-go="1">${WEEK_SUGGESTIONS[m].emoji} ${WEEK_SUGGESTIONS[m].label}</button>`).join("")}</div>
        ${sessionsOn(today).length ? sessionsOn(today).map((s) => sessionChipHTML(s, today)).join("") : ""}
      </div>`;
  }
  const list = sessionsOn(today);
  return `<div class="card">
      <div class="row between"><h2>Today's training</h2><a class="muted small" href="#fitness/plan" style="text-decoration:none">Plan ›</a></div>
      ${list.length ? list.map((s) => sessionChipHTML(s, today)).join("") : `<p>🌴 Rest day. A walk still counts for your habits.</p>`}
      ${sundayPrompt}
    </div>`;
}

// ----- Apple Watch workouts (used by health.js) -----
const WATCH_TYPES = { gym: ["full-gym", "short-gym"], surf: ["surf"], run: ["run"], light: ["pilates", "light-home"] };
function watchSessionLabel(key, kind) {
  if (kind === "walk") return "Daily walk";
  const s = sessionsOn(key).find((x) => x.status === "planned" && WATCH_TYPES[kind].includes(x.type));
  return s ? `${typeInfo(s.type).label}${sessionTitle(s) ? ": " + sessionTitle(s) : ""} (planned) marked done` : `Extra ${typeInfo(WATCH_TYPES[kind][0]).label.toLowerCase()} added`;
}
function markWatchSession(key, kind) {
  if (kind === "walk") return setTick(key, "daily-walk", true);
  const s = sessionsOn(key).find((x) => x.status === "planned" && WATCH_TYPES[kind].includes(x.type));
  if (s) s.status = "done";
  else if (!sessionsOn(key).some((x) => x.status === "done" && WATCH_TYPES[kind].includes(x.type))) {
    const n = addSession(key, newSession(WATCH_TYPES[kind][0], null, key));
    n.status = "done";
    n.planned = null;
    n.source = "watch";
  }
}


// ---------- 6. Drag and drop ----------
// Hold the ⠿ handle and drag a session onto another day.
let drag = null;
document.addEventListener("pointerdown", (e) => {
  const handle = e.target.closest("[data-drag]");
  if (!handle) return;
  e.preventDefault();
  const chip = handle.closest(".sess");
  const rect = chip.getBoundingClientRect();
  const ghost = chip.cloneNode(true);
  ghost.classList.add("drag-ghost");
  ghost.style.width = rect.width + "px";
  document.body.appendChild(ghost);
  chip.classList.add("dragging");
  drag = { id: handle.dataset.drag, ghost, chip, dx: e.clientX - rect.left, dy: e.clientY - rect.top };
  moveGhost(e);
});
function moveGhost(e) {
  drag.ghost.style.left = e.clientX - drag.dx + "px";
  drag.ghost.style.top = e.clientY - drag.dy + "px";
  document.querySelectorAll(".drop-over").forEach((el) => el.classList.remove("drop-over"));
  const over = dropTarget(e);
  if (over) over.classList.add("drop-over");
}
function dropTarget(e) {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  return el && el.closest("[data-dropday]");
}
document.addEventListener("pointermove", (e) => { if (drag) { e.preventDefault(); moveGhost(e); } }, { passive: false });
document.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const target = dropTarget(e);
  const { id, ghost, chip } = drag;
  drag = null;
  ghost.remove();
  chip.classList.remove("dragging");
  document.querySelectorAll(".drop-over").forEach((el) => el.classList.remove("drop-over"));
  if (target) moveSession(id, target.dataset.dropday);
});
document.addEventListener("pointercancel", () => {
  if (!drag) return;
  drag.ghost.remove();
  drag.chip.classList.remove("dragging");
  drag = null;
});

function moveSession(id, toKey) {
  const found = findSession(id);
  if (!found || found.key === toKey) return;
  changeSession(id, ({ s, list }) => {
    list.splice(list.indexOf(s), 1);
    addSession(toKey, s);
  });
  toast(`Moved to ${niceDate(toKey)}`);
  render();
}


// ---------- 7. Buttons ----------
Object.assign(ACTIONS, {
  "plan-week"({ monday, mode, copy, go }) {
    applyPlan(monday, mode, copy ? addDays(monday, -7) : null);
    fit().pending = null;
    saveData();
    toast(`${WEEK_SUGGESTIONS[mode].label} week planned. Change anything you like 🗓️`);
    if (go) location.hash = `#fitness/plan/${monday}`; else render();
  },

  "week-mode"({ monday, mode }) {
    const w = weekOf(monday, true);
    if (w.mode === mode) return;
    if (confirm(`Switch to a ${WEEK_SUGGESTIONS[mode].label} week.\n\nOK = suggest a new ${WEEK_SUGGESTIONS[mode].label} plan for the rest of the week\nCancel = keep my sessions, just count it as ${WEEK_SUGGESTIONS[mode].label}`)) applyPlan(monday, mode);
    else w.mode = mode;
    saveData();
    render();
  },

  "pending-yes"() {
    const p = fit().pending;
    if (p.kind === "extra") {
      const found = findSession(p.sid);
      if (found) { found.s.extra = found.s.extra || {}; found.s.extra[p.ex] = (found.s.extra[p.ex] || 0) + p.n; }
    } else addSession(p.key, newSession(p.type, p.tpl, p.key));
    fit().pending = null;
    saveData();
    toast("Added. Nice planning! 💪");
    render();
  },

  "pending-no"() { fit().pending = null; saveData(); render(); },

  "rest-day"({ key }) {
    const list = sessionsOn(key);
    const planned = list.filter((s) => s.status === "planned");
    if (!planned.length) return;
    const before = weekSets(mondayOf(key), true).projected;
    weekOf(mondayOf(key)).days[dayName(key)] = list.filter((s) => s.status !== "planned");
    checkDrop(mondayOf(key), before, key);
    saveData();
    toast("Rest day 🌴 Rest is part of the plan.");
    render();
  },

  "add-session"({ key, type }) {
    const s = addSession(key, newSession(type, null, key));
    // Pick a matching template to start with (you can change it).
    const t = fit().templates.find((x) => x.type === type);
    if (t && !["run", "surf"].includes(type)) s.tpl = t.id;
    if (s.planned) s.planned.tpl = s.tpl;
    if (key < todayKey()) s.status = "done";
    saveData();
    location.hash = `#session/${s.id}`;
  },

  "sess-type"({ id, type }) {
    if (type === "rest") return ACTIONS["sess-delete"]({ id, quiet: true });
    changeSession(id, ({ s }) => {
      s.type = type;
      const t = tplById(s.tpl);
      if (["run", "surf"].includes(type)) s.tpl = null;
      else if (!t || t.type !== type) s.tpl = (fit().templates.find((x) => x.type === type) || {}).id || null;
    });
    render();
  },

  "sess-status"({ id, status }) {
    changeSession(id, ({ s }) => { s.status = status; });
    if (status === "done") toast(cheer());
    render();
  },

  "sess-delete"({ id, quiet }) {
    const found = findSession(id);
    if (!found) return;
    if (!quiet && !confirm("Remove this session?")) return;
    changeSession(id, ({ s, list }) => list.splice(list.indexOf(s), 1));
    location.hash = `#fitness/plan/${found.monday}`;
  },

  "tpl-new"() {
    const t = { id: uid("t"), name: "My workout", type: "full-gym", exercises: [] };
    fit().templates.push(t);
    saveData();
    location.hash = `#tpl/${t.id}`;
  },

  "tpl-dup"({ id }) {
    const t = clone(tplById(id));
    t.id = uid("t");
    t.name += " (copy)";
    fit().templates.push(t);
    saveData();
    toast("Duplicated ✓");
    location.hash = `#tpl/${t.id}`;
  },

  "tpl-delete"({ id }) {
    if (!confirm("Delete this template? Sessions using it keep their history.")) return;
    fit().templates = fit().templates.filter((t) => t.id !== id);
    saveData();
    location.hash = "#fitness/workouts";
  },

  "tpl-move"({ id, i, dir }) {
    const list = tplById(id).exercises;
    const a = Number(i), b = a + Number(dir);
    if (b < 0 || b >= list.length) return;
    [list[a], list[b]] = [list[b], list[a]];
    saveData();
    render();
  },

  "tpl-remove"({ id, i }) {
    tplById(id).exercises.splice(Number(i), 1);
    saveData();
    render();
  },

  "lib-filter"({ key, val }) {
    libFilter[key] = key === "favs" ? val === "true" : val;
    render();
  },

  "pick-ex"({ mode, id, ex }) {
    if (mode === "tpl") {
      tplById(id).exercises.push({ ex, sets: 3, reps: exById(ex).repsLabel === "sec" ? 30 : 12, rest: 60 });
      saveData();
      toast("Added ✓");
      location.hash = `#tpl/${id}`;
    } else addToWorkout(ex);
  },

  "ex-fav"({ ex }) { toggleIn(fit().favs, ex); saveData(); render(); },
  "ex-avoid"({ ex }) { toggleIn(fit().avoid, ex); saveData(); render(); },

  "go-back"() { history.length > 1 ? history.back() : (location.hash = "#fitness/library"); }
});

function toggleIn(list, item) {
  const i = list.indexOf(item);
  if (i >= 0) list.splice(i, 1); else list.push(item);
}

// Typing in template boxes, session selects and notes saves straight away.
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.sessTpl) {
    changeSession(el.dataset.sessTpl, ({ s }) => { s.tpl = el.value || null; });
    render();
  }
  if (el.dataset.sessMove) moveSession(el.dataset.sessMove, el.value);
  if (el.dataset.sessMins || el.dataset.sessNote) {
    const found = findSession(el.dataset.sessMins || el.dataset.sessNote);
    if (el.dataset.sessMins) found.s.mins = Number(el.value) || null; else found.s.note = el.value;
    saveData();
  }
  if (el.dataset.tpl) {
    const t = tplById(el.dataset.tpl);
    const f = el.dataset.field;
    if (el.dataset.i === undefined) t[f] = el.value;
    else t.exercises[Number(el.dataset.i)][f] = el.value === "" ? null : Number(el.value);
    saveData();
    toast("Saved ✓");
  }
});

// Live search in the library (hides rows that don't match).
document.addEventListener("input", (e) => {
  if (e.target.id !== "lib-search") return;
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll(".ex-row").forEach((row) => {
    row.style.display = !q || row.dataset.search.includes(q) ? "" : "none";
  });
});
