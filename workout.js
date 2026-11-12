// =====================================================================
// WORKOUT MODE (in the gym)
// Sections:
//   1. History helpers (last time, personal bests, "ready to go up")
//   2. Starting and finishing a workout
//   3. Rest timer and little celebrations
//   4. Screens: workout mode, swap, summary, history, edit a past workout
//   5. Buttons
// =====================================================================


// ---------- 1. History helpers ----------
function byDate(a, b) { return a.date.localeCompare(b.date) || (a.start || 0) - (b.start || 0); }
function doneSets(e) { return e.sets.filter((s) => s.done && (Number(s.r) > 0 || Number(s.w) > 0)); }

// Every logged session of one exercise, oldest first: { date, sets, top }.
// "top" is the heaviest weight, or the most reps for exercises without weight.
function exerciseHistory(exId, skipWorkoutId) {
  const out = [];
  fit().workouts.slice().sort(byDate).forEach((w) => {
    if (w.id === skipWorkoutId) return;
    w.exercises.filter((e) => e.ex === exId).forEach((e) => {
      const sets = doneSets(e);
      if (!sets.length) return;
      const topW = Math.max(...sets.map((s) => Number(s.w) || 0));
      out.push({ date: w.date, sets, top: topW || Math.max(...sets.map((s) => Number(s.r) || 0)), byWeight: topW > 0, workoutId: w.id });
    });
  });
  return out;
}

function bestFor(exId, skipWorkoutId) {
  const h = exerciseHistory(exId, skipWorkoutId);
  return h.length ? Math.max(...h.map((x) => x.top)) : 0;
}

function lastFor(exId, date, skipWorkoutId) {
  const h = exerciseHistory(exId, skipWorkoutId).filter((x) => x.date <= date);
  return h[h.length - 1] || null;
}

// Hit every rep at the same weight two sessions in a row? Suggest a small increase.
function goUpSuggestion(e, skipWorkoutId) {
  const ex = exById(e.ex);
  if (!ex || !ex.unit) return null;
  const h = exerciseHistory(e.ex, skipWorkoutId).slice(-2);
  if (h.length < 2) return null;
  const hitAll = (x) => x.sets.length >= e.target.sets && x.sets.every((s) => Number(s.r) >= e.target.reps);
  const w = (x) => Math.max(...x.sets.map((s) => Number(s.w) || 0));
  if (!w(h[1]) || w(h[0]) !== w(h[1]) || !hitAll(h[0]) || !hitAll(h[1])) return null;
  return w(h[1]) + (ex.step || 2.5);
}


// ---------- 2. Starting and finishing ----------
// Pre-fills each set with what you did last time (or the template's starting weight).
function prefill(t, date, skipId) {
  const last = lastFor(t.ex, date, skipId);
  const bump = fit().bump[t.ex];
  const sets = Array.from({ length: Number(t.sets) || 1 }, (_, i) => {
    const ls = last ? last.sets[i] || last.sets[last.sets.length - 1] : null;
    return { w: bump || (ls ? ls.w : t.weight ?? ""), r: ls ? ls.r : t.reps, done: false, lastW: ls ? ls.w : null, lastR: ls ? ls.r : null };
  });
  return { ex: t.ex, target: { sets: Number(t.sets) || 1, reps: Number(t.reps) || 10, rest: t.rest ?? 60 }, sets, rating: null, note: "" };
}

function startWorkout(sid) {
  const found = findSession(sid);
  if (!found) return;
  const f = fit();
  if (f.active && f.active.sid !== sid && !confirm("You have a workout in progress. Start this one instead?")) { location.hash = "#train"; return; }
  const s = found.s;
  if (!f.active || f.active.sid !== sid) {
    const id = uid("w");
    f.active = {
      id, date: found.key, sid, tpl: s.tpl, name: sessionTitle(s) || typeInfo(s.type).label,
      start: found.key === todayKey() ? Date.now() : null, exIndex: 0, rest: null, notes: "",
      exercises: sessionExercises(s).map((t) => prefill(t, found.key, id))
    };
  } else if (f.active.tpl !== s.tpl) {
    // You switched this session to a different workout after starting it (say glutes to back).
    // Keep anything you've already ticked, and bring in the new workout's exercises.
    const a = f.active;
    const kept = a.exercises.filter((e) => e.sets.some((x) => x.done));
    const fresh = sessionExercises(s).filter((t) => !kept.some((e) => e.ex === t.ex)).map((t) => prefill(t, a.date, a.id));
    a.exercises = [...kept, ...fresh];
    a.tpl = s.tpl;
    a.name = sessionTitle(s) || typeInfo(s.type).label;
    a.exIndex = kept.length < a.exercises.length ? kept.length : 0;
    toast(kept.length ? `Switched. Kept your ${kept.length} done exercise${kept.length === 1 ? "" : "s"}.` : "Switched workout");
  }
  saveData();
  location.hash = "#train";
}

function addToWorkout(ex) {
  const a = fit().active;
  if (!a) return;
  const label = exById(ex).repsLabel;
  a.exercises.push(prefill(label === "min" ? { ex, sets: 1, reps: 20, rest: 0 } : { ex, sets: 3, reps: label === "sec" ? 30 : 12, rest: 60 }, a.date, a.id));
  a.exIndex = a.exercises.length - 1;
  saveData();
  location.hash = "#train";
}

// The session type a finished workout should count as, if it was a lifting session:
// its workout's own type, or gym when 6+ sets of non-core lifting were ticked.
function liftingType(wk) {
  const t = tplById(wk.tpl);
  if (t && typeInfo(t.type).strength) return t.type;
  const sets = wk.exercises.reduce((n, e) => {
    const g = (exById(e.ex) || { groups: [] }).groups[0];
    return n + (["core", "mobility", "cardio"].includes(g) ? 0 : doneSets(e).length);
  }, 0);
  return sets >= 12 ? "full-gym" : sets >= 6 ? "short-gym" : null;
}

function finishWorkout() {
  const f = fit();
  const a = f.active;
  const done = a.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  if (!done && !confirm("No sets ticked yet. Finish anyway?")) return;
  const wk = {
    id: a.id, date: a.date, sid: a.sid, tpl: a.tpl, name: a.name, start: a.start, end: a.start ? Date.now() : null, notes: a.notes,
    exercises: a.exercises.map((e) => ({ ex: e.ex, target: e.target, rating: e.rating, note: e.note,
      sets: e.sets.map((s) => ({ w: s.w, r: s.r, done: s.done, pb: !!s.pb })) }))
  };
  f.workouts.push(wk);
  wk.exercises.forEach((e) => { if (doneSets(e).length) delete f.bump[e.ex]; });
  f.active = null;
  const lifted = liftingType(wk);
  if (a.sid && findSession(a.sid)) {
    changeSession(a.sid, ({ s }) => {
      s.status = "done"; s.workoutId = wk.id;
      // Logged a real lifting session on a walk, run, surf, rest or posture day? Count it as gym.
      const info = typeInfo(s.type);
      if (lifted && (info.cardio || info.care || s.type === "rest")) s.type = lifted;
    });
  } else {
    const s = addSession(wk.date, newSession(lifted || "full-gym", wk.tpl, wk.date));
    s.status = "done"; s.workoutId = wk.id; s.planned = null;
  }
  celebrateNext = wk.exercises.some((e) => e.sets.some((s) => s.pb));
  saveData();
  location.hash = `#train/summary/${wk.id}`;
}


// ---------- 3. Rest timer and celebrations ----------
function clock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// A soft two-note chime when rest is over.
let audio = null;
function chime() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [523, 784].forEach((freq, i) => {
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audio.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.2, audio.currentTime + i * 0.25 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + i * 0.25 + 0.8);
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + i * 0.25);
      osc.stop(audio.currentTime + i * 0.25 + 0.9);
    });
  } catch (e) { /* sound not available */ }
}

function restLeft() {
  const a = data.fit && data.fit.active;
  return a && a.rest ? Math.max(0, Math.round((a.rest.endsAt - Date.now()) / 1000)) : null;
}

setInterval(() => {
  const left = restLeft();
  if (left === null) return;
  const el = document.getElementById("rest-left");
  if (el) el.textContent = clock(left);
  if (left === 0) {
    data.fit.active.rest = null;
    saveData();
    chime();
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    toast("Rest done. Next set");
    if (location.hash.startsWith("#train")) render();
  }
}, 1000);

// A quick confetti burst (for personal bests).
let celebrateNext = false;
function confettiBurst() {
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  layer.innerHTML = Array.from({ length: 22 }, (_, i) =>
    `<span class="confetti" style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.5).toFixed(2)}s;background:${["#3fae9c", "#f3a98c", "#16181a", "#9fe0cf", "#f2c94c"][i % 5]}"></span>`).join("");
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 3200);
}


// ---------- 4. Screens ----------
let swapOpen = false;
let swapCtx = "same";

function trainScreen(sub, arg) {
  if (sub === "summary") return summaryScreen(arg);
  const a = fit().active;
  if (!a) return `${topBar(backBtn("#fitness/plan"))}${headline("No workout", "running")}<p class="sub">Start one from your week or the Up next card on Home.</p>`;
  if (swapOpen) return swapScreen(a);
  const e = a.exercises[a.exIndex];
  const ex = exById(e.ex) || { name: e.ex, unit: "", repsLabel: "reps", images: [], groups: ["core"] };
  const last = a.exIndex === a.exercises.length - 1;
  const up = goUpSuggestion(e, a.id);
  const mins = a.start ? Math.round((Date.now() - a.start) / 60000) : null;
  return `
    ${topBar(backBtn("#fitness/plan"), `<span class="hi" style="text-align:right">${niceDate(a.date)}<b>${mins !== null ? `${mins} min` : "Logging"}</b></span>`)}
    <h1 class="head" style="font-size:28px"><b>${esc(a.name)}</b></h1>
    <div class="ex-dots">${a.exercises.map((x, j) => {
      const all = x.sets.length && x.sets.every((s) => s.done);
      return `<button class="ex-dot ${j === a.exIndex ? "on" : ""} ${all ? "done" : ""}" data-action="train-go" data-i="${j}" aria-label="Exercise ${j + 1}">${j + 1}</button>`;
    }).join("")}</div>

    <div class="card train-card">
      <div class="row" style="align-items:flex-start">
        ${exThumb(ex, "thumb big")}
        <div class="grow">
          <h2 style="margin-bottom:2px">${esc(ex.name)}</h2>
          <p class="small muted" style="margin:0">${e.target.sets} × ${e.target.reps} ${ex.repsLabel} · rest ${e.target.rest}s</p>
          <div class="row" style="gap:6px;margin-top:6px">
            <a class="btn sm" href="#ex/${e.ex}">Form</a>
            <button class="sm" data-action="swap-open">Swap</button>
          </div>
        </div>
      </div>
      ${ex.upper ? `<div class="note">${UPPER_BODY_NOTE}</div>` : ""}
      ${up ? `<div class="suggest">Every rep, twice in a row. Ready to try ${up} ${ex.unit}?</div>` : ""}
      ${ex.cues ? `<p class="small cue">${esc(ex.cues[0])}</p>` : ""}

      <div class="set-head small muted"><span>Set</span><span>${ex.unit ? `Weight (${ex.unit.replace("kg ", "")})` : ""}</span><span>${ex.repsLabel}</span><span></span></div>
      ${e.sets.map((s, si) => `
        <div class="set-row ${s.done ? "done" : ""}">
          <span class="set-n">${s.pb ? icon("star", "inline fav") : si + 1}</span>
          ${ex.unit ? `<span class="wbox">
              <button class="secondary" data-action="train-step" data-s="${si}" data-dir="-1" aria-label="Less">−</button>
              <input type="number" inputmode="decimal" data-tw="w" data-s="${si}" value="${esc(s.w)}">
              <button class="secondary" data-action="train-step" data-s="${si}" data-dir="1" aria-label="More">+</button>
            </span>` : `<span></span>`}
          <input class="rbox" type="number" inputmode="numeric" data-tw="r" data-s="${si}" value="${esc(s.r)}">
          <button class="set-tick ${s.done ? "on" : ""}" data-action="train-set" data-s="${si}" aria-label="Set done">${icon("check")}</button>
        </div>
        ${s.lastR !== null && s.lastR !== undefined ? `<p class="last-line small muted">Last time: ${s.lastW ? `${s.lastW} × ` : ""}${s.lastR}</p>` : ""}`).join("")}
      <div class="row" style="gap:6px;margin-top:6px">
        <button class="ghost small-btn" data-action="train-addset">+ Add set</button>
        ${e.sets.length > 1 ? `<button class="ghost small-btn" data-action="train-delset">− Remove set</button>` : ""}
      </div>

      <p class="small" style="font-weight:600;margin:10px 0 6px">How did it feel?</p>
      <div class="seg" style="margin-bottom:8px">${["easy", "good", "hard"].map((r) =>
        `<button class="${e.rating === r ? "on" : ""}" data-action="train-rate" data-r="${r}">${{ easy: "Easy", good: "Good", hard: "Hard" }[r]}</button>`).join("")}</div>
      <textarea data-train-note rows="2" placeholder="Notes, e.g. lower back felt tight">${esc(e.note)}</textarea>
    </div>

    <div class="row" style="margin-bottom:10px">
      ${a.exIndex > 0 ? `<button class="circ lg" data-action="train-go" data-i="${a.exIndex - 1}" aria-label="Previous">${icon("back")}</button>` : ""}
      ${last ? `<button class="grow dark" data-action="train-finish">Finish workout</button>`
        : `<button class="grow dark" data-action="train-go" data-i="${a.exIndex + 1}">Next exercise</button>`}
    </div>
    <a class="btn ghost full" href="#pickex/train/x">+ Add an exercise</a>
    <button class="ghost full" data-action="train-discard">Discard this workout</button>
    ${a.rest ? `<div class="rest-bar"><span>Rest <strong id="rest-left">${clock(restLeft())}</strong></span>
      <button class="secondary small-btn" data-action="rest-add">+30s</button>
      <button class="small-btn" data-action="rest-skip">Skip</button></div>` : ""}
  `;
}

// Swap: 3-5 alternatives for the same muscle, filtered by what you have right now.
function swapOptions(cur) {
  const f = fit();
  return EXERCISES.filter((x) => x.id !== cur.id && !f.avoid.includes(x.id) && x.groups[0] === cur.groups[0] &&
      (swapCtx !== "busy" || !x.equip.some((q) => cur.equip.includes(q))) &&
      (swapCtx !== "home" || x.where !== "gym"))
    .sort((a, b) => (f.favs.includes(b.id) - f.favs.includes(a.id)) ||
      (b.muscles.filter((m) => cur.muscles.includes(m)).length - a.muscles.filter((m) => cur.muscles.includes(m)).length))
    .slice(0, 5);
}

function swapScreen(a) {
  const cur = exById(a.exercises[a.exIndex].ex);
  const opts = swapOptions(cur);
  return `
    ${topBar(`<button class="circ" data-action="swap-close" aria-label="Back">${icon("back")}</button>`)}
    ${headline("Swap", esc(cur.name))}
    <p class="sub">Same muscles (${esc(cur.groups[0])}), sets and reps stay the same.</p>
    <div class="seg">${[["same", "Anything"], ["busy", "Machine busy"], ["home", "At home"]].map(([k, l]) =>
      `<button class="${swapCtx === k ? "on" : ""}" data-action="swap-ctx" data-ctx="${k}">${l}</button>`).join("")}</div>
    <div class="card" style="padding:6px 12px">${opts.map((x) => exerciseRowHTML(x, `data-action="swap-pick"`)).join("") || `<p class="muted">No swaps for that. Try "Anything".</p>`}</div>
  `;
}

function summaryScreen(id) {
  const wk = workoutById(id);
  if (!wk) return `${topBar(backBtn("#fitness/history"))}<p>Workout not found.</p>`;
  const sets = wk.exercises.reduce((n, e) => n + doneSets(e).length, 0);
  const pbs = wk.exercises.filter((e) => e.sets.some((s) => s.pb));
  const mins = wk.start && wk.end ? Math.round((wk.end - wk.start) / 60000) : null;
  if (celebrateNext) { celebrateNext = false; setTimeout(confettiBurst, 200); }
  return `
    ${headline("Workout", "done")}
    <p class="sub">${esc(wk.name)} · ${niceDate(wk.date)}</p>
    <div class="stat-row">
      <div class="stat"><span class="big-number">${sets}</span><span class="small">sets</span></div>
      <div class="stat"><span class="big-number">${wk.exercises.length}</span><span class="small">exercises</span></div>
      <div class="stat"><span class="big-number">${mins ?? "-"}</span><span class="small">minutes</span></div>
    </div>
    ${pbs.length ? `<div class="card notice col"><p class="label" style="margin:0 0 6px">Personal bests</p>${pbs.map((e) => {
      const ex = exById(e.ex);
      const top = Math.max(...e.sets.filter((s) => s.pb).map((s) => Number(ex.unit ? s.w : s.r)));
      return `<p style="margin:0 0 4px">${esc(ex.name)}: <strong>${top}${ex.unit ? " " + ex.unit : " " + ex.repsLabel}</strong></p>`;
    }).join("")}</div>` : ""}
    <div class="card">${wk.exercises.map((e) => {
      const ex = exById(e.ex) || { name: e.ex };
      return `<p style="margin:0 0 6px"><strong>${esc(ex.name)}</strong> ${e.rating ? `<span class="tag">${e.rating}</span>` : ""}<br>
        <span class="small muted">${doneSets(e).map((s) => `${s.w ? s.w + "×" : ""}${s.r}`).join(", ") || "no sets"}</span></p>`;
    }).join("")}</div>
    <a class="btn full dark" href="#fitness/plan">Back to my week</a>
    <a class="btn full" href="#wlog/${wk.id}">Edit this workout</a>
  `;
}

function historyScreen() {
  const list = fit().workouts.slice().sort(byDate).reverse();
  return `
    ${fit().active ? `<a class="btn full dark" href="#train">${icon("play")} Back to workout in progress</a>` : ""}
    ${list.length ? list.map((w) => {
      const sets = w.exercises.reduce((n, e) => n + doneSets(e).length, 0);
      const pbs = w.exercises.reduce((n, e) => n + e.sets.filter((s) => s.pb).length, 0);
      const mins = w.start && w.end ? Math.round((w.end - w.start) / 60000) : null;
      return `<a class="card" href="#wlog/${w.id}" style="display:block;text-decoration:none;color:inherit">
          <div class="row between"><h3>${esc(w.name)}</h3><span class="small muted">${niceDate(w.date)}</span></div>
          <p class="small muted" style="margin:0">${sets} sets · ${w.exercises.length} exercises${mins ? ` · ${mins} min` : ""}${pbs ? ` · ${pbs} PB${pbs > 1 ? "s" : ""}` : ""}</p>
        </a>`;
    }).join("") : `<p class="muted">No workouts logged yet. Start one from your plan.</p>`}
  `;
}

// Edit a past workout: every set, weight and rep can be changed.
function workoutLogScreen(id) {
  const wk = workoutById(id);
  if (!wk) return `${topBar(backBtn("#fitness/history"))}<p>Workout not found.</p>`;
  return `
    ${topBar(backBtn("#fitness/history"), `<button class="circ" data-action="wlog-delete" data-id="${id}" aria-label="Delete workout">${icon("x")}</button>`)}
    ${headline("Edit", "workout")}
    <div class="card">
      <label class="field">Name<input data-wlog="${id}" data-field="name" value="${esc(wk.name)}"></label>
      <label class="field">Date<input type="date" data-wlog="${id}" data-field="date" value="${wk.date}"></label>
    </div>
    ${wk.exercises.map((e, ei) => {
      const ex = exById(e.ex) || { name: e.ex, unit: "", repsLabel: "reps" };
      return `<div class="card">
          <div class="row between"><strong>${esc(ex.name)}</strong>
            <button class="ghost" data-action="wlog-remove-ex" data-id="${id}" data-e="${ei}" aria-label="Remove">${icon("x")}</button></div>
          ${e.sets.map((s, si) => `<div class="set-row ${s.done ? "done" : ""}">
              <span class="set-n">${s.pb ? icon("star", "inline fav") : si + 1}</span>
              ${ex.unit ? `<input type="number" inputmode="decimal" data-wlog="${id}" data-e="${ei}" data-s="${si}" data-field="w" value="${esc(s.w)}" aria-label="Weight">` : "<span></span>"}
              <input class="rbox" type="number" inputmode="numeric" data-wlog="${id}" data-e="${ei}" data-s="${si}" data-field="r" value="${esc(s.r)}" aria-label="${ex.repsLabel}">
              <button class="set-tick ${s.done ? "on" : ""}" data-action="wlog-set" data-id="${id}" data-e="${ei}" data-s="${si}" aria-label="Set done">${icon("check")}</button>
            </div>`).join("")}
          <button class="ghost small-btn" data-action="wlog-addset" data-id="${id}" data-e="${ei}">+ Add set</button>
          ${e.note ? `<p class="small muted"> ${esc(e.note)}</p>` : ""}
        </div>`;
    }).join("")}
    <a class="btn ghost full" href="#pickex/wlog/${id}">+ Add an exercise you did</a>
    <label class="field">Workout notes<textarea data-wlog="${id}" data-field="notes" rows="2">${esc(wk.notes || "")}</textarea></label>
  `;
}

SCREENS.train = trainScreen;
SCREENS.wlog = workoutLogScreen;


// ---------- 5. Buttons ----------
function activeEx() { const a = fit().active; return a.exercises[a.exIndex]; }

Object.assign(ACTIONS, {
  "start-session"({ id }) { startWorkout(id); },

  "train-go"({ i }) {
    fit().active.exIndex = Number(i);
    saveData();
    window.scrollTo(0, 0);
    render();
  },

  "train-step"({ s, dir }) {
    const e = activeEx();
    const ex = exById(e.ex);
    const set = e.sets[Number(s)];
    set.w = Math.max(0, Math.round(((Number(set.w) || 0) + Number(dir) * (ex.step || 2.5)) * 10) / 10);
    saveData();
    render();
  },

  // Tick a set: checks for a personal best and starts the rest timer.
  "train-set"({ s }) {
    const a = fit().active;
    const e = activeEx();
    const ex = exById(e.ex) || { unit: "" };
    const set = e.sets[Number(s)];
    set.done = !set.done;
    set.pb = false;
    if (set.done) {
      const value = Number(ex.unit && Number(set.w) ? set.w : set.r) || 0;
      const best = bestFor(e.ex, a.id);
      const usesWeight = exerciseHistory(e.ex, a.id).some((h) => h.byWeight);
      const sameKind = (ex.unit && Number(set.w) ? true : false) === usesWeight;
      const earlierToday = e.sets.some((x, i) => i !== Number(s) && x.pb);
      if (best > 0 && sameKind && value > best && !earlierToday) {
        set.pb = true;
        toast(`New personal best: ${value}${ex.unit && Number(set.w) ? " " + ex.unit : ""}`);
        confettiBurst();
      }
      const lastSet = Number(s) === e.sets.length - 1 && a.exIndex === a.exercises.length - 1;
      if (e.target.rest > 0 && !lastSet) a.rest = { endsAt: Date.now() + e.target.rest * 1000 };
      try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (err) {}
    } else a.rest = null;
    saveData();
    render();
  },

  "train-addset"() {
    const e = activeEx();
    const prev = e.sets[e.sets.length - 1] || { w: "", r: e.target.reps };
    e.sets.push({ w: prev.w, r: prev.r, done: false, lastW: null, lastR: null });
    saveData();
    render();
  },

  "train-delset"() { activeEx().sets.pop(); saveData(); render(); },
  "train-rate"({ r }) { const e = activeEx(); e.rating = e.rating === r ? null : r; saveData(); render(); },
  "train-finish"() { finishWorkout(); },

  "train-discard"() {
    if (!confirm("Discard this workout? Nothing from it will be saved.")) return;
    fit().active = null;
    saveData();
    location.hash = "#fitness/plan";
  },

  "rest-add"() { fit().active.rest.endsAt += 30000; saveData(); render(); },
  "rest-skip"() { fit().active.rest = null; saveData(); render(); },

  "swap-open"() { swapOpen = true; swapCtx = "same"; render(); },
  "swap-close"() { swapOpen = false; render(); },
  "swap-ctx"({ ctx }) { swapCtx = ctx; render(); },
  "swap-pick"({ ex }) {
    const a = fit().active;
    const old = a.exercises[a.exIndex];
    a.exercises[a.exIndex] = prefill({ ex, sets: old.target.sets, reps: old.target.reps, rest: old.target.rest }, a.date, a.id);
    swapOpen = false;
    saveData();
    toast(`Swapped to ${exById(ex).name}`);
    render();
  },

  "wlog-set"({ id, e, s }) {
    const set = workoutById(id).exercises[Number(e)].sets[Number(s)];
    set.done = !set.done;
    saveData();
    render();
  },
  "wlog-addset"({ id, e }) {
    const sets = workoutById(id).exercises[Number(e)].sets;
    const prev = sets[sets.length - 1] || { w: "", r: 10 };
    sets.push({ w: prev.w, r: prev.r, done: true });
    saveData();
    render();
  },
  "wlog-remove-ex"({ id, e }) {
    if (!confirm("Remove this exercise from the workout?")) return;
    workoutById(id).exercises.splice(Number(e), 1);
    saveData();
    render();
  },
  "wlog-delete"({ id }) {
    if (!confirm("Delete this workout? The session stays ticked as done.")) return;
    fit().workouts = fit().workouts.filter((w) => w.id !== id);
    Object.values(fit().weeks).forEach((w) => Object.values(w.days).forEach((l) => l.forEach((s) => { if (s.workoutId === id) delete s.workoutId; })));
    saveData();
    location.hash = "#fitness/history";
  }
});

// Typing weights, reps and notes saves straight away (no need to press save).
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset.tw && fit().active) {
    activeEx().sets[Number(el.dataset.s)][el.dataset.tw] = el.value;
    saveData();
  }
  if (el.dataset.trainNote !== undefined && fit().active) { activeEx().note = el.value; saveData(); }
});

document.addEventListener("change", (e) => {
  const el = e.target;
  if (!el.dataset.wlog) return;
  const wk = workoutById(el.dataset.wlog);
  const f = el.dataset.field;
  if (el.dataset.e !== undefined) wk.exercises[Number(el.dataset.e)].sets[Number(el.dataset.s)][f] = el.value;
  else if (f === "date" && el.value && el.value !== wk.date) {
    // Moving a workout to another day moves its session too.
    const old = Object.entries(fit().weeks).flatMap(([m, w]) => Object.values(w.days).flatMap((l) => l.filter((s) => s.workoutId === wk.id)));
    wk.date = el.value;
    old.forEach((s) => moveSession(s.id, el.value));
  } else wk[f] = el.value;
  saveData();
  toast("Saved");
});

// One-off repair: gym workouts logged on a session that was still a run, walk,
// surf, rest or posture day were counted as that. Count them as gym instead.
(function repairLoggedTypes() {
  const f = fit();
  if (f.typesFixed) return;
  Object.values(f.weeks).forEach((w) => Object.values(w.days).forEach((list) => list.forEach((s) => {
    const wk = s.status === "done" && s.workoutId && workoutById(s.workoutId);
    const info = typeInfo(s.type);
    const lifted = wk && liftingType(wk);
    if (lifted && (info.cardio || info.care || s.type === "rest")) s.type = lifted;
  })));
  f.typesFixed = true;
  saveData();
})();
