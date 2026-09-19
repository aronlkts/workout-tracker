interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

export function StatTile({ label, value, sub, highlight }: StatTileProps) {
  return (
    <div className="tile">
      <div className="tile-label">{label}</div>
      <div className="tile-value">{value}</div>
      {sub !== undefined && (
        <div className={highlight ? 'tile-sub up' : 'tile-sub'}>{sub}</div>
      )}
    </div>
  );
}
