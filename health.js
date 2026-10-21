// =====================================================================
// APPLE HEALTH (via a Shortcut)
// Web apps can't read Apple Health directly, so a Shortcut on your iPhone
// copies your numbers, and the "Paste from Health" button reads them.
// Sections:
//   1. Reading what the Shortcut copied
//   2. Matching watch workouts to your weekly plan
//   3. Screens (Health screen, Home card)
//   4. Buttons
// =====================================================================


// ---------- 1. Reading what the Shortcut copied ----------
// The Shortcut copies text like:
//   LIFEHUB
//   steps: 8,123
//   resting: 58 count/min
//   weight: 72.4 kg
//   workouts: Traditional Strength Training
// Anything missing is fine. Numbers can have commas or units after them.
function firstNumber(text) {
  const m = String(text || "").replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// Sleep can arrive as "7.5", "7 hr 30 min", "7:30", "450" (minutes) or "26640" (seconds).
function readSleep(text) {
  const t = String(text || "").toLowerCase();
  const hm = t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h|:)\s*(\d+)?/);
  if (hm) return Math.round((Number(hm[1]) + (Number(hm[2]) || 0) / 60) * 10) / 10;
  const n = firstNumber(t);
  if (n === null) return null;
  if (n > 1440) return Math.round((n / 3600) * 10) / 10;   // seconds (e.g. 26640)
  return n > 24 ? Math.round((n / 60) * 10) / 10 : n;     // minutes (e.g. 444)
}

function readHealthText(text) {
  const out = { steps: null, sleep: null, resting: null, weight: null, workouts: "" };
  let found = false, inSteps = false;
  for (const line of String(text || "").split("\n")) {
    const m = line.match(/^\s*([a-z ]+?)\s*[:=]\s*(.*)$/i);
    if (!m) {
      // Steps sometimes arrive split over several lines ("0" then "2663"): add them up.
      const extra = firstNumber(line);
      if (inSteps && extra !== null) out.steps = (out.steps || 0) + extra;
      continue;
    }
    const key = m[1].toLowerCase().trim(), value = m[2].trim();
    inSteps = key.startsWith("step");
    if (inSteps) { out.steps = firstNumber(value); found = true; }
    else if (key.startsWith("sleep")) { out.sleep = readSleep(value); found = true; }
    else if (key.startsWith("rest") || key.includes("heart")) { out.resting = firstNumber(value); found = true; }
    else if (key.startsWith("weight")) { out.weight = firstNumber(value); found = true; }
    else if (key.startsWith("workout")) { out.workouts = value; found = true; }
  }
  return found ? out : null;
}


// ---------- 2. Matching watch workouts to your weekly plan ----------
// Words in the workout name, and what they count as.
const WATCH_WORKOUTS = [
  { kind: "gym", words: ["strength", "weight", "gym", "core", "hiit", "cross"] },
  { kind: "surf", words: ["surf", "water sport", "swim"] },
  { kind: "run", words: ["run"] },
  { kind: "light", words: ["yoga", "pilates", "mind", "flexibility", "barre", "cooldown"] },
  { kind: "walk", words: ["walk", "hik"] }
];

function workoutKinds(text) {
  const t = String(text || "").toLowerCase();
  return WATCH_WORKOUTS.filter((w) => w.words.some((word) => t.includes(word))).map((w) => w.kind);
}

// A watch workout marks that day's matching planned session as done
// (e.g. Tuesday's gym), or adds an extra session. See markWatchSession in fitness.js.

function stepGoal() { return Number(data.settings.stepGoal) || 8000; }


// ---------- 3. Screens ----------
let healthDraft = null;     // numbers waiting for you to check and save
let healthDay = "today";    // "today" or "yesterday"

function healthScreen() {
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), -i)).filter((k) => data.health[k]);
  const dash = (v, unit = "") => (v || v === 0) ? `${Number(v).toLocaleString()}${unit}` : "-";
  return `
    <a class="back" href="#home">‹ Home</a>
    <h1>Apple Health ❤️</h1>
    <p class="sub">Your watch numbers, pasted in with one tap.</p>

    ${healthDraft ? healthPreviewHTML() : `
      <button class="full" data-action="health-paste" style="margin-bottom:10px">📋 Paste from Health</button>
      <button class="full secondary" data-action="health-manual" style="margin-bottom:14px">Type numbers in</button>`}

    ${days.length ? `<div class="card">
      <h2>Last 7 days</h2>
      <div class="health-table">
        <span class="muted small">Day</span><span class="muted small">Steps</span><span class="muted small">Sleep</span><span class="muted small">Rest HR</span>
        ${days.map((k) => { const h = data.health[k]; return `
          <strong class="small">${niceDate(k).slice(0, 6)}</strong>
          <span class="${h.steps >= stepGoal() ? "goal-hit" : ""}">${dash(h.steps)}</span>
          <span>${dash(h.sleep, "h")}</span>
          <span>${dash(h.resting)}</span>`; }).join("")}
      </div>
      <p class="small muted" style="margin-top:8px">Step goal: ${stepGoal().toLocaleString()} (change it in Settings). Green = goal hit.</p>
    </div>` : ""}

    <details class="card soft" ${data.health && Object.keys(data.health).length ? "" : "open"}>
      <summary><strong>Set up the Shortcut (once)</strong></summary>
      ${shortcutGuideHTML()}
    </details>
  `;
}

function healthPreviewHTML() {
  const d = healthDraft;
  const key = healthDay === "today" ? todayKey() : addDays(todayKey(), -1);
  const ticks = [...new Set(workoutKinds(d.workouts))].map((k) => watchSessionLabel(key, k));
  const num = (id, label, value, step) => `<label class="field grow">${label}
      <input id="${id}" type="number" inputmode="decimal" step="${step}" value="${value ?? ""}"></label>`;
  return `<div class="card today">
      <h2>Check and save</h2>
      <div class="seg" role="group" aria-label="Which day">
        <button class="${healthDay === "today" ? "on" : ""}" data-action="health-day" data-day="today">Today</button>
        <button class="${healthDay === "yesterday" ? "on" : ""}" data-action="health-day" data-day="yesterday">Yesterday</button>
      </div>
      <div class="row">${num("h-steps", "Steps", d.steps, 1)}${num("h-sleep", "Sleep (hours)", d.sleep, 0.1)}</div>
      <div class="row">${num("h-resting", "Resting HR", d.resting, 1)}${num("h-weight", "Weight (kg)", d.weight, 0.1)}</div>
      ${d.workouts ? `<p class="small"><strong>Watch workouts:</strong> ${esc(d.workouts)}</p>` : ""}
      ${ticks.length ? `<p class="small" style="margin-bottom:4px">Saving will also update:</p>
        <ul class="small" style="margin:0 0 10px;padding-left:20px">${ticks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      ${d.workouts && !ticks.length ? `<p class="small muted">I didn't recognise that workout type, so tick it yourself in Fitness. (Tell me its name and I'll teach the app.)</p>` : ""}
      <p class="small muted">Hitting ${stepGoal().toLocaleString()} steps ticks your daily walk.</p>
      <div class="row">
        <button class="grow" data-action="health-save">Save</button>
        <button class="secondary" data-action="health-cancel">Cancel</button>
      </div>
    </div>`;
}

function shortcutGuideHTML() {
  return `<ol class="small guide">
      <li>Open the <strong>Shortcuts</strong> app, tap <strong>+</strong> and name it <strong>Health to Life Hub</strong>.</li>
      <li>Add <strong>Find Health Samples</strong>. Type: <strong>Steps</strong>. Add filter: <strong>Start Date is Today</strong>.</li>
      <li>Add <strong>Calculate Statistics</strong> and choose <strong>Sum</strong> (it adds up the steps).</li>
      <li>Add <strong>Find Health Samples</strong>. Type: <strong>Resting Heart Rate</strong>. Sort by <strong>Start Date</strong>, <strong>Latest First</strong>, turn on <strong>Limit</strong> and set it to <strong>1</strong>.</li>
      <li>Optional, if you weigh yourself: the same again with Type <strong>Weight</strong>.</li>
      <li>Add <strong>Find Health Samples</strong>. Type: <strong>Workouts</strong>. Filter: <strong>Start Date is Today</strong>.</li>
      <li>Add a <strong>Text</strong> action and type these lines. Where it says [ ], tap that spot and pick the matching blue variable from the bar above the keyboard:
        <pre>LIFEHUB
steps: [Statistics Result]
resting: [Health Samples, from step 4]
weight: [Health Samples, from step 5]
workouts: [Health Samples, from step 6]</pre></li>
      <li>Add <strong>Copy to Clipboard</strong>.</li>
      <li>Optional: add <strong>Show Notification</strong> saying "Copied! Open Life Hub".</li>
      <li>Tap <strong>Done</strong>. Run it once and tap <strong>Allow</strong> when it asks to read Health.</li>
      <li>Handy: long-press your home screen, add a <strong>Shortcuts widget</strong> showing this Shortcut.</li>
    </ol>
    <p class="small"><strong>Each day:</strong> tap the Shortcut, open Life Hub, tap <strong>Paste from Health</strong>, check, Save.</p>
    <p class="small muted">Sleep: type it in from the Health app's Sleep page (adding it to the Shortcut is fiddly). If anything pastes oddly, send Claude a screenshot.</p>`;
}

// Small card for the Home screen.
function healthHomeHTML() {
  const h = data.health[todayKey()] || data.health[addDays(todayKey(), -1)];
  const which = data.health[todayKey()] ? "Today" : "Yesterday";
  return `<div class="card">
      <div class="row between"><h2>Health ❤️</h2><a class="muted small" href="#health" style="text-decoration:none">Open ›</a></div>
      ${h ? `<p class="small" style="margin-bottom:10px">${which}: ${h.steps ? `👟 ${Number(h.steps).toLocaleString()} steps` : ""}${h.sleep ? ` · 😴 ${h.sleep}h` : ""}${h.resting ? ` · ❤️ ${h.resting}` : ""}</p>` : ""}
      <button class="full secondary" data-action="health-paste">📋 Paste from Health</button>
    </div>`;
}

SCREENS.health = healthScreen;


// ---------- 4. Buttons ----------
Object.assign(ACTIONS, {
  async "health-paste"() {
    let text = "";
    try { text = await navigator.clipboard.readText(); } catch (e) { /* not allowed: fall back below */ }
    const read = readHealthText(text);
    if (read) { healthDraft = read; healthDay = "today"; }
    else {
      healthDraft = { steps: null, sleep: null, resting: null, weight: null, workouts: "" };
      toast(text ? "That didn't look like Health numbers. Type them in instead?" : "Nothing copied yet. Run the Shortcut first, or type them in.");
    }
    if (location.hash !== "#health") location.hash = "#health"; else render();
  },

  "health-manual"() {
    healthDraft = { steps: null, sleep: null, resting: null, weight: null, workouts: "" };
    render();
  },

  "health-day"({ day }) {
    // Keep what's typed while switching days.
    healthDraft = { ...healthDraft, ...readHealthInputs() };
    healthDay = day;
    render();
  },

  "health-cancel"() {
    healthDraft = null;
    render();
  },

  "health-save"() {
    const key = healthDay === "today" ? todayKey() : addDays(todayKey(), -1);
    const nums = readHealthInputs();
    data.health[key] = { ...data.health[key], ...nums, workouts: healthDraft.workouts || (data.health[key] || {}).workouts || "" };
    [...new Set(workoutKinds(healthDraft.workouts))].forEach((k) => markWatchSession(key, k));
    if (nums.steps >= stepGoal()) setTick(key, "daily-walk", true);
    healthDraft = null;
    saveData();
    toast("Health saved ❤️ " + cheer());
    render();
  }
});

function readHealthInputs() {
  const v = (id) => { const n = parseFloat(document.getElementById(id).value); return isNaN(n) ? null : n; };
  return { steps: v("h-steps"), sleep: v("h-sleep"), resting: v("h-resting"), weight: v("h-weight") };
}
