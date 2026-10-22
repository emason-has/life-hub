// =====================================================================
// SAVES (under More)
// Your Instagram saved posts, sorted into groups.
//
//   1. Groups and words that sort a post
//   2. Reading an Instagram export (or the sorted file Claude made)
//   3. Turning a save into a recipe or a workout
//   4. Screens
//   5. Buttons
//
// Updating later: export from Instagram again (Saved, JSON) and import
// saved_posts.json here. Posts you already have are skipped (matched by
// link), so your groups, ticks and recipes stay as they are.
// =====================================================================

// ---------- 1. Groups ----------
const SAVE_CATS = {
  recipes: { label: "Recipes", icon: "food" },
  fitness: { label: "Fitness", icon: "dumbbell" },
  ai:      { label: "Claude & AI", icon: "star" },
  look:    { label: "Look into", icon: "search" },
  other:   { label: "Other", icon: "more" }
};

// Words that point to a group. Used for posts in a fresh Instagram export.
const SAVE_WORDS = {
  recipes: /\b(ingredients?|recipe|serves|servings?|protein per|calories|cals|meal ?prep|slow ?cook|air ?fryer|dinner|lunch|breakfast|tbsp|tsp)\b/i,
  fitness: /\b(workout|glutes?|pilates|core|gym|reps|sets|squats?|deadlift|hip thrust|posture|stretch|mobility|split|training|abs)\b/i,
  ai:      /\b(claude|chatgpt|gpt|ai tools?|prompts?|anthropic|automation)\b/i,
  look:    /\b(perth|cafe|restaurant|trail|hike|beach|travel|bali|visit|course|leave|holiday|guide|tips?)\b/i
};

function saves() { return data.saves || (data.saves = []); }
function saveById(id) { return saves().find((s) => s.id === id); }

// Picks the group with the most matching words. "unsure" when it's a close call.
function guessSaveCat(post) {
  const text = `${post.caption} ${post.tags.join(" ")} ${post.name}`;
  const scores = Object.entries(SAVE_WORDS).map(([cat, re]) =>
    [cat, (text.match(new RegExp(re.source, "gi")) || []).length]).sort((a, b) => b[1] - a[1]);
  const [best, second] = scores;
  if (!best[1]) return { cat: "other", unsure: "No clues in the caption" };
  if (second[1] && second[1] >= best[1] * 0.7) return { cat: best[0], unsure: `Could also be ${SAVE_CATS[second[0]].label}` };
  return { cat: best[0] };
}

// ---------- 2. Importing ----------
// Instagram stores accents and emoji oddly ("ð\u009f..."). This turns them back.
function fixInstaText(text) {
  if (!text || /[^\u0000-ÿ]/.test(text)) return text || "";
  try { return new TextDecoder().decode(Uint8Array.from(text, (c) => c.charCodeAt(0))); } catch (e) { return text; }
}

// One post from Instagram's saved_posts.json.
function readInstaPost(item) {
  const post = { url: "", user: "", name: "", caption: "", tags: [], ts: item.timestamp || 0 };
  for (const lv of item.label_values || []) {
    if (lv.label === "URL") post.url = lv.value;
    else if (lv.label === "Caption" && !post.caption) post.caption = fixInstaText(lv.value);
    else if (lv.title === "Owner") (lv.dict || []).forEach((o) => (o.dict || []).forEach((f) => {
      if (f.label === "Username") post.user = f.value;
      if (f.label === "Name") post.name = fixInstaText(f.value);
    }));
    else if (lv.title === "Hashtags") post.tags = (lv.dict || []).flatMap((o) => (o.dict || []).map((f) => fixInstaText(f.value)));
  }
  return post;
}

// Adds posts that aren't here yet. Returns how many were new.
function addSaves(posts, sorted) {
  const have = new Set(saves().map((s) => s.url));
  let added = 0;
  for (const p of posts) {
    if (!p.url || have.has(p.url)) continue;
    const group = sorted && p.cat ? { cat: p.cat, unsure: p.unsure } : guessSaveCat(p);
    saves().push({ id: p.url.split("/").filter(Boolean).pop(), url: p.url, user: p.user, name: p.name,
      caption: p.caption, tags: p.tags || [], ts: p.ts, cat: group.cat, unsure: group.unsure || "", done: false });
    have.add(p.url);
    added++;
  }
  return added;
}

function importSaves(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = JSON.parse(reader.result);
      let added, workouts = 0;
      if (incoming && incoming.lifehubSaves) {
        // The sorted file Claude made: groups are already set, and it can carry workouts.
        added = addSaves(incoming.saves, true);
        for (const t of incoming.templates || []) {
          if (!fit().templates.some((x) => x.id === t.id)) { fit().templates.push(clone(t)); workouts++; }
        }
      } else {
        const list = Array.isArray(incoming) ? incoming : incoming.saved_saved_media || [];
        if (!list.length || !list[0].label_values && !list[0].string_map_data) throw new Error("not saves");
        added = addSaves(list.map(readInstaPost));
      }
      saveData();
      toast(`${added} new save${added === 1 ? "" : "s"} added${workouts ? `, plus ${workouts} workouts` : ""}`);
      render();
    } catch (e) {
      toast("That file doesn't look like saved_posts.json.");
    }
  };
  reader.readAsText(file);
  document.getElementById("saves-file").value = "";
}

// ---------- 3. Recipes and workouts from a save ----------
function recipeFromSave(s) {
  const r = readPastedRecipe(s.caption);
  const text = s.caption.toLowerCase();
  const tags = [];
  if (r.protein >= 30) tags.push("High protein");
  if (/meal ?prep/.test(text)) tags.push("Meal prep friendly");
  if (/slow ?cook/.test(text)) tags.push("Slow cooker");
  if (/\bquick\b|\b(\d+|ten|fifteen)[- ]?min/.test(text)) tags.push("Quick");
  return {
    id: "r-" + Date.now(),
    name: tidyName(r.name) || `Recipe from @${s.user}`,
    meal: /breakfast|oats|muffin|pancake|smoothie/.test(text) ? "breakfast" : /snack|bars?\b|balls?\b|cake/.test(text) ? "snack" : "dinner",
    serves: r.serves || 4,
    protein: r.protein || "",
    ingredients: r.ingredients,
    method: r.method,
    link: s.url,
    tags
  };
}

// Drops leftover emoji bits and turns SHOUTY CAPS into normal words.
function tidyName(name) {
  const clean = (name || "").replace(/[\u{1F1E6}-\u{1F1FF}\uFE0F\u200D]/gu, "").replace(/\s+/g, " ").trim();
  return clean === clean.toUpperCase() ? clean.charAt(0) + clean.slice(1).toLowerCase() : clean;
}

// Other ways people write exercise names in captions.
const EX_ALIASES = [
  [/\brdls?\b|romanian dead ?lift/, "db-rdl"], [/kick ?backs?/, "glute-kickback"], [/abduct/, "hip-abduction"],
  [/bulgarian|split squat/, "bulgarian"], [/goblet/, "goblet-squat"], [/sumo squat|pli[eé] squat/, "sumo-squat"],
  [/toe taps?/, "toe-taps"], [/leg raises?/, "flat_bench_lying_leg_raise"], [/bicycles?\b/, "air_bike"],
  [/side plank/, "side-plank"], [/\bplank\b/, "plank"], [/knee tucks?/, "roller-knee-tuck"], [/\bpikes?\b/, "roller-pike"],
  [/step[- ]?ups?/, "step-ups"], [/\blunges?\b/, "reverse-lunge"], [/pull ?downs?/, "lat-pulldown"],
  [/face ?pulls?/, "face-pull"], [/hamstring curls?|leg curls?/, "ham-curl"], [/clams?\b/, "clams"]
];

// Finds exercises named in a caption, with sets and reps when written like "3 x 12".
function exercisesFromCaption(caption) {
  const found = [];
  const names = EXERCISES.filter((e) => e.curated).map((e) => [e.name.toLowerCase().replace(/\(.*?\)/g, "").trim(), e.id]);
  const lines = caption.toLowerCase().split("\n");
  lines.forEach((line, i) => {
    const hit = names.find(([n]) => n.length > 4 && line.includes(n)) || EX_ALIASES.find(([re]) => re.test(line));
    const id = hit && hit[1];
    if (!id || found.some((f) => f.ex === id)) return;
    // Sets and reps are often on the line itself or a line or two below ("Try: 4 sets of 6-8 reps").
    const near = lines.slice(i, i + 4).join(" ");
    const sr = near.match(/(\d+)\s*[x×]\s*(\d+)/) || near.match(/(\d+)(?:\s*[–-]\s*\d+)?\s*sets? of\s*(\d+)(?:\s*[–-]\s*(\d+))?/);
    found.push({ ex: id, sets: sr ? Number(sr[1]) : 3, reps: sr ? Number(sr[3] || sr[2]) : 12, rest: 60 });
  });
  return found;
}

function workoutFromSave(s) {
  const text = s.caption.toLowerCase();
  const exercises = exercisesFromCaption(s.caption);
  const gym = exercises.some((e) => (exById(e.ex) || {}).where === "gym") || /\bgym\b|machine|cable/.test(text);
  const first = s.caption.split("\n")[0].replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/#\S+/g, "").trim();
  return { id: uid("t"), name: first.length > 3 && first.length < 40 ? first : `Saved: @${s.user}`,
    type: /pilates/.test(text) ? "pilates" : gym ? "full-gym" : "home", exercises, link: s.url };
}

// ---------- 4. Screens ----------
let saveFilter = "all";
let saveQuery = "";
let showDone = false;
let pickedSave = null;

function savesScreen(id) {
  if (id) return saveScreen(id);
  const all = saves();
  const open = all.filter((s) => !s.done);
  const count = (cat) => open.filter((s) => s.cat === cat).length;
  const unsure = open.filter((s) => s.unsure).length;
  const picked = pickedSave && saveById(pickedSave);
  return `
    ${topBar(backBtn("#more"), `<button class="circ" data-action="saves-import" aria-label="Import">${icon("plus")}</button>`)}
    ${headline("Saves", all.length ? `${open.length} to look at` : "from Instagram")}
    <input type="file" id="saves-file" accept=".json,application/json" hidden>
    ${all.length ? `
      <label class="search">${icon("search")}<input id="saves-search" type="search" placeholder="Search captions or accounts" value="${esc(saveQuery)}"></label>
      <nav class="chips">
        ${[["all", "All", open.length], ...Object.entries(SAVE_CATS).map(([k, c]) => [k, c.label, count(k)]),
          ...(unsure ? [["unsure", "Check", unsure]] : [])].map(([k, label, n]) =>
          `<button class="chip ${saveFilter === k ? "on" : ""}" data-action="saves-filter" data-f="${k}">${label} ${n}</button>`).join("")}
      </nav>
      <div class="row" style="gap:8px;margin-bottom:12px">
        <button class="grow dark" data-action="saves-pick">${icon("star")} Pick one for me</button>
        <button class="grow" data-action="saves-done-toggle">${showDone ? "Hide done" : "Show done"}</button>
      </div>
      ${picked ? `<div class="card list-card"><p class="label" style="margin:12px 0 0">Have a look at this one</p>${saveRow(picked)}</div>` : ""}
      <div id="saves-list">${savesListHTML()}</div>`
    : `<div class="card">
        <p>Bring in your Instagram saved posts and they'll be sorted into Recipes, Fitness, Claude & AI, Look into and Other.</p>
        <button class="full dark" data-action="saves-import">Import saved_posts.json</button>
      </div>`}
    <details class="card drop-card">
      <summary class="li">${icon("bell", "tile")}<span class="grow">Updating with a fresh export</span>${icon("down", "chev")}</summary>
      <div class="drop-body small"><ol>
        <li>Instagram: Accounts Center, Your information and permissions, Export your information.</li>
        <li>Pick just <b>Saved</b>, format <b>JSON</b>, and export to your phone or Google Drive.</li>
        <li>Unzip it in the Files app and find <b>your_instagram_activity/saved/saved_posts.json</b>.</li>
        <li>Tap ${icon("plus")} at the top of this page and pick that file.</li>
      </ol>
      <p class="muted">Only new posts are added. Your groups, ticks and recipes stay as they are.</p></div>
    </details>
  `;
}

function filteredSaves() {
  const q = saveQuery.trim().toLowerCase();
  return saves()
    .filter((s) => showDone || !s.done)
    .filter((s) => saveFilter === "all" || (saveFilter === "unsure" ? s.unsure : s.cat === saveFilter))
    .filter((s) => !q || `${s.user} ${s.name} ${s.caption}`.toLowerCase().includes(q))
    .sort((a, b) => a.done - b.done || b.ts - a.ts);
}

function savesListHTML() {
  const list = filteredSaves();
  return list.length ? `<div class="card list-card">${list.map(saveRow).join("")}</div>`
    : `<p class="muted" style="padding:12px">Nothing here.</p>`;
}

// The first useful line of a caption, as a title.
function saveTitle(s) {
  const line = (s.caption || "").split("\n").map((l) => l.replace(/#\S+/g, "").trim()).find((l) => l.length > 2);
  return line ? tidyName(line) : `Post by @${s.user}`;
}

function saveRow(s) {
  return `<div class="li save-row ${s.done ? "done" : ""}">
      <button class="circle-tick ${s.done ? "on" : ""}" data-action="save-done" data-id="${s.id}" aria-label="Done">${s.done ? icon("check") : ""}</button>
      <a class="grow save-txt" href="#saves/${s.id}">
        <span class="small muted">${icon(SAVE_CATS[s.cat].icon)} @${esc(s.user || "unknown")}${s.unsure ? ` · <span class="save-flag">check</span>` : ""}</span>
        <span class="save-title">${esc(saveTitle(s))}</span>
      </a>
      ${icon("chev", "chev")}
    </div>`;
}

function saveScreen(id) {
  const s = saveById(id);
  if (!s) return `${topBar(backBtn("#saves"))}<p>Save not found.</p>`;
  const recipe = s.recipeId && findRecipe(s.recipeId);
  const workout = s.tplId && tplById(s.tplId);
  return `
    ${topBar(backBtn("#saves"), `<a class="circ" href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="Open in Instagram">${icon("arrow")}</a>`)}
    <p class="small muted">@${esc(s.user)}</p>
    <h2 class="save-head">${esc(saveTitle(s))}</h2>
    ${s.unsure ? `<p class="small muted">Not sure about the group: ${esc(s.unsure)}. Pick one below.</p>` : ""}
    <nav class="chips">
      ${Object.entries(SAVE_CATS).map(([k, c]) => `<button class="chip ${s.cat === k ? "on" : ""}" data-action="save-cat" data-id="${s.id}" data-cat="${k}">${c.label}</button>`).join("")}
    </nav>
    <a class="btn full dark" href="${esc(s.url)}" target="_blank" rel="noopener">Open in Instagram</a>
    ${s.cat === "recipes" ? (recipe ? `<a class="btn full" href="#recipe/${recipe.id}">In your recipes: ${esc(recipe.name)}</a>`
      : `<button class="full" data-action="save-recipe" data-id="${s.id}">${icon("food")} Add to my recipes</button>`) : ""}
    ${s.cat === "fitness" ? (workout ? `<a class="btn full" href="#tpl/${workout.id}">In your workouts: ${esc(workout.name)}</a>`
      : `<button class="full" data-action="save-workout" data-id="${s.id}">${icon("dumbbell")} Make it a workout</button>`) : ""}
    <button class="full" data-action="save-done" data-id="${s.id}">${s.done ? "Not done yet" : "Done / tried it"}</button>
    <div class="card"><p class="save-caption">${esc(s.caption || "No caption.")}</p></div>
  `;
}

// Home widget: one random save to look at.
function savesHomeHTML() {
  const open = saves().filter((s) => !s.done);
  if (!open.length) return "";
  const s = open[Math.floor(Math.random() * open.length)];
  return `<a class="card next-card" href="#saves/${s.id}">
      ${icon(SAVE_CATS[s.cat].icon, "tile")}
      <span class="grow"><span class="small muted block">From your saves · ${SAVE_CATS[s.cat].label}</span><b class="save-title">${esc(saveTitle(s))}</b></span>
      ${icon("chev", "chev")}
    </a>`;
}

SCREENS.saves = savesScreen;
WIDGETS.saves = { name: "From my saves", icon: "star", html: () => savesHomeHTML() };

// ---------- 5. Buttons ----------
Object.assign(ACTIONS, {
  "saves-import"() { document.getElementById("saves-file").click(); },
  "saves-filter"({ f }) { saveFilter = f; pickedSave = null; render(); },
  "saves-done-toggle"() { showDone = !showDone; render(); },
  "saves-pick"() {
    const pool = filteredSaves().filter((s) => !s.done);
    if (!pool.length) return toast("Nothing left to pick here.");
    pickedSave = pool[Math.floor(Math.random() * pool.length)].id;
    render();
  },
  "save-done"({ id }) {
    const s = saveById(id);
    s.done = !s.done;
    if (s.done && pickedSave === id) pickedSave = null;
    saveData();
    toast(s.done ? "Cleared" : "Back on the list");
    render();
  },
  "save-cat"({ id, cat }) {
    const s = saveById(id);
    s.cat = cat;
    s.unsure = "";
    saveData();
    render();
  },
  "save-recipe"({ id }) {
    const s = saveById(id);
    const r = recipeFromSave(s);
    data.recipes.push(r);
    s.recipeId = r.id;
    saveData();
    toast(r.ingredients.length ? "Added. Check it over and save." : "Added. The recipe is in the video, so fill in the ingredients.");
    location.hash = "#meals/add/" + r.id;
  },
  "save-workout"({ id }) {
    const s = saveById(id);
    const t = workoutFromSave(s);
    fit().templates.push(t);
    s.tplId = t.id;
    saveData();
    toast(t.exercises.length ? `Made a workout with ${t.exercises.length} exercises. Check it over.` : "Made a workout. Search to add what's in the video.");
    location.hash = "#tpl/" + t.id;
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id !== "saves-search") return;
  saveQuery = e.target.value;
  document.getElementById("saves-list").innerHTML = savesListHTML();
});
document.addEventListener("change", (e) => {
  if (e.target.id === "saves-file" && e.target.files[0]) importSaves(e.target.files[0]);
});
