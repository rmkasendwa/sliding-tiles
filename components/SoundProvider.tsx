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
  stopAmbience: () => void;
  startAmbience: () => void;
  toggleMuted: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);
const SOUND_STORAGE_KEY = 'sliding-tiles:sound-muted';
const SOUND_PATHS = {
  ambientFrog: '/sounds/frog-ambient-long.wav',
  ambientMusic: '/sounds/background-music.mp3',
  ambientWater: '/sounds/flowing-canal.wav',
  complete: '/sounds/win.wav',
  frog: '/sounds/frog-short.wav',
  frogMedium: '/sounds/frog-medium.wav',
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
  const ambientWaterRef = useRef<HTMLAudioElement>(null);
  const ambientMusicRef = useRef<HTMLAudioElement>(null);
  const ambientFrogRef = useRef<HTMLAudioElement>(null);
  const frogMediumRef = useRef<HTMLAudioElement>(null);
  const moveSoundRef = useRef<HTMLAudioElement>(null);
  const invalidSoundRef = useRef<HTMLAudioElement>(null);
  const hintSoundRef = useRef<HTMLAudioElement>(null);
  const completeSoundRef = useRef<HTMLAudioElement>(null);
  const frogSoundRef = useRef<HTMLAudioElement>(null);
  const hasStartedAmbienceRef = useRef(false);
  const canPersistMutedPreferenceRef = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(isMuted);

  const getAllAudioElements = useCallback(
    () => [
      ambientWaterRef.current,
      ambientMusicRef.current,
      ambientFrogRef.current,
      frogMediumRef.current,
      moveSoundRef.current,
      invalidSoundRef.current,
      hintSoundRef.current,
      completeSoundRef.current,
      frogSoundRef.current,
    ],
    [],
  );

  const pauseAmbience = useCallback(() => {
    [
      ambientWaterRef.current,
      ambientMusicRef.current,
      ambientFrogRef.current,
      frogMediumRef.current,
    ].forEach((audioElement) => audioElement?.pause());
  }, []);

  const applyMutedState = useCallback(
    (muted: boolean) => {
      isMutedRef.current = muted;

      getAllAudioElements().forEach((audioElement) => {
        if (audioElement) {
          audioElement.muted = muted;
        }
      });

      if (muted) {
        pauseAmbience();
      }
    },
    [getAllAudioElements, pauseAmbience],
  );

  useEffect(() => {
    applyMutedState(isMuted);
    if (canPersistMutedPreferenceRef.current) {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(isMuted));
    }
  }, [applyMutedState, isMuted]);

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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedMutedPreference = getStoredMutedPreference();
      canPersistMutedPreferenceRef.current = true;
      applyMutedState(storedMutedPreference);
      setIsMuted(storedMutedPreference);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [applyMutedState]);

  const playAmbience = useCallback((force = false) => {
    hasStartedAmbienceRef.current = true;

    if (isMutedRef.current && !force) {
      pauseAmbience();
      return;
    }

    const ambienceTracks = [
      { audioElement: ambientWaterRef.current, volume: 0.12 },
      { audioElement: ambientMusicRef.current, volume: 0.2 },
      { audioElement: ambientFrogRef.current, volume: 0.08 },
      { audioElement: frogMediumRef.current, volume: 0.08 },
    ];

    ambienceTracks.forEach(({ audioElement, volume }) => {
      if (audioElement) {
        audioElement.muted = false;
        audioElement.volume = volume;
        void audioElement.play().catch(() => undefined);
      }
    });
  }, [pauseAmbience]);

  useEffect(() => {
    if (isMuted) {
      pauseAmbience();
      return;
    }

    if (hasStartedAmbienceRef.current) {
      playAmbience();
    }
  }, [isMuted, pauseAmbience, playAmbience]);

  useEffect(() => {
    const handleUserInteraction = () => {
      playAmbience();
    };
    const handleFocus = () => {
      if (hasStartedAmbienceRef.current) {
        playAmbience();
      }
    };
    const handleBlur = () => {
      pauseAmbience();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAmbience();
      } else if (hasStartedAmbienceRef.current) {
        playAmbience();
      }
    };

    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      pauseAmbience();
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseAmbience, playAmbience]);

  const playSound = useCallback(
    (cue: SoundCue) => {
      if (isMuted) {
        return;
      }

      playAmbience();

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
    [isMuted, playAmbience, playAudio]
  );

  const toggleMuted = useCallback(() => {
    const nextMuted = !isMutedRef.current;
    applyMutedState(nextMuted);
    setIsMuted(nextMuted);

    if (!nextMuted) {
      playAmbience(true);
    }
  }, [applyMutedState, playAmbience]);

  const value = useMemo(
    () => ({
      isMuted,
      playSound,
      startAmbience: playAmbience,
      stopAmbience: pauseAmbience,
      toggleMuted,
    }),
    [isMuted, pauseAmbience, playAmbience, playSound, toggleMuted]
  );

  return (
    <SoundContext.Provider value={value}>
      {children}
      <audio
        ref={ambientWaterRef}
        loop
        muted={isMuted}
        preload="auto"
        src={SOUND_PATHS.ambientWater}
      />
      <audio
        ref={ambientMusicRef}
        loop
        muted={isMuted}
        preload="auto"
        src={SOUND_PATHS.ambientMusic}
      />
      <audio
        ref={ambientFrogRef}
        loop
        muted={isMuted}
        preload="auto"
        src={SOUND_PATHS.ambientFrog}
      />
      <audio
        ref={frogMediumRef}
        loop
        muted={isMuted}
        preload="auto"
        src={SOUND_PATHS.frogMedium}
      />
      <audio muted={isMuted} ref={moveSoundRef} preload="auto" src={SOUND_PATHS.move} />
      <audio
        muted={isMuted}
        ref={invalidSoundRef}
        preload="auto"
        src={SOUND_PATHS.invalid}
      />
      <audio muted={isMuted} ref={hintSoundRef} preload="auto" src={SOUND_PATHS.hint} />
      <audio
        muted={isMuted}
        ref={completeSoundRef}
        preload="auto"
        src={SOUND_PATHS.complete}
      />
      <audio muted={isMuted} ref={frogSoundRef} preload="auto" src={SOUND_PATHS.frog} />
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
