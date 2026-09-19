import type { Exercise, Session, Settings, SetLog, ID } from '../db/schema';
import { completedSets, lastPerformance } from './stats';
import { fmtWeight, listRanges, plural } from './format';

export type ProgressionAction = 'increase' | 'hold' | 'repeat' | 'first';

export interface SetSuggestion {
  weight: number;
  reps: number;
  action: ProgressionAction;
  /** Short pill on the set card: "+2.5kg", "Hold", "New". */
  badge: string;
  /** "80kg × 8 @ RIR 2", or null the first time you do the lift. */
  lastLabel: string | null;
}

function describe(set: SetLog, unit: string): string {
  const base = `${fmtWeight(set.weight)}${unit} × ${set.reps}`;
  return set.rir === null ? base : `${base} @ RIR ${set.rir}`;
}

/**
 * Double progression, driven by RIR: a set you finished with reps to spare
 * earns weight, a set that ran you to the limit keeps its weight and asks for
 * another rep instead.
 */
export function suggestSets(
  exercise: Exercise,
  sessions: Session[],
  settings: Settings,
  excludeSessionId?: ID,
): SetSuggestion[] {
  const previous = lastPerformance(sessions, exercise.id, excludeSessionId);
  const step = exercise.increment || settings.defaultIncrement;

  if (!previous) {
    return Array.from({ length: exercise.defaultSets }, () => ({
      weight: 0,
      reps: exercise.defaultReps,
      action: 'first' as const,
      badge: 'New',
      lastLabel: null,
    }));
  }

  const done = completedSets(previous.sets);
  const count = Math.max(done.length, exercise.defaultSets);

  return Array.from({ length: count }, (_, i) => {
    // Sets added beyond last time inherit the final set's numbers.
    const last = done[i] ?? done.at(-1)!;
    const lastLabel = describe(last, settings.unit);

    if (last.rir !== null && last.rir >= settings.progressRIR) {
      return {
        weight: last.weight + step,
        reps: last.reps,
        action: 'increase' as const,
        badge: `+${fmtWeight(step)}${settings.unit}`,
        lastLabel,
      };
    }

    if (last.rir !== null && last.rir <= settings.holdRIR) {
      return {
        weight: last.weight,
        reps: last.reps,
        action: 'hold' as const,
        badge: 'Hold',
        lastLabel,
      };
    }

    return {
      weight: last.weight,
      reps: last.reps,
      action: 'repeat' as const,
      badge: last.rir === null ? 'No RIR' : 'Repeat',
      lastLabel,
    };
  });
}

/** The plain-English version of the same rules, for the tip card. */
export function progressionTip(
  suggestions: SetSuggestion[],
  exercise: Exercise,
  settings: Settings,
): string {
  if (!suggestions.length) return '';
  if (suggestions.every((s) => s.action === 'first')) {
    return `First time logging ${exercise.name}. Enter what you lift today and rate how many reps you had left — next session RepWeek will pick the weight for you.`;
  }

  const step = `${fmtWeight(exercise.increment || settings.defaultIncrement)}${settings.unit}`;
  const indexOf = (action: ProgressionAction) =>
    suggestions.flatMap((s, i) => (s.action === action ? [i + 1] : []));

  const up = indexOf('increase');
  const hold = indexOf('hold');
  const unrated = indexOf('repeat');
  const parts: string[] = [];

  if (up.length) {
    parts.push(
      `${plural(up.length, 'Set', 'Sets')} ${listRanges(up)} stayed at RIR ${settings.progressRIR}+ last time — try +${step} today.`,
    );
  }
  if (hold.length) {
    const limit = settings.holdRIR === 0 ? 'RIR 0' : `RIR 0–${settings.holdRIR}`;
    parts.push(
      `${plural(hold.length, 'Set', 'Sets')} ${listRanges(hold)} hit ${limit} — hold the weight and chase reps instead.`,
    );
  }
  if (unrated.length) {
    parts.push(
      `${plural(unrated.length, 'Set', 'Sets')} ${listRanges(unrated)} had no RIR logged, so the weight stands. Rate them today to get a suggestion.`,
    );
  }
  return parts.join(' ');
}
