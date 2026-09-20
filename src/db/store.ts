import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Backup, Exercise, ID, Routine, Session, Settings } from './schema';
import { DEFAULT_SETTINGS, normaliseRoutine } from './schema';

interface RepWeekDB extends DBSchema {
  exercises: { key: ID; value: Exercise };
  routines: { key: ID; value: Routine };
  sessions: { key: ID; value: Session; indexes: { 'by-date': string } };
  meta: { key: string; value: unknown };
}

const DB_NAME = 'repweek';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RepWeekDB>> | null = null;

function db(): Promise<IDBPDatabase<RepWeekDB>> {
  dbPromise ??= openDB<RepWeekDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore('exercises', { keyPath: 'id' });
      database.createObjectStore('routines', { keyPath: 'id' });
      const sessions = database.createObjectStore('sessions', { keyPath: 'id' });
      sessions.createIndex('by-date', 'date');
      database.createObjectStore('meta');
    },
  });
  return dbPromise;
}

export interface Snapshot {
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  settings: Settings;
}

export async function loadAll(): Promise<Snapshot> {
  const d = await db();
  const [exercises, routines, sessions, stored] = await Promise.all([
    d.getAll('exercises'),
    d.getAll('routines'),
    d.getAll('sessions'),
    d.get('meta', 'settings') as Promise<Settings | undefined>,
  ]);

  return {
    exercises,
    routines: routines.map(normaliseRoutine),
    sessions: sessions.sort((a, b) => b.date.localeCompare(a.date) || b.startedAt - a.startedAt),
    // Merge so settings added in a later version get their defaults.
    settings: { ...DEFAULT_SETTINGS, ...(stored ?? {}) },
  };
}

export const putExercise = async (value: Exercise): Promise<void> => {
  await (await db()).put('exercises', value);
};
export const removeExercise = async (id: ID): Promise<void> => {
  await (await db()).delete('exercises', id);
};
export const putRoutine = async (value: Routine): Promise<void> => {
  await (await db()).put('routines', value);
};
export const removeRoutine = async (id: ID): Promise<void> => {
  await (await db()).delete('routines', id);
};
export const putSession = async (value: Session): Promise<void> => {
  await (await db()).put('sessions', value);
};
export const removeSession = async (id: ID): Promise<void> => {
  await (await db()).delete('sessions', id);
};
export const putSettings = async (value: Settings): Promise<void> => {
  await (await db()).put('meta', value, 'settings');
};

export async function seedInto(exercises: Exercise[], routines: Routine[]): Promise<void> {
  const d = await db();
  const tx = d.transaction(['exercises', 'routines'], 'readwrite');
  await Promise.all([
    ...exercises.map((e) => tx.objectStore('exercises').put(e)),
    ...routines.map((r) => tx.objectStore('routines').put(r)),
    tx.done,
  ]);
}

/** Wipes every store and writes the backup in its place. */
export async function replaceAll(backup: Backup): Promise<void> {
  const d = await db();
  const tx = d.transaction(['exercises', 'routines', 'sessions', 'meta'], 'readwrite');
  await Promise.all([
    tx.objectStore('exercises').clear(),
    tx.objectStore('routines').clear(),
    tx.objectStore('sessions').clear(),
    tx.objectStore('meta').clear(),
  ]);
  await Promise.all([
    ...backup.exercises.map((e) => tx.objectStore('exercises').put(e)),
    ...backup.routines.map((r) => tx.objectStore('routines').put(normaliseRoutine(r))),
    ...backup.sessions.map((s) => tx.objectStore('sessions').put(s)),
    tx.objectStore('meta').put({ ...DEFAULT_SETTINGS, ...backup.settings }, 'settings'),
  ]);
  await tx.done;
}

/**
 * Ask the browser not to evict the database. iOS clears ordinary site data
 * after a week of disuse; data for a home-screen app is exempt, but asking
 * costs nothing and covers the in-browser case.
 */
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota };
  } catch {
    return null;
  }
}
