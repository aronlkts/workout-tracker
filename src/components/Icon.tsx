const PATHS = {
  clock: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 7v5l3 3'],
  check: ['M20 6L9 17l-5-5'],
  info: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 8v5', 'M12 16.5v.01'],
  chevronRight: ['M9 18l6-6-6-6'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10'],
  dumbbell: ['M6.5 6.5l11 11', 'M4 9l2.5-2.5', 'M4 4l5 5', 'M20 15l-2.5 2.5', 'M20 20l-5-5'],
  chart: ['M3 3v18h18', 'M7 15l4-5 3 3 5-7'],
  user: ['M12 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M4 21c0-4 4-6 8-6s8 2 8 6'],
  arrowUp: ['M12 19V5', 'M5 12l7-7 7 7'],
  minus: ['M5 12h14'],
  plus: ['M12 5v14', 'M5 12h14'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  trash: ['M4 7h16', 'M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'M6 7l1 13h10l1-13'],
  download: ['M12 4v11', 'M8 11l4 4 4-4', 'M4 20h16'],
  upload: ['M12 20V9', 'M8 13l4-4 4 4', 'M4 4h16'],
  plusCircle: ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 8v8', 'M8 12h8'],
  edit: ['M4 20h4l10-10-4-4L4 16v4z', 'M13.5 6.5l4 4'],
  flame: ['M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-1.6.8-3 2-4.5.4 1.4 1.2 2 2 2 .6-2.6.4-4.6 1-6.5z'],
  play: ['M8 5l11 7-11 7V5z'],
  link: [
    'M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1 1',
    'M14 11a5 5 0 0 0-7.07 0l-2 2a5 5 0 0 0 7.07 7.07l1-1',
  ],
  search: ['M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0', 'M20 20l-3.6-3.6'],
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  color = 'currentColor',
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
