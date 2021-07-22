import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AudioContext } from '../contexts';
import frog from '../img/frog.svg';
import {
  IBoardAudio,
  ISlot,
  ITile,
  ITileGrid,
  MotionDirection,
} from '../interfaces';
import {
  BASE_DIMENSION,
  generateTileGrid,
  getMovableSlots,
  isTileGridInOrder,
  moveTileLogically as moveTile,
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

  const {
    moveTileSound,
    wrongMoveRequestTileSound,
    boardOrderHintSound,
    levelCompletedSound,
  }: IBoardAudio = useContext(AudioContext);
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

  const nextLevel = useCallback(() => {
    setMovableSlots([]);
    setTimeout(async () => {
      setOverlayMessage(`You've completed level ${level}`);
      tileGrid.flat().forEach((tile) => {
        delete tile.type;
      });
      setTileGrid([...tileGrid]);
      await levelCompletedSound();
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
    }, 400);
  }, [level, levelCompletedSound, tileGrid]);

  const handleTileMoveRequest = useCallback(
    (slot: ISlot) => {
      moveTile(tileGrid, emptySlot, slot);
      setEmptySlot(slot);
      moveTileSound();
      if (isTileGridInOrder(tileGrid)) {
        nextLevel();
      } else {
        setMovableSlots(
          getMovableSlots(slot, [
            tileGrid.length - 1,
            tileGrid[0].length - 1,
          ]).map((slot): string => slot.join(''))
        );
      }
      setTileGrid([...tileGrid]);
    },
    [emptySlot, nextLevel, tileGrid, moveTileSound]
  );

  const handleTilePositionHintRequest = useCallback(
    (position: number, slot: ISlot): Function | void => {
      const requestingTile = tileGrid.flat()[position];
      const slotTile = tileGrid[slot[0]][slot[1]];
      if (requestingTile !== slotTile) {
        const { type: requestingTileType } = requestingTile;
        const { type: slotTileType } = slotTile;
        requestingTile.type = 'SLOT_HINT';
        slotTile.type = 'MOVE_HINT';
        setTileGrid([...tileGrid]);
        return () => {
          requestingTileType
            ? (requestingTile.type = requestingTileType)
            : delete requestingTile.type;
          slotTileType ? (slotTile.type = slotTileType) : delete slotTile.type;
          setTileGrid([...tileGrid]);
        };
      }
    },
    [tileGrid]
  );

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
  }, [width, tileGridDimensions]);

  useEffect(() => {
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
    window.addEventListener('resize', resizeCallback);
    resizeCallback();
    return () => {
      window.removeEventListener('resize', resizeCallback);
    };
  }, []);

  useEffect(() => {
    if (boardRef.current) {
      const boardNode = boardRef.current;
      const mouseDownEventCallback = (event: MouseEvent) => {
        if (event.button === 0) {
          let exitBoardHint: Function | undefined;
          const hintTimeout = setTimeout(() => {
            tileGrid.forEach((row, rowIndex) => {
              row.forEach((tile, columnIndex) => {
                tile.slotHint = [rowIndex, columnIndex];
              });
            });
            boardOrderHintSound();
            setTileGrid([...tileGrid]);
            exitBoardHint = () => {
              tileGrid.flat().forEach((tile) => delete tile.slotHint);
              setTileGrid([...tileGrid]);
            };
          }, 500);
          const mouseUpEventCallback = () => {
            clearTimeout(hintTimeout);
            typeof exitBoardHint === 'function' && exitBoardHint();
            window.removeEventListener('mouseup', mouseUpEventCallback);
          };
          window.addEventListener('mouseup', mouseUpEventCallback);
        }
      };
      boardNode.addEventListener('mousedown', mouseDownEventCallback);
      return () => {
        boardNode.removeEventListener('mousedown', mouseDownEventCallback);
      };
    }
  }, [tileGrid, boardOrderHintSound]);

  useEffect(() => {
    if (isLevelLoaded) {
      const keyupCallback = (event: KeyboardEvent) => {
        const [x, y] = emptySlot;
        const slotToMove: ISlot = ((): ISlot => {
          switch (event.key) {
            case 'ArrowUp':
            case 'w':
              return [x + 1, y];
            case 'ArrowRight':
            case 'd':
              return [x, y - 1];
            case 'ArrowDown':
            case 's':
              return [x - 1, y];
            case 'ArrowLeft':
            case 'a':
              return [x, y + 1];
          }
          return emptySlot;
        })();
        if (movableSlots.includes(slotToMove.join(''))) {
          handleTileMoveRequest(slotToMove);
        } else {
          wrongMoveRequestTileSound();
        }
      };
      window.addEventListener('keyup', keyupCallback);
      return () => {
        window.removeEventListener('keyup', keyupCallback);
      };
    }
  }, [
    emptySlot,
    movableSlots,
    handleTileMoveRequest,
    isLevelLoaded,
    wrongMoveRequestTileSound,
  ]);

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
        tileGrid
          .flat()
          .map((tile: ITile & { motionDirection?: MotionDirection }) => {
            const [x, y] = tile.slot;
            tile.isLocked = !movableSlots.includes(`${x}${y}`);
            if (!tile.isLocked) {
              if (emptySlot[0] === tile.slot[0]) {
                tile.motionDirection =
                  emptySlot[1] - tile.slot[1] === 1
                    ? MotionDirection.RIGHT
                    : MotionDirection.LEFT;
              } else {
                tile.motionDirection =
                  emptySlot[0] - tile.slot[0] === 1
                    ? MotionDirection.BOTTOM
                    : MotionDirection.TOP;
              }
            }
            return (
              <Tile
                {...tile}
                key={tile.position}
                scaleFactor={scaleFactor}
                onMoveRequest={handleTileMoveRequest}
                onPositionHintRequest={handleTilePositionHintRequest}
              />
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
