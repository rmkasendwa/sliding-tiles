import { z } from 'zod';

import { isTileGridInOrder, type BoardState } from './board';

export const ANONYMOUS_GAME_STORAGE_KEY =
  'sliding-tiles:anonymous-game-progress';
export const ANONYMOUS_GAME_STORAGE_VERSION = 1;

export type AnonymousTimerStatus = 'idle' | 'paused' | 'running';

export type AnonymousGameProgress = {
  attemptStartBoard: BoardState;
  board: BoardState;
  timerStatus: AnonymousTimerStatus;
  version: typeof ANONYMOUS_GAME_STORAGE_VERSION;
};

const slotSchema = z.tuple([
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
]);
const tileSchema = z.object({
  homeSlot: slotSchema,
  position: z.number().int().nonnegative(),
  slot: slotSchema,
  type: z.enum(['PLACEHOLDER', 'MOVE_HINT', 'SLOT_HINT']).optional(),
});
const boardSchema = z.object({
  dimensions: slotSchema,
  elapsedTimeMs: z.number().finite().nonnegative(),
  emptySlot: slotSchema,
  level: z.number().int().positive(),
  movableSlots: z.array(slotSchema),
  moves: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
  tileGrid: z.array(z.array(tileSchema)),
});
const anonymousGameProgressSchema = z.object({
  attemptStartBoard: boardSchema,
  board: boardSchema,
  timerStatus: z.enum(['idle', 'paused', 'running']),
  version: z.literal(ANONYMOUS_GAME_STORAGE_VERSION),
});

function isSlotWithinBoard(
  [row, column]: [number, number],
  [columns, rows]: [number, number],
) {
  return row < rows && column < columns;
}

function isCompatibleBoard(board: BoardState) {
  const [columns, rows] = board.dimensions;
  const tiles = board.tileGrid.flat();

  return (
    columns > 1 &&
    rows > 1 &&
    board.tileGrid.length === rows &&
    board.tileGrid.every((row) => row.length === columns) &&
    tiles.length === columns * rows &&
    new Set(tiles.map((tile) => tile.position)).size === tiles.length &&
    tiles.every(
      (tile) =>
        isSlotWithinBoard(tile.slot, board.dimensions) &&
        isSlotWithinBoard(tile.homeSlot, board.dimensions),
    ) &&
    isSlotWithinBoard(board.emptySlot, board.dimensions) &&
    board.movableSlots.every((slot) =>
      isSlotWithinBoard(slot, board.dimensions),
    )
  );
}

export function parseAnonymousGameProgress(
  storedValue: string | null,
): AnonymousGameProgress | null {
  if (!storedValue) {
    return null;
  }

  try {
    const result = anonymousGameProgressSchema.safeParse(
      JSON.parse(storedValue),
    );

    if (
      !result.success ||
      !isCompatibleBoard(result.data.board) ||
      !isCompatibleBoard(result.data.attemptStartBoard) ||
      isTileGridInOrder(result.data.board.tileGrid)
    ) {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}

export function serializeAnonymousGameProgress(
  progress: Omit<AnonymousGameProgress, 'version'>,
) {
  return JSON.stringify({
    ...progress,
    version: ANONYMOUS_GAME_STORAGE_VERSION,
  } satisfies AnonymousGameProgress);
}
