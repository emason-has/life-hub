// =====================================================================
// BRAIN DUMP (under More, and an optional Home widget)
// Get thoughts out of your head fast, then sort them once a week.
//
//   1. Data and helpers
//   2. Screens: the dump, and the Sunday reset (one thought at a time)
//   3. Home widget and the Sunday card
//   4. Buttons
//
// Each thought is { id, text, added, status, doneOn }.
// status: "inbox" (not sorted yet), "week" (focus this week),
//         "later" (parked, not forgotten) or "done" (kept in the log).
// Apple Reminders: you collect thoughts in a Reminders list called
// "Brain dump". On Sunday a Shortcut opens #dump/in/<the reminders> to bring
// them in for sorting, and "Send to Reminders" passes your focus for the
// week back to a "This week" list so iPhone can nudge you.
// =====================================================================

// ---------- 1. Data and helpers ----------
const FOCUS_LIMIT = 3;   // more than this in "This week" gets a gentle nudge

function dump() { return data.dump || (data.dump = []); }
function dumpBy(status) { return dump().filter((t) => t.status === status); }

// Short jobs (call, book, pay...) are flagged as quick wins you can just do.
function isQuick(text) {
  return /^(call|ring|text|email|reply|book|pay|cancel|renew|message)\b/i.test(text.trim()) && text.trim().split(/\s+/).length <= 8;
}

// Splits what you typed or said into separate thoughts: one per line,
// or "and then" / full stops when it's one long spoken sentence.
function splitThoughts(text) {
  return text.split(/\n|\.\s+|;\s*|,?\s+and then\s+/i).map((t) => t.trim().replace(/\.$/, "")).filter((t) => t.length > 1);
}

// Adds thoughts, skipping any you already have that aren't done.
// From Reminders each line is one thought, so only split on new lines.
function addThoughts(text, linesOnly) {
  const have = new Set(dump().filter((t) => t.status !== "done").map((t) => t.text.toLowerCase()));
  const items = (linesOnly ? text.split("\n").map((t) => t.trim()).filter(Boolean) : splitThoughts(text))
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1)).filter((t) => !have.has(t.toLowerCase()));
  items.forEach((t, i) => dump().push({ id: "d" + Date.now().toString(36) + i, text: t, added: todayKey(), status: "inbox" }));
  saveData();
  return items.length;
}

// Opens the "Life Hub to Reminders" Shortcut with your focus items, one per line.
function sendToReminders() {
  const items = dumpBy("week").filter((t) => !t.sent);
  if (!items.length) return toast("Everything in This week is already in Reminders.");
  items.forEach((t) => { t.sent = true; });
  saveData();
  render();
  location.href = "shortcuts://run-shortcut?name=" + encodeURIComponent("Life Hub to Reminders") +
    "&input=text&text=" + encodeURIComponent(items.map((t) => t.text).join("\n"));
}

// The Sunday reset is due on Sunday (or Monday if you missed it) when the inbox has something in it.
function resetDue() {
  const day = fromKey(todayKey()).getDay();
  return (day === 0 || day === 1) && dumpBy("inbox").length > 0 && data.settings.lastReset !== mondayOf(addDays(todayKey(), day === 0 ? 1 : 0));
}

// ---------- 2. Screens ----------
function dumpScreen(sub, arg) {
  if (sub === "in") {
    // Came from the Sunday Shortcut with your Reminders: add them, then sort.
    const n = arg ? addThoughts(decodeURIComponent(arg), true) : 0;
    history.replaceState(null, "", "#dump/review");
    setTimeout(() => toast(n ? `${n} brought in from Reminders` : "Nothing new in Reminders"), 50);
    return reviewScreen();
  }
  if (sub === "add" && arg) {
    const n = addThoughts(decodeURIComponent(arg));
    history.replaceState(null, "", "#dump");
    setTimeout(() => toast(`Added ${n} thought${n === 1 ? "" : "s"}`), 50);
  }
  if (sub === "review") return reviewScreen();
  const inbox = dumpBy("inbox"), week = dumpBy("week"), later = dumpBy("later");
  const done = dumpBy("done").sort((a, b) => (b.doneOn || "").localeCompare(a.doneOn || ""));
  return `
    ${topBar(backBtn("#more"), inbox.length ? `<a class="btn sm dark" href="#dump/review">Sort ${inbox.length}</a>` : "")}
    ${headline("Brain", "dump")}
    <div class="card">
      <textarea id="dump-text" rows="3" placeholder="Anything on your mind. One per line, or tap the mic on the keyboard and just talk."></textarea>
      <button class="full dark" data-action="dump-add" style="margin:10px 0 0">Get it out of my head</button>
    </div>

    <h3 class="sec-head">This week <span class="muted small">${week.length ? `${week.length} of ${FOCUS_LIMIT}` : ""}</span></h3>
    ${week.some((t) => !t.sent) ? `<button class="full sm" data-action="dump-send">${icon("bell")} Send to Reminders</button>` : ""}
    ${week.length > FOCUS_LIMIT ? `<p class="small muted">That's a lot for one week. Park a couple in Later so the rest feel doable.</p>` : ""}
    <div class="card list-card">${week.map((t) => thoughtRow(t, ["later"])).join("") || `<p class="muted" style="padding:14px 16px;margin:0">Nothing yet. On Sunday, pick up to ${FOCUS_LIMIT} things to focus on.</p>`}</div>

    ${inbox.length ? `<h3 class="sec-head">Not sorted yet <span class="muted small">${inbox.length}</span></h3>
      <div class="card list-card">${inbox.map((t) => thoughtRow(t, ["week", "later"])).join("")}</div>` : ""}

    ${dropList("Later", "Parked, not forgotten", later, ["week"])}
    ${dropList("Done", "Your log of finished things", done, [])}

    <details class="card drop-card">
      <summary class="li">${icon("bell", "tile")}<span class="grow">Set up with Apple Reminders</span>${icon("down", "chev")}</summary>
      <div class="drop-body small">${shortcutHelp()}</div>
    </details>
  `;
}

function thoughtRow(t, moves) {
  const label = { week: "This week", later: "Later" };
  const done = t.status === "done";
  return `<div class="li thought ${done ? "done" : ""}">
      <button class="circle-tick ${done ? "on" : ""}" data-action="dump-done" data-id="${t.id}" aria-label="Done">${done ? icon("check") : ""}</button>
      <span class="grow"><span class="thought-text">${esc(t.text)}</span>
        <span class="small muted block">${isQuick(t.text) && !done ? `${icon("bolt")} Quick win · ` : ""}${done ? `Done ${niceDate(t.doneOn)}` : `Added ${niceDate(t.added)}`}</span>
        ${moves.length ? `<span class="row" style="gap:6px;margin-top:6px">${moves.map((m) => `<button class="chip" data-action="dump-move" data-id="${t.id}" data-to="${m}">${label[m]}</button>`).join("")}</span>` : ""}
      </span>
      <button class="circ sm" data-action="dump-delete" data-id="${t.id}" aria-label="Delete">${icon("x")}</button>
    </div>`;
}

function dropList(title, sub, list, moves) {
  if (!list.length) return "";
  return `<details class="card drop-card">
      <summary class="li">${icon(title === "Done" ? "check" : "moon", "tile")}<span class="grow"><strong>${title}</strong><span class="small muted block">${sub}</span></span><span class="num">${list.length}</span>${icon("down", "chev")}</summary>
      <div class="list-card">${list.map((t) => thoughtRow(t, moves)).join("")}</div>
      ${title === "Done" ? `<button class="full sm" data-action="dump-clear-done" style="margin-top:10px">Clear the done log</button>` : ""}
    </details>`;
}

// Sunday reset: one thought at a time, so it never feels like a wall of tasks.
function reviewScreen() {
  const inbox = dumpBy("inbox");
  const week = dumpBy("week");
  if (!inbox.length) return `
    ${topBar(backBtn("#dump"))}
    ${headline("All", "sorted")}
    <div class="card"><p>Nice. Your week's focus:</p>
      ${week.length ? `<ul>${week.map((t) => `<li>${esc(t.text)}</li>`).join("")}</ul>` : `<p class="muted">Nothing picked for this week. That's fine too.</p>`}
      ${week.some((t) => !t.sent) ? `<button class="full dark" data-action="dump-send">${icon("bell")} Send to Reminders</button>
        <a class="btn full" href="#home">Done</a>` : `<a class="btn full dark" href="#home">Done</a>`}</div>`;
  const t = inbox[0];
  return `
    ${topBar(backBtn("#dump"), `<span class="muted small">${inbox.length} left</span>`)}
    ${headline("Sunday", "reset")}
    <p class="sub">One at a time. Pick up to ${FOCUS_LIMIT} for this week, park the rest.</p>
    <div class="card review-card">
      <p class="review-text">${esc(t.text)}</p>
      <p class="small muted">${isQuick(t.text) ? `${icon("bolt")} Looks like a quick win. Could you just do it now?` : `Added ${niceDate(t.added)}`}</p>
    </div>
    <button class="full dark" data-action="dump-move" data-id="${t.id}" data-to="week" ${week.length >= FOCUS_LIMIT ? "disabled" : ""}>
      This week${week.length >= FOCUS_LIMIT ? ` (you've picked ${FOCUS_LIMIT})` : ` (${week.length} of ${FOCUS_LIMIT})`}</button>
    <button class="full" data-action="dump-move" data-id="${t.id}" data-to="later">Later</button>
    <div class="row" style="gap:8px">
      <button class="grow" data-action="dump-done" data-id="${t.id}">Already done</button>
      <button class="grow" data-action="dump-delete" data-id="${t.id}">Let it go</button>
    </div>
  `;
}

function shortcutHelp() {
  const site = location.origin + location.pathname;
  return `<p><b>1. Collect in Reminders.</b> In the Reminders app make a list called <b>Brain dump</b>. Add to it any way you like: "Hey Siri, add call the dentist to Brain dump", your Watch, or the Reminders widget.</p>
    <p><b>2. "Brain dump in" shortcut.</b> In Shortcuts, tap <b>+</b> and add:</p>
    <ol><li><b>Find Reminders</b>: List is Brain dump, Is Completed is off.</li>
      <li><b>Get Details of Reminders</b>: Title.</li>
      <li><b>Combine Text</b> with New Lines.</li>
      <li><b>URL Encode</b> the Combined Text.</li>
      <li><b>Open URLs</b>: <code>${esc(site)}#dump/in/</code> then the URL Encoded Text.</li>
      <li><b>Remove Reminders</b>: the Reminders from step 1 (they're now safe in Life Hub). If it asks to confirm, tap Remove.</li></ol>
    <p><b>3. Sunday automation.</b> Automation, <b>+</b>, <b>Time of Day</b>: 4:00pm, Weekly, Sunday, <b>Run Immediately</b>. Action: <b>Run Shortcut</b>, Brain dump in. It opens the Sunday reset with everything ready to sort.</p>
    <p><b>4. "Life Hub to Reminders" shortcut</b> (name it exactly that):</p>
    <ol><li><b>Split Text</b>: Shortcut Input, by New Lines.</li>
      <li><b>Repeat with Each</b> item in Split Text.</li>
      <li>Inside it, <b>Add New Reminder</b>: title Repeat Item, list <b>This week</b>, Alert on, time Monday 9:00am.</li></ol>
    <p>After your Sunday reset, tap <b>Send to Reminders</b> and your focus items land in Reminders with an alert. Reminders won't tell Life Hub when you tick one off, so tick it here too at the Sunday reset if you want it in your done log.</p>`;
}

// ---------- 3. Home ----------
// Widget: your focus for the week, plus a box to dump a thought.
function dumpHomeHTML() {
  const week = dumpBy("week"), inbox = dumpBy("inbox");
  return `<div class="card">
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px">
        <p class="label" style="margin:0">This week's focus</p>
        <a class="small muted plain-link" href="#dump">${inbox.length ? `${inbox.length} to sort` : "Brain dump"} ›</a>
      </div>
      ${week.length ? `<div class="list-card">${week.map((t) => `<div class="li tight">
          <button class="circle-tick" data-action="dump-done" data-id="${t.id}" aria-label="Done"></button>
          <span class="grow">${esc(t.text)}</span></div>`).join("")}</div>` : `<p class="small muted">Nothing picked yet.</p>`}
      <div class="add-row" style="margin-top:8px"><input id="dump-quick" placeholder="Dump a thought"><button class="circ sm dark" data-action="dump-quick" aria-label="Add">${icon("plus")}</button></div>
    </div>`;
}

// Shown at the top of Today on Sunday (and Monday) when there's something to sort.
function resetCardHTML() {
  if (!resetDue()) return "";
  const n = dumpBy("inbox").length;
  return `<a class="card next-card reset-card" href="#dump/review">
      ${icon("note", "tile")}
      <span class="grow"><span class="small muted block">Sunday reset · about ${Math.max(1, Math.round(n / 3))} min</span><b>Sort ${n} thought${n === 1 ? "" : "s"} from your brain dump</b></span>
      ${icon("chev", "chev")}
    </a>`;
}

SCREENS.dump = dumpScreen;
WIDGETS.dump = { name: "Brain dump", icon: "note", html: () => dumpHomeHTML() };

// ---------- 4. Buttons ----------
Object.assign(ACTIONS, {
  "dump-add"() {
    const box = document.getElementById("dump-text");
    if (!box.value.trim()) return toast("Type or say something first.");
    const n = addThoughts(box.value);
    toast(`Got it. ${n} thought${n === 1 ? "" : "s"} out of your head.`);
    render();
  },
  "dump-quick"() {
    const box = document.getElementById("dump-quick");
    if (!box.value.trim()) return;
    addThoughts(box.value);
    toast("Saved for Sunday");
    render();
  },
  "dump-move"({ id, to }) {
    dump().find((t) => t.id === id).status = to;
    if (!dumpBy("inbox").length) data.settings.lastReset = mondayOf(addDays(todayKey(), 1));
    saveData();
    render();
  },
  "dump-done"({ id }) {
    const t = dump().find((x) => x.id === id);
    if (t.status === "done") { t.status = "week"; t.doneOn = null; }
    else { t.status = "done"; t.doneOn = todayKey(); toast("Done. One less thing in your head."); }
    saveData();
    render();
  },
  "dump-delete"({ id }) {
    data.dump = dump().filter((t) => t.id !== id);
    saveData();
    render();
  },
  "dump-send"() { sendToReminders(); },
  "dump-clear-done"() {
    if (!confirm("Clear everything in the done log?")) return;
    data.dump = dump().filter((t) => t.status !== "done");
    saveData();
    render();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "dump-quick") { e.preventDefault(); ACTIONS["dump-quick"](); }
});
