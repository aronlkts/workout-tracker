import type { Exercise, Settings, SetLog } from '../db/schema';
import type { SetSuggestion } from '../lib/progression';
import { fmtWeight } from '../lib/format';
import { Icon } from './Icon';
import { NumberInput } from './NumberInput';

interface SetCardProps {
  index: number;
  set: SetLog;
  suggestion?: SetSuggestion;
  exercise: Exercise;
  settings: Settings;
  onChange: (patch: Partial<SetLog>) => void;
}

export function SetCard({
  index,
  set,
  suggestion,
  exercise,
  settings,
  onChange,
}: SetCardProps) {
  const step = exercise.increment || settings.defaultIncrement;
  const number = index + 1;
  const badgeUp = suggestion?.action === 'increase';

  const nudge = (delta: number) =>
    onChange({ weight: Math.max(0, Math.round((set.weight + delta) * 100) / 100) });

  return (
    <div className="card">
      <div className="set-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="check"
            aria-pressed={set.done}
            aria-label={`Mark set ${number} complete`}
            onClick={() => onChange({ done: !set.done })}
          >
            <span className="check-dot">
              {set.done && <Icon name="check" size={11} strokeWidth={3} />}
            </span>
          </button>
          <span className="set-name">Set {number}</span>
        </div>
        {suggestion && (
          <span className={badgeUp ? 'badge badge-up' : 'badge'}>{suggestion.badge}</span>
        )}
      </div>

      <div className="last-label">
        {suggestion?.lastLabel ? `Last time · ${suggestion.lastLabel}` : 'No previous data'}
      </div>

      <div className="set-fields">
        <div className="field">
          <span className="label">Weight ({settings.unit})</span>
          <div className="stepper">
            <button
              type="button"
              onClick={() => nudge(-step)}
              aria-label={`Decrease weight for set ${number}`}
            >
              <Icon name="minus" size={15} strokeWidth={2.5} />
            </button>
            <NumberInput
              value={set.weight}
              onCommit={(v) => onChange({ weight: v ?? 0 })}
              className="stepper-value"
              decimal
              aria-label={`Weight for set ${number}`}
            />
            <button
              type="button"
              onClick={() => nudge(step)}
              aria-label={`Increase weight for set ${number}`}
            >
              <Icon name="plus" size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor={`reps-${exercise.id}-${index}`}>
            Reps
          </label>
          <NumberInput
            id={`reps-${exercise.id}-${index}`}
            value={set.reps}
            onCommit={(v) => onChange({ reps: v ?? 0 })}
          />
        </div>

        <div className="field">
          <label className="label" htmlFor={`rir-${exercise.id}-${index}`}>
            RIR
          </label>
          <NumberInput
            id={`rir-${exercise.id}-${index}`}
            value={set.rir}
            onCommit={(v) => onChange({ rir: v })}
            allowEmpty
            placeholder="—"
          />
        </div>
      </div>

      {suggestion?.action === 'hold' && (
        <div className="note" style={{ marginTop: 8 }}>
          Beat {suggestion.reps} reps at {fmtWeight(suggestion.weight)}
          {settings.unit} to earn the next jump.
        </div>
      )}
    </div>
  );
}
