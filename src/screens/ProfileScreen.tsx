import { useEffect, useRef, useState } from 'react';
import type { Backup, Exercise, Routine, RoutineEntry, Settings } from '../db/schema';
import { newId, normaliseRoutine, tidyEntries } from '../db/schema';
import { useAppData } from '../state/AppData';
import { storageEstimate } from '../db/store';
import { TRAINING_PLAN } from '../db/plan';
import { todayISO } from '../lib/dates';
import { plural, restLabel } from '../lib/format';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { NumberInput } from '../components/NumberInput';
import { ExercisePicker } from '../components/ExercisePicker';

export function ProfileScreen() {
  const {
    exercises,
    routines,
    sessions,
    settings,
    saveSettings,
    saveExercise,
    deleteExercise,
    saveRoutine,
    deleteRoutine,
    exportBackup,
    importBackup,
    installPlan,
  } = useAppData();

  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [storage, setStorage] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void storageEstimate().then((est) => {
      if (!est) return;
      setStorage(`${(est.usage / 1024).toFixed(0)} KB used on this device`);
    });
  }, [sessions]);

  const patch = (next: Partial<Settings>) => void saveSettings({ ...settings, ...next });

  const download = async () => {
    const backup = exportBackup();
    const name = `repweek-backup-${todayISO()}.json`;
    const file = new File([JSON.stringify(backup, null, 2)], name, {
      type: 'application/json',
    });

    // iOS gives a proper "Save to Files" flow through the share sheet;
    // a plain download link is the desktop path.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'RepWeek backup' });
        setStatus('Backup shared.');
        return;
      } catch {
        // Cancelled or unsupported — fall through to the link.
      }
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Backup downloaded.');
  };

  const install = async () => {
    const ok = window.confirm(
      `Install ${TRAINING_PLAN.title}? It adds ${TRAINING_PLAN.routines.length} routines ` +
        `and their exercises, sets week 1 to ${TRAINING_PLAN.startDate}, removes the ` +
        `sample Push/Pull/Leg routines, and leaves every session you have logged untouched.`,
    );
    if (!ok) return;
    const result = await installPlan();
    setStatus(
      `Installed ${result.routines} routines and ${result.exercises} exercises.` +
        (result.removed ? ` Removed ${result.removed} sample routines.` : ''),
    );
  };

  const restore = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Backup;
      if (parsed.app !== 'repweek' || !Array.isArray(parsed.sessions)) {
        setStatus('That file is not a RepWeek backup.');
        return;
      }
      const ok = window.confirm(
        `Replace everything on this device with the backup from ${parsed.exportedAt?.slice(0, 10) ?? 'unknown date'}? ` +
          `It holds ${parsed.sessions.length} sessions. Your current data will be gone.`,
      );
      if (!ok) return;
      await importBackup(parsed);
      setStatus('Backup restored.');
    } catch {
      setStatus('Could not read that file.');
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-row">
          <h1 className="title-sm">Profile</h1>
          <div className="avatar">A</div>
        </div>
      </div>

      <div className="scroll">
        <div className="section-title" style={{ marginBottom: 10 }}>
          Progression rules
        </div>
        <div className="stack">
          <div className="form-row">
            <div style={{ flex: 1 }}>
              <div className="form-label">Add weight at RIR</div>
              <div className="form-hint">
                A set finished with this many reps in reserve or more earns the next jump.
              </div>
            </div>
            <NumberInput
              value={settings.progressRIR}
              onCommit={(v) => patch({ progressRIR: v ?? 2 })}
              className="input input-narrow"
              aria-label="Add weight at RIR"
            />
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <div className="form-label">Hold weight at RIR</div>
              <div className="form-hint">
                At or below this, the weight stays and you chase an extra rep instead.
              </div>
            </div>
            <NumberInput
              value={settings.holdRIR}
              onCommit={(v) => patch({ holdRIR: v ?? 1 })}
              className="input input-narrow"
              aria-label="Hold weight at RIR"
            />
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <div className="form-label">Your bodyweight</div>
              <div className="form-hint">
                Counted as the load on pull-ups, push-ups and leg raises. Sessions record
                it as it was on the day, so updating it never rewrites old numbers.
              </div>
            </div>
            <NumberInput
              value={settings.bodyweight || null}
              onCommit={(v) => patch({ bodyweight: v ?? 0 })}
              className="input input-narrow"
              decimal
              allowEmpty
              placeholder="—"
              aria-label="Your bodyweight"
            />
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <div className="form-label">Default weight step</div>
              <div className="form-hint">
                Used when an exercise has no step of its own.
              </div>
            </div>
            <NumberInput
              value={settings.defaultIncrement}
              onCommit={(v) => patch({ defaultIncrement: v ?? 2.5 })}
              className="input input-narrow"
              decimal
              aria-label="Default weight step"
            />
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <div className="form-label">Unit label</div>
              <div className="form-hint">
                A label only — changing it does not convert weights you already logged.
              </div>
            </div>
            <input
              className="input input-narrow"
              value={settings.unit}
              onChange={(e) => patch({ unit: e.target.value.slice(0, 4) })}
              aria-label="Unit label"
            />
          </div>

          <div className="form-row">
            <div style={{ flex: 1 }}>
              <div className="form-label">Program started</div>
              <div className="form-hint">Week numbers count from this date.</div>
            </div>
            <input
              type="date"
              className="input input-date"
              value={settings.programStart}
              onChange={(e) => patch({ programStart: e.target.value })}
              aria-label="Program start date"
            />
          </div>
        </div>

        <div className="spread gap-24" style={{ marginBottom: 10 }}>
          <span className="section-title">Routines</span>
          <button
            type="button"
            className="chip chip-button"
            onClick={() =>
              setEditingRoutine({ id: newId(), name: '', entries: [], archived: false })
            }
          >
            <Icon name="plus" size={12} /> New
          </button>
        </div>
        <div className="stack">
          {routines.map((routine) => (
            <button
              key={routine.id}
              type="button"
              className="row"
              onClick={() => setEditingRoutine(routine)}
            >
              <div>
                <div className="row-title">{routine.name}</div>
                <div className="row-detail">
                  {routine.entries.length} {plural(routine.entries.length, 'exercise')}
                </div>
              </div>
              <Icon name="edit" size={14} color="var(--text-dim)" />
            </button>
          ))}
        </div>

        <div className="card gap-16">
          <div className="row-title">{TRAINING_PLAN.title}</div>
          <div className="form-hint" style={{ marginTop: 4 }}>
            The {TRAINING_PLAN.routines.length} lifting days and their exercises, with set
            and rep targets at the bottom of each prescribed range. Running, BJJ, air bike,
            mobility and nutrition are not part of it — the app only logs sets.
          </div>
          <button type="button" className="btn btn-ghost btn-sm gap-16" onClick={install}>
            <Icon name="download" size={13} /> Install training plan
          </button>
        </div>

        <div className="spread gap-24" style={{ marginBottom: 10 }}>
          <span className="section-title">Exercise library</span>
          <button
            type="button"
            className="chip chip-button"
            onClick={() =>
              setEditingExercise({
                id: newId(),
                name: '',
                muscleGroup: '',
                increment: settings.defaultIncrement,
                defaultSets: 3,
                defaultReps: 8,
                archived: false,
                createdAt: Date.now(),
              })
            }
          >
            <Icon name="plus" size={12} /> New
          </button>
        </div>
        <div className="stack">
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className="row"
              onClick={() => setEditingExercise(exercise)}
            >
              <div>
                <div className="row-title">{exercise.name}</div>
                <div className="row-detail">
                  {exercise.muscleGroup} · {exercise.defaultSets}×{exercise.defaultReps} · step{' '}
                  {exercise.increment}
                  {settings.unit}
                </div>
              </div>
              <Icon name="edit" size={14} color="var(--text-dim)" />
            </button>
          ))}
        </div>

        <div className="section-title gap-24" style={{ marginBottom: 10 }}>
          Backup
        </div>
        <div className="card">
          <div className="form-hint" style={{ marginTop: 0 }}>
            Everything lives in this device's browser storage and is never uploaded anywhere.
            That also means a wiped phone is a wiped log — export a file now and then and keep
            it in Files or iCloud.
          </div>
          <div className="split gap-16">
            <button type="button" className="btn btn-ghost btn-sm" onClick={download}>
              <Icon name="download" size={13} /> Export
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="upload" size={13} /> Restore
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void restore(file);
              e.target.value = '';
            }}
          />
          {(status || storage) && (
            <div className="note" style={{ marginTop: 10 }}>
              {status} {storage}
            </div>
          )}
        </div>

        <div className="section-title gap-24" style={{ marginBottom: 10 }}>
          How the numbers work
        </div>
        <div className="card">
          <div className="form-hint" style={{ marginTop: 0 }}>
            Estimated 1RM uses the Epley formula on reps taken to failure, so your logged reps
            plus the reps you left in reserve. A set of {settings.defaultIncrement > 0 ? '80' : '80'}
            {settings.unit} × 8 at RIR 2 counts as 10 reps to failure and scores about 107
            {settings.unit}. Leaving RIR blank treats the set as taken to failure.
          </div>
          <div className="form-hint">
            {sessions.length} {plural(sessions.length, 'session')} stored ·{' '}
            {exercises.length} {plural(exercises.length, 'exercise')}
          </div>
        </div>
      </div>

      {editingRoutine && (
        <RoutineSheet
          routine={editingRoutine}
          exercises={exercises}
          defaultIncrement={settings.defaultIncrement}
          unit={settings.unit}
          onCreateExercise={(exercise) => void saveExercise(exercise)}
          onClose={() => setEditingRoutine(null)}
          onSave={(r) => {
            void saveRoutine(r);
            setEditingRoutine(null);
          }}
          onDelete={(id) => {
            void deleteRoutine(id);
            setEditingRoutine(null);
          }}
        />
      )}

      {editingExercise && (
        <ExerciseSheet
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={(e) => {
            void saveExercise(e);
            setEditingExercise(null);
          }}
          onDelete={(id) => {
            void deleteExercise(id);
            setEditingExercise(null);
          }}
        />
      )}
    </>
  );
}

/* ---- Editors ----------------------------------------------------------- */

function RoutineSheet({
  routine,
  exercises,
  defaultIncrement,
  unit,
  onCreateExercise,
  onClose,
  onSave,
  onDelete,
}: {
  routine: Routine;
  exercises: Exercise[];
  defaultIncrement: number;
  unit: string;
  onCreateExercise: (exercise: Exercise) => void;
  onClose: () => void;
  onSave: (routine: Routine) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(normaliseRoutine(routine));

  const rows = draft.entries.map((entry) => ({
    entry,
    exercise: exercises.find((e) => e.id === entry.exerciseId),
  }));

  const update = (entries: RoutineEntry[]) =>
    setDraft({ ...draft, entries: tidyEntries(entries) });

  const move = (index: number, delta: number) => {
    const next = draft.entries.slice();
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const togglePair = (index: number) =>
    update(
      draft.entries.map((entry, i) =>
        i === index ? { ...entry, supersetWithNext: !entry.supersetWithNext } : entry,
      ),
    );

  return (
    <Sheet title={routine.name || 'New routine'} onClose={onClose}>
      <input
        className="input"
        placeholder="Routine name"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        aria-label="Routine name"
      />

      <div className="section-title gap-20" style={{ marginBottom: 8 }}>
        In this routine
      </div>
      <div className="stack-sm">
        {rows.map(({ entry, exercise }, i) => {
          if (!exercise) return null;
          const paired = Boolean(entry.supersetWithNext);
          const partner = paired ? rows[i + 1]?.exercise?.name : undefined;
          const pairedToPrevious = Boolean(draft.entries[i - 1]?.supersetWithNext);
          const cls = paired
            ? 'row paired-start'
            : pairedToPrevious
              ? 'row paired-end'
              : 'row';

          return (
            <div className={cls} key={`${entry.exerciseId}-${i}`}>
              <div style={{ minWidth: 0 }}>
                <div className="row-title">
                  {(paired || pairedToPrevious) && (
                    <span className="pair-tag">{paired ? 'A' : 'B'}</span>
                  )}
                  {exercise.name}
                </div>
                <div className="row-detail">
                  {paired
                    ? `Straight into ${partner ?? 'the next lift'} — no rest`
                    : restLabel(exercise.restSeconds)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flex: '0 0 auto' }}>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => togglePair(i)}
                  aria-pressed={paired}
                  aria-label={`Superset ${exercise.name} with the next exercise`}
                  disabled={i === draft.entries.length - 1}
                >
                  <Icon name="link" size={12} color={paired ? 'var(--accent)' : undefined} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => move(i, -1)}
                  aria-label={`Move ${exercise.name} up`}
                  disabled={i === 0}
                >
                  <Icon name="arrowUp" size={12} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${exercise.name} down`}
                  disabled={i === draft.entries.length - 1}
                >
                  <Icon name="arrowUp" size={12} className="flip" />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  aria-label={`Remove ${exercise.name}`}
                  onClick={() => update(draft.entries.filter((_, j) => j !== i))}
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {!draft.entries.length && <p className="empty">Pick exercises below.</p>}
      </div>

      <div className="section-title gap-20" style={{ marginBottom: 8 }}>
        Add
      </div>
      <ExercisePicker
        exercises={exercises}
        excludeIds={draft.entries.map((e) => e.exerciseId)}
        defaultIncrement={defaultIncrement}
        unit={unit}
        onPick={(id) => update([...draft.entries, { exerciseId: id }])}
        onCreate={(exercise) => {
          onCreateExercise(exercise);
          update([...draft.entries, { exerciseId: exercise.id }]);
        }}
      />

      <button
        type="button"
        className="btn gap-20"
        disabled={!draft.name.trim() || !draft.entries.length}
        onClick={() => onSave({ ...draft, name: draft.name.trim() })}
      >
        Save routine
      </button>
      <button
        type="button"
        className="btn btn-danger btn-sm gap-16"
        onClick={() => {
          if (window.confirm(`Delete ${routine.name || 'this routine'}?`)) onDelete(routine.id);
        }}
      >
        Delete routine
      </button>
    </Sheet>
  );
}

function ExerciseSheet({
  exercise,
  onClose,
  onSave,
  onDelete,
}: {
  exercise: Exercise;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(exercise);

  return (
    <Sheet title={exercise.name || 'New exercise'} onClose={onClose}>
      <div className="stack-sm">
        <input
          className="input"
          placeholder="Exercise name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          aria-label="Exercise name"
        />
        <input
          className="input"
          placeholder="Muscle group"
          value={draft.muscleGroup}
          onChange={(e) => setDraft({ ...draft, muscleGroup: e.target.value })}
          aria-label="Muscle group"
        />
        <div className="form-row">
          <div style={{ flex: 1 }}>
            <div className="form-label">Carries your bodyweight</div>
            <div className="form-hint">
              For pull-ups and the like: the weight box records what you add on top.
            </div>
          </div>
          <button
            type="button"
            className="toggle"
            aria-pressed={Boolean(draft.bodyweightLoad)}
            onClick={() => setDraft({ ...draft, bodyweightLoad: !draft.bodyweightLoad })}
          >
            {draft.bodyweightLoad ? 'Yes' : 'No'}
          </button>
        </div>
        <div className="form-row">
          <div className="form-label">Rest between sets (s)</div>
          <NumberInput
            value={draft.restSeconds ?? null}
            onCommit={(v) => setDraft({ ...draft, restSeconds: v ?? undefined })}
            className="input input-narrow"
            allowEmpty
            placeholder="—"
            aria-label="Rest between sets in seconds"
          />
        </div>
        <input
          className="input"
          placeholder="Cue (optional)"
          value={draft.cue ?? ''}
          onChange={(e) => setDraft({ ...draft, cue: e.target.value })}
          aria-label="Cue"
        />

        <div className="form-row">
          <div className="form-label">Weight step</div>
          <NumberInput
            value={draft.increment}
            onCommit={(v) => setDraft({ ...draft, increment: v ?? 2.5 })}
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
      </div>

      <button
        type="button"
        className="btn gap-20"
        disabled={!draft.name.trim()}
        onClick={() =>
          onSave({
            ...draft,
            name: draft.name.trim(),
            muscleGroup: draft.muscleGroup.trim() || 'General',
            cue: draft.cue?.trim() || undefined,
          })
        }
      >
        Save exercise
      </button>
      <button
        type="button"
        className="btn btn-danger btn-sm gap-16"
        onClick={() => {
          if (
            window.confirm(
              `Delete ${exercise.name || 'this exercise'}? Past sessions keep their sets but lose the name.`,
            )
          ) {
            onDelete(exercise.id);
          }
        }}
      >
        Delete exercise
      </button>
    </Sheet>
  );
}
