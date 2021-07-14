import React, { useEffect, useRef } from 'react';
import backgroundSound1 from '../sounds/flowing-canal.wav';
import backgroundSound2 from '../sounds/backgroundSound.mp3';
import frogSound1 from '../sounds/cutefrogmedium.wav';
import frogSound2 from '../sounds/beautifullvlong.wav';
import tileMoveSound from '../sounds/move.wav';

interface ISoundBoxProps {}

const SoundBox: React.FC<ISoundBoxProps> = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioRef1 = useRef<HTMLAudioElement>(null);
  const frogSoundRef1 = useRef<HTMLAudioElement>(null);
  const frogSoundRef2 = useRef<HTMLAudioElement>(null);
  const tileMoveSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audioNode = audioRef.current;
      const userInteractionCallback = () => {
        window.removeEventListener('click', userInteractionCallback);
        window.removeEventListener('focus', userInteractionCallback);
        audioNode.play();
      };
      window.addEventListener('click', userInteractionCallback);
      window.addEventListener('focus', userInteractionCallback);
      audioNode.volume = 0.1;
      return () => audioNode.pause();
    }
  }, []);

  useEffect(() => {
    if (audioRef1.current) {
      const audioNode = audioRef1.current;
      const userInteractionCallback = () => {
        window.removeEventListener('click', userInteractionCallback);
        window.removeEventListener('focus', userInteractionCallback);
        audioNode.play();
      };
      window.addEventListener('click', userInteractionCallback);
      window.addEventListener('focus', userInteractionCallback);
      audioNode.volume = 0.2;
      return () => audioNode.pause();
    }
  }, []);

  useEffect(() => {
    if (frogSoundRef1.current) {
      const audioNode = frogSoundRef1.current;
      const userInteractionCallback = () => {
        window.removeEventListener('click', userInteractionCallback);
        window.removeEventListener('focus', userInteractionCallback);
        audioNode.play();
      };
      window.addEventListener('click', userInteractionCallback);
      window.addEventListener('focus', userInteractionCallback);
      audioNode.volume = 0.1;
      return () => audioNode.pause();
    }
  }, []);

  useEffect(() => {
    if (frogSoundRef2.current) {
      const audioNode = frogSoundRef2.current;
      const userInteractionCallback = () => {
        window.removeEventListener('click', userInteractionCallback);
        window.removeEventListener('focus', userInteractionCallback);
        audioNode.play();
      };
      window.addEventListener('click', userInteractionCallback);
      window.addEventListener('focus', userInteractionCallback);
      audioNode.volume = 0.1;
      return () => audioNode.pause();
    }
  }, []);

  return (
    <>
      <audio ref={audioRef} src={backgroundSound1} loop></audio>
      <audio ref={audioRef1} src={backgroundSound2} loop></audio>
      <audio ref={frogSoundRef1} src={frogSound1} loop></audio>
      <audio ref={frogSoundRef2} src={frogSound2} loop></audio>

      <audio ref={tileMoveSoundRef} src={tileMoveSound} preload="auto"></audio>
    </>
  );
};

export default SoundBox;
