import type { Exercise, Routine } from './schema';
import { newId } from './schema';

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
  cue?: string;
}

export interface PlanRoutine {
  name: string;
  /** Exercise names, in the order they are performed. */
  exercises: string[];
}

const EXERCISES: PlanExercise[] = [
  // --- Monday, lower ----------------------------------------------------
  {
    name: 'Broad Jump',
    muscleGroup: 'Power',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 3,
    cue: 'Primer only. Stop while they are still crisp.',
  },
  {
    name: 'Pendulum Squat',
    muscleGroup: 'Quads',
    increment: 5,
    defaultSets: 9,
    defaultReps: 3,
    cue: '3 clusters of 3+3+3 · RPE 7–8 (RIR 2–3) · 20 s inside a cluster, 3 min between',
  },
  {
    name: 'Hip Thrust',
    muscleGroup: 'Glutes',
    increment: 5,
    defaultSets: 3,
    defaultReps: 8,
    cue: '1–2 s pause at lockout. Pause it, do not chase load.',
  },
  {
    name: 'Seated Leg Curl',
    muscleGroup: 'Hamstrings',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 10,
    cue: 'Lengthened partials on the last set.',
  },
  {
    name: 'Adductor Machine',
    muscleGroup: 'Adductors',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    cue: 'Near-zero recovery cost and the most grappling-relevant thing here. Do not skip.',
  },
  {
    name: 'Cable Lateral Raise',
    muscleGroup: 'Side Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    cue: 'Last set to 0–1 RIR.',
  },
  {
    name: 'Hanging Leg Raise',
    muscleGroup: 'Trunk',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    name: 'Calf Raise',
    muscleGroup: 'Calves',
    increment: 5,
    defaultSets: 2,
    defaultReps: 12,
    cue: 'Superset with tibialis raise.',
  },
  {
    name: 'Tibialis Raise',
    muscleGroup: 'Tibialis',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 15,
    cue: 'Superset with calf raise. First thing to cut when a session runs long.',
  },
  {
    name: 'Dead Hang',
    muscleGroup: 'Grip',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 30,
    cue: 'Seconds, not reps. Two-arm passive. This is your entire grip budget — nothing else.',
  },

  // --- Tuesday, isolation ----------------------------------------------
  {
    name: 'Cable Rear Delt Fly',
    muscleGroup: 'Rear Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    name: 'Cable Curl',
    muscleGroup: 'Biceps',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 12,
    cue: '2–3 RIR. Never to failure — the gi already taxes your elbows.',
  },
  {
    name: 'Cable External Rotation',
    muscleGroup: 'Rotator Cuff',
    increment: 1.25,
    defaultSets: 2,
    defaultReps: 15,
    cue: 'Light. Superset with wrist extensor eccentrics.',
  },
  {
    name: 'Wrist Extensor Eccentrics',
    muscleGroup: 'Forearms',
    increment: 1,
    defaultSets: 3,
    defaultReps: 15,
    cue: '3 s lowers, light dumbbell. Daily for 4–6 weeks if any elbow symptom appears.',
  },

  // --- Wednesday, upper -------------------------------------------------
  {
    name: 'Med Ball Chest Throw',
    muscleGroup: 'Power',
    increment: 1,
    defaultSets: 3,
    defaultReps: 3,
    cue: 'Primer only.',
  },
  {
    name: 'Incline DB Press',
    muscleGroup: 'Chest',
    increment: 2,
    defaultSets: 9,
    defaultReps: 3,
    cue: '3 clusters of 3+3+3 at 75–80% · 20 s inside a cluster, 3 min between',
  },
  {
    name: 'Weighted Pull-Up',
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 6,
    cue: 'Neutral grip, straps. Log the added weight.',
  },
  {
    name: 'Flat Machine Press',
    muscleGroup: 'Chest',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    name: 'Seated Shoulder Press',
    muscleGroup: 'Shoulders',
    increment: 2,
    defaultSets: 2,
    defaultReps: 8,
    cue: 'Stays at 2 sets — six chest sets already supply plenty of front delt.',
  },
  {
    name: 'Neutral-Grip Lat Pulldown',
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 4,
    defaultReps: 10,
    cue: 'Straps. Full stretch at the top.',
  },
  {
    name: 'Cable Overhead Triceps Extension',
    muscleGroup: 'Triceps',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 10,
    cue: 'Rope. No grinding at lockout. Superset with rear delt fly.',
  },
  {
    name: 'Neck Harness',
    muscleGroup: 'Neck',
    increment: 1.25,
    defaultSets: 3,
    defaultReps: 10,
  },

  // --- Thursday, light isolation ---------------------------------------
  {
    name: 'Cable Fly',
    muscleGroup: 'Chest',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    cue: '1–2 RIR, first while fresh. Thursday stays under 40 min, no compounds, no failure.',
  },
  {
    name: 'Cable Triceps Pushdown',
    muscleGroup: 'Triceps',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 12,
    cue: '2 RIR. Superset with face pull.',
  },
  {
    name: 'Face Pull',
    muscleGroup: 'Rear Delts',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    name: 'Hammer Curl',
    muscleGroup: 'Biceps',
    increment: 2,
    defaultSets: 2,
    defaultReps: 12,
    cue: '2–3 RIR. Neutral grip only — no supinated loading.',
  },
  {
    name: 'Eccentric Calf Raise',
    muscleGroup: 'Calves',
    increment: 5,
    defaultSets: 2,
    defaultReps: 12,
    cue: 'Slow lowers.',
  },

  // --- Friday, hinge + volume -------------------------------------------
  {
    name: 'Trap Bar Deadlift',
    muscleGroup: 'Posterior Chain',
    increment: 5,
    defaultSets: 4,
    defaultReps: 5,
    cue: 'RPE 8 (RIR 2). Straps. Never to failure.',
  },
  {
    name: 'Pendulum Split Squat',
    muscleGroup: 'Quads',
    increment: 2.5,
    defaultSets: 3,
    defaultReps: 8,
    cue: 'Per leg. RPE 7 (RIR 3).',
  },
  {
    name: 'T-Bar Row',
    muscleGroup: 'Back',
    increment: 2.5,
    defaultSets: 4,
    defaultReps: 8,
    cue: 'Strict, controlled eccentric. Straps, neutral handle. Never before the hinge.',
  },
  {
    name: 'Flat DB Press',
    muscleGroup: 'Chest',
    increment: 2,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    name: '45° Back Extension',
    muscleGroup: 'Lower Back',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 10,
    cue: 'Cut these first if your low back is stiff — before touching the deadlift or row.',
  },
  {
    name: 'Pallof Press',
    muscleGroup: 'Trunk',
    increment: 2.5,
    defaultSets: 2,
    defaultReps: 12,
    cue: 'Per side. Superset with neck.',
  },
];

const ROUTINES: PlanRoutine[] = [
  {
    name: 'Mon · Lower (heavy)',
    exercises: [
      'Broad Jump',
      'Pendulum Squat',
      'Hip Thrust',
      'Seated Leg Curl',
      'Adductor Machine',
      'Cable Lateral Raise',
      'Hanging Leg Raise',
      'Calf Raise',
      'Tibialis Raise',
      'Dead Hang',
    ],
  },
  {
    name: 'Tue · Isolation',
    exercises: [
      'Cable Lateral Raise',
      'Cable Rear Delt Fly',
      'Cable Curl',
      'Cable External Rotation',
      'Wrist Extensor Eccentrics',
      'Calf Raise',
    ],
  },
  {
    name: 'Wed · Upper (heavy)',
    exercises: [
      'Med Ball Chest Throw',
      'Incline DB Press',
      'Weighted Pull-Up',
      'Flat Machine Press',
      'Seated Shoulder Press',
      'Neutral-Grip Lat Pulldown',
      'Cable Overhead Triceps Extension',
      'Cable Rear Delt Fly',
      'Neck Harness',
      'Dead Hang',
    ],
  },
  {
    name: 'Thu · Isolation (light)',
    exercises: [
      'Cable Fly',
      'Cable Lateral Raise',
      'Cable Triceps Pushdown',
      'Face Pull',
      'Hammer Curl',
      'Eccentric Calf Raise',
    ],
  },
  {
    name: 'Fri · Hinge + volume',
    exercises: [
      'Trap Bar Deadlift',
      'Pendulum Split Squat',
      'T-Bar Row',
      'Flat DB Press',
      '45° Back Extension',
      'Cable Lateral Raise',
      'Pallof Press',
      'Neck Harness',
      'Dead Hang',
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
      exerciseIds: spec.exercises.flatMap((name) => {
        const id = ids.get(normalise(name));
        return id ? [id] : [];
      }),
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
