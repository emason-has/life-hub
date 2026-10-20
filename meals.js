// =====================================================================
// MEALS (Stage 3)
// Sections:
//   1. Recipe helpers (reading a pasted recipe, protein estimate, food flags)
//   2. Planner helpers (which week, Surprise me, batch cooking)
//   3. Shopping list helpers (adding up ingredients, stores)
//   4. Screens (Plan, Shop, Recipes, one recipe, add/edit, pick a meal)
//   5. Buttons
// The meal content (starter recipes, staples, preferences) is in data.js.
// =====================================================================


// ---------- 1. Recipe helpers ----------
const FRACTIONS = { "½": ".5", "¼": ".25", "¾": ".75", "⅓": ".33", "⅔": ".67" };
const UNITS = ["kg", "g", "ml", "l", "cup", "tbsp", "tsp", "scoop", "tin", "can", "bag", "punnet", "clove", "thumb", "bunch", "pack"];

// Splits "500g Chicken breast" into { qty: 500, unit: "g", name: "Chicken breast" }.
function parseIngredient(line) {
  let text = line.trim().replace(/^[-•*·▪]\s*/, "");
  text = text.replace(/(\d)?\s*([½¼¾⅓⅔])/g, (m, whole, f) => (whole || "0") + FRACTIONS[f]);
  // "1 1/2" becomes 1.5, "1/2" becomes 0.5
  text = text.replace(/^(\d+)\s+(\d+)\/(\d+)/, (m, w, a, b) => String(Number(w) + Math.round((a / b) * 100) / 100));
  text = text.replace(/^(\d+)\/(\d+)/, (m, a, b) => String(Math.round((a / b) * 100) / 100));
  const m = text.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!m) return { qty: null, unit: "", name: text };
  let rest = m[2], unit = "";
  const u = rest.match(/^([a-zA-Z]+)\.?\s+(.*)$/);
  if (u) {
    const word = u[1].toLowerCase().replace(/s$/, "");
    if (UNITS.includes(word)) { unit = word; rest = u[2]; }
  }
  rest = rest.replace(/^of\s+/i, "");
  return { qty: Number(m[1]), unit, name: rest || text };
}

// Pulls the name, ingredients, method, link and protein out of a pasted
// recipe (like an Instagram caption). You check and fix it before saving.
function readPastedRecipe(text) {
  const link = (text.match(/https?:\/\/\S+/) || [""])[0];
  const protein = text.match(/(\d+)\s*g\s*(?:of\s*)?protein/i) || text.match(/protein[:\s]*(\d+)\s*g/i);
  const serves = text.match(/(?:serves|makes|servings?)[:\s]*(\d+)/i);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const intro = [], ingredients = [], method = [];
  let section = "intro";
  for (const line of lines) {
    const words = line.toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (/^(ingredients?|youll need|you need|what you need)/.test(words)) { section = "ingredients"; continue; }
    if (/^(method|instructions|directions|steps|how to)/.test(words)) { section = "method"; continue; }
    if (/^(#\S+\s*)+$/.test(line) || line === link) continue;   // skip hashtag lines and the link
    ({ intro, ingredients, method })[section].push(line);
  }
  // No "Ingredients" heading? Guess: lines that start with a number or a bullet.
  if (!ingredients.length) {
    intro.slice(1).forEach((l) => { if (/^([-•*·]|\d)/.test(l)) ingredients.push(l); });
  }
  const name = (intro[0] || "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/#\S+/g, "").trim().slice(0, 70);
  return {
    name,
    ingredients: ingredients.map((l) => l.replace(/^[-•*·▪]\s*/, "")),
    method: method.join("\n"),
    link,
    protein: protein ? Number(protein[1]) : "",
    serves: serves ? Number(serves[1]) : ""
  };
}

// Rough protein per serve, using the guide in data.js.
function estimateProtein(lines, serves) {
  let total = 0;
  for (const line of lines) {
    const ing = parseIngredient(line);
    const name = ing.name.toLowerCase();
    const guide = PROTEIN_GUIDE.find((g) => g.words.some((w) => name.includes(w)));
    if (!guide || ing.qty === null) continue;
    if (guide.each && (!ing.unit || ing.unit === "scoop")) total += ing.qty * guide.each;
    else if (guide.per100) {
      const grams = ing.unit === "kg" ? ing.qty * 1000 : ing.unit === "g" ? ing.qty : ing.unit === "cup" ? ing.qty * 90 : null;
      if (grams) total += (grams / 100) * guide.per100;
    }
  }
  return Math.round(total / Math.max(1, serves || 1));
}

// Gentle heads-ups based on your food preferences.
function foodFlags(recipe) {
  const text = (recipe.name + " " + recipe.ingredients.join(" ")).toLowerCase();
  const flags = [];
  for (const f of FOOD_FLAGS) {
    const word = f.words.find((w) => new RegExp("\\b" + w).test(text));
    if (word) flags.push(`${word} (${f.reason})`);
  }
  return flags;
}

function findRecipe(id) { return data.recipes.find((r) => r.id === id); }


// ---------- 2. Planner helpers ----------
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let mealWeekOffset = 0;

// The week you're planning. On Sundays it jumps to next week (shop and prep day).
function planMonday() {
  const today = todayKey();
  const base = dayName(today) === "Sun" ? addDays(mondayOf(today), 7) : mondayOf(today);
  return addDays(base, mealWeekOffset * 7);
}

function mealPlan(monday) { return data.mealPlans[monday] || {}; }

// When each recipe was last planned (before the given week).
function lastPlanned(beforeMonday) {
  const map = {};
  for (const [monday, plan] of Object.entries(data.mealPlans)) {
    if (monday >= beforeMonday) continue;
    for (const id of Object.values(plan)) if (!map[id] || map[id] < monday) map[id] = monday;
  }
  return map;
}

// Picks recipes you haven't had for the longest time (a bit shuffled).
function pickRecipes(meal, count, used, filter = () => true) {
  const pool = data.recipes.filter((r) => r.meal === meal && !r.rough && filter(r));
  pool.sort(() => Math.random() - 0.5);
  pool.sort((a, b) => (used[a.id] || "").localeCompare(used[b.id] || ""));
  return pool.length ? Array.from({ length: count }, (_, i) => pool[i % pool.length]) : [];
}

// "Surprise me": a full week built around batch cooking.
//   Mon-Wed dinners = the big Sunday/Monday cook
//   Thu-Sat dinners = the quick Wednesday top-up
//   Sunday dinner   = something quick and fresh
function surpriseWeek(monday) {
  const used = lastPlanned(monday);
  const prep = (r) => r.tags.includes("Meal prep friendly");
  const [b1, b2] = pickRecipes("breakfast", 2, used);
  const [s1, s2] = pickRecipes("snack", 2, used);
  const [d1, d2] = pickRecipes("dinner", 2, used, prep);
  const notBatch = (r) => r !== d1 && r !== d2;
  const [d3] = pickRecipes("dinner", 1, used, (r) => notBatch(r) && r.tags.includes("Quick"))
    .concat(pickRecipes("dinner", 1, used, notBatch));
  const plan = {};
  WEEK_DAYS.forEach((day, i) => {
    const set = (slot, r) => { if (r) plan[`${day}-${slot}`] = r.id; };
    set("breakfast", i % 2 ? b2 : b1);
    set("snack", i % 2 ? s2 : s1);
    set("dinner", i < 3 ? d1 : i < 6 ? d2 : d3);
  });
  data.mealPlans[monday] = plan;
}

// Which planned recipes to cook in each batch session.
function batchPlan(monday) {
  const plan = mealPlan(monday);
  const names = (keys, onlyPrep) => [...new Set(keys.map((k) => plan[k]).filter(Boolean))]
    .map(findRecipe).filter((r) => r && (!onlyPrep || r.tags.includes("Meal prep friendly")))
    .map((r) => r.name);
  const prepKeys = WEEK_DAYS.flatMap((d) => [`${d}-breakfast`, `${d}-snack`]);
  return {
    big: names(["Mon-dinner", "Tue-dinner", "Wed-dinner"]).concat(names(prepKeys, true)),
    topup: names(["Thu-dinner", "Fri-dinner", "Sat-dinner"]),
    fresh: names(["Sun-dinner"])
  };
}


// ---------- 3. Shopping list helpers ----------
function itemKey(name) { return name.toLowerCase().trim().replace(/s$/, ""); }

function formatAmount(unit, qty) {
  qty = Math.round(qty * 100) / 100;
  if (unit === "g" && qty >= 1000) return `${Math.round(qty / 100) / 10}kg`;
  if (unit === "ml" && qty >= 1000) return `${Math.round(qty / 100) / 10}L`;
  if (unit === "g" || unit === "ml") return `${qty}${unit}`;
  return unit ? `${qty} ${unit}` : `${qty}`;
}

// Adds up every ingredient from the week's planned meals, plus staples
// and anything you added by hand. If a recipe makes 4 serves and you've
// planned it 3 times, it's only bought once.
function shoppingItems(monday) {
  const items = {};
  const add = (name, qty, unit) => {
    const key = itemKey(name);
    const item = items[key] = items[key] || { key, name, amounts: {} };
    if (qty === null || qty === undefined) return;
    if (unit === "kg") { qty *= 1000; unit = "g"; }
    if (unit === "l") { qty *= 1000; unit = "ml"; }
    item.amounts[unit] = (item.amounts[unit] || 0) + qty;
  };

  const counts = {};
  Object.values(mealPlan(monday)).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
  for (const [id, count] of Object.entries(counts)) {
    const r = findRecipe(id);
    if (!r) continue;
    const batches = Math.ceil(count / (r.serves || 1));
    r.ingredients.forEach((line) => {
      const ing = parseIngredient(line);
      if (NOT_SHOPPING.includes(itemKey(ing.name))) return;
      add(ing.name, ing.qty === null ? null : ing.qty * batches, ing.unit);
    });
  }
  data.staples.forEach((name) => add(name));
  ((data.shopping[monday] || {}).extras || []).forEach((name) => add(name));

  return Object.values(items).map((item) => {
    const amount = Object.entries(item.amounts).map(([u, q]) => formatAmount(u, q)).join(" + ");
    return {
      key: item.key,
      text: amount ? `${item.name} (${amount})` : item.name,
      store: data.storeFor[item.key] || STORES[0]
    };
  }).sort((a, b) => a.text.localeCompare(b.text));
}

function shopState(monday) {
  data.shopping[monday] = data.shopping[monday] || { checked: {}, extras: [] };
  return data.shopping[monday];
}


// ---------- 4. Screens ----------
function mealsScreen(sub = "plan", id) {
  if (sub === "add") return recipeForm(id);
  const tabs = [["plan", "Plan"], ["shop", "Shop"], ["recipes", "Recipes"]];
  const draw = { shop: shopScreen, recipes: recipesScreen }[sub] || planScreen;
  return `
    <h1>Meals 🥗</h1>
    <p class="sub">Simple, high protein, no stress.</p>
    <nav class="subtabs">
      ${tabs.map(([t, label]) => `<a href="#meals/${t}" class="${(sub || "plan") === t ? "on" : ""}">${label}</a>`).join("")}
    </nav>
    ${draw()}`;
}

function mealWeekNav(monday) {
  return `<div class="row between">
      <button class="ghost" data-action="meal-week" data-step="-1">‹ Prev</button>
      <button class="ghost" data-action="meal-week" data-step="0"><strong>Week of ${niceDate(monday).slice(4)}</strong></button>
      <button class="ghost" data-action="meal-week" data-step="1">Next ›</button>
    </div>`;
}

// ----- Plan -----
function planScreen() {
  const monday = planMonday();
  const plan = mealPlan(monday);
  const batch = batchPlan(monday);
  const list = (arr) => arr.length ? arr.map(esc).join(", ") : `<span class="muted">nothing planned yet</span>`;

  const days = WEEK_DAYS.map((day, i) => {
    const key = addDays(monday, i);
    return `<div class="card ${key === todayKey() ? "today" : ""}">
        <h3>${niceDate(key)}</h3>
        ${MEAL_SLOTS.map((s) => {
          const r = findRecipe(plan[`${day}-${s.id}`]);
          return `<a class="slot" href="#pick/${monday}/${day}-${s.id}">
              <span class="muted small">${s.label}</span>
              <span class="${r ? "" : "muted"}">${r ? esc(r.name) : "+ Add"}</span>
            </a>`;
        }).join("")}
      </div>`;
  }).join("");

  return `
    ${mealWeekNav(monday)}
    <div class="row" style="margin-bottom:14px">
      <button class="grow" data-action="surprise" data-monday="${monday}">🎲 Surprise me</button>
      <a class="btn secondary" href="#meals/shop">🛒 List</a>
    </div>

    <div class="card soft">
      <h2>Batch cooking 🍳</h2>
      <p><strong>Big cook (Sun or Mon):</strong> ${list(batch.big)}</p>
      <p><strong>Wednesday top-up:</strong> ${list(batch.topup)}</p>
      <p><strong>Sunday dinner, cook fresh:</strong> ${list(batch.fresh)}</p>
      <p class="small muted">Rough day? There's a freezer meal for that. Weekday lunches are free at work: pick the curry or protein and fill up on salad and veg.</p>
    </div>

    ${days}
  `;
}

// ----- Pick a meal for one slot -----
function pickScreen(monday, slotKey) {
  const [day, slot] = (slotKey || "").split("-");
  const label = (MEAL_SLOTS.find((s) => s.id === slot) || { label: "meal" }).label;
  const current = mealPlan(monday)[slotKey];
  const used = lastPlanned(monday);
  const row = (r) => `<button class="tick ${r.id === current ? "on" : ""}" data-action="assign" data-monday="${monday}" data-slot="${slotKey}" data-id="${r.id}">
      <span class="box"></span>
      <span class="label">${esc(r.name)}<br><span class="small muted">${r.protein ? `${r.protein}g protein · ` : ""}${used[r.id] ? `last planned ${niceDate(used[r.id]).slice(4)}` : "not planned yet"}</span></span>
    </button>`;
  const matching = data.recipes.filter((r) => r.meal === slot);
  const others = data.recipes.filter((r) => r.meal !== slot);
  const dayIndex = WEEK_DAYS.indexOf(day);
  return `
    <a class="back" href="#meals/plan">‹ Plan</a>
    <h1>${label}</h1>
    <p class="sub">${dayIndex >= 0 ? niceDate(addDays(monday, dayIndex)) : ""}</p>
    ${current ? `<button class="full secondary" data-action="assign" data-monday="${monday}" data-slot="${slotKey}" data-id="" style="margin-bottom:12px">Clear this meal</button>` : ""}
    <div class="card">${matching.map(row).join("") || `<p class="muted">No ${label.toLowerCase()} recipes yet.</p>`}</div>
    ${others.length ? `<h3>Other recipes</h3><div class="card">${others.map(row).join("")}</div>` : ""}
  `;
}

// ----- Shop -----
function shopScreen() {
  const monday = planMonday();
  const state = shopState(monday);
  const items = shoppingItems(monday);
  const groups = STORES.map((store) => {
    // Things still to get first, ticked ones sink to the bottom.
    const list = items.filter((i) => i.store === store)
      .sort((a, b) => !!state.checked[a.key] - !!state.checked[b.key]);
    if (!list.length) return "";
    const left = list.filter((i) => !state.checked[i.key]).length;
    return `<div class="card">
        <div class="row between"><h2>${store}</h2>
          <button class="small-btn secondary" data-action="copy-shop" data-store="${store}">📋 Copy</button></div>
        <p class="small muted">${left} to get</p>
        ${list.map((i) => `<div class="row">
            <button class="tick ${state.checked[i.key] ? "on" : ""}" data-action="shop-tick" data-key="${esc(i.key)}">
              <span class="box"></span><span class="label">${esc(i.text)}</span></button>
            <button class="secondary store-chip" data-action="store" data-key="${esc(i.key)}" aria-label="Change store">${store}</button>
          </div>`).join("")}
      </div>`;
  }).join("");

  return `
    ${mealWeekNav(monday)}
    <button class="full" data-action="copy-shop" style="margin-bottom:8px">📋 Copy list as text (for Minimalist)</button>
    <p class="small muted">Copies everything not ticked yet, one item per line. Tap a store name to move an item; it remembers next time.</p>
    ${groups}
    <div class="card">
      <h3>Add something</h3>
      <div class="row"><input id="shop-extra" class="grow" placeholder="e.g. Coffee pods" style="margin:0">
        <button data-action="shop-add" data-monday="${monday}">Add</button></div>
    </div>
    <div class="card soft">
      <h3>Weekly staples</h3>
      <p class="small muted">Always on the list. Tick them off if you already have them.</p>
      <ul class="list">${data.staples.map((s, i) => `<li class="row between"><span>${esc(s)}</span>
        <button class="ghost" data-action="staple-remove" data-i="${i}" aria-label="Remove">✕</button></li>`).join("")}</ul>
      <div class="row"><input id="staple-new" class="grow" placeholder="Add a staple" style="margin:0">
        <button class="secondary" data-action="staple-add">Add</button></div>
    </div>
    ${Object.keys(state.checked).length ? `<button class="ghost full" data-action="shop-reset" data-monday="${monday}">Untick everything</button>` : ""}
  `;
}

// ----- Recipes -----
function recipesScreen() {
  const cards = data.recipes.slice().sort((a, b) => a.name.localeCompare(b.name)).map((r) => {
    const flags = foodFlags(r);
    const search = [r.name, r.meal, ...r.tags, ...r.ingredients].join(" ").toLowerCase();
    return `<a class="card recipe-card" href="#recipe/${r.id}" data-search="${esc(search)}" style="display:block;text-decoration:none;color:inherit">
        <div class="row between"><h3>${esc(r.name)}</h3><span class="pill">${r.meal}</span></div>
        <p class="small muted" style="margin:0">${r.protein ? `${r.protein}g protein · ` : ""}${r.tags.map(esc).join(" · ")}</p>
        ${flags.length ? `<p class="small" style="margin:6px 0 0">⚠️ Heads up: ${flags.map(esc).join(", ")}</p>` : ""}
      </a>`;
  }).join("");
  return `
    <a class="btn full" href="#meals/add" style="margin-bottom:12px">+ Add a recipe</a>
    <input id="recipe-search" type="search" placeholder="Search recipes, tags or ingredients" style="margin:0 0 14px">
    <details class="card soft">
      <summary><strong>My food preferences</strong></summary>
      <ul style="margin:10px 0 0;padding-left:20px">${FOOD_PREFS.map((p) => `<li class="small">${esc(p)}</li>`).join("")}</ul>
    </details>
    ${cards}
  `;
}

function recipeScreen(id) {
  const r = findRecipe(id);
  if (!r) return `<a class="back" href="#meals/recipes">‹ Recipes</a><p>Recipe not found.</p>`;
  const flags = foodFlags(r);
  return `
    <a class="back" href="#meals/recipes">‹ Recipes</a>
    <h1>${esc(r.name)}</h1>
    <p class="sub">${r.meal} · serves ${r.serves || 1}${r.protein ? ` · about ${r.protein}g protein per serve` : ""}</p>
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${r.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join("")}</div>
    ${flags.length ? `<div class="note">⚠️ Heads up: ${flags.map(esc).join(", ")}</div>` : ""}
    <div class="card"><h2>Ingredients</h2><ul style="margin:0;padding-left:20px">${r.ingredients.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>
    ${r.method ? `<div class="card"><h2>Method</h2><p style="white-space:pre-line">${esc(r.method)}</p></div>` : ""}
    ${r.link ? `<a class="btn secondary full" href="${esc(r.link)}" target="_blank" rel="noopener" style="margin-bottom:10px">Open original post ↗</a>` : ""}
    <div class="row">
      <a class="btn grow" href="#meals/add/${r.id}">Edit</a>
      <button class="secondary" data-action="recipe-delete" data-id="${r.id}">Delete</button>
    </div>
  `;
}

// ----- Add or edit a recipe -----
function recipeForm(id) {
  const r = findRecipe(id) || { name: "", meal: "dinner", serves: 4, protein: "", tags: [], ingredients: [], method: "", link: "" };
  return `
    <a class="back" href="${id ? `#recipe/${id}` : "#meals/recipes"}">‹ Back</a>
    <h1>${id ? "Edit recipe" : "Add a recipe"}</h1>
    ${id ? "" : `<div class="card soft">
      <label class="field">Paste a recipe (like an Instagram caption)
        <textarea id="r-paste" placeholder="Paste the whole caption here"></textarea></label>
      <button class="full" data-action="recipe-paste">✨ Fill in from paste</button>
      <p class="small muted" style="margin-top:8px">I'll do my best guess. Check the boxes below before saving.</p>
    </div>`}
    <div class="card">
      <label class="field">Name<input id="r-name" value="${esc(r.name)}"></label>
      <div class="row">
        <label class="field grow">Meal
          <select id="r-meal">${["breakfast", "snack", "dinner"].map((m) => `<option ${r.meal === m ? "selected" : ""}>${m}</option>`).join("")}</select></label>
        <label class="field grow">Serves<input id="r-serves" type="number" inputmode="numeric" min="1" value="${esc(r.serves)}"></label>
      </div>
      <label class="field">Ingredients (one per line, amount first, e.g. "500g Chicken breast")
        <textarea id="r-ingredients" rows="7">${esc(r.ingredients.join("\n"))}</textarea></label>
      <label class="field">Method<textarea id="r-method" rows="5">${esc(r.method)}</textarea></label>
      <label class="field">Protein per serve (g)
        <div class="row"><input id="r-protein" type="number" inputmode="numeric" value="${esc(r.protein)}" class="grow">
          <button class="secondary" data-action="recipe-estimate" style="margin-top:6px">Estimate</button></div></label>
      <label class="field">Link<input id="r-link" type="url" value="${esc(r.link)}" placeholder="https://"></label>
      <p class="small" style="font-weight:600;margin-bottom:6px">Tags</p>
      ${RECIPE_TAGS.map((t) => `<label class="tagpick"><input type="checkbox" name="r-tag" value="${t}" ${r.tags.includes(t) ? "checked" : ""}> ${t}</label>`).join("")}
    </div>
    <button class="full" data-action="recipe-save" data-id="${id || ""}">Save recipe</button>
  `;
}

// Small "Today's meals" card for the Home screen.
function todaysMealsHTML() {
  const today = todayKey();
  const plan = mealPlan(mondayOf(today));
  const day = dayName(today);
  const rows = MEAL_SLOTS.map((s) => [s.label, findRecipe(plan[`${day}-${s.id}`])]).filter(([, r]) => r);
  if (!rows.length) return "";
  return `<a class="card" href="#meals/plan" style="display:block;text-decoration:none;color:inherit">
      <div class="row between"><h2>Today's meals 🥗</h2><span class="muted small">Open ›</span></div>
      ${rows.map(([label, r]) => `<p style="margin:0 0 4px"><span class="muted small">${label}:</span> ${esc(r.name)}</p>`).join("")}
    </a>`;
}

SCREENS.meals = mealsScreen;
SCREENS.recipe = recipeScreen;
SCREENS.pick = pickScreen;


// ---------- 5. Buttons ----------
Object.assign(ACTIONS, {
  "meal-week"({ step }) {
    mealWeekOffset = Number(step) === 0 ? 0 : mealWeekOffset + Number(step);
    render();
  },

  surprise({ monday }) {
    if (Object.keys(mealPlan(monday)).length && !confirm("Replace this week's plan with a surprise one?")) return;
    surpriseWeek(monday);
    saveData();
    toast("Fresh week planned 🎲");
    render();
  },

  assign({ monday, slot, id }) {
    const plan = data.mealPlans[monday] = data.mealPlans[monday] || {};
    if (id) plan[slot] = id; else delete plan[slot];
    saveData();
    location.hash = "#meals/plan";
  },

  "shop-tick"({ key }) {
    const state = shopState(planMonday());
    if (state.checked[key]) delete state.checked[key]; else state.checked[key] = true;
    saveData();
    render();
  },

  store({ key }) {
    const now = data.storeFor[key] || STORES[0];
    data.storeFor[key] = STORES[(STORES.indexOf(now) + 1) % STORES.length];
    saveData();
    render();
  },

  "copy-shop"({ store }) {
    const state = shopState(planMonday());
    const lines = shoppingItems(planMonday())
      .filter((i) => !state.checked[i.key] && (!store || i.store === store))
      .map((i) => i.text);
    if (!lines.length) return toast("Nothing left to get 🎉");
    copyText(lines.join("\n"));
  },

  "shop-add"({ monday }) {
    const box = document.getElementById("shop-extra");
    const name = box.value.trim();
    if (!name) return;
    shopState(monday).extras.push(name);
    saveData();
    render();
  },

  "shop-reset"({ monday }) {
    shopState(monday).checked = {};
    saveData();
    render();
  },

  "staple-add"() {
    const name = document.getElementById("staple-new").value.trim();
    if (!name) return;
    data.staples.push(name);
    saveData();
    render();
  },

  "staple-remove"({ i }) {
    data.staples.splice(Number(i), 1);
    saveData();
    render();
  },

  "recipe-paste"() {
    const text = document.getElementById("r-paste").value;
    if (!text.trim()) return toast("Paste a recipe in the box first.");
    const r = readPastedRecipe(text);
    const set = (id, value) => { if (value !== "" && value !== undefined) document.getElementById(id).value = value; };
    set("r-name", r.name);
    set("r-ingredients", r.ingredients.join("\n"));
    set("r-method", r.method);
    set("r-link", r.link);
    set("r-serves", r.serves);
    set("r-protein", r.protein || (r.ingredients.length ? estimateProtein(r.ingredients, r.serves || Number(document.getElementById("r-serves").value)) || "" : ""));
    toast("Filled in. Give it a quick check ✨");
  },

  "recipe-estimate"() {
    const lines = document.getElementById("r-ingredients").value.split("\n").filter((l) => l.trim());
    const serves = Number(document.getElementById("r-serves").value) || 1;
    const g = estimateProtein(lines, serves);
    document.getElementById("r-protein").value = g || "";
    toast(g ? `About ${g}g per serve (a rough guess)` : "Couldn't estimate. Add amounts like 500g.");
  },

  "recipe-save"({ id }) {
    const val = (f) => document.getElementById(f).value.trim();
    const name = val("r-name");
    if (!name) return toast("Give it a name first.");
    const recipe = {
      id: id || "r-" + Date.now(),
      name,
      meal: val("r-meal"),
      serves: Number(val("r-serves")) || 1,
      protein: Number(val("r-protein")) || "",
      ingredients: val("r-ingredients").split("\n").map((l) => l.trim()).filter(Boolean),
      method: val("r-method"),
      link: val("r-link"),
      tags: [...document.querySelectorAll('input[name="r-tag"]:checked')].map((c) => c.value)
    };
    const old = findRecipe(recipe.id);
    if (old) Object.assign(old, recipe); else data.recipes.push(recipe);
    saveData();
    const flags = foodFlags(recipe);
    toast(flags.length ? `Saved. Heads up: ${flags[0]}` : "Recipe saved 🥗");
    location.hash = "#recipe/" + recipe.id;
  },

  "recipe-delete"({ id }) {
    if (!confirm("Delete this recipe?")) return;
    data.recipes = data.recipes.filter((r) => r.id !== id);
    for (const plan of Object.values(data.mealPlans)) {
      for (const slot of Object.keys(plan)) if (plan[slot] === id) delete plan[slot];
    }
    saveData();
    location.hash = "#meals/recipes";
  }
});

// Live search on the Recipes screen (hides cards that don't match).
document.addEventListener("input", (e) => {
  if (e.target.id !== "recipe-search") return;
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll(".recipe-card").forEach((card) => {
    card.style.display = !q || card.dataset.search.includes(q) ? "block" : "none";
  });
});
