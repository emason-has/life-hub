// =====================================================================
// COACH: your personal trainer
//
//   1. Built-in coach: looks at your sleep, steps, soreness, workouts,
//      food plan and week, and suggests changes for today or tomorrow.
//      Free, works offline, nothing leaves your phone.
//   2. Ask my trainer: puts your last two weeks into a message for your
//      Claude app, so you can get a full trainer review and ask follow-ups.
//   3. Screen, Home card and buttons
// =====================================================================

// ---------- 1. Built-in coach ----------
// Exercises to swap when an area is sore, and what to use instead.
const SORE_SWAPS = {
  lowerback: { label: "lower back", swaps: { "db-rdl": ["hip-thrust", "glute-bridge"], "romanian_deadlift": ["hip-thrust", "glute-bridge"], "smith-squat": ["leg-press"],
    "goblet-squat": ["leg-press"], "back-extension": ["glute-bridge"], "cable-pull-through": ["hip-abduction"] } },
  shoulder: { label: "shoulder", swaps: { "db-shoulder-press": ["band-pull-apart"], "lateral-raise": ["band-pull-apart"], "bench-dips": ["tricep-pushdown"],
    "overhead-tricep": ["tricep-pushdown"], "db-overhead-tricep": ["tricep-pushdown"], "close-pushup": ["tricep-pushdown"] } },
  neck: { label: "neck", swaps: { "db-shoulder-press": ["band-pull-apart"], "overhead-tricep": ["tricep-pushdown"], "db-overhead-tricep": ["tricep-pushdown"] } },
  armnerve: { label: "arm nerve pain", swaps: { "db-shoulder-press": ["scap-squeeze"], "overhead-tricep": ["tricep-pushdown"], "db-overhead-tricep": ["tricep-pushdown"],
    "bench-dips": ["tricep-pushdown"], "close-pushup": ["tricep-pushdown"] } }
};

// Is the coach looking at today or tomorrow? After 3pm, tomorrow.
function coachDay() {
  return new Date().getHours() >= 15 ? addDays(todayKey(), 1) : todayKey();
}

// The latest Health numbers from the last couple of days.
function recentHealth() {
  for (let i = 0; i <= 1; i++) { const h = data.health[addDays(todayKey(), -i)]; if (h && (h.sleep || h.steps)) return h; }
  return null;
}

// Sore areas logged in the last 2 days at 4/10 or more.
function soreAreas() {
  if (typeof PHYSIO_AREAS === "undefined") return [];
  return Object.keys(PHYSIO_AREAS).map((a) => [a, painLog(a).filter((l) => daysBetween(l.date, todayKey()) <= 2).pop()])
    .filter(([, l]) => l && l.pain >= 4).map(([a, l]) => ({ area: a, pain: l.pain }));
}

// The exercises in a session that a sore area says to swap, and with what.
function swapsFor(s, area) {
  const map = (SORE_SWAPS[area] || {}).swaps || {};
  const list = sessionExercises(s).map((e) => e.ex);
  return list.filter((ex) => map[ex]).map((ex) => [ex, map[ex].find((r) => !list.includes(r)) || null]);
}

// Each suggestion: { level: "warn" | "tip" | "good", text, action? }
function coachTips() {
  const day = coachDay();
  const when = day === todayKey() ? "today" : "tomorrow";
  const sessions = sessionsOn(day).filter((s) => s.status === "planned");
  const lift = sessions.find((s) => typeInfo(s.type).strength || ["home", "light-home"].includes(s.type));
  const tips = [];
  const h = recentHealth();

  // Nothing planned this week yet.
  const wk = fit().weeks[mondayOf(day)];
  if (!wk || !wk.planned) tips.push({ level: "warn", text: "This week isn't planned yet, so I can't help with your sessions. It takes a minute.", action: { label: "Plan my week", href: "#fitness" } });

  // No Health numbers lately: sleep and steps tips need them.
  const lastHealth = Object.keys(data.health).sort().pop();
  if (!lastHealth || daysBetween(lastHealth, todayKey()) >= 2) {
    tips.push({ level: "tip", text: lastHealth ? `No sleep or steps since ${niceDate(lastHealth)}. Paste from Health so I can tailor your days.` : "Paste from Health so I can use your sleep and steps.",
      action: { label: "Paste from Health", act: "health-paste" } });
  }

  // Reminders aren't set up yet.
  if (!data.settings.remindersAdded) tips.push({ level: "tip", text: "No reminders set up yet. Add them to your Calendar so your phone nudges you.", action: { label: "Set up reminders", href: "#coach" } });
  else if (wk && wk.planned && data.settings.weekInCalendar !== mondayOf(todayKey()) && [0, 1].includes(fromKey(todayKey()).getDay())) {
    tips.push({ level: "tip", text: "Add this week's workouts to your Calendar for a heads-up before each one.", action: { label: "Add to Calendar", act: "cal-week" } });
  }

  // Sleep: short sleep means keep it lighter.
  if (h && h.sleep && h.sleep < 6 && lift && when === "today") {
    tips.push({ level: "warn", text: `Only ${h.sleep}h sleep. Keep today's ${typeInfo(lift.type).label.toLowerCase()} but skip personal bests, or make it the short version.`,
      action: lift.type !== "short-gym" && typeInfo(lift.type).strength ? { label: "Make it short", act: "quick-short", id: lift.id } : null });
  } else if (h && h.sleep && h.sleep < 6) {
    tips.push({ level: "tip", text: `Only ${h.sleep}h sleep last night. Aim for bed by 10:15pm tonight.` });
  }

  // Soreness: swap the exercises that load the sore spot.
  soreAreas().forEach(({ area, pain }) => {
    const swaps = lift ? swapsFor(lift, area) : [];
    const label = PHYSIO_AREAS[area].label;
    if (swaps.length) {
      const words = swaps.map(([ex, to]) => `${exById(ex).name}${to ? ` for ${exById(to).name.toLowerCase()}` : " (skip it)"}`).join(", ");
      tips.push({ level: "warn", text: `${label} is ${pain}/10. Swap ${words} ${when}.`, action: { label: "Swap them", act: "coach-swap", id: lift.id, area } });
    } else {
      tips.push({ level: pain >= 7 ? "warn" : "tip", text: `${label} is ${pain}/10. Do the physio routine${pain >= 7 ? " and keep training very light" : ""}.`, action: { label: "Open physio", href: `#physio/${area}` } });
    }
  });

  // Steps: low for a few days means add a walk.
  const goal = Number(data.settings.stepGoal) || 8000;
  const steps = [1, 2, 3].map((i) => (data.health[addDays(todayKey(), -i)] || {}).steps).filter((x) => x);
  if (steps.length >= 2) {
    const avg = Math.round(steps.reduce((a, b) => a + b, 0) / steps.length);
    if (avg < goal * 0.7 && !sessionsOn(day).some((s) => s.type === "walk")) {
      tips.push({ level: "tip", text: `Steps have been low (about ${avg.toLocaleString()} a day). A 20 minute walk ${when} gets you back on track.`, action: { label: "Add a walk", act: "coach-walk", key: day } });
    } else if (avg >= goal) {
      tips.push({ level: "good", text: `Steps are on point: about ${avg.toLocaleString()} a day.` });
    }
  }

  // Progress: an exercise that's ready to go up.
  if (lift) {
    const up = sessionExercises(lift).map((e) => ({ e, w: goUpSuggestion({ ex: e.ex, target: { sets: e.sets, reps: e.reps } }) })).find((x) => x.w);
    if (up) tips.push({ level: "good", text: `You hit every rep on ${exById(up.e.ex).name.toLowerCase()} twice in a row. Try ${up.w}${exById(up.e.ex).unit.startsWith("kg") ? "kg" : ""} ${when}.` });
  }

  // Last workout felt hard on most exercises: hold the weights.
  const last = fit().workouts.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  if (last && daysBetween(last.date, todayKey()) <= 3) {
    const rated = last.exercises.filter((e) => e.rating);
    if (rated.length >= 2 && rated.filter((e) => e.rating === "hard").length / rated.length >= 0.5) {
      tips.push({ level: "tip", text: "Your last session felt hard. Keep the same weights next time and focus on clean reps." });
    }
  }

  // Three sessions in three days: suggest a rest.
  const busy = [0, 1, 2].every((i) => sessionsOn(addDays(day, -1 - i)).some((s) => s.status === "done" && typeInfo(s.type).strength));
  if (busy && lift) tips.push({ level: "tip", text: `Three hard days in a row. A rest or a walk ${when} will help you come back stronger.` });

  // The week: on track, or a free day to catch up.
  const score = weekScore(mondayOf(day));
  if (score.win) tips.push({ level: "good", text: `This week is already won: ${score.summary}.` });

  // Food: the planned protein for that day.
  if (typeof foodCheck === "function") {
    const c = foodCheck(planMonday());
    const dayName3 = WEEK_DAYS[(fromKey(day).getDay() + 6) % 7];
    const low = c && c.fix.find((f) => f.includes("short on protein") && f.split(/ (?:is|are) /)[0].split(", ").includes(dayName3));
    if (low) tips.push({ level: "tip", text: `${when === "today" ? "Today" : "Tomorrow"} is short on protein. Add Greek yoghurt or a protein shake.`, action: { label: "See meals", href: "#meals/plan" } });
  }

  if (!tips.some((t) => t.level !== "good")) {
    tips.unshift({ level: "good", text: lift ? `${when === "today" ? "Today" : "Tomorrow"}: ${sessionTitle(lift) || typeInfo(lift.type).label}. Nothing to change, go for it.` : `Nothing to change ${when}. Enjoy it.` });
  }
  return tips;
}

// ---------- 2. Ask my trainer ----------
// A plain summary of the last 2 weeks, ready to send to Claude.
function trainerSummary() {
  const today = todayKey();
  const from = addDays(today, -13);
  const lines = [];
  const f = fit();
  lines.push(`You're my personal trainer. I'm training for a Bali trip on ${niceDate(data.settings.baliDate)} (${daysBetween(today, data.settings.baliDate)} days away). Goals: build my glutes and upper back, get leaner, and keep my back and arm healthy. I have arm nerve pain that flares with heavy upper body work.`);
  lines.push(`Weekly targets: ${f.targets.strength} strength sessions, glutes ${f.targets.glutes.join("-")} sets, back ${f.targets.back.join("-")} sets, triceps ${f.targets.triceps.join("-")} sets, core ${f.targets.core[0]}+ sets. Strength goals: ${GOALS.map((g) => `${g.label} ${g.text} (best so far ${bestFor(g.exercise) || "not logged"})`).join("; ")}.`);
  if (data.settings.proteinGoal) lines.push(`Protein goal: ${data.settings.proteinGoal}g a day. Step goal: ${data.settings.stepGoal || 8000}.`);

  lines.push("\nLAST 14 DAYS");
  for (let i = 0; i < 14; i++) {
    const key = addDays(from, i);
    const parts = [];
    sessionsOn(key).forEach((s) => {
      const wk = s.workoutId && workoutById(s.workoutId);
      let t = `${typeInfo(s.type).label}${sessionTitle(s) ? ` (${sessionTitle(s)})` : ""}: ${s.status}`;
      if (s.km || s.mins) t += ` ${[s.km && s.km + "km", s.mins && s.mins + "min"].filter(Boolean).join(" ")}`;
      if (wk) t += ". " + wk.exercises.map((e) => {
        const done = e.sets.filter((x) => x.done);
        if (!done.length) return null;
        const ex = exById(e.ex) || { name: e.ex, unit: "" };
        return `${ex.name} ${done.map((x) => `${x.w ? x.w + "x" : ""}${x.r}`).join(",")}${e.rating ? ` (${e.rating})` : ""}`;
      }).filter(Boolean).join("; ");
      parts.push(t);
    });
    const h = data.health[key];
    if (h) parts.push([h.steps && `${h.steps} steps`, h.sleep && `${h.sleep}h sleep`, h.resting && `resting HR ${h.resting}`, h.weight && `${h.weight}kg`].filter(Boolean).join(", "));
    if (typeof PHYSIO_AREAS !== "undefined") physio().log.filter((l) => l.date === key).forEach((l) => parts.push(`${PHYSIO_AREAS[l.area].label} pain ${l.pain}/10`));
    if (parts.length) lines.push(`${niceDate(key)}: ${parts.join(" | ")}`);
  }

  const next = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1)).map((k) => [k, sessionsOn(k).filter((s) => s.status === "planned")]).filter(([, l]) => l.length);
  if (next.length) {
    lines.push("\nPLANNED NEXT 7 DAYS");
    next.forEach(([k, l]) => lines.push(`${niceDate(k)}: ${l.map((s) => `${typeInfo(s.type).label}${sessionTitle(s) ? ` (${sessionTitle(s)}: ${sessionExercises(s).map((e) => (exById(e.ex) || { name: e.ex }).name).join(", ")})` : ""}`).join("; ")}`));
  }

  const plan = mealPlan(planMonday());
  const meals = Object.entries(plan).map(([slot, id]) => [slot, findRecipe(id)]).filter(([, r]) => r);
  if (meals.length) lines.push(`\nMEAL PLAN THIS WEEK: ${meals.map(([slot, r]) => `${slot} ${r.name}${r.protein ? ` (${r.protein}g protein)` : ""}`).join("; ")}. Lunch is free at work (I pick the protein and salad).`);
  if (data.measurements.length) lines.push(`\nMEASUREMENTS: ${data.measurements.slice(-3).map((m) => `${niceDate(m.date)} waist ${m.waist || "-"} hips ${m.hips || "-"}${m.weight ? ` weight ${m.weight}` : ""}`).join("; ")}`);

  lines.push("\nPlease review this like a personal trainer: 1) what to change for tomorrow and the rest of this week, 2) whether I'm on track for Bali, 3) anything to watch with my back, arm or sleep. Keep it short and practical, in plain English.");
  return lines.join("\n");
}

// ---------- 3. Screen, Home card and buttons ----------
function coachTipsHTML(limit) {
  const tips = coachTips();
  const shown = limit ? tips.filter((t) => t.level !== "good").slice(0, limit) : tips;
  const list = shown.length ? shown : tips.slice(0, 1);
  return `<ul class="check-list coach-list">${list.map((t) => `<li>${icon(t.level === "good" ? "check" : "bolt", t.level === "warn" ? "warn" : "")}
      <span class="grow">${esc(t.text)}${t.action ? `<span class="block" style="margin-top:6px">${t.action.href
        ? `<a class="chip" href="${t.action.href}">${t.action.label}</a>`
        : `<button class="chip" data-action="${t.action.act}" data-id="${t.action.id || ""}" data-area="${t.action.area || ""}" data-key="${t.action.key || ""}">${t.action.label}</button>`}</span>` : ""}</span></li>`).join("")}</ul>`;
}

function coachScreen() {
  const day = coachDay();
  return `
    ${topBar(backBtn("#home"))}
    ${headline("Your", "trainer")}
    <div class="card">
      <p class="label" style="margin-top:0">${day === todayKey() ? "Today" : "Tomorrow"} · ${niceDate(day)}</p>
      ${coachTipsHTML()}
    </div>
    <p class="hint">Based on your sleep and steps (from the Health Shortcut), soreness (Physio), workouts, meals and week plan. Nothing leaves your phone.</p>

    ${remindersHTML()}

    <div class="card">
      <p class="label" style="margin-top:0">Ask my trainer</p>
      <p class="small" style="margin:0 0 10px">Sends your last 2 weeks (workouts, sets, sleep, steps, pain, meals, plan) to your Claude app for a full review. You can then ask follow-up questions.</p>
      <button class="full dark" data-action="coach-ask">${icon("arrow")} Open in Claude</button>
      <button class="full" data-action="coach-share">Share to another app</button>
      <details class="drop-body small"><summary class="muted">See what gets sent</summary><pre class="coach-pre">${esc(trainerSummary())}</pre></details>
    </div>
  `;
}

// Home card: the top suggestions, with a link to the full view.
function coachHomeHTML() {
  const day = coachDay();
  return `<div class="card coach-card">
      <div class="row between" style="margin-bottom:4px"><p class="label" style="margin:0">Trainer · ${day === todayKey() ? "today" : "tomorrow"}</p>
        <a class="small muted plain-link" href="#coach">More ›</a></div>
      ${coachTipsHTML(2)}
    </div>`;
}

SCREENS.coach = coachScreen;
WIDGETS.coach = { name: "Trainer", icon: "star", html: () => coachHomeHTML() };

// The trainer card is new, so add it to the top of Home once.
if (!data.settings.coachAdded) {
  const home = data.settings.home || DEFAULT_HOME.slice();
  if (!home.includes("coach")) home.unshift("coach");
  data.settings.home = home;
  data.settings.coachAdded = true;
  saveData();
}

Object.assign(ACTIONS, {
  // Swap the exercises that load a sore area, for this session only.
  "coach-swap"({ id, area }) {
    const found = findSession(id);
    if (!found) return;
    const s = found.s;
    const swaps = swapsFor(s, area);
    const base = tplById(s.tpl);
    const copy = clone(base);
    copy.id = uid("t");
    copy.name = `${base.name} (${SORE_SWAPS[area].label} friendly)`;
    copy.hidden = true;     // a one-off: kept out of your Workouts list
    copy.exercises = copy.exercises.flatMap((e) => {
      const sw = swaps.find(([ex]) => ex === e.ex);
      return !sw ? [e] : sw[1] ? [{ ...e, ex: sw[1] }] : [];
    });
    fit().templates.push(copy);
    changeSession(id, ({ s }) => { s.tpl = copy.id; });
    toast(`Swapped ${swaps.length} exercise${swaps.length === 1 ? "" : "s"}`);
    render();
  },
  "coach-walk"({ key }) {
    const s = addSession(key, newSession("walk", null, key));
    s.mins = 20;
    saveData();
    toast(`Walk added for ${niceDate(key)}`);
    render();
  },
  async "coach-ask"() {
    const text = trainerSummary();
    try { await navigator.clipboard.writeText(text); } catch (e) { /* copying isn't allowed everywhere */ }
    toast("Copied. If it doesn't fill in, paste it into Claude.");
    window.open("https://claude.ai/new?q=" + encodeURIComponent(text), "_blank");
  },
  async "coach-share"() {
    const text = trainerSummary();
    if (navigator.share) { try { await navigator.share({ text }); } catch (e) { /* closed the share sheet */ } }
    else { copyText(text); }
  }
});
