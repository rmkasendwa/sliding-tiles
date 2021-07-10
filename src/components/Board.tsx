import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useRef, useState } from 'react';
import frog from '../img/frog.svg';
import { ISlot, ITile } from '../interfaces';
import Tile from './Tile';

interface IBoardProps {}
interface IGrid {
  dimensions: number[];
  emptySlot: ISlot;
  width: number;
  height: number;
  image: string;
}

const BASE_LEVEL = 1;
const BASE_DIMENSION = 1280;
const BASE_IMAGE = frog;
const BASE_GRID: IGrid = {
  dimensions: [6, 5],
  emptySlot: [0, 0],
  width: BASE_DIMENSION,
  height: BASE_DIMENSION,
  image: BASE_IMAGE,
};
const randomizeTiles = (
  tiles: ITile[],
  randomizationMoves: number
): {
  tiles: ITile[];
  emptySlot?: ISlot;
} => {
  const randomizableTiles = tiles.slice(0);
  let lastTile: ITile | undefined = randomizableTiles.pop();
  let emptySlot = lastTile?.slot || [0, 0];
  for (let i = 0; i < randomizationMoves; i++) {
    const movableSlots: ISlot[] = [
      [emptySlot[0] - 1, emptySlot[1]],
      [emptySlot[0], emptySlot[1] - 1],
      [emptySlot[0] + 1, emptySlot[1]],
      [emptySlot[0], emptySlot[1] + 1],
    ];
    const movableTiles = randomizableTiles.filter(
      ({ slot: [tileX, tileY] }) => {
        return ((): boolean => {
          for (const slot of movableSlots) {
            const [x, y] = slot;
            if (x === tileX && y === tileY) {
              movableSlots.slice(movableSlots.indexOf(slot), 1);
              return true;
            }
          }
          return false;
        })();
      }
    );
    const index = Math.floor(Math.random() * movableTiles.length);
    const movedTile = movableTiles[index];
    const prevEmptySlot = emptySlot;
    emptySlot = movedTile.slot;
    movedTile.slot = prevEmptySlot;
    if (lastTile) {
      const [lastTileIndex, movedTileIndex] = [
        tiles.indexOf(lastTile),
        tiles.indexOf(movedTile),
      ];
      if (lastTileIndex !== movedTileIndex) {
        tiles[lastTileIndex] = movedTile;
        tiles[movedTileIndex] = lastTile;
      }
    }
  }
  return {
    tiles: [...tiles],
    emptySlot,
  };
};
const generateTiles = (grid: IGrid): { order: ISlot[]; tiles: ITile[] } => {
  const tileDimensions = {
    width: grid.width / grid.dimensions[0],
    height: grid.height / grid.dimensions[1],
  };
  const tileBackgroundImage = `url(${grid.image})`;
  const tileBackgroundSize = `${BASE_DIMENSION}px auto`;
  const tiles = Array.from({
    length: grid.dimensions[0] * grid.dimensions[1],
  }).map((a, index): ITile => {
    const x = (index % grid.dimensions[0]) * tileDimensions.width;
    const y = Math.floor(index / grid.dimensions[0]) * tileDimensions.height;
    return {
      slot: [
        index % grid.dimensions[0],
        Math.floor(index / grid.dimensions[0]),
      ],
      dimensions: tileDimensions,
      background: {
        image: tileBackgroundImage,
        size: tileBackgroundSize,
        position: `${-x}px ${-y}px`,
      },
    };
  });
  tiles[tiles.length - 1].type = 'PLACEHOLDER';
  let randomizationMoves = grid.dimensions[0] * grid.dimensions[1] - 1;
  randomizationMoves > 3 && (randomizationMoves *= 100);
  const { tiles: randomizedTiles, emptySlot } = randomizeTiles(
    tiles,
    randomizationMoves
  );
  emptySlot && (grid.emptySlot = emptySlot);
  return {
    order: tiles.map((tile) => tile.slot),
    tiles: randomizedTiles,
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
  const [level, setLevel] = useState(BASE_LEVEL);
  const [grid, setGrid] = useState<IGrid>(BASE_GRID);
  const [winningTileConfig, setWinningTileConfig] = useState<ISlot[]>([]);
  const [tiles, setTiles] = useState<ITile[]>([]);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const height = BASE_DIMENSION / (image.width / image.height);
      setGrid((prevGrid) => ({
        ...prevGrid,
        height,
      }));
      const { order, tiles } = generateTiles({ ...BASE_GRID, height });
      setWinningTileConfig(order);
      setTiles(tiles);
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
  }, []);

  const { width, height } = grid;

  return (
    <div
      className={classes.board}
      ref={boardRef}
      style={{ transform: `scale(${scaleFactor})`, width, height }}
    >
      {tiles.map((tile, index) => (
        <Tile {...tile} key={index} />
      ))}
    </div>
  );
};

export default Board;
