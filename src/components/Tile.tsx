import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { ISlot, ITile } from '../interfaces';

interface ITileProps extends ITile {}

const useStyles = makeStyles(() => ({
  tile: {
    display: 'block',
    backgroundColor: '#999',
    boxShadow:
      '0 -1px 1px -1px #333 inset, 0 0 3px -1px #333 inset, 0 1px 1px -1px #fff inset, 0 -1px 1px -1px #fff inset, 0 8px 8px -4px rgba(0, 0, 0, 0.5)',
    backgroundRepeat: 'no-repeat',
    position: 'absolute',
    borderRadius: '2px',
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
    boxShadow:
      'rgb(0, 255, 0) 0px 0px 10px, rgb(0, 255, 0) 0px 0px 10px inset !important',
    zIndex: 999,
  },
}));

const Tile: React.FC<ITileProps> = ({
  background,
  position,
  dimensions,
  slot,
}) => {
  const classes = useStyles();

  return (
    <div
      className={classes.tile}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        backgroundImage: background.image,
        backgroundSize: background.size,
        backgroundPosition: `${-position.x}px ${-position.y}px`,
        left: slot[0] * dimensions.width,
        top: slot[1] * dimensions.height,
      }}
    ></div>
  );
};

export default Tile;
