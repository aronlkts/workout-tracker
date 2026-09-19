import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Backup, Exercise, ID, Routine, Session, Settings } from '../db/schema';
import { DEFAULT_SETTINGS } from '../db/schema';
import { buildSeed } from '../db/seed';
import * as store from '../db/store';
import { todayISO } from '../lib/dates';

interface AppDataValue {
  ready: boolean;
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  settings: Settings;
  activeSession: Session | null;
  exerciseById: (id: ID) => Exercise | undefined;
  saveExercise: (exercise: Exercise) => Promise<void>;
  deleteExercise: (id: ID) => Promise<void>;
  saveRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: ID) => Promise<void>;
  saveSession: (session: Session) => Promise<void>;
  deleteSession: (id: ID) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  exportBackup: () => Backup;
  importBackup: (backup: Backup) => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

const bySessionOrder = (a: Session, b: Session) =>
  b.date.localeCompare(a.date) || b.startedAt - a.startedAt;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      void store.requestPersistence();
      let snapshot = await store.loadAll();

      // First run: stock the exercise library so there is something to log.
      if (!snapshot.exercises.length && !snapshot.routines.length) {
        const seed = buildSeed();
        await store.seedInto(seed.exercises, seed.routines);
        const withStart = { ...snapshot.settings, programStart: todayISO() };
        await store.putSettings(withStart);
        snapshot = { ...snapshot, ...seed, settings: withStart };
      }

      if (cancelled) return;
      setExercises(snapshot.exercises);
      setRoutines(snapshot.routines);
      setSessions(snapshot.sessions);
      setSettings(snapshot.settings);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveExercise = useCallback(async (exercise: Exercise) => {
    setExercises((prev) => {
      const i = prev.findIndex((e) => e.id === exercise.id);
      if (i === -1) return [...prev, exercise];
      const next = prev.slice();
      next[i] = exercise;
      return next;
    });
    await store.putExercise(exercise);
  }, []);

  const deleteExercise = useCallback(async (id: ID) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    setRoutines((prev) => {
      const next = prev.map((r) =>
        r.exerciseIds.includes(id)
          ? { ...r, exerciseIds: r.exerciseIds.filter((x) => x !== id) }
          : r,
      );
      next.forEach((r, i) => {
        if (r !== prev[i]) void store.putRoutine(r);
      });
      return next;
    });
    await store.removeExercise(id);
  }, []);

  const saveRoutine = useCallback(async (routine: Routine) => {
    setRoutines((prev) => {
      const i = prev.findIndex((r) => r.id === routine.id);
      if (i === -1) return [...prev, routine];
      const next = prev.slice();
      next[i] = routine;
      return next;
    });
    await store.putRoutine(routine);
  }, []);

  const deleteRoutine = useCallback(async (id: ID) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    await store.removeRoutine(id);
  }, []);

  const saveSession = useCallback(async (session: Session) => {
    setSessions((prev) => {
      const i = prev.findIndex((s) => s.id === session.id);
      const next = i === -1 ? [session, ...prev] : prev.slice();
      if (i !== -1) next[i] = session;
      return next.sort(bySessionOrder);
    });
    await store.putSession(session);
  }, []);

  const deleteSession = useCallback(async (id: ID) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await store.removeSession(id);
  }, []);

  const saveSettings = useCallback(async (next: Settings) => {
    setSettings(next);
    await store.putSettings(next);
  }, []);

  const exportBackup = useCallback(
    (): Backup => ({
      app: 'repweek',
      version: 1,
      exportedAt: new Date().toISOString(),
      exercises,
      routines,
      sessions,
      settings,
    }),
    [exercises, routines, sessions, settings],
  );

  const importBackup = useCallback(async (backup: Backup) => {
    await store.replaceAll(backup);
    const snapshot = await store.loadAll();
    setExercises(snapshot.exercises);
    setRoutines(snapshot.routines);
    setSessions(snapshot.sessions);
    setSettings(snapshot.settings);
  }, []);

  const value = useMemo<AppDataValue>(
    () => ({
      ready,
      exercises,
      routines,
      sessions,
      settings,
      activeSession: sessions.find((s) => s.finishedAt === null) ?? null,
      exerciseById: (id) => exercises.find((e) => e.id === id),
      saveExercise,
      deleteExercise,
      saveRoutine,
      deleteRoutine,
      saveSession,
      deleteSession,
      saveSettings,
      exportBackup,
      importBackup,
    }),
    [
      ready,
      exercises,
      routines,
      sessions,
      settings,
      saveExercise,
      deleteExercise,
      saveRoutine,
      deleteRoutine,
      saveSession,
      deleteSession,
      saveSettings,
      exportBackup,
      importBackup,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) throw new Error('useAppData must be used inside AppDataProvider');
  return value;
}
