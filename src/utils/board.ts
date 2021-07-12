import { ISlot, ITileGrid } from '../interfaces';

export const moveTilePhysically = (
  tileGrid: ITileGrid,
  emptySlot: ISlot,
  movableSlot: ISlot
) => {
  const [emptySlotX, emptySlotY] = emptySlot;
  const [movableX, movableY] = movableSlot;
  moveTileLogically(tileGrid, emptySlot, movableSlot);
  const placeholderTile = tileGrid[emptySlotX][emptySlotY];
  tileGrid[emptySlotX][emptySlotY] = tileGrid[movableX][movableY];
  tileGrid[movableX][movableY] = placeholderTile;
};

export const moveTileLogically = (
  tileGrid: ITileGrid,
  emptySlot: ISlot,
  movableSlot: ISlot
) => {
  const tileIndexTable: any = tileGrid
    .flat()
    .reduce((accumulator: any, tile) => {
      accumulator[tile.slot.join('')] = tile;
      return accumulator;
    }, {});
  tileIndexTable[emptySlot.join('')].slot = movableSlot;
  tileIndexTable[movableSlot.join('')].slot = emptySlot;
};

export const getMovableSlots = (
  [emptyX, emptyY]: ISlot,
  [maxX, maxY]: ISlot
): ISlot[] => {
  const closest: ISlot[] = [
    [emptyX - 1, emptyY],
    [emptyX + 1, emptyY],
    [emptyX, emptyY - 1],
    [emptyX, emptyY + 1],
  ];
  return closest.filter(([x, y]) => {
    return x >= 0 && x <= maxX && y >= 0 && y <= maxY;
  });
};

export const randomizeTileGrid = (
  tileGrid: ITileGrid,
  randomizationMoves: number
): {
  tileGrid: ITileGrid;
  emptySlot: ISlot;
  movableSlots: ISlot[];
} => {
  const maxSlot: ISlot = [tileGrid[0].length - 1, tileGrid.length - 1];
  let emptySlot: ISlot = [...maxSlot];
  let movableSlots: ISlot[] = getMovableSlots(emptySlot, maxSlot);
  for (let i = 0; i < randomizationMoves; i++) {
    const slotInTransit =
      movableSlots[Math.floor(Math.random() * movableSlots.length)];
    moveTileLogically(tileGrid, emptySlot, slotInTransit);
    emptySlot = slotInTransit;
    movableSlots = getMovableSlots(emptySlot, maxSlot);
  }
  return {
    tileGrid: [...tileGrid],
    emptySlot,
    movableSlots,
  };
};

export const BASE_DIMENSION = 1280;

export const generateTileGrid = ({
  width,
  height,
  dimensions,
  image,
}: {
  width: number;
  height: number;
  dimensions: number[];
  image: string;
}): { emptySlot: ISlot; tileGrid: ITileGrid; movableSlots: ISlot[] } => {
  const [columnCount, rowCount] = dimensions;
  const tileDimensions = {
    width: width / columnCount,
    height: height / rowCount,
  };
  const tileBackgroundImage = `url(${image})`;
  const tileBackgroundSize = `${BASE_DIMENSION}px auto`;
  const tileGrid: ITileGrid = Array.from({ length: rowCount }).map(
    (a, rowIndex) => {
      return Array.from({ length: columnCount }).map((a, columnIndex) => {
        const { width, height } = tileDimensions;
        const x = columnIndex * width;
        const y = rowIndex * height;
        return {
          slot: [rowIndex, columnIndex],
          position: rowIndex * rowCount + columnIndex,
          dimensions: tileDimensions,
          background: {
            image: tileBackgroundImage,
            size: tileBackgroundSize,
            position: `${-x}px ${-y}px`,
          },
        };
      });
    }
  );
  tileGrid[rowCount - 1][columnCount - 1].type = 'PLACEHOLDER';
  let randomizationMoves = columnCount * rowCount - 1;
  randomizationMoves > 3 && (randomizationMoves *= 100);
  const {
    tileGrid: randomizedTileGrid,
    emptySlot,
    movableSlots,
  } = randomizeTileGrid(tileGrid, randomizationMoves);
  return {
    tileGrid: randomizedTileGrid,
    emptySlot,
    movableSlots,
  };
};

export const isTileGridInOrder = (tileGrid: ITileGrid): boolean => {
  for (let rowIndex in tileGrid) {
    for (let columnIndex in tileGrid[rowIndex]) {
      if (
        tileGrid[rowIndex][columnIndex].slot[0] !== parseInt(rowIndex) ||
        tileGrid[rowIndex][columnIndex].slot[1] !== parseInt(columnIndex)
      ) {
        return false;
      }
    }
  }
  return true;
};
