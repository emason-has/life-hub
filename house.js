// =====================================================================
// HOUSE (Stage 4): cleaning tracker
// Sections:
//   1. Status helpers (green / amber / red)
//   2. Thursday clean and the 15-minute blitz
//   3. Screens (Today, All tasks, edit a task, the Home screen card)
//   4. Buttons
// The default tasks are in data.js (CLEANING_TASKS).
// =====================================================================


// ---------- 1. Status helpers ----------
// green = all good, amber = due soon (or today), red = overdue.
// "new" = no date yet: never counted as overdue, so nothing starts red.
function choreStatus(c) {
  if (!c.lastDone) return { level: "new", text: "No date yet. Tap Done next time you do it", score: 0.5 };
  const since = daysBetween(c.lastDone, todayKey());
  const left = c.every - since;
  const soon = Math.max(1, Math.round(c.every * 0.2));   // amber window: about the last 20%
  const score = since / c.every;                          // bigger = more overdue
  if (left < 0) return { level: "red", text: `${-left} day${left === -1 ? "" : "s"} overdue`, score };
  if (left === 0) return { level: "amber", text: "Due today", score };
  if (left <= soon) return { level: "amber", text: `Due in ${left} day${left === 1 ? "" : "s"}`, score };
  return { level: "green", text: `All good · next ${niceDate(addDays(c.lastDone, c.every)).slice(4)}`, score };
}

function freqLabel(days) {
  const f = FREQUENCIES.find((x) => x.days === Number(days));
  return f ? f.label : `Every ${days} days`;
}

function findChore(id) { return data.chores.find((c) => c.id === id); }
function doneToday(c) { return c.lastDone === todayKey(); }

// Due soon or overdue, most overdue first.
function dueChores() {
  return data.chores
    .map((c) => ({ c, s: choreStatus(c) }))
    .filter(({ s }) => s.level === "red" || s.level === "amber")
    .sort((a, b) => b.s.score - a.s.score)
    .map(({ c }) => c);
}


// ---------- 2. Thursday clean and the 15-minute blitz ----------
function nextThursday() {
  const today = todayKey();
  const day = fromKey(today).getDay();          // Thursday = 4
  return addDays(today, (4 - day + 7) % 7);
}

// Picks a few quick tasks (10 min or less each) that fit in 15 minutes, most due first.
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
function houseScreen(sub = "today", id) {
  if (sub === "edit") return choreForm(id);
  const tabs = [["today", "Today"], ["all", "All tasks"]];
  return `
    <h1>House 🧽</h1>
    <p class="sub">A little at a time keeps it all easy.</p>
    <nav class="subtabs">
      ${tabs.map(([t, label]) => `<a href="#house/${t}" class="${(sub || "today") === t ? "on" : ""}">${label}</a>`).join("")}
    </nav>
    ${sub === "all" ? allChoresScreen() : houseToday()}`;
}

function choreRow(c) {
  const s = choreStatus(c);
  const done = doneToday(c);
  return `<div class="chore">
      <span class="dot ${s.level}" aria-label="${s.level}"></span>
      <a class="grow chore-info" href="#house/edit/${c.id}">
        <strong>${esc(c.name)}</strong><br>
        <span class="small muted">${esc(c.room)} · ${done ? "Done today ✨" : s.text}</span>
      </a>
      <button class="small-btn ${done ? "secondary" : ""}" data-action="chore-done" data-id="${c.id}">${done ? "✓ Done" : "Done"}</button>
    </div>`;
}

function houseToday() {
  const all = data.chores.map(choreStatus);
  const count = (lvl) => all.filter((s) => s.level === lvl).length;
  const isThu = dayName(todayKey()) === "Thu";
  // Thursday's list: everything due, plus anything you've already ticked today.
  const thursday = data.chores.filter((c) => doneToday(c) || ["red", "amber"].includes(choreStatus(c).level))
    .sort((a, b) => doneToday(a) - doneToday(b) || choreStatus(b).score - choreStatus(a).score);
  const left = thursday.filter((c) => !doneToday(c)).length;
  const newCount = count("new");
  if (blitzIds) blitzIds = blitzIds.filter((id) => findChore(id));

  return `
    <div class="row wrap" style="gap:8px;margin-bottom:14px">
      <span class="pill"><span class="dot red"></span> ${count("red")} overdue</span>
      <span class="pill"><span class="dot amber"></span> ${count("amber")} due soon</span>
      <span class="pill"><span class="dot green"></span> ${count("green")} all good</span>
    </div>

    ${newCount > 3 ? `<div class="card warm">
      <h3>Quick setup</h3>
      <p class="small">${newCount} tasks don't have a "last done" date yet. Tap a task to set roughly when you last did it, or start fresh with everything marked as done today.</p>
      <button class="full secondary" data-action="chores-fresh">Start fresh (all done today)</button>
    </div>` : ""}

    <div class="card ${isThu ? "today" : ""}">
      <div class="row between">
        <h2>${isThu ? "Today's clean" : "Thursday clean"}</h2>
        <span class="pill">${isThu ? "Today" : niceDate(nextThursday()).slice(0, 10)}</span>
      </div>
      <p class="small muted">${isThu ? "Most overdue first. Do what you can, it all counts." : "What's due right now, most overdue first."}</p>
      ${thursday.length ? thursday.map(choreRow).join("") : `<p>Nothing due. The house is happy ✨</p>`}
      ${thursday.length && !left ? `<p class="saved-flag" style="margin-top:8px">All done! Lovely work ✨</p>` : ""}
    </div>

    <div class="card soft">
      <h2>⚡ 15-minute blitz</h2>
      <p class="small">Low energy? I'll pick a few quick tasks that fit in 15 minutes.</p>
      ${blitzIds && blitzIds.length ? blitzIds.map(findChore).map(choreRow).join("") : ""}
      ${blitzIds && !blitzIds.length ? `<p>Nothing quick left to do. Put your feet up 🌴</p>` : ""}
      <button class="full ${blitzIds ? "secondary" : ""}" data-action="blitz" style="margin-top:8px">${blitzIds ? "Pick again" : "Start a blitz"}</button>
    </div>
  `;
}

function allChoresScreen() {
  const groups = [...new Set(data.chores.map((c) => Number(c.every)))].sort((a, b) => a - b);
  return `
    <a class="btn full" href="#house/edit" style="margin-bottom:14px">+ Add a task</a>
    ${groups.map((days) => `<div class="card">
        <h2>${freqLabel(days)}</h2>
        ${data.chores.filter((c) => Number(c.every) === days).map(choreRow).join("")}
      </div>`).join("")}
    <p class="small muted">Tap a task to change its name, room, how often, or when you last did it.</p>
  `;
}

function choreForm(id) {
  const c = findChore(id) || { name: "", room: "", every: 7, mins: 10, lastDone: "" };
  const options = FREQUENCIES.some((f) => f.days === Number(c.every)) ? FREQUENCIES : [...FREQUENCIES, { days: c.every, label: freqLabel(c.every) }];
  return `
    <a class="back" href="#house/all">‹ All tasks</a>
    <h1>${id ? "Edit task" : "Add a task"}</h1>
    <div class="card">
      <label class="field">Task<input id="c-name" value="${esc(c.name)}" placeholder="e.g. Clean bathroom"></label>
      <label class="field">Room<input id="c-room" value="${esc(c.room)}" placeholder="e.g. Bathroom"></label>
      <label class="field">How often
        <select id="c-every">${options.map((f) => `<option value="${f.days}" ${Number(c.every) === f.days ? "selected" : ""}>${f.label}</option>`).join("")}</select></label>
      <label class="field">About how long (minutes)<input id="c-mins" type="number" inputmode="numeric" min="1" value="${esc(c.mins)}"></label>
      <label class="field">Last done<input id="c-last" type="date" value="${esc(c.lastDone || "")}"></label>
    </div>
    <button class="full" data-action="chore-save" data-id="${id || ""}" style="margin-bottom:10px">Save</button>
    ${id ? `<button class="full secondary" data-action="chore-delete" data-id="${id}">Delete task</button>` : ""}
  `;
}

// The cleaning card on the Home screen: overdue tasks first.
function cleaningHomeHTML() {
  const due = dueChores();
  const red = due.filter((c) => choreStatus(c).level === "red");
  const amber = due.length - red.length;
  const show = red.slice(0, 4);
  return `<div class="card">
      <div class="row between"><h2>Cleaning 🧽</h2><a class="muted small" href="#house" style="text-decoration:none">Open ›</a></div>
      ${show.length ? show.map(choreRow).join("") : `<p>${amber ? `Nothing overdue. ${amber} due soon.` : "All caught up ✨"}</p>`}
      ${red.length > show.length ? `<p class="small muted" style="margin-top:6px">and ${red.length - show.length} more</p>` : ""}
    </div>`;
}

SCREENS.house = houseScreen;


// ---------- 4. Buttons ----------
Object.assign(ACTIONS, {
  // Tap Done to reset the task. Tap again the same day to undo.
  "chore-done"({ id }) {
    const c = findChore(id);
    const today = todayKey();
    if (doneToday(c)) {
      c.lastDone = c.prevDone || null;
      delete c.prevDone;
    } else {
      c.prevDone = c.lastDone;
      c.lastDone = today;
      toast(cheer());
      // Finished everything on a Thursday? That's your Thursday clean ticked.
      if (dayName(today) === "Thu" && !dueChores().length) {
        setTick(today, "thu-tidy", true);
        toast("Thursday clean done! 🎉");
      }
    }
    saveData();
    render();
  },

  blitz() {
    pickBlitz(blitzIds || []);
    render();
  },

  "chores-fresh"() {
    if (!confirm("Mark every task without a date as done today?")) return;
    data.chores.forEach((c) => { if (!c.lastDone) c.lastDone = todayKey(); });
    saveData();
    render();
  },

  "chore-save"({ id }) {
    const val = (f) => document.getElementById(f).value.trim();
    if (!val("c-name")) return toast("Give the task a name first.");
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
    toast("Saved ✓");
    location.hash = "#house/all";
  },

  "chore-delete"({ id }) {
    if (!confirm("Delete this task?")) return;
    data.chores = data.chores.filter((c) => c.id !== id);
    saveData();
    location.hash = "#house/all";
  }
});
