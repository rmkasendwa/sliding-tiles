import { Slot } from '@/lib/board';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export type TouchPoint = {
  x: number;
  y: number;
};

export const TILE_SWIPE_THRESHOLD_PX = 30;
export const TILE_DRAG_COMMIT_RATIO = 0.4;

export function getSwipeDirection(
  start: TouchPoint,
  end: TouchPoint,
  threshold = TILE_SWIPE_THRESHOLD_PX,
): SwipeDirection | null {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;

  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < threshold) {
    return null;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'right' : 'left';
  }

  return deltaY > 0 ? 'down' : 'up';
}

export function isSwipeTowardEmptySlot(
  tileSlot: Slot,
  emptySlot: Slot,
  direction: SwipeDirection,
) {
  const [tileRow, tileColumn] = tileSlot;
  const [emptyRow, emptyColumn] = emptySlot;

  switch (direction) {
    case 'left':
      return emptyRow === tileRow && emptyColumn === tileColumn - 1;
    case 'right':
      return emptyRow === tileRow && emptyColumn === tileColumn + 1;
    case 'up':
      return emptyRow === tileRow - 1 && emptyColumn === tileColumn;
    case 'down':
      return emptyRow === tileRow + 1 && emptyColumn === tileColumn;
  }
}

export function getSwipeDirectionTowardEmptySlot(
  tileSlot: Slot,
  emptySlot: Slot,
): SwipeDirection | null {
  const [tileRow, tileColumn] = tileSlot;
  const [emptyRow, emptyColumn] = emptySlot;

  if (emptyRow === tileRow && emptyColumn === tileColumn - 1) {
    return 'left';
  }

  if (emptyRow === tileRow && emptyColumn === tileColumn + 1) {
    return 'right';
  }

  if (emptyRow === tileRow - 1 && emptyColumn === tileColumn) {
    return 'up';
  }

  if (emptyRow === tileRow + 1 && emptyColumn === tileColumn) {
    return 'down';
  }

  return null;
}

export function getConstrainedDragOffset(
  direction: SwipeDirection,
  deltaX: number,
  deltaY: number,
  maxDistance: number,
) {
  switch (direction) {
    case 'left':
      return {
        x: Math.max(-maxDistance, Math.min(0, deltaX)),
        y: 0,
      };
    case 'right':
      return {
        x: Math.min(maxDistance, Math.max(0, deltaX)),
        y: 0,
      };
    case 'up':
      return {
        x: 0,
        y: Math.max(-maxDistance, Math.min(0, deltaY)),
      };
    case 'down':
      return {
        x: 0,
        y: Math.min(maxDistance, Math.max(0, deltaY)),
      };
  }
}
