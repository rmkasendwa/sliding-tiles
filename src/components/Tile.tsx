import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ITile } from '../interfaces';

interface ITileProps extends ITile {}

const useStyles = makeStyles(() => ({
  tile: {
    display: 'block',
    backgroundRepeat: 'no-repeat',
    position: 'absolute',
    borderRadius: '6px',
    transition: 'left .3s, top .3s',
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
    zIndex: 999,
  },
  slotHint: {
    border: '4px solid transparent',
    background: `
      linear-gradient(#ccc, #ccc) padding-box,
      repeating-linear-gradient(-45deg, #333 0, #333 25%, transparent 0, transparent 50%) 0 / .6em .6em
    `,
    animation: '$ants 12s linear infinite',
  },
  '@keyframes ants': {
    to: {
      backgroundPosition: '100%',
    },
  },
}));

const Tile: React.FC<ITileProps> = ({ background, dimensions, type, slot }) => {
  const classes = useStyles();
  const classList = [classes.tile];
  const style = {
    width: dimensions.width,
    height: dimensions.height,
    left: slot[0] * dimensions.width,
    top: slot[1] * dimensions.height,
  };

  switch (type) {
    case 'PLACEHOLDER':
      break;
    case 'SLOT_HINT':
      classList.push(classes.slotHint);
      break;
  }
  if (!type || type === 'MOVE_HINT') {
    Object.assign(style, {
      backgroundImage: background.image,
      backgroundSize: background.size,
      backgroundPosition: background.position,
      boxShadow: `
        0 -3px 3px -3px #333 inset,
        0 0 3px -1px #333 inset,
        0 3px 5px -3px #fff inset,
        0 -1px 3px -4px #fff inset,
        0 20px 20px -10px rgba(0, 0, 0, 0.5)
      `,
    });
    if (type === 'MOVE_HINT') classList.push(classes.moveHint);
  }

  return <div className={classList.join(' ')} style={style}></div>;
};

export default Tile;
