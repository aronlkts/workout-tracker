import type { Session, SetLog, ID } from '../db/schema';

/**
 * Epley, adjusted for reps in reserve: a set stopped 2 short of failure is
 * scored as though those 2 reps had been performed. Unrecorded RIR is treated
 * as 0 (taken to failure), which is the conservative reading of a bare set.
 */
export function estimate1RM(weight: number, reps: number, rir: number | null): number {
  const repsToFailure = reps + (rir ?? 0);
  if (weight <= 0 || repsToFailure <= 0) return 0;
  if (repsToFailure === 1) return weight;
  return weight * (1 + repsToFailure / 30);
}

/** Inverse of the above: the load predicted to allow `reps` at `rir`. */
export function weightForReps(oneRM: number, reps: number, rir = 0): number {
  const repsToFailure = reps + rir;
  if (oneRM <= 0 || repsToFailure <= 0) return 0;
  return oneRM / (1 + repsToFailure / 30);
}

/**
 * A set counts once it is ticked off and has reps. Weight is deliberately not
 * required: bodyweight work (hangs, leg raises, jumps) is real training, and
 * gating on load made it invisible to history, progression and the finish
 * button. Load-based figures below simply come out as zero for those.
 */
export const completedSets = (sets: SetLog[]): SetLog[] =>
  sets.filter((s) => s.done && s.reps > 0);

export function bestE1RM(sets: SetLog[]): number {
  return completedSets(sets).reduce(
    (best, s) => Math.max(best, estimate1RM(s.weight, s.reps, s.rir)),
    0,
  );
}

export function volume(sets: SetLog[]): number {
  return completedSets(sets).reduce((sum, s) => sum + s.weight * s.reps, 0);
}

/** Heaviest completed set; ties broken by reps. */
export function topSet(sets: SetLog[]): SetLog | null {
  return completedSets(sets).reduce<SetLog | null>((best, s) => {
    if (!best) return s;
    if (s.weight > best.weight) return s;
    if (s.weight === best.weight && s.reps > best.reps) return s;
    return best;
  }, null);
}

export function averageRIR(sets: SetLog[]): number | null {
  const rated = completedSets(sets).filter((s) => s.rir !== null);
  if (!rated.length) return null;
  return rated.reduce((sum, s) => sum + (s.rir ?? 0), 0) / rated.length;
}

export const totalReps = (sets: SetLog[]): number =>
  completedSets(sets).reduce((sum, s) => sum + s.reps, 0);

export interface ExercisePoint {
  sessionId: ID;
  date: string;
  startedAt: number;
  sets: SetLog[];
  e1rm: number;
  volume: number;
  topSet: SetLog | null;
  avgRIR: number | null;
  reps: number;
}

/** One point per finished session that contains this exercise, oldest first. */
export function exerciseSeries(sessions: Session[], exerciseId: ID): ExercisePoint[] {
  return sessions
    .filter((s) => s.finishedAt !== null)
    .map((session) => {
      const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!entry) return null;
      const done = completedSets(entry.sets);
      if (!done.length) return null;
      return {
        sessionId: session.id,
        date: session.date,
        startedAt: session.startedAt,
        sets: entry.sets,
        e1rm: bestE1RM(entry.sets),
        volume: volume(entry.sets),
        topSet: topSet(entry.sets),
        avgRIR: averageRIR(entry.sets),
        reps: totalReps(entry.sets),
      };
    })
    .filter((p): p is ExercisePoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startedAt - b.startedAt);
}

export interface ExerciseSummary {
  points: ExercisePoint[];
  sessionCount: number;
  firstDate: string | null;
  lastDate: string | null;
  currentE1RM: number;
  /** Change in estimated 1RM against the previous session. */
  e1rmDelta: number;
  bestE1RM: number;
  heaviestSet: SetLog | null;
  latestTopSet: SetLog | null;
  latestAvgRIR: number | null;
}

export function summarise(sessions: Session[], exerciseId: ID): ExerciseSummary {
  const points = exerciseSeries(sessions, exerciseId);
  const last = points.at(-1) ?? null;
  const prev = points.at(-2) ?? null;
  const heaviest = points.reduce<SetLog | null>((best, p) => {
    if (!p.topSet) return best;
    if (!best || p.topSet.weight > best.weight) return p.topSet;
    return best;
  }, null);

  return {
    points,
    sessionCount: points.length,
    firstDate: points[0]?.date ?? null,
    lastDate: last?.date ?? null,
    currentE1RM: last?.e1rm ?? 0,
    e1rmDelta: last && prev ? last.e1rm - prev.e1rm : 0,
    bestE1RM: points.reduce((best, p) => Math.max(best, p.e1rm), 0),
    heaviestSet: heaviest,
    latestTopSet: last?.topSet ?? null,
    latestAvgRIR: last?.avgRIR ?? null,
  };
}

/** The most recent finished session that recorded this exercise. */
export function lastPerformance(
  sessions: Session[],
  exerciseId: ID,
  excludeSessionId?: ID,
): { session: Session; sets: SetLog[] } | null {
  const candidates = sessions
    .filter((s) => s.finishedAt !== null && s.id !== excludeSessionId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt - a.startedAt);

  for (const session of candidates) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (entry && completedSets(entry.sets).length) {
      return { session, sets: entry.sets };
    }
  }
  return null;
}

export function sessionVolume(session: Session): number {
  return session.exercises.reduce((sum, e) => sum + volume(e.sets), 0);
}

export function sessionSetCount(session: Session): number {
  return session.exercises.reduce((sum, e) => sum + completedSets(e.sets).length, 0);
}
