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
  addNewTemplates(data.fit);
  return data.fit;
}

// Workouts added in later updates (like Posture & arm care) appear once.
// Ones you've deleted don't come back.
const FIRST_TEMPLATES = ["t-glutes", "t-back", "t-legs", "t-short-glutes", "t-short-upper", "t-home", "t-light", "t-home-upper", "t-pilates"];
function addNewTemplates(f) {
  const seen = f.tplSeen || FIRST_TEMPLATES;
  if (f.tplSeen && f.tplSeen.length === DEFAULT_TEMPLATES.length) return;
  DEFAULT_TEMPLATES.filter((t) => !seen.includes(t.id) && !f.templates.some((x) => x.id === t.id)).forEach((t) => f.templates.push(clone(t)));
  f.tplSeen = DEFAULT_TEMPLATES.map((t) => t.id);
  saveData();
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
  f.tplSeen = DEFAULT_TEMPLATES.map((t) => t.id);
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
  // Posture & arm care is always optional: it never counts as missed.
  if (optional || typeInfo(type).care) s.optional = true;
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
    if (typeInfo(s.type).care) return;     // posture care doesn't count toward the week
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
  return !!(w && w.planned) && sessionsOn(key).every((s) => s.optional || s.type === "rest" || typeInfo(s.type).care);
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
function typeIcon(type, cls = "") { return icon(typeInfo(type).icon, cls); }

function fitnessScreen(sub = "plan", arg, arg2) {
  const tabs = [["plan", "Week"], ["workouts", "Workouts"], ["library", "Exercises"], ["history", "History"], ["progress", "Progress"]];
  const draw = { workouts: templatesScreen, library: libraryScreen, history: historyScreen, progress: fitnessProgressScreen }[sub] || fitnessPlanScreen;
  return `
    ${headline("Your", { workouts: "workouts", library: "exercises", history: "history", progress: "progress" }[sub] || "training week")}
    <nav class="chips tabs-chips">
      ${tabs.map(([t, label]) => `<a href="#fitness/${t}" class="chip ${(sub || "plan") === t ? "on" : ""}">${label}</a>`).join("")}
    </nav>
    ${draw(arg, arg2)}`;
}

// ----- Week plan -----
let planDay = null;   // the day picked in the day strip

function fitnessPlanScreen(mondayArg) {
  const today = todayKey();
  const monday = mondayArg || mondayOf(today);
  const keys = weekKeys(monday);
  if (!planDay || !keys.includes(planDay)) planDay = keys.includes(today) ? today : monday;
  const w = fit().weeks[monday];
  const score = weekScore(monday);
  const pending = fit().pending && fit().pending.monday === monday ? fit().pending : null;
  const lastWeek = fit().weeks[addDays(monday, -7)];
  const list = sessionsOn(planDay);
  const thisWeek = monday === mondayOf(today);

  return `
    <div class="week-nav">
      <a class="circ sm" href="#fitness/plan/${addDays(monday, -7)}" aria-label="Previous week">${icon("back")}</a>
      <a class="week-label" href="#fitness/plan/${mondayOf(today)}">${thisWeek ? "This week" : `Week of ${niceDate(monday).slice(4)}`}</a>
      <a class="circ sm" href="#fitness/plan/${addDays(monday, 7)}" aria-label="Next week">${icon("chev")}</a>
    </div>

    ${!w || !w.planned ? `<div class="card">
      <p class="label" style="margin-top:0">Plan this week</p>
      ${["normal", "busy", "light"].map((m) => `<button class="li" data-action="plan-week" data-monday="${monday}" data-mode="${m}">
          ${icon({ normal: "dumbbell", busy: "timer", light: "leaf" }[m], "tile")}
          <span class="grow"><strong>${WEEK_SUGGESTIONS[m].label}</strong><span class="small muted block">${WEEK_SUGGESTIONS[m].about}</span></span>${icon("chev", "chev")}
        </button>`).join("")}
      ${lastWeek && lastWeek.planned ? `<button class="li" data-action="plan-week" data-monday="${monday}" data-mode="${lastWeek.mode}" data-copy="1">${icon("calendar", "tile")}<span class="grow"><strong>Same as last week</strong></span>${icon("chev", "chev")}</button>` : ""}
    </div>` : `<div class="seg">${["normal", "busy", "light"].map((m) =>
      `<button class="${score.mode === m ? "on" : ""}" data-action="week-mode" data-monday="${monday}" data-mode="${m}">${WEEK_SUGGESTIONS[m].label}</button>`).join("")}</div>`}

    ${pending ? `<div class="card notice col">
      <p style="margin:0 0 10px">${esc(pending.text)}</p>
      <div class="row" style="gap:8px"><button class="grow dark" data-action="pending-yes">Add it</button><button class="grow" data-action="pending-no">Not now</button></div>
    </div>` : ""}

    <div class="days">${keys.map((key) => dayPillHTML(key)).join("")}</div>

    <div class="row between day-head">
      <h2>${dayLong(planDay)} ${fromKey(planDay).getDate()}${planDay === today ? ` <span class="tag">Today</span>` : ""}</h2>
      <span class="row" style="gap:6px">
        ${list.some((s) => s.status === "planned") ? `<button class="sm ghost" data-action="rest-day" data-key="${planDay}">Rest day</button>` : ""}
        <a class="circ sm dark" href="#session/new/${planDay}" aria-label="Add a session">${icon("plus")}</a>
      </span>
    </div>
    <div data-dropday="${planDay}">
      ${list.length ? list.map((s) => sessionCardHTML(s, planDay)).join("") : `<div class="card empty">${icon("moon")}<span>Rest day. Tap + to add something.</span></div>`}
    </div>
    <p class="hint">Hold ${icon("drag", "inline")} and drag a session onto another day to move it.</p>

    <details class="card drop-card" ${score.win ? "" : "open"}>
      <summary class="li">${icon("chart", "tile")}<span class="grow"><strong>${score.summary}</strong>${score.win ? `<span class="small muted block">Week won</span>` : ""}</span>${icon("down", "chev")}</summary>
      <div class="drop-body">${weekCheckHTML(monday)}</div>
    </details>
  `;
}

// One day in the strip: date plus a dot for each session (mint = done, amber = changed, grey = planned).
function dayPillHTML(key) {
  const today = todayKey();
  const dots = sessionsOn(key).map((s) => {
    const changed = s.status === "done" && (!s.planned || s.planned.type !== s.type || s.planned.day !== dayName(key));
    const cls = s.status === "done" ? (changed ? "chg" : "done") : s.status === "skipped" || (key < today && !s.optional) ? "miss" : "plan";
    return `<i class="${cls}"></i>`;
  }).join("");
  return `<button class="day ${key === planDay ? "on" : ""} ${key === today ? "is-today" : ""}" data-action="plan-day" data-key="${key}" data-dropday="${key}">
      ${dayName(key)}<b>${fromKey(key).getDate()}</b><span class="dots">${dots}</span>
    </button>`;
}

// The picture for a session: the first exercise photo in its workout.
function sessionImage(s) {
  const t = tplById(s.tpl);
  const ex = t && t.exercises.map((e) => exById(e.ex)).find((e) => e && e.images.length);
  return ex ? ex.images[ex.images.length - 1] : null;
}

function sessionCardHTML(s, key) {
  const info = typeInfo(s.type);
  const today = todayKey();
  const t = tplById(s.tpl);
  const missed = s.status === "planned" && key < today && !s.optional;
  const state = s.status === "done" ? "Done" : s.status === "skipped" ? "Skipped" : missed ? "Missed" : s.optional ? "Optional" : "Planned";
  const img = sessionImage(s);
  const canStart = t && s.status === "planned" && key <= today;
  return `<div class="wcard ${s.status === "done" ? "done" : ""} ${s.status === "skipped" || missed ? "off" : ""}" data-sid="${s.id}">
      <a class="txt" href="#session/${s.id}">
        <span class="kicker">${icon(info.icon)} ${info.label}</span>
        <b>${esc(t ? t.name : info.label)}</b>
        <span class="meta">${[state === "Planned" ? "" : state, t ? `${t.exercises.length} ex` : "", info.mins ? `${info.mins} min` : ""].filter(Boolean).join(" · ")}</span>
      </a>
      ${img ? `<img src="${img}" alt="">` : `<span class="wcard-ph">${icon(info.icon)}</span>`}
      <span class="drag" data-drag="${s.id}" aria-label="Drag to move">${icon("drag")}</span>
      ${canStart ? `<button class="go" data-action="start-session" data-id="${s.id}" aria-label="${key < today ? "Log" : "Start"}">${icon("play")}</button>`
        : s.status === "planned" && !t && key <= today ? `<button class="go" data-action="sess-status" data-id="${s.id}" data-status="done" aria-label="Mark done">${icon("check")}</button>`
        : s.status === "done" ? `<span class="go done">${icon("check")}</span>` : ""}
    </div>`;
}

// This week's sets per muscle against your targets.
function weekCheckHTML(monday) {
  const { done, projected } = weekSets(monday);
  const t = fit().targets;
  return ["glutes", "back", "triceps", "core"].map((g) => {
    const [min, max] = t[g];
    const p = projected[g] || 0, d = done[g] || 0;
    const top = Math.max(max || min * 1.4, p, 1);
    const status = p >= min ? "ok" : p >= min * 0.7 ? "amber" : "red";
    return `<div class="mrow">
        <span class="mlabel">${MUSCLE_GROUPS.find((m) => m.id === g).label}</span>
        <div class="mbar"><span class="mdone" style="width:${(d / top) * 100}%"></span><span class="mplan ${status}" style="width:${(Math.max(0, p - d) / top) * 100}%"></span>
          <i style="left:${(min / top) * 100}%"></i>${max ? `<i style="left:${Math.min(100, (max / top) * 100)}%"></i>` : ""}</div>
        <span class="mnum">${d}/${p}</span>
      </div>`;
  }).join("") + `<p class="small muted" style="margin:8px 0 0">Sets done / planned. Lines mark your target range.</p>`;
}

// ----- One session -----
function sessionScreen(id, keyArg) {
  if (id === "new") return newSessionScreen(keyArg);
  const found = findSession(id);
  if (!found) return `${topBar(backBtn("#fitness/plan"))}<p>Session not found.</p>`;
  const { s, key, monday } = found;
  const today = todayKey();
  const tpls = fit().templates.slice().sort((a, b) => (b.type === s.type) - (a.type === s.type));
  const exList = sessionExercises(s);
  const wk = s.workoutId && workoutById(s.workoutId);
  const changed = s.planned && (s.planned.type !== s.type || s.planned.day !== found.day);
  return `
    ${topBar(backBtn(`#fitness/plan/${monday}`), `<button class="circ" data-action="sess-delete" data-id="${s.id}" aria-label="Remove session">${icon("x")}</button>`)}
    ${headline(niceDate(key), esc(typeInfo(s.type).label))}
    <p class="sub">${key < today ? "Past day: change it to what you actually did." : key === today ? "Today" : "Coming up"}${changed ? ` · planned ${typeInfo(s.planned.type).label.toLowerCase()} (${s.planned.day})` : ""}</p>

    ${s.tpl && tplById(s.tpl) ? (wk ? `<a class="btn full dark" href="#wlog/${wk.id}">View logged workout</a>`
      : `<button class="full dark" data-action="start-session" data-id="${s.id}">${icon("play")} ${key < today ? "Log what I did" : "Start workout"}</button>`) : ""}

    <p class="label">Status</p>
    <div class="seg">${["planned", "done", "skipped"].map((st) =>
      `<button class="${s.status === st ? "on" : ""}" data-action="sess-status" data-id="${s.id}" data-status="${st}">${{ planned: "Planned", done: "Done", skipped: "Skipped" }[st]}</button>`).join("")}</div>

    <p class="label">Type</p>
    <div class="type-grid">${Object.entries(SESSION_TYPES).map(([t, info]) =>
      `<button class="${s.type === t ? "on" : ""}" data-action="sess-type" data-id="${s.id}" data-type="${t}">${icon(info.icon)}<span>${info.label}</span></button>`).join("")}</div>

    <div class="card">
      ${s.type !== "rest" ? `<label class="field">Workout
        <select data-sess-tpl="${s.id}">
          <option value="">${["run", "surf"].includes(s.type) ? "None (just log it)" : "No template"}</option>
          ${tpls.map((t) => `<option value="${t.id}" ${s.tpl === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}
        </select></label>` : ""}
      <label class="field">Day
        <select data-sess-move="${s.id}">${weekKeys(monday).map((k) => `<option value="${k}" ${k === key ? "selected" : ""}>${niceDate(k)}</option>`).join("")}</select></label>
      ${!s.tpl || ["run", "surf"].includes(s.type) ? `<label class="field">Minutes<input type="number" inputmode="numeric" data-sess-mins="${s.id}" value="${esc(s.mins || "")}"></label>` : ""}
      <label class="field" style="margin-bottom:0">Note<input data-sess-note="${s.id}" value="${esc(s.note || "")}" placeholder="Optional"></label>
    </div>

    ${exList.length ? `<p class="label">Exercises</p><div class="card list-card">${exList.map((e) => {
      const ex = exById(e.ex) || { name: e.ex, images: [], groups: ["core"] };
      return `<a class="li" href="#ex/${e.ex}">${exThumb(ex)}<span class="grow">${esc(ex.name)}</span><span class="meta">${e.sets}×${e.reps}${s.extra && s.extra[e.ex] ? ` +${s.extra[e.ex]}` : ""}</span></a>`;
    }).join("")}</div>
    ${s.tpl ? `<a class="link-btn" href="#tpl/${s.tpl}">${icon("edit")} Edit this workout</a>` : ""}` : ""}
  `;
}

function newSessionScreen(key) {
  return `
    ${topBar(backBtn(`#fitness/plan/${mondayOf(key)}`))}
    ${headline("Add to", niceDate(key))}
    <p class="sub">${key < todayKey() ? "Log something you did that day." : "What would you like to plan?"}</p>
    <div class="type-grid">${Object.entries(SESSION_TYPES).filter(([t]) => t !== "rest").map(([t, info]) =>
      `<button data-action="add-session" data-key="${key}" data-type="${t}">${icon(info.icon)}<span>${info.label}</span></button>`).join("")}</div>
  `;
}

// ----- Workouts (templates) -----
function templatesScreen() {
  return `
    <button class="full dark" data-action="tpl-new">${icon("plus")} New workout</button>
    ${fit().templates.map((t) => {
      const img = sessionImage({ tpl: t.id });
      const sets = t.exercises.reduce((n, e) => n + Number(e.sets || 0), 0);
      return `<a class="wcard" href="#tpl/${t.id}">
          <span class="txt"><span class="kicker">${typeIcon(t.type)} ${typeInfo(t.type).label}</span><b>${esc(t.name)}</b>
            <span class="meta">${t.exercises.length} exercises · ${sets} sets</span></span>
          ${img ? `<img src="${img}" alt="">` : `<span class="wcard-ph">${typeIcon(t.type)}</span>`}
        </a>`;
    }).join("")}
  `;
}

function templateScreen(id) {
  const t = tplById(id);
  if (!t) return `${topBar(backBtn("#fitness/workouts"))}<p>Workout not found.</p>`;
  return `
    ${topBar(backBtn("#fitness/workouts"), `<button class="circ" data-action="tpl-dup" data-id="${t.id}" aria-label="Duplicate">${icon("save")}</button>
      <button class="circ" data-action="tpl-delete" data-id="${t.id}" aria-label="Delete">${icon("x")}</button>`)}
    <input class="title-input" data-tpl="${t.id}" data-field="name" value="${esc(t.name)}" aria-label="Workout name">
    <select class="type-select" data-tpl="${t.id}" data-field="type">${Object.entries(SESSION_TYPES).filter(([k]) => !["rest", "run", "surf"].includes(k)).map(([k, info]) =>
      `<option value="${k}" ${t.type === k ? "selected" : ""}>${info.label}</option>`).join("")}</select>

    ${t.link ? `<a class="btn full" href="${esc(t.link)}" target="_blank" rel="noopener">${icon("arrow")} Watch the saved post</a>` : ""}
    ${exSearchHTML(`tpl:${t.id}`, "Search to add an exercise", true)}

    <div class="card list-card">
    ${t.exercises.map((e, i) => {
      const ex = exById(e.ex) || { name: e.ex, unit: "", repsLabel: "reps", images: [], groups: ["core"] };
      return `<details class="tpl-row">
          <summary class="li">${exThumb(ex)}<span class="grow">${esc(ex.name)}<span class="small muted block">${e.sets} × ${e.reps} ${ex.repsLabel} · rest ${e.rest ?? 60}s</span></span>
            <button class="circ sm" data-action="tpl-remove" data-id="${t.id}" data-i="${i}" aria-label="Remove">${icon("x")}</button></summary>
          <div class="tpl-edit">
            <label class="field">Sets<input type="number" inputmode="numeric" data-tpl="${t.id}" data-i="${i}" data-field="sets" value="${e.sets}"></label>
            <label class="field">${ex.repsLabel === "reps" ? "Reps" : ex.repsLabel === "sec" ? "Seconds" : ex.repsLabel}<input type="number" inputmode="numeric" data-tpl="${t.id}" data-i="${i}" data-field="reps" value="${e.reps}"></label>
            <label class="field">Rest (s)<input type="number" inputmode="numeric" data-tpl="${t.id}" data-i="${i}" data-field="rest" value="${e.rest ?? 60}"></label>
            ${ex.unit ? `<label class="field">Start kg<input type="number" inputmode="decimal" data-tpl="${t.id}" data-i="${i}" data-field="weight" value="${e.weight ?? ""}"></label>` : ""}
            <div class="row" style="gap:6px;grid-column:1/-1">
              <button class="sm grow" data-action="tpl-move" data-id="${t.id}" data-i="${i}" data-dir="-1">${icon("up")} Up</button>
              <button class="sm grow" data-action="tpl-move" data-id="${t.id}" data-i="${i}" data-dir="1">${icon("down")} Down</button>
              <a class="btn sm grow" href="#ex/${e.ex}">Form guide</a>
            </div>
          </div>
        </details>`;
    }).join("") || `<p class="muted" style="padding:12px">No exercises yet. Search above to add some.</p>`}
    </div>
    <p class="hint">Tap an exercise to change sets, reps or rest.</p>
  `;
}

// ----- Exercise library -----
let libFilter = { muscle: "all", equip: "all", where: "all", favs: false };
let libQuery = "";
const EQUIP_LABELS = { machine: "Machine", cable: "Cable", barbell: "Barbell", dumbbells: "Dumbbells", kettlebell: "Kettlebell",
  "mini band": "Mini band", "long band": "Long band", bodyweight: "Bodyweight", other: "Other" };

function filteredExercises(query = libQuery) {
  const f = fit();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return EXERCISES.filter((e) =>
    (libFilter.muscle === "all" || e.groups.includes(libFilter.muscle)) &&
    (libFilter.equip === "all" || e.equip.includes(libFilter.equip)) &&
    (libFilter.where === "all" || (libFilter.where === "home" ? e.where !== "gym" : e.where !== "home")) &&
    (!libFilter.favs || f.favs.includes(e.id)) &&
    words.every((w) => (e.name + " " + e.muscles.join(" ") + " " + e.equip.join(" ")).toLowerCase().includes(w)))
    // Your hand-picked exercises and favourites first.
    .sort((a, b) => (f.favs.includes(b.id) - f.favs.includes(a.id)) || ((b.curated ? 1 : 0) - (a.curated ? 1 : 0)));
}

function exThumb(e, cls = "thumb") {
  return e.images && e.images[0] ? `<img class="${cls}" src="${e.images[0]}" alt="" loading="lazy">`
    : `<span class="${cls} thumb-ph">${icon({ mobility: "lotus", core: "posture", back: "posture" }[e.groups[0]] || "dumbbell")}</span>`;
}

function exerciseRowHTML(e, action) {
  const f = fit();
  const inner = `${exThumb(e)}
    <span class="grow">${esc(e.name)}${f.favs.includes(e.id) ? ` ${icon("star", "inline fav")}` : ""}
      <span class="small muted block">${e.groups.map((g) => (MUSCLE_GROUPS.find((m) => m.id === g) || { label: g }).label).join(", ")} · ${e.equip.map((q) => EQUIP_LABELS[q] || q).join(" or ")}</span></span>`;
  return action
    ? `<button class="li ex-row" ${action} data-ex="${e.id}">${inner}${icon("plus", "accent")}</button>`
    : `<a class="li ex-row" href="#ex/${e.id}">${inner}${icon("chev", "chev")}</a>`;
}

// A search box with live results. "where" is "lib", "tpl:<id>" or "train".
// With "inline", results appear under the box only while you're typing.
function exSearchHTML(where, placeholder, inline) {
  return `<label class="search">${icon("search")}<input type="search" data-exsearch="${where}" value="${esc(where === "lib" ? libQuery : "")}" placeholder="${placeholder}" autocomplete="off"></label>
    ${inline ? `<div class="card list-card ex-results" data-results="${where}" hidden></div>` : ""}`;
}

function exResultsHTML(where, query) {
  const list = filteredExercises(query).filter((e) => where === "lib" || !fit().avoid.includes(e.id));
  const limit = where === "lib" ? 60 : 8;
  const [mode, id] = where.split(":");
  const action = mode === "tpl" ? `data-action="pick-ex" data-mode="tpl" data-id="${id}"` : mode === "train" ? `data-action="pick-ex" data-mode="train" data-id="x"` : "";
  return list.slice(0, limit).map((e) => exerciseRowHTML(e, action)).join("") +
    (list.length > limit ? `<p class="small muted" style="padding:10px 14px;margin:0">${list.length - limit} more. Keep typing to narrow it down.</p>` : "") +
    (!list.length ? `<p class="muted" style="padding:12px 14px;margin:0">No matches.</p>` : "");
}

function filterChipsHTML() {
  const chip = (key, val, label) => `<button class="chip ${libFilter[key] === val ? "on" : ""}" data-action="lib-filter" data-key="${key}" data-val="${val}">${label}</button>`;
  return `
    <div class="chips">${chip("muscle", "all", "All")}${MUSCLE_GROUPS.map((m) => chip("muscle", m.id, m.label)).join("")}</div>
    <div class="chips">${chip("where", "all", "Anywhere")}${chip("where", "gym", "Gym")}${chip("where", "home", "Home")}
      <button class="chip ${libFilter.favs ? "on" : ""}" data-action="lib-filter" data-key="favs" data-val="${!libFilter.favs}">Favourites</button>
      ${chip("equip", "all", "Any equipment")}${Object.entries(EQUIP_LABELS).map(([k, l]) => chip("equip", k, l)).join("")}</div>`;
}

function libraryScreen() {
  return `
    ${exSearchHTML("lib", `Search ${EXERCISES.length} exercises`)}
    ${filterChipsHTML()}
    <div class="card list-card" data-results="lib">${exResultsHTML("lib", libQuery)}</div>
    <p class="hint">Photos and steps: free-exercise-db (public domain). Form cues written for you.</p>
  `;
}

// Picking an exercise to add to the workout in progress.
function pickExerciseScreen(mode, id) {
  return `
    ${topBar(backBtn(mode === "tpl" ? `#tpl/${id}` : "#train"))}
    ${headline("Add an", "exercise")}
    ${exSearchHTML(mode === "tpl" ? `tpl:${id}` : "train", "Search exercises")}
    ${filterChipsHTML()}
    <div class="card list-card" data-results="${mode === "tpl" ? `tpl:${id}` : "train"}">${exResultsHTML(mode === "tpl" ? `tpl:${id}` : "train", "")}</div>
  `;
}

// ----- One exercise -----
function exerciseScreen(id) {
  const e = exById(id);
  if (!e) return `${topBar(backBtn("#fitness/library"))}<p>Exercise not found.</p>`;
  const f = fit();
  const sessions = exerciseHistory(id);
  const best = bestFor(id);
  return `
    ${topBar(`<a class="circ" href="#" data-action="go-back" aria-label="Back">${icon("back")}</a>`,
      `<button class="circ ${f.favs.includes(id) ? "dark" : ""}" data-action="ex-fav" data-ex="${id}" aria-label="Favourite">${icon("star")}</button>`)}
    <h1 class="head" style="font-size:28px"><b>${esc(e.name)}</b></h1>
    <div class="row wrap" style="gap:6px;margin-bottom:12px">
      ${e.curated && e.backFriendly ? `<span class="tag ok">Back-friendly</span>` : ""}
      ${e.curated && e.shoulderFriendly ? `<span class="tag ok">Shoulder-friendly</span>` : ""}
      <span class="tag">${{ gym: "Gym", home: "Home", both: "Gym or home" }[e.where]}</span>
      ${e.equip.map((q) => `<span class="tag">${EQUIP_LABELS[q] || q}</span>`).join("")}
    </div>
    ${e.images.length ? `<div class="form-imgs">${e.images.map((src, i) => `<figure><img src="${src}" alt="${i ? "End" : "Start"} position"><figcaption>${i ? "End" : "Start"}</figcaption></figure>`).join("")}</div>` : ""}
    ${e.upper ? `<div class="card notice"><span class="small">${UPPER_BODY_NOTE}</span></div>` : ""}

    ${e.cues ? `<div class="card"><p class="label" style="margin-top:0">Key cues</p><ol class="cues">${e.cues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol></div>` : ""}
    ${e.mistakes ? `<details class="card drop-card"><summary class="li"><span class="grow"><strong>Common mistakes</strong></span>${icon("down", "chev")}</summary>
      <ul class="drop-body plain-list">${e.mistakes.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></details>` : ""}
    <details class="card drop-card" ${e.cues ? "" : "open"}><summary class="li"><span class="grow"><strong>Step by step</strong></span>${icon("down", "chev")}</summary>
      <ol class="drop-body plain-list">${e.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></details>
    <div class="card">
      <p class="label" style="margin-top:0">Muscles</p>
      <div class="row wrap" style="gap:6px">${e.muscles.map((m) => `<span class="tag ${m.includes("helper") ? "" : "ok"}">${esc(m.replace(" (helper)", ""))}</span>`).join("")}</div>
    </div>
    <div class="row" style="gap:8px;margin-bottom:12px">
      <a class="btn grow dark" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.name + " exercise proper form")}" target="_blank" rel="noopener">${icon("play")} Watch a demo</a>
      <button class="grow ${f.avoid.includes(id) ? "dark" : ""}" data-action="ex-avoid" data-ex="${id}">${f.avoid.includes(id) ? "Avoiding" : "Avoid"}</button>
    </div>
    ${sessions.length ? `<div class="card">
      <div class="row between"><p class="label" style="margin:0">Your history</p>${best ? `<span class="tag ok">Best ${best}${e.unit ? " " + e.unit.replace(" each side", "") : ""}</span>` : ""}</div>
      ${lineChart(sessions.map((x) => ({ date: x.date, weight: x.top, reps: [x.top] })), (GOALS.find((g) => g.exercise === id) || {}).target)}
    </div>` : ""}
  `;
}

SCREENS.fitness = fitnessScreen;
SCREENS.session = sessionScreen;
SCREENS.tpl = templateScreen;
SCREENS.ex = exerciseScreen;
SCREENS.pickex = pickExerciseScreen;


// ----- Home widget: Up next -----
let moveOpen = false;

function upNextHTML() {
  const today = todayKey();
  const monday = mondayOf(today);
  const w = fit().weeks[monday];
  if (!w || !w.planned) {
    return `<div class="card">
        <p class="label" style="margin-top:0">Plan your week</p>
        <div class="seg" style="margin:0">${["normal", "busy", "light"].map((m) =>
          `<button data-action="plan-week" data-monday="${monday}" data-mode="${m}" data-go="1">${WEEK_SUGGESTIONS[m].label}</button>`).join("")}</div>
      </div>`;
  }
  // The next thing that still needs doing: today first, then later this week.
  let key = null, s = null;
  for (const k of weekKeys(monday).filter((x) => x >= today)) {
    const list = sessionsOn(k).filter((x) => x.status === "planned");
    s = list.find((x) => !x.optional) || list[0];
    if (s) { key = k; break; }
  }
  const doneToday = sessionsOn(today).filter((x) => x.status === "done");
  if (!s) {
    return `<div class="card next-card">
        <span class="wcard-ph sm">${icon(doneToday.length ? "check" : "moon")}</span>
        <div class="grow"><div class="kicker">${doneToday.length ? "Done today" : "Nothing planned"}</div><b>${doneToday.length ? "Nice work. Rest up." : "Rest of the week is free"}</b></div>
        <a class="btn sm" href="#fitness/plan">Plan</a>
      </div>`;
  }
  const info = typeInfo(s.type);
  const t = tplById(s.tpl);
  const img = sessionImage(s);
  const isToday = key === today;
  const canStart = isToday && t;
  const later = weekKeys(monday).filter((k) => k > today);
  return `<div class="card">
      <div class="next-card">
        ${img ? `<img class="thumb big" src="${img}" alt="">` : `<span class="wcard-ph sm">${icon(info.icon)}</span>`}
        <div class="grow"><div class="kicker">Up next · ${isToday ? "Today" : dayLong(key)}</div>
          <b>${esc(t ? t.name : info.label)}</b><div class="meta">${t ? `${t.exercises.length} exercises · ` : ""}${info.mins} min</div></div>
        ${canStart ? `<button class="sm dark" data-action="start-session" data-id="${s.id}">Start</button>`
          : isToday ? `<button class="sm dark" data-action="sess-status" data-id="${s.id}" data-status="done">Done</button>`
          : `<a class="btn sm" href="#session/${s.id}">View</a>`}
      </div>
      ${isToday && !info.care ? `<div class="chips" style="margin:12px 0 0">
          ${info.strength && s.type !== "short-gym" ? `<button class="chip" data-action="quick-short" data-id="${s.id}">Make it short</button>` : ""}
          ${later.length ? `<button class="chip ${moveOpen ? "on" : ""}" data-action="quick-move" data-id="${s.id}">Move day</button>` : ""}
          ${s.type !== "home" ? `<button class="chip" data-action="quick-home" data-id="${s.id}">Home instead</button>` : ""}
        </div>
        ${moveOpen ? `<div class="chips" style="margin:8px 0 0">${later.map((k) => `<button class="chip" data-action="quick-move-to" data-id="${s.id}" data-key="${k}">${dayName(k)} ${fromKey(k).getDate()}</button>`).join("")}</div>` : ""}` : ""}
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
  if (kind === "walk") return;      // walks show up in your steps instead
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
  const chip = handle.closest("[data-sid]");
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
  "plan-day"({ key }) { planDay = key; render(); },

  // Quick fixes for busy days, from the Up next card on Home.
  "quick-short"({ id }) {
    const found = findSession(id);
    const sets = plannedSets(found.s);
    const tpl = (sets.glutes || 0) + (sets.legs || 0) >= (sets.back || 0) + (sets.triceps || 0) ? "t-short-glutes" : "t-short-upper";
    changeSession(id, ({ s }) => { s.type = "short-gym"; s.tpl = tplById(tpl) ? tpl : s.tpl; });
    toast("Short session. Every bit counts");
    render();
  },
  "quick-home"({ id }) {
    changeSession(id, ({ s }) => { s.type = "home"; s.tpl = tplById("t-home") ? "t-home" : null; });
    toast("Home session it is");
    render();
  },
  "quick-move"() { moveOpen = !moveOpen; render(); },
  "quick-move-to"({ id, key }) { moveOpen = false; moveSession(id, key); },

  "plan-week"({ monday, mode, copy, go }) {
    applyPlan(monday, mode, copy ? addDays(monday, -7) : null);
    fit().pending = null;
    saveData();
    toast(`${WEEK_SUGGESTIONS[mode].label} week planned. Change anything you like`);
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
    toast("Added. Nice planning!");
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
    toast("Rest day Rest is part of the plan.");
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
    toast("Duplicated");
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
      toast(`Added ${exById(ex).name}`);
      if (location.hash === `#tpl/${id}`) render(); else location.hash = `#tpl/${id}`;
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
    toast("Saved");
  }
});

// Live exercise search: results update as you type.
document.addEventListener("input", (e) => {
  const where = e.target.dataset.exsearch;
  if (!where) return;
  const q = e.target.value;
  if (where === "lib") libQuery = q;
  const box = document.querySelector(`[data-results="${where}"]`);
  if (!box) return;
  box.innerHTML = exResultsHTML(where, q);
  if (where.startsWith("tpl:")) box.hidden = !q.trim();
});
