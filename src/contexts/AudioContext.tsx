import { createContext, useEffect, useRef } from 'react';
import { IBoardAudio } from '../interfaces';
import tileMoveSound from '../sounds/move.wav';
import wrongMoveRequestSound from '../sounds/wrong-move.mp3';
import backgroundSound1 from '../sounds/flowing-canal.wav';
import backgroundSound2 from '../sounds/backgroundSound.mp3';
import frogSound1 from '../sounds/cutefrogmedium.wav';
import frogSound2 from '../sounds/beautifullvlong.wav';
import hintSound from '../sounds/hint.wav';
import levelCompletedSoundSrc from '../sounds/win.wav';

export const AudioContext = createContext<any>({});

export const AudioProvider: React.FC = ({ children }) => {
  const track1Ref = useRef<HTMLAudioElement>(null);
  const track2Ref = useRef<HTMLAudioElement>(null);
  const track3Ref = useRef<HTMLAudioElement>(null);
  const track4Ref = useRef<HTMLAudioElement>(null);

  const tileMoveSoundRef = useRef<HTMLAudioElement>(null);
  const wrongMoveRequestSoundRef = useRef<HTMLAudioElement>(null);
  const hintSoundRef = useRef<HTMLAudioElement>(null);
  const levelCompletedSoundRef = useRef<HTMLAudioElement>(null);

  const moveTileSound = () => {
    if (tileMoveSoundRef.current) {
      tileMoveSoundRef.current.volume = 0.9;
      tileMoveSoundRef.current.currentTime = 0;
      tileMoveSoundRef.current.play();
    }
  };

  const wrongMoveRequestTileSound = () => {
    if (wrongMoveRequestSoundRef.current) {
      wrongMoveRequestSoundRef.current.volume = 0.7;
      wrongMoveRequestSoundRef.current.currentTime = 0;
      wrongMoveRequestSoundRef.current.play();
    }
  };

  const boardOrderHintSound = () => {
    if (hintSoundRef.current) {
      hintSoundRef.current.volume = 0.7;
      hintSoundRef.current.currentTime = 0;
      hintSoundRef.current.play();
    }
  };

  const levelCompletedSound = () => {
    return new Promise((resolve) => {
      if (levelCompletedSoundRef.current) {
        levelCompletedSoundRef.current.volume = 0.1;
        levelCompletedSoundRef.current.currentTime = 0;
        levelCompletedSoundRef.current.onpause = resolve;
        levelCompletedSoundRef.current.play();
      } else {
        resolve(null);
      }
    });
  };

  useEffect(() => {
    const track1Node = track1Ref.current;
    const track2Node = track2Ref.current;
    const track3Node = track3Ref.current;
    const track4Node = track4Ref.current;
    if (track1Node || track2Node || track3Node || track4Node) {
      const focusEventCallback = () => {
        track1Node && track1Node.play();
        track2Node && track2Node.play();
        track3Node && track3Node.play();
        track4Node && track4Node.play();
      };
      const blurEventCallback = () => {
        track1Node && track1Node.pause();
        track2Node && track2Node.pause();
        track3Node && track3Node.pause();
        track4Node && track4Node.pause();
      };
      const userInteractionCallback = () => {
        window.removeEventListener('click', userInteractionCallback);
        focusEventCallback();
      };
      track1Node && (track1Node.volume = 0.1);
      track2Node && (track2Node.volume = 0.2);
      track3Node && (track3Node.volume = 0.1);
      track4Node && (track4Node.volume = 0.1);
      window.addEventListener('click', userInteractionCallback);
      window.addEventListener('focus', focusEventCallback);
      window.addEventListener('blur', blurEventCallback);
      return () => {
        blurEventCallback();
        window.removeEventListener('focus', focusEventCallback);
        window.removeEventListener('blur', blurEventCallback);
        window.removeEventListener('click', userInteractionCallback);
      };
    }
  }, []);

  const value: IBoardAudio = {
    moveTileSound,
    wrongMoveRequestTileSound,
    boardOrderHintSound,
    levelCompletedSound,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio ref={track1Ref} src={backgroundSound1} loop></audio>
      <audio ref={track2Ref} src={backgroundSound2} loop></audio>
      <audio ref={track3Ref} src={frogSound1} loop></audio>
      <audio ref={track4Ref} src={frogSound2} loop></audio>

      <audio ref={tileMoveSoundRef} src={tileMoveSound} preload="auto"></audio>
      <audio
        ref={wrongMoveRequestSoundRef}
        src={wrongMoveRequestSound}
        preload="auto"
      ></audio>
      <audio ref={hintSoundRef} src={hintSound} preload="auto"></audio>
      <audio
        ref={levelCompletedSoundRef}
        src={levelCompletedSoundSrc}
        preload="auto"
      ></audio>
    </AudioContext.Provider>
  );
};
