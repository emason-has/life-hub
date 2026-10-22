// =====================================================================
// HOUSE: cleaning that fits a busy week
// Sections:
//   1. Status helpers (when each job is due, and "Later")
//   2. The 15-minute blitz
//   3. Screens (due this week, all jobs, edit a job, the Home widget)
//   4. Buttons and swiping
// The default jobs are in data.js (CLEANING_TASKS).
// =====================================================================


// ---------- 1. Status helpers ----------
// "new" = no date yet: never counted as overdue, so nothing starts late.
function choreStatus(c) {
  if (!c.lastDone) return { level: "new", text: "No date yet", tag: "New", score: 0.5 };
  const since = daysBetween(c.lastDone, todayKey());
  const left = c.every - since;
  const due = addDays(c.lastDone, c.every);
  const score = since / c.every;                          // bigger = more overdue
  if (left < 0) return { level: "late", text: `${-left} day${left === -1 ? "" : "s"} late`, tag: `${-left} day${left === -1 ? "" : "s"} late`, score, due };
  if (left === 0) return { level: "soon", text: "Due today", tag: "Today", score, due };
  if (left <= 6) return { level: "soon", text: `Due ${dayLong(due)}`, tag: dayName(due), score, due };
  return { level: "ok", text: `Next ${niceDate(due).slice(4)}`, tag: niceDate(due).slice(4), score, due };
}

function freqLabel(days) {
  const f = FREQUENCIES.find((x) => x.days === Number(days));
  return f ? f.label : `Every ${days} days`;
}

function findChore(id) { return data.chores.find((c) => c.id === id); }
function doneToday(c) { return c.lastDone === todayKey(); }

// "Later" hides a job until next Monday. It keeps its due date.
function isLater(c) { return !!c.laterUntil && c.laterUntil > todayKey(); }

// Jobs due by Sunday (or already late), most overdue first. Later jobs are left out.
function dueChores() {
  const sunday = addDays(mondayOf(todayKey()), 6);
  return data.chores
    .filter((c) => !isLater(c) && c.lastDone && addDays(c.lastDone, c.every) <= sunday)
    .sort((a, b) => choreStatus(b).score - choreStatus(a).score);
}


// ---------- 2. The 15-minute blitz ----------
// Picks a few quick jobs (10 min or less each) that fit in 15 minutes, most due first.
// "Pick again" moves the last picks to the back of the queue.
let blitzIds = null;
function pickBlitz(skip = []) {
  const quick = data.chores
    .filter((c) => c.mins <= 10 && !doneToday(c))
    .map((c) => ({ c, score: choreStatus(c).score + Math.random() * 0.1 - (skip.includes(c.id) ? 10 : 0) }))
    .sort((a, b) => b.score - a.score)
    .map(({ c }) => c);
  const picked = [];
  let total = 0;
  for (const c of quick) {
    if (total + c.mins <= 15) { picked.push(c.id); total += c.mins; }
  }
  blitzIds = picked;
}


// ---------- 3. Screens ----------
function houseScreen(sub = "due", id) {
  if (sub === "edit") return choreForm(id);
  if (sub === "all") return allChoresScreen();
  return houseDue();
}

// One job row: tap the circle when done, swipe left (or tap the clock) for Later.
function choreRow(c, withLater = true) {
  const s = choreStatus(c);
  const done = doneToday(c);
  return `<div class="job-wrap" ${withLater && !done ? `data-swipe="${c.id}"` : ""}>
      ${withLater && !done ? `<span class="job-under">Later</span>` : ""}
      <div class="job ${done ? "done" : ""}">
        <button class="circle-tick ${done ? "on" : ""}" data-action="chore-done" data-id="${c.id}" aria-label="${done ? "Undo" : "Done"}">${done ? icon("check") : ""}</button>
        <a class="grow job-name" href="#house/edit/${c.id}">${esc(c.name)}<span class="small muted block">${esc(c.room)} · ${c.mins} min</span></a>
        ${done ? `<span class="tag ok">Done</span>` : `<span class="tag ${s.level}">${s.tag}</span>`}
        ${withLater && !done ? `<button class="circ sm" data-action="chore-later" data-id="${c.id}" aria-label="Not this week">${icon("timer")}</button>` : ""}
      </div>
    </div>`;
}

function houseDue() {
  const due = dueChores();
  const doneNow = data.chores.filter((c) => doneToday(c) && !due.includes(c));
  const later = data.chores.filter(isLater);
  const newCount = data.chores.filter((c) => !c.lastDone).length;
  if (blitzIds) blitzIds = blitzIds.filter((id) => findChore(id));
  return `
    ${topBar(backBtn("#more"), `<a class="circ dark" href="#house/edit" aria-label="Add a job">${icon("plus")}</a>`)}
    ${headline("House", "due this week")}

    ${newCount > 3 ? `<div class="card notice col">
      <p style="margin:0 0 4px"><strong>Quick setup</strong></p>
      <p class="small muted" style="margin:0 0 10px">${newCount} jobs don't have a "last done" date. Start fresh, or set dates in All jobs.</p>
      <button class="dark" data-action="chores-fresh">Start fresh: all done today</button>
    </div>` : ""}

    ${due.length || doneNow.length ? due.concat(doneNow).map((c) => choreRow(c)).join("") : `<div class="card empty">${icon("check")}<span>Nothing due this week. The house is happy.</span></div>`}
    ${due.length ? `<p class="hint">Tap the circle when done. Swipe left (or tap ${icon("timer", "inline")}) to push a job to Later.</p>` : ""}

    <div class="chips" style="margin:6px 0 12px">
      <button class="chip ${blitzIds ? "on" : ""}" data-action="blitz">${blitzIds ? "Pick again" : "15-min blitz"}</button>
      <a class="chip" href="#house/all">All jobs</a>
    </div>
    ${blitzIds ? `<p class="label">15-minute blitz</p>${blitzIds.length ? blitzIds.map(findChore).map((c) => choreRow(c, false)).join("") : `<div class="card empty"><span>Nothing quick left. Put your feet up.</span></div>`}` : ""}

    ${later.length ? `<details class="card drop-card later-drawer">
      <summary class="li">${icon("timer", "tile")}<span class="grow"><strong>Later</strong><span class="small muted block">Back on Monday, or bring one back now</span></span><span class="num">${later.length}</span>${icon("down", "chev")}</summary>
      <div class="drop-body">${later.map((c) => `<div class="li tight"><span class="grow">${esc(c.name)}<span class="small muted block">${choreStatus(c).text}</span></span>
        <button class="sm" data-action="chore-back" data-id="${c.id}">Bring back</button></div>`).join("")}</div>
    </details>` : ""}
  `;
}

function allChoresScreen() {
  const groups = [...new Set(data.chores.map((c) => Number(c.every)))].sort((a, b) => a - b);
  return `
    ${topBar(backBtn("#house"), `<a class="circ dark" href="#house/edit" aria-label="Add a job">${icon("plus")}</a>`)}
    ${headline("All", "jobs")}
    ${groups.map((days) => `<p class="label">${freqLabel(days)}</p>
      <div class="card list-card">${data.chores.filter((c) => Number(c.every) === days).map((c) => {
        const s = choreStatus(c);
        return `<a class="li" href="#house/edit/${c.id}"><span class="grow">${esc(c.name)}<span class="small muted block">${esc(c.room)}${isLater(c) ? " · later" : ""}</span></span>
          <span class="tag ${s.level}">${s.tag}</span>${icon("chev", "chev")}</a>`;
      }).join("")}</div>`).join("")}
    <p class="hint">Tap a job to change it, or set when you last did it.</p>
  `;
}

function choreForm(id) {
  const c = findChore(id) || { name: "", room: "", every: 7, mins: 10, lastDone: "" };
  const options = FREQUENCIES.some((f) => f.days === Number(c.every)) ? FREQUENCIES : [...FREQUENCIES, { days: c.every, label: freqLabel(c.every) }];
  return `
    ${topBar(backBtn(id ? "#house" : "#house/all"), id ? `<button class="circ" data-action="chore-delete" data-id="${id}" aria-label="Delete job">${icon("x")}</button>` : "")}
    ${headline(id ? "Edit" : "Add a", "job")}
    <div class="card">
      <label class="field">Job<input id="c-name" value="${esc(c.name)}" placeholder="e.g. Clean bathroom"></label>
      <label class="field">Room<input id="c-room" value="${esc(c.room)}" placeholder="e.g. Bathroom"></label>
      <label class="field">How often
        <select id="c-every">${options.map((f) => `<option value="${f.days}" ${Number(c.every) === f.days ? "selected" : ""}>${f.label}</option>`).join("")}</select></label>
      <label class="field">About how long (minutes)<input id="c-mins" type="number" inputmode="numeric" min="1" value="${esc(c.mins)}"></label>
      <label class="field" style="margin-bottom:0">Last done<input id="c-last" type="date" value="${esc(c.lastDone || "")}"></label>
    </div>
    <button class="full dark" data-action="chore-save" data-id="${id || ""}">Save</button>
  `;
}

// The cleaning dropdown on Home.
function cleaningHomeHTML() {
  const due = dueChores();
  const late = due.filter((c) => choreStatus(c).level === "late").length;
  return `<details class="card drop-card">
      <summary class="li">${icon("sponge", "tile warm")}<span class="grow">Cleaning due</span>${due.length ? `<span class="num">${due.length}</span>` : `<span class="meta">All good</span>`}${icon("down", "chev")}</summary>
      <div class="drop-body">
        ${due.slice(0, 5).map((c) => choreRow(c)).join("") || `<p class="small muted" style="margin:0">Nothing due this week.</p>`}
        ${due.length > 5 ? `<p class="small muted">+${due.length - 5} more</p>` : ""}
        <a class="btn sm" href="#house" style="margin-top:6px">Open House${late ? ` · ${late} late` : ""}</a>
      </div>
    </details>`;
}

SCREENS.house = houseScreen;


// ---------- 4. Buttons and swiping ----------
Object.assign(ACTIONS, {
  // Tap the circle when done. Tap again the same day to undo.
  "chore-done"({ id }) {
    const c = findChore(id);
    if (doneToday(c)) {
      c.lastDone = c.prevDone || null;
      delete c.prevDone;
    } else {
      c.prevDone = c.lastDone;
      c.lastDone = todayKey();
      delete c.laterUntil;
      toast(cheer());
    }
    saveData();
    render();
  },

  // Not this week: hide until next Monday.
  "chore-later"({ id }) {
    findChore(id).laterUntil = addDays(mondayOf(todayKey()), 7);
    saveData();
    toast("Moved to Later");
    render();
  },

  "chore-back"({ id }) {
    delete findChore(id).laterUntil;
    saveData();
    render();
  },

  blitz() {
    pickBlitz(blitzIds || []);
    render();
  },

  "chores-fresh"() {
    if (!confirm("Mark every job without a date as done today?")) return;
    data.chores.forEach((c) => { if (!c.lastDone) c.lastDone = todayKey(); });
    saveData();
    render();
  },

  "chore-save"({ id }) {
    const val = (f) => document.getElementById(f).value.trim();
    if (!val("c-name")) return toast("Give the job a name first.");
    const chore = {
      id: id || "c-" + Date.now(),
      name: val("c-name"),
      room: val("c-room") || "Anywhere",
      every: Number(val("c-every")) || 7,
      mins: Number(val("c-mins")) || 10,
      lastDone: val("c-last") || null
    };
    const old = findChore(chore.id);
    if (old) Object.assign(old, chore); else data.chores.push(chore);
    saveData();
    toast("Saved");
    location.hash = "#house";
  },

  "chore-delete"({ id }) {
    if (!confirm("Delete this job?")) return;
    data.chores = data.chores.filter((c) => c.id !== id);
    saveData();
    location.hash = "#house/all";
  }
});

// Swipe a job left to push it to Later.
let swipe = null;
document.addEventListener("pointerdown", (e) => {
  const wrap = e.target.closest("[data-swipe]");
  if (!wrap || e.target.closest("button")) return;
  swipe = { wrap, row: wrap.querySelector(".job"), x: e.clientX, y: e.clientY, dx: 0, active: false };
});
document.addEventListener("pointermove", (e) => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (!swipe.active && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) swipe.active = true;
  if (!swipe.active) return;
  swipe.dx = Math.min(0, dx);
  swipe.row.style.transform = `translateX(${swipe.dx}px)`;
});
document.addEventListener("pointerup", () => {
  if (!swipe) return;
  const { wrap, row, dx } = swipe;
  swipe = null;
  if (dx < -10) swipedAt = Date.now();      // a swipe isn't a tap: don't open the job
  if (dx < -80) ACTIONS["chore-later"]({ id: wrap.dataset.swipe });
  else row.style.transform = "";
});
let swipedAt = 0;
document.addEventListener("click", (e) => {
  if (Date.now() - swipedAt < 400 && e.target.closest("[data-swipe]")) { e.preventDefault(); e.stopPropagation(); }
}, true);
document.addEventListener("pointercancel", () => {
  if (swipe) { swipe.row.style.transform = ""; swipe = null; }
});
