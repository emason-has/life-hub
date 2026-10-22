# Life Hub

My personal tracker and planner. Works offline, saves everything on my phone,
no login, no paid services.

## What's in each file

| File | What it is |
| --- | --- |
| `index.html` | The page itself: the frame and the bottom tab bar. |
| `styles.css` | The look: colours, sizes, rounded cards. Colours are at the top. |
| `data.js` | **My plan content.** Workout templates (including Posture & arm care), goals, Tiimo times, starter recipes, staples, cleaning jobs. Edit words here to change the plan. |
| `exercises.js` + `ex-img/` | Exercise library and form photos (from the public domain free-exercise-db, github.com/yuhonas/free-exercise-db). Cues written for Life Hub. |
| `fitness.js` | Fitness tab: Plan my week, sessions, templates, exercise library. |
| `workout.js` | Workout mode in the gym: sets, rest timer, personal bests, history. |
| `progress.js` | Goals, on-track status, warnings, Bali projection, charts. |
| `app.js` | The core: saving, dates, customisable Today widgets, More, Settings, backup. |
| `house.js` | House (under More): jobs due this week, swipe to Later, 15-minute blitz. |
| `health.js` | Apple Health: the "Paste from Health" button and Shortcut setup guide. |
| `dump.js` | Brain dump (under More, optional Home widget): get thoughts out fast, sort them on Sunday, keep a done log. |
| `meals.js` | Everything for the Food tab: recipes, planner, Surprise me, shopping list. |
| `manifest.json` | Tells the iPhone this is an app (name, icon, colours). |
| `sw.js` | The offline helper. Keeps a copy of the app on the phone. |
| `*.png` | App icons. |

## Publish it free on GitHub Pages

1. Go to github.com, tap **+** (top right) then **New repository**.
2. Name it `life-hub`, choose **Public**, tick **Add a README**, tap **Create repository**.
3. On the new repo page tap **Add file** then **Upload files**.
4. Drag in every file from this `life-hub` folder (not the folder itself, the files inside it).
   Tap **Commit changes**.
5. Go to **Settings** then **Pages** (left menu). Under "Branch" pick `main` and `/ (root)`, tap **Save**.
6. Wait about 1-2 minutes. Your app is now at `https://YOUR-USERNAME.github.io/life-hub/`.

Public repo means people could see the app's code if they looked, but **not your data**.
Your data never leaves your phone.

## Add it to the iPhone home screen

1. Open the link above in **Safari** (it must be Safari).
2. Tap the **Share** button (square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**, then **Add**.
4. Open it from the new beach icon. It runs full screen, like a normal app.

Tip: always open it from the home screen icon. The home screen app keeps its own data,
separate from the Safari tab.

## Updating the app later

Upload the changed files to the repo the same way (they replace the old ones).
Also bump the version in `sw.js` (for example `life-hub-v3` to `life-hub-v4`) so the phone
grabs the new version. Close and reopen the app once or twice to see it.

## Backups

Settings, then **Export backup**, then **Save to Files** (iCloud Drive is a good spot).
To restore on a new phone: Settings, then **Import backup**, then pick the file.
The Home screen reminds you once a month.

## Updating on Netlify

The app now has a folder (`ex-img`) for exercise photos. Drag the whole unzipped
`life-hub` folder onto your site's Deploys page so the folder comes along.

## Exercise library

To add exercises, edit `life-hub-tools/build_library.py` and run it
(`python3 life-hub-tools/build_library.py`). It rebuilds `exercises.js` and downloads photos.
