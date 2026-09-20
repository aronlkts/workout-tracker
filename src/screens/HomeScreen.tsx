import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Routine } from '../db/schema';
import { useAppData } from '../state/AppData';
import { buildSession } from '../lib/session';
import { suggestNextRoutine, weekStreak, weekSummary } from '../lib/overview';
import { sessionSetCount, sessionVolume } from '../lib/stats';
import { formatLong, relativeLabel, todayISO, weekNumber } from '../lib/dates';
import { fmtVolume, plural } from '../lib/format';
import { Icon } from '../components/Icon';
import { StatTile } from '../components/StatTile';

export function HomeScreen() {
  const {
    ready,
    sessions,
    routines,
    exercises,
    settings,
    activeSession,
    saveSession,
  } = useAppData();
  const navigate = useNavigate();

  const today = todayISO();
  const bodyweightIds = useMemo(
    () => new Set(exercises.filter((e) => e.bodyweightLoad).map((e) => e.id)),
    [exercises],
  );
  const week = useMemo(
    () => weekSummary(sessions, today, bodyweightIds, settings.bodyweight),
    [sessions, today, bodyweightIds, settings.bodyweight],
  );
  const streak = useMemo(() => weekStreak(sessions, today), [sessions, today]);

  const active = routines.filter((r) => !r.archived);
  const nextId = useMemo(
    () => suggestNextRoutine(sessions, active.map((r) => r.id)),
    [sessions, active],
  );
  const nextRoutine = active.find((r) => r.id === nextId) ?? active[0] ?? null;

  const recent = sessions.filter((s) => s.finishedAt !== null).slice(0, 3);
  const others = active.filter((r) => r.id !== nextRoutine?.id);

  // When each routine was last trained, so picking today's is an informed choice.
  const lastTrained = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sessions) {
      if (s.finishedAt === null || !s.routineId) continue;
      const seen = map.get(s.routineId);
      if (!seen || s.date > seen) map.set(s.routineId, s.date);
    }
    return map;
  }, [sessions]);

  const start = (routine: Routine | null) => {
    void saveSession(
      buildSession(
        routine,
        routine?.name ?? 'Freestyle',
        routine?.entries.map((e) => e.exerciseId) ?? [],
        exercises,
        sessions,
        settings,
      ),
    );
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
          <div className="eyebrow">Week {weekNumber(today, settings.programStart)}</div>
          <div className="datestamp">{formatLong(today)}</div>
        </div>
      </div>

      <div className="scroll">
        {!ready ? (
          <p className="empty">Loading…</p>
        ) : (
          <>
            {activeSession ? (
              <div className="card" style={{ padding: '16px 16px 14px' }}>
                <div className="eyebrow" style={{ color: 'var(--accent)' }}>
                  Session in progress
                </div>
                <div className="title gap-16" style={{ marginTop: 6 }}>
                  {activeSession.routineName}
                </div>
                <div className="row-detail">
                  {sessionSetCount(activeSession)} {plural(sessionSetCount(activeSession), 'set')}{' '}
                  logged · started {relativeLabel(activeSession.date, today).toLowerCase()}
                </div>
                <button
                  type="button"
                  className="btn btn-sm gap-16"
                  onClick={() => navigate('/log')}
                >
                  Resume session
                </button>
              </div>
            ) : nextRoutine ? (
              <div className="card" style={{ padding: '16px 16px 14px' }}>
                <div className="eyebrow">Up next</div>
                <div className="title" style={{ marginTop: 6 }}>
                  {nextRoutine.name}
                </div>
                <div className="row-detail">
                  {nextRoutine.entries.length} exercises ·{' '}
                  {sessions.some((s) => s.finishedAt !== null && s.routineId === nextRoutine.id)
                    ? 'weights pre-filled from last time'
                    : 'first time through'}
                </div>
                <button
                  type="button"
                  className="btn btn-sm gap-16"
                  onClick={() => start(nextRoutine)}
                >
                  Start workout
                </button>
              </div>
            ) : (
              <div className="card">
                <div className="row-title">No routines yet</div>
                <div className="form-hint">
                  Build one in Profile → Routines, then it will be waiting here.
                </div>
              </div>
            )}

            {!activeSession && (
              <>
                <div className="section-title gap-24" style={{ marginBottom: 10 }}>
                  {nextRoutine ? 'Or train something else' : 'Start a session'}
                </div>
                <div className="stack">
                  {others.map((routine) => {
                    const last = lastTrained.get(routine.id);
                    return (
                      <button
                        key={routine.id}
                        type="button"
                        className="row"
                        onClick={() => start(routine)}
                      >
                        <div>
                          <div className="row-title">{routine.name}</div>
                          <div className="row-detail">
                            {routine.entries.length}{' '}
                            {plural(routine.entries.length, 'exercise')} ·{' '}
                            {last ? relativeLabel(last, today).toLowerCase() : 'not trained yet'}
                          </div>
                        </div>
                        <Icon name="play" size={14} color="var(--accent)" />
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className="row card-dashed"
                    onClick={() => start(null)}
                  >
                    <div>
                      <div className="row-title">Freestyle session</div>
                      <div className="row-detail">Start empty, add exercises as you go</div>
                    </div>
                    <Icon name="plusCircle" size={16} color="var(--text-dim)" />
                  </button>
                </div>
              </>
            )}

            <div className="tiles gap-20">
              <StatTile
                label="This week"
                value={String(week.sessions)}
                sub={plural(week.sessions, 'session')}
              />
              <StatTile
                label="Volume"
                value={fmtVolume(week.volume)}
                sub={`${settings.unit} lifted`}
              />
              <StatTile
                label="Streak"
                value={String(streak)}
                sub={plural(streak, 'week')}
                highlight={streak > 1}
              />
            </div>

            <div className="spread gap-24" style={{ marginBottom: 10 }}>
              <span className="section-title">Recent sessions</span>
              <Link to="/history" className="note">
                All
              </Link>
            </div>

            {recent.length ? (
              <div className="stack">
                {recent.map((session) => (
                  <Link className="row" key={session.id} to={`/session/${session.id}`}>
                    <div>
                      <div className="row-title">{session.routineName}</div>
                      <div className="row-detail">
                        {relativeLabel(session.date, today)} · {sessionSetCount(session)}{' '}
                        {plural(sessionSetCount(session), 'set')} ·{' '}
                        {fmtVolume(sessionVolume(session, bodyweightIds, settings.bodyweight))}
                        {settings.unit}
                      </div>
                    </div>
                    <Icon name="chevronRight" size={14} color="var(--text-dim)" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty">
                Nothing logged yet. Start your first session and the numbers build from there.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
