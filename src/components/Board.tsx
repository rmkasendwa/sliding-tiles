import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useRef, useState } from 'react';
import frog from '../img/frog.svg';
import { ISlot, ITile } from '../interfaces';
import Tile from './Tile';

interface IBoardProps {}

const controlKeys = {
  CONTROL_UP: 38,
  CONTROL_RIGHT: 39,
  CONTROL_DOWN: 40,
  CONTROL_LEFT: 37,
};

const useStyles = makeStyles(() => ({
  root: {
    backgroundColor: '#ccc',
    position: 'absolute',
    overflow: 'hidden',
    counterReset: 'tile-number',
    width: 600,
    height: 600,
    borderRadius: 4,
  },
}));

const Board: React.FC<IBoardProps> = () => {
  const classes = useStyles();

  const boardRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<{
    dimensions: number[];
    emptySlot?: ISlot;
  }>({
    dimensions: [2, 2],
  });
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(600);
  const [winningTileConfig, setWinningTileConfig] = useState<ISlot[]>([]);
  const [tiles, setTiles] = useState<ITile[]>([]);
  const [scaleFactor, setScaleFactor] = useState(1);

  const getTileDimensions = () => {
    return {
      width: width / grid.dimensions[0],
      height: height / grid.dimensions[1],
    };
  };

  const reset = () => {
    const tileDimensions = getTileDimensions();
    const tileBackgroundImage = `url(${frog})`;
    const tileBackgroundSize = `600px auto`;
    const tiles = Array.from({
      length: grid.dimensions[0] * grid.dimensions[1],
    }).map((a, index): ITile => {
      return {
        slot: [
          index % grid.dimensions[0],
          Math.floor(index / grid.dimensions[0]),
        ],
        dimensions: tileDimensions,
        background: {
          image: tileBackgroundImage,
          size: tileBackgroundSize,
        },
        position: {
          x: (index % grid.dimensions[0]) * tileDimensions.width,
          y: Math.floor(index / grid.dimensions[0]) * tileDimensions.height,
        },
      };
    });
    grid.emptySlot = tiles[tiles.length - 1].slot;
    setWinningTileConfig(tiles.map((tile) => tile.slot));
    setTiles(tiles);
  };

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const imageAspectRatio = image.width / (image.height || 1);
      reset();
    };
    image.src = frog;

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
          const heightScaleFactor = boardParentHeight / (boardHeight + 50);
          const widthScaleFactor = boardParentWidth / (boardWidth + 50);
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
    return () => {
      window.removeEventListener('resize', resizeCallback);
      window.removeEventListener('keyup', keyupCallback);
    };
  }, []);

  return (
    <div
      className={classes.root}
      ref={boardRef}
      style={{ transform: `scale(${scaleFactor})` }}
    >
      {tiles.map((tile, index) => (
        <Tile {...tile} key={index} />
      ))}
    </div>
  );
};

export default Board;
