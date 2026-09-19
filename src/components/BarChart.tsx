export interface Bar {
  key: string;
  label: string;
  value: number;
  caption: string;
}

interface BarChartProps {
  bars: Bar[];
  /** Only the last bar is captioned and accented, as in the design. */
  height?: number;
}

export function BarChart({ bars, height = 120 }: BarChartProps) {
  const max = bars.reduce((m, b) => Math.max(m, b.value), 0);
  // A floor keeps a flat series from rendering as a row of full-height bars.
  const floor = max * 0.55;
  const span = Math.max(max - floor, 1);

  return (
    <>
      <div className="chart" style={{ height }}>
        {bars.map((bar, i) => {
          const isLast = i === bars.length - 1;
          const px = Math.max(6, Math.round(((bar.value - floor) / span) * (height - 22)) + 16);
          return (
            <div className="chart-col" key={bar.key}>
              {isLast && <span className="chart-cap">{bar.caption}</span>}
              <div
                className={isLast ? 'chart-bar current' : 'chart-bar'}
                style={{ height: px }}
                role="img"
                aria-label={`${bar.label}: ${bar.caption}`}
              />
            </div>
          );
        })}
      </div>
      <div className="chart-axis">
        {bars.map((bar, i) => (
          <span key={bar.key} className={i === bars.length - 1 ? 'current' : undefined}>
            {bar.label}
          </span>
        ))}
      </div>
    </>
  );
}
