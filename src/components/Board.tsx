import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useRef, useState } from 'react';
import frog from '../img/frog.svg';
import { ISlot, ITile } from '../interfaces';
import Tile from './Tile';

interface IBoardProps {}
type ITileGrid = ITile[][];

const BASE_DIMENSION = 1280;
const BASE_IMAGE = frog;

const getMovableSlot = (
  [emptyX, emptyY]: ISlot,
  [maxX, maxY]: ISlot
): ISlot[] => {
  const neibouringSlots: ISlot[] = [
    [emptyX - 1, emptyY],
    [emptyX + 1, emptyY],
    [emptyX, emptyY - 1],
    [emptyX, emptyY + 1],
  ];
  return neibouringSlots.filter(([x, y]) => {
    return x >= 0 && x <= maxX && y >= 0 && y <= maxY;
  });
};
const randomizeTileGrid = (
  tileGrid: ITileGrid,
  randomizationMoves: number
): {
  tileGrid: ITileGrid;
  emptySlot?: ISlot;
} => {
  const randomizableTiles = tileGrid.flat();
  let lastTile: ITile | undefined = randomizableTiles.pop();
  const maxSlot: ISlot = [tileGrid[0].length - 1, tileGrid.length - 1];
  let emptySlot: ISlot = [...maxSlot];
  for (let i = 0; i < randomizationMoves; i++) {
    const movableSlots: ISlot[] = getMovableSlot(emptySlot, maxSlot);
    const [emptySlotX, emptySlotY] = emptySlot;
    const [movedSlotX, movedSlotY] =
      movableSlots[Math.floor(Math.random() * movableSlots.length)];
    // throw 1;
    const movedTile = tileGrid[movedSlotX][movedSlotY];
    const prevEmptySlot = emptySlot;
    emptySlot = movedTile.slot;
    movedTile.slot = prevEmptySlot;
    if (lastTile) {
      if (emptySlotX !== movedSlotX || emptySlotY !== movedSlotY) {
        tileGrid[emptySlotX][emptySlotY] = movedTile;
        tileGrid[movedSlotX][movedSlotY] = lastTile;
      }
    }
  }
  return {
    tileGrid: [...tileGrid],
    emptySlot,
  };
};
const generateTileGrid = ({
  width,
  height,
  dimensions,
  image,
}: {
  width: number;
  height: number;
  dimensions: number[];
  image: string;
}): { emptySlot?: ISlot; tileGrid: ITileGrid } => {
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
        const x = columnIndex * tileDimensions.width;
        const y = rowIndex * tileDimensions.height;
        return {
          slot: [columnIndex, rowIndex],
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
  const { tileGrid: randomizedTileGrid, emptySlot } = randomizeTileGrid(
    tileGrid,
    randomizationMoves
  );
  return {
    tileGrid: randomizedTileGrid,
    emptySlot,
  };
};

const useStyles = makeStyles(() => ({
  board: {
    backgroundColor: '#ccc',
    position: 'absolute',
    overflow: 'hidden',
    counterReset: 'tile-number',
    width: BASE_DIMENSION,
    height: BASE_DIMENSION,
    borderRadius: 6,
  },
}));

const Board: React.FC<IBoardProps> = () => {
  const classes = useStyles();

  const boardRef = useRef<HTMLDivElement>(null);
  const [width] = useState(BASE_DIMENSION);
  const [height, setHeight] = useState(BASE_DIMENSION);
  const [tileGrid, setGrid] = useState<ITileGrid | null>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const height = BASE_DIMENSION / (image.width / image.height);
      setHeight(height);
      const { tileGrid } = generateTileGrid({
        width,
        height,
        dimensions: [3, 3],
        image: BASE_IMAGE,
      });
      setGrid(tileGrid);
    };
    image.src = BASE_IMAGE;
    const resizeCallback = () => {
      if (boardRef.current) {
        const { offsetHeight: boardHeight, offsetWidth: boardWidth } =
          boardRef.current;
        const { parentElement } = boardRef.current;
        if (parentElement) {
          const {
            offsetHeight: boardParentHeight,
            offsetWidth: boardParentWidth,
          } = parentElement;
          const heightScaleFactor = boardParentHeight / (boardHeight + 120);
          const widthScaleFactor = boardParentWidth / (boardWidth + 120);
          if (heightScaleFactor < 1 || widthScaleFactor < 1) {
            setScaleFactor(
              heightScaleFactor < widthScaleFactor
                ? heightScaleFactor
                : widthScaleFactor
            );
          } else {
            setScaleFactor(1);
          }
        }
      }
    };
    const keyupCallback = () => {
      // Navigate
    };
    window.addEventListener('resize', resizeCallback);
    window.addEventListener('keyup', keyupCallback);
    resizeCallback();
    return () => {
      window.removeEventListener('resize', resizeCallback);
      window.removeEventListener('keyup', keyupCallback);
    };
  }, [width]);

  return (
    <div
      className={classes.board}
      ref={boardRef}
      style={{ transform: `scale(${scaleFactor})`, width, height }}
    >
      {tileGrid &&
        tileGrid.flat().map((tile, index) => <Tile {...tile} key={index} />)}
    </div>
  );
};

export default Board;
