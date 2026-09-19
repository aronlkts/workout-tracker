import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../state/AppData';
import { sessionSetCount, sessionVolume, summarise } from '../lib/stats';
import { formatShort, relativeLabel, weekNumber } from '../lib/dates';
import { fmtDelta, fmtVolume, fmtWeight, plural } from '../lib/format';
import { Icon } from '../components/Icon';

type Tab = 'lifts' | 'sessions';

export function HistoryScreen() {
  const { sessions, exercises, settings } = useAppData();
  const [tab, setTab] = useState<Tab>('lifts');

  const lifts = useMemo(
    () =>
      exercises
        .map((exercise) => ({ exercise, summary: summarise(sessions, exercise.id) }))
        .filter((row) => row.summary.sessionCount > 0)
        .sort((a, b) => (b.summary.lastDate ?? '').localeCompare(a.summary.lastDate ?? '')),
    [exercises, sessions],
  );

  const done = sessions.filter((s) => s.finishedAt !== null);

  return (
    <>
      <div className="topbar">
        <div className="topbar-row">
          <h1 className="title-sm">Progress</h1>
          <div className="datestamp">
            {done.length} {plural(done.length, 'session')}
          </div>
        </div>
      </div>

      <div className="scroll">
        <div className="segmented" role="tablist" aria-label="History view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'lifts'}
            onClick={() => setTab('lifts')}
          >
            Lifts
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'sessions'}
            onClick={() => setTab('sessions')}
          >
            Sessions
          </button>
        </div>

        {tab === 'lifts' ? (
          lifts.length ? (
            <div className="stack">
              {lifts.map(({ exercise, summary }) => (
                <Link className="row" key={exercise.id} to={`/history/${exercise.id}`}>
                  <div>
                    <div className="row-title">{exercise.name}</div>
                    <div className="row-detail">
                      {summary.latestTopSet
                        ? `${fmtWeight(summary.latestTopSet.weight)}${settings.unit} × ${summary.latestTopSet.reps}`
                        : '—'}{' '}
                      · {summary.sessionCount} {plural(summary.sessionCount, 'session')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="mono"
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
                    >
                      {fmtWeight(summary.currentE1RM)}
                      {settings.unit}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        marginTop: 2,
                        color:
                          summary.e1rmDelta > 0 ? 'var(--accent)' : 'var(--text-dim)',
                      }}
                    >
                      {summary.e1rmDelta
                        ? `${fmtDelta(summary.e1rmDelta)}${settings.unit}`
                        : 'est. 1RM'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">
              No finished sessions yet. Once you log a lift, its estimated 1RM and trend show
              up here.
            </p>
          )
        ) : done.length ? (
          <div className="stack">
            {done.map((session) => (
              <Link className="row" key={session.id} to={`/session/${session.id}`}>
                <div>
                  <div className="row-title">
                    {session.routineName} · Week{' '}
                    {weekNumber(session.date, settings.programStart)}
                  </div>
                  <div className="row-detail">
                    {formatShort(session.date)} · {sessionSetCount(session)}{' '}
                    {plural(sessionSetCount(session), 'set')} ·{' '}
                    {fmtVolume(sessionVolume(session))}
                    {settings.unit}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="note">{relativeLabel(session.date)}</div>
                  <Icon name="chevronRight" size={14} color="var(--text-dim)" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty">No sessions logged yet.</p>
        )}
      </div>
    </>
  );
}
