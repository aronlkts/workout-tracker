import { useId, useMemo, useState } from 'react';
import type { Exercise, ID } from '../db/schema';
import { newId } from '../db/schema';
import { Icon } from './Icon';
import { NumberInput } from './NumberInput';

interface ExercisePickerProps {
  /** The whole library — matching is done here, not by the caller. */
  exercises: Exercise[];
  /** Already in the routine or session, so not offered again. */
  excludeIds: ID[];
  defaultIncrement: number;
  unit: string;
  onPick: (id: ID) => void;
  /** Save the new exercise to the library *and* add it where the picker sits. */
  onCreate: (exercise: Exercise) => void;
}

export function ExercisePicker({
  exercises,
  excludeIds,
  defaultIncrement,
  unit,
  onPick,
  onCreate,
}: ExercisePickerProps) {
  const searchId = useId();
  const groupsId = useId();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Exercise | null>(null);

  const needle = query.trim().toLowerCase();

  const matches = useMemo(() => {
    const available = exercises.filter((e) => !e.archived && !excludeIds.includes(e.id));
    if (!needle) return available;
    return available.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        e.muscleGroup.toLowerCase().includes(needle),
    );
  }, [exercises, excludeIds, needle]);

  // Typing the name of something already in the library shouldn't invite a duplicate.
  const exactExists = exercises.some((e) => e.name.trim().toLowerCase() === needle);

  const muscleGroups = useMemo(
    () => [...new Set(exercises.map((e) => e.muscleGroup).filter(Boolean))].sort(),
    [exercises],
  );

  const beginCreate = () =>
    setDraft({
      id: newId(),
      name: query.trim(),
      muscleGroup: '',
      increment: defaultIncrement,
      defaultSets: 3,
      defaultReps: 8,
      archived: false,
      createdAt: Date.now(),
    });

  if (draft) {
    return (
      <div className="stack-sm">
        <div className="eyebrow">New exercise</div>
        <input
          className="input"
          placeholder="Exercise name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          aria-label="Exercise name"
          autoFocus
        />
        <input
          className="input"
          placeholder="Muscle group"
          list={groupsId}
          value={draft.muscleGroup}
          onChange={(e) => setDraft({ ...draft, muscleGroup: e.target.value })}
          aria-label="Muscle group"
        />
        <input
          className="input"
          placeholder="Cue (optional)"
          value={draft.cue ?? ''}
          onChange={(e) => setDraft({ ...draft, cue: e.target.value })}
          aria-label="Cue"
        />
        <datalist id={groupsId}>
          {muscleGroups.map((group) => (
            <option key={group} value={group} />
          ))}
        </datalist>

        <div className="form-row">
          <div className="form-label">Weight step ({unit})</div>
          <NumberInput
            value={draft.increment}
            onCommit={(v) => setDraft({ ...draft, increment: v ?? defaultIncrement })}
            className="input input-narrow"
            decimal
            aria-label="Weight step"
          />
        </div>
        <div className="form-row">
          <div className="form-label">Default sets</div>
          <NumberInput
            value={draft.defaultSets}
            onCommit={(v) => setDraft({ ...draft, defaultSets: Math.max(1, v ?? 3) })}
            className="input input-narrow"
            aria-label="Default sets"
          />
        </div>
        <div className="form-row">
          <div className="form-label">Default reps</div>
          <NumberInput
            value={draft.defaultReps}
            onCommit={(v) => setDraft({ ...draft, defaultReps: Math.max(1, v ?? 8) })}
            className="input input-narrow"
            aria-label="Default reps"
          />
        </div>

        <button
          type="button"
          className="btn btn-sm gap-16"
          disabled={!draft.name.trim()}
          onClick={() => {
            onCreate({
              ...draft,
              name: draft.name.trim(),
              muscleGroup: draft.muscleGroup.trim() || 'General',
              cue: draft.cue?.trim() || undefined,
            });
            setDraft(null);
            setQuery('');
          }}
        >
          Create and add
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setDraft(null)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="search">
        <Icon name="search" size={15} color="var(--text-dim)" />
        <input
          id={searchId}
          className="search-input"
          type="search"
          placeholder="Search exercises"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          aria-label="Search exercises"
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <Icon name="close" size={13} />
          </button>
        )}
      </div>

      <div className="stack-sm">
        {matches.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            className="row"
            onClick={() => onPick(exercise.id)}
          >
            <div>
              <div className="row-title">{exercise.name}</div>
              <div className="row-detail">{exercise.muscleGroup}</div>
            </div>
            <Icon name="plus" size={14} color="var(--accent)" />
          </button>
        ))}

        {!matches.length && (
          <p className="empty" style={{ padding: '14px 12px' }}>
            {needle
              ? exactExists
                ? `“${query.trim()}” is already in this one.`
                : `Nothing in the library matches “${query.trim()}”.`
              : 'Every exercise is already in this one.'}
          </p>
        )}

        <button type="button" className="row card-dashed" onClick={beginCreate}>
          <div>
            <div className="row-title">
              {needle && !exactExists ? `Create “${query.trim()}”` : 'New exercise'}
            </div>
            <div className="row-detail">Adds it to your library too</div>
          </div>
          <Icon name="plusCircle" size={16} color="var(--text-dim)" />
        </button>
      </div>
    </>
  );
}
