import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const week = useMemo(() => weekSummary(sessions, today), [sessions, today]);
  const streak = useMemo(() => weekStreak(sessions, today), [sessions, today]);

  const active = routines.filter((r) => !r.archived);
  const nextId = useMemo(
    () => suggestNextRoutine(sessions, active.map((r) => r.id)),
    [sessions, active],
  );
  const nextRoutine = active.find((r) => r.id === nextId) ?? active[0] ?? null;

  const recent = sessions.filter((s) => s.finishedAt !== null).slice(0, 3);

  const start = () => {
    if (!nextRoutine) return;
    void saveSession(
      buildSession(
        nextRoutine,
        nextRoutine.name,
        nextRoutine.exerciseIds,
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
                  {nextRoutine.exerciseIds.length} exercises ·{' '}
                  {sessions.some((s) => s.finishedAt !== null && s.routineId === nextRoutine.id)
                    ? 'weights pre-filled from last time'
                    : 'first time through'}
                </div>
                <button type="button" className="btn btn-sm gap-16" onClick={start}>
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
                        {fmtVolume(sessionVolume(session))}
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
