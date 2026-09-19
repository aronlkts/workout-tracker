export type ID = string;

export interface Exercise {
  id: ID;
  name: string;
  muscleGroup: string;
  /** Smallest weight jump available for this lift (e.g. 2.5 barbell, 2 dumbbell). */
  increment: number;
  defaultSets: number;
  defaultReps: number;
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
  exercises: SessionExercise[];
}

export interface Routine {
  id: ID;
  name: string;
  exerciseIds: ID[];
  archived: boolean;
}

export interface Settings {
  /** Display label only. Stored numbers are whatever you typed; switching does not convert. */
  unit: string;
  defaultIncrement: number;
  /** Week numbers on the log header count from here. */
  programStart: string;
  /** Last session left this much in reserve or more, so add weight. */
  progressRIR: number;
  /** Left this much or less, so hold the weight and chase reps. */
  holdRIR: number;
}

export const DEFAULT_SETTINGS: Settings = {
  unit: 'kg',
  defaultIncrement: 2.5,
  programStart: '',
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
