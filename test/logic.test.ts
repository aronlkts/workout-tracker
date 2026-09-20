import test from 'node:test';
import assert from 'node:assert/strict';

import { estimate1RM, weightForReps, summarise, topSet, volume, sessionSetCount } from '../src/lib/stats';
import { suggestSets, progressionTip } from '../src/lib/progression';
import { weekNumber, startOfWeek, daysBetween } from '../src/lib/dates';
import { weekStreak, weekSummary, suggestNextRoutine } from '../src/lib/overview';
import { listRanges, fmtWeight } from '../src/lib/format';
import { DEFAULT_SETTINGS, type Exercise, type Session, type SetLog } from '../src/db/schema';

const settings = { ...DEFAULT_SETTINGS, programStart: '2026-07-02' };

const bench: Exercise = {
  id: 'bench',
  name: 'Barbell Bench Press',
  muscleGroup: 'Chest',
  increment: 2.5,
  defaultSets: 4,
  defaultReps: 8,
  archived: false,
  createdAt: 0,
};

const set = (weight: number, reps: number, rir: number | null): SetLog => ({
  weight,
  reps,
  rir,
  done: true,
});

const session = (id: string, date: string, sets: SetLog[]): Session => ({
  id,
  routineId: 'push',
  routineName: 'Push Day',
  date,
  startedAt: Date.parse(`${date}T18:00:00Z`),
  finishedAt: Date.parse(`${date}T19:00:00Z`),
  exercises: [{ exerciseId: 'bench', sets }],
});

test('Epley counts reps left in reserve as reps to failure', () => {
  // 8 reps with 2 left = 10 to failure: 80 * (1 + 10/30)
  assert.equal(estimate1RM(80, 8, 2).toFixed(1), '106.7');
  // The same load taken to failure at 8 is a smaller estimate.
  assert.equal(estimate1RM(80, 8, 0).toFixed(1), '101.3');
  // A true single is its own max, not an extrapolation.
  assert.equal(estimate1RM(100, 1, 0), 100);
  // Missing RIR is read as "taken to failure".
  assert.equal(estimate1RM(80, 8, null), estimate1RM(80, 8, 0));
  assert.equal(estimate1RM(0, 8, 2), 0);
});

test('weightForReps inverts the estimate', () => {
  const oneRM = estimate1RM(80, 8, 2);
  assert.equal(weightForReps(oneRM, 8, 2).toFixed(2), '80.00');
});

test('sets with reps in reserve earn weight, hard sets hold', () => {
  const history = [
    session('s1', '2026-09-17', [
      set(80, 8, 2), // easy  -> +2.5
      set(80, 8, 3), // easy  -> +2.5
      set(80, 7, 1), // hard  -> hold
      set(80, 6, 0), // hard  -> hold
    ]),
  ];

  const suggestions = suggestSets(bench, history, settings);
  assert.deepEqual(
    suggestions.map((s) => s.action),
    ['increase', 'increase', 'hold', 'hold'],
  );
  assert.deepEqual(
    suggestions.map((s) => s.weight),
    [82.5, 82.5, 80, 80],
  );
  assert.equal(suggestions[0].badge, '+2.5kg');
  assert.equal(suggestions[2].badge, 'Hold');
  assert.equal(suggestions[0].lastLabel, '80kg × 8 @ RIR 2');
});

test('an unrated set keeps its weight and says why', () => {
  const history = [session('s1', '2026-09-17', [set(60, 10, null)])];
  const [first] = suggestSets(bench, history, settings);
  assert.equal(first.action, 'repeat');
  assert.equal(first.weight, 60);
  assert.equal(first.badge, 'No RIR');
});

test('a lift with no history suggests a blank first session', () => {
  const suggestions = suggestSets(bench, [], settings);
  assert.equal(suggestions.length, bench.defaultSets);
  assert.ok(suggestions.every((s) => s.action === 'first' && s.lastLabel === null));
});

test('an unfinished session is not treated as history', () => {
  const open = { ...session('open', '2026-09-24', [set(999, 5, 5)]), finishedAt: null };
  const history = [session('s1', '2026-09-17', [set(80, 8, 2)]), open];
  const [first] = suggestSets(bench, history, settings, 'open');
  assert.equal(first.weight, 82.5);
});

test('the tip names which sets go up and which hold', () => {
  const history = [
    session('s1', '2026-09-17', [set(80, 8, 2), set(80, 8, 2), set(80, 7, 1), set(80, 6, 0)]),
  ];
  const tip = progressionTip(suggestSets(bench, history, settings), bench, settings);
  assert.match(tip, /Sets 1–2 stayed at RIR 2\+ last time — try \+2\.5kg today\./);
  assert.match(tip, /Sets 3–4 hit RIR 0–1 — hold the weight and chase reps instead\./);
});

test('summary tracks the estimated max and its change', () => {
  const history = [
    session('s1', '2026-09-04', [set(77.5, 8, 2)]),
    session('s2', '2026-09-11', [set(80, 8, 2)]),
    session('s3', '2026-09-18', [set(82.5, 8, 2)]),
  ];
  const summary = summarise(history, 'bench');
  assert.equal(summary.sessionCount, 3);
  assert.equal(summary.firstDate, '2026-09-04');
  assert.equal(summary.currentE1RM.toFixed(1), '110.0');
  assert.equal(summary.e1rmDelta.toFixed(2), '3.33');
  assert.equal(summary.heaviestSet?.weight, 82.5);
});

test('incomplete sets are excluded from every statistic', () => {
  const sets: SetLog[] = [set(80, 8, 2), { weight: 100, reps: 8, rir: 0, done: false }];
  assert.equal(volume(sets), 640);
  assert.equal(topSet(sets)?.weight, 80);
});

test('week numbers count from the program start', () => {
  assert.equal(weekNumber('2026-07-02', '2026-07-02'), 1);
  assert.equal(weekNumber('2026-07-08', '2026-07-02'), 1);
  assert.equal(weekNumber('2026-07-09', '2026-07-02'), 2);
  assert.equal(weekNumber('2026-09-17', '2026-07-02'), 12);
  // A session logged the day before the block starts is still week 1.
  assert.equal(weekNumber('2026-09-20', '2026-09-21'), 1);
  assert.equal(weekNumber('2026-08-01', '2026-09-21'), 1);
});

test('local dates do not drift across timezones', () => {
  assert.equal(daysBetween('2026-03-28', '2026-03-30'), 2);
  assert.equal(startOfWeek('2026-09-20'), '2026-09-14'); // Sunday -> that Monday
  assert.equal(startOfWeek('2026-09-14'), '2026-09-14');
});

test('the streak counts consecutive training weeks and survives a fresh week', () => {
  const weeks = [
    session('a', '2026-09-01', [set(80, 8, 2)]),
    session('b', '2026-09-08', [set(80, 8, 2)]),
    session('c', '2026-09-15', [set(80, 8, 2)]),
  ];
  // Nothing logged yet in the week of the 21st: last week still counts.
  assert.equal(weekStreak(weeks, '2026-09-22'), 3);
  // A gap week breaks it.
  assert.equal(weekStreak(weeks, '2026-09-29'), 0);
  assert.equal(weekSummary(weeks, '2026-09-15').sessions, 1);
  assert.equal(weekSummary(weeks, '2026-09-15').volume, 640);
});

test('the least recently trained routine comes up next', () => {
  const history: Session[] = [
    { ...session('a', '2026-09-15', [set(80, 8, 2)]), routineId: 'push' },
    { ...session('b', '2026-09-16', [set(80, 8, 2)]), routineId: 'pull' },
  ];
  assert.equal(suggestNextRoutine(history, ['push', 'pull', 'legs']), 'legs');
  assert.equal(suggestNextRoutine(history, ['push', 'pull']), 'push');
});

test('formatting keeps half plates and drops empty decimals', () => {
  assert.equal(fmtWeight(80), '80');
  assert.equal(fmtWeight(82.5), '82.5');
  assert.equal(listRanges([1, 2, 4]), '1–2 and 4');
  assert.equal(listRanges([3]), '3');
});

test('two sessions on one day are ordered by the clock, not by array position', () => {
  const morning = session('am', '2026-09-19', [set(80, 8, 2)]);
  const evening = {
    ...session('pm', '2026-09-19', [set(90, 8, 2)]),
    startedAt: morning.startedAt + 3_600_000,
  };
  // Stored newest-first, the way the app holds them.
  const summary = summarise([evening, morning], 'bench');
  assert.equal(summary.sessionCount, 2);
  assert.equal(summary.latestTopSet?.weight, 90);
  assert.ok(summary.e1rmDelta > 0, 'the later session should read as the current one');
});

test('bodyweight sets are logged, counted and progressed by reps', () => {
  const hang: Exercise = { ...bench, id: 'hang', name: 'Hanging Leg Raise', defaultSets: 3 };
  const bw = (reps: number, rir: number | null): SetLog => ({ weight: 0, reps, rir, done: true });
  const history = [
    { ...session('s1', '2026-09-17', [bw(10, 2), bw(9, 1)]), exercises: [{ exerciseId: 'hang', sets: [bw(10, 2), bw(9, 1)] }] },
  ];

  // The session must be finishable: it counts as logged work.
  assert.equal(sessionSetCount(history[0]), 2);

  const summary = summarise(history, 'hang');
  assert.equal(summary.sessionCount, 1, 'bodyweight work should appear in history');
  assert.equal(summary.currentE1RM, 0, 'no load means no meaningful 1RM');
  assert.equal(summary.latestTopSet?.reps, 10, 'top set falls back to the most reps');

  const [first, second] = suggestSets(hang, history, settings);
  assert.equal(first.action, 'increase');
  assert.equal(first.weight, 0, 'must not invent load on a bodyweight lift');
  assert.equal(first.reps, 11, 'progression is an extra rep');
  assert.equal(first.badge, '+1 rep');
  assert.equal(first.lastLabel, '10 reps @ RIR 2');
  assert.equal(second.action, 'hold');

  const tip = progressionTip(suggestSets(hang, history, settings), hang, settings);
  assert.match(tip, /try one more rep today/);
  assert.doesNotMatch(tip, /kg/);
});

test('loaded sets still progress by weight after the bodyweight change', () => {
  const history = [session('s1', '2026-09-17', [set(80, 8, 2)])];
  const [first] = suggestSets(bench, history, settings);
  assert.equal(first.weight, 82.5);
  assert.equal(first.badge, '+2.5kg');
});
