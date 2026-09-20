import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Exercise, ID, Session, SetLog } from '../db/schema';
import { useAppData } from '../state/AppData';
import { progressionTip, suggestSets } from '../lib/progression';
import { buildSession } from '../lib/session';
import { completedSets, summarise } from '../lib/stats';
import { formatLong, weekNumber } from '../lib/dates';
import { fmtWeight } from '../lib/format';
import { Icon } from '../components/Icon';
import { SetCard } from '../components/SetCard';
import { Sheet } from '../components/Sheet';
import { ExercisePicker } from '../components/ExercisePicker';

export function LogScreen() {
  const { ready, activeSession, sessions } = useAppData();
  const [finishedId, setFinishedId] = useState<ID | null>(null);

  const session = activeSession ?? sessions.find((s) => s.id === finishedId) ?? null;

  if (!ready) {
    return (
      <>
        <div className="topbar">
          <div className="wordmark">RepWeek</div>
        </div>
        <div className="scroll">
          <p className="empty">Loading your log…</p>
        </div>
      </>
    );
  }

  if (!session) return <StartView />;

  return <ActiveLog key={session.id} session={session} onFinish={setFinishedId} />;
}

/* ---- No session running ------------------------------------------------ */

function StartView() {
  const { routines, exercises, sessions, settings, saveSession } = useAppData();
  const navigate = useNavigate();

  const start = (routineId: ID | null) => {
    const routine = routines.find((r) => r.id === routineId) ?? null;
    const session = buildSession(
      routine,
      routine?.name ?? 'Freestyle',
      routine?.exerciseIds ?? [],
      exercises,
      sessions,
      settings,
    );
    void saveSession(session);
    navigate('/log');
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-row">
          <div className="wordmark">RepWeek</div>
          <div className="avatar">A</div>
        </div>
        <div className="topbar-row" style={{ marginTop: 14, alignItems: 'baseline' }}>
          <div className="eyebrow">Start a session</div>
        </div>
      </div>

      <div className="scroll">
        <div className="stack">
          {routines
            .filter((r) => !r.archived)
            .map((routine) => (
              <button
                key={routine.id}
                type="button"
                className="row"
                onClick={() => start(routine.id)}
              >
                <div>
                  <div className="row-title">{routine.name}</div>
                  <div className="row-detail">
                    {routine.exerciseIds.length} exercises ·{' '}
                    {sessions.some(
                      (s) => s.finishedAt !== null && s.routineId === routine.id,
                    )
                      ? 'weights pre-filled'
                      : 'first time through'}
                  </div>
                </div>
                <Icon name="play" size={14} color="var(--accent)" />
              </button>
            ))}

          <button type="button" className="row card-dashed" onClick={() => start(null)}>
            <div>
              <div className="row-title">Freestyle session</div>
              <div className="row-detail">Start empty, add exercises as you go</div>
            </div>
            <Icon name="plusCircle" size={16} color="var(--text-dim)" />
          </button>
        </div>

        {!routines.length && (
          <p className="empty">
            No routines yet. Add one from the Profile tab and it will show up here.
          </p>
        )}
      </div>
    </>
  );
}

/* ---- Session running --------------------------------------------------- */

function ActiveLog({
  session,
  onFinish,
}: {
  session: Session;
  onFinish: (id: ID) => void;
}) {
  const {
    sessions,
    exercises,
    settings,
    exerciseById,
    saveSession,
    saveExercise,
    deleteSession,
  } = useAppData();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [picker, setPicker] = useState(false);

  const idx = Math.min(index, Math.max(0, session.exercises.length - 1));
  const entry = session.exercises[idx];
  const exercise = entry ? exerciseById(entry.exerciseId) : undefined;
  const isFinished = session.finishedAt !== null;

  const suggestions = useMemo(
    () => (exercise ? suggestSets(exercise, sessions, settings, session.id) : []),
    [exercise, sessions, settings, session.id],
  );
  const summary = useMemo(
    () => (exercise ? summarise(sessions, exercise.id) : null),
    [exercise, sessions],
  );
  const tip = useMemo(
    () => (exercise && suggestions.length ? progressionTip(suggestions, exercise, settings) : ''),
    [exercise, suggestions, settings],
  );

  const week = weekNumber(session.date, settings.programStart);
  const loggedSets = session.exercises.reduce(
    (sum, e) => sum + completedSets(e.sets).length,
    0,
  );
  const next = session.exercises[idx + 1];
  const nextExercise = next ? exerciseById(next.exerciseId) : undefined;

  const update = (mutate: (sets: SetLog[]) => SetLog[]) => {
    void saveSession({
      ...session,
      exercises: session.exercises.map((e, i) =>
        i === idx ? { ...e, sets: mutate(e.sets) } : e,
      ),
    });
  };

  const changeSet = (setIdx: number, patch: Partial<SetLog>) =>
    update((sets) => sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)));

  const addSet = () =>
    update((sets) => {
      const last = sets.at(-1);
      return [
        ...sets,
        {
          weight: last?.weight ?? 0,
          reps: last?.reps ?? exercise?.defaultReps ?? 8,
          rir: null,
          done: false,
        },
      ];
    });

  const removeSet = () => update((sets) => (sets.length > 1 ? sets.slice(0, -1) : sets));

  const addExercise = (added: Exercise) => {
    const sets = suggestSets(added, sessions, settings, session.id).map((s) => ({
      weight: s.weight,
      reps: s.reps,
      rir: null,
      done: false,
    }));
    void saveSession({
      ...session,
      exercises: [...session.exercises, { exerciseId: added.id, sets }],
    });
    setIndex(session.exercises.length);
    setPicker(false);
  };

  const finish = () => {
    void saveSession({ ...session, finishedAt: Date.now() });
    onFinish(session.id);
  };

  const discard = () => {
    if (!window.confirm('Discard this session? Nothing will be saved.')) return;
    void deleteSession(session.id);
    navigate('/');
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-row">
          <div className="wordmark">RepWeek</div>
          <div className="avatar">A</div>
        </div>
        <div className="topbar-row" style={{ marginTop: 14, alignItems: 'baseline' }}>
          <div className="eyebrow">
            {session.routineName} · Week {week}
          </div>
          <div className="datestamp">{formatLong(session.date)}</div>
        </div>
        <div className="dots">
          {session.exercises.map((e, i) => {
            const done = e.sets.length > 0 && e.sets.every((s) => s.done);
            const cls = i === idx ? 'dot active' : done ? 'dot complete' : 'dot';
            return (
              <button
                key={e.exerciseId}
                type="button"
                className={cls}
                aria-current={i === idx}
                aria-label={`Go to ${exerciseById(e.exerciseId)?.name ?? 'exercise'} (${i + 1} of ${session.exercises.length})`}
                onClick={() => setIndex(i)}
              />
            );
          })}
        </div>
      </div>

      <div className="scroll">
        {!exercise || !entry ? (
          <p className="empty">
            This session has no exercises yet.
            <br />
            Add the first one below.
          </p>
        ) : (
          <>
            <div className="spread" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h1 className="title">{exercise.name}</h1>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="chip">{exercise.muscleGroup}</span>
                  {summary && summary.currentE1RM > 0 && (
                    <span className="chip chip-mono">
                      Est. 1RM ~{fmtWeight(summary.currentE1RM)}
                      {settings.unit}
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={`/history/${exercise.id}`}
                className="chip chip-button"
                aria-label={`View history for ${exercise.name}`}
                style={{ marginTop: 2 }}
              >
                <Icon name="clock" size={13} />
                History
              </Link>
            </div>

            {exercise.cue && (
              <div className="cue">
                <Icon name="info" size={13} color="var(--text-dim)" />
                <span>{exercise.cue}</span>
              </div>
            )}

            <div className="stack">
              {entry.sets.map((set, i) => (
                <SetCard
                  key={i}
                  index={i}
                  set={set}
                  suggestion={suggestions[i]}
                  exercise={exercise}
                  settings={settings}
                  onChange={(patch) => changeSet(i, patch)}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, margin: '10px 0 14px' }}>
              <button type="button" className="chip chip-button" onClick={addSet}>
                <Icon name="plus" size={12} /> Add set
              </button>
              {entry.sets.length > 1 && (
                <button type="button" className="chip chip-button" onClick={removeSet}>
                  <Icon name="minus" size={12} /> Remove last
                </button>
              )}
            </div>

            {tip && (
              <div className="tip" style={{ marginBottom: 12 }}>
                <Icon name="info" size={16} color="var(--accent)" />
                <div className="tip-body">{tip}</div>
              </div>
            )}

            {nextExercise && (
              <button
                type="button"
                className="row card-dashed"
                style={{ marginBottom: 12 }}
                onClick={() => setIndex(idx + 1)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="label">Next</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {nextExercise.name}
                  </span>
                </div>
                <Icon name="chevronRight" size={14} color="var(--text-dim)" />
              </button>
            )}
          </>
        )}

        {isFinished ? (
          <>
            <div className="confirm-banner">
              <Icon name="check" size={15} strokeWidth={3} />
              Workout Logged
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-16"
              onClick={() => navigate('/')}
            >
              Back to home
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn"
              onClick={finish}
              disabled={loggedSets === 0}
            >
              Finish Workout
            </button>
            {loggedSets === 0 && (
              <p className="note" style={{ textAlign: 'center', marginTop: 8 }}>
                Tick off at least one set to finish.
              </p>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-16"
              onClick={() => setPicker(true)}
            >
              Add an exercise
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost gap-16"
              style={{ color: 'var(--text-dim)' }}
              onClick={discard}
            >
              Discard session
            </button>
          </>
        )}
      </div>

      {picker && (
        <Sheet title="Add exercise" onClose={() => setPicker(false)}>
          <ExercisePicker
            exercises={exercises}
            excludeIds={session.exercises.map((x) => x.exerciseId)}
            defaultIncrement={settings.defaultIncrement}
            unit={settings.unit}
            onPick={(id) => {
              const found = exercises.find((e) => e.id === id);
              if (found) addExercise(found);
            }}
            onCreate={(exercise) => {
              void saveExercise(exercise);
              addExercise(exercise);
            }}
          />
        </Sheet>
      )}
    </>
  );
}
