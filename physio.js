// =====================================================================
// PHYSIO (under More, optional Home widget)
// Pick where you're sore and get a gentle routine plus tips, based on
// standard physio self-care advice for common, non-serious aches.
//
//   1. Physio exercises (added to the exercise library)
//   2. Areas: routine, tips, gym changes and when to get checked
//   3. Pain log and trend
//   4. Screens
//   5. Buttons
//
// This is general guidance, not a diagnosis. It always shows the signs
// that mean "get seen now", and suggests a physio when things aren't
// improving.
// =====================================================================

// ---------- 1. Physio exercises ----------
// Gentle rehab moves that weren't in the library. Each one gets cues like
// the rest of the library, and shows up in the Exercises tab too.
function physioEx(id, name, label, steps, cues, mistakes, equip = ["bodyweight"]) {
  return { id, name, groups: ["mobility"], equip, where: "home", unit: "", step: 0, repsLabel: label,
    backFriendly: true, shoulderFriendly: true, upper: false, muscles: [], images: [], steps, cues, mistakes,
    source: "Life Hub", curated: true, physio: true };
}

const PHYSIO_EXERCISES = [
  physioEx("neck-turns", "Neck turns (gentle)", "reps",
    ["Sit tall with your shoulders relaxed.", "Slowly turn your head to look over one shoulder, only as far as is comfortable.", "Come back to the middle and turn the other way."],
    ["Move slowly and stay in a comfortable range", "Keep your shoulders down and still"], ["Pushing into pain", "Jerky, fast movements"]),
  physioEx("upper-trap-stretch", "Upper trap stretch", "sec",
    ["Sit tall and hold the edge of your chair with your right hand.", "Tilt your left ear towards your left shoulder until you feel a gentle stretch on the right side of your neck.", "Hold, then swap sides."],
    ["A gentle stretch only, never sharp", "Keep the shoulder you're stretching down"], ["Pulling your head with your hand", "Shrugging the stretched side"]),
  physioEx("scap-squeeze", "Shoulder blade squeeze", "reps",
    ["Sit or stand tall with your arms by your sides.", "Gently draw your shoulder blades back and down, as if into your back pockets.", "Hold for 5 seconds, then relax."],
    ["Back and down, not up to your ears", "Keep your chin gently tucked"], ["Arching your lower back", "Shrugging up"]),
  physioEx("open-book", "Open book (lying on your side)", "reps",
    ["Lie on your side with your knees bent up in front of you and your arms straight out together.", "Keeping your knees together, lift the top arm up and over, turning your chest to the ceiling.", "Follow your hand with your eyes, pause, then return. Do all reps, then swap sides."],
    ["Knees stay stacked and still", "Breathe out as you open"], ["Letting the knees roll open", "Forcing the arm to the floor"]),
  physioEx("thread-needle", "Thread the needle", "reps",
    ["Start on hands and knees.", "Slide one arm under your body along the floor, letting your shoulder and head lower gently.", "Return, then reach that arm up to the ceiling. Do all reps, then swap sides."],
    ["Turn through your upper back", "Hips stay over your knees"], ["Rushing", "Sitting back onto your heels"]),
  physioEx("knee-to-chest", "Knee to chest", "sec",
    ["Lie on your back with your knees bent and feet flat.", "Bring one knee towards your chest and hold it gently with both hands.", "Hold, lower, then swap legs. Both knees together is fine if it feels better."],
    ["Relax your back into the floor", "Breathe slowly"], ["Lifting your head", "Pulling hard"]),
  physioEx("pelvic-tilt", "Pelvic tilts (lying)", "reps",
    ["Lie on your back with your knees bent and feet flat.", "Gently flatten your lower back into the floor by tilting your pelvis.", "Then gently arch it a little. Move slowly between the two."],
    ["Small, slow and smooth", "Keep your upper body relaxed"], ["Lifting your bottom off the floor", "Holding your breath"]),
  physioEx("prone-press-up", "Lying press-up (back extension)", "reps",
    ["Lie on your front with your hands under your shoulders.", "Keeping your hips on the floor, slowly straighten your arms to lift your chest, only as far as comfortable.", "Pause, then lower."],
    ["Hips stay down, let your back relax", "Only do it if it eases your back pain"], ["Doing it if pain spreads further down your leg", "Tensing your bottom"]),
  physioEx("pendulum", "Shoulder pendulum", "sec",
    ["Lean forward with your good hand on a table and let the sore arm hang down.", "Gently sway your body so the arm swings in small circles or side to side.", "Let gravity do the work."],
    ["Arm stays relaxed and heavy", "Small circles to start"], ["Using your shoulder muscles to swing", "Big, fast circles"]),
  physioEx("wall-slide", "Wall slides", "reps",
    ["Stand facing a wall with the outside edge of your forearms on it, elbows at shoulder height.", "Slide your arms up the wall as far as is comfortable.", "Slide back down slowly."],
    ["Stay in a pain-free range", "Let your shoulder blades move with your arms"], ["Shrugging up to your ears", "Arching your back"]),
  physioEx("side-lying-er", "Side-lying shoulder rotation", "reps",
    ["Lie on your good side with a rolled towel between your top elbow and your side, elbow bent to 90 degrees.", "Keeping the elbow on the towel, rotate your forearm up towards the ceiling.", "Lower slowly. Start with no weight, then a light dumbbell."],
    ["Elbow stays tucked on the towel", "Slow on the way down"], ["Rolling your body back", "Going too heavy"], ["bodyweight", "dumbbells"]),
  physioEx("wrist-ext-iso", "Wrist extension hold (isometric)", "sec",
    ["Sit with your forearm resting on a table, palm down, wrist just over the edge.", "Push the back of your hand up into your other hand (or a fixed object) without moving.", "Hold at a moderate effort, then rest 1 minute between holds."],
    ["Moderate effort, about 5/10 discomfort at most", "Good for calming a sore outer elbow"], ["Pushing so hard it hurts more", "Holding your breath"]),
  physioEx("eccentric-wrist-ext", "Slow wrist lowering, palm down", "reps",
    ["Rest your forearm on a table, palm down, wrist over the edge, holding a light weight (a water bottle is fine).", "Use your other hand to help lift the wrist up.", "Slowly lower it down over 3 to 4 seconds by yourself."],
    ["Help on the way up, slow on the way down", "Some discomfort (up to 3 to 4/10) is okay if it settles by the next day"], ["Too heavy a weight", "Dropping the wrist quickly"], ["dumbbells"]),
  physioEx("eccentric-wrist-flex", "Slow wrist lowering, palm up", "reps",
    ["Rest your forearm on a table, palm up, wrist over the edge, holding a light weight.", "Use your other hand to help curl the wrist up.", "Slowly lower it down over 3 to 4 seconds by yourself."],
    ["Help on the way up, slow on the way down", "Some discomfort (up to 3 to 4/10) is okay if it settles by the next day"], ["Too heavy a weight", "Dropping the wrist quickly"], ["dumbbells"]),
  physioEx("wrist-ext-stretch", "Wrist extensor stretch", "sec",
    ["Hold your arm out straight, palm down.", "With your other hand, gently bend your wrist down until you feel a stretch on the top of your forearm."],
    ["Gentle stretch, never sharp", "Keep the elbow straight but not locked"], ["Pulling hard", "Bouncing"]),
  physioEx("wrist-flex-stretch", "Wrist flexor stretch", "sec",
    ["Hold your arm out straight, palm up.", "With your other hand, gently bend your fingers and wrist back until you feel a stretch on the underside of your forearm."],
    ["Gentle stretch, never sharp", "Keep the elbow straight but not locked"], ["Pulling hard", "Bouncing"]),
  physioEx("tendon-glides", "Tendon glides (hand)", "reps",
    ["Start with your fingers straight.", "Move slowly through: hook fist (fingertips to the top of your palm), full fist, then flat fist (fingertips to the base of your palm).", "Straighten your fingers between each. That's one rep."],
    ["Slow and smooth", "Wrist stays straight"], ["Squeezing hard", "Rushing"]),
  physioEx("median-slider", "Nerve slider (arm)", "reps",
    ["Sit tall. Hold your arm out to the side at shoulder height, elbow bent, palm up.", "Straighten your elbow and tip your wrist back while tilting your head towards that arm.", "Then bend the elbow and wrist while tilting your head away. Move smoothly between the two."],
    ["It should feel like a gentle movement, not a stretch", "Stop if tingling or numbness increases"], ["Holding the end position", "Pushing into pins and needles"])
];
PHYSIO_EXERCISES.forEach((e) => { if (!exById(e.id)) EXERCISES.push(e); });

// ---------- 2. Areas ----------
// plan: [exercise id, sets, reps or seconds, note]
const PHYSIO_AREAS = {
  neck: {
    label: "Neck", icon: "posture",
    plan: [["chin-tucks", 2, 10, "Hold each for 3 seconds"], ["neck-turns", 1, 10], ["upper-trap-stretch", 2, 30, "Each side"], ["scap-squeeze", 2, 10], ["doorway-stretch", 2, 30]],
    helps: ["Change position every 30 to 45 minutes at a desk", "Screen at eye level, and lift your phone up rather than looking down", "A heat pack for 15 to 20 minutes"],
    avoid: ["Long stretches looking down at your phone", "Sleeping on your stomach with your head turned", "Carrying a heavy bag on one shoulder"],
    gym: ["Skip overhead pressing until it settles", "Keep your chin tucked on rows and pulldowns, never pull behind your neck"],
    see: ["Pain, pins and needles or weakness spreading into your arm", "New or worsening headaches with it", "Not improving after 2 weeks"]
  },
  upperback: {
    label: "Upper back", icon: "posture",
    plan: [["towel-thoracic", 1, 90], ["open-book", 2, 8, "Each side"], ["thread-needle", 2, 8, "Each side"], ["band-pull-apart", 2, 15], ["scap-squeeze", 2, 10]],
    helps: ["Move it often: stiffness here usually eases with movement", "Breaks from sitting every 30 to 45 minutes", "Heat on the area"],
    avoid: ["Slumping for hours at a desk or on the couch", "Holding your breath and bracing when it's sore"],
    gym: ["Rows and band pull-aparts usually help, keep them light and smooth", "Skip heavy shrugs and overhead pressing while it's flared"],
    see: ["Pain that wraps around to your chest, or comes with breathlessness", "Pain that's constant and worse at night", "Not improving after 2 to 3 weeks"]
  },
  lowerback: {
    label: "Lower back", icon: "leaf",
    plan: [["pelvic-tilt", 2, 10], ["knee-to-chest", 2, 30, "Each side"], ["cat-cow", 1, 10], ["childs-pose", 2, 30], ["bird-dog", 2, 8, "Each side"], ["glute-bridge", 2, 10]],
    extra: "Only if it eases your pain: lying press-ups (2 x 10). Skip them if pain spreads further down your leg.",
    helps: ["Keep walking: short walks of 10 to 20 minutes are one of the best things for back pain", "Heat for 15 to 20 minutes", "Keep up your normal day as much as you can. Bed rest slows recovery"],
    avoid: ["Sitting for long periods: get up every 30 minutes", "Heavy lifting with a rounded back until it settles"],
    gym: ["Swap Romanian deadlifts and squats for hip thrusts, glute bridges and light leg press", "It's fine to train if pain stays at 3/10 or less and settles by the next day"],
    see: ["Pain, numbness or weakness spreading below your knee", "Not improving after 2 to 3 weeks"]
  },
  shoulder: {
    label: "Shoulder", icon: "dumbbell",
    plan: [["pendulum", 2, 30], ["wall-slide", 2, 10], ["side-lying-er", 2, 12, "No weight to start"], ["band-pull-apart", 2, 15], ["doorway-stretch", 2, 30, "If comfortable"]],
    helps: ["Keep it moving in a comfortable range: rest alone tends to make it stiffer", "Ice or heat, whichever feels better"],
    avoid: ["Sleeping on the sore side", "Lots of reaching overhead or behind your back while it's sore"],
    gym: ["Skip overhead press and dips for now", "Lateral raises light and below shoulder height", "Neutral grip (palms facing) for pulldowns and rows"],
    see: ["You can't lift your arm, or it's weak", "It started with a fall or a pop", "Night pain stopping sleep for more than 2 weeks", "Not improving after 2 to 3 weeks"]
  },
  elbowout: {
    label: "Outer elbow", sub: "Sore on the outside, worse gripping", icon: "dumbbell",
    plan: [["wrist-ext-iso", 5, 30, "Can calm it down quickly"], ["eccentric-wrist-ext", 3, 15, "Once a day"], ["wrist-ext-stretch", 3, 30]],
    helps: ["These tendons improve with gradual loading, not rest alone. Expect 6 to 12 weeks", "Carry and lift with your palm facing up where you can"],
    avoid: ["Long spells of tight gripping (mouse, phone, bags)", "Pressing or massaging hard right on the sore spot"],
    gym: ["Use lifting straps for rows and pulldowns so you grip less", "Go lighter on anything that hurts the outer elbow", "Neutral grip handles"],
    see: ["Not improving after 6 weeks of these exercises", "Swelling, can't fully straighten the elbow, or it started with a fall"]
  },
  elbowin: {
    label: "Inner elbow", sub: "Sore on the inside, worse curling or gripping", icon: "dumbbell",
    plan: [["eccentric-wrist-flex", 3, 15, "Once a day"], ["wrist-flex-stretch", 3, 30], ["tendon-glides", 2, 5]],
    helps: ["Gradual loading helps these tendons heal. Expect 6 to 12 weeks", "Short breaks from gripping tasks"],
    avoid: ["Heavy curls and tight gripping while it's sore", "Pressing hard on the sore spot"],
    gym: ["Lighter bicep curls, or skip them for now", "Straps for pulling exercises"],
    see: ["Tingling into your ring and little finger", "Not improving after 6 weeks", "Swelling or it started with a fall"]
  },
  wrist: {
    label: "Wrist and forearm", icon: "edit",
    plan: [["tendon-glides", 2, 5], ["wrist-flex-stretch", 2, 30], ["wrist-ext-stretch", 2, 30]],
    helps: ["Short breaks from typing and phone every 30 minutes", "Keep your wrist straight, not bent back, when typing"],
    avoid: ["Leaning your weight on bent-back wrists while it's sore"],
    gym: ["Plank on your forearms, and do push-ups on fists or handles", "Use neutral handles or wrist wraps"],
    see: ["Numbness or tingling in your thumb, index and middle fingers, especially at night", "Swelling or pain after a fall (it could be a fracture)", "Not improving after 2 to 3 weeks"]
  },
  armnerve: {
    label: "Nerve pain down the arm", sub: "Burning, tingling or pins and needles", icon: "bolt",
    plan: [["chin-tucks", 2, 10, "Hold each for 3 seconds"], ["scap-squeeze", 2, 10], ["median-slider", 1, 10, "Gentle. Stop if tingling increases"], ["neck-turns", 1, 10, "Pain-free range only"], ["towel-thoracic", 1, 90]],
    helps: ["Gentle movement helps nerves calm down: sliders should feel easy, never bring on more tingling", "Breaks from sitting and phone use", "A pillow that keeps your neck level at night"],
    avoid: ["Positions that bring on the tingling (long phone use, arms overhead for long)", "Strong stretches that pull into the tingling"],
    gym: ["Start light on upper body, and stop the set if tingling or burning starts", "Skip overhead pressing and heavy shrugs for now"],
    see: ["Weakness (dropping things, grip getting weaker) or numbness that's getting worse: see a GP soon", "Pain down the arm with neck pain that hasn't settled in 2 weeks: see a physio"]
  }
};

// Go to an emergency department (or call 000) for any of these.
const RED_FLAGS = [
  "Numbness around your bottom or genitals, or new trouble peeing or controlling your bowels",
  "Weakness in your arms or legs that's new or getting worse, or trouble walking or balancing",
  "Chest pain, or pain spreading to your jaw or left arm with breathlessness or sweating: call 000",
  "Pain after a serious fall or accident",
  "Fever, feeling very unwell, or unexplained weight loss with your pain"
];

// ---------- 3. Pain log ----------
function physio() { return data.physio || (data.physio = { log: [] }); }
function painLog(area) { return physio().log.filter((l) => l.area === area).sort((a, b) => a.date.localeCompare(b.date)); }
function painToday(area) { const l = painLog(area); return l.length && l[l.length - 1].date === todayKey() ? l[l.length - 1].pain : null; }

// What the trend says: better, the same or worse over the last few weeks.
function painTrend(area) {
  const log = painLog(area).filter((l) => daysBetween(l.date, todayKey()) <= 28);
  if (log.length < 2) return null;
  const first = log[0], last = log[log.length - 1], days = daysBetween(first.date, last.date);
  if (last.pain < first.pain) return { kind: "better", text: `Down from ${first.pain} to ${last.pain} since ${niceDate(first.date)}. Keep going.` };
  if (days >= 14) return { kind: "stuck", text: `Still ${last.pain}/10 after ${days} days. Time to book a physio to check it properly.` };
  return { kind: "same", text: `${first.pain} to ${last.pain} since ${niceDate(first.date)}. Give the routine a week or two.` };
}

function painAdvice(pain) {
  if (pain === null) return "";
  if (pain >= 7) return "That's a lot. Do only the gentlest moves, rest from anything that makes it worse, and see a GP or physio if it doesn't settle in a few days.";
  if (pain >= 4) return "Do the routine gently and skip anything that pushes it above 5. It should settle within a day.";
  return "Good to go. Some discomfort (up to 3/10) is fine as long as it settles by the next day.";
}

// ---------- 4. Screens ----------
function physioScreen(area) {
  if (area && PHYSIO_AREAS[area]) return physioAreaScreen(area);
  const recent = Object.keys(PHYSIO_AREAS).filter((a) => painLog(a).some((l) => daysBetween(l.date, todayKey()) <= 14));
  return `
    ${topBar(backBtn("#more"))}
    ${headline("Your", "physio")}
    ${redFlagsHTML(false)}
    ${recent.length ? `<h3 class="sec-head">Keeping an eye on</h3><div class="card list-card">${recent.map((a) => {
      const log = painLog(a), t = painTrend(a);
      return `<a class="li" href="#physio/${a}">${icon(PHYSIO_AREAS[a].icon, "tile")}<span class="grow">${PHYSIO_AREAS[a].label}
          <span class="small muted block">${t ? t.text : `${log[log.length - 1].pain}/10 on ${niceDate(log[log.length - 1].date)}`}</span></span>${icon("chev", "chev")}</a>`;
    }).join("")}</div>` : ""}
    <h3 class="sec-head">Where's it sore?</h3>
    <div class="card list-card">${Object.entries(PHYSIO_AREAS).map(([id, a]) =>
      `<a class="li" href="#physio/${id}">${icon(a.icon, "tile")}<span class="grow">${a.label}${a.sub ? `<span class="small muted block">${a.sub}</span>` : ""}</span>${icon("chev", "chev")}</a>`).join("")}</div>
    <p class="hint">General self-care guidance for common aches, not a diagnosis. If you're unsure, or it isn't getting better, see a physio or GP.</p>
  `;
}

function redFlagsHTML(open) {
  return `<details class="card drop-card red-flags" ${open ? "open" : ""}>
      <summary class="li">${icon("bell", "tile warn-tile")}<span class="grow"><strong>Get seen now if...</strong><span class="small muted block">Check these first</span></span>${icon("down", "chev")}</summary>
      <div class="drop-body"><ul class="check-list">${RED_FLAGS.map((f) => `<li>${icon("bolt", "warn")} ${esc(f)}</li>`).join("")}</ul>
        <p class="small muted" style="margin:10px 0 0">Go to an emergency department or call 000 for any of these.</p></div>
    </details>`;
}

function physioAreaScreen(id) {
  const a = PHYSIO_AREAS[id];
  const pain = painToday(id);
  const trend = painTrend(id);
  const list = (title, ic, items, cls = "") => `<details class="card drop-card">
      <summary class="li">${icon(ic, "tile")}<span class="grow"><strong>${title}</strong></span>${icon("down", "chev")}</summary>
      <div class="drop-body"><ul class="check-list">${items.map((t) => `<li>${icon(cls ? "bolt" : "check", cls)} ${esc(t)}</li>`).join("")}</ul></div>
    </details>`;
  return `
    ${topBar(backBtn("#physio"))}
    ${headline(a.label, "routine")}
    <div class="card">
      <p class="label" style="margin-top:0">How sore is it right now?</p>
      <div class="pain-scale">${Array.from({ length: 11 }, (_, n) =>
        `<button class="${pain === n ? "on" : ""} ${n >= 7 ? "hi" : n >= 4 ? "mid" : ""}" data-action="pain-log" data-area="${id}" data-pain="${n}">${n}</button>`).join("")}</div>
      <p class="small muted" style="margin:8px 0 0">${pain === null ? "0 is no pain, 10 is the worst. Logging it each time shows if it's improving." : esc(painAdvice(pain))}</p>
      ${trend ? `<p class="small" style="margin:8px 0 0">${icon(trend.kind === "better" ? "check" : "chart", trend.kind === "stuck" ? "warn" : "")} ${esc(trend.text)}</p>` : ""}
    </div>

    <h3 class="sec-head">Your routine <span class="muted small">about 10 min, once or twice a day</span></h3>
    <div class="card list-card">${a.plan.map(([ex, sets, reps, note]) => {
      const e = exById(ex);
      return `<a class="li" href="#ex/${ex}">${exThumb(e)}<span class="grow">${esc(e.name)}
          <span class="small muted block">${sets} × ${reps} ${e.repsLabel === "sec" ? "sec" : "reps"}${note ? ` · ${esc(note)}` : ""}</span></span>${icon("chev", "chev")}</a>`;
    }).join("")}</div>
    ${a.extra ? `<p class="hint">${esc(a.extra)}</p>` : ""}
    <button class="full dark" data-action="physio-start" data-area="${id}">${icon("play")} Do this routine now</button>
    <p class="hint">Pain during the exercises: 0 to 3 is fine, 4 to 5 ease off, over 5 stop that one. It should settle by the next morning.</p>

    ${list("What helps", "check", a.helps)}
    ${list("Avoid for now", "x", a.avoid, "warn")}
    ${list("At the gym", "dumbbell", a.gym)}
    ${list("Book a physio or GP if", "heart", a.see, "warn")}
    ${redFlagsHTML(false)}
    <p class="hint">General self-care guidance, not a diagnosis.</p>
  `;
}

// Home widget: how your sore spot is tracking.
function physioHomeHTML() {
  const recent = Object.keys(PHYSIO_AREAS).map((a) => [a, painLog(a)]).filter(([, l]) => l.length)
    .sort((x, y) => y[1][y[1].length - 1].date.localeCompare(x[1][x[1].length - 1].date))[0];
  if (!recent) return `<a class="card next-card" href="#physio">${icon("heart", "tile")}
      <span class="grow"><span class="small muted block">Physio</span><b class="save-title">Sore somewhere? Get a routine</b></span>${icon("chev", "chev")}</a>`;
  const [a, log] = recent, t = painTrend(a), done = painToday(a) !== null;
  return `<a class="card next-card" href="#physio/${a}">${icon(PHYSIO_AREAS[a].icon, "tile")}
      <span class="grow"><span class="small muted block">Physio · ${PHYSIO_AREAS[a].label}</span>
        <b class="save-title">${done ? `${painToday(a)}/10 today` : "How is it today?"}</b>
        ${t ? `<span class="small muted block">${esc(t.text)}</span>` : ""}</span>${icon("chev", "chev")}</a>`;
}

SCREENS.physio = physioScreen;
WIDGETS.physio = { name: "Physio check-in", icon: "heart", html: () => physioHomeHTML() };

// ---------- 5. Buttons ----------
Object.assign(ACTIONS, {
  "pain-log"({ area, pain }) {
    const log = physio().log;
    const today = todayKey();
    const i = log.findIndex((l) => l.area === area && l.date === today);
    if (i >= 0) log[i].pain = Number(pain); else log.push({ date: today, area, pain: Number(pain) });
    saveData();
    render();
  },
  // Turns the routine into a workout (a posture & care session, so it never counts as missed).
  "physio-start"({ area }) {
    const a = PHYSIO_AREAS[area];
    const id = "t-physio-" + area;
    const exercises = a.plan.map(([ex, sets, reps]) => ({ ex, sets, reps, rest: 20 }));
    const t = tplById(id);
    if (t) Object.assign(t, { exercises });
    else fit().templates.push({ id, name: `Physio: ${a.label}`, type: "posture", exercises, note: "From your Physio section." });
    const today = todayKey();
    const s = sessionsOn(today).find((x) => x.tpl === id && x.status === "planned") || addSession(today, newSession("posture", id, today, true));
    saveData();
    startWorkout(s.id);
  }
});
