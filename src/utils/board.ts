import { ISlot, ITileGrid } from '../interfaces';

export const moveTile = (
  tileGrid: ITileGrid,
  emptySlot: ISlot,
  movableSlot: ISlot
): {
  emptySlot: ISlot;
} => {
  const [emptySlotX, emptySlotY] = emptySlot;
  const [movableX, movableY] = movableSlot;
  tileGrid[emptySlotX][emptySlotY].slot = movableSlot;
  tileGrid[movableX][movableY].slot = emptySlot;
  const placeholderTile = tileGrid[emptySlotX][emptySlotY];
  tileGrid[emptySlotX][emptySlotY] = tileGrid[movableX][movableY];
  tileGrid[movableX][movableY] = placeholderTile;
  return {
    emptySlot: movableSlot,
  };
};
