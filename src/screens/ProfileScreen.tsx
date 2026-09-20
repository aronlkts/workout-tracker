import { useEffect, useRef, useState } from 'react';
import type { Backup, Exercise, Routine, Settings } from '../db/schema';
import { newId } from '../db/schema';
import { useAppData } from '../state/AppData';
import { storageEstimate } from '../db/store';
import { todayISO } from '../lib/dates';
import { plural } from '../lib/format';
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
              setEditingRoutine({ id: newId(), name: '', exerciseIds: [], archived: false })
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
                  {routine.exerciseIds.length} {plural(routine.exerciseIds.length, 'exercise')}
                </div>
              </div>
              <Icon name="edit" size={14} color="var(--text-dim)" />
            </button>
          ))}
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
  const [draft, setDraft] = useState(routine);
  const chosen = draft.exerciseIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is Exercise => Boolean(e));

  const move = (index: number, delta: number) => {
    const next = draft.exerciseIds.slice();
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft({ ...draft, exerciseIds: next });
  };

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
        {chosen.map((exercise, i) => (
          <div className="row" key={exercise.id}>
            <div className="row-title">{exercise.name}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(i, -1)}
                aria-label={`Move ${exercise.name} up`}
                disabled={i === 0}
              >
                <Icon name="arrowUp" size={13} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(i, 1)}
                aria-label={`Move ${exercise.name} down`}
                disabled={i === chosen.length - 1}
              >
                <Icon name="arrowUp" size={13} className="flip" />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${exercise.name}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    exerciseIds: draft.exerciseIds.filter((id) => id !== exercise.id),
                  })
                }
              >
                <Icon name="close" size={13} />
              </button>
            </div>
          </div>
        ))}
        {!chosen.length && <p className="empty">Pick exercises below.</p>}
      </div>

      <div className="section-title gap-20" style={{ marginBottom: 8 }}>
        Add
      </div>
      <ExercisePicker
        exercises={exercises}
        excludeIds={draft.exerciseIds}
        defaultIncrement={defaultIncrement}
        unit={unit}
        onPick={(id) => setDraft({ ...draft, exerciseIds: [...draft.exerciseIds, id] })}
        onCreate={(exercise) => {
          onCreateExercise(exercise);
          setDraft({ ...draft, exerciseIds: [...draft.exerciseIds, exercise.id] });
        }}
      />

      <button
        type="button"
        className="btn gap-20"
        disabled={!draft.name.trim() || !draft.exerciseIds.length}
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
