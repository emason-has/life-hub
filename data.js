// =====================================================================
// YOUR PLAN CONTENT
// Everything in this file is the "content" of your plan: workouts, the
// weekly schedule, phases and habits. To change an exercise, a rep count
// or a label, change the words here. The rest of the app updates itself.
// =====================================================================

// ---------- Workouts ----------
// sets x reps. "unit" is what the weight box means:
//   "kg each side" (plates on a bar), "kg" (machine/dumbbell), or "" (no weight).
// "repsLabel" lets us say "sec" or "steps" instead of reps.
// "step" is how much to add when you're ready to go up (default 2.5kg).
// "upper: true" shows the gentle nerve-pain reminder.
const WORKOUTS = {
  glutes: {
    name: "Glutes and legs",
    day: "Tue",
    length: "45 min",
    exercises: [
      { id: "hip-thrust", name: "Hip thrusts", sets: 4, reps: 10, unit: "kg each side", note: "Start 5-7.5kg each side" },
      { id: "smith-squat", name: "Smith machine squat", sets: 3, reps: 12, unit: "kg each side", note: "Start 10kg each side" },
      { id: "db-rdl", step: 1, name: "Dumbbell Romanian deadlift", sets: 3, reps: 10, unit: "kg", note: "Start light. Soft knees, flat back, push hips back" },
      { id: "bulgarian", step: 1, name: "Bulgarian split squat", sets: 3, reps: 10, unit: "kg", note: "Each leg. Bodyweight is fine to start" },
      { id: "glute-kickback", name: "Cable glute kickbacks", sets: 3, reps: 12, unit: "kg", note: "Each leg" }
    ]
  },
  back: {
    name: "Back, triceps and core",
    day: "Thu",
    length: "45 min",
    exercises: [
      { id: "lat-pulldown", name: "Lat pull-downs", sets: 3, reps: 12, unit: "kg", upper: true },
      { id: "cable-row", name: "Seated cable rows", sets: 3, reps: 12, unit: "kg", upper: true },
      { id: "face-pull", name: "Face pulls", sets: 3, reps: 15, unit: "kg", upper: true },
      { id: "tricep-pushdown", name: "Cable tricep pushdowns", sets: 3, reps: 12, unit: "kg", upper: true },
      { id: "tricep-kickback", name: "Single-arm cable tricep kickbacks", sets: 3, reps: 12, unit: "kg", note: "Each arm", upper: true },
      { id: "pallof", name: "Pallof press", sets: 3, reps: 10, unit: "kg", note: "Each side" }
    ]
  },
  legs: {
    name: "Legs and core",
    day: "Fri/Sat",
    length: "45 min",
    exercises: [
      { id: "leg-press", name: "Leg press", sets: 3, reps: 12, unit: "kg", note: "Start 40-45kg" },
      { id: "step-ups", step: 1, name: "Step-ups", sets: 3, reps: 10, unit: "kg", note: "Each leg" },
      { id: "lateral-walks", name: "Banded lateral walks", sets: 3, reps: 15, unit: "", repsLabel: "steps" },
      { id: "ham-curl", name: "Hamstring curls", sets: 3, reps: 12, unit: "kg" },
      { id: "side-plank", name: "Side planks", sets: 3, reps: 30, unit: "", repsLabel: "sec", note: "Each side" }
    ]
  },
  home: {
    name: "Home session",
    day: "Wed",
    length: "20-25 min",
    kit: "Dumbbells, mini leg bands, long resistance bands, mat",
    // The home session is done by time blocks, so it's a simple checklist.
    blocks: [
      { id: "home-glutes", name: "Glutes with leg bands", mins: 8, moves: "Glute bridges, clams, lateral walks, donkey kicks" },
      { id: "home-core", name: "Pilates core", mins: 7, moves: "Dead bugs, the hundred, single-leg stretch, bird dogs" },
      { id: "home-arms", name: "Back and arms with long band", mins: 3, moves: "Light pull-aparts, rows, tricep pushdowns", upper: true },
      { id: "home-yoga", name: "Yoga cool-down", mins: 5, moves: "Child's pose, pigeon, cat-cow" }
    ]
  }
};

const UPPER_BODY_NOTE = "Start light. Stop if arm nerve pain flares.";

// ---------- Weekly plan ----------
// Each day has tick boxes. "kind" decides what a tick counts towards:
//   gym, surf, home, run, light (optional yoga/walk/Pilates), rest, chore
// "workout" links a tick to a workout above so you can open it.
const WEEK_PLAN = [
  { day: "Mon", title: "Reset day", items: [
    { id: "mon-prep", label: "Meal prep (if missed Sunday)", kind: "chore" },
    { id: "mon-light", label: "Optional: 15 min yoga, walk or Goodlife Pilates", kind: "light" }
  ]},
  { day: "Tue", title: "Gym: glutes and legs", items: [
    { id: "tue-gym", label: "Gym: glutes and legs (45 min)", kind: "gym", workout: "glutes" }
  ]},
  { day: "Wed", title: "Run + home session", items: [
    { id: "wed-run", label: "Run", kind: "run" },
    { id: "wed-home", label: "Home session (20-25 min)", kind: "home", workout: "home" }
  ]},
  { day: "Thu", title: "Gym: back, triceps and core", items: [
    { id: "thu-gym", label: "Gym: back, triceps and core (45 min)", kind: "gym", workout: "back" },
    { id: "thu-tidy", label: "Quick house tidy", kind: "chore" }
  ]},
  { day: "Fri", title: "Surf or gym", items: [
    { id: "fri-surf", label: "Surf (summer)", kind: "surf" },
    { id: "fri-gym", label: "Or gym: legs and core", kind: "gym", workout: "legs" }
  ]},
  { day: "Sat", title: "Surf or easy run", items: [
    { id: "sat-surf", label: "Surf", kind: "surf" },
    { id: "sat-run", label: "Or easy run", kind: "run" },
    { id: "sat-legs", label: "Legs and core (if Fri was a surf)", kind: "gym", workout: "legs" }
  ]},
  { day: "Sun", title: "Surf or rest + shop and prep", items: [
    { id: "sun-surf", label: "Surf", kind: "surf" },
    { id: "sun-rest", label: "Or rest day", kind: "rest" },
    { id: "sun-shop", label: "Food shop", kind: "chore" },
    { id: "sun-prep", label: "Meal prep", kind: "chore" }
  ]}
];

// Every day also gets this option. It counts as a workout.
const LOW_ENERGY = { id: "low-energy", label: "Low energy: 10 min yoga or Pilates", kind: "low" };

// ---------- Phases ----------
// Each phase adds habits. Habits with "days" only show on those days.
// A habit can share its id with a weekly-plan tick (like "sun-prep"),
// so ticking it in one place ticks it in the other.
const PHASES = [
  { num: 1, weeks: "Weeks 1-2", name: "Wake-up shift + 3 workouts a week",
    habits: [
      { id: "woke-on-time", label: "Woke up at my target time" }
    ]},
  { num: 2, weeks: "Weeks 3-4", name: "Add Sunday meal prep + morning routine",
    habits: [
      { id: "sun-prep", label: "Sunday meal prep", days: ["Sun"] },
      { id: "morning-routine", label: "Morning routine" }
    ]},
  { num: 3, weeks: "Weeks 5-6", name: "Add Thursday clean + House tab",
    habits: [
      { id: "thu-tidy", label: "Thursday clean", days: ["Thu"] }
    ]},
  { num: 4, weeks: "Week 7 onwards", name: "Add Saves, brain dump and focus timer",
    habits: [
      { id: "brain-dump", label: "Quick brain dump" },
      { id: "focus-sprint", label: "One focus sprint" }
    ]}
];

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
// STAGE 2: ROUTINES
// =====================================================================

// "{wake}" gets swapped for this week's wake-up target time.
// Items that share an id with a habit (like "woke-on-time") tick both at once.
const MORNING = [
  { id: "woke-on-time", label: "Wake up by {wake}" },
  { id: "am-ready", label: "Get ready" },
  { id: "am-oats", label: "Breakfast: protein oats (backup: Up&Go protein)" },
  { id: "posture-routine", label: "5 min posture routine" },
  { id: "am-leave", label: "Leave by 7:10" }
];

const EVENING = [
  { id: "pm-bag", label: "Prep bag and lunch" },
  { id: "pm-gear", label: "Lay out gym gear" },
  { id: "pm-screens", label: "Screens off" },
  { id: "bed-on-time", label: "In bed by 10:15" }
];

const DAILY_HABITS = [
  { id: "protein-meals", label: "Protein with each meal" },
  { id: "daily-walk", label: "Daily walk" },
  { id: "woke-on-time", label: "Woke up on time" },
  { id: "bed-on-time", label: "In bed on time" },
  { id: "posture-routine", label: "Posture routine" }
];

// Posture: 5 min home routine (for shoulders that roll forward at a desk).
const POSTURE_HOME = [
  { id: "pos-pullaparts", name: "Band pull-aparts", time: "1 min", how: "Arms straight out in front, pull the band apart until it touches your chest. Squeeze shoulder blades. 15 slow reps." },
  { id: "pos-doorway", name: "Doorway chest stretch", time: "1 min", how: "Forearms on the door frame at shoulder height, step one foot through until you feel a stretch across your chest. 30 sec, twice." },
  { id: "pos-chintucks", name: "Chin tucks", time: "1 min", how: "Sit or stand tall, slide your chin straight back (make a double chin), hold 3 sec. 10 reps." },
  { id: "pos-towel", name: "Upper back over a rolled towel", time: "2 min", how: "Lie on your back with a rolled towel across your upper back, under your shoulder blades. Arms out wide or overhead, breathe and relax." }
];

// Tiny posture resets at work, tied to things you already do.
const POSTURE_WORK = [
  { id: "work-arrive", when: "When you arrive", what: "Set up your chair and screen. Shoulders down and back, 5 chin tucks." },
  { id: "work-break", when: "On water or bathroom breaks", what: "Roll your shoulders back 5 times and stand tall for 3 deep breaths." },
  { id: "work-lunch", when: "Before lunch", what: "Doorway or desk-edge chest stretch, 30 sec each side." },
  { id: "work-leave", when: "Before leaving", what: "Squeeze your shoulder blades together 10 times, then a big stretch overhead." }
];

// Sunday reset (about 10 min).
const SUNDAY_RESET = [
  { id: "sun-tidy", label: "Quick tidy" },
  { id: "sun-gear", label: "Gym gear out for the week" },
  { id: "sun-groceries", label: "Grocery list done, or groceries ordered online" },
  { id: "sun-freezer", label: "Freezer has a \"rough Monday\" meal" }
];

// Reminders to set up in Tiimo. Change any time or wording here.
// "{wake}" gets swapped for this week's wake-up target.
const TIIMO = [
  { id: "t-wake", title: "Wake up", time: "{wake}", days: "Every day" },
  { id: "t-leave", title: "Leave for work", time: "7:10am", days: "Mon to Fri" },
  { id: "t-posture", title: "Before-lunch posture stretch", time: "11:45am", days: "Mon to Fri" },
  { id: "t-gym", title: "Gym after work", time: "5:00pm", days: "Tue, Thu, Fri" },
  { id: "t-prep", title: "Evening prep (bag, lunch, gym gear)", time: "9:30pm", days: "Sun to Thu" },
  { id: "t-bed", title: "Bed", time: "10:15pm", days: "Every day" },
  { id: "t-sunday", title: "Sunday reset and meal prep", time: "4:00pm", days: "Sunday" },
  { id: "t-tidy", title: "Thursday tidy", time: "7:00pm", days: "Thursday" }
];


// =====================================================================
// STAGE 3: MEALS
// =====================================================================

const STORES = ["Aldi", "Coles", "Woolworths"];   // first one is the default

const RECIPE_TAGS = ["High protein", "Quick", "Meal prep friendly", "Freezer friendly"];

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
    method: "Brown mince with onion, garlic and capsicum. Add seasoning, tomatoes and drained beans, simmer 25 min. Freeze in portions. On a rough Monday: microwave and serve with microwave rice." }
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
