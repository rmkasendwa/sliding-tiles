import { BoardState, Slot } from './board';

/**
 * Represents the outcome of solving a sliding tiles puzzle.
 * Either returns the solution with moves, or explains why it couldn't be solved.
 */
type SolverOutcome =
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
const MAX_SEARCH_NODES = 220_000;
/** Maximum number of nodes to explore during each staged search phase */
const MAX_STAGED_SEARCH_NODES = 4_000_000;
/** Weight multiplier for heuristic during staged search */
const STAGED_HEURISTIC_WEIGHT = 5;

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
) {
  let distance = 0;

  for (let index = 0; index < state.length; index++) {
    const tile = state[index];

    if (tile === blankTile) {
      continue;
    }

    const currentRow = Math.floor(index / columns);
    const currentColumn = index % columns;
    const targetRow = Math.floor(tile / columns);
    const targetColumn = tile % columns;
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
function createTargetState(length: number) {
  return Array.from({ length }, (_, index) => index);
}

/** Finds the position of a tile in the current board state */
function getTileIndex(state: number[], tile: number) {
  return state.indexOf(tile);
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
) {
  let distance = 0;

  for (let index = 0; index < state.length; index++) {
    const tile = state[index];

    if (tile === blankTile || lockedIndexes.has(index)) {
      continue;
    }

    distance += getIndexDistance(index, tile, columns);
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
  rows,
  state,
}: {
  blankTile: number;
  columns: number;
  rows: number;
  state: number[];
}) {
  let currentState = state;
  let blankIndex = state.indexOf(blankTile);
  const lockedIndexes = new Set<number>();
  const moves: Slot[] = [];
  const targetState = createTargetState(state.length);

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
      heuristicWeight: STAGED_HEURISTIC_WEIGHT,
      initialState: currentState,
      lockedIndexes,
      maxNodes: MAX_STAGED_SEARCH_NODES,
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
      ),
    heuristicWeight: STAGED_HEURISTIC_WEIGHT,
    initialState: currentState,
    lockedIndexes,
    maxNodes: MAX_STAGED_SEARCH_NODES,
    rows,
  });

  if (!result) {
    return null;
  }

  return [...moves, ...result.moves];
}

/**
 * Main entry point for solving a sliding tiles puzzle.
 * Validates the board, checks solvability, and attempts to find a solution.
 * Returns the solution or an explanation if the puzzle cannot be solved.
 */
export function solveSlidingTilesBoard(board: BoardState): SolverOutcome {
  const parsedBoard = buildBoardState(board);

  if (!parsedBoard) {
    return {
      reason: 'The current board state is invalid.',
      status: 'invalid',
    };
  }

  const { blankTile, columns, rows, state } = parsedBoard;
  const targetState = createTargetState(state.length);
  const targetId = getStateId(targetState);
  const initialId = getStateId(state);

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
      getManhattanDistance(candidateState, columns, blankTile),
    initialState: state,
    lockedIndexes: new Set(),
    maxNodes: MAX_SEARCH_NODES,
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
    rows,
    state,
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
