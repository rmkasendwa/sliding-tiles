import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useEffect, useRef, useState } from 'react';
import frog from '../img/frog.svg';
import { ISlot, ITileGrid } from '../interfaces';
import {
  BASE_DIMENSION,
  generateTileGrid,
  getMovableSlots,
  moveTileLogically as moveTile,
  isTileGridInOrder,
} from '../utils/board';
import Tile from './Tile';

interface IBoardProps {}

const BASE_IMAGE = frog;
const BASE_LEVEL = 1;
const BASE_GRID_DIMENSIONS: ISlot = [3, 2];

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
  const [tileGridDimensions, setTileGridDimensions] =
    useState<ISlot>(BASE_GRID_DIMENSIONS);
  const [isLevelLoaded, setILevelLoaded] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState('');
  const [width] = useState(BASE_DIMENSION);
  const [height, setHeight] = useState(BASE_DIMENSION);
  const [tileGrid, setTileGrid] = useState<ITileGrid>([]);
  const [emptySlot, setEmptySlot] = useState<ISlot>([0, 0]);
  const [movableSlots, setMovableSlots] = useState<string[]>([]);
  const [scaleFactor, setScaleFactor] = useState(1);

  const handleClickTile = (slot: ISlot) => {
    moveTile(tileGrid, emptySlot, slot);
    setEmptySlot(slot);
    if (isTileGridInOrder(tileGrid)) {
      setMovableSlots([]);
      setTimeout(() => {
        setOverlayMessage(`You've completed level ${level}`);
        tileGrid.flat().forEach((tile) => {
          delete tile.type;
        });
        setTileGrid([...tileGrid]);
      }, 400);
      setTimeout(() => {
        setLevel((prevLevel) => prevLevel + 1);
        setTileGridDimensions(([x, y]) => {
          if (y >= x) {
            x++;
          } else {
            y++;
          }
          return [x, y];
        });
        setTileGrid([]);
        setILevelLoaded(false);
        setOverlayMessage('');
      }, 5000);
    } else {
      setMovableSlots(
        getMovableSlots(slot, [
          tileGrid.length - 1,
          tileGrid[0].length - 1,
        ]).map((slot): string => slot.join(''))
      );
    }
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
        dimensions: tileGridDimensions,
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
  }, [width, tileGridDimensions]);

  useEffect(() => {
    if (!isLevelLoaded) {
      if (tileGrid.length > 0) {
        setOverlayMessage(`Level ${level}`);
        const timeout = setTimeout(() => {
          setOverlayMessage('');
          setILevelLoaded(true);
        }, 3000);
        return () => clearTimeout(timeout);
      } else {
        setOverlayMessage(`Loading level ${level}...`);
      }
    }
  }, [level, tileGrid, isLevelLoaded]);

  return (
    <div
      className={classes.board}
      ref={boardRef}
      style={{ transform: `scale(${scaleFactor})`, width, height }}
    >
      {tileGrid &&
        tileGrid.flat().map((tile) => {
          const [x, y] = tile.slot;
          tile.isLocked = !movableSlots.includes(`${x}${y}`);
          return (
            <Tile {...tile} key={tile.position} onClick={handleClickTile} />
          );
        })}
      {overlayMessage && (
        <Box
          display="flex"
          position="absolute"
          width="100%"
          height="100%"
          zIndex={9999}
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(0,0,0,.7)"
          color="#fff"
        >
          <Typography variant="h1">{overlayMessage}</Typography>
        </Box>
      )}
    </div>
  );
};

export default Board;
