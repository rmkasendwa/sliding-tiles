export const BOARD_SIZE = 999;
export const BOARD_HINT_DELAY_MS = 500;
export const BOARD_HINT_TILE_REVEAL_DELAY_MS = 220;
export const LEVEL_COMPLETE_CELEBRATION_DELAY_MS = 500;
export const LEVEL_COMPLETE_ADVANCE_DELAY_MS = 10000;
export const LEVEL_COMPLETE_CONFETTI_DURATION_MS =
  LEVEL_COMPLETE_CELEBRATION_DELAY_MS + LEVEL_COMPLETE_ADVANCE_DELAY_MS;
export const RESET_GATHER_DELAY_MS = 500;
export const TILE_ENTRY_ANIMATION_MS = 2800;
export const TILE_ENTRY_LOCK_IN_DELAY_MS = 2300;

export const TILE_TRANSITION =
  'left 180ms ease, top 180ms ease, box-shadow 180ms ease';
export const HINT_PLACEHOLDER_TRANSITION =
  'left 180ms ease, top 180ms ease, opacity 360ms ease, box-shadow 180ms ease, filter 180ms ease';

export const BOARD_SURFACE_BACKGROUND =
  'repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-foreground) 12%, transparent) 0 10px, color-mix(in srgb, var(--color-foreground) 12%, transparent) 10px 18px, color-mix(in srgb, var(--color-surface) 22%, transparent) 18px 28px, color-mix(in srgb, var(--color-surface) 22%, transparent) 28px 36px), var(--color-surface-sunken)';
export const SOLUTION_GRID_BACKGROUND =
  "linear-gradient(to right, color-mix(in srgb, var(--color-surface) 42%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-surface) 42%, transparent) 1px, transparent 1px), url('/frog.svg')";
export const TILE_BACKGROUND = "url('/frog.svg')";

export const CELEBRATION_PARTICLES = Array.from(
  { length: 30 },
  (_, index) => ({
    delay: `${index * 70}ms`,
    left: `${6 + ((index * 23) % 88)}%`,
    size: `${9 + (index % 5) * 4}px`,
    top: `${8 + ((index * 19) % 74)}%`,
  }),
);

const CONFETTI_COLORS = [
  'var(--color-celebration)',
  'var(--color-primary)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-clay)',
];

export const CONFETTI_PARTICLES = Array.from({ length: 96 }, (_, index) => {
  const direction = index % 2 === 0 ? -1 : 1;
  const drift = direction * (52 + ((index * 23) % 168));
  const rotation = direction * (220 + ((index * 47) % 520));

  return {
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    delay: `${(index % 32) * 260}ms`,
    drift: `${drift}px`,
    driftMid: `${Math.round(drift * 0.58)}px`,
    left: `${8 + ((index * 31) % 84)}%`,
    rotation: `${rotation}deg`,
    rotationMid: `${Math.round(rotation * 0.58)}deg`,
    size: `${6 + (index % 4) * 2}px`,
  };
});
