import type { Exercise, Routine } from './schema';
import { newId, tidyEntries } from './schema';

/**
 * The lifting half of the 12-week BJJ hypertrophy block.
 *
 * Only what the app can actually log lives here. The running build, BJJ
 * sessions, air bike intervals, mobility, sauna, nutrition and the
 * autoregulation table stay in the source document — this holds sets, reps
 * and load.
 *
 * Rep targets are the BOTTOM of each prescribed range, so double progression
 * climbs into the range rather than starting at its ceiling. Set and rep
 * numbers here are only the starting point: after the first session the app
 * carries forward what you actually did.
 */

export interface PlanExercise {
  name: string;
  muscleGroup: string;
  increment: number;
  defaultSets: number;
  defaultReps: number;
  restSeconds: number;
  cue?: string;
  bodyweightLoad?: boolean;
}

export interface PlanEntry {
  name: string;
  supersetWithNext?: boolean;
}

export interface PlanRoutine {
  name: string;
  /** In the order performed. */
  exercises: PlanEntry[];
}

const one = (name: string): PlanEntry => ({ name });

/** The A/B pairs: no rest between the two, rest once after the pair. */
const pair = (a: string, b: string): PlanEntry[] => [
  { name: a, supersetWithNext: true },
  { name: b },
];

const EXERCISES: PlanExercise[] = [
  // --- Monday, lower ----------------------------------------------------
  {
    name: 'Broad Jump',
    muscleGroup: 'Power',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 3,
    restSeconds: 90,
    cue: 'Primer only. Stop while they are still crisp.',
  },
  {
    name: 'Pendulum Squat',
    muscleGroup: 'Quads',
    increment: 5,
    defaultSets: 9,
    defaultReps: 3,
    restSeconds: 180,
    cue: '3 clusters of 3+3+3 · RPE 7–8 (RIR 2–3) · 20 s inside a cluster, 3 min between',
  },
  {
    name: 'Hip Thrust',
    muscleGroup: 'Glutes',
    increment: 5,
    defaultSets: 3,
    defaultReps: 8,
    restSeconds: 120,
    cue: '1–2 s pause at lockout. Pause it, do not chase load.',
  },
  {
    name: 'Leg Extension',
    muscleGroup: 'Quads',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 90,
    cue: 'Lengthened partials on the final set.',
  },
  {
    name: 'Seated Leg Curl',
    muscleGroup: 'Hamstrings',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 10,
    restSeconds: 90,
  },
  {
    name: 'Adductor Machine',
    muscleGroup: 'Adductors',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 90,
    cue: 'Near-zero recovery cost and the most grappling-relevant thing here. Do not skip.',
  },
  {
    name: 'Hanging Leg Raise',
    muscleGroup: 'Trunk',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
    restSeconds: 75,
    bodyweightLoad: true,
  },
  {
    name: 'Calf Raise',
    muscleGroup: 'Calves',
    increment: 5,
    defaultSets: 2,
    defaultReps: 12,
    restSeconds: 60,
  },
  {
    name: 'Tibialis Raise',
    muscleGroup: 'Tibialis',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 15,
    restSeconds: 60,
    cue: 'First thing to cut when a session runs long.',
  },
  {
    name: 'Dead Hang',
    muscleGroup: 'Grip',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 30,
    restSeconds: 60,
    cue: 'Seconds, not reps. Two-arm passive. This is your entire grip budget — nothing else.',
  },

  // --- Tuesday, isolation + the banded shoulder block --------------------
  {
    name: 'Cable Lateral Raise',
    muscleGroup: 'Side Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 75,
    cue: 'Last set to 0–1 RIR.',
  },
  {
    name: 'Cable Rear Delt Fly',
    muscleGroup: 'Rear Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 15,
    restSeconds: 75,
  },
  {
    name: 'Cable Curl',
    muscleGroup: 'Biceps',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 12,
    restSeconds: 60,
    cue: '2–3 RIR. Never to failure — the gi already taxes your elbows.',
  },
  {
    name: 'Band Pull-Apart',
    muscleGroup: 'Upper Back',
    increment: 1,
    defaultSets: 2,
    defaultReps: 15,
    restSeconds: 45,
  },
  {
    name: 'Banded External Rotation at 90°',
    muscleGroup: 'Rotator Cuff',
    increment: 1,
    defaultSets: 2,
    defaultReps: 15,
    restSeconds: 45,
    cue: 'Per side. Bands over cables here — light and controlled, insurance not training.',
  },
  {
    name: 'Banded Y-Raise',
    muscleGroup: 'Scapula',
    increment: 1,
    defaultSets: 2,
    defaultReps: 12,
    restSeconds: 45,
  },
  {
    name: 'Wrist Extensor Eccentrics',
    muscleGroup: 'Forearms',
    increment: 1,
    defaultSets: 3,
    defaultReps: 15,
    restSeconds: 60,
    cue: '3 s lowers, light dumbbell. Daily for 4–6 weeks if any elbow symptom appears.',
  },

  // --- Wednesday, upper -------------------------------------------------
  {
    name: 'Banded or Plyo Push-Up',
    muscleGroup: 'Power',
    increment: 1,
    defaultSets: 3,
    defaultReps: 5,
    restSeconds: 90,
    cue: 'Explosive. Primer only.',
    bodyweightLoad: true,
  },
  {
    name: 'Incline DB Press',
    muscleGroup: 'Chest',
    increment: 2,
    defaultSets: 9,
    defaultReps: 3,
    restSeconds: 180,
    cue: '3 clusters of 3+3+3 at 75–80% · 20 s inside a cluster, 3 min between',
  },
  {
    name: 'Weighted Pull-Up',
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 6,
    restSeconds: 150,
    cue: 'Neutral grip, straps. The weight box is what you hang on top.',
    bodyweightLoad: true,
  },
  {
    name: 'Flat Machine Press',
    muscleGroup: 'Chest',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
    restSeconds: 120,
  },
  {
    name: 'Seated Shoulder Press',
    muscleGroup: 'Shoulders',
    increment: 2,
    defaultSets: 2,
    defaultReps: 8,
    restSeconds: 120,
    cue: 'Stays at 2 sets — six chest sets already supply plenty of front delt.',
  },
  {
    name: 'Neutral-Grip Lat Pulldown',
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 4,
    defaultReps: 10,
    restSeconds: 90,
    cue: 'Straps. Full stretch at the top.',
  },
  {
    name: 'Cable Overhead Triceps Extension',
    muscleGroup: 'Triceps',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 10,
    restSeconds: 75,
    cue: 'Rope. No grinding at lockout.',
  },

  // --- Thursday, light isolation ---------------------------------------
  {
    name: 'Cable Fly',
    muscleGroup: 'Chest',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 90,
    cue: '1–2 RIR, first while fresh. Thursday stays under 40 min, no compounds, no failure.',
  },
  {
    name: 'Cable Triceps Pushdown',
    muscleGroup: 'Triceps',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 75,
    cue: '2 RIR.',
  },
  {
    name: 'Face Pull',
    muscleGroup: 'Rear Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 15,
    restSeconds: 75,
  },
  {
    name: 'Hammer Curl',
    muscleGroup: 'Biceps',
    increment: 2,
    defaultSets: 2,
    defaultReps: 12,
    restSeconds: 60,
    cue: '2–3 RIR. Neutral grip only — no supinated loading.',
  },
  {
    name: 'Eccentric Calf Raise',
    muscleGroup: 'Calves',
    increment: 5,
    defaultSets: 2,
    defaultReps: 12,
    restSeconds: 60,
    cue: 'Slow lowers.',
  },

  // --- Friday, hinge + volume -------------------------------------------
  {
    name: 'Trap Bar Deadlift',
    muscleGroup: 'Posterior Chain',
    increment: 5,
    defaultSets: 4,
    defaultReps: 5,
    restSeconds: 180,
    cue: 'RPE 8 (RIR 2). Straps. Never to failure.',
  },
  {
    name: 'Pendulum Split Squat',
    muscleGroup: 'Quads',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
    restSeconds: 120,
    cue: 'Per leg. RPE 7 (RIR 3).',
  },
  {
    name: 'T-Bar Row',
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 4,
    defaultReps: 8,
    restSeconds: 120,
    cue: 'Strict, controlled eccentric. Straps, neutral handle. Never before the hinge — and drop a set before touching the deadlift if your low back is stiff.',
  },
  {
    name: 'Flat DB Press',
    muscleGroup: 'Chest',
    increment: 2,
    defaultSets: 3,
    defaultReps: 8,
    restSeconds: 120,
  },
  {
    name: 'Half-Kneeling Landmine Rotation',
    muscleGroup: 'Obliques',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 10,
    restSeconds: 75,
    cue: 'Per side. Rotation matches hip escapes and sweeps better than side bends do.',
  },
  {
    name: 'Cable Crunch',
    muscleGroup: 'Trunk',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 60,
    cue: 'The loaded, progressable trunk flexion.',
  },
];

const ROUTINES: PlanRoutine[] = [
  {
    name: 'Mon · Lower (heavy)',
    exercises: [
      one('Broad Jump'),
      one('Pendulum Squat'),
      one('Hip Thrust'),
      one('Leg Extension'),
      one('Seated Leg Curl'),
      one('Adductor Machine'),
      one('Hanging Leg Raise'),
      ...pair('Calf Raise', 'Tibialis Raise'),
      one('Dead Hang'),
    ],
  },
  {
    name: 'Tue · Isolation',
    exercises: [
      one('Cable Lateral Raise'),
      ...pair('Cable Rear Delt Fly', 'Cable Curl'),
      one('Band Pull-Apart'),
      one('Banded External Rotation at 90°'),
      one('Banded Y-Raise'),
      one('Wrist Extensor Eccentrics'),
    ],
  },
  {
    name: 'Wed · Upper (heavy)',
    exercises: [
      one('Banded or Plyo Push-Up'),
      one('Incline DB Press'),
      one('Weighted Pull-Up'),
      one('Flat Machine Press'),
      one('Seated Shoulder Press'),
      one('Neutral-Grip Lat Pulldown'),
      ...pair('Cable Overhead Triceps Extension', 'Cable Rear Delt Fly'),
      one('Dead Hang'),
    ],
  },
  {
    name: 'Thu · Isolation (light)',
    exercises: [
      one('Cable Fly'),
      one('Cable Lateral Raise'),
      ...pair('Cable Triceps Pushdown', 'Face Pull'),
      one('Hammer Curl'),
      one('Eccentric Calf Raise'),
    ],
  },
  {
    name: 'Fri · Hinge + volume',
    exercises: [
      one('Trap Bar Deadlift'),
      one('Pendulum Split Squat'),
      one('T-Bar Row'),
      one('Flat DB Press'),
      one('Cable Lateral Raise'),
      one('Half-Kneeling Landmine Rotation'),
      one('Cable Crunch'),
      one('Dead Hang'),
    ],
  },
];

export const TRAINING_PLAN = {
  title: 'BJJ Hypertrophy Block',
  /** Week 1 of the block, so the app's week counter matches the plan's calendar. */
  startDate: '2026-09-21',
  exercises: EXERCISES,
  routines: ROUTINES,
  /** Routines seeded earlier that this plan supersedes. */
  supersedes: ['Push Day', 'Pull Day', 'Leg Day'],
};

const normalise = (name: string) => name.trim().toLowerCase();

export interface PlanInstall {
  exercises: Exercise[];
  routines: Routine[];
  removedRoutineIds: string[];
}

/**
 * Turn the plan into records. Exercises already in the library are matched by
 * name and keep their id, so their logged history survives; their sets, reps,
 * step and cue are updated to the plan's prescription.
 */
export function buildPlan(
  existingExercises: Exercise[],
  existingRoutines: Routine[] = [],
): PlanInstall {
  const byName = new Map(existingExercises.map((e) => [normalise(e.name), e]));
  const createdAt = Date.now();
  const ids = new Map<string, string>();
  const exercises: Exercise[] = [];

  for (const spec of TRAINING_PLAN.exercises) {
    const existing = byName.get(normalise(spec.name));
    const exercise: Exercise = {
      id: existing?.id ?? newId(),
      name: spec.name,
      muscleGroup: spec.muscleGroup,
      increment: spec.increment,
      defaultSets: spec.defaultSets,
      defaultReps: spec.defaultReps,
      restSeconds: spec.restSeconds,
      cue: spec.cue,
      bodyweightLoad: spec.bodyweightLoad,
      archived: false,
      createdAt: existing?.createdAt ?? createdAt,
    };
    exercises.push(exercise);
    ids.set(normalise(spec.name), exercise.id);
  }

  const planNames = new Set(TRAINING_PLAN.routines.map((r) => normalise(r.name)));
  const routines: Routine[] = TRAINING_PLAN.routines.map((spec) => {
    const existing = existingRoutines.find((r) => normalise(r.name) === normalise(spec.name));
    return {
      id: existing?.id ?? newId(),
      name: spec.name,
      entries: tidyEntries(
        spec.exercises.flatMap((entry) => {
          const id = ids.get(normalise(entry.name));
          return id
            ? [{ exerciseId: id, supersetWithNext: entry.supersetWithNext }]
            : [];
        }),
      ),
      archived: false,
    };
  });

  // Only the routines this plan replaces are removed; anything you built
  // yourself is left alone.
  const superseded = new Set(TRAINING_PLAN.supersedes.map(normalise));
  const removedRoutineIds = existingRoutines
    .filter((r) => superseded.has(normalise(r.name)) && !planNames.has(normalise(r.name)))
    .map((r) => r.id);

  return { exercises, routines, removedRoutineIds };
}
