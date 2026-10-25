import type { Vehicle } from '../../data/vehicles';

// Simple inline SVG side-view silhouettes, one per car class. No external images, no logos —
// just enough shape difference (roofline, body length) to read as "a car of this class" at a
// glance. Color is inherited via currentColor so it follows the active brand accent.
const paths: Record<Vehicle['carClass'], string> = {
  economy:
    'M6 34 L10 24 Q13 19 19 19 L37 19 Q43 19 46 24 L50 34 L50 38 L44 38 L44 34 L12 34 L12 38 L6 38 Z',
  midsize:
    'M4 34 L8 23 Q11 18 18 18 L40 18 Q47 18 50 23 L54 34 L54 38 L47 38 L47 34 L11 34 L11 38 L4 38 Z',
  suv: 'M4 34 L6 20 Q7 16 12 16 L44 16 Q49 16 50 20 L52 34 L52 39 L45 39 L45 34 L11 34 L11 39 L4 39 Z',
  luxury:
    'M3 34 L9 22 Q12 17 20 17 L41 17 Q48 17 51 22 L57 34 L57 38 L50 38 L50 34 L10 34 L10 38 L3 38 Z',
};

export function CarSilhouette({ carClass }: { carClass: Vehicle['carClass'] }) {
  return (
    <svg
      className="car-silhouette"
      viewBox="0 0 60 44"
      width="60"
      height="44"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[carClass]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16" cy="36" r="4" fill="currentColor" />
      <circle cx="42" cy="36" r="4" fill="currentColor" />
    </svg>
  );
}
