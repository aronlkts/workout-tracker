import type { Exercise, ID, Routine, Session, Settings } from '../db/schema';
import { newId } from '../db/schema';
import { suggestSets } from './progression';
import { todayISO } from './dates';

/** A fresh session, pre-filled with what the progression rules suggest. */
export function buildSession(
  routine: Routine | null,
  name: string,
  exerciseIds: ID[],
  exercises: Exercise[],
  sessions: Session[],
  settings: Settings,
): Session {
  const byId = new Map(exercises.map((e) => [e.id, e]));

  return {
    id: newId(),
    routineId: routine?.id ?? null,
    routineName: name,
    date: todayISO(),
    startedAt: Date.now(),
    finishedAt: null,
    bodyweight: settings.bodyweight || undefined,
    exercises: exerciseIds.flatMap((exerciseId) => {
      const exercise = byId.get(exerciseId);
      if (!exercise) return [];
      return [
        {
          exerciseId,
          sets: suggestSets(exercise, sessions, settings).map((s) => ({
            weight: s.weight,
            reps: s.reps,
            rir: null,
            done: false,
          })),
        },
      ];
    }),
  };
}
