import { Slot, slotKey, Tile } from '@/lib/board';
import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type PointerEvent,
} from 'react';

import {
  BOARD_SIZE,
  HINT_PLACEHOLDER_TRANSITION,
  TILE_BACKGROUND,
  TILE_ENTRY_ANIMATION_MS,
  TILE_INVALID_MOVE_FEEDBACK_MS,
  TILE_TRANSITION,
} from './constants';
import {
  getConstrainedDragOffset,
  getSwipeDirection,
  getSwipeDirectionTowardEmptySlot,
  isSwipeTowardEmptySlot,
  TILE_DRAG_COMMIT_RATIO,
  TILE_SWIPE_THRESHOLD_PX,
  type DragPoint,
  type SwipeDirection,
} from './tileDrag';

const TILE_DRAG_SETTLE_MS = 160;
const MIN_ENTRY_SCATTER_RATIO = 0.015;
const MAX_ENTRY_SCATTER_RATIO = 0.07;
const FULL_ENTRY_SCATTER_TILE_COUNT = 24;

type TileDragSession = {
  direction: SwipeDirection;
  maxDistancePx: number;
  pointerId: number;
  start: DragPoint;
};

const resetTileDragVars = (element: HTMLElement | null) => {
  if (!element) {
    return;
  }

  element.style.setProperty('--tile-drag-x', '0px');
  element.style.setProperty('--tile-drag-y', '0px');
};

const setTileDragVars = (
  element: HTMLElement | null,
  offset: { x: number; y: number },
) => {
  if (!element) {
    return;
  }

  element.style.setProperty('--tile-drag-x', `${offset.x}px`);
  element.style.setProperty('--tile-drag-y', `${offset.y}px`);
};

export type BoardTileProps = {
  columns: number;
  emptySlot: Slot;
  hintedSlot: string | null;
  isHintPlaceholderVisible: boolean;
  isEmptySlotHinted: boolean;
  isEntering: boolean;
  isInteractionBlocked: boolean;
  invalidMoveKey: number;
  isMovable: boolean;
  isResetting: boolean;
  isShowingSolvedHint: boolean;
  onHint: (slot: string | null) => void;
  onInvalidMove: (slotKey: string) => void;
  onMove: (slot: Slot) => void;
  rows: number;
  suppressNextClickRef: MutableRefObject<boolean>;
  tile: Tile;
  tileHeight: number;
  tileRotationSeed: number;
  tileWidth: number;
};

function BoardTileComponent({
  columns,
  emptySlot,
  hintedSlot,
  isHintPlaceholderVisible,
  isEmptySlotHinted,
  isEntering,
  isInteractionBlocked,
  invalidMoveKey,
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
  const tileRef = useRef<HTMLButtonElement | null>(null);
  const tileDragSessionRef = useRef<TileDragSession | null>(null);
  const clickSuppressionTimeoutRef = useRef<number | null>(null);
  const pendingMoveTimeoutRef = useRef<number | null>(null);
  const transitionRestoreFrameRef = useRef<number | null>(null);
  const [isDraggingTile, setIsDraggingTile] = useState(false);
  const [isCommittingAtDestination, setIsCommittingAtDestination] =
    useState(false);
  const [dismissedInvalidMoveKey, setDismissedInvalidMoveKey] = useState(0);
  const [homeRow, homeColumn] = tile.homeSlot;
  const [row, column] = isShowingSolvedHint ? tile.homeSlot : tile.slot;
  const currentSlotKey = slotKey(tile.slot);
  const isHintPlaceholder = tile.type === 'PLACEHOLDER';
  const tileCenterX = column * tileWidth + tileWidth / 2;
  const tileCenterY = row * tileHeight + tileHeight / 2;
  const tileCount = columns * rows - 1;
  const entryScatterProgress = Math.min(
    1,
    Math.max(0, (tileCount - 3) / (FULL_ENTRY_SCATTER_TILE_COUNT - 3)),
  );
  const entryScatterMaxDistance =
    BOARD_SIZE *
    (MIN_ENTRY_SCATTER_RATIO +
      (MAX_ENTRY_SCATTER_RATIO - MIN_ENTRY_SCATTER_RATIO) *
        entryScatterProgress);
  const entryScatterAngle =
    (((tile.position * 137 + tileRotationSeed * 53) % 360) * Math.PI) / 180;
  const entryScatterDistance =
    entryScatterMaxDistance *
    Math.sqrt(
      ((tile.position * 73 + tileRotationSeed * 29 + 17) % 101) / 100,
    );
  const entryCenterX =
    BOARD_SIZE / 2 + Math.cos(entryScatterAngle) * entryScatterDistance;
  const entryCenterY =
    BOARD_SIZE / 2 + Math.sin(entryScatterAngle) * entryScatterDistance;
  const entryX = ((entryCenterX - tileCenterX) / tileWidth) * 100;
  const entryY = ((entryCenterY - tileCenterY) / tileHeight) * 100;
  const entryRotation =
    ((tile.position * 37 + tileRotationSeed * 19) % 181) - 90;

  useEffect(
    () => () => {
      if (pendingMoveTimeoutRef.current !== null) {
        window.clearTimeout(pendingMoveTimeoutRef.current);
      }
      if (clickSuppressionTimeoutRef.current !== null) {
        window.clearTimeout(clickSuppressionTimeoutRef.current);
      }
      if (transitionRestoreFrameRef.current !== null) {
        window.cancelAnimationFrame(transitionRestoreFrameRef.current);
      }
      resetTileDragVars(tileRef.current);
    },
    [],
  );

  const showInvalidMoveFeedback = () => {
    onInvalidMove(currentSlotKey);
    onHint(slotKey(tile.homeSlot));
  };
  const suppressNextClick = (durationMs = 0) => {
    suppressNextClickRef.current = true;
    if (clickSuppressionTimeoutRef.current !== null) {
      window.clearTimeout(clickSuppressionTimeoutRef.current);
    }
    clickSuppressionTimeoutRef.current = window.setTimeout(() => {
      clickSuppressionTimeoutRef.current = null;
      suppressNextClickRef.current = false;
    }, durationMs);
  };

  const activateTile = () => {
    if (isInteractionBlocked || isHintPlaceholder) {
      return;
    }

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (isMovable) {
      onMove(tile.slot);
    } else {
      showInvalidMoveFeedback();
    }
  };
  const startTileDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (isInteractionBlocked) {
      return;
    }

    if (pendingMoveTimeoutRef.current !== null) {
      return;
    }

    if (
      !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }

    const allowedDirection = getSwipeDirectionTowardEmptySlot(
      tile.slot,
      emptySlot,
    );

    if (!isMovable || isHintPlaceholder || !allowedDirection) {
      tileDragSessionRef.current = null;
      if (!isHintPlaceholder) {
        showInvalidMoveFeedback();
        suppressNextClick(220);
      }
      return;
    }

    const tileBounds = event.currentTarget.getBoundingClientRect();

    tileDragSessionRef.current = {
      direction: allowedDirection,
      maxDistancePx:
        allowedDirection === 'left' || allowedDirection === 'right'
          ? tileBounds.width
          : tileBounds.height,
      pointerId: event.pointerId,
      start: {
        x: event.clientX,
        y: event.clientY,
      },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    resetTileDragVars(event.currentTarget);
    setIsDraggingTile(false);
  };
  const updateTileDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const dragSession = tileDragSessionRef.current;

    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const nextOffset = getConstrainedDragOffset(
      dragSession.direction,
      event.clientX - dragSession.start.x,
      event.clientY - dragSession.start.y,
      dragSession.maxDistancePx,
    );

    setTileDragVars(event.currentTarget, nextOffset);

    if (
      !isDraggingTile &&
      Math.max(Math.abs(nextOffset.x), Math.abs(nextOffset.y)) > 2
    ) {
      setIsDraggingTile(true);
    }
  };
  const finishTileDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const dragSession = tileDragSessionRef.current;

    if (
      !dragSession ||
      dragSession.pointerId !== event.pointerId ||
      !isMovable ||
      isHintPlaceholder
    ) {
      return;
    }

    tileDragSessionRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const endPoint = {
      x: event.clientX,
      y: event.clientY,
    };
    const direction = getSwipeDirection(dragSession.start, endPoint);
    const finalOffset = getConstrainedDragOffset(
      dragSession.direction,
      endPoint.x - dragSession.start.x,
      endPoint.y - dragSession.start.y,
      dragSession.maxDistancePx,
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
    suppressNextClick();
    setIsDraggingTile(false);

    const shouldCommitMove =
      direction === dragSession.direction &&
      isSwipeTowardEmptySlot(tile.slot, emptySlot, direction) &&
      (dragDistance >=
        dragSession.maxDistancePx * TILE_DRAG_COMMIT_RATIO ||
        dragDistance >= TILE_SWIPE_THRESHOLD_PX);

    if (shouldCommitMove) {
      const isAtDestination =
        dragDistance >= dragSession.maxDistancePx - 1;

      if (isAtDestination) {
        setIsCommittingAtDestination(true);
        resetTileDragVars(event.currentTarget);
        onMove(tile.slot);
        transitionRestoreFrameRef.current = window.requestAnimationFrame(() => {
          transitionRestoreFrameRef.current = window.requestAnimationFrame(
            () => {
              transitionRestoreFrameRef.current = null;
              setIsCommittingAtDestination(false);
            },
          );
        });
        return;
      }

      const destinationOffset = getConstrainedDragOffset(
        dragSession.direction,
        dragSession.direction === 'left'
          ? -dragSession.maxDistancePx
          : dragSession.direction === 'right'
            ? dragSession.maxDistancePx
            : 0,
        dragSession.direction === 'up'
          ? -dragSession.maxDistancePx
          : dragSession.direction === 'down'
            ? dragSession.maxDistancePx
            : 0,
        dragSession.maxDistancePx,
      );

      setTileDragVars(event.currentTarget, destinationOffset);
      pendingMoveTimeoutRef.current = window.setTimeout(() => {
        pendingMoveTimeoutRef.current = null;
        resetTileDragVars(tileRef.current);
        onMove(tile.slot);
      }, TILE_DRAG_SETTLE_MS);
      return;
    }

    resetTileDragVars(event.currentTarget);
  };
  const cancelTileDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const dragSession = tileDragSessionRef.current;
    if (!dragSession || dragSession.pointerId !== event.pointerId) {
      return;
    }

    if (pendingMoveTimeoutRef.current !== null) {
      window.clearTimeout(pendingMoveTimeoutRef.current);
      pendingMoveTimeoutRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    tileDragSessionRef.current = null;
    setIsDraggingTile(false);
    resetTileDragVars(event.currentTarget);
  };
  const tileClasses = [
    'board-tile absolute cursor-pointer rounded-md border border-foreground/20 bg-no-repeat shadow-tile hover:z-[8] focus-visible:z-[8]',
    isInteractionBlocked ? 'pointer-events-none cursor-wait' : '',
    isMovable ? '' : 'cursor-not-allowed',
    isShowingSolvedHint
      ? 'z-[2] cursor-default brightness-[1.04] saturate-[1.08]'
      : '',
    isHintPlaceholder ? 'pointer-events-none' : '',
    isEmptySlotHinted ? 'board-tile-empty-slot-hint z-[7]' : '',
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
      disabled={isInteractionBlocked}
      key={tile.position}
      onBlur={() => onHint(null)}
      onClick={activateTile}
      onMouseEnter={() => {
        if (!isMovable && !isHintPlaceholder) {
          onHint(slotKey(tile.homeSlot));
        }
      }}
      onMouseLeave={() => onHint(null)}
      onLostPointerCapture={cancelTileDrag}
      onPointerCancel={cancelTileDrag}
      onPointerDown={(event) => {
        event.stopPropagation();
        startTileDrag(event);
      }}
      onPointerMove={updateTileDrag}
      onPointerUp={finishTileDrag}
      ref={tileRef}
      onDragStart={(event) => event.preventDefault()}
      style={
        {
          width: `${(tileWidth / BOARD_SIZE) * 100}%`,
          height: `${(tileHeight / BOARD_SIZE) * 100}%`,
          top: 0,
          left: 0,
          backgroundImage: TILE_BACKGROUND,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          backgroundPosition: `${
            columns > 1 ? (homeColumn / (columns - 1)) * 100 : 0
          }% ${rows > 1 ? (homeRow / (rows - 1)) * 100 : 0}%`,
          opacity: isHintPlaceholder && !isHintPlaceholderVisible ? 0 : 1,
          WebkitTapHighlightColor: 'transparent',
          touchAction: isMovable ? 'none' : 'manipulation',
          userSelect: 'none',
          transform:
            'translate3d(calc(var(--tile-translate-x) + var(--tile-drag-x, 0px)), calc(var(--tile-translate-y) + var(--tile-drag-y, 0px)), 0)',
          willChange:
            isMovable || isDraggingTile || isCommittingAtDestination
              ? 'transform'
              : undefined,
          '--tile-translate-x': `${column * 100}%`,
          '--tile-translate-y': `${row * 100}%`,
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
          transition: isDraggingTile || isCommittingAtDestination
            ? 'none'
            : isHintPlaceholder
              ? HINT_PLACEHOLDER_TRANSITION
              : TILE_TRANSITION,
        } as CSSProperties
      }
      type="button"
    >
      {invalidMoveKey > 0 &&
      invalidMoveKey !== dismissedInvalidMoveKey &&
      !isInteractionBlocked &&
      !isHintPlaceholder ? (
        <span
          aria-hidden="true"
          className="board-tile-invalid-move-indicator"
          key={invalidMoveKey}
          onAnimationEnd={() => setDismissedInvalidMoveKey(invalidMoveKey)}
          style={{ animationDuration: `${TILE_INVALID_MOVE_FEEDBACK_MS}ms` }}
        />
      ) : null}
    </button>
  );
}

const areSlotsEqual = (first: Slot, second: Slot) =>
  first[0] === second[0] && first[1] === second[1];

export const BoardTile = memo(BoardTileComponent, (previous, next) => {
  const needsEmptySlot =
    previous.isMovable || next.isMovable || previous.isShowingSolvedHint;

  return (
    previous.columns === next.columns &&
    previous.hintedSlot === next.hintedSlot &&
    previous.isHintPlaceholderVisible === next.isHintPlaceholderVisible &&
    previous.isEmptySlotHinted === next.isEmptySlotHinted &&
    previous.isEntering === next.isEntering &&
    previous.isInteractionBlocked === next.isInteractionBlocked &&
    previous.invalidMoveKey === next.invalidMoveKey &&
    previous.isMovable === next.isMovable &&
    previous.isResetting === next.isResetting &&
    previous.isShowingSolvedHint === next.isShowingSolvedHint &&
    previous.onHint === next.onHint &&
    previous.onInvalidMove === next.onInvalidMove &&
    previous.onMove === next.onMove &&
    previous.rows === next.rows &&
    previous.suppressNextClickRef === next.suppressNextClickRef &&
    previous.tile === next.tile &&
    previous.tileHeight === next.tileHeight &&
    previous.tileRotationSeed === next.tileRotationSeed &&
    previous.tileWidth === next.tileWidth &&
    (!needsEmptySlot || areSlotsEqual(previous.emptySlot, next.emptySlot))
  );
});
