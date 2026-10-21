// =====================================================================
// EXERCISE LIBRARY
// Names, photos and step-by-step instructions come from the free,
// public domain "free-exercise-db" (github.com/yuhonas/free-exercise-db).
// Form cues, common mistakes and the back/shoulder-friendly tags are
// written for you. Photos are stored in the ex-img folder so they work offline.
//
// Fields: groups = what it counts toward in your weekly set targets
//         equip  = equipment needed, where = gym, home or both
//         unit   = what the weight box means ("" = no weight)
//         step   = how much to add when you go up
// =====================================================================
const EXERCISES = [
 {
  "id": "hip-thrust",
  "name": "Hip thrust",
  "groups": [
   "glutes"
  ],
  "equip": [
   "barbell"
  ],
  "unit": "kg each side",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Glutes",
   "Calves (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/hip-thrust-0.jpg",
   "ex-img/hip-thrust-1.jpg"
  ],
  "steps": [
   "Begin seated on the ground with a bench directly behind you. Have a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise.",
   "Roll the bar so that it is directly above your hips, and lean back against the bench so that your shoulder blades are near the top of it.",
   "Begin the movement by driving through your feet, extending your hips vertically through the bar. Your weight should be supported by your shoulder blades and your feet. Extend as far as possible, then reverse the motion to return to the starting position."
  ],
  "cues": [
   "Upper back on the bench edge, feet flat, shins straight up at the top",
   "Ribs down, chin tucked, look forward not up",
   "Squeeze your glutes hard and pause 1 second at the top"
  ],
  "mistakes": [
   "Arching the lower back at the top instead of squeezing glutes",
   "Feet too far forward so hamstrings take over"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "glute-kickback",
  "name": "Cable glute kickback",
  "groups": [
   "glutes"
  ],
  "equip": [
   "cable"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Glutes",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/glute-kickback-0.jpg",
   "ex-img/glute-kickback-1.jpg"
  ],
  "steps": [
   "Hook a leather ankle cuff to a low cable pulley and then attach the cuff to your ankle.",
   "Face the weight stack from a distance of about two feet, grasping the steel frame for support.",
   "While keeping your knees and hips bent slightly and your abs tight, contract your glutes to slowly \"kick\" the working leg back in a semicircular arc as high as it will comfortably go as you breathe out. Tip: At full extension, squeeze your glutes for a second in order to achieve a peak contraction.",
   "Now slowly bring your working leg forward, resisting the pull of the cable until you reach the starting position.",
   "Repeat for the recommended amount of repetitions.",
   "Switch legs and repeat the movement for the other side."
  ],
  "cues": [
   "Hinge forward slightly and brace your tummy",
   "Push the heel back and up, like stamping on the wall behind",
   "Squeeze at the top, slow on the way down"
  ],
  "mistakes": [
   "Swinging the leg using momentum",
   "Arching the lower back to get the leg higher"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "glute-bridge",
  "name": "Glute bridge (mini band optional)",
  "groups": [
   "glutes"
  ],
  "equip": [
   "bodyweight",
   "mini band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Glutes",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/glute-bridge-0.jpg",
   "ex-img/glute-bridge-1.jpg"
  ],
  "steps": [
   "Lie flat on the floor on your back with the hands by your side and your knees bent. Your feet should be placed around shoulder width. This will be your starting position.",
   "Pushing mainly with your heels, lift your hips off the floor while keeping your back straight. Breathe out as you perform this part of the motion and hold at the top for a second.",
   "Slowly go back to the starting position as you breathe in."
  ],
  "cues": [
   "Feet hip-width, knees pushing out into the band",
   "Tuck your pelvis slightly, then lift through the heels",
   "Squeeze glutes at the top, ribs stay down"
  ],
  "mistakes": [
   "Pushing through the toes instead of the heels",
   "Over-arching the back at the top"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "single-leg-bridge",
  "name": "Single-leg glute bridge",
  "groups": [
   "glutes"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Glutes",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/single-leg-bridge-0.jpg",
   "ex-img/single-leg-bridge-1.jpg"
  ],
  "steps": [
   "Lay on the floor with your feet flat and knees bent.",
   "Raise one leg off of the ground, pulling the knee to your chest. This will be your starting position.",
   "Execute the movement by driving through the heel, extending your hip upward and raising your glutes off of the ground.",
   "Extend as far as possible, pause and then return to the starting position."
  ],
  "cues": [
   "One foot planted, other knee hugged in or leg straight",
   "Drive through the planted heel",
   "Keep hips level, don't let one side drop"
  ],
  "mistakes": [
   "Hips twisting to one side",
   "Rushing the reps"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "donkey-kicks",
  "name": "Donkey kicks",
  "groups": [
   "glutes"
  ],
  "equip": [
   "bodyweight",
   "mini band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Glutes",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/donkey-kicks-0.jpg",
   "ex-img/donkey-kicks-1.jpg"
  ],
  "steps": [
   "Kneel on the floor or an exercise mat and bend at the waist with your arms extended in front of you (perpendicular to the torso) in order to get into a kneeling push-up position but with the arms spaced at shoulder width. Your head should be looking forward and the bend of the knees should create a 90-degree angle between the hamstrings and the calves. This will be your starting position.",
   "As you exhale, lift up your right leg until the hamstrings are in line with the back while maintaining the 90-degree angle bend. Contract the glutes throughout this movement and hold the contraction at the top for a second. Tip: At the end of the movement the upper leg should be parallel to the floor while the calf should be perpendicular to it.",
   "Go back to the initial position as you inhale and now repeat with the left leg.",
   "Continue to alternate legs until all of the recommended repetitions have been performed."
  ],
  "cues": [
   "On all fours, hands under shoulders, knees under hips",
   "Keep the knee bent and press the sole of your foot to the ceiling",
   "Stop when your thigh is level with your back"
  ],
  "mistakes": [
   "Arching the lower back to lift higher",
   "Shifting your weight to the other side"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "clams",
  "name": "Clams (mini band)",
  "groups": [
   "glutes"
  ],
  "equip": [
   "mini band",
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Glutes"
  ],
  "images": [],
  "steps": [
   "Lie on your side with a mini band just above your knees, knees bent at about 45 degrees, heels together.",
   "Rest your head on your arm and keep your hips stacked.",
   "Keeping heels touching, lift the top knee as high as you can without rolling your hips back.",
   "Pause, then lower slowly. Do all reps, then switch sides."
  ],
  "cues": [
   "Hips stacked, don't roll backwards",
   "Heels stay glued together",
   "Slow and controlled, feel the side of your bum"
  ],
  "mistakes": [
   "Rolling the hips back to lift higher",
   "Going too fast and using momentum"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "fire-hydrant",
  "name": "Fire hydrants",
  "groups": [
   "glutes"
  ],
  "equip": [
   "bodyweight",
   "mini band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Glutes"
  ],
  "images": [],
  "steps": [
   "Start on all fours, hands under shoulders and knees under hips.",
   "Keeping the knee bent at 90 degrees, lift one leg out to the side.",
   "Lift until your thigh is roughly level with your hips, keeping your body still.",
   "Lower slowly. Do all reps, then switch sides."
  ],
  "cues": [
   "Keep your body still, only the leg moves",
   "Lead with the knee",
   "Brace your tummy like a gentle cough"
  ],
  "mistakes": [
   "Leaning away from the working leg",
   "Letting the back sag"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "lateral-walks",
  "name": "Banded lateral walks",
  "groups": [
   "glutes"
  ],
  "equip": [
   "mini band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "steps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Outer hips"
  ],
  "images": [
   "ex-img/lateral-walks-0.jpg",
   "ex-img/lateral-walks-1.jpg"
  ],
  "steps": [
   "Place a band around both ankles and another around both knees. There should be enough tension that they are tight when your feet are shoulder width apart.",
   "To begin, take short steps forward alternating your left and right foot.",
   "After several steps, do just the opposite and walk backward to where you started."
  ],
  "cues": [
   "Mini band above knees or around ankles, slight squat",
   "Step sideways, keep tension on the band the whole time",
   "Toes point forward, knees push out"
  ],
  "mistakes": [
   "Standing up tall so the glutes switch off",
   "Letting the feet snap together"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "hip-abduction",
  "name": "Hip abduction machine",
  "groups": [
   "glutes"
  ],
  "equip": [
   "machine"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Outer hips",
   "Glutes (helper)"
  ],
  "images": [
   "ex-img/hip-abduction-0.jpg",
   "ex-img/hip-abduction-1.jpg"
  ],
  "steps": [
   "To begin, sit down on the abductor machine and select a weight you are comfortable with. When your legs are positioned properly, grip the handles on each side. Your entire upper body (from the waist up) should be stationary. This is the starting position.",
   "Slowly press against the machine with your legs to move them away from each other while exhaling.",
   "Feel the contraction for a second and begin to move your legs back to the starting position while breathing in. Note: Remember to keep your upper body stationary to prevent any injuries from occurring.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Sit tall or lean slightly forward for more glute",
   "Push the pads out with your knees, pause at the widest point",
   "Control the way back in"
  ],
  "mistakes": [
   "Letting the weights slam together",
   "Using a weight so heavy you only move a little"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "cable-pull-through",
  "name": "Cable pull-through",
  "groups": [
   "glutes"
  ],
  "equip": [
   "cable"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Glutes",
   "Hamstrings (helper)",
   "Lower back (helper)"
  ],
  "images": [
   "ex-img/cable-pull-through-0.jpg",
   "ex-img/cable-pull-through-1.jpg"
  ],
  "steps": [
   "Begin standing a few feet in front of a low pulley with a rope or handle attached. Face away from the machine, straddling the cable, with your feet set wide apart.",
   "Begin the movement by reaching through your legs as far as possible, bending at the hips. Keep your knees slightly bent. Keeping your arms straight, extend through the hip to stand straight up. Avoid pulling upward through the shoulders; all of the motion should originate through the hips."
  ],
  "cues": [
   "Face away from the cable, rope between your legs",
   "Push hips back with soft knees, flat back",
   "Stand up by squeezing glutes, not by leaning back"
  ],
  "mistakes": [
   "Squatting down instead of hinging",
   "Leaning back at the top"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "frog-pumps",
  "name": "Single-leg hip raise (Smith or bodyweight)",
  "groups": [
   "glutes"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Abs"
  ],
  "images": [
   "ex-img/frog-pumps-0.jpg",
   "ex-img/frog-pumps-1.jpg"
  ],
  "steps": [
   "Position a bench in the rack and load the bar to an appropriate weight. Lie down on the bench, placing the bottom of your feet against the bar. Unlock the bar and extend your legs. You may need to use your hands to assist you. For added stability grasp the sides of the Smith Machine. This will be your starting position.",
   "Initiate the movement by rotating your pelvis, flexing your spine to raise your hips off of the bench. Maintain a slight bend in the knees throughout the motion.",
   "After a brief pause, return the hips to the bench.",
   "Repeat for the desired number of repetitions."
  ],
  "cues": [
   "Small, controlled lift",
   "Squeeze glutes at the top",
   "Keep your ribs down"
  ],
  "mistakes": [
   "Pushing from the lower back",
   "Going too fast"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "smith-squat",
  "name": "Smith machine squat",
  "groups": [
   "legs",
   "glutes"
  ],
  "equip": [
   "machine"
  ],
  "unit": "kg each side",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Calves (helper)",
   "Glutes (helper)",
   "Hamstrings (helper)",
   "Lower back (helper)"
  ],
  "images": [
   "ex-img/smith-squat-0.jpg",
   "ex-img/smith-squat-1.jpg"
  ],
  "steps": [
   "To begin, first set the bar on the height that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.",
   "Hold on to the bar using both arms at each side (palms facing forward), unlock it and lift it off the rack by first pushing with your legs and at the same time straightening your torso.",
   "Position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance which targets overall development; however you can choose any of the three stances discussed in the foot stances section).",
   "Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.",
   "Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Feet slightly in front of the bar, shoulder-width",
   "Sit down and back like onto a chair, chest proud",
   "Push the floor away through your whole foot"
  ],
  "mistakes": [
   "Knees caving inwards",
   "Heels lifting off the floor"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "leg-press",
  "name": "Leg press",
  "groups": [
   "legs",
   "glutes"
  ],
  "equip": [
   "machine"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Calves (helper)",
   "Glutes (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/leg-press-0.jpg",
   "ex-img/leg-press-1.jpg"
  ],
  "steps": [
   "Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).",
   "Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.",
   "As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.",
   "Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.",
   "Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded."
  ],
  "cues": [
   "Lower back stays pressed into the seat",
   "Feet mid-to-high on the plate for more glutes",
   "Lower until knees are about 90 degrees, then push through heels"
  ],
  "mistakes": [
   "Lowering so deep your bum lifts off the seat",
   "Locking the knees hard at the top"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "db-rdl",
  "name": "Dumbbell Romanian deadlift",
  "groups": [
   "legs",
   "glutes"
  ],
  "equip": [
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Hamstrings",
   "Glutes (helper)",
   "Lower back (helper)"
  ],
  "images": [
   "ex-img/db-rdl-0.jpg",
   "ex-img/db-rdl-1.jpg"
  ],
  "steps": [
   "Grasp a couple of dumbbells holding them by your side at arm's length.",
   "Stand with your torso straight and your legs spaced using a shoulder width or narrower stance. The knees should be slightly bent. This is your starting position.",
   "Keeping the knees stationary, lower the dumbbells to over the top of your feet by bending at the waist while keeping your back straight. Keep moving forward as if you were going to pick something from the floor until you feel a stretch on the hamstrings. Exhale as you perform this movement",
   "Start bringing your torso up straight again by extending your hips and waist until you are back at the starting position. Inhale as you perform this movement.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Soft knees, push your hips back like closing a car door with your bum",
   "Dumbbells slide down close to your legs, flat back",
   "Stand up by squeezing glutes; stop when you feel the hamstring stretch"
  ],
  "mistakes": [
   "Rounding the back to reach lower",
   "Turning it into a squat by bending the knees a lot"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "bulgarian",
  "name": "Bulgarian split squat",
  "groups": [
   "glutes",
   "legs"
  ],
  "equip": [
   "dumbbells",
   "bodyweight"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Glutes (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/bulgarian-0.jpg",
   "ex-img/bulgarian-1.jpg"
  ],
  "steps": [
   "Position yourself into a staggered stance with the rear foot elevated and front foot forward.",
   "Hold a dumbbell in each hand, letting them hang at the sides. This will be your starting position.",
   "Begin by descending, flexing your knee and hip to lower your body down. Maintain good posture througout the movement. Keep the front knee in line with the foot as you perform the exercise.",
   "At the bottom of the movement, drive through the heel to extend the knee and hip to return to the starting position."
  ],
  "cues": [
   "Back foot on a bench, front foot far enough forward",
   "Lean your chest slightly forward for more glutes",
   "Drop straight down, push through the front heel"
  ],
  "mistakes": [
   "Front knee caving in",
   "Pushing off the back foot"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "step-ups",
  "name": "Step-ups",
  "groups": [
   "glutes",
   "legs"
  ],
  "equip": [
   "dumbbells",
   "bodyweight"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Calves (helper)",
   "Glutes (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/step-ups-0.jpg",
   "ex-img/step-ups-1.jpg"
  ],
  "steps": [
   "Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).",
   "Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up.",
   "Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position.",
   "Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg."
  ],
  "cues": [
   "Whole foot on the box or bench",
   "Drive through the top heel to stand up",
   "Lower slowly, don't drop down"
  ],
  "mistakes": [
   "Bouncing off the bottom foot",
   "Box so high your hips twist"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "goblet-squat",
  "name": "Goblet squat",
  "groups": [
   "legs",
   "glutes"
  ],
  "equip": [
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Calves (helper)",
   "Glutes (helper)",
   "Hamstrings (helper)",
   "Shoulders (helper)"
  ],
  "images": [
   "ex-img/goblet-squat-0.jpg",
   "ex-img/goblet-squat-1.jpg"
  ],
  "steps": [
   "Stand holding a light kettlebell by the horns close to your chest. This will be your starting position.",
   "Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight.",
   "At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions."
  ],
  "cues": [
   "Hold one dumbbell at your chest, elbows down",
   "Sit between your heels, chest up",
   "Knees follow your toes"
  ],
  "mistakes": [
   "Rounding forward at the bottom",
   "Heels lifting"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "reverse-lunge",
  "name": "Reverse lunge",
  "groups": [
   "glutes",
   "legs"
  ],
  "equip": [
   "dumbbells",
   "bodyweight"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Calves (helper)",
   "Glutes (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/reverse-lunge-0.jpg",
   "ex-img/reverse-lunge-1.jpg"
  ],
  "steps": [
   "Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.",
   "Step backward with your right leg around two feet or so from the left foot and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Tip: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground. Keep the torso upright during the lunge; flexible hip flexors are important. A long lunge emphasizes the Gluteus Maximus; a short lunge emphasizes Quadriceps.",
   "Push up and go back to the starting position as you exhale. Tip: Use the ball of your feet to push in order to accentuate the quadriceps. To focus on the glutes, press with your heels.",
   "Now repeat with the opposite leg."
  ],
  "cues": [
   "Step back, both knees bend to about 90 degrees",
   "Most of your weight stays on the front foot",
   "Push through the front heel to come back"
  ],
  "mistakes": [
   "Short steps that put stress on the knee",
   "Torso wobbling side to side"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "sumo-squat",
  "name": "Sumo (plie) dumbbell squat",
  "groups": [
   "legs",
   "glutes"
  ],
  "equip": [
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Abs (helper)",
   "Calves (helper)",
   "Glutes (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/sumo-squat-0.jpg",
   "ex-img/sumo-squat-1.jpg"
  ],
  "steps": [
   "Hold a dumbbell at the base with both hands and stand straight up. Move your legs so that they are wider than shoulder width apart from each other with your knees slightly bent.",
   "Your toes should be facing out. Note: Your arms should be stationary while performing the exercise. This is the starting position.",
   "Slowly bend the knees and lower your legs until your thighs are parallel to the floor. Make sure to inhale as this is the eccentric part of the exercise.",
   "Press mainly with the heel of the foot to bring the body back to the starting position while exhaling.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Wide stance, toes turned out",
   "Hold one dumbbell between your legs",
   "Knees push out over toes as you sit down"
  ],
  "mistakes": [
   "Knees caving in",
   "Leaning forward"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "ham-curl",
  "name": "Hamstring curl (machine)",
  "groups": [
   "legs"
  ],
  "equip": [
   "machine"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Hamstrings"
  ],
  "images": [
   "ex-img/ham-curl-0.jpg",
   "ex-img/ham-curl-1.jpg"
  ],
  "steps": [
   "Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves). Tip: Preferably use a leg curl machine that is angled as opposed to flat since an angled position is more favorable for hamstrings recruitment.",
   "Keeping the torso flat on the bench, ensure your legs are fully stretched and grab the side handles of the machine. Position your toes straight (or you can also use any of the other two stances described on the foot positioning section). This will be your starting position.",
   "As you exhale, curl your legs up as far as possible without lifting the upper legs from the pad. Once you hit the fully contracted position, hold it for a second.",
   "As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Hips pressed into the pad",
   "Curl heels towards your bum, pause",
   "Lower slowly for 3 seconds"
  ],
  "mistakes": [
   "Hips lifting off the pad",
   "Letting the weight drop"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "seated-ham-curl",
  "name": "Seated hamstring curl",
  "groups": [
   "legs"
  ],
  "equip": [
   "machine"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Hamstrings"
  ],
  "images": [
   "ex-img/seated-ham-curl-0.jpg",
   "ex-img/seated-ham-curl-1.jpg"
  ],
  "steps": [
   "Adjust the machine lever to fit your height and sit on the machine with your back against the back support pad.",
   "Place the back of lower leg on top of padded lever (just a few inches under the calves) and secure the lap pad against your thighs, just above the knees. Then grasp the side handles on the machine as you point your toes straight (or you can also use any of the other two stances) and ensure that the legs are fully straight right in front of you. This will be your starting position.",
   "As you exhale, pull the machine lever as far as possible to the back of your thighs by flexing at the knees. Keep your torso stationary at all times. Hold the contracted position for a second.",
   "Slowly return to the starting position as you breathe in.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Back against the pad, thigh pad snug",
   "Pull heels down and under",
   "Slow on the way back up"
  ],
  "mistakes": [
   "Rushing the return",
   "Lifting your bum off the seat"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "band-ham-curl",
  "name": "Band hamstring curl",
  "groups": [
   "legs"
  ],
  "equip": [
   "long band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Hamstrings"
  ],
  "images": [
   "ex-img/band-ham-curl-0.jpg",
   "ex-img/band-ham-curl-1.jpg"
  ],
  "steps": [
   "Secure a band close to the ground and place a bench a couple feet away from it.",
   "Seat yourself on the bench and secure the band behind your ankles, beginning with your legs straight. This will be your starting position.",
   "Flex the knees, bringing your feet towards the bench. You may need to lean back slightly to keep your feet from striking the floor.",
   "Pause at the completion of the movement, and then slowly return to the starting position."
  ],
  "cues": [
   "Anchor the band low in front of you",
   "Curl heel back under the seat",
   "Control it back out"
  ],
  "mistakes": [
   "Using a band so light there's no tension",
   "Leaning back to help"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "bw-squat",
  "name": "Bodyweight squat",
  "groups": [
   "legs",
   "glutes"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Glutes (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/bw-squat-0.jpg",
   "ex-img/bw-squat-1.jpg"
  ],
  "steps": [
   "Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.",
   "Begin the movement by flexing your knees and hips, sitting back with your hips.",
   "Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out."
  ],
  "cues": [
   "Feet shoulder-width",
   "Sit down and back, chest up",
   "Push the floor away"
  ],
  "mistakes": [
   "Knees caving in",
   "Heels lifting"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "lat-pulldown",
  "name": "Lat pull-down",
  "groups": [
   "back"
  ],
  "equip": [
   "cable",
   "machine"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Lats",
   "Biceps (helper)",
   "Mid back (helper)",
   "Shoulders (helper)"
  ],
  "images": [
   "ex-img/lat-pulldown-0.jpg",
   "ex-img/lat-pulldown-1.jpg"
  ],
  "steps": [
   "Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.",
   "Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.",
   "As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.",
   "As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the bar; therefore do not try to pull down the bar using the forearms.",
   "After a second at the contracted position squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.",
   "Repeat this motion for the prescribed amount of repetitions."
  ],
  "cues": [
   "Shoulders down away from ears before you pull",
   "Pull the bar to your upper chest, elbows down to your back pockets",
   "Lean back only slightly"
  ],
  "mistakes": [
   "Pulling behind the neck",
   "Swinging your body to move the weight"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "cable-row",
  "name": "Seated cable row",
  "groups": [
   "back"
  ],
  "equip": [
   "cable"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Mid back",
   "Biceps (helper)",
   "Lats (helper)",
   "Shoulders (helper)"
  ],
  "images": [
   "ex-img/cable-row-0.jpg",
   "ex-img/cable-row-1.jpg"
  ],
  "steps": [
   "For this exercise you will need access to a low pulley row machine with a V-bar. Note: The V-bar will enable you to have a neutral grip where the palms of your hands face each other. To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked.",
   "Lean over as you keep the natural alignment of your back and grab the V-bar handles.",
   "With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise.",
   "Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Sit tall, chest proud, slight bend in knees",
   "Pull elbows back past your ribs, squeeze shoulder blades",
   "Let arms straighten slowly without rounding"
  ],
  "mistakes": [
   "Rocking back and forth",
   "Shrugging shoulders up"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "face-pull",
  "name": "Face pull",
  "groups": [
   "back",
   "shoulders"
  ],
  "equip": [
   "cable",
   "long band"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Shoulders",
   "Mid back (helper)"
  ],
  "images": [
   "ex-img/face-pull-0.jpg",
   "ex-img/face-pull-1.jpg"
  ],
  "steps": [
   "Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground."
  ],
  "cues": [
   "Rope at face height, thumbs pointing back",
   "Pull towards your eyes, elbows high and wide",
   "Squeeze between your shoulder blades"
  ],
  "mistakes": [
   "Going too heavy and leaning back",
   "Elbows dropping low"
  ],
  "source": "free-exercise-db",
  "where": "both"
 },
 {
  "id": "db-row",
  "name": "Single-arm dumbbell row",
  "groups": [
   "back"
  ],
  "equip": [
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Mid back",
   "Biceps (helper)",
   "Lats (helper)",
   "Shoulders (helper)"
  ],
  "images": [
   "ex-img/db-row-0.jpg",
   "ex-img/db-row-1.jpg"
  ],
  "steps": [
   "Choose a flat bench and place a dumbbell on each side of it.",
   "Place the right leg on top of the end of the bench, bend your torso forward from the waist until your upper body is parallel to the floor, and place your right hand on the other end of the bench for support.",
   "Use the left hand to pick up the dumbbell on the floor and hold the weight while keeping your lower back straight. The palm of the hand should be facing your torso. This will be your starting position.",
   "Pull the resistance straight up to the side of your chest, keeping your upper arm close to your side and keeping the torso stationary. Breathe out as you perform this step. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. Also, make sure that the force is performed with the back muscles and not the arms. Finally, the upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the dumbbell; therefore do not try to pull the dumbbell up using the forearms.",
   "Lower the resistance straight down to the starting position. Breathe in as you perform this step.",
   "Repeat the movement for the specified amount of repetitions.",
   "Switch sides and repeat again with the other arm."
  ],
  "cues": [
   "Hand and knee on a bench, flat back",
   "Pull the dumbbell to your hip, not your chest",
   "Lower slowly, feel the stretch"
  ],
  "mistakes": [
   "Twisting your body to lift",
   "Shrugging the shoulder up to the ear"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "straight-arm-pulldown",
  "name": "Straight-arm pulldown",
  "groups": [
   "back"
  ],
  "equip": [
   "cable"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": true,
  "muscles": [
   "Lats"
  ],
  "images": [
   "ex-img/straight-arm-pulldown-0.jpg",
   "ex-img/straight-arm-pulldown-1.jpg"
  ],
  "steps": [
   "You will start by grabbing the wide bar from the top pulley of a pulldown machine and using a wider than shoulder-width pronated (palms down) grip. Step backwards two feet or so.",
   "Bend your torso forward at the waist by around 30-degrees with your arms fully extended in front of you and a slight bend at the elbows. If your arms are not fully extended then you need to step a bit more backwards until they are. Once your arms are fully extended and your torso is slightly bent at the waist, tighten the lats and then you are ready to begin.",
   "While keeping the arms straight, pull the bar down by contracting the lats until your hands are next to the side of the thighs. Breathe out as you perform this step.",
   "While keeping the arms straight, go back to the starting position while breathing in.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Arms nearly straight, soft elbows",
   "Sweep the bar down to your thighs",
   "Ribs down, don't arch"
  ],
  "mistakes": [
   "Bending elbows into a pushdown",
   "Arching the lower back"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "reverse-fly",
  "name": "Reverse fly",
  "groups": [
   "back",
   "shoulders"
  ],
  "equip": [
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Shoulders"
  ],
  "images": [
   "ex-img/reverse-fly-0.jpg",
   "ex-img/reverse-fly-1.jpg"
  ],
  "steps": [
   "To begin, lie down on an incline bench with the chest and stomach pressing against the incline. Have the dumbbells in each hand with the palms facing each other (neutral grip).",
   "Extend the arms in front of you so that they are perpendicular to the angle of the bench. The legs should be stationary while applying pressure with the ball of your toes. This is the starting position.",
   "Maintaining the slight bend of the elbows, move the weights out and away from each other (to the side) in an arc motion while exhaling. Tip: Try to squeeze your shoulder blades together to get the best results from this exercise.",
   "The arms should be elevated until they are parallel to the floor.",
   "Feel the contraction and slowly lower the weights back down to the starting position while inhaling.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Hinge forward, flat back, light dumbbells",
   "Open arms out wide like wings",
   "Squeeze shoulder blades together"
  ],
  "mistakes": [
   "Going too heavy",
   "Swinging the weights"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "rear-delt-fly",
  "name": "Cable rear delt fly",
  "groups": [
   "back",
   "shoulders"
  ],
  "equip": [
   "cable"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Shoulders"
  ],
  "images": [
   "ex-img/rear-delt-fly-0.jpg",
   "ex-img/rear-delt-fly-1.jpg"
  ],
  "steps": [
   "Adjust the pulleys to the appropriate height and adjust the weight. The pulleys should be above your head.",
   "Grab the left pulley with your right hand and the right pulley with your left hand, crossing them in front of you. This will be your starting position.",
   "Initiate the movement by moving your arms back and outward, keeping your arms straight as you execute the movement.",
   "Pause at the end of the motion before returning the handles to the start position."
  ],
  "cues": [
   "Cross the cables, arms at shoulder height",
   "Pull out wide with soft elbows",
   "Slow on the way back"
  ],
  "mistakes": [
   "Shrugging",
   "Too much weight"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "band-pull-apart",
  "name": "Band pull-apart",
  "groups": [
   "back",
   "shoulders"
  ],
  "equip": [
   "long band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Shoulders",
   "Mid back (helper)",
   "Traps (helper)"
  ],
  "images": [
   "ex-img/band-pull-apart-0.jpg",
   "ex-img/band-pull-apart-1.jpg"
  ],
  "steps": [
   "Begin with your arms extended straight out in front of you, holding the band with both hands.",
   "Initiate the movement by performing a reverse fly motion, moving your hands out laterally to your sides.",
   "Keep your elbows extended as you perform the movement, bringing the band to your chest. Ensure that you keep your shoulders back during the exercise.",
   "Pause as you complete the movement, returning to the starting position under control."
  ],
  "cues": [
   "Arms straight out in front at shoulder height",
   "Pull the band apart until it touches your chest",
   "Shoulders down, squeeze shoulder blades"
  ],
  "mistakes": [
   "Shrugging the shoulders up",
   "Bending the elbows a lot"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "band-row",
  "name": "Band row",
  "groups": [
   "back"
  ],
  "equip": [
   "long band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Back"
  ],
  "images": [],
  "steps": [
   "Sit tall with legs out straight and loop a long band around your feet (or anchor it to a door at chest height).",
   "Hold the ends with arms straight, palms facing each other.",
   "Pull your elbows back past your ribs, squeezing your shoulder blades together.",
   "Slowly let your arms straighten again."
  ],
  "cues": [
   "Sit tall, chest proud",
   "Elbows back, squeeze shoulder blades",
   "Slow on the way back"
  ],
  "mistakes": [
   "Leaning back to help",
   "Shrugging up to the ears"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "back-extension",
  "name": "Back extension (45 degree)",
  "groups": [
   "back",
   "glutes"
  ],
  "equip": [
   "machine"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Lower back",
   "Glutes (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/back-extension-0.jpg",
   "ex-img/back-extension-1.jpg"
  ],
  "steps": [
   "Lie face down on a hyperextension bench, tucking your ankles securely under the footpads.",
   "Adjust the upper pad if possible so your upper thighs lie flat across the wide pad, leaving enough room for you to bend at the waist without any restriction.",
   "With your body straight, cross your arms in front of you (my preference) or behind your head. This will be your starting position. Tip: You can also hold a weight plate for extra resistance in front of you under your crossed arms.",
   "Start bending forward slowly at the waist as far as you can while keeping your back flat. Inhale as you perform this movement. Keep moving forward until you feel a nice stretch on the hamstrings and you can no longer keep going without a rounding of the back. Tip: Never round the back as you perform this exercise. Also, some people can go farther than others. The key thing is that you go as far as your body allows you to without rounding the back.",
   "Slowly raise your torso back to the initial position as you inhale. Tip: Avoid the temptation to arch your back past a straight line. Also, do not swing the torso at any time in order to protect the back from injury.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Pad just below your hip bones",
   "Round down slowly, then lift by squeezing glutes",
   "Stop when your body is in a straight line"
  ],
  "mistakes": [
   "Over-arching at the top",
   "Swinging up fast"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "superman",
  "name": "Superman",
  "groups": [
   "back"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Lower back",
   "Glutes (helper)",
   "Hamstrings (helper)"
  ],
  "images": [
   "ex-img/superman-0.jpg",
   "ex-img/superman-1.jpg"
  ],
  "steps": [
   "To begin, lie straight and face down on the floor or exercise mat. Your arms should be fully extended in front of you. This is the starting position.",
   "Simultaneously raise your arms, legs, and chest off of the floor and hold this contraction for 2 seconds. Tip: Squeeze your lower back to get the best results from this exercise. Remember to exhale during this movement. Note: When holding the contracted position, you should look like superman when he is flying.",
   "Slowly begin to lower your arms, legs and chest back down to the starting position while inhaling.",
   "Repeat for the recommended amount of repetitions prescribed in your program."
  ],
  "cues": [
   "Lie face down, arms forward",
   "Lift arms and legs a few centimetres",
   "Look at the floor, hold 2 seconds"
  ],
  "mistakes": [
   "Cranking the neck up",
   "Lifting so high the lower back pinches"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "tricep-pushdown",
  "name": "Cable tricep pushdown",
  "groups": [
   "triceps"
  ],
  "equip": [
   "cable"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Triceps"
  ],
  "images": [
   "ex-img/tricep-pushdown-0.jpg",
   "ex-img/tricep-pushdown-1.jpg"
  ],
  "steps": [
   "Attach a rope attachment to a high pulley and grab with a neutral grip (palms facing each other).",
   "Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the rope with the palms facing each other. This is your starting position.",
   "Using the triceps, bring the rope down as you bring each side of the rope to the side of your thighs. At the end of the movement the arms are fully extended and perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.",
   "After holding for a second, at the contracted position, bring the rope slowly up to the starting point. Breathe in as you perform this step.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Elbows pinned to your sides",
   "Push down until arms are straight, spread the rope at the bottom",
   "Only your forearms move"
  ],
  "mistakes": [
   "Elbows drifting forward",
   "Leaning over the bar to push with bodyweight"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "tricep-kickback",
  "name": "Single-arm tricep kickback (cable or dumbbell)",
  "groups": [
   "triceps"
  ],
  "equip": [
   "cable",
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Triceps"
  ],
  "images": [
   "ex-img/tricep-kickback-0.jpg",
   "ex-img/tricep-kickback-1.jpg"
  ],
  "steps": [
   "Start with a dumbbell in each hand and your palms facing your torso. Keep your back straight with a slight bend in the knees and bend forward at the waist. Your torso should be almost parallel to the floor. Make sure to keep your head up. Your upper arms should be close to your torso and parallel to the floor. Your forearms should be pointed towards the floor as you hold the weights. There should be a 90-degree angle formed between your forearm and upper arm. This is your starting position.",
   "Now, while keeping your upper arms stationary, exhale and use your triceps to lift the weights until the arm is fully extended. Focus on moving the forearm.",
   "After a brief pause at the top contraction, inhale and slowly lower the dumbbells back down to the starting position.",
   "Repeat the movement for the prescribed amount of repetitions."
  ],
  "cues": [
   "Hinge forward, upper arm parallel to the floor",
   "Straighten the arm behind you and squeeze",
   "Upper arm stays still the whole time"
  ],
  "mistakes": [
   "Swinging the upper arm",
   "Going too heavy so form breaks"
  ],
  "source": "free-exercise-db",
  "where": "both"
 },
 {
  "id": "overhead-tricep",
  "name": "Overhead cable tricep extension",
  "groups": [
   "triceps"
  ],
  "equip": [
   "cable"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": true,
  "muscles": [
   "Triceps"
  ],
  "images": [
   "ex-img/overhead-tricep-0.jpg",
   "ex-img/overhead-tricep-1.jpg"
  ],
  "steps": [
   "Attach a rope to the bottom pulley of the pulley machine.",
   "Grasping the rope with both hands, extend your arms with your hands directly above your head using a neutral grip (palms facing each other). Your elbows should be in close to your head and the arms should be perpendicular to the floor with the knuckles aimed at the ceiling. This will be your starting position.",
   "Slowly lower the rope behind your head as you hold the upper arms stationary. Inhale as you perform this movement and pause when your triceps are fully stretched.",
   "Return to the starting position by flexing your triceps as you breathe out.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Face away from the cable, rope behind your head",
   "Elbows point forward and stay close",
   "Straighten arms overhead, stretch slowly back"
  ],
  "mistakes": [
   "Elbows flaring out wide",
   "Arching the lower back"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "db-overhead-tricep",
  "name": "Dumbbell overhead tricep extension",
  "groups": [
   "triceps"
  ],
  "equip": [
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": true,
  "muscles": [
   "Triceps"
  ],
  "images": [
   "ex-img/db-overhead-tricep-0.jpg",
   "ex-img/db-overhead-tricep-1.jpg"
  ],
  "steps": [
   "Grab a dumbbell and either sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs or stand up straight.",
   "Clean the dumbbell up to bring it to shoulder height and then extend the arm over your head so that the whole arm is perpendicular to the floor and next to your head. The dumbbell should be on top of you. The other hand can be kept fully extended to the side, by the waist, supporting the upper arm that has the dumbbell or grabbing a fixed surface.",
   "Rotate the wrist so that the palm of your hand is facing forward and the pinkie is facing the ceiling. This will be your starting position.",
   "Slowly lower the dumbbell behind your head as you hold the upper arm stationary. Inhale as you perform this movement and pause when your triceps are fully stretched.",
   "Return to the starting position by flexing your triceps as you breathe out. Tip: It is imperative that only the forearm moves. The upper arm should remain at all times stationary next to your head.",
   "Repeat for the recommended amount of repetitions and switch arms."
  ],
  "cues": [
   "Sit tall, dumbbell overhead",
   "Lower behind your head, elbow points up",
   "Straighten without moving the upper arm"
  ],
  "mistakes": [
   "Elbow drifting out",
   "Going too heavy"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "band-pushdown",
  "name": "Band tricep pushdown",
  "groups": [
   "triceps"
  ],
  "equip": [
   "long band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": true,
  "muscles": [
   "Triceps"
  ],
  "images": [],
  "steps": [
   "Loop a long band over a door top or high anchor and hold the ends at chest height.",
   "Pin your elbows to your sides.",
   "Push down until your arms are straight and squeeze the backs of your arms.",
   "Let your hands come back up slowly to chest height."
  ],
  "cues": [
   "Elbows glued to your sides",
   "Straighten fully and squeeze",
   "Slow on the way up"
  ],
  "mistakes": [
   "Elbows moving forward",
   "Leaning into it"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "bench-dips",
  "name": "Bench dips",
  "groups": [
   "triceps"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": true,
  "muscles": [
   "Triceps",
   "Chest (helper)",
   "Shoulders (helper)"
  ],
  "images": [
   "ex-img/bench-dips-0.jpg",
   "ex-img/bench-dips-1.jpg"
  ],
  "steps": [
   "For this exercise you will need to place a bench behind your back. With the bench perpendicular to your body, and while looking away from it, hold on to the bench on its edge with the hands fully extended, separated at shoulder width. The legs will be extended forward, bent at the waist and perpendicular to your torso. This will be your starting position.",
   "Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down.",
   "Using your triceps to bring your torso up again, lift yourself back to the starting position.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Hands on the bench edge, fingers forward",
   "Bend elbows straight back, not out",
   "Only go down to about 90 degrees"
  ],
  "mistakes": [
   "Going too deep, which strains the shoulders",
   "Shrugging up to the ears"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "close-pushup",
  "name": "Close-grip push-up (knees ok)",
  "groups": [
   "triceps"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": true,
  "muscles": [
   "Triceps",
   "Chest (helper)",
   "Shoulders (helper)"
  ],
  "images": [
   "ex-img/close-pushup-0.jpg",
   "ex-img/close-pushup-1.jpg"
  ],
  "steps": [
   "Lie on the floor face down and place your hands closer than shoulder width for a close hand position. Make sure that you are holding your torso up at arms' length.",
   "Lower yourself until your chest almost touches the floor as you inhale.",
   "Using your triceps and some of your pectoral muscles, press your upper body back up to the starting position and squeeze your chest. Breathe out as you perform this step.",
   "After a second pause at the contracted position, repeat the movement for the prescribed amount of repetitions."
  ],
  "cues": [
   "Hands under shoulders, elbows brush your sides",
   "Body in one straight line (knees down is fine)",
   "Push the floor away"
  ],
  "mistakes": [
   "Hips sagging",
   "Elbows flaring out"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "pallof",
  "name": "Pallof press",
  "groups": [
   "core"
  ],
  "equip": [
   "cable",
   "long band"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": false,
  "muscles": [
   "Abs",
   "Chest (helper)",
   "Shoulders (helper)",
   "Triceps (helper)"
  ],
  "images": [
   "ex-img/pallof-0.jpg",
   "ex-img/pallof-1.jpg"
  ],
  "steps": [
   "Connect a standard handle to a tower, and—if possible—position the cable to shoulder height. If not, a low pulley will suffice.",
   "With your side to the cable, grab the handle with both hands and step away from the tower. You should be approximately arm's length away from the pulley, with the tension of the weight on the cable.",
   "With your feet positioned hip-width apart and knees slightly bent, hold the cable to the middle of your chest. This will be your starting position.",
   "Press the cable away from your chest, fully extending both arms. You core should be tight and engaged.",
   "Hold the repetition for several seconds before returning to the starting position.",
   "At the conclusion of the set, repeat facing the other direction."
  ],
  "cues": [
   "Stand side-on to the cable, feet hip-width",
   "Press hands straight out from your chest and hold 2 seconds",
   "Don't let the cable twist you, ribs down"
  ],
  "mistakes": [
   "Rotating towards the cable",
   "Holding your breath"
  ],
  "source": "free-exercise-db",
  "where": "both"
 },
 {
  "id": "dead-bug",
  "name": "Dead bug",
  "groups": [
   "core"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": false,
  "muscles": [
   "Abs"
  ],
  "images": [
   "ex-img/dead-bug-0.jpg",
   "ex-img/dead-bug-1.jpg"
  ],
  "steps": [
   "Begin lying on your back with your hands extended above you toward the ceiling.",
   "Bring your feet, knees, and hips up to 90 degrees.",
   "Exhale hard to bring your ribcage down and flatten your back onto the floor, rotating your pelvis up and squeezing your glutes. Hold this position throughout the movement. This will be your starting position.",
   "Initiate the exercise by extending one leg, straightening the knee and hip to bring the leg just above the ground.",
   "Maintain the position of your lumbar and pelvis as you perform the movement, as your back is going to want to arch.",
   "Stay tight and return the working leg to the starting position.",
   "Repeat on the opposite side, alternating until the set is complete."
  ],
  "cues": [
   "Lower back gently pressed into the floor",
   "Opposite arm and leg reach away slowly",
   "Breathe out as you reach"
  ],
  "mistakes": [
   "Lower back lifting off the floor",
   "Moving too fast"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "plank",
  "name": "Plank",
  "groups": [
   "core"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "sec",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Abs"
  ],
  "images": [
   "ex-img/plank-0.jpg",
   "ex-img/plank-1.jpg"
  ],
  "steps": [
   "Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.",
   "Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised."
  ],
  "cues": [
   "Elbows under shoulders",
   "Squeeze glutes, ribs down, body in a straight line",
   "Breathe normally"
  ],
  "mistakes": [
   "Hips sagging or piking up",
   "Holding your breath"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "side-plank",
  "name": "Side plank",
  "groups": [
   "core"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "sec",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Abs",
   "Shoulders (helper)"
  ],
  "images": [
   "ex-img/side-plank-0.jpg",
   "ex-img/side-plank-1.jpg"
  ],
  "steps": [],
  "cues": [
   "Elbow under shoulder, hips stacked",
   "Lift hips so your body is a straight line",
   "Knees down is a fine easier option"
  ],
  "mistakes": [
   "Hips sagging towards the floor",
   "Rolling forwards"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "hundred",
  "name": "The hundred (Pilates)",
  "groups": [
   "core"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "pumps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Core"
  ],
  "images": [],
  "steps": [
   "Lie on your back, knees bent up to tabletop (or legs straight up for harder).",
   "Lift your head and shoulders, arms long by your sides just off the floor.",
   "Pump your arms up and down in small movements: breathe in for 5 pumps, out for 5 pumps.",
   "Continue to 100 pumps, or as many as you can with good form."
  ],
  "cues": [
   "Chin slightly tucked, look at your tummy",
   "Lower back stays heavy on the mat",
   "Small, quick arm pumps with steady breathing"
  ],
  "mistakes": [
   "Straining the neck",
   "Lower back arching off the mat"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "single-leg-stretch",
  "name": "Single-leg stretch (Pilates)",
  "groups": [
   "core"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Core"
  ],
  "images": [],
  "steps": [
   "Lie on your back, lift head and shoulders, both knees in to tabletop.",
   "Hug one knee in while the other leg reaches long at about 45 degrees.",
   "Switch legs smoothly, like slow bicycle pedalling.",
   "Count one rep for each side."
  ],
  "cues": [
   "Head and shoulders stay lifted",
   "Lower back pressed down",
   "Reach the long leg away, toes pointed"
  ],
  "mistakes": [
   "Leg too low so the back arches",
   "Pulling on the neck"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "bird-dog",
  "name": "Bird dog",
  "groups": [
   "core",
   "back"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": false,
  "muscles": [
   "Core",
   "Back"
  ],
  "images": [],
  "steps": [
   "Start on all fours, hands under shoulders, knees under hips.",
   "Reach one arm forward and the opposite leg back until both are level with your body.",
   "Hold for 2 seconds, keeping your hips square.",
   "Return slowly and switch sides."
  ],
  "cues": [
   "Back flat like a table, hips square",
   "Reach long, not high",
   "Move slowly and steadily"
  ],
  "mistakes": [
   "Hips rotating open",
   "Arching the lower back"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "reverse-crunch",
  "name": "Reverse crunch",
  "groups": [
   "core"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Abs"
  ],
  "images": [
   "ex-img/reverse-crunch-0.jpg",
   "ex-img/reverse-crunch-1.jpg"
  ],
  "steps": [
   "Lie down on the floor with your legs fully extended and arms to the side of your torso with the palms on the floor. Your arms should be stationary for the entire exercise.",
   "Move your legs up so that your thighs are perpendicular to the floor and feet are together and parallel to the floor. This is the starting position.",
   "While inhaling, move your legs towards the torso as you roll your pelvis backwards and you raise your hips off the floor. At the end of this movement your knees will be touching your chest.",
   "Hold the contraction for a second and move your legs back to the starting position while exhaling.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Knees bent, curl hips off the floor",
   "Use your lower tummy, not momentum",
   "Lower slowly"
  ],
  "mistakes": [
   "Swinging the legs",
   "Pulling on the neck"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "cable-crunch",
  "name": "Cable crunch",
  "groups": [
   "core"
  ],
  "equip": [
   "cable"
  ],
  "unit": "kg",
  "step": 2.5,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Abs"
  ],
  "images": [
   "ex-img/cable-crunch-0.jpg",
   "ex-img/cable-crunch-1.jpg"
  ],
  "steps": [
   "Kneel below a high pulley that contains a rope attachment.",
   "Grasp cable rope attachment and lower the rope until your hands are placed next to your face.",
   "Flex your hips slightly and allow the weight to hyperextend the lower back. This will be your starting position.",
   "With the hips stationary, flex the waist as you contract the abs so that the elbows travel towards the middle of the thighs. Exhale as you perform this portion of the movement and hold the contraction for a second.",
   "Slowly return to the starting position as you inhale. Tip: Make sure that you keep constant tension on the abs throughout the movement. Also, do not choose a weight so heavy that the lower back handles the brunt of the work.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Kneel facing the cable, rope by your head",
   "Curl ribs towards hips",
   "Hips stay still"
  ],
  "mistakes": [
   "Sitting back with the hips",
   "Pulling with the arms"
  ],
  "source": "free-exercise-db",
  "where": "gym"
 },
 {
  "id": "russian-twist",
  "name": "Russian twist",
  "groups": [
   "core"
  ],
  "equip": [
   "bodyweight",
   "dumbbells"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Abs",
   "Lower back (helper)"
  ],
  "images": [
   "ex-img/russian-twist-0.jpg",
   "ex-img/russian-twist-1.jpg"
  ],
  "steps": [
   "Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.",
   "Elevate your upper body so that it creates an imaginary V-shape with your thighs. Your arms should be fully extended in front of you perpendicular to your torso and with the hands clasped. This is the starting position.",
   "Twist your torso to the right side until your arms are parallel with the floor while breathing out.",
   "Hold the contraction for a second and move back to the starting position while breathing out. Now move to the opposite side performing the same techniques you applied to the right side.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Sit tall, lean back slightly",
   "Rotate from your ribs, not just your arms",
   "Feet down is easier and fine"
  ],
  "mistakes": [
   "Rounding the lower back",
   "Going too fast"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "mountain-climbers",
  "name": "Mountain climbers",
  "groups": [
   "core"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Quads",
   "Chest (helper)",
   "Hamstrings (helper)",
   "Shoulders (helper)"
  ],
  "images": [
   "ex-img/mountain-climbers-0.jpg",
   "ex-img/mountain-climbers-1.jpg"
  ],
  "steps": [
   "Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.",
   "Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds."
  ],
  "cues": [
   "Hands under shoulders, plank position",
   "Drive knees in one at a time",
   "Keep hips low and steady"
  ],
  "mistakes": [
   "Hips piking up",
   "Bouncing"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "lateral-raise",
  "name": "Lateral raise",
  "groups": [
   "shoulders"
  ],
  "equip": [
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": true,
  "muscles": [
   "Shoulders"
  ],
  "images": [
   "ex-img/lateral-raise-0.jpg",
   "ex-img/lateral-raise-1.jpg"
  ],
  "steps": [
   "Pick a couple of dumbbells and stand with a straight torso and the dumbbells by your side at arms length with the palms of the hand facing you. This will be your starting position.",
   "While maintaining the torso in a stationary position (no swinging), lift the dumbbells to your side with a slight bend on the elbow and the hands slightly tilted forward as if pouring water in a glass. Continue to go up until you arms are parallel to the floor. Exhale as you execute this movement and pause for a second at the top.",
   "Lower the dumbbells back down slowly to the starting position as you inhale.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Light dumbbells, soft elbows",
   "Raise out to the side to shoulder height",
   "Lead with elbows, lower slowly"
  ],
  "mistakes": [
   "Shrugging up",
   "Swinging the weights"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "band-lateral-raise",
  "name": "Band lateral raise",
  "groups": [
   "shoulders"
  ],
  "equip": [
   "long band"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": true,
  "muscles": [
   "Shoulders"
  ],
  "images": [
   "ex-img/band-lateral-raise-0.jpg",
   "ex-img/band-lateral-raise-1.jpg"
  ],
  "steps": [
   "To begin, stand on an exercise band so that tension begins at arm's length. Grasp the handles using a pronated (palms facing your thighs) grip that is slightly less than shoulder width. The handles should be resting on the sides of your thighs. Your arms should be extended with a slight bend at the elbows and your back should be straight. This will be your starting position.",
   "Use your side shoulders to lift the handles to the sides as you exhale. Continue to lift the handles until they are slightly above parallel. Tip: As you lift the handles, slightly tilt the hand as if you were pouring water and keep your arms extended. Also, keep your torso stationary and pause for a second at the top of the movement.",
   "Lower the handles back down slowly to the starting position. Inhale as you perform this portion of the movement.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Stand on the band",
   "Raise out to shoulder height",
   "Control on the way down"
  ],
  "mistakes": [
   "Shrugging",
   "Leaning to the side"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "db-shoulder-press",
  "name": "Dumbbell shoulder press",
  "groups": [
   "shoulders",
   "triceps"
  ],
  "equip": [
   "dumbbells"
  ],
  "unit": "kg",
  "step": 1,
  "repsLabel": "reps",
  "backFriendly": false,
  "shoulderFriendly": false,
  "upper": true,
  "muscles": [
   "Shoulders",
   "Triceps (helper)"
  ],
  "images": [
   "ex-img/db-shoulder-press-0.jpg",
   "ex-img/db-shoulder-press-1.jpg"
  ],
  "steps": [
   "While holding a dumbbell in each hand, sit on a military press bench or utility bench that has back support. Place the dumbbells upright on top of your thighs.",
   "Now raise the dumbbells to shoulder height one at a time using your thighs to help propel them up into position.",
   "Make sure to rotate your wrists so that the palms of your hands are facing forward. This is your starting position.",
   "Now, exhale and push the dumbbells upward until they touch at the top.",
   "Then, after a brief pause at the top contracted position, slowly lower the weights back down to the starting position while inhaling.",
   "Repeat for the recommended amount of repetitions."
  ],
  "cues": [
   "Sit tall, back supported",
   "Press up and slightly in, don't lock elbows hard",
   "Ribs down, no arching"
  ],
  "mistakes": [
   "Arching the back",
   "Going too heavy too soon"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "childs-pose",
  "name": "Child's pose",
  "groups": [
   "mobility"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "sec",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": false,
  "muscles": [
   "Lower back",
   "Glutes (helper)",
   "Mid back (helper)"
  ],
  "images": [
   "ex-img/childs-pose-0.jpg",
   "ex-img/childs-pose-1.jpg"
  ],
  "steps": [
   "Get on your hands and knees, walk your hands in front of you.",
   "Lower your buttocks down to sit on your heels. Let your arms drag along the floor as you sit back to stretch your entire spine.",
   "Once you settle onto your heels, bring your hands next to your feet and relax. \"breathe\" into your back. Rest your forehead on the floor. Avoid this position if you have knee problems."
  ],
  "cues": [
   "Knees wide, big toes together",
   "Sit hips back to heels",
   "Breathe slowly into your back"
  ],
  "mistakes": [
   "Forcing it",
   "Holding your breath"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "cat-cow",
  "name": "Cat-cow",
  "groups": [
   "mobility"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": false,
  "muscles": [
   "Lower back",
   "Mid back (helper)",
   "Traps (helper)"
  ],
  "images": [
   "ex-img/cat-cow-0.jpg",
   "ex-img/cat-cow-1.jpg"
  ],
  "steps": [
   "Position yourself on the floor on your hands and knees.",
   "Pull your belly in and round your spine, lower back, shoulders, and neck, letting your head drop.",
   "Hold for 15 seconds."
  ],
  "cues": [
   "On all fours",
   "Round up slowly, then let the belly drop",
   "Move with your breath"
  ],
  "mistakes": [
   "Rushing",
   "Forcing the end range"
  ],
  "source": "free-exercise-db",
  "where": "home"
 },
 {
  "id": "pigeon",
  "name": "Pigeon pose",
  "groups": [
   "mobility"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "sec",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Mobility"
  ],
  "images": [],
  "steps": [
   "From all fours, bring one knee forward behind your wrist, shin angled across.",
   "Slide the other leg straight back.",
   "Square your hips and lower your chest over the front leg as far as is comfortable.",
   "Hold and breathe, then switch sides. Use a cushion under the hip if needed."
  ],
  "cues": [
   "Hips square",
   "Ease in slowly",
   "Cushion under the hip is fine"
  ],
  "mistakes": [
   "Forcing the knee",
   "Twisting the hips"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "chin-tucks",
  "name": "Chin tucks",
  "groups": [
   "mobility"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "reps",
  "backFriendly": true,
  "shoulderFriendly": true,
  "upper": false,
  "muscles": [
   "Mobility"
  ],
  "images": [],
  "steps": [
   "Sit or stand tall looking straight ahead.",
   "Slide your chin straight back, making a double chin.",
   "Hold 3 seconds, then relax.",
   "Repeat 10 times."
  ],
  "cues": [
   "Slide straight back, don't nod down",
   "Keep eyes level",
   "Gentle, not forced"
  ],
  "mistakes": [
   "Tipping the head down",
   "Pushing too hard"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "doorway-stretch",
  "name": "Doorway chest stretch",
  "groups": [
   "mobility"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "sec",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Mobility"
  ],
  "images": [],
  "steps": [
   "Stand in a doorway with forearms on the frame, elbows at shoulder height.",
   "Step one foot through until you feel a stretch across your chest.",
   "Hold 30 seconds, breathing slowly.",
   "Repeat twice."
  ],
  "cues": [
   "Elbows at shoulder height",
   "Gentle stretch, no pain",
   "Ribs down, don't arch"
  ],
  "mistakes": [
   "Leaning too far",
   "Shrugging"
  ],
  "source": "Life Hub",
  "where": "home"
 },
 {
  "id": "towel-thoracic",
  "name": "Upper back over a rolled towel",
  "groups": [
   "mobility"
  ],
  "equip": [
   "bodyweight"
  ],
  "unit": "",
  "step": 0,
  "repsLabel": "sec",
  "backFriendly": true,
  "shoulderFriendly": false,
  "upper": false,
  "muscles": [
   "Mobility"
  ],
  "images": [],
  "steps": [
   "Roll up a bath towel and lie on your back with it across your upper back, under your shoulder blades.",
   "Support your head with your hands or a pillow.",
   "Let your upper back relax over the towel, arms out wide or overhead.",
   "Breathe slowly for 1-2 minutes. Move the towel up a little and repeat."
  ],
  "cues": [
   "Relax and breathe",
   "Support your head",
   "Keep the towel under the upper back, not the lower back"
  ],
  "mistakes": [
   "Placing it under the lower back",
   "Forcing the stretch"
  ],
  "source": "Life Hub",
  "where": "home"
 }
];
