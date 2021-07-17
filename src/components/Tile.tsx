import { makeStyles } from '@material-ui/styles';
import React, { CSSProperties, useContext, useEffect, useRef } from 'react';
import { AudioContext } from '../contexts';
import { IBoardAudio, ISlot, ITile } from '../interfaces';

interface ITileProps extends ITile {
  onMoveRequest: (slot: ISlot) => void;
  onPositionHintRequest: (position: number, slot: ISlot) => Function | void;
}

const useStyles = makeStyles(() => ({
  tile: {
    display: 'block',
    backgroundRepeat: 'no-repeat',
    position: 'absolute',
    borderRadius: '6px',
    transition: 'left .2s, top .2s',
    willChange: 'top, left, z-index',
    '&:before': {
      display: 'none',
      counterIncrement: 'tile-number',
      content: 'counter(tile-number)',
      paddingLeft: '10px',
      paddingTop: '10px',
      color: '#ddd',
      textShadow: '0 1px 1px #000',
    },
  },
  moveHint: {
    boxShadow: `
      0px 0px 10px #0f0,
      0px 0px 10px #0f0 inset
    `,
    zIndex: 99,
  },
  slotHint: {
    border: '4px solid transparent',
    boxSizing: 'border-box',
    background: `
      linear-gradient(#ccc, #ccc) padding-box,
      repeating-linear-gradient(-45deg, #333 0, #333 25%, transparent 0, transparent 50%) 0 / .6em .6em
    `,
    animation: '$ants 12s linear infinite',
    zIndex: 100,
  },
  '@keyframes ants': {
    to: {
      backgroundPosition: '100%',
    },
  },
}));

const Tile: React.FC<ITileProps> = ({
  background,
  dimensions,
  type,
  slot,
  slotHint,
  onMoveRequest,
  isLocked,
  position,
  onPositionHintRequest,
}) => {
  slotHint && (slot = slotHint);
  const classes = useStyles();

  const { wrongMoveRequestTileSound }: IBoardAudio = useContext(AudioContext);

  const classList = [classes.tile];
  const style: CSSProperties = {
    width: dimensions.width,
    height: dimensions.height,
    top: slot[0] * dimensions.height,
    left: slot[1] * dimensions.width,
  };
  if (!['SLOT_HINT', 'MOVE_HINT'].includes(type || '')) {
    style.zIndex = slot[0];
  }
  switch (type) {
    case 'PLACEHOLDER':
      break;
    case 'SLOT_HINT':
      classList.push(classes.slotHint);
      break;
  }
  if (!type || type === 'MOVE_HINT' || slotHint) {
    Object.assign(style, {
      backgroundImage: background.image,
      backgroundSize: background.size,
      backgroundPosition: background.position,
    });
    if (type === 'MOVE_HINT') {
      classList.push(classes.moveHint);
    } else {
      style.boxShadow = `
        0 -3px 3px -3px #333 inset,
        0 0 3px -1px #333 inset,
        0 3px 5px -3px #fff inset,
        0 -1px 3px -4px #fff inset,
        0 20px 20px -10px rgba(0, 0, 0, 0.5)
      `;
    }
  }

  const tileRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (type !== 'PLACEHOLDER') {
      if (isLocked) {
        wrongMoveRequestTileSound();
      } else {
        onMoveRequest(slot);
      }
    }
  };

  useEffect(() => {
    if (navigator?.maxTouchPoints === 0 && tileRef.current) {
      const tileNode = tileRef.current;
      const mouseDownEventCallback = (event: MouseEvent) => {
        if (event.button === 2) {
          event.preventDefault();
          const exitPositionHint: Function | void = onPositionHintRequest(
            position,
            slot
          );
          const mouseUpEventCallback = () => {
            window.removeEventListener('mouseup', mouseUpEventCallback);
            typeof exitPositionHint === 'function' && exitPositionHint();
          };
          window.addEventListener('mouseup', mouseUpEventCallback);
        }
      };
      const contextmenuEventCallback = (event: MouseEvent) => {
        event.preventDefault();
      };
      tileNode.addEventListener('contextmenu', contextmenuEventCallback);
      tileNode.addEventListener('mousedown', mouseDownEventCallback);
      return () => {
        tileNode.removeEventListener('mousedown', mouseDownEventCallback);
        tileNode.removeEventListener('contextmenu', contextmenuEventCallback);
      };
    }
  }, [slot, position, onPositionHintRequest]);

  return (
    <div
      ref={tileRef}
      onClick={handleClick}
      className={classList.join(' ')}
      style={style}
    ></div>
  );
};

export default Tile;
