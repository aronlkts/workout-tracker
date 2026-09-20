import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../state/AppData';
import { completedSets, summarise, type ExercisePoint } from '../lib/stats';
import { formatShort, weekNumber } from '../lib/dates';
import { fmtDelta, fmtRIR, fmtWeight, plural } from '../lib/format';
import { BarChart, type Bar } from '../components/BarChart';
import { StatTile } from '../components/StatTile';
import { Icon } from '../components/Icon';

const WINDOW = 6;

export function ExerciseScreen() {
  const { exerciseId = '' } = useParams();
  const navigate = useNavigate();
  const { sessions, routines, settings, exerciseById } = useAppData();

  const exercise = exerciseById(exerciseId);
  const summary = useMemo(() => summarise(sessions, exerciseId), [sessions, exerciseId]);

  const recent = summary.points.slice(-WINDOW);

  // Hangs, leg raises and jumps carry no load, so weight-based figures are
  // meaningless for them; reps are what actually progresses.
  const bodyweight = summary.sessionCount > 0 && summary.bestE1RM === 0;
  const latestReps = summary.latestTopSet?.reps ?? 0;
  const previousReps = summary.points.at(-2)?.topSet?.reps ?? 0;
  const repsDelta = summary.points.length > 1 ? latestReps - previousReps : 0;

  const bars: Bar[] = recent
    .filter((p) => p.topSet)
    .map((p) => ({
      key: p.sessionId,
      label: `W${weekNumber(p.date, settings.programStart)}`,
      value: bodyweight ? p.topSet!.reps : p.topSet!.weight,
      caption: bodyweight ? String(p.topSet!.reps) : fmtWeight(p.topSet!.weight),
    }));

  const routine = routines.find((r) => r.entries.some((e) => e.exerciseId === exerciseId));

  if (!exercise) {
    return (
      <>
        <div className="topbar">
          <div className="wordmark">RepWeek</div>
        </div>
        <div className="scroll">
          <p className="empty">That exercise no longer exists.</p>
        </div>
      </>
    );
  }

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
          <h1 className="title-sm">{exercise.name}</h1>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2, fontWeight: 500 }}>
            {exercise.muscleGroup}
            {routine ? ` · ${routine.name}` : ''}
          </div>
        </div>
      </div>

      <div className="scroll">
        {summary.sessionCount === 0 ? (
          <p className="empty">
            Nothing logged for {exercise.name} yet.
            <br />
            Finish a session with this lift and the numbers land here.
          </p>
        ) : (
          <>
            <div className="tiles">
              {bodyweight ? (
                <StatTile
                  label="Top Reps"
                  value={String(latestReps)}
                  sub={repsDelta ? `${fmtDelta(repsDelta)} reps` : 'no change'}
                  highlight={repsDelta > 0}
                />
              ) : (
                <StatTile
                  label="Est. 1RM"
                  value={`${fmtWeight(summary.currentE1RM)}${settings.unit}`}
                  sub={
                    summary.e1rmDelta
                      ? `${fmtDelta(summary.e1rmDelta)}${settings.unit}`
                      : 'no change'
                  }
                  highlight={summary.e1rmDelta > 0}
                />
              )}
              <StatTile
                label="Top Set"
                value={
                  !summary.latestTopSet
                    ? '—'
                    : bodyweight
                      ? `${summary.latestTopSet.reps} reps`
                      : `${fmtWeight(summary.latestTopSet.weight)} × ${summary.latestTopSet.reps}`
                }
                sub={
                  summary.latestAvgRIR !== null
                    ? `RIR ${fmtRIR(summary.latestAvgRIR)}`
                    : 'RIR not logged'
                }
              />
              <StatTile
                label="Sessions"
                value={String(summary.sessionCount)}
                sub={summary.firstDate ? `since ${formatShort(summary.firstDate)}` : undefined}
              />
            </div>

            {bars.length > 1 && (
              <>
                <div className="spread gap-20" style={{ alignItems: 'baseline', marginBottom: 12 }}>
                  <span className="section-title">
                    {bodyweight ? 'Top set reps' : 'Top set weight'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>
                    last {bars.length} {plural(bars.length, 'session')}
                  </span>
                </div>
                <div className="card" style={{ padding: '16px 14px 12px' }}>
                  <BarChart bars={bars} />
                </div>
                <p className="note" style={{ margin: '8px 2px 0' }}>
                  {trendLine(recent, settings.programStart, settings.unit, bodyweight)}
                </p>
              </>
            )}

            <div className="section-title gap-24" style={{ marginBottom: 10 }}>
              Session log
            </div>
            <div className="stack">
              {[...summary.points]
                .reverse()
                .slice(0, 10)
                .map((point, i, list) => {
                  const older = list[i + 1];
                  const delta =
                    point.topSet && older?.topSet
                      ? point.topSet.weight - older.topSet.weight
                      : null;
                  return (
                    <div className="row" key={point.sessionId}>
                      <div>
                        <div className="row-title">
                          Week {weekNumber(point.date, settings.programStart)} ·{' '}
                          {formatShort(point.date)}
                        </div>
                        <div className="row-detail">{describe(point, settings.unit)}</div>
                      </div>
                      {delta !== null && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: delta > 0 ? 'var(--accent)' : 'var(--text-dim)',
                          }}
                        >
                          <Icon
                            name={delta === 0 ? 'minus' : 'arrowUp'}
                            size={11}
                            strokeWidth={2.5}
                            className={delta < 0 ? 'flip' : undefined}
                          />
                          <span style={{ fontWeight: 700, fontSize: 11 }}>
                            {delta === 0
                              ? 'Hold'
                              : `${fmtDelta(delta)}${settings.unit}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function describe(point: ExercisePoint, unit: string): string {
  const done = completedSets(point.sets);
  const reps = new Set(done.map((s) => s.reps));
  const shape = reps.size === 1 ? `${done.length}×${[...reps][0]}` : `${done.length} sets`;
  const weight =
    point.topSet && point.topSet.weight > 0
      ? ` @ ${fmtWeight(point.topSet.weight)}${unit}`
      : '';
  const rir = point.avgRIR !== null ? ` · avg RIR ${fmtRIR(point.avgRIR)}` : '';
  return `${shape}${weight}${rir}`;
}

function trendLine(
  points: ExercisePoint[],
  programStart: string,
  unit: string,
  bodyweight: boolean,
): string {
  const first = points[0];
  const last = points.at(-1);
  if (!first?.topSet || !last?.topSet || first === last) return '';

  const since = `Week ${weekNumber(first.date, programStart)}`;
  const delta = bodyweight
    ? last.topSet.reps - first.topSet.reps
    : last.topSet.weight - first.topSet.weight;
  const amount = bodyweight
    ? `${Math.abs(delta)} ${plural(Math.abs(delta), 'rep')}`
    : `${fmtWeight(Math.abs(delta))}${unit}`;

  if (delta > 0) return `Up ${amount} on the top set since ${since}.`;
  if (delta < 0) return `Down ${amount} on the top set since ${since}.`;
  return `Top set unchanged since ${since} — time to push reps or add a set.`;
}
