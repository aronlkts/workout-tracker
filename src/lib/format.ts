/** Weights print as 80, not 80.0, but keep the half-plate: 82.5. */
export function fmtWeight(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function fmtDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return '±0';
  return `${rounded > 0 ? '+' : '−'}${fmtWeight(Math.abs(rounded))}`;
}

export function fmtVolume(value: number): string {
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

export function fmtRIR(value: number | null): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

/** [1,2,4] → "1–2 and 4" */
export function listRanges(nums: number[]): string {
  if (!nums.length) return '';
  const sorted = [...nums].sort((a, b) => a - b);
  const runs: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (const n of sorted.slice(1)) {
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    runs.push(start === prev ? String(start) : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  runs.push(start === prev ? String(start) : `${start}–${prev}`);

  if (runs.length === 1) return runs[0];
  return `${runs.slice(0, -1).join(', ')} and ${runs.at(-1)}`;
}

/** "Rest 90 s" / "Rest 3 min" / "Rest 2:30" */
export function restLabel(seconds: number | undefined): string {
  if (!seconds) return 'No rest set';
  if (seconds < 120) return `Rest ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `Rest ${minutes} min` : `Rest ${minutes}:${String(rest).padStart(2, '0')}`;
}
