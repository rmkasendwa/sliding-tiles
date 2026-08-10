export type Slot = [number, number];

export type TileType = 'PLACEHOLDER' | 'MOVE_HINT' | 'SLOT_HINT';

export type Tile = {
  slot: Slot;
  homeSlot: Slot;
  position: number;
  type?: TileType;
};

export type TileGrid = Tile[][];

export type MoveHistoryEntry = {
  elapsedTimeMs: number;
  slot: Slot;
};

export type BoardState = {
  level: number;
  dimensions: Slot;
  tileGrid: TileGrid;
  emptySlot: Slot;
  movableSlots: Slot[];
  moves: number;
  elapsedTimeMs: number;
  moveHistory?: MoveHistoryEntry[];
  pausedDurationMs?: number;
  startedAt: string;
  totalElapsedTimeMs?: number;
  solutionMoves?: Slot[];
  undoCount?: number;
};

export function normalizeBoardState(
  board: BoardState | Omit<BoardState, 'elapsedTimeMs'>,
): BoardState {
  return {
    ...board,
    elapsedTimeMs: 'elapsedTimeMs' in board ? board.elapsedTimeMs : 0,
    moveHistory: 'moveHistory' in board ? board.moveHistory : undefined,
    pausedDurationMs:
      'pausedDurationMs' in board ? board.pausedDurationMs : undefined,
    totalElapsedTimeMs:
      'totalElapsedTimeMs' in board ? board.totalElapsedTimeMs : undefined,
  };
}

export function resetBoardAttempt(
  board: BoardState,
  startedAt = new Date().toISOString(),
): BoardState {
  return {
    ...board,
    elapsedTimeMs: 0,
    moveHistory: [],
    moves: 0,
    pausedDurationMs: 0,
    startedAt,
    totalElapsedTimeMs: 0,
  };
}

export const BASE_GRID_DIMENSIONS: Slot = [3, 2];

export function slotKey(slot: Slot) {
  return slot.join(',');
}

export function slotsEqual(a: Slot, b: Slot) {
  return a[0] === b[0] && a[1] === b[1];
}

export function getMovableSlots(
  [emptyRow, emptyColumn]: Slot,
  [maxRow, maxColumn]: Slot,
): Slot[] {
  const closest: Slot[] = [
    [emptyRow - 1, emptyColumn],
    [emptyRow + 1, emptyColumn],
    [emptyRow, emptyColumn - 1],
    [emptyRow, emptyColumn + 1],
  ];

  return closest.filter(([row, column]) => {
    return row >= 0 && row <= maxRow && column >= 0 && column <= maxColumn;
  });
}

export function getMaxSlot(tileGrid: TileGrid): Slot {
  return [tileGrid.length - 1, tileGrid[0].length - 1];
}

export function moveTileLogically(
  tileGrid: TileGrid,
  emptySlot: Slot,
  movableSlot: Slot,
): TileGrid {
  return tileGrid.map((row) =>
    row.map((tile) => {
      if (slotsEqual(tile.slot, emptySlot)) {
        return { ...tile, slot: movableSlot };
      }

      if (slotsEqual(tile.slot, movableSlot)) {
        return { ...tile, slot: emptySlot };
      }

      return tile;
    }),
  );
}

export function isTileGridInOrder(tileGrid: TileGrid): boolean {
  return tileGrid.every((row) =>
    row.every((tile) => slotsEqual(tile.slot, tile.homeSlot)),
  );
}

export function nextGridDimensions([columns, rows]: Slot): Slot {
  return rows >= columns ? [columns + 1, rows] : [columns, rows + 1];
}

export function getDimensionsForLevel(level: number) {
  let dimensions = BASE_GRID_DIMENSIONS;

  for (let currentLevel = 1; currentLevel < level; currentLevel++) {
    dimensions = nextGridDimensions(dimensions);
  }

  return dimensions;
}

export function createSolvedTileGrid([columnCount, rowCount]: Slot): TileGrid {
  return Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: columnCount }, (_, columnIndex) => {
      const slot: Slot = [rowIndex, columnIndex];
      const tile: Tile = {
        slot,
        homeSlot: slot,
        position: rowIndex * columnCount + columnIndex,
      };

      if (rowIndex === rowCount - 1 && columnIndex === columnCount - 1) {
        tile.type = 'PLACEHOLDER';
      }

      return tile;
    }),
  );
}

type RandomSource = () => number;

function createSeededRandom(seed: string): RandomSource {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomizeTileGrid(
  tileGrid: TileGrid,
  moves: number,
  random: RandomSource = Math.random,
) {
  const maxSlot = getMaxSlot(tileGrid);
  let randomizedGrid = tileGrid;
  let emptySlot: Slot = [...maxSlot];
  let movableSlots = getMovableSlots(emptySlot, maxSlot);
  let previousSlot: Slot | null = null;

  for (let i = 0; i < moves; i++) {
    const candidates =
      movableSlots.length > 1 && previousSlot
        ? movableSlots.filter((slot) => !slotsEqual(slot, previousSlot!))
        : movableSlots;
    const slotInTransit = candidates[Math.floor(random() * candidates.length)];

    randomizedGrid = moveTileLogically(
      randomizedGrid,
      emptySlot,
      slotInTransit,
    );
    previousSlot = emptySlot;
    emptySlot = slotInTransit;
    movableSlots = getMovableSlots(emptySlot, maxSlot);
  }

  return {
    tileGrid: randomizedGrid,
    emptySlot,
    movableSlots,
  };
}

export function createBoardState(
  level = 1,
  dimensions = BASE_GRID_DIMENSIONS,
  options: { seed?: string; startedAt?: string } = {},
) {
  const solvedTileGrid = createSolvedTileGrid(dimensions);
  let randomizationMoves = dimensions[0] * dimensions[1] - 1;
  if (randomizationMoves > 3) {
    randomizationMoves *= 100;
  }

  const random = options.seed ? createSeededRandom(options.seed) : Math.random;
  const { tileGrid, emptySlot, movableSlots } = randomizeTileGrid(
    solvedTileGrid,
    randomizationMoves,
    random,
  );

  return {
    level,
    dimensions,
    tileGrid,
    emptySlot,
    movableSlots,
    moves: 0,
    elapsedTimeMs: 0,
    startedAt: options.startedAt ?? new Date().toISOString(),
  } satisfies BoardState;
}

export function getDailyChallengeDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function createDailyChallengeBoard(
  dateKey = getDailyChallengeDateKey(),
) {
  const level = 3;

  return createBoardState(level, getDimensionsForLevel(level), {
    seed: `daily:${dateKey}:v1`,
  });
}

export function moveBoardTile(
  board: BoardState,
  slot: Slot,
  options: { countMove?: boolean } = {},
): BoardState {
  if (
    !board.movableSlots.some((movableSlot) => slotsEqual(movableSlot, slot))
  ) {
    return board;
  }

  const tileGrid = moveTileLogically(board.tileGrid, board.emptySlot, slot);
  const emptySlot = slot;
  const movableSlots = getMovableSlots(emptySlot, getMaxSlot(tileGrid));

  return {
    ...board,
    tileGrid,
    emptySlot,
    movableSlots,
    moves: options.countMove === false ? board.moves : board.moves + 1,
    solutionMoves: undefined,
  };
}
