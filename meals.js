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
  // A range like "1 - 2 tsp" uses the bigger number. "1 1/2" becomes 1.5, "1/2" becomes 0.5.
  text = text.replace(/^\d+(?:\.\d+)?\s*[-–]\s*(\d+(?:\.\d+)?)/, "$1");
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
  // Keep just the food for the shopping list: "chicken breast, cut in pieces (3 cm)" becomes "chicken breast".
  const food = rest.replace(/\(.*?\)/g, "").split(",")[0].trim();
  return { qty: Number(m[1]), unit, name: food || rest || text };
}

// Pulls the name, ingredients, method, link and protein out of a pasted
// recipe (like an Instagram caption). You check and fix it before saving.
function readPastedRecipe(text) {
  const link = (text.match(/https?:\/\/\S+/) || [""])[0];
  const protein = text.match(/(\d+)\s*g\s*(?:of\s*)?protein/i) || text.match(/protein[:\s]*(\d+)\s*g/i);
  const serves = text.match(/(?:serves|makes|servings?|serving size)[:\s]*(\d+)/i) || text.match(/(\d+)\s*portions?/i);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const intro = [], ingredients = [], method = [];
  let section = "intro";
  for (const line of lines) {
    const words = line.toLowerCase().replace(/[^a-z ]/g, "").trim();
    // A heading is a short line on its own, like "Ingredients:" or "Preparation" (Cookidoo).
    if (/^(ingredients?|youll need|you need|what you need)$/.test(words)) { section = "ingredients"; continue; }
    if (/^(method|instructions|directions|steps|preparation|how to|how to make it)$/.test(words)) { section = "method"; continue; }
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
  const pool = data.recipes.filter((r) => r.meal === meal && !r.rough && !r.quick && filter(r));
  pool.sort(() => Math.random() - 0.5);
  pool.sort((a, b) => (used[a.id] || "").localeCompare(used[b.id] || ""));
  return pool.length ? Array.from({ length: count }, (_, i) => pool[i % pool.length]) : [];
}

// "Surprise me": a full week built around batch cooking.
//   Mon-Wed dinners = the big Sunday/Monday cook
//   Thu-Sat dinners = the quick Wednesday top-up
//   Sunday dinner   = something quick and fresh, or now and then a slow cooker meal
function surpriseWeek(monday) {
  const used = lastPlanned(monday);
  const prep = (r) => r.tags.includes("Meal prep friendly");
  const [b1, b2] = pickRecipes("breakfast", 2, used);
  const [s1, s2] = pickRecipes("snack", 2, used);
  const [d1, d2] = pickRecipes("dinner", 2, used, prep);
  const notBatch = (r) => r !== d1 && r !== d2;
  const sunday = Math.random() < 0.5 ? "Slow cooker" : "Quick";
  const [d3] = pickRecipes("dinner", 1, used, (r) => notBatch(r) && r.tags.includes(sunday))
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
    sunday: [findRecipe(plan["Sun-dinner"])].filter(Boolean)
      .map((r) => r.tags.includes("Slow cooker") ? `${r.name} (start it in the morning)` : r.name)
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


// ---------- Weekly food check ----------
// Once the week is mostly planned, says if it's a good food week and why,
// or what to tweak. Protein only (no calories): planned meals plus about
// 30g for lunch, which isn't planned here.
const LUNCH_PROTEIN = 30;

function foodCheck(monday) {
  const plan = mealPlan(monday);
  const slots = WEEK_DAYS.length * MEAL_SLOTS.length;
  const filled = Object.values(plan).filter((id) => findRecipe(id)).length;
  if (filled < slots / 2) return null;
  const goal = Number(data.settings.proteinGoal) || 0;
  const good = [], fix = [];

  const days = WEEK_DAYS.map((day) => {
    const recipes = MEAL_SLOTS.map((s) => findRecipe(plan[`${day}-${s.id}`])).filter(Boolean);
    return { day, protein: LUNCH_PROTEIN + recipes.reduce((n, r) => n + (Number(r.protein) || 0), 0), unknown: recipes.filter((r) => !r.protein).length };
  });
  const avg = Math.round(days.reduce((n, d) => n + d.protein, 0) / days.length);
  if (goal) {
    const low = days.filter((d) => d.protein < goal * 0.85);
    if (!low.length) good.push(`Every day gets close to your ${goal}g protein (about ${avg}g a day).`);
    else fix.push(`${low.map((d) => d.day).join(", ")} ${low.length === 1 ? "is" : "are"} about ${Math.round(low.reduce((n, d) => n + goal - d.protein, 0) / low.length)}g short on protein${low.length === 1 ? "" : " each"}. Add Greek yoghurt (about 20g) or a protein shake (about 25g).`);
  } else {
    fix.push(`About ${avg}g protein a day planned. Set your daily protein goal in Settings so I can tell you if that's enough.`);
  }
  const unknown = days.reduce((n, d) => n + d.unknown, 0);
  if (unknown) fix.push(`${unknown} planned meal${unknown === 1 ? " has" : "s have"} no protein number, so the total is a bit low. Add it on the recipe.`);

  const dinners = WEEK_DAYS.map((day) => plan[`${day}-dinner`]).filter((id) => findRecipe(id));
  const distinct = new Set(dinners).size;
  const most = Math.max(0, ...[...new Set(dinners)].map((id) => dinners.filter((x) => x === id).length));
  if (distinct >= 3 && most <= 3) good.push(`${distinct} different dinners, so it won't get boring.`);
  if (most > 3) fix.push(`${findRecipe(dinners.find((id) => dinners.filter((x) => x === id).length === most)).name} is on ${most} nights. Fine for meal prep, but swap one for some variety.`);

  const flagged = [...new Set(Object.values(plan))].map(findRecipe).filter(Boolean).map((r) => [r, foodFlags(r)]).filter(([, f]) => f.length);
  if (flagged.length) fix.push(`Heads up: ${flagged.map(([r, f]) => `${r.name} (${f[0]})`).join(", ")}.`);
  else good.push("Nothing seafood or super creamy.");

  const prep = dinners.filter((id) => findRecipe(id).tags.includes("Meal prep friendly")).length;
  if (prep >= 4) good.push(`${prep} meal-prep dinners, so weeknights are easy.`);
  if (filled < slots) fix.push(`${slots - filled} meal${slots - filled === 1 ? "" : "s"} not planned yet.`);

  const ok = !fix.some((f) => !f.endsWith("not planned yet.") && !f.startsWith("About"));
  return { ok, good, fix };
}

function foodCheckHTML(monday) {
  const c = foodCheck(monday);
  if (!c) return `<p class="hint">Plan at least half the week and you'll get a food check here.</p>`;
  return `<div class="card status-card ${c.ok ? "" : "amber"}">
      <div class="row between"><p class="label" style="margin:0">Food check</p><span class="status-pill ${c.ok ? "green" : "amber"}">${c.ok ? "Good week" : "Worth a tweak"}</span></div>
      <ul class="check-list">${[...c.fix.map((t) => `<li>${icon("bolt", "warn")} ${esc(t)}</li>`), ...c.good.map((t) => `<li>${icon("check")} ${esc(t)}</li>`)].join("")}</ul>
    </div>`;
}


// ---------- 4. Screens ----------
let lastMealsTab = "plan";   // so Back on a recipe returns to the plan or the recipe list

function mealsScreen(sub = "plan", id) {
  if (sub === "add") return recipeForm(id);
  lastMealsTab = sub;
  const tabs = [["plan", "Plan"], ["shop", "Shop"], ["recipes", "Recipes"]];
  const draw = { shop: shopScreen, recipes: recipesScreen }[sub] || planScreen;
  return `
    ${headline("Food", { shop: "shopping list", recipes: "recipes" }[sub] || "this week")}
    <nav class="chips tabs-chips">
      ${tabs.map(([t, label]) => `<a href="#meals/${t}" class="chip ${(sub || "plan") === t ? "on" : ""}">${label}</a>`).join("")}
    </nav>
    ${draw()}`;
}

function mealWeekNav(monday) {
  return `<div class="week-nav">
      <button class="circ sm" data-action="meal-week" data-step="-1" aria-label="Previous week">${icon("back")}</button>
      <button class="week-label" data-action="meal-week" data-step="0">Week of ${niceDate(monday).slice(4)}</button>
      <button class="circ sm" data-action="meal-week" data-step="1" aria-label="Next week">${icon("chev")}</button>
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
        <p class="label" style="margin:0 0 4px">${niceDate(key)}${key === todayKey() ? " · Today" : ""}</p>
        ${MEAL_SLOTS.map((s) => {
          const r = findRecipe(plan[`${day}-${s.id}`]);
          const pick = `#pick/${monday}/${day}-${s.id}`;
          // A planned meal opens its recipe. The round button swaps it for another.
          if (!r) return `<a class="slot" href="${pick}"><span class="muted small">${s.label}</span><span class="muted">Add</span></a>`;
          return `<div class="slot">
              <a class="slot-link" href="#recipe/${r.id}"><span class="muted small">${s.label}</span><span>${esc(r.name)}</span></a>
              <a class="circ sm" href="${pick}" aria-label="Swap ${s.label.toLowerCase()}">${icon("edit")}</a>
            </div>`;
        }).join("")}
      </div>`;
  }).join("");

  return `
    ${mealWeekNav(monday)}
    ${foodCheckHTML(monday)}
    <div class="row" style="gap:8px;margin-bottom:12px">
      <button class="grow dark" data-action="surprise" data-monday="${monday}">Surprise me</button>
      <a class="btn grow" href="#meals/shop">${icon("cart")} Shopping list</a>
    </div>

    <details class="card drop-card">
      <summary class="li">${icon("food", "tile")}<span class="grow"><strong>Batch cooking</strong></span>${icon("down", "chev")}</summary>
      <div class="drop-body small">
        <p><strong>Big cook (Sun or Mon):</strong> ${list(batch.big)}</p>
        <p><strong>Wednesday top-up:</strong> ${list(batch.topup)}</p>
        <p><strong>Sunday dinner:</strong> ${list(batch.sunday)}</p>
        <p class="muted" style="margin:0">Weekday lunches are free at work: pick the curry or protein and fill up on salad and veg.</p>
      </div>
    </details>

    ${days}
  `;
}

// ----- Pick a meal for one slot -----
function pickScreen(monday, slotKey) {
  const [day, slot] = (slotKey || "").split("-");
  const label = (MEAL_SLOTS.find((s) => s.id === slot) || { label: "meal" }).label;
  const current = mealPlan(monday)[slotKey];
  const used = lastPlanned(monday);
  const row = (r) => `<button class="tick ${r.id === current ? "on" : ""}" data-pick="${esc([r.name, ...r.ingredients].join(" ").toLowerCase())}" data-action="assign" data-monday="${monday}" data-slot="${slotKey}" data-id="${r.id}">
      <span class="box"></span>
      <span class="label">${esc(r.name)}<br><span class="small muted">${r.protein ? `${r.protein}g protein · ` : ""}${used[r.id] ? `last planned ${niceDate(used[r.id]).slice(4)}` : "not planned yet"}</span></span>
    </button>`;
  const byName = (a, b) => a.name.localeCompare(b.name);
  const quick = data.recipes.filter((r) => r.quick).sort(byName);
  const matching = data.recipes.filter((r) => !r.quick && r.meal === slot).sort(byName);
  const others = data.recipes.filter((r) => !r.quick && r.meal !== slot).sort(byName);
  const dayIndex = WEEK_DAYS.indexOf(day);
  return `
    ${topBar(backBtn("#meals/plan"))}
    ${headline("Pick", label.toLowerCase())}
    <p class="sub">${dayIndex >= 0 ? niceDate(addDays(monday, dayIndex)) : ""}</p>
    ${current ? `<button class="full secondary" data-action="assign" data-monday="${monday}" data-slot="${slotKey}" data-id="" style="margin-bottom:12px">Clear this meal</button>` : ""}
    <label class="search">${icon("search")}<input id="pick-search" type="search" placeholder="Search recipes or ingredients"></label>
    <h3 class="sec-head">Quick options</h3>
    <div class="card pick-list">${quick.map(row).join("")}
      <div class="quick-add">
        <input id="quick-name" placeholder="Add one, e.g. toast with eggs">
        <div class="row" style="gap:8px">
          <input id="quick-protein" type="number" inputmode="numeric" placeholder="Protein (g), optional" class="grow">
          <button class="circ dark" data-action="quick-add" data-monday="${monday}" data-slot="${slotKey}" aria-label="Add quick option">${icon("plus")}</button>
        </div>
      </div></div>
    <h3 class="sec-head">${label} recipes</h3>
    <div class="card pick-list">${matching.map(row).join("") || `<p class="muted">No ${label.toLowerCase()} recipes yet.</p>`}</div>
    ${others.length ? `<h3 class="sec-head">Other recipes</h3><div class="card pick-list">${others.map(row).join("")}</div>` : ""}
  `;
}

// ----- Shop -----
// Food comes from the week's meal plan. "Everything else" is your non-food list,
// which stays until you get it. Ticked things move to "Got it" at the bottom.
function shopScreen() {
  const monday = planMonday();
  const state = shopState(monday);
  const items = shoppingItems(monday);
  const left = items.filter((i) => !state.checked[i.key]);
  const got = items.filter((i) => state.checked[i.key]);
  const other = otherShop().filter((o) => !o.got);
  const otherGot = otherShop().filter((o) => o.got);
  const groups = STORES.map((store) => {
    const list = left.filter((i) => i.store === store);
    if (!list.length) return "";
    return `<div class="card">
        <div class="row between"><h2>${store}</h2>
          <button class="sm ghost" data-action="copy-shop" data-store="${store}">Copy</button></div>
        <p class="small muted">${list.length} to get</p>
        ${list.map((i) => `<div class="row">
            <button class="tick" data-action="shop-tick" data-key="${esc(i.key)}">
              <span class="box"></span><span class="label">${esc(i.text)}</span></button>
            <button class="secondary store-chip" data-action="store" data-key="${esc(i.key)}" aria-label="Change store">${store}</button>
          </div>`).join("")}
      </div>`;
  }).join("");

  return `
    ${mealWeekNav(monday)}
    <button class="full dark" data-action="copy-shop">Copy list</button>
    <p class="hint">Tick things as they go in the trolley. Tap a shop name to move an item.</p>
    ${groups || `<div class="card"><p class="muted" style="margin:0">${items.length ? "Got everything for this week's meals." : "Plan some meals and the food list builds itself."}</p></div>`}
    <div class="card add-row">
      <input id="shop-extra" placeholder="Add food, e.g. coffee pods">
      <button class="circ dark" data-action="shop-add" data-monday="${monday}" aria-label="Add">${icon("plus")}</button>
    </div>

    <h3 class="sec-head">Everything else <span class="muted small">${other.length ? `${other.length} to get` : ""}</span></h3>
    <div class="card">
      ${other.map((o) => `<div class="row">
          <button class="tick" data-action="other-tick" data-id="${o.id}"><span class="box"></span><span class="label">${esc(o.text)}</span></button>
          <button class="secondary store-chip" data-action="other-store" data-id="${o.id}" aria-label="Change shop">${esc(o.store)}</button>
        </div>`).join("")}
      <div class="add-row" ${other.length ? `style="margin-top:8px"` : ""}>
        <input id="other-new" placeholder="Not food, e.g. sunscreen">
        <button class="circ dark" data-action="other-add" aria-label="Add">${icon("plus")}</button>
      </div>
    </div>

    ${got.length || otherGot.length ? `<details class="card drop-card">
      <summary class="li">${icon("check", "tile")}<span class="grow"><strong>Got it</strong><span class="small muted block">Tap one to put it back on the list</span></span><span class="num">${got.length + otherGot.length}</span>${icon("down", "chev")}</summary>
      <div class="drop-body">
        ${got.map((i) => `<button class="tick on" data-action="shop-tick" data-key="${esc(i.key)}"><span class="box"></span><span class="label">${esc(i.text)}</span></button>`).join("")}
        ${otherGot.map((o) => `<button class="tick on" data-action="other-tick" data-id="${o.id}"><span class="box"></span><span class="label">${esc(o.text)}</span></button>`).join("")}
        ${otherGot.length ? `<button class="full sm" data-action="other-clear" style="margin-top:8px">Clear the non-food ones</button>` : ""}
      </div>
    </details>` : ""}

    <details class="card drop-card">
      <summary class="li">${icon("cart", "tile")}<span class="grow"><strong>Weekly staples</strong><span class="small muted block">Always on the food list</span></span><span class="num">${data.staples.length}</span>${icon("down", "chev")}</summary>
      <div class="drop-body">
        ${data.staples.map((s, i) => `<div class="li tight"><span class="grow">${esc(s)}</span>
          <button class="circ sm" data-action="staple-remove" data-i="${i}" aria-label="Remove">${icon("x")}</button></div>`).join("")}
        <div class="add-row" style="margin-top:8px"><input id="staple-new" placeholder="Add a staple">
          <button class="circ" data-action="staple-add" aria-label="Add staple">${icon("plus")}</button></div>
      </div>
    </details>
  `;
}

function otherShop() { return data.otherShop || (data.otherShop = []); }

// ----- Recipes -----
function recipesScreen() {
  const cards = data.recipes.slice().sort((a, b) => a.name.localeCompare(b.name)).map((r) => {
    const flags = foodFlags(r);
    const search = [r.name, r.meal, ...r.tags, ...r.ingredients].join(" ").toLowerCase();
    return `<a class="card recipe-card" href="#recipe/${r.id}" data-search="${esc(search)}" style="display:block;text-decoration:none;color:inherit">
        <div class="row between"><h3>${esc(r.name)}</h3><span class="tag">${r.meal}</span></div>
        <p class="small muted" style="margin:0">${r.protein ? `${r.protein}g protein · ` : ""}${r.tags.map(esc).join(" · ")}</p>
        ${flags.length ? `<p class="small" style="margin:6px 0 0"> Heads up: ${flags.map(esc).join(", ")}</p>` : ""}
      </a>`;
  }).join("");
  return `
    <a class="btn full dark" href="#meals/add">${icon("plus")} Add a recipe</a>
    <label class="search">${icon("search")}<input id="recipe-search" type="search" placeholder="Search recipes or ingredients"></label>
    <details class="card drop-card">
      <summary class="li">${icon("heart", "tile")}<span class="grow"><strong>My food preferences</strong></span>${icon("down", "chev")}</summary>
      <ul class="drop-body plain-list">${FOOD_PREFS.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </details>
    ${cards}
  `;
}

function recipeScreen(id) {
  const r = findRecipe(id);
  if (!r) return `${topBar(backBtn(`#meals/${lastMealsTab}`))}<p>Recipe not found.</p>`;
  const flags = foodFlags(r);
  return `
    ${topBar(backBtn(`#meals/${lastMealsTab}`), `<a class="circ" href="#meals/add/${r.id}" aria-label="Edit">${icon("edit")}</a>
      <button class="circ" data-action="recipe-delete" data-id="${r.id}" aria-label="Delete">${icon("x")}</button>`)}
    <h1 class="head" style="font-size:28px"><b>${esc(r.name)}</b></h1>
    <p class="sub">${r.meal} · serves ${r.serves || 1}${r.protein ? ` · about ${r.protein}g protein per serve` : ""}</p>
    <div class="row wrap" style="gap:6px;margin-bottom:12px">${r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
    ${flags.length ? `<div class="note"> Heads up: ${flags.map(esc).join(", ")}</div>` : ""}
    <div class="card"><p class="label" style="margin-top:0">Ingredients</p><ul style="margin:0;padding-left:20px">${r.ingredients.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>
    ${r.method ? `<div class="card"><p class="label" style="margin-top:0">Method</p><p style="white-space:pre-line">${esc(r.method)}</p></div>` : ""}
    ${r.link ? `<a class="btn full" href="${esc(r.link)}" target="_blank" rel="noopener">${icon("arrow")} Open original</a>` : ""}
  `;
}

// ----- Add or edit a recipe -----
function recipeForm(id) {
  const r = findRecipe(id) || { name: "", meal: "dinner", serves: 4, protein: "", tags: [], ingredients: [], method: "", link: "" };
  return `
    ${topBar(backBtn(id ? `#recipe/${id}` : "#meals/recipes"))}
    ${headline(id ? "Edit" : "Add a", "recipe")}
    ${id ? "" : `<div class="card soft">
      <label class="field">Paste a recipe (like an Instagram caption)
        <textarea id="r-paste" placeholder="Paste the whole caption here"></textarea></label>
      <button class="full dark" data-action="recipe-paste">Fill in from paste</button>
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
          <button class="sm" data-action="recipe-estimate" style="margin-top:6px">Estimate</button></div></label>
      <label class="field">Link<input id="r-link" type="url" value="${esc(r.link)}" placeholder="https://"></label>
      <p class="small" style="font-weight:600;margin-bottom:6px">Tags</p>
      ${RECIPE_TAGS.map((t) => `<label class="tagpick"><input type="checkbox" name="r-tag" value="${t}" ${r.tags.includes(t) ? "checked" : ""}> ${t}</label>`).join("")}
    </div>
    <button class="full dark" data-action="recipe-save" data-id="${id || ""}">Save recipe</button>
  `;
}

// Small "Today's meals" card for the Home screen.
function todaysMealsHTML() {
  const today = todayKey();
  const plan = mealPlan(mondayOf(today));
  const day = dayName(today);
  const rows = MEAL_SLOTS.map((s) => [s.label, findRecipe(plan[`${day}-${s.id}`])]).filter(([, r]) => r);
  const dinner = rows.find(([l]) => l === "Dinner");
  return `<details class="card drop-card">
      <summary class="li">${icon("food", "tile")}<span class="grow">${dinner ? "Dinner" : "Today's meals"}</span><span class="meta">${rows.length ? esc((dinner || rows[0])[1].name) : "Nothing planned"}</span>${icon("down", "chev")}</summary>
      <div class="drop-body">
        ${rows.map(([label, r]) => `<a class="li tight" href="#recipe/${r.id}"><span class="meta" style="width:76px">${label}</span><span class="grow">${esc(r.name)}</span></a>`).join("") || `<p class="small muted" style="margin:0">No meals planned today.</p>`}
        <a class="btn sm" href="#meals/plan" style="margin-top:8px">Open meal plan</a>
      </div>
    </details>`;
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
    toast("Fresh week planned");
    render();
  },

  assign({ monday, slot, id }) {
    const plan = data.mealPlans[monday] = data.mealPlans[monday] || {};
    if (id) plan[slot] = id; else delete plan[slot];
    saveData();
    location.hash = "#meals/plan";
  },

  // A quick option is a tiny recipe (just the one item) you can drop into any slot.
  "quick-add"({ monday, slot }) {
    const name = document.getElementById("quick-name").value.trim();
    if (!name) return toast("Type what it is first, e.g. Up&Go.");
    const protein = Number(document.getElementById("quick-protein").value) || "";
    const r = { id: "r-" + Date.now(), name, meal: slot.split("-")[1] || "breakfast", serves: 1, protein, quick: true,
      tags: ["Quick"], ingredients: ["1 " + name], method: "" };
    data.recipes.push(r);
    ACTIONS.assign({ monday, slot, id: r.id });
    toast(`${name} added to your quick options`);
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
    if (!store) lines.push(...otherShop().filter((o) => !o.got).map((o) => `${o.text} (${o.store})`));
    if (!lines.length) return toast("Nothing left to get");
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

  "other-add"() {
    const text = document.getElementById("other-new").value.trim();
    if (!text) return;
    otherShop().push({ id: "o" + Date.now().toString(36), text, store: OTHER_STORES[OTHER_STORES.length - 1], got: false });
    saveData();
    render();
  },

  "other-tick"({ id }) {
    const o = otherShop().find((x) => x.id === id);
    o.got = !o.got;
    saveData();
    render();
  },

  "other-store"({ id }) {
    const o = otherShop().find((x) => x.id === id);
    o.store = OTHER_STORES[(OTHER_STORES.indexOf(o.store) + 1) % OTHER_STORES.length];
    saveData();
    render();
  },

  "other-clear"() {
    data.otherShop = otherShop().filter((o) => !o.got);
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
    toast("Filled in. Give it a quick check");
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
    toast(flags.length ? `Saved. Heads up: ${flags[0]}` : "Recipe saved");
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
// Picker search: hides rows that don't match.
document.addEventListener("input", (e) => {
  if (e.target.id !== "pick-search") return;
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll("[data-pick]").forEach((row) => { row.style.display = !q || row.dataset.pick.includes(q) ? "" : "none"; });
});

document.addEventListener("input", (e) => {
  if (e.target.id !== "recipe-search") return;
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll(".recipe-card").forEach((card) => {
    card.style.display = !q || card.dataset.search.includes(q) ? "block" : "none";
  });
});
