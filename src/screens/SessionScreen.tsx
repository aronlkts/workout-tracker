import { useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../state/AppData';
import {
  averageRIR,
  bestE1RM,
  completedSets,
  sessionSetCount,
  sessionVolume,
  volume,
} from '../lib/stats';
import { formatLong, weekNumber } from '../lib/dates';
import { fmtRIR, fmtVolume, fmtWeight, plural } from '../lib/format';
import { Icon } from '../components/Icon';
import { StatTile } from '../components/StatTile';

export function SessionScreen() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const { sessions, settings, activeSession, exerciseById, saveSession, deleteSession } =
    useAppData();

  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <>
        <div className="topbar">
          <div className="wordmark">RepWeek</div>
        </div>
        <div className="scroll">
          <p className="empty">That session is gone.</p>
        </div>
      </>
    );
  }

  const remove = () => {
    if (!window.confirm('Delete this session for good?')) return;
    void deleteSession(session.id);
    navigate('/history');
  };

  const reopen = () => {
    if (activeSession && activeSession.id !== session.id) {
      window.alert('Finish or discard the session you have running first.');
      return;
    }
    void saveSession({ ...session, finishedAt: null });
    navigate('/log');
  };

  return (
    <>
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <Icon name="chevronLeft" size={15} />
        </button>
        <div>
          <h1 className="title-sm">{session.routineName}</h1>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2, fontWeight: 500 }}>
            Week {weekNumber(session.date, settings.programStart)} · {formatLong(session.date)}
          </div>
        </div>
      </div>

      <div className="scroll">
        <div className="tiles">
          <StatTile label="Sets" value={String(sessionSetCount(session))} />
          <StatTile
            label="Volume"
            value={fmtVolume(sessionVolume(session))}
            sub={settings.unit}
          />
          <StatTile
            label="Exercises"
            value={String(session.exercises.filter((e) => completedSets(e.sets).length).length)}
          />
        </div>

        <div className="stack gap-20">
          {session.exercises.map((entry) => {
            const exercise = exerciseById(entry.exerciseId);
            const done = completedSets(entry.sets);
            if (!done.length) return null;
            const rir = averageRIR(entry.sets);

            return (
              <div className="card" key={entry.exerciseId}>
                <div className="spread" style={{ marginBottom: 8 }}>
                  <div className="row-title">{exercise?.name ?? 'Removed exercise'}</div>
                  <span className="badge">
                    {fmtWeight(bestE1RM(entry.sets))}
                    {settings.unit} e1RM
                  </span>
                </div>
                {done.map((set, i) => (
                  <div className="set-line" key={i}>
                    <span>Set {i + 1}</span>
                    <span style={{ color: 'var(--text)' }}>
                      {fmtWeight(set.weight)}
                      {settings.unit} × {set.reps}
                      {set.rir !== null ? ` @ RIR ${set.rir}` : ''}
                    </span>
                  </div>
                ))}
                <div className="note" style={{ marginTop: 8 }}>
                  {fmtVolume(volume(entry.sets))}
                  {settings.unit} volume
                  {rir !== null ? ` · avg RIR ${fmtRIR(rir)}` : ''} ·{' '}
                  {done.length} {plural(done.length, 'set')}
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" className="btn btn-ghost btn-sm gap-24" onClick={reopen}>
          Reopen to edit
        </button>
        <button type="button" className="btn btn-danger btn-sm gap-16" onClick={remove}>
          Delete session
        </button>
      </div>
    </>
  );
}
