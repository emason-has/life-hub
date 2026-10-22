// =====================================================================
// YOUR PLAN CONTENT
// Everything in this file is the "content" of your plan: goals, Tiimo
// reminders, meals, cleaning, session types and workout templates.
// Change the words here and the rest of the app updates itself.
// =====================================================================

const UPPER_BODY_NOTE = "Start light. Stop if arm nerve pain flares.";

// ---------- Wake-up plan ----------
// Starts at 6:45 and steps 15 min earlier each week until 6:15.
const WAKE_TIMES = ["6:45", "6:30", "6:15"];

// ---------- Strength goals by Bali ----------
const GOALS = [
  { exercise: "leg-press", label: "Leg press", target: 80, start: 40, unit: "kg", text: "80kg+" },
  { exercise: "hip-thrust", label: "Hip thrusts", target: 15, start: 5, unit: "kg each side", text: "15-20kg each side" },
  { exercise: "smith-squat", label: "Smith squat", target: 20, start: 10, unit: "kg each side", text: "20kg each side" }
];

// Friendly little lines to keep things encouraging.
const CHEERS = [
  "Nice one! Every rep counts.",
  "Look at you showing up!",
  "That's a win. Be proud.",
  "Consistency beats perfect. Great work.",
  "One step closer to Bali!"
];


// =====================================================================
// TIIMO REMINDERS (shown under More)
// =====================================================================
const TIIMO = [
  { id: "t-wake", title: "Wake up", time: "{wake}", days: "Every day" },
  { id: "t-leave", title: "Leave for work", time: "7:10am", days: "Mon to Fri" },
  { id: "t-posture", title: "Before-lunch posture stretch", time: "11:45am", days: "Mon to Fri" },
  { id: "t-gym", title: "Gym after work", time: "5:00pm", days: "Tue, Thu, Fri" },
  { id: "t-prep", title: "Evening prep (bag, lunch, gym gear)", time: "9:30pm", days: "Sun to Thu" },
  { id: "t-bed", title: "Bed", time: "10:15pm", days: "Every day" },
  { id: "t-sunday", title: "Sunday reset: sort brain dump, plan meals, prep", time: "4:00pm", days: "Sunday" },
  { id: "t-tidy", title: "Thursday tidy", time: "7:00pm", days: "Thursday" }
];


// =====================================================================
// STAGE 3: MEALS
// =====================================================================

const STORES = ["Aldi", "Coles", "Woolworths"];   // first one is the default

const RECIPE_TAGS = ["High protein", "Quick", "Meal prep friendly", "Freezer friendly", "Slow cooker", "Thermomix"];

// What gets planned each day (weekday lunches are free at work).
const MEAL_SLOTS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "snack", label: "Snack" },
  { id: "dinner", label: "Dinner" }
];

const FOOD_PREFS = [
  "No seafood",
  "No cheese on its own (fine on pizza and pasta)",
  "Nothing super creamy, no plain milk (only in coffee)",
  "Likes: protein oats, stir fry, steak with salad, pasta with lean mince, protein balls, banana bread, yoghurt, summer smoothies",
  "Breakfast backup: Up&Go protein",
  "Work lunch: pick the curry or protein, fill up on salad and veg"
];

// Words that trigger a gentle "heads up" on a recipe.
const FOOD_FLAGS = [
  { reason: "seafood", words: ["prawn", "shrimp", "salmon", "tuna", "fish", "seafood", "crab", "lobster", "squid", "calamari", "mussel", "oyster", "scallop", "anchov", "sardine", "barramundi", "cod"] },
  { reason: "creamy", words: ["cream", "alfredo", "carbonara", "milk"] },
  { reason: "cheese (fine on pizza or pasta)", words: ["cheese", "feta", "haloumi", "halloumi", "brie", "parmesan", "mozzarella", "cheddar", "ricotta"] }
];

// Rough protein numbers for the "Estimate" button.
// per100 = grams of protein per 100g. each = per item (egg, scoop, tin).
const PROTEIN_GUIDE = [
  { words: ["protein powder"], each: 25 },
  { words: ["protein pasta"], per100: 25 },
  { words: ["chicken thigh"], per100: 25 },
  { words: ["chicken"], per100: 31 },
  { words: ["turkey"], per100: 27 },
  { words: ["mince", "beef", "steak"], per100: 26 },
  { words: ["pork"], per100: 26 },
  { words: ["egg"], each: 6 },
  { words: ["greek yoghurt", "greek yogurt"], per100: 10 },
  { words: ["yoghurt", "yogurt"], per100: 5 },
  { words: ["kidney beans", "black beans", "chickpeas", "lentils"], per100: 7 },
  { words: ["tofu"], per100: 12 },
  { words: ["oats"], per100: 13 },
  { words: ["pasta"], per100: 12 },
  { words: ["rice"], per100: 7 },
  { words: ["peanut butter"], per100: 25 },
  { words: ["almond meal"], per100: 21 }
];

// Things in recipes that never need to go on the shopping list.
const NOT_SHOPPING = ["water", "ice", "salt", "pepper", "salt and pepper"];

// Weekly staples always added to the shopping list (edit them in the app).
const STAPLES = [
  "Chicken breast", "Lean beef mince", "Eggs", "Greek yoghurt", "Oats", "Rice",
  "Frozen veg", "Berries", "Protein powder", "Bananas"
];

// Starter recipes, loaded the first time. You can edit or delete them in the app.
// "meal" is breakfast, snack or dinner. "serves" is how many portions one batch makes.
// Ingredient lines start with an amount so the shopping list can add them up.
const STARTER_RECIPES = [
  { id: "r-oats", name: "Protein overnight oats", meal: "breakfast", serves: 1, protein: 38,
    tags: ["High protein", "Quick", "Meal prep friendly"],
    ingredients: ["40g Oats", "120g Greek yoghurt", "1 scoop Protein powder", "60g Berries", "80ml Water"],
    method: "Mix oats, yoghurt, protein powder and water in a jar. Top with berries. Fridge overnight. Make 3-4 jars at once on Sunday." },
  { id: "r-bowls", name: "Chicken, rice and roast veg bowls", meal: "dinner", serves: 4, protein: 52,
    tags: ["High protein", "Meal prep friendly"],
    ingredients: ["600g Chicken breast", "300g Rice", "2 Capsicum", "1 Sweet potato", "1 Zucchini", "1 Red onion", "1 tbsp Olive oil", "1 Lemon"],
    method: "Chop veg and sweet potato, toss in oil and salt, roast at 200C for 30 min. Season chicken and bake or pan-fry. Cook rice. Split into 4 containers, squeeze of lemon." },
  { id: "r-stirfry", name: "Turkey or beef mince stir-fry", meal: "dinner", serves: 4, protein: 35,
    tags: ["High protein", "Quick", "Meal prep friendly"],
    ingredients: ["500g Lean beef mince", "500g Frozen veg", "300g Rice", "3 tbsp Soy sauce", "1 tbsp Honey", "2 Garlic cloves", "1 thumb Ginger"],
    method: "Cook rice. Brown mince in a hot pan with garlic and ginger. Add frozen stir-fry veg, soy sauce and honey, cook 5 min. Serve on rice. Swap in turkey mince any time." },
  { id: "r-steak", name: "Steak with salad", meal: "dinner", serves: 1, protein: 45,
    tags: ["High protein", "Quick"],
    ingredients: ["200g Steak", "1 bag Salad leaves", "1 punnet Cherry tomatoes", "1 Cucumber", "1 Avocado"],
    method: "Pat steak dry, salt it, cook in a very hot pan 3-4 min each side. Rest 5 min. Slice over a big salad with tomato, cucumber and avocado." },
  { id: "r-pasta", name: "Protein pasta with lean mince", meal: "dinner", serves: 4, protein: 45,
    tags: ["High protein", "Meal prep friendly", "Freezer friendly"],
    ingredients: ["350g Protein pasta", "500g Lean beef mince", "700g Passata", "1 Brown onion", "2 Garlic cloves", "1 Zucchini", "1 bag Baby spinach"],
    method: "Cook pasta. Brown mince with onion and garlic, add grated zucchini and passata, simmer 15 min. Stir through spinach and pasta. Freezes well." },
  { id: "r-balls", name: "Protein balls", meal: "snack", serves: 6, protein: 15,
    tags: ["High protein", "Meal prep friendly", "Freezer friendly"],
    ingredients: ["100g Oats", "2 scoop Protein powder", "120g Peanut butter", "3 tbsp Honey", "2 tbsp Dark choc chips"],
    method: "Mix everything (add a splash of water if dry). Roll into 12 balls. Fridge for a week or freeze. Serve = 2 balls." },
  { id: "r-banana-bread", name: "Protein banana bread", meal: "snack", serves: 10, protein: 9,
    tags: ["Meal prep friendly", "Freezer friendly"],
    ingredients: ["3 Bananas", "2 Eggs", "150g Greek yoghurt", "2 scoop Protein powder", "150g Self-raising flour", "2 tbsp Honey", "1 tsp Cinnamon"],
    method: "Mash bananas, mix in eggs, yoghurt and honey. Stir in flour, protein powder and cinnamon. Bake in a lined loaf tin at 175C for 45-50 min. Slice and freeze." },
  { id: "r-yoghurt", name: "Greek yoghurt and berries", meal: "snack", serves: 1, protein: 17,
    tags: ["High protein", "Quick"],
    ingredients: ["170g Greek yoghurt", "60g Berries", "1 tsp Honey"],
    method: "Yoghurt in a bowl, berries on top, drizzle of honey." },
  { id: "r-smoothie", name: "Protein smoothie (summer)", meal: "snack", serves: 1, protein: 30,
    tags: ["High protein", "Quick"],
    ingredients: ["1 scoop Protein powder", "1 Bananas", "80g Berries", "100g Greek yoghurt", "200ml Water", "Ice"],
    method: "Blend everything with ice until smooth." },
  { id: "r-chilli", name: "Rough Monday beef chilli (freezer)", meal: "dinner", serves: 4, protein: 35, rough: true,
    tags: ["High protein", "Meal prep friendly", "Freezer friendly"],
    ingredients: ["500g Lean beef mince", "400g Kidney beans", "800g Diced tomatoes", "1 Brown onion", "1 Capsicum", "2 Garlic cloves", "2 tbsp Chilli seasoning", "300g Rice"],
    method: "Brown mince with onion, garlic and capsicum. Add seasoning, tomatoes and drained beans, simmer 25 min. Freeze in portions. On a rough Monday: microwave and serve with microwave rice." },
  { id: "r-slow-chicken", name: "Slow cooker honey garlic chicken", meal: "dinner", serves: 4, protein: 40,
    tags: ["High protein", "Meal prep friendly", "Slow cooker"],
    ingredients: ["800g Chicken thigh", "4 tbsp Soy sauce", "3 tbsp Honey", "4 Garlic cloves", "1 Brown onion", "300g Rice", "500g Frozen veg"],
    method: "Weekend morning: put chicken, sliced onion, garlic, soy sauce and honey in the slow cooker. Low for 6 hours (or high for 3-4). Shred with two forks. Serve on rice with steamed veg. Leftovers make great lunches or Monday dinner." }
];


// =====================================================================
// BALI TRIP
// Shown under the countdown on Home. The countdown date itself is in Settings.
// =====================================================================
const BALI_TRIP = [
  { place: "Uluwatu", from: "2027-02-15", to: "2027-02-18" },
  { place: "Canggu", from: "2027-02-18", to: "2027-02-28" }
];


// =====================================================================
// STAGE 4: HOUSE (cleaning)
// "every" is how many days between cleans. "mins" is a rough time, used by
// the 15-minute blitz. You can edit, add and delete tasks in the app too.
// =====================================================================
const CLEANING_TASKS = [
  // Weekly
  { id: "c-sheets", name: "Change sheets", room: "Bedroom", every: 7, mins: 15 },
  { id: "c-bathroom", name: "Clean bathroom", room: "Bathroom", every: 7, mins: 20 },
  { id: "c-vacuum", name: "Vacuum", room: "Whole house", every: 7, mins: 20 },
  { id: "c-mop", name: "Mop floors", room: "Whole house", every: 7, mins: 15 },
  { id: "c-bins", name: "Bins out", room: "Outside", every: 7, mins: 3 },
  // Fortnightly
  { id: "c-fridge", name: "Fridge clean-out", room: "Kitchen", every: 14, mins: 10 },
  { id: "c-dust", name: "Dust surfaces", room: "Whole house", every: 14, mins: 10 },
  // Monthly
  { id: "c-oven", name: "Clean oven", room: "Kitchen", every: 30, mins: 40 },
  { id: "c-microwave", name: "Clean microwave", room: "Kitchen", every: 30, mins: 5 },
  { id: "c-skirting", name: "Wipe skirting boards", room: "Whole house", every: 30, mins: 15 },
  { id: "c-washer", name: "Washing machine clean cycle", room: "Laundry", every: 30, mins: 5 },
  // Every 3-6 months
  { id: "c-windows", name: "Clean windows", room: "Whole house", every: 90, mins: 45 },
  { id: "c-curtains", name: "Wash curtains", room: "Living room", every: 180, mins: 15 },
  { id: "c-mattress", name: "Flip mattress", room: "Bedroom", every: 90, mins: 5 },
  { id: "c-deepfridge", name: "Deep clean fridge", room: "Kitchen", every: 90, mins: 40 }
];

// How the "every" days are labelled in the app.
const FREQUENCIES = [
  { days: 7, label: "Weekly" },
  { days: 14, label: "Fortnightly" },
  { days: 30, label: "Monthly" },
  { days: 90, label: "Every 3 months" },
  { days: 180, label: "Every 6 months" }
];


// =====================================================================
// FITNESS UPGRADE: sessions, templates, week suggestions, targets
// Everything here is a starting point. You can edit all of it in the app.
// =====================================================================

// The kinds of session a day can have. "strength" ones count toward your
// weekly strength target. "care" sessions (posture) are always optional
// and never count as missed.
const SESSION_TYPES = {
  "full-gym":   { label: "Full gym", icon: "dumbbell", strength: true, mins: 45 },
  "short-gym":  { label: "Short gym", icon: "timer", strength: true, mins: 25 },
  "home":       { label: "Home workout", icon: "house", mins: 25 },
  "light-home": { label: "Light home", icon: "leaf", mins: 15 },
  "walk":       { label: "Walk", icon: "walk", mins: 30, cardio: true },
  "run":        { label: "Run", icon: "run", mins: 30, cardio: true },
  "surf":       { label: "Surf", icon: "wave", mins: 60, cardio: true },
  "pilates":    { label: "Pilates / yoga", icon: "lotus", mins: 30 },
  "posture":    { label: "Posture & arm care", icon: "posture", mins: 10, care: true },
  "rest":       { label: "Rest", icon: "moon", mins: 0 }
};

// Your workouts as templates: ex = exercise id (see exercises.js),
// rest = seconds between sets, weight = starting weight.
const DEFAULT_TEMPLATES = [
  { id: "t-glutes", name: "Glutes & legs", type: "full-gym", exercises: [
    { ex: "hip-thrust", sets: 4, reps: 10, rest: 90, weight: 5 },
    { ex: "smith-squat", sets: 3, reps: 12, rest: 90, weight: 10 },
    { ex: "db-rdl", sets: 3, reps: 10, rest: 90, weight: 6 },
    { ex: "bulgarian", sets: 3, reps: 10, rest: 60 },
    { ex: "glute-kickback", sets: 3, reps: 12, rest: 60 }
  ]},
  { id: "t-back", name: "Back, triceps & core", type: "full-gym", exercises: [
    { ex: "lat-pulldown", sets: 3, reps: 12, rest: 90 },
    { ex: "cable-row", sets: 3, reps: 12, rest: 90 },
    { ex: "face-pull", sets: 3, reps: 15, rest: 60 },
    { ex: "tricep-pushdown", sets: 3, reps: 12, rest: 60 },
    { ex: "tricep-kickback", sets: 3, reps: 12, rest: 60 },
    { ex: "pallof", sets: 3, reps: 10, rest: 60 }
  ]},
  { id: "t-legs", name: "Legs & core", type: "full-gym", exercises: [
    { ex: "leg-press", sets: 3, reps: 12, rest: 90, weight: 40 },
    { ex: "step-ups", sets: 3, reps: 10, rest: 60 },
    { ex: "lateral-walks", sets: 3, reps: 15, rest: 45 },
    { ex: "ham-curl", sets: 3, reps: 12, rest: 60 },
    { ex: "side-plank", sets: 3, reps: 30, rest: 45 }
  ]},
  { id: "t-short-glutes", name: "Short: Glutes", type: "short-gym", exercises: [
    { ex: "hip-thrust", sets: 3, reps: 10, rest: 75, weight: 5 },
    { ex: "bulgarian", sets: 2, reps: 10, rest: 60 },
    { ex: "glute-kickback", sets: 2, reps: 12, rest: 45 },
    { ex: "hip-abduction", sets: 2, reps: 15, rest: 45 }
  ]},
  { id: "t-short-upper", name: "Short: Back & arms", type: "short-gym", exercises: [
    { ex: "lat-pulldown", sets: 3, reps: 12, rest: 75 },
    { ex: "cable-row", sets: 2, reps: 12, rest: 60 },
    { ex: "tricep-pushdown", sets: 3, reps: 12, rest: 45 },
    { ex: "face-pull", sets: 2, reps: 15, rest: 45 }
  ]},
  { id: "t-home", name: "Home: Glutes, core & bands", type: "home", exercises: [
    { ex: "glute-bridge", sets: 2, reps: 15, rest: 30 },
    { ex: "clams", sets: 2, reps: 15, rest: 30 },
    { ex: "lateral-walks", sets: 2, reps: 15, rest: 30 },
    { ex: "donkey-kicks", sets: 2, reps: 12, rest: 30 },
    { ex: "dead-bug", sets: 2, reps: 10, rest: 30 },
    { ex: "hundred", sets: 1, reps: 100, rest: 30 },
    { ex: "single-leg-stretch", sets: 2, reps: 10, rest: 30 },
    { ex: "bird-dog", sets: 2, reps: 10, rest: 30 },
    { ex: "band-pull-apart", sets: 2, reps: 15, rest: 30 },
    { ex: "band-row", sets: 2, reps: 15, rest: 30 },
    { ex: "band-pushdown", sets: 2, reps: 15, rest: 30 },
    { ex: "childs-pose", sets: 1, reps: 60, rest: 0 },
    { ex: "pigeon", sets: 1, reps: 60, rest: 0 },
    { ex: "cat-cow", sets: 1, reps: 10, rest: 0 }
  ]},
  { id: "t-light", name: "Light home: Glute circuit", type: "light-home", exercises: [
    { ex: "glute-bridge", sets: 3, reps: 15, rest: 30 },
    { ex: "clams", sets: 2, reps: 15, rest: 30 },
    { ex: "donkey-kicks", sets: 2, reps: 12, rest: 30 },
    { ex: "fire-hydrant", sets: 2, reps: 12, rest: 30 },
    { ex: "side-plank", sets: 2, reps: 20, rest: 30 }
  ]},
  { id: "t-home-upper", name: "Home: Band back & arms", type: "light-home", exercises: [
    { ex: "band-pull-apart", sets: 3, reps: 15, rest: 45 },
    { ex: "band-row", sets: 3, reps: 15, rest: 45 },
    { ex: "band-pushdown", sets: 3, reps: 15, rest: 45 },
    { ex: "close-pushup", sets: 2, reps: 8, rest: 45 }
  ]},
  { id: "t-posture", name: "Posture & arm care", type: "posture", exercises: [
    { ex: "band-pull-apart", sets: 2, reps: 15, rest: 30 },
    { ex: "face-pull", sets: 2, reps: 15, rest: 30 },
    { ex: "chin-tucks", sets: 1, reps: 10, rest: 0 },
    { ex: "doorway-stretch", sets: 2, reps: 30, rest: 0 },
    { ex: "towel-thoracic", sets: 1, reps: 90, rest: 0 },
    { ex: "cat-cow", sets: 1, reps: 10, rest: 0 }
  ]},
  { id: "t-pilates", name: "Pilates core & stretch", type: "pilates", exercises: [
    { ex: "dead-bug", sets: 2, reps: 10, rest: 20 },
    { ex: "hundred", sets: 1, reps: 100, rest: 20 },
    { ex: "single-leg-stretch", sets: 2, reps: 10, rest: 20 },
    { ex: "bird-dog", sets: 2, reps: 10, rest: 20 },
    { ex: "side-plank", sets: 2, reps: 20, rest: 20 },
    { ex: "cat-cow", sets: 1, reps: 10, rest: 0 },
    { ex: "childs-pose", sets: 1, reps: 60, rest: 0 },
    { ex: "pigeon", sets: 1, reps: 60, rest: 0 }
  ]}
];

// What "Plan my week" suggests. Each day lists [type, template] pairs.
// "summer" swaps Friday and Saturday so Friday can be a surf (Dec to Feb).
const WEEK_SUGGESTIONS = {
  normal: {
    label: "Normal", emoji: "💪", about: "3 gym sessions, a run, a home session and a surf.",
    days: { Mon: [["pilates", "t-pilates", "optional"]], Tue: [["full-gym", "t-glutes"]], Wed: [["run"], ["home", "t-home"]],
            Thu: [["full-gym", "t-back"]], Fri: [["full-gym", "t-legs"]], Sat: [["surf"]], Sun: [] },
    summer: { Fri: [["surf"]], Sat: [["full-gym", "t-legs"]] }
  },
  busy: {
    label: "Busy", emoji: "⏱️", about: "2 short gym sessions plus a light home session and a surf. Still a win.",
    days: { Mon: [], Tue: [["short-gym", "t-short-glutes"]], Wed: [["light-home", "t-light"]], Thu: [["short-gym", "t-short-upper"]],
            Fri: [], Sat: [["surf"]], Sun: [] }
  },
  light: {
    label: "Light", emoji: "🌱", about: "Low energy or a big week: 2-3 gentle sessions. Still counts.",
    days: { Mon: [], Tue: [["light-home", "t-light"]], Wed: [], Thu: [["pilates", "t-pilates"]], Fri: [], Sat: [["run"]], Sun: [] }
  }
};

// Weekly targets (editable in Settings). Sets count toward each
// exercise's main muscle.
const DEFAULT_TARGETS = {
  strength: 3,
  glutes: [10, 14], back: [8, 10], triceps: [6, 8], core: [6, null],
  runs: [1, 2]
};

// Muscle groups used for targets, filters and charts.
const MUSCLE_GROUPS = [
  { id: "glutes", label: "Glutes", word: "Glute", color: "#e98b6d" },
  { id: "legs", label: "Legs", word: "Leg", color: "#f2b544" },
  { id: "back", label: "Back", word: "Back", color: "#2a7f9e" },
  { id: "triceps", label: "Triceps", word: "Tricep", color: "#7cc6be" },
  { id: "core", label: "Core", word: "Core", color: "#9b8ec4" },
  { id: "shoulders", label: "Shoulders", word: "Shoulder", color: "#6cc4a1" },
  { id: "chest", label: "Chest", word: "Chest", color: "#d98fa8" },
  { id: "arms", label: "Biceps & forearms", word: "Arm", color: "#8fb3d9" },
  { id: "mobility", label: "Mobility", word: "Mobility", color: "#b9a68c" }
];

// When a session drops, which exercise to add extra sets of, by muscle.
const MAKE_UP_EXERCISES = {
  glutes: { gym: "glute-kickback", home: "glute-bridge" },
  legs: { gym: "leg-press", home: "bw-squat" },
  back: { gym: "cable-row", home: "band-row" },
  triceps: { gym: "tricep-pushdown", home: "band-pushdown" },
  core: { gym: "pallof", home: "dead-bug" }
};
