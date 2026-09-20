import type { Session } from '../db/schema';
import { fromISO, startOfWeek, toISO, todayISO } from './dates';
import { sessionVolume } from './stats';

const finished = (sessions: Session[]) => sessions.filter((s) => s.finishedAt !== null);

export interface WeekSummary {
  sessions: number;
  volume: number;
  sets: number;
}

export function weekSummary(
  sessions: Session[],
  iso = todayISO(),
  bodyweightIds?: Set<string>,
  fallbackBodyweight = 0,
): WeekSummary {
  const week = startOfWeek(iso);
  const inWeek = finished(sessions).filter((s) => startOfWeek(s.date) === week);
  return {
    sessions: inWeek.length,
    volume: inWeek.reduce(
      (sum, s) => sum + sessionVolume(s, bodyweightIds, fallbackBodyweight),
      0,
    ),
    sets: inWeek.reduce(
      (sum, s) => sum + s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0),
      0,
    ),
  };
}

/** Consecutive weeks with at least one finished session, counting back from now. */
export function weekStreak(sessions: Session[], iso = todayISO()): number {
  const weeks = new Set(finished(sessions).map((s) => startOfWeek(s.date)));
  if (!weeks.size) return 0;

  const cursor = fromISO(startOfWeek(iso));
  // A week that has only just begun should not break a run from last week.
  if (!weeks.has(toISO(cursor))) cursor.setDate(cursor.getDate() - 7);

  let streak = 0;
  while (weeks.has(toISO(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

/** The routine that has gone longest without being trained. */
export function suggestNextRoutine(
  sessions: Session[],
  routineIds: string[],
): string | null {
  if (!routineIds.length) return null;
  const lastDone = new Map<string, string>();
  for (const session of finished(sessions)) {
    if (!session.routineId) continue;
    const seen = lastDone.get(session.routineId);
    if (!seen || session.date > seen) lastDone.set(session.routineId, session.date);
  }
  return [...routineIds].sort((a, b) =>
    (lastDone.get(a) ?? '').localeCompare(lastDone.get(b) ?? ''),
  )[0];
}
