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
    restSeconds: 90,
    muscleGroup: 'Power',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 3,
    cue: 'Primer only. Stop while they are still crisp.',
  },
  {
    name: 'Pendulum Squat',
    restSeconds: 180,
    muscleGroup: 'Quads',
    increment: 5,
    defaultSets: 9,
    defaultReps: 3,
    cue: '3 clusters of 3+3+3 · RPE 7–8 (RIR 2–3) · 20 s inside a cluster, 3 min between',
  },
  {
    name: 'Hip Thrust',
    restSeconds: 120,
    muscleGroup: 'Glutes',
    increment: 5,
    defaultSets: 3,
    defaultReps: 8,
    cue: '1–2 s pause at lockout. Pause it, do not chase load.',
  },
  {
    name: 'Seated Leg Curl',
    restSeconds: 90,
    muscleGroup: 'Hamstrings',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 10,
    cue: 'Lengthened partials on the last set.',
  },
  {
    name: 'Adductor Machine',
    restSeconds: 90,
    muscleGroup: 'Adductors',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    cue: 'Near-zero recovery cost and the most grappling-relevant thing here. Do not skip.',
  },
  {
    name: 'Cable Lateral Raise',
    restSeconds: 75,
    muscleGroup: 'Side Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    cue: 'Last set to 0–1 RIR.',
  },
  {
    name: 'Hanging Leg Raise',
    restSeconds: 75,
    muscleGroup: 'Trunk',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    name: 'Calf Raise',
    restSeconds: 60,
    muscleGroup: 'Calves',
    increment: 5,
    defaultSets: 2,
    defaultReps: 12,
  },
  {
    name: 'Tibialis Raise',
    restSeconds: 60,
    muscleGroup: 'Tibialis',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 15,
    cue: 'First thing to cut when a session runs long.',
  },
  {
    name: 'Dead Hang',
    restSeconds: 60,
    muscleGroup: 'Grip',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 30,
    cue: 'Seconds, not reps. Two-arm passive. This is your entire grip budget — nothing else.',
  },

  // --- Tuesday, isolation ----------------------------------------------
  {
    name: 'Cable Rear Delt Fly',
    restSeconds: 75,
    muscleGroup: 'Rear Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    name: 'Cable Curl',
    restSeconds: 60,
    muscleGroup: 'Biceps',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 12,
    cue: '2–3 RIR. Never to failure — the gi already taxes your elbows.',
  },
  {
    name: 'Cable External Rotation',
    restSeconds: 60,
    muscleGroup: 'Rotator Cuff',
    increment: 1.25,
    defaultSets: 2,
    defaultReps: 15,
    cue: 'Light.',
  },
  {
    name: 'Wrist Extensor Eccentrics',
    restSeconds: 60,
    muscleGroup: 'Forearms',
    increment: 1,
    defaultSets: 3,
    defaultReps: 15,
    cue: '3 s lowers, light dumbbell. Daily for 4–6 weeks if any elbow symptom appears.',
  },

  // --- Wednesday, upper -------------------------------------------------
  {
    name: 'Med Ball Chest Throw',
    restSeconds: 90,
    muscleGroup: 'Power',
    increment: 1,
    defaultSets: 3,
    defaultReps: 3,
    cue: 'Primer only.',
  },
  {
    name: 'Incline DB Press',
    restSeconds: 180,
    muscleGroup: 'Chest',
    increment: 2,
    defaultSets: 9,
    defaultReps: 3,
    cue: '3 clusters of 3+3+3 at 75–80% · 20 s inside a cluster, 3 min between',
  },
  {
    name: 'Weighted Pull-Up',
    restSeconds: 150,
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 6,
    cue: 'Neutral grip, straps. Log the added weight.',
  },
  {
    name: 'Flat Machine Press',
    restSeconds: 120,
    muscleGroup: 'Chest',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    name: 'Seated Shoulder Press',
    restSeconds: 120,
    muscleGroup: 'Shoulders',
    increment: 2,
    defaultSets: 2,
    defaultReps: 8,
    cue: 'Stays at 2 sets — six chest sets already supply plenty of front delt.',
  },
  {
    name: 'Neutral-Grip Lat Pulldown',
    restSeconds: 90,
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 4,
    defaultReps: 10,
    cue: 'Straps. Full stretch at the top.',
  },
  {
    name: 'Cable Overhead Triceps Extension',
    restSeconds: 75,
    muscleGroup: 'Triceps',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 10,
    cue: 'Rope. No grinding at lockout.',
  },
  {
    name: 'Neck Harness',
    restSeconds: 60,
    muscleGroup: 'Neck',
    increment: 1.25,
    defaultSets: 3,
    defaultReps: 10,
  },

  // --- Thursday, light isolation ---------------------------------------
  {
    name: 'Cable Fly',
    restSeconds: 90,
    muscleGroup: 'Chest',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    cue: '1–2 RIR, first while fresh. Thursday stays under 40 min, no compounds, no failure.',
  },
  {
    name: 'Cable Triceps Pushdown',
    restSeconds: 75,
    muscleGroup: 'Triceps',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    cue: '2 RIR.',
  },
  {
    name: 'Face Pull',
    restSeconds: 75,
    muscleGroup: 'Rear Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    name: 'Hammer Curl',
    restSeconds: 60,
    muscleGroup: 'Biceps',
    increment: 2,
    defaultSets: 2,
    defaultReps: 12,
    cue: '2–3 RIR. Neutral grip only — no supinated loading.',
  },
  {
    name: 'Eccentric Calf Raise',
    restSeconds: 60,
    muscleGroup: 'Calves',
    increment: 5,
    defaultSets: 2,
    defaultReps: 12,
    cue: 'Slow lowers.',
  },

  // --- Friday, hinge + volume -------------------------------------------
  {
    name: 'Trap Bar Deadlift',
    restSeconds: 180,
    muscleGroup: 'Posterior Chain',
    increment: 5,
    defaultSets: 4,
    defaultReps: 5,
    cue: 'RPE 8 (RIR 2). Straps. Never to failure.',
  },
  {
    name: 'Pendulum Split Squat',
    restSeconds: 120,
    muscleGroup: 'Quads',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
    cue: 'Per leg. RPE 7 (RIR 3).',
  },
  {
    name: 'T-Bar Row',
    restSeconds: 120,
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 4,
    defaultReps: 8,
    cue: 'Strict, controlled eccentric. Straps, neutral handle. Never before the hinge.',
  },
  {
    name: 'Flat DB Press',
    restSeconds: 120,
    muscleGroup: 'Chest',
    increment: 2,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    name: '45° Back Extension',
    restSeconds: 90,
    muscleGroup: 'Lower Back',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 10,
    cue: 'Cut these first if your low back is stiff — before touching the deadlift or row.',
  },
  {
    name: 'Pallof Press',
    restSeconds: 60,
    muscleGroup: 'Trunk',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 12,
    cue: 'Per side.',
  },
];

const ROUTINES: PlanRoutine[] = [
  {
    name: 'Mon · Lower (heavy)',
    exercises: [
      one('Broad Jump'),
      one('Pendulum Squat'),
      one('Hip Thrust'),
      one('Seated Leg Curl'),
      one('Adductor Machine'),
      one('Cable Lateral Raise'),
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
      ...pair('Cable External Rotation', 'Wrist Extensor Eccentrics'),
      one('Calf Raise'),
    ],
  },
  {
    name: 'Wed · Upper (heavy)',
    exercises: [
      one('Med Ball Chest Throw'),
      one('Incline DB Press'),
      one('Weighted Pull-Up'),
      one('Flat Machine Press'),
      one('Seated Shoulder Press'),
      one('Neutral-Grip Lat Pulldown'),
      ...pair('Cable Overhead Triceps Extension', 'Cable Rear Delt Fly'),
      one('Neck Harness'),
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
      ...pair('45° Back Extension', 'Cable Lateral Raise'),
      ...pair('Pallof Press', 'Neck Harness'),
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
