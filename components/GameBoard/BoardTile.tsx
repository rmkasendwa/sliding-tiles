import { Slot, slotKey, Tile } from '@/lib/board';
import type { MutableRefObject } from 'react';

import {
  BOARD_SIZE,
  HINT_PLACEHOLDER_TRANSITION,
  TILE_BACKGROUND,
  TILE_TRANSITION,
} from './constants';

export type BoardTileProps = {
  columns: number;
  hintedSlot: string | null;
  isHintPlaceholderVisible: boolean;
  isMovable: boolean;
  isShowingSolvedHint: boolean;
  onHint: (slot: string | null) => void;
  onInvalidMove: () => void;
  onMove: (slot: Slot) => void;
  rows: number;
  suppressNextClickRef: MutableRefObject<boolean>;
  tile: Tile;
  tileHeight: number;
  tileWidth: number;
};

export function BoardTile({
  columns,
  hintedSlot,
  isHintPlaceholderVisible,
  isMovable,
  isShowingSolvedHint,
  onHint,
  onInvalidMove,
  onMove,
  rows,
  suppressNextClickRef,
  tile,
  tileHeight,
  tileWidth,
}: BoardTileProps) {
  const [homeRow, homeColumn] = tile.homeSlot;
  const [row, column] = isShowingSolvedHint ? tile.homeSlot : tile.slot;
  const isHintPlaceholder = tile.type === 'PLACEHOLDER';
  const tileClasses = [
    'absolute cursor-pointer rounded-md border border-black/20 bg-no-repeat shadow-[inset_0_-3px_4px_rgba(0,0,0,0.26),inset_0_3px_4px_rgba(255,255,255,0.34),0_16px_22px_rgba(0,0,0,0.24)] hover:z-[8] focus-visible:z-[8]',
    isMovable ? '' : 'cursor-not-allowed',
    isShowingSolvedHint
      ? 'z-[2] cursor-default brightness-[1.04] saturate-[1.08]'
      : '',
    isHintPlaceholder ? 'pointer-events-none' : '',
    hintedSlot === slotKey(tile.homeSlot)
      ? 'z-[9] shadow-[0_18px_30px_rgba(0,0,0,0.28)]'
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
      onClick={() => {
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
      }}
      onMouseEnter={() => {
        if (!isMovable && !isHintPlaceholder) {
          onHint(slotKey(tile.homeSlot));
        }
      }}
      onMouseLeave={() => onHint(null)}
      style={{
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
        transition: isHintPlaceholder
          ? HINT_PLACEHOLDER_TRANSITION
          : TILE_TRANSITION,
      }}
      type="button"
    />
  );
}
