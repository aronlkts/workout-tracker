const DAY_MS = 86_400_000;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Parse YYYY-MM-DD as a *local* date. `new Date(str)` would read it as UTC. */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toISO(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export const todayISO = (): string => toISO(new Date());

/** 'Thu, Sep 24' */
export function formatLong(iso: string): string {
  const d = fromISO(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** 'Sep 24' */
export function formatShort(iso: string): string {
  const d = fromISO(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((fromISO(toIso).getTime() - fromISO(fromIso).getTime()) / DAY_MS);
}

/** 1-based week of the program, counting from the program start date. */
export function weekNumber(iso: string, programStart: string): number {
  if (!programStart) return 1;
  return Math.floor(daysBetween(programStart, iso) / 7) + 1;
}

export function relativeLabel(iso: string, today = todayISO()): string {
  const diff = daysBetween(iso, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < 0) return formatShort(iso);
  const weeks = Math.floor(diff / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}

/** Monday-based start of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const d = fromISO(iso);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return toISO(d);
}
