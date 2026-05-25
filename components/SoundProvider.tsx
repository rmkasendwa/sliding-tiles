'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type SoundCue = 'complete' | 'hint' | 'invalid' | 'lock' | 'move' | 'shuffle';

type SoundContextValue = {
  isMuted: boolean;
  playSound: (cue: SoundCue) => void;
  toggleMuted: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);
const SOUND_STORAGE_KEY = 'sliding-tiles:sound-muted';
const SOUND_PATHS = {
  complete: '/sounds/win.wav',
  frog: '/sounds/frog-short.wav',
  hint: '/sounds/hint.wav',
  invalid: '/sounds/wrong-move.mp3',
  move: '/sounds/move.wav',
} as const;

function getStoredMutedPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(SOUND_STORAGE_KEY) === 'true';
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const moveSoundRef = useRef<HTMLAudioElement>(null);
  const invalidSoundRef = useRef<HTMLAudioElement>(null);
  const hintSoundRef = useRef<HTMLAudioElement>(null);
  const completeSoundRef = useRef<HTMLAudioElement>(null);
  const frogSoundRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(getStoredMutedPreference);

  useEffect(() => {
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  const playAudio = useCallback(
    (
      audioElement: HTMLAudioElement | null,
      { playbackRate = 1, volume = 0.45 } = {}
    ) => {
      if (!audioElement || isMuted) {
        return;
      }

      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.playbackRate = playbackRate;
      audioElement.volume = volume;
      void audioElement.play().catch(() => undefined);
    },
    [isMuted]
  );

  const playSound = useCallback(
    (cue: SoundCue) => {
      if (isMuted) {
        return;
      }

      switch (cue) {
        case 'move':
          playAudio(moveSoundRef.current, { volume: 0.32 });
          break;
        case 'invalid':
          playAudio(invalidSoundRef.current, { volume: 0.18 });
          break;
        case 'lock':
          playAudio(moveSoundRef.current, { playbackRate: 1.36, volume: 0.18 });
          break;
        case 'hint':
          playAudio(hintSoundRef.current, { volume: 0.14 });
          window.setTimeout(() => {
            if (!isMuted) {
              playAudio(frogSoundRef.current, {
                playbackRate: 1.18,
                volume: 0.09,
              });
            }
          }, 130);
          break;
        case 'complete':
          playAudio(completeSoundRef.current, { volume: 0.13 });
          window.setTimeout(() => {
            if (!isMuted) {
              playAudio(frogSoundRef.current, { volume: 0.16 });
            }
          }, 80);
          break;
        case 'shuffle':
          [0, 70, 145, 230].forEach((delay, index) => {
            window.setTimeout(() => {
              if (!isMuted) {
                playAudio(moveSoundRef.current, {
                  playbackRate: 0.86 + index * 0.08,
                  volume: 0.2,
                });
              }
            }, delay);
          });
          break;
      }
    },
    [isMuted, playAudio]
  );

  const toggleMuted = useCallback(() => {
    setIsMuted((current) => !current);
  }, []);

  const value = useMemo(
    () => ({
      isMuted,
      playSound,
      toggleMuted,
    }),
    [isMuted, playSound, toggleMuted]
  );

  return (
    <SoundContext.Provider value={value}>
      {children}
      <audio ref={moveSoundRef} preload="auto" src={SOUND_PATHS.move} />
      <audio ref={invalidSoundRef} preload="auto" src={SOUND_PATHS.invalid} />
      <audio ref={hintSoundRef} preload="auto" src={SOUND_PATHS.hint} />
      <audio ref={completeSoundRef} preload="auto" src={SOUND_PATHS.complete} />
      <audio ref={frogSoundRef} preload="auto" src={SOUND_PATHS.frog} />
    </SoundContext.Provider>
  );
}

export function useSound() {
  const value = useContext(SoundContext);
  if (!value) {
    throw new Error('useSound must be used inside SoundProvider.');
  }

  return value;
}
