import { createContext, useRef } from 'react';
import tileMoveSound from '../sounds/move.wav';

export const AudioContext = createContext<any>({});

export const AudioProvider: React.FC = ({ children }) => {
  const tileMoveSoundRef = useRef<HTMLAudioElement>(null);

  const moveTile = () => {
    if (tileMoveSoundRef.current) {
      tileMoveSoundRef.current.currentTime = 0;
      tileMoveSoundRef.current.play();
    }
  };

  const value: any = { moveTile };

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio ref={tileMoveSoundRef} src={tileMoveSound} preload="auto"></audio>
    </AudioContext.Provider>
  );
};
