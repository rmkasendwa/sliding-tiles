import { BoardState, Slot } from './board';

export type BoardSolverOptions = {
  maxSearchNodes?: number;
  maxStagedSearchNodes?: number;
  stagedHeuristicWeight?: number;
};

export type BoardSolverPayload = {
  boardState: number[];
  dimensions: Slot;
  emptySlot: Slot;
  options?: BoardSolverOptions;
  targetState: number[];
};

/**
 * Represents the outcome of solving a sliding tiles puzzle.
 * Either returns the solution with moves, or explains why it couldn't be solved.
 */
export type SolverOutcome =
  | { moves: Slot[]; quality: 'direct'; status: 'solved' }
  | { reason: string; status: 'already-solved' | 'invalid' | 'not-solvable' };

/**
 * Represents a node in the A* search algorithm.
 * Tracks the current board state, cost, heuristic estimate, and path information.
 */
type SearchNode = {
  blankIndex: number;
  cost: number;
  estimate: number;
  id: string;
  moveSlot: Slot | null;
  previous: SearchNode | null;
  state: number[];
};

/** Maximum number of nodes to explore during direct search */
const DEFAULT_MAX_SEARCH_NODES = 220_000;
/** Maximum number of nodes to explore during each staged search phase */
const DEFAULT_MAX_STAGED_SEARCH_NODES = 4_000_000;
/** Weight multiplier for heuristic during staged search */
const DEFAULT_STAGED_HEURISTIC_WEIGHT = 5;

/**
 * A generic min-heap priority queue implementation.
 * Used for efficient retrieval of the lowest-cost node during A* search.
 */
class MinHeap<T> {
  private values: T[] = [];
  private score: (value: T) => number;

  /** Initializes the heap with a scoring function to determine priority */
  constructor(score: (value: T) => number) {
    this.score = score;
  }

  /** Returns the number of elements in the heap */
  get size() {
    return this.values.length;
  }

  /** Adds a value to the heap and maintains heap property */
  push(value: T) {
    this.values.push(value);
    this.bubbleUp(this.values.length - 1);
  }

  /** Removes and returns the element with the lowest score */
  pop(): T | undefined {
    const first = this.values[0];
    const last = this.values.pop();

    if (last !== undefined && this.values.length > 0) {
      this.values[0] = last;
      this.sinkDown(0);
    }

    return first;
  }

  /** Moves an element up the heap to restore heap property */
  private bubbleUp(index: number) {
    let currentIndex = index;
    const value = this.values[currentIndex];
    const valueScore = this.score(value);

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);
      const parent = this.values[parentIndex];

      if (valueScore >= this.score(parent)) {
        break;
      }

      this.values[parentIndex] = value;
      this.values[currentIndex] = parent;
      currentIndex = parentIndex;
    }
  }

  /** Moves an element down the heap to restore heap property */
  private sinkDown(index: number) {
    let currentIndex = index;
    const length = this.values.length;
    const value = this.values[currentIndex];
    const valueScore = this.score(value);

    while (true) {
      const leftIndex = currentIndex * 2 + 1;
      const rightIndex = leftIndex + 1;
      let swapIndex: number | null = null;
      let leftScore = 0;

      if (leftIndex < length) {
        const left = this.values[leftIndex];
        leftScore = this.score(left);

        if (leftScore < valueScore) {
          swapIndex = leftIndex;
        }
      }

      if (rightIndex < length) {
        const right = this.values[rightIndex];
        const rightScore = this.score(right);

        if (
          (swapIndex === null && rightScore < valueScore) ||
          (swapIndex !== null && rightScore < leftScore)
        ) {
          swapIndex = rightIndex;
        }
      }

      if (swapIndex === null) {
        break;
      }

      this.values[currentIndex] = this.values[swapIndex];
      this.values[swapIndex] = value;
      currentIndex = swapIndex;
    }
  }
}

/** Converts a flat array index to a 2D board position [row, column] */
function indexToSlot(index: number, columns: number): Slot {
  return [Math.floor(index / columns), index % columns];
}

/** Creates a unique string identifier for a board state */
function getStateId(state: number[]) {
  return state.join(',');
}

/**
 * Counts inversions in the board state.
 * An inversion is when a larger number appears before a smaller number.
 * Used to determine if a puzzle is solvable.
 */
function getInversionCount(state: number[], blankTile: number) {
  let inversions = 0;

  for (let i = 0; i < state.length; i++) {
    if (state[i] === blankTile) {
      continue;
    }

    for (let j = i + 1; j < state.length; j++) {
      if (state[j] !== blankTile && state[i] > state[j]) {
        inversions++;
      }
    }
  }

  return inversions;
}

/**
 * Determines if a puzzle configuration is solvable.
 * Solvability depends on the number of inversions and board dimensions.
 */
function isSolvableState(state: number[], columns: number, blankTile: number) {
  const inversions = getInversionCount(state, blankTile);

  if (columns % 2 === 1) {
    return inversions % 2 === 0;
  }

  const blankRowFromBottom =
    Math.floor((state.length - 1 - state.indexOf(blankTile)) / columns) + 1;

  return blankRowFromBottom % 2 === 0
    ? inversions % 2 === 1
    : inversions % 2 === 0;
}

/**
 * Calculates the Manhattan distance heuristic for the entire board.
 * Sum of distances each tile must move to reach its target position.
 */
function getManhattanDistance(
  state: number[],
  columns: number,
  blankTile: number,
  targetPositions: ReadonlyMap<number, number>,
) {
  let distance = 0;

  for (let index = 0; index < state.length; index++) {
    const tile = state[index];

    if (tile === blankTile) {
      continue;
    }

    const targetIndex = targetPositions.get(tile);

    if (targetIndex === undefined) {
      return Number.POSITIVE_INFINITY;
    }

    const currentRow = Math.floor(index / columns);
    const currentColumn = index % columns;
    const targetRow = Math.floor(targetIndex / columns);
    const targetColumn = targetIndex % columns;
    distance +=
      Math.abs(currentRow - targetRow) + Math.abs(currentColumn - targetColumn);
  }

  return distance;
}

/**
 * Returns the valid neighboring positions the blank tile can move to.
 * Considers board boundaries.
 */
function getNeighborIndexes(blankIndex: number, columns: number, rows: number) {
  const row = Math.floor(blankIndex / columns);
  const column = blankIndex % columns;
  const neighbors: number[] = [];

  if (row > 0) {
    neighbors.push(blankIndex - columns);
  }
  if (row < rows - 1) {
    neighbors.push(blankIndex + columns);
  }
  if (column > 0) {
    neighbors.push(blankIndex - 1);
  }
  if (column < columns - 1) {
    neighbors.push(blankIndex + 1);
  }

  return neighbors;
}

/**
 * Converts a BoardState object into a flat array representation.
 * Validates the board configuration for integrity.
 * Returns null if the board state is invalid.
 */
function buildBoardState(board: BoardState) {
  const [columns, rows] = board.dimensions;
  const tileCount = columns * rows;
  const blankTile = tileCount - 1;
  const state = new Array<number>(tileCount);
  const seenPositions = new Set<number>();
  const seenSlots = new Set<number>();

  for (const tile of board.tileGrid.flat()) {
    const [row, column] = tile.slot;
    const index = row * columns + column;

    if (
      row < 0 ||
      row >= rows ||
      column < 0 ||
      column >= columns ||
      tile.position < 0 ||
      tile.position >= tileCount ||
      seenPositions.has(tile.position) ||
      seenSlots.has(index)
    ) {
      return null;
    }

    state[index] = tile.position;
    seenPositions.add(tile.position);
    seenSlots.add(index);
  }

  if (
    seenPositions.size !== tileCount ||
    state.some((tile) => tile === undefined) ||
    state[board.emptySlot[0] * columns + board.emptySlot[1]] !== blankTile
  ) {
    return null;
  }

  return { blankTile, columns, rows, state };
}

/**
 * Reconstructs the sequence of moves from the goal state back to the initial state.
 * Returns moves in the correct order (from initial to goal).
 */
function reconstructMoves(node: SearchNode) {
  const moves: Slot[] = [];
  let current: SearchNode | null = node;

  while (current?.moveSlot) {
    moves.push(current.moveSlot);
    current = current.previous;
  }

  return moves.reverse();
}

/** Creates the goal state where tiles are in order [0, 1, 2, ..., length-1] */
export function createTargetState(length: number) {
  return Array.from({ length }, (_, index) => index);
}

/** Finds the position of a tile in the current board state */
function getTileIndex(state: number[], tile: number) {
  return state.indexOf(tile);
}

function getTargetPositions(targetState: number[]) {
  const targetPositions = new Map<number, number>();

  targetState.forEach((tile, index) => {
    targetPositions.set(tile, index);
  });

  return targetPositions;
}

/** Calculates the Manhattan distance between two board positions */
function getIndexDistance(index: number, targetIndex: number, columns: number) {
  return (
    Math.abs(Math.floor(index / columns) - Math.floor(targetIndex / columns)) +
    Math.abs((index % columns) - (targetIndex % columns))
  );
}

/**
 * Calculates Manhattan distance for a board state, excluding locked tiles.
 * Used during staged solving to focus on unlocked portions.
 */
function getStateManhattanDistance(
  state: number[],
  columns: number,
  blankTile: number,
  lockedIndexes: ReadonlySet<number>,
  targetPositions: ReadonlyMap<number, number>,
) {
  let distance = 0;

  for (let index = 0; index < state.length; index++) {
    const tile = state[index];

    if (tile === blankTile || lockedIndexes.has(index)) {
      continue;
    }

    const targetIndex = targetPositions.get(tile);

    if (targetIndex === undefined) {
      return Number.POSITIVE_INFINITY;
    }

    distance += getIndexDistance(index, targetIndex, columns);
  }

  return distance;
}

/**
 * A* search algorithm implementation to find moves solving the puzzle.
 * Uses a heuristic function to guide the search efficiently.
 * Returns the solution path or null if no solution found within node limit.
 */
function searchMoves({
  blankIndex,
  blankTile,
  columns,
  goal,
  heuristic,
  heuristicWeight = 1,
  initialState,
  lockedIndexes,
  maxNodes,
  rows,
}: {
  blankIndex: number;
  blankTile: number;
  columns: number;
  goal: (state: number[]) => boolean;
  heuristic: (state: number[]) => number;
  heuristicWeight?: number;
  initialState: number[];
  lockedIndexes: ReadonlySet<number>;
  maxNodes: number;
  rows: number;
}) {
  const initialId = getStateId(initialState);
  const openSet = new MinHeap<SearchNode>(
    (node) => node.estimate * 1024 - node.cost,
  );
  const bestCosts = new Map<string, number>([[initialId, 0]]);
  let visitedNodes = 0;

  openSet.push({
    blankIndex,
    cost: 0,
    estimate: heuristic(initialState) * heuristicWeight,
    id: initialId,
    moveSlot: null,
    previous: null,
    state: initialState,
  });

  while (openSet.size > 0 && visitedNodes < maxNodes) {
    const node = openSet.pop();

    if (!node) {
      break;
    }

    if (goal(node.state)) {
      return {
        blankIndex: node.blankIndex,
        moves: reconstructMoves(node),
        state: node.state,
      };
    }

    if ((bestCosts.get(node.id) ?? Number.POSITIVE_INFINITY) < node.cost) {
      continue;
    }

    visitedNodes++;

    for (const neighborIndex of getNeighborIndexes(
      node.blankIndex,
      columns,
      rows,
    )) {
      if (lockedIndexes.has(neighborIndex)) {
        continue;
      }

      const nextState = [...node.state];
      nextState[node.blankIndex] = nextState[neighborIndex];
      nextState[neighborIndex] = blankTile;

      const nextId = getStateId(nextState);
      const nextCost = node.cost + 1;

      if ((bestCosts.get(nextId) ?? Number.POSITIVE_INFINITY) <= nextCost) {
        continue;
      }

      bestCosts.set(nextId, nextCost);
      openSet.push({
        blankIndex: neighborIndex,
        cost: nextCost,
        estimate: nextCost + heuristic(nextState) * heuristicWeight,
        id: nextId,
        moveSlot: indexToSlot(neighborIndex, columns),
        previous: node,
        state: nextState,
      });
    }
  }

  return null;
}

/**
 * Generates groups of tile positions for staged solving.
 * Solves tiles row-by-row, then handles the final 2x2 corner.
 */
function getStagedTargetGroups(columns: number, rows: number) {
  const groups: number[][] = [];

  for (let row = 0; row < rows - 2; row++) {
    groups.push(
      Array.from({ length: columns }, (_, column) => row * columns + column),
    );
  }

  for (let column = 0; column < columns - 2; column++) {
    groups.push(
      Array.from(
        { length: Math.min(2, rows) },
        (_, rowOffset) => (rows - 2 + rowOffset) * columns + column,
      ),
    );
  }

  return groups;
}

/**
 * Solves the puzzle using a staged approach.
 * Solves groups of tiles progressively, locking solved tiles to reduce search space.
 * Falls back to full board search for the final steps.
 */
function solveWithStagedSearch({
  blankTile,
  columns,
  maxStagedSearchNodes,
  rows,
  stagedHeuristicWeight,
  state,
  targetState,
}: {
  blankTile: number;
  columns: number;
  maxStagedSearchNodes: number;
  rows: number;
  stagedHeuristicWeight: number;
  state: number[];
  targetState: number[];
}) {
  let currentState = state;
  let blankIndex = state.indexOf(blankTile);
  const lockedIndexes = new Set<number>();
  const moves: Slot[] = [];
  const targetPositions = getTargetPositions(targetState);

  for (const targetIndexes of getStagedTargetGroups(columns, rows)) {
    if (
      targetIndexes.every(
        (targetIndex) => currentState[targetIndex] === targetIndex,
      )
    ) {
      targetIndexes.forEach((targetIndex) => lockedIndexes.add(targetIndex));
      continue;
    }

    const result = searchMoves({
      blankIndex,
      blankTile,
      columns,
      goal: (candidateState) =>
        targetIndexes.every(
          (targetIndex) => candidateState[targetIndex] === targetIndex,
        ),
      heuristic: (candidateState) =>
        targetIndexes.reduce(
          (distance, targetIndex) =>
            distance +
            getIndexDistance(
              getTileIndex(candidateState, targetIndex),
              targetIndex,
              columns,
            ),
          0,
        ),
      heuristicWeight: stagedHeuristicWeight,
      initialState: currentState,
      lockedIndexes,
      maxNodes: maxStagedSearchNodes,
      rows,
    });

    if (!result) {
      return null;
    }

    moves.push(...result.moves);
    currentState = result.state;
    blankIndex = result.blankIndex;
    targetIndexes.forEach((targetIndex) => lockedIndexes.add(targetIndex));
  }

  if (getStateId(currentState) === getStateId(targetState)) {
    return moves;
  }

  const result = searchMoves({
    blankIndex,
    blankTile,
    columns,
    goal: (candidateState) =>
      getStateId(candidateState) === getStateId(targetState),
    heuristic: (candidateState) =>
      getStateManhattanDistance(
        candidateState,
        columns,
        blankTile,
        lockedIndexes,
        targetPositions,
      ),
    heuristicWeight: stagedHeuristicWeight,
    initialState: currentState,
    lockedIndexes,
    maxNodes: maxStagedSearchNodes,
    rows,
  });

  if (!result) {
    return null;
  }

  return [...moves, ...result.moves];
}

/**
 * Converts a BoardState into the serializable payload used by the worker.
 */
export function createBoardSolverPayload(
  board: BoardState,
  options?: BoardSolverOptions,
): BoardSolverPayload | null {
  const parsedBoard = buildBoardState(board);

  if (!parsedBoard) {
    return null;
  }

  return {
    boardState: parsedBoard.state,
    dimensions: board.dimensions,
    emptySlot: board.emptySlot,
    options,
    targetState: createTargetState(parsedBoard.state.length),
  };
}

function normalizeSolverOptions(options: BoardSolverOptions | undefined) {
  return {
    maxSearchNodes:
      options?.maxSearchNodes && options.maxSearchNodes > 0
        ? Math.trunc(options.maxSearchNodes)
        : DEFAULT_MAX_SEARCH_NODES,
    maxStagedSearchNodes:
      options?.maxStagedSearchNodes && options.maxStagedSearchNodes > 0
        ? Math.trunc(options.maxStagedSearchNodes)
        : DEFAULT_MAX_STAGED_SEARCH_NODES,
    stagedHeuristicWeight:
      options?.stagedHeuristicWeight && options.stagedHeuristicWeight > 0
        ? options.stagedHeuristicWeight
        : DEFAULT_STAGED_HEURISTIC_WEIGHT,
  };
}

function isValidSolverPayload(payload: BoardSolverPayload) {
  const [columns, rows] = payload.dimensions;
  const tileCount = columns * rows;
  const blankTile = tileCount - 1;
  const emptyIndex = payload.emptySlot[0] * columns + payload.emptySlot[1];
  const expectedTiles = new Set(Array.from({ length: tileCount }, (_, i) => i));
  const boardTiles = new Set(payload.boardState);
  const targetTiles = new Set(payload.targetState);

  return (
    Number.isInteger(columns) &&
    Number.isInteger(rows) &&
    columns > 0 &&
    rows > 0 &&
    payload.boardState.length === tileCount &&
    payload.targetState.length === tileCount &&
    payload.boardState.every((tile) => expectedTiles.has(tile)) &&
    payload.targetState.every((tile) => expectedTiles.has(tile)) &&
    boardTiles.size === tileCount &&
    targetTiles.size === tileCount &&
    payload.boardState[emptyIndex] === blankTile
  );
}

/**
 * Main pure solver entry point for serializable board data.
 * Validates the board, checks solvability, and attempts to find a solution.
 */
export function solveBoardSolverPayload(
  payload: BoardSolverPayload,
): SolverOutcome {
  if (!isValidSolverPayload(payload)) {
    return {
      reason: 'The current board state is invalid.',
      status: 'invalid',
    };
  }

  const [columns, rows] = payload.dimensions;
  const state = payload.boardState;
  const targetState = payload.targetState;
  const blankTile = columns * rows - 1;
  const targetId = getStateId(targetState);
  const initialId = getStateId(state);
  const targetPositions = getTargetPositions(targetState);
  const solverOptions = normalizeSolverOptions(payload.options);

  if (initialId === targetId) {
    return {
      reason: 'This puzzle is already solved.',
      status: 'already-solved',
    };
  }

  if (!isSolvableState(state, columns, blankTile)) {
    return {
      reason: 'This board cannot be solved from its current tile order.',
      status: 'not-solvable',
    };
  }

  const directResult = searchMoves({
    blankIndex: state.indexOf(blankTile),
    blankTile,
    columns,
    goal: (candidateState) => getStateId(candidateState) === targetId,
    heuristic: (candidateState) =>
      getManhattanDistance(
        candidateState,
        columns,
        blankTile,
        targetPositions,
      ),
    initialState: state,
    lockedIndexes: new Set(),
    maxNodes: solverOptions.maxSearchNodes,
    rows,
  });

  if (directResult) {
    return {
      moves: directResult.moves,
      quality: 'direct',
      status: 'solved',
    };
  }

  const stagedMoves = solveWithStagedSearch({
    blankTile,
    columns,
    maxStagedSearchNodes: solverOptions.maxStagedSearchNodes,
    rows,
    stagedHeuristicWeight: solverOptions.stagedHeuristicWeight,
    state,
    targetState,
  });

  if (stagedMoves) {
    return {
      moves: stagedMoves,
      quality: 'direct',
      status: 'solved',
    };
  }

  return {
    reason: 'The AI could not find a solution for this board.',
    status: 'invalid',
  };
}

/**
 * Compatibility helper for existing callers that still hold a BoardState.
 */
export function solveSlidingTilesBoard(
  board: BoardState,
  options?: BoardSolverOptions,
): SolverOutcome {
  const payload = createBoardSolverPayload(board, options);

  if (!payload) {
    return {
      reason: 'The current board state is invalid.',
      status: 'invalid',
    };
  }

  return solveBoardSolverPayload(payload);
}
