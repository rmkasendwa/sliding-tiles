import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useMemo } from 'react';
import { useState } from 'react';
import frog from '../img/frog.svg';
import { ISlot } from '../interfaces';
import Tile from './Tile';

interface IBoardProps {}

const useStyles = makeStyles(() => ({
  root: {
    backgroundColor: '#ccc',
    position: 'absolute',
    overflow: 'hidden',
    counterReset: 'tile-number',
  },
}));

const Board: React.FC<IBoardProps> = () => {
  const classes = useStyles();

  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<{
    dimensions: number[];
    emptySlot?: ISlot;
  }>({
    dimensions: [2, 2],
  });
  const [winningTileConfig, setWinningTileConfig] = useState<ISlot[]>([]);
  const [tiles, setTiles] = useState<{ slot: ISlot }[]>([]);

  const image = useMemo(() => {
    const image = new Image();
    image.src = frog;
    return image;
  }, []);

  const reset = () => {
    const tiles = Array.from({
      length: grid.dimensions[0] * grid.dimensions[1],
    }).map((a, i): { slot: ISlot } => {
      return {
        slot: [i % grid.dimensions[0], Math.floor(i / grid.dimensions[0])],
      };
    });
    grid.emptySlot = tiles[tiles.length - 1].slot;
    setWinningTileConfig(tiles.map((tile) => tile.slot));
    setTiles(tiles);
  };

  return (
    <div className={classes.root}>
      {tiles.map(({ slot }) => (
        <Tile slot={slot} />
      ))}
    </div>
  );
};

export default Board;
