'use client';

import type { CSSProperties, MutableRefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { recordCompletedLevel, saveGameState } from '@/app/actions/game';
import {
  BoardState,
  Tile,
  Slot,
  createBoardState,
  isTileGridInOrder,
  moveBoardTile,
  nextGridDimensions,
  slotKey,
} from '@/lib/board';

import styles from './game-board.module.css';

type GameBoardProps = {
  initialBoard: BoardState;
  isSignedIn: boolean;
};

type TileStyleProperties = CSSProperties & {
  '--preview-columns'?: number;
  '--preview-rows'?: number;
};

type BoardTileProps = {
  columns: number;
  hintedSlot: string | null;
  isMovable: boolean;
  isShowingSolvedHint: boolean;
  onHint: (slot: string | null) => void;
  onMove: (slot: Slot) => void;
  rows: number;
  suppressNextClickRef: MutableRefObject<boolean>;
  tile: Tile;
  tileHeight: number;
  tileWidth: number;
};

const LOCAL_STORAGE_KEY = 'sliding-tiles:anonymous-board';
const BOARD_SIZE = 999;
const BOARD_HINT_DELAY_MS = 500;

function BoardTile({
  columns,
  hintedSlot,
  isMovable,
  isShowingSolvedHint,
  onHint,
  onMove,
  rows,
  suppressNextClickRef,
  tile,
  tileHeight,
  tileWidth,
}: BoardTileProps) {
  const [homeRow, homeColumn] = tile.homeSlot;
  const [row, column] = isShowingSolvedHint ? tile.homeSlot : tile.slot;
  const tileClasses = [
    'gb-tile',
    styles.tile,
    isMovable ? '' : `gb-locked ${styles.locked}`,
    hintedSlot === slotKey(tile.homeSlot) ? `gb-hint ${styles.hint}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      aria-label={`Tile ${tile.position + 1}`}
      className={tileClasses}
      key={tile.position}
      onBlur={() => onHint(null)}
      onClick={() => {
        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false;
          return;
        }

        if (isMovable) {
          onMove(tile.slot);
        } else {
          onHint(slotKey(tile.homeSlot));
        }
      }}
      onMouseEnter={() => {
        if (!isMovable) {
          onHint(slotKey(tile.homeSlot));
        }
      }}
      onMouseLeave={() => onHint(null)}
      style={{
        width: `${(tileWidth / BOARD_SIZE) * 100}%`,
        height: `${(tileHeight / BOARD_SIZE) * 100}%`,
        top: `${((row * tileHeight) / BOARD_SIZE) * 100}%`,
        left: `${((column * tileWidth) / BOARD_SIZE) * 100}%`,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        backgroundPosition: `${
          columns > 1 ? (homeColumn / (columns - 1)) * 100 : 0
        }% ${rows > 1 ? (homeRow / (rows - 1)) * 100 : 0}%`,
      }}
      type="button"
    />
  );
}

function SolutionPreview({ columns, rows }: { columns: number; rows: number }) {
  return (
    <figure className={`gb-solution-preview ${styles.solutionPreview}`}>
      <div
        aria-label="Completed puzzle reference image"
        className={`gb-solution-preview-image ${styles.solutionPreviewImage}`}
        role="img"
        style={
          {
            '--preview-columns': columns,
            '--preview-rows': rows,
          } as TileStyleProperties
        }
      />
      <figcaption>Reference image</figcaption>
    </figure>
  );
}

export function GameBoard({ initialBoard, isSignedIn }: GameBoardProps) {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [message, setMessage] = useState('');
  const [hintedSlot, setHintedSlot] = useState<string | null>(null);
  const [isShowingSolvedHint, setIsShowingSolvedHint] = useState(false);
  const boardHintTimeoutRef = useRef<number | null>(null);
  const boardHintMouseUpRef = useRef<(() => void) | null>(null);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    if (isSignedIn) {
      const timeout = window.setTimeout(() => {
        void saveGameState(board);
      }, 350);
      return () => window.clearTimeout(timeout);
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(board));
  }, [board, isSignedIn]);

  const movableSlotKeys = useMemo(() => {
    return new Set(board.movableSlots.map(slotKey));
  }, [board.movableSlots]);

  const completeLevel = useCallback(
    (completedBoard: BoardState) => {
      setMessage(`Level ${completedBoard.level} complete`);
      if (isSignedIn) {
        void recordCompletedLevel(completedBoard);
      }

      window.setTimeout(() => {
        setBoard(
          createBoardState(
            completedBoard.level + 1,
            nextGridDimensions(completedBoard.dimensions)
          )
        );
        setMessage('');
      }, 900);
    },
    [isSignedIn]
  );

  const moveTile = useCallback(
    (slot: Slot) => {
      const nextBoard = moveBoardTile(board, slot);
      setBoard(nextBoard);

      if (nextBoard !== board && isTileGridInOrder(nextBoard.tileGrid)) {
        completeLevel(nextBoard);
      }
    },
    [board, completeLevel]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const [row, column] = board.emptySlot;
      const slotToMove: Slot | null = (() => {
        switch (event.key) {
          case 'ArrowUp':
          case 'w':
            return [row + 1, column];
          case 'ArrowRight':
          case 'd':
            return [row, column - 1];
          case 'ArrowDown':
          case 's':
            return [row - 1, column];
          case 'ArrowLeft':
          case 'a':
            return [row, column + 1];
          default:
            return null;
        }
      })();

      if (slotToMove && movableSlotKeys.has(slotKey(slotToMove))) {
        event.preventDefault();
        moveTile(slotToMove);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, movableSlotKeys, moveTile]);

  const [columns, rows] = board.dimensions;
  const tileWidth = BOARD_SIZE / columns;
  const tileHeight = BOARD_SIZE / rows;

  const clearBoardHint = useCallback(() => {
    if (boardHintTimeoutRef.current !== null) {
      window.clearTimeout(boardHintTimeoutRef.current);
      boardHintTimeoutRef.current = null;
    }
    setIsShowingSolvedHint(false);
    if (boardHintMouseUpRef.current) {
      window.removeEventListener('mouseup', boardHintMouseUpRef.current);
      boardHintMouseUpRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearBoardHint;
  }, [clearBoardHint]);

  const startBoardHint = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      if (boardHintTimeoutRef.current !== null) {
        window.clearTimeout(boardHintTimeoutRef.current);
      }

      boardHintTimeoutRef.current = window.setTimeout(() => {
        suppressNextClickRef.current = true;
        setIsShowingSolvedHint(true);
        boardHintTimeoutRef.current = null;
      }, BOARD_HINT_DELAY_MS);

      if (boardHintMouseUpRef.current) {
        window.removeEventListener('mouseup', boardHintMouseUpRef.current);
      }

      boardHintMouseUpRef.current = clearBoardHint;
      window.addEventListener('mouseup', clearBoardHint, { once: true });
    },
    [clearBoardHint]
  );

  return (
    <div className={`gb-layout ${styles.layout}`}>
      <section
        className={`gb-stage ${styles.stage}`}
        aria-label="Sliding tile board"
      >
        <div
          className={
            isShowingSolvedHint
              ? `gb-board gb-showing-solved-hint ${styles.board} ${styles.showingSolvedHint}`
              : `gb-board ${styles.board}`
          }
          onMouseDown={startBoardHint}
          onMouseLeave={clearBoardHint}
          onMouseUp={clearBoardHint}
        >
          {board.tileGrid.flat().map((tile) => {
            if (tile.type === 'PLACEHOLDER') {
              return null;
            }

            const isMovable = movableSlotKeys.has(slotKey(tile.slot));

            return (
              <BoardTile
                columns={columns}
                hintedSlot={hintedSlot}
                isMovable={isMovable}
                isShowingSolvedHint={isShowingSolvedHint}
                key={tile.position}
                onHint={setHintedSlot}
                onMove={moveTile}
                rows={rows}
                suppressNextClickRef={suppressNextClickRef}
                tile={tile}
                tileHeight={tileHeight}
                tileWidth={tileWidth}
              />
            );
          })}
        </div>
      </section>

      <aside className={`panel gb-card ${styles.card}`}>
        <div>
          <p className="eyebrow">
            {isSignedIn ? 'Saved game' : 'Anonymous game'}
          </p>
          <h2>Level {board.level}</h2>
        </div>
        <SolutionPreview columns={columns} rows={rows} />
        <div className={`gb-stat-grid ${styles.statGrid}`}>
          <div className={`gb-stat ${styles.stat}`}>
            <span>Grid</span>
            <strong>
              {columns}x{rows}
            </strong>
          </div>
          <div className={`gb-stat ${styles.stat}`}>
            <span>Moves</span>
            <strong>{board.moves}</strong>
          </div>
        </div>
        <p className={`gb-notice ${styles.notice}`}>
          Use arrow keys or WASD. Click a movable tile to slide it. Click a
          locked tile to flash where it belongs. Hold the left mouse button on
          the board to briefly reveal the solved layout.
        </p>
        {!isSignedIn && (
          <p className={`gb-notice ${styles.notice}`}>
            Anonymous progress stays in this browser. Sign in to sync your board
            and post leaderboard times.
          </p>
        )}
        <button
          className="button secondary"
          onClick={() =>
            setBoard(createBoardState(board.level, board.dimensions))
          }
          type="button"
        >
          Restart level
        </button>
        {message && <p className="eyebrow">{message}</p>}
      </aside>
    </div>
  );
}
