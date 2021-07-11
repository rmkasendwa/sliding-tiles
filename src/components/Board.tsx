import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useRef, useState } from 'react';
import frog from '../img/frog.svg';
import { ISlot, ITile } from '../interfaces';
import Tile from './Tile';

interface IBoardProps {}
type ITileGrid = ITile[][];

const BASE_DIMENSION = 1280;
const BASE_IMAGE = frog;

const getMovableSlots = (
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

const moveTile = (
  tileGrid: ITileGrid,
  emptySlot: ISlot,
  movableSlot: ISlot
): {
  emptySlot: ISlot;
} => {
  const [emptySlotX, emptySlotY] = emptySlot;
  const [movableX, movableY] = movableSlot;
  tileGrid[emptySlotX][emptySlotY].slot = tileGrid[movableX][movableY].slot;
  tileGrid[movableX][movableY].slot = emptySlot;
  const placeholderTile = tileGrid[emptySlotX][emptySlotY];
  tileGrid[emptySlotX][emptySlotY] = tileGrid[movableX][movableY];
  tileGrid[movableX][movableY] = placeholderTile;
  return {
    emptySlot: movableSlot,
  };
};

const randomizeTileGrid = (
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
    const { emptySlot: newEmptySlot } = moveTile(
      tileGrid,
      emptySlot,
      movableSlots[Math.floor(Math.random() * movableSlots.length)]
    );
    emptySlot = newEmptySlot;
    movableSlots = getMovableSlots(emptySlot, maxSlot);
  }
  return {
    tileGrid: [...tileGrid],
    emptySlot,
    movableSlots,
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
          slot: [columnIndex, rowIndex],
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
  const [tileGrid, setTileGrid] = useState<ITileGrid>([]);
  const [emptySlot, setEmptySlot] = useState<ISlot>([0, 0]);
  const [movableSlots, setMovableSlots] = useState<string[]>([]);
  const [scaleFactor, setScaleFactor] = useState(1);

  const handleClickTile = (slot: ISlot) => {
    console.log(slot);
    const { emptySlot: newEmptySlot } = moveTile(tileGrid, emptySlot, slot);
    setEmptySlot(newEmptySlot);
    setMovableSlots(
      getMovableSlots(emptySlot, [
        tileGrid[0].length - 1,
        tileGrid.length - 1,
      ]).map((slot): string => slot.join())
    );
    setTileGrid([...tileGrid]);
  };

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const height = BASE_DIMENSION / (image.width / image.height);
      setHeight(height);
      const { tileGrid, emptySlot, movableSlots } = generateTileGrid({
        width,
        height,
        dimensions: [3, 3],
        image: BASE_IMAGE,
      });
      setTileGrid(tileGrid);
      setEmptySlot(emptySlot);
      setMovableSlots(
        movableSlots.map((movableSlot): string => movableSlot.join(''))
      );
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
        tileGrid
          .map((tileRow, rowIndex) => {
            return tileRow.map((tile, columnIndex) => {
              tile.isLocked = !movableSlots.includes(
                `${columnIndex}${rowIndex}`
              );
              return tile;
            });
          })
          .flat()
          .map((tile) => (
            <Tile {...tile} key={tile.position} onClick={handleClickTile} />
          ))}
    </div>
  );
};

export default Board;
