# RepWeek

A personal workout log for one phone. Built from the RepWeek design canvas as a
static PWA: no server, no account, no sync. Every set you log is written to
IndexedDB on the device you logged it on and never leaves it.

## What it does

- **Log** — a session per routine, with the weight for each set pre-filled from
  what the progression rules suggest. Tick a set off, adjust weight in the
  lift's own increment, record reps and RIR. Each lift shows its rest time, its
  cue, and — when the day pairs it — the superset partner, with a tap to jump
  between the two.
- **Progression** — double progression driven by RIR. A set you finished with
  2+ reps in reserve earns the next weight jump; a set that ran you to RIR 0–1
  keeps its weight and asks for an extra rep instead. The tip card on the log
  screen spells out which sets go which way and why.
- **Progress** — estimated 1RM per lift with its change since last time, top
  set, session count, a top-set trend chart and the full session log.
- **Home** — what to train next (the routine you have left longest), sets and
  volume this week, and your week streak.
- **Bodyweight** — set yours in Profile and lifts marked as carrying it (pull-ups,
  push-ups, leg raises) count it as load, with the weight box recording what you
  add on top. Each session stores the bodyweight it was logged at, so gaining
  weight never rewrites old numbers. Timed holds are deliberately left unmarked,
  since bodyweight times seconds is not volume.
- **Profile** — the progression thresholds, your bodyweight, your routines and
  exercise library,
  backup export/restore, and a one-tap install of the training block. Routines
  are ordered lists where any entry can be linked to the next as a superset, so
  the same lift can be paired on one day and a straight set on another.

### The training block

`src/db/plan.ts` holds the lifting half of a 12-week BJJ hypertrophy block:
five routines, their exercises, starting sets and reps, a rest time and a
coaching cue per lift, and the A/B superset pairs. It seeds a fresh install and can be re-installed from Profile, which
matches exercises by name so existing history survives. Rep targets sit at the
bottom of each prescribed range so double progression climbs into it. Running,
BJJ, conditioning, mobility and nutrition are deliberately absent — the app
logs sets, and the rest belongs in the source document.

### How the estimated 1RM is calculated

Epley, applied to *reps to failure* — your logged reps plus the reps you left in
reserve. A set of 80kg × 8 at RIR 2 counts as 10 reps to failure and scores
about 107kg. A set with no RIR recorded is read as having been taken to failure,
which is the conservative reading. A true single is reported as itself rather
than extrapolated.

## Deploying it to your phone

1. Create a GitHub repo and push this directory to `main`. The repo can be
   private — only the built site gets published.
2. In the repo: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. Push. The workflow in `.github/workflows/deploy.yml` builds and publishes to
   `https://<user>.github.io/<repo>/`. It sets the base path from the repo name,
   so renaming the repo keeps working.
4. Open that URL in Safari on your iPhone → Share → **Add to Home Screen**.
5. Open it once from the home screen while online. The service worker caches the
   whole app, so it launches and works with no signal at all after that.

If you name the repo something other than `workout-tracker`, nothing needs
changing — only local `npm run dev` uses the default base path.

## Your data

It lives in this one browser profile on this one phone. That is what makes it
private, and it is also the whole risk: **a wiped or lost phone is a wiped log.**

- Export a backup now and then from **Profile → Backup → Export**. On iOS that
  opens the share sheet, so you can drop the JSON into Files or iCloud Drive.
- **Restore** reads that file back and replaces everything on the device.
- The app asks the browser for persistent storage on first load. Data for an app
  added to the home screen is not subject to Safari's 7-day eviction of unused
  site data, but the backup is still the only real safety net.

Nothing is transmitted anywhere. The only network request the app ever makes is
fetching its own files, and after the first load it does not even do that.

## Working on it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # the 1RM, progression, streak and date logic
npm run build      # typecheck + production build into dist/
npm run icons      # regenerate the PNG icons from scripts/make-icons.mjs
```

### Layout

```
src/
  db/          schema, IndexedDB access, plan.ts (the training block)
  lib/         the maths: stats (1RM, volume, trends), progression, dates
  state/       one context holding everything, persisted on every change
  components/  set card, chart, nav, sheet, number input
  screens/     home, log, history, per-exercise progress, session, profile
test/          node:test coverage of everything in lib/
```

The design tokens from the canvas (the near-black ground, the lime accent,
Space Grotesk / Work Sans / IBM Plex Mono) live at the top of `src/styles.css`.
Fonts are bundled rather than fetched from Google so the app renders correctly
offline.
