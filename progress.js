// =====================================================================
// PROGRESS AND GOALS
// Sections:
//   1. Goal checks: on track / slipping / off track, each with ONE fix
//   2. Bali projection for your key lifts
//   3. Charts (bars; the line chart lives in app.js)
//   4. Screens: Progress (Goals, Charts, Body), Home card, Settings targets
//   5. Buttons
// =====================================================================


// ---------- 1. Goal checks ----------
const LEVEL_ORDER = { green: 0, amber: 1, red: 2 };
const STATUS_TEXT = { green: "On track", amber: "Slipping a little", red: "Off track this week" };
// The first day from today on with no strength session (good spot for an extra one).
function freeDay(monday, avoidStrength = true) {
  return weekKeys(monday).filter((k) => k >= todayKey()).find((k) => {
    const list = sessionsOn(k).filter((s) => s.status !== "skipped");
    return avoidStrength ? !list.some((s) => typeInfo(s.type).strength) : !list.some((s) => !s.optional);
  });
}

function goalChecks() {
  const today = todayKey();
  const monday = mondayOf(today);
  const score = weekScore(monday);
  const t = fit().targets;
  const checks = [];
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  // Sessions
  if (!score.planned) {
    checks.push({ level: "amber", soft: true, text: "This week isn't planned yet - 1 minute of planning makes it easy.",
      fix: { label: "Plan my week", href: `#fitness/plan/${monday}` } });
  } else if (score.mode === "light") {
    const planned = weekKeys(monday).filter((k) => k >= today).flatMap((k) => sessionsOn(k)).filter((s) => s.status === "planned").length;
    if (score.total + planned >= 2) checks.push({ level: "green", text: `Light week: ${plural(score.total, "session")} done${planned ? `, ${planned} planned` : ""}. Gentle counts.` });
    else {
      const day = freeDay(monday, false);
      checks.push({ level: "amber", text: `Light week: ${plural(score.total, "session")} so far${day ? ` - a 15 min light home session ${dayLong(day)} makes it a win` : ""}.`,
        fix: day ? { label: `Add light home ${dayName(day)}`, action: "fix-add", key: day, type: "light-home", tpl: "t-light" } : null });
    }
  } else {
    const target = score.mode === "busy" ? 2 : t.strength;
    const expected = score.strength + score.plannedStrength;
    if (expected >= target) checks.push({ level: "green", text: `${score.strength} of ${target} strength sessions done${score.plannedStrength ? `, ${score.plannedStrength} more planned` : ""}.` });
    else {
      const day = freeDay(monday);
      const { projected } = weekSets(monday);
      const tpl = (projected.glutes || 0) / t.glutes[0] <= (projected.back || 0) / t.back[0] ? "t-short-glutes" : "t-short-upper";
      checks.push({ level: target - expected >= 2 ? "red" : "amber",
        text: `${score.strength ? `Only ${plural(score.strength, "strength session")}` : "No strength sessions"} so far.${day ? ` A 20 min short session ${dayLong(day)} keeps you on track.` : ""}`,
        fix: day ? { label: `Add short gym ${dayName(day)}`, action: "fix-add", key: day, type: "short-gym", tpl }
          : { label: "Plan next week", href: `#fitness/plan/${addDays(monday, 7)}` } });
    }
  }

  // Sets per muscle (Busy weeks aim for about 60% of your targets; Light weeks skip this)
  if (score.planned && score.mode !== "light") {
    const { projected } = weekSets(monday);
    ["glutes", "back", "triceps", "core"].forEach((g) => {
      const [min, max] = t[g];
      const need = Math.round(min * (score.mode === "busy" ? 0.6 : 1));
      const p = projected[g] || 0;
      const label = MUSCLE_GROUPS.find((m) => m.id === g).word;
      if (p >= need) return;
      checks.push({ level: p >= need * 0.7 ? "amber" : "red", area: g,
        text: `${label} sets are low this week (${p} of ${min}${max ? "-" + max : "+"}) - ${muscleFixText(monday, g, need - p)}`,
        fix: muscleFix(monday, g, need - p) });
    });
    if (!checks.some((c) => c.area)) checks.push({ level: "green", text: "Glute, back, triceps and core sets are on target" });
  }

  // Runs
  if (score.planned && score.mode === "normal") {
    const plannedRuns = weekKeys(monday).filter((k) => k >= today).flatMap((k) => sessionsOn(k)).filter((s) => s.status === "planned" && s.type === "run").length;
    if (score.runs + plannedRuns < t.runs[0]) {
      const day = freeDay(monday, false) || freeDay(monday);
      checks.push({ level: "amber", soft: true, text: `No run this week yet${day ? ` - an easy run ${dayLong(day)} ticks it off` : ""}.`,
        fix: day ? { label: `Add a run ${dayName(day)}`, action: "fix-add", key: day, type: "run" } : null });
    }
  }

  // Strength trend
  const trend = strengthTrend();
  if (trend.stalled) {
    const ex = exById(trend.stalled.ex);
    const next = trend.stalled.top + (ex.step || 2.5);
    checks.push({ level: "amber", soft: true, text: `${ex.name} hasn't increased in 3 weeks - try adding ${ex.step || 2.5}kg.`,
      fix: { label: `Try ${next}kg next time`, action: "fix-bump", ex: ex.id, w: next } });
  } else if (trend.up) {
    const ex = exById(trend.up.ex);
    checks.push({ level: "green", text: `${ex.name} is up ${trend.up.gain}kg in the last few weeks` });
  }

  // Two lighter weeks in a row
  const lastWeek = fit().weeks[addDays(monday, -7)];
  const next = addDays(monday, 7);
  if (lastWeek && lastWeek.planned && lastWeek.mode !== "normal" && score.mode !== "normal" && !(fit().weeks[next] && fit().weeks[next].planned)) {
    checks.push({ level: "amber", soft: true, text: "2 lighter weeks in a row - plan a Normal week next week?",
      fix: { label: "Plan a Normal week", action: "plan-week", monday: next, mode: "normal", go: "1" } });
  }

  // Overall: sessions and sets decide it; the gentler checks can only nudge it to amber.
  let overall = "green";
  checks.forEach((c) => {
    const lvl = c.soft && c.level === "red" ? "amber" : c.level;
    if (LEVEL_ORDER[lvl] > LEVEL_ORDER[overall]) overall = lvl;
  });
  return { overall, checks: checks.sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]) };
}

// Fix for low muscle sets: extra sets on a later session, or a short home session on a free day.
function muscleFix(monday, g, short) {
  const n = Math.max(2, Math.min(4, short));
  for (const key of weekKeys(monday).filter((k) => k >= todayKey())) {
    const s = sessionsOn(key).find((x) => x.status === "planned" && ["full-gym", "short-gym", "home", "light-home"].includes(x.type));
    if (!s) continue;
    const where = typeInfo(s.type).strength ? "gym" : "home";
    const ex = (sessionExercises(s).find((e) => (exById(e.ex) || { groups: [] }).groups[0] === g) || {}).ex || MAKE_UP_EXERCISES[g][where];
    return { label: `Add ${n} sets ${dayName(key)}`, action: "fix-extra", sid: s.id, ex, n, day: dayLong(key) };
  }
  const day = freeDay(monday, false);
  const tpl = tplById(MAKE_UP_HOME[g]);
  return day && tpl ? { label: `Add ${tpl.name.split(":")[0].toLowerCase()} ${dayName(day)}`, action: "fix-add", key: day, type: tpl.type, tpl: tpl.id, name: tpl.name, day: dayLong(day) } : null;
}
function muscleFixText(monday, g, short) {
  const f = muscleFix(monday, g, short);
  if (!f) return "plan a few extra sets next week.";
  return f.action === "fix-extra" ? `add ${f.n} extra sets to ${f.day}'s session?` : `add "${f.name}" on ${f.day}?`;
}

// Are your main lifts going up over 3-4 weeks?
function strengthTrend() {
  const since = addDays(todayKey(), -28);
  const goalIds = GOALS.map((g) => g.exercise);
  const logged = [...new Set(fit().workouts.flatMap((w) => w.exercises.map((e) => e.ex)))];
  const ids = [...goalIds, ...logged.filter((x) => !goalIds.includes(x))];
  let up = null;
  for (const id of ids) {
    const h = exerciseHistory(id).filter((x) => x.byWeight && x.date >= since);
    if (h.length < 3 || daysBetween(h[0].date, todayKey()) < 21) continue;
    const first = h[0].top, recent = Math.max(...h.slice(-2).map((x) => x.top));
    if (recent <= first) return { stalled: { ex: id, top: recent } };
    if (!up || recent - first > up.gain) up = { ex: id, gain: Math.round((recent - first) * 10) / 10 };
  }
  return { up };
}


// ---------- 2. Bali projection ----------
// Uses your weekly best over the last 8 weeks to work out a steady rate,
// then projects it forward to your Bali date.
function baliProjection(goal) {
  const h = exerciseHistory(goal.exercise).filter((x) => x.byWeight);
  const weeksLeft = Math.max(0, daysBetween(todayKey(), data.settings.baliDate) / 7);
  if (!h.length) return { state: "none", weeksLeft };
  const byWeek = {};
  h.forEach((x) => { const m = mondayOf(x.date); byWeek[m] = Math.max(byWeek[m] || 0, x.top); });
  const pts = Object.entries(byWeek).sort().slice(-8).map(([m, v]) => [daysBetween(mondayOf(todayKey()), m) / 7, v]);
  const current = Math.max(...h.slice(-3).map((x) => x.top));
  let rate = 0;
  if (pts.length >= 2) {
    const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const num = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0), den = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
    rate = den ? Math.max(0, num / den) : 0;
  }
  // Early gains are quick but always slow down, so the pace is capped at a
  // realistic steady rate (about one small step every 2 weeks).
  const ex = exById(goal.exercise);
  rate = Math.min(rate, (ex.step || 2.5) / 2);
  const projected = Math.round((current + rate * weeksLeft) * 2) / 2;
  const reachIn = rate > 0 && current < goal.target ? Math.ceil((goal.target - current) / rate) : null;
  return { state: pts.length >= 2 ? "ok" : "early", current, rate, projected, weeksLeft, reachIn,
    needed: weeksLeft ? Math.max(0, (goal.target - current) / weeksLeft) : 0 };
}

function baliProjectionHTML() {
  return `<div class="card">
    <p class="label" style="margin-top:0">Bali projection</p>
    <p class="small muted">Where your key lifts are heading by ${niceDate(data.settings.baliDate).slice(4)}, at your current pace.</p>
    ${GOALS.map((g) => {
      const p = baliProjection(g);
      const top = Math.max(g.target * 1.15, p.projected || 0, 1);
      const pct = (v) => Math.min(100, ((v - 0) / top) * 100);
      let line;
      if (p.state === "none") line = `Log ${g.label.toLowerCase()} to see a projection.`;
      else if (p.state === "early") line = `Now ${p.current} ${g.unit}. Log one more week to see your pace.`;
      else if (p.current >= g.target) line = `Goal reached: <strong>${p.current} ${g.unit}</strong> Anything more is a bonus.`;
      else if (p.projected >= g.target) line = `Ahead of pace: at a steady rate you should pass <strong>${g.target} ${g.unit.replace(" each side", "")}</strong> around ${niceDate(addDays(todayKey(), p.reachIn * 7)).slice(4)}, well before Bali ✓`;
      else line = `Heading for about <strong>${p.projected} ${g.unit}</strong> (goal ${g.text}). Adding ${Math.ceil(p.needed * 2 * 4) / 4}kg every 2 weeks gets you there.`;
      return `<div style="margin-bottom:14px">
          <div class="row between"><strong>${g.label}</strong><span class="small muted">Goal ${g.text}</span></div>
          <div class="proj">
            ${p.current ? `<span class="proj-now" style="width:${pct(p.current)}%"></span>` : ""}
            ${p.state === "ok" ? `<span class="proj-ahead" style="left:${pct(p.current)}%;width:${Math.max(0, pct(p.projected) - pct(p.current))}%"></span>` : ""}
            <i style="left:${pct(g.target)}%"></i>
          </div>
          <p class="small" style="margin:4px 0 0">${line}</p>
        </div>`;
    }).join("")}
    <p class="small muted">Solid bar: now. Light bar: projected. Line: your goal.</p>
  </div>`;
}


// ---------- 3. Charts ----------
// Bars for the last few weeks. Each item: { label, a, b } (a = solid part, b = lighter part on top).
function barChart(items, band) {
  const W = 320, H = 150, padL = 10, padB = 22, padT = 14;
  const max = Math.max(...items.map((i) => (i.a || 0) + (i.b || 0)), band ? band[1] || band[0] : 0, 1) * 1.1;
  const bw = (W - padL * 2) / items.length;
  const y = (v) => padT + (1 - v / max) * (H - padT - padB);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart">
    ${band ? `<rect x="${padL}" y="${y(band[1] || band[0] * 1.3)}" width="${W - padL * 2}" height="${y(band[0]) - y(band[1] || band[0] * 1.3)}" class="band"/>` : ""}
    ${items.map((it, i) => {
      const x = padL + i * bw + bw * 0.18, w = bw * 0.64;
      const a = it.a || 0, b = it.b || 0;
      return `<rect x="${x}" y="${y(a)}" width="${w}" height="${H - padB - y(a)}" rx="4" class="bar-a" ${it.color ? `style="fill:${it.color}"` : ""}/>
        ${b ? `<rect x="${x}" y="${y(a + b)}" width="${w}" height="${y(a) - y(a + b)}" rx="4" class="bar-b"/>` : ""}
        ${a + b ? `<text x="${x + w / 2}" y="${y(a + b) - 4}" text-anchor="middle">${a + b}</text>` : ""}
        <text x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${it.label}</text>`;
    }).join("")}
  </svg>`;
}

let chartEx = null;
let chartMuscle = "glutes";

function chartsHTML() {
  const logged = [...new Set(fit().workouts.flatMap((w) => w.exercises.filter((e) => doneSets(e).length).map((e) => e.ex)))];
  if (!chartEx || !logged.includes(chartEx)) chartEx = logged.includes("hip-thrust") ? "hip-thrust" : logged[0];
  const h = chartEx ? exerciseHistory(chartEx) : [];
  const goal = GOALS.find((g) => g.exercise === chartEx);
  const ex = chartEx ? exById(chartEx) : null;
  const mondays = Array.from({ length: 8 }, (_, i) => addDays(mondayOf(todayKey()), (i - 7) * 7));
  const t = fit().targets;
  const m = data.measurements.slice().sort((a, b) => a.date.localeCompare(b.date));
  const series = (field) => m.filter((x) => x[field]).map((x) => ({ date: x.date, weight: x[field], reps: [x[field]] }));

  return `
    <div class="card">
      <h2>Weight over time</h2>
      ${logged.length ? `<select data-chart-ex>${logged.map((id) => `<option value="${id}" ${id === chartEx ? "selected" : ""}>${esc((exById(id) || { name: id }).name)}</option>`).join("")}</select>
        ${lineChart(h.map((x) => ({ date: x.date, weight: x.top, reps: [x.top] })), goal ? goal.target : null)}
        <p class="small muted">${ex && h.some((x) => x.byWeight) ? `Heaviest set each session (${ex.unit})` : "Best reps each session"}${goal ? " · dashed line = Bali goal" : ""}</p>`
        : `<p class="muted">Log a workout to see your charts.</p>`}
    </div>

    <div class="card">
      <h2>Weekly sets per muscle</h2>
      <div class="chips">${["glutes", "back", "triceps", "core", "legs"].map((g) =>
        `<button class="chip ${chartMuscle === g ? "on" : ""}" data-action="chart-muscle" data-g="${g}">${MUSCLE_GROUPS.find((x) => x.id === g).label}</button>`).join("")}</div>
      ${barChart(mondays.map((mo) => ({ label: niceDate(mo).slice(4, 6).trim(), a: weekSets(mo).done[chartMuscle] || 0 })), t[chartMuscle] || null)}
      <p class="small muted">Sets you completed each week${t[chartMuscle] ? " · shaded = your target range" : ""}. Labels are the Monday's date.</p>
    </div>

    <div class="card">
      <h2>Sessions per week</h2>
      ${barChart(mondays.map((mo) => { const s = weekScore(mo); return { label: niceDate(mo).slice(4, 6).trim(), a: s.strength, b: s.other }; }))}
      <p class="small muted">Dark = strength sessions, light = other sessions (home, runs, surf, Pilates).</p>
    </div>

    <div class="card">
      <h2>Measurements</h2>
      ${series("waist").length ? `<p class="small" style="margin:0"><strong>Waist (cm)</strong></p>${lineChart(series("waist"))}` : ""}
      ${series("hips").length ? `<p class="small" style="margin:0"><strong>Hips (cm)</strong></p>${lineChart(series("hips"))}` : ""}
      ${!m.length ? `<p class="muted">Add measurements under Body to see them here.</p>` : ""}
    </div>
  `;
}


// ---------- 4. Screens ----------
function fitnessProgressScreen(section = "goals") {
  const tabs = [["goals", "Goals"], ["charts", "Charts"], ["body", "Body"]];
  const nav = `<div class="chips">${tabs.map(([k, l]) => `<a class="chip ${section === k ? "on" : ""}" href="#fitness/progress/${k}">${l}</a>`).join("")}</div>`;
  if (section === "charts") return nav + chartsHTML();
  if (section === "body") return nav + measurementsHTML() + photoHTML() + feelingsHTML();
  return nav + goalsHTML() + baliProjectionHTML() + weeksSummaryHTML();
}

function fixButton(fix) {
  if (!fix) return "";
  if (fix.href) return `<a class="btn sm dark" href="${fix.href}">${esc(fix.label)}</a>`;
  const attrs = Object.entries(fix).filter(([k]) => !["label", "action"].includes(k)).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ");
  return `<button class="sm dark" data-action="${fix.action}" ${attrs}>${esc(fix.label)}</button>`;
}

function goalsHTML() {
  const { overall, checks } = goalChecks();
  return `<div class="card status-card ${overall}">
      <div class="row between"><p class="label" style="margin:0">This week</p><span class="status-pill ${overall}">${STATUS_TEXT[overall]}</span></div>
      ${checks.map((c) => `<div class="check">
          <span class="dot ${c.level}"></span>
          <div class="grow"><p style="margin:0">${esc(c.text)}</p>${c.fix ? `<div style="margin-top:6px">${fixButton(c.fix)}</div>` : ""}</div>
        </div>`).join("")}
    </div>`;
}

// The status card on Home: overall colour plus ONE suggested fix.
function statusHomeHTML() {
  const { overall, checks } = goalChecks();
  const top = checks.find((c) => c.level !== "green" && c.fix) || checks.find((c) => c.level !== "green");
  return `<div class="card status-card ${overall}">
      <div class="row between"><p class="label" style="margin:0">Progress</p><span class="status-pill ${overall}">${STATUS_TEXT[overall]}</span></div>
      <p style="margin:8px 0 ${top && top.fix ? "10px" : "0"}">${top ? esc(top.text) : "Everything's on track. Keep doing what you're doing."}</p>
      <div class="row" style="gap:8px">${top && top.fix ? fixButton(top.fix) : ""}<a class="btn sm" href="#fitness/progress">All goals</a></div>
    </div>`;
}

function weeksSummaryHTML() {
  const totals = weekTypeTotals();
  const all = fit().workouts.length;
  return `<div class="dark-card col">
    <div class="lbl">Your weeks</div>
    <div class="stat-grid">
      <div><b>${dayStreak()}</b><span>day streak</span></div>
      <div><b>${weekWinStreak()}</b><span>weeks won</span></div>
      <div><b>${all}</b><span>workouts</span></div>
    </div>
    <p class="small" style="margin:10px 0 0;opacity:0.75">${totals.normal} Normal · ${totals.busy} Busy · ${totals.light} Light weeks. Busy and Light weeks still count.</p>
  </div>`;
}

// Weekly targets, shown in Settings.
function targetsSettingsHTML() {
  const t = fit().targets;
  const num = (path, val, label) => `<label class="field grow">${label}<input type="number" inputmode="numeric" data-target="${path}" value="${val ?? ""}"></label>`;
  return `<div class="card">
    <p class="label" style="margin-top:0">Weekly fitness targets</p>
    ${num("strength", t.strength, "Strength sessions per week")}
    ${["glutes", "back", "triceps", "core"].map((g) => `<div class="row">${num(g + ".0", t[g][0], MUSCLE_GROUPS.find((m) => m.id === g).label + " sets: min")}${num(g + ".1", t[g][1], "max")}</div>`).join("")}
    <div class="row">${num("runs.0", t.runs[0], "Runs: min")}${num("runs.1", t.runs[1], "max")}</div>
    <p class="small muted">Leave "max" empty for no upper limit. Busy weeks aim for about 60% of these.</p>
  </div>`;
}


// ---------- 5. Buttons ----------
Object.assign(ACTIONS, {
  "fix-add"({ key, type, tpl }) {
    addSession(key, newSession(type, tpl || null, key));
    saveData();
    toast(`Added to ${niceDate(key)}`);
    render();
  },
  "fix-extra"({ sid, ex, n }) {
    const found = findSession(sid);
    if (found) { found.s.extra = found.s.extra || {}; found.s.extra[ex] = (found.s.extra[ex] || 0) + Number(n); }
    saveData();
    toast(`Added ${n} sets to ${found ? dayLong(found.key) : "that day"}`);
    render();
  },
  "fix-bump"({ ex, w }) {
    fit().bump[ex] = Number(w);
    saveData();
    toast(`Next time, ${exById(ex).name} starts at ${w}kg`);
    render();
  },
  "chart-muscle"({ g }) { chartMuscle = g; render(); }
});

document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.chartEx !== undefined) { chartEx = el.value; render(); }
  if (el.dataset.target) {
    const [key, i] = el.dataset.target.split(".");
    const v = el.value === "" ? null : Number(el.value);
    if (i === undefined) fit().targets[key] = v || 1; else fit().targets[key][Number(i)] = v;
    saveData();
    toast("Target saved");
  }
});
