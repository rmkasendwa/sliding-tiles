import { Slot, slotKey, Tile } from '@/lib/board';
import {
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type TouchEvent,
} from 'react';

import {
  BOARD_SIZE,
  HINT_PLACEHOLDER_TRANSITION,
  TILE_BACKGROUND,
  TILE_ENTRY_ANIMATION_MS,
  TILE_TRANSITION,
} from './constants';
import {
  getConstrainedDragOffset,
  getSwipeDirection,
  getSwipeDirectionTowardEmptySlot,
  isSwipeTowardEmptySlot,
  TILE_DRAG_COMMIT_RATIO,
  TILE_SWIPE_THRESHOLD_PX,
  type SwipeDirection,
  type TouchPoint,
} from './touchSwipe';

type TileDragSession = {
  direction: SwipeDirection;
  maxDistance: number;
  start: TouchPoint;
};

export type BoardTileProps = {
  columns: number;
  emptySlot: Slot;
  hintedSlot: string | null;
  isHintPlaceholderVisible: boolean;
  isEntering: boolean;
  isMovable: boolean;
  isResetting: boolean;
  isShowingSolvedHint: boolean;
  onHint: (slot: string | null) => void;
  onInvalidMove: () => void;
  onMove: (slot: Slot) => void;
  rows: number;
  suppressNextClickRef: MutableRefObject<boolean>;
  tile: Tile;
  tileHeight: number;
  tileRotationSeed: number;
  tileWidth: number;
};

export function BoardTile({
  columns,
  emptySlot,
  hintedSlot,
  isHintPlaceholderVisible,
  isEntering,
  isMovable,
  isResetting,
  isShowingSolvedHint,
  onHint,
  onInvalidMove,
  onMove,
  rows,
  suppressNextClickRef,
  tile,
  tileHeight,
  tileRotationSeed,
  tileWidth,
}: BoardTileProps) {
  const tileDragSessionRef = useRef<TileDragSession | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingTile, setIsDraggingTile] = useState(false);
  const [homeRow, homeColumn] = tile.homeSlot;
  const [row, column] = isShowingSolvedHint ? tile.homeSlot : tile.slot;
  const isHintPlaceholder = tile.type === 'PLACEHOLDER';
  const tileCenterX = column * tileWidth + tileWidth / 2;
  const tileCenterY = row * tileHeight + tileHeight / 2;
  const entryX = ((BOARD_SIZE / 2 - tileCenterX) / tileWidth) * 100;
  const entryY = ((BOARD_SIZE / 2 - tileCenterY) / tileHeight) * 100;
  const entryRotation =
    ((tile.position * 37 + tileRotationSeed * 19) % 181) - 90;
  const activateTile = () => {
    if (isHintPlaceholder) {
      return;
    }

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (isMovable) {
      onMove(tile.slot);
    } else {
      onInvalidMove();
      onHint(slotKey(tile.homeSlot));
    }
  };
  const startTileSwipe = (event: TouchEvent<HTMLButtonElement>) => {
    const allowedDirection = getSwipeDirectionTowardEmptySlot(
      tile.slot,
      emptySlot,
    );

    if (!isMovable || isHintPlaceholder || !allowedDirection) {
      tileDragSessionRef.current = null;
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      tileDragSessionRef.current = null;
      return;
    }

    tileDragSessionRef.current = {
      direction: allowedDirection,
      maxDistance:
        allowedDirection === 'left' || allowedDirection === 'right'
          ? tileWidth
          : tileHeight,
      start: {
        x: touch.clientX,
        y: touch.clientY,
      },
    };
    setDragOffset({ x: 0, y: 0 });
    setIsDraggingTile(false);
  };
  const preventSwipeScroll = (event: TouchEvent<HTMLButtonElement>) => {
    const dragSession = tileDragSessionRef.current;
    const touch = event.touches[0];

    if (!dragSession || !touch) {
      return;
    }

    event.preventDefault();

    const nextOffset = getConstrainedDragOffset(
      dragSession.direction,
      touch.clientX - dragSession.start.x,
      touch.clientY - dragSession.start.y,
      dragSession.maxDistance,
    );

    setDragOffset(nextOffset);

    if (
      !isDraggingTile &&
      Math.max(Math.abs(nextOffset.x), Math.abs(nextOffset.y)) > 2
    ) {
      setIsDraggingTile(true);
    }
  };
  const finishTileSwipe = (event: TouchEvent<HTMLButtonElement>) => {
    const dragSession = tileDragSessionRef.current;
    tileDragSessionRef.current = null;

    if (!dragSession || !isMovable || isHintPlaceholder) {
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    const endPoint = {
      x: touch.clientX,
      y: touch.clientY,
    };
    const direction = getSwipeDirection(dragSession.start, endPoint);
    const finalOffset = getConstrainedDragOffset(
      dragSession.direction,
      endPoint.x - dragSession.start.x,
      endPoint.y - dragSession.start.y,
      dragSession.maxDistance,
    );
    const dragDistance = Math.max(
      Math.abs(finalOffset.x),
      Math.abs(finalOffset.y),
    );
    const didDragVisibly = dragDistance > 2;

    if (!direction && !didDragVisibly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressNextClickRef.current = true;
    setIsDraggingTile(false);

    if (
      dragDistance >= dragSession.maxDistance * TILE_DRAG_COMMIT_RATIO &&
      direction === dragSession.direction &&
      isSwipeTowardEmptySlot(tile.slot, emptySlot, direction)
    ) {
      setDragOffset({ x: 0, y: 0 });
      onMove(tile.slot);
      return;
    }

    if (
      direction === dragSession.direction &&
      dragDistance >= TILE_SWIPE_THRESHOLD_PX &&
      isSwipeTowardEmptySlot(tile.slot, emptySlot, direction)
    ) {
      setDragOffset({ x: 0, y: 0 });
      onMove(tile.slot);
      return;
    }

    setDragOffset({ x: 0, y: 0 });
  };
  const cancelTileSwipe = () => {
    tileDragSessionRef.current = null;
    setIsDraggingTile(false);
    setDragOffset({ x: 0, y: 0 });
  };
  const tileClasses = [
    'board-tile absolute cursor-pointer rounded-md border border-foreground/20 bg-no-repeat shadow-tile hover:z-[8] focus-visible:z-[8]',
    isMovable ? '' : 'cursor-not-allowed',
    isShowingSolvedHint
      ? 'z-[2] cursor-default brightness-[1.04] saturate-[1.08]'
      : '',
    isHintPlaceholder ? 'pointer-events-none' : '',
    isDraggingTile ? 'z-[12]' : '',
    hintedSlot === slotKey(tile.homeSlot)
      ? 'z-[9] shadow-tile-active'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      aria-label={`Tile ${tile.position + 1}`}
      className={tileClasses}
      key={tile.position}
      onBlur={() => onHint(null)}
      onClick={activateTile}
      onMouseEnter={() => {
        if (!isMovable && !isHintPlaceholder) {
          onHint(slotKey(tile.homeSlot));
        }
      }}
      onMouseLeave={() => onHint(null)}
      onTouchCancel={cancelTileSwipe}
      onTouchEnd={finishTileSwipe}
      onTouchMove={preventSwipeScroll}
      onTouchStart={startTileSwipe}
      style={
        {
          width: `${(tileWidth / BOARD_SIZE) * 100}%`,
          height: `${(tileHeight / BOARD_SIZE) * 100}%`,
          top: `${((row * tileHeight) / BOARD_SIZE) * 100}%`,
          left: `${((column * tileWidth) / BOARD_SIZE) * 100}%`,
          backgroundImage: TILE_BACKGROUND,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          backgroundPosition: `${
            columns > 1 ? (homeColumn / (columns - 1)) * 100 : 0
          }% ${rows > 1 ? (homeRow / (rows - 1)) * 100 : 0}%`,
          opacity: isHintPlaceholder && !isHintPlaceholderVisible ? 0 : 1,
          WebkitTapHighlightColor: 'transparent',
          touchAction: isMovable ? 'none' : 'manipulation',
          transform:
            dragOffset.x !== 0 || dragOffset.y !== 0
              ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`
              : undefined,
          '--tile-entry-x': `${entryX}%`,
          '--tile-entry-y': `${entryY}%`,
          '--tile-entry-rotation': `${entryRotation}deg`,
          animation: isShowingSolvedHint
            ? undefined
            : isResetting
              ? 'tile-reset-exit 500ms cubic-bezier(0.42, 0, 0.28, 1) both'
              : isEntering
                ? `tile-enter ${TILE_ENTRY_ANIMATION_MS}ms cubic-bezier(0.16, 0.72, 0.2, 1) both`
                : undefined,
          transition: isDraggingTile
            ? 'none'
            : isHintPlaceholder
              ? HINT_PLACEHOLDER_TRANSITION
              : `${TILE_TRANSITION}, transform 160ms ease`,
        } as CSSProperties
      }
      type="button"
    />
  );
}
