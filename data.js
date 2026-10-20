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
  { num: 3, weeks: "Weeks 5-6", name: "Add Thursday clean + Home tab",
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
