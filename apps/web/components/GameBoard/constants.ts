export const LOCAL_STORAGE_KEY = 'sliding-tiles:anonymous-board';
export const BOARD_SIZE = 999;
export const BOARD_HINT_DELAY_MS = 500;
export const BOARD_HINT_TILE_REVEAL_DELAY_MS = 220;
export const LEVEL_COMPLETE_CELEBRATION_DELAY_MS = 500;
export const LEVEL_COMPLETE_ADVANCE_DELAY_MS = 10000;
export const RESET_GATHER_DELAY_MS = 500;
export const TILE_ENTRY_ANIMATION_MS = 2800;
export const TILE_ENTRY_LOCK_IN_DELAY_MS = 2300;

export const TILE_TRANSITION =
  'left 180ms ease, top 180ms ease, box-shadow 180ms ease';
export const HINT_PLACEHOLDER_TRANSITION =
  'left 180ms ease, top 180ms ease, opacity 360ms ease, box-shadow 180ms ease, filter 180ms ease';

export const BOARD_SURFACE_BACKGROUND =
  'repeating-linear-gradient(-45deg, rgba(30, 37, 34, 0.12) 0 10px, rgba(30, 37, 34, 0.12) 10px 18px, rgba(255, 255, 255, 0.22) 18px 28px, rgba(255, 255, 255, 0.22) 28px 36px), #ece4d3';
export const SOLUTION_GRID_BACKGROUND =
  "linear-gradient(to right, rgba(255, 255, 255, 0.42) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.42) 1px, transparent 1px), url('/frog.svg')";
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
