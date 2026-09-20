export type ID = string;

export interface Exercise {
  id: ID;
  name: string;
  muscleGroup: string;
  /** Smallest weight jump available for this lift (e.g. 2.5 barbell, 2 dumbbell). */
  increment: number;
  defaultSets: number;
  defaultReps: number;
  /** One line of coaching shown while logging, e.g. "1-2 s pause at lockout". */
  cue?: string;
  /** Recommended rest between sets, in seconds. */
  restSeconds?: number;
  /**
   * Your own weight is part of the load, and the weight field records what is
   * added on top. Deliberately not set for timed holds, where bodyweight times
   * seconds is not volume.
   */
  bodyweightLoad?: boolean;
  archived: boolean;
  createdAt: number;
}

export interface SetLog {
  weight: number;
  reps: number;
  /** Reps in reserve. null means "not recorded". */
  rir: number | null;
  done: boolean;
}

export interface SessionExercise {
  exerciseId: ID;
  sets: SetLog[];
}

export interface Session {
  id: ID;
  routineId: ID | null;
  routineName: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  startedAt: number;
  finishedAt: number | null;
  /** Your bodyweight when this was logged, so old sessions keep their maths. */
  bodyweight?: number;
  exercises: SessionExercise[];
}

export interface RoutineEntry {
  exerciseId: ID;
  /**
   * Performed back-to-back with the entry after it, with no rest in between.
   * Pairing lives here rather than on the exercise because it changes by day:
   * calf raises are supersetted on Monday and a straight set on Tuesday.
   */
  supersetWithNext?: boolean;
}

export interface Routine {
  id: ID;
  name: string;
  entries: RoutineEntry[];
  archived: boolean;
}

/** How routines were stored before pairing existed. */
interface LegacyRoutine {
  exerciseIds?: ID[];
}

/** Brings a stored routine up to the current shape. Safe to run repeatedly. */
export function normaliseRoutine(raw: Routine & LegacyRoutine): Routine {
  const entries = Array.isArray(raw.entries)
    ? raw.entries
    : (raw.exerciseIds ?? []).map((exerciseId) => ({ exerciseId }));
  return {
    id: raw.id,
    name: raw.name,
    entries,
    archived: Boolean(raw.archived),
  };
}

/** Nothing can be supersetted with the exercise after it if there isn't one. */
export function tidyEntries(entries: RoutineEntry[]): RoutineEntry[] {
  return entries.map((entry, i) =>
    i === entries.length - 1 && entry.supersetWithNext
      ? { exerciseId: entry.exerciseId }
      : entry,
  );
}

export interface Settings {
  /** Display label only. Stored numbers are whatever you typed; switching does not convert. */
  unit: string;
  defaultIncrement: number;
  /** Week numbers on the log header count from here. */
  programStart: string;
  /** Used as the load on bodyweight lifts. 0 means not set. */
  bodyweight: number;
  /** Last session left this much in reserve or more, so add weight. */
  progressRIR: number;
  /** Left this much or less, so hold the weight and chase reps. */
  holdRIR: number;
}

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  defaultIncrement: 2.5,
  programStart: '',
  bodyweight: 0,
  progressRIR: 2,
  holdRIR: 1,
};

export interface Backup {
  app: 'repweek';
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  settings: Settings;
}

export const newId = (): ID =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
