import {
  BoardState,
  Slot,
  isTileGridInOrder,
  moveBoardTile,
} from './board';

type SolverOutcome =
  | { moves: Slot[]; quality: 'direct' | 'replay'; status: 'solved' }
  | { reason: string; status: 'already-solved' | 'invalid' | 'not-solvable' };

type SearchNode = {
  blankIndex: number;
  cost: number;
  estimate: number;
  id: string;
  moveSlot: Slot | null;
  previous: SearchNode | null;
  state: number[];
};

const MAX_SEARCH_NODES = 220_000;

class MinHeap<T> {
  private values: T[] = [];

  constructor(private readonly score: (value: T) => number) {}

  get size() {
    return this.values.length;
  }

  push(value: T) {
    this.values.push(value);
    this.bubbleUp(this.values.length - 1);
  }

  pop(): T | undefined {
    const first = this.values[0];
    const last = this.values.pop();

    if (last !== undefined && this.values.length > 0) {
      this.values[0] = last;
      this.sinkDown(0);
    }

    return first;
  }

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

function indexToSlot(index: number, columns: number): Slot {
  return [Math.floor(index / columns), index % columns];
}

function getStateId(state: number[]) {
  return state.join(',');
}

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

function getManhattanDistance(state: number[], columns: number, blankTile: number) {
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

function reconstructMoves(node: SearchNode) {
  const moves: Slot[] = [];
  let current: SearchNode | null = node;

  while (current?.moveSlot) {
    moves.push(current.moveSlot);
    current = current.previous;
  }

  return moves.reverse();
}

function getStoredSolutionMoves(board: BoardState): Slot[] | null {
  if (!board.solutionMoves?.length) {
    return null;
  }

  let solvedBoard = board;

  for (const slot of board.solutionMoves) {
    const nextBoard = moveBoardTile(solvedBoard, slot, { countMove: false });

    if (nextBoard === solvedBoard) {
      return null;
    }

    solvedBoard = nextBoard;
  }

  return isTileGridInOrder(solvedBoard.tileGrid) ? board.solutionMoves : null;
}

export function solveSlidingTilesBoard(board: BoardState): SolverOutcome {
  const parsedBoard = buildBoardState(board);

  if (!parsedBoard) {
    return {
      reason: 'The current board state is invalid.',
      status: 'invalid',
    };
  }

  const { blankTile, columns, rows, state } = parsedBoard;
  const targetState = Array.from({ length: state.length }, (_, index) => index);
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

  const openSet = new MinHeap<SearchNode>(
    (node) => node.estimate * 1024 + node.cost,
  );
  const bestCosts = new Map<string, number>([[initialId, 0]]);
  const initialDistance = getManhattanDistance(state, columns, blankTile);
  let visitedNodes = 0;

  openSet.push({
    blankIndex: state.indexOf(blankTile),
    cost: 0,
    estimate: initialDistance,
    id: initialId,
    moveSlot: null,
    previous: null,
    state,
  });

  while (openSet.size > 0 && visitedNodes < MAX_SEARCH_NODES) {
    const node = openSet.pop();

    if (!node) {
      break;
    }

    if (node.id === targetId) {
      return {
        moves: reconstructMoves(node),
        quality: 'direct',
        status: 'solved',
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
        estimate:
          nextCost + getManhattanDistance(nextState, columns, blankTile),
        id: nextId,
        moveSlot: indexToSlot(neighborIndex, columns),
        previous: node,
        state: nextState,
      });
    }
  }

  const storedSolutionMoves = getStoredSolutionMoves(board);
  if (storedSolutionMoves) {
    return {
      moves: storedSolutionMoves,
      quality: 'replay',
      status: 'solved',
    };
  }

  return {
    reason: 'The AI could not find a smooth solution for this board.',
    status: 'invalid',
  };
}
