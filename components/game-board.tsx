'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { recordCompletedLevel, saveGameState } from '@/app/actions/game';
import {
  BoardState,
  Slot,
  createBoardState,
  isTileGridInOrder,
  moveBoardTile,
  nextGridDimensions,
  slotKey,
} from '@/lib/board';

type GameBoardProps = {
  initialBoard: BoardState;
  isSignedIn: boolean;
};

const LOCAL_STORAGE_KEY = 'sliding-tiles:anonymous-board';
const BOARD_SIZE = 999;

export function GameBoard({ initialBoard, isSignedIn }: GameBoardProps) {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [message, setMessage] = useState('');
  const [hintedSlot, setHintedSlot] = useState<string | null>(null);

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

  return (
    <div className="game-layout">
      <section className="game-stage" aria-label="Sliding tile board">
        <div className="board">
          {board.tileGrid.flat().map((tile) => {
            const [homeRow, homeColumn] = tile.homeSlot;
            const [row, column] = tile.slot;
            const isPlaceholder = tile.type === 'PLACEHOLDER';
            const isMovable = movableSlotKeys.has(slotKey(tile.slot));
            const tileClasses = [
              'tile',
              isPlaceholder ? 'placeholder' : '',
              isMovable ? '' : 'locked',
              hintedSlot === slotKey(tile.homeSlot) ? 'hint' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                aria-label={
                  isPlaceholder
                    ? 'Empty slot'
                    : `Tile ${tile.position + 1}`
                }
                className={tileClasses}
                disabled={isPlaceholder}
                key={tile.position}
                onBlur={() => setHintedSlot(null)}
                onClick={() => {
                  if (isMovable) {
                    moveTile(tile.slot);
                  } else {
                    setHintedSlot(slotKey(tile.homeSlot));
                  }
                }}
                onMouseEnter={() => {
                  if (!isMovable && !isPlaceholder) {
                    setHintedSlot(slotKey(tile.homeSlot));
                  }
                }}
                onMouseLeave={() => setHintedSlot(null)}
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
          })}
        </div>
      </section>

      <aside className="panel game-card">
        <div>
          <p className="eyebrow">
            {isSignedIn ? 'Saved game' : 'Anonymous game'}
          </p>
          <h2>Level {board.level}</h2>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <span>Grid</span>
            <strong>
              {columns}x{rows}
            </strong>
          </div>
          <div className="stat">
            <span>Moves</span>
            <strong>{board.moves}</strong>
          </div>
        </div>
        <p className="notice">
          Use arrow keys or WASD. Click a movable tile to slide it. Click a
          locked tile to flash where it belongs.
        </p>
        {!isSignedIn && (
          <p className="notice">
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
