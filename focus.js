// =====================================================================
// FOCUS (Stage 6): brain dump inbox and focus timer
// Sections:
//   1. Brain dump helpers
//   2. Focus timer helpers (sprints, streak, celebration)
//   3. Screens (Brain dump, Timer, the Home screen card)
//   4. Buttons
// =====================================================================


// ---------- 1. Brain dump helpers ----------
// Each item: { id, text, list: "inbox" | "today" | "week" | "later", done }
const DUMP_LISTS = [
  { id: "today", label: "Today", emoji: "☀️" },
  { id: "week", label: "This week", emoji: "📅" },
  { id: "later", label: "Later", emoji: "🌙" }
];

function dumpItems(list) { return data.inbox.filter((i) => i.list === list); }

function addDumpText(text) {
  // Pasting several lines adds one item per line.
  const lines = text.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  lines.forEach((line, n) => data.inbox.push({ id: "d-" + Date.now() + "-" + n, text: line, list: "inbox", done: false }));
  if (lines.length) setTick(todayKey(), "brain-dump", true);   // counts as today's brain dump habit
  return lines.length;
}


// ---------- 2. Focus timer helpers ----------
// The timer stores when it will finish, so it keeps time even if you
// lock your phone or switch apps.
const SPRINTS = [5, 15, 25];
let focusMins = 25;

function timerLeft() {
  const t = data.focus.running;
  if (!t) return null;
  if (t.paused !== undefined) return t.paused;
  return Math.max(0, Math.round((t.endsAt - Date.now()) / 1000));
}

function clock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// Days with at least one finished sprint. Same kind rule as your workout
// streak: one missed day is fine, two in a row starts it again.
function focusStreak() {
  const days = new Set(data.focus.sessions.map((s) => s.date));
  let key = todayKey(), streak = 0, missed = 0;
  if (!days.has(key)) key = addDays(key, -1);
  for (let i = 0; i < 400; i++) {
    if (days.has(key)) { streak++; missed = 0; }
    else if (++missed >= 2) break;
    key = addDays(key, -1);
  }
  return streak;
}

// Friendly wording: never shows a "0-day" streak.
function streakText() {
  const n = focusStreak();
  return n ? `🔥 ${n}-day focus streak` : "🌱 Start your focus streak today";
}

function minutesOn(key) {
  return data.focus.sessions.filter((s) => s.date === key).reduce((sum, s) => sum + s.mins, 0);
}

// Keeps the screen on during a sprint (where the phone allows it).
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && navigator.wakeLock) wakeLock = await navigator.wakeLock.request("screen");
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { /* not supported: no problem */ }
}

// A soft two-note chime.
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

function finishSprint() {
  const mins = data.focus.running.mins;
  data.focus.sessions.push({ date: todayKey(), mins });
  data.focus.running = null;
  setTick(todayKey(), "focus-sprint", true);   // counts as today's focus habit
  saveData();
  keepAwake(false);
  chime();
  if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
  celebrate(mins);
  render();
}

// The little party at the end of a sprint.
function celebrate(mins) {
  const layer = document.createElement("div");
  layer.className = "celebrate";
  layer.innerHTML = `
    ${Array.from({ length: 28 }, (_, i) => `<span class="confetti" style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.8).toFixed(2)}s">${["🎉", "🌊", "⭐", "🌴", "💛", "🐚"][i % 6]}</span>`).join("")}
    <div class="celebrate-card">
      <div style="font-size:56px">🎉</div>
      <h2>Sprint done!</h2>
      <p>${mins} minutes of focus. ${cheer()}</p>
      <p class="small muted">${streakText()}</p>
      <button class="full" data-action="close-celebrate">Yay!</button>
    </div>`;
  document.body.appendChild(layer);
}

// Checks the timer every second: updates the clock and finishes the sprint.
setInterval(() => {
  const left = timerLeft();
  if (left === null) return;
  const el = document.getElementById("timer-display");
  if (el) el.textContent = clock(left);
  if (left === 0 && data.focus.running.paused === undefined) finishSprint();
}, 1000);


// ---------- 3. Screens ----------
function focusScreen(sub = "dump") {
  const tabs = [["dump", "Brain dump"], ["timer", "Focus timer"]];
  return `
    <h1>Focus 🎯</h1>
    <p class="sub">Clear your head, then one small sprint.</p>
    <nav class="subtabs">
      ${tabs.map(([t, label]) => `<a href="#focus/${t}" class="${(sub || "dump") === t ? "on" : ""}">${label}</a>`).join("")}
    </nav>
    ${sub === "timer" ? timerScreen() : dumpScreen()}`;
}

function dumpScreen() {
  const inbox = dumpItems("inbox");
  return `
    <div class="card soft">
      <label class="field">What's on your mind?
        <textarea id="dump-input" rows="3" placeholder="Type anything. One thing per line."></textarea></label>
      <button class="full" data-action="dump-add">Add to inbox</button>
    </div>

    ${inbox.length ? `<div class="card">
      <div class="row between"><h2>Inbox 📥</h2><span class="pill">${inbox.length}</span></div>
      <p class="small muted">Sort each one: when will you do it?</p>
      ${inbox.map((i) => `<div class="dump-item">
          <div class="row between"><span>${esc(i.text)}</span>
            <button class="ghost" data-action="dump-delete" data-id="${i.id}" aria-label="Delete">✕</button></div>
          <div class="row" style="gap:6px">
            ${DUMP_LISTS.map((l) => `<button class="secondary small-btn grow" data-action="dump-move" data-id="${i.id}" data-list="${l.id}">${l.label}</button>`).join("")}
          </div>
        </div>`).join("")}
    </div>` : ""}

    ${DUMP_LISTS.map((l) => {
      const items = dumpItems(l.id);
      if (!items.length) return "";
      const open = items.filter((i) => !i.done).length;
      return `<div class="card">
          <div class="row between"><h2>${l.label} ${l.emoji}</h2>
            <button class="small-btn secondary" data-action="dump-copy" data-list="${l.id}">📋 Copy</button></div>
          <p class="small muted">${open} to do</p>
          ${items.map((i) => `<div class="row">
              <button class="tick ${i.done ? "on" : ""}" data-action="dump-done" data-id="${i.id}"><span class="box"></span><span class="label">${esc(i.text)}</span></button>
              <button class="ghost" data-action="dump-move" data-id="${i.id}" data-list="inbox" aria-label="Back to inbox">↩︎</button>
            </div>`).join("")}
        </div>`;
    }).join("")}

    ${data.inbox.some((i) => i.done) ? `<button class="ghost full" data-action="dump-clear">Clear finished items</button>` : ""}
    <p class="small muted">"Copy" copies the items not yet done, one per line, ready to paste into Minimalist.</p>
  `;
}

function timerScreen() {
  const left = timerLeft();
  const t = data.focus.running;
  const today = todayKey();
  const todayMins = minutesOn(today);
  const weekSprints = data.focus.sessions.filter((s) => s.date >= mondayOf(today)).length;
  const todayList = dumpItems("today").filter((i) => !i.done);

  return `
    <div class="card timer-card">
      ${t ? "" : `<div class="seg" role="group" aria-label="Sprint length">
        ${SPRINTS.map((m) => `<button class="${focusMins === m ? "on" : ""}" data-action="focus-length" data-mins="${m}">${m} min</button>`).join("")}
      </div>`}
      <div id="timer-display" class="timer">${clock(left === null ? focusMins * 60 : left)}</div>
      <p class="muted" style="text-align:center">${t ? (t.paused !== undefined ? "Paused" : "You've got this. One thing at a time.") : "Pick one thing and start."}</p>
      ${t ? `<div class="row">
          <button class="grow" data-action="focus-pause">${t.paused !== undefined ? "Resume" : "Pause"}</button>
          <button class="secondary" data-action="focus-stop">Stop</button>
        </div>` : `<button class="full" data-action="focus-start">Start ${focusMins} min sprint</button>`}
    </div>

    <div class="card soft">
      <p style="margin:0"><strong>${streakText()}</strong></p>
      <p class="small" style="margin:4px 0 0">Today: ${todayMins} min · This week: ${weekSprints} sprint${weekSprints === 1 ? "" : "s"}</p>
    </div>

    ${todayList.length ? `<div class="card">
      <h3>From your Today list</h3>
      ${todayList.slice(0, 5).map((i) => `<p style="margin:0 0 6px">• ${esc(i.text)}</p>`).join("")}
    </div>` : ""}

    <p class="small muted">Locking your phone is fine: the timer keeps going and your celebration will be waiting.</p>
  `;
}

// Small Focus card for the Home screen (only once you've used it).
function focusHomeHTML() {
  const running = data.focus.running;
  const today = dumpItems("today").filter((i) => !i.done).length;
  const inbox = dumpItems("inbox").length;
  if (!running && !today && !inbox && !data.focus.sessions.length) return "";
  return `<a class="card" href="#focus/${running ? "timer" : "dump"}" style="display:block;text-decoration:none;color:inherit">
      <div class="row between"><h2>Focus 🎯</h2><span class="muted small">Open ›</span></div>
      ${running ? `<p style="margin:0 0 4px"><strong>Sprint in progress</strong></p>` : ""}
      <p style="margin:0">${streakText()}${today ? ` · ${today} on today's list` : ""}${inbox ? ` · ${inbox} to sort` : ""}</p>
    </a>`;
}

SCREENS.focus = focusScreen;


// ---------- 4. Buttons ----------
Object.assign(ACTIONS, {
  "dump-add"() {
    const box = document.getElementById("dump-input");
    const n = addDumpText(box.value);
    if (!n) return toast("Type something first.");
    saveData();
    toast(n === 1 ? "Added. Head feels lighter already 💛" : `Added ${n} things 💛`);
    render();
    document.getElementById("dump-input").focus();
  },

  "dump-move"({ id, list }) {
    const item = data.inbox.find((i) => i.id === id);
    item.list = list;
    item.done = false;
    saveData();
    render();
  },

  "dump-done"({ id }) {
    const item = data.inbox.find((i) => i.id === id);
    item.done = !item.done;
    if (item.done) toast(cheer());
    saveData();
    render();
  },

  "dump-delete"({ id }) {
    data.inbox = data.inbox.filter((i) => i.id !== id);
    saveData();
    render();
  },

  "dump-clear"() {
    data.inbox = data.inbox.filter((i) => !i.done);
    saveData();
    render();
  },

  "dump-copy"({ list }) {
    const lines = dumpItems(list).filter((i) => !i.done).map((i) => i.text);
    if (!lines.length) return toast("All done here 🎉");
    copyText(lines.join("\n"));
  },

  "focus-length"({ mins }) {
    focusMins = Number(mins);
    render();
  },

  "focus-start"() {
    data.focus.running = { mins: focusMins, endsAt: Date.now() + focusMins * 60000 };
    saveData();
    keepAwake(true);
    // Waking up the sound now (while you tap) lets the chime play at the end.
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) {}
    render();
  },

  "focus-pause"() {
    const t = data.focus.running;
    if (t.paused !== undefined) { t.endsAt = Date.now() + t.paused * 1000; delete t.paused; keepAwake(true); }
    else { t.paused = timerLeft(); keepAwake(false); }
    saveData();
    render();
  },

  "focus-stop"() {
    if (!confirm("Stop this sprint? It won't count, but that's totally fine.")) return;
    data.focus.running = null;
    saveData();
    keepAwake(false);
    render();
  },

  "close-celebrate"() {
    document.querySelectorAll(".celebrate").forEach((el) => el.remove());
  }
});

// Press Enter in the brain dump box to add (Shift+Enter for a new line).
document.addEventListener("keydown", (e) => {
  if (e.target.id === "dump-input" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    ACTIONS["dump-add"]();
  }
});
