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

type SoundCue =
  | 'complete'
  | 'frog'
  | 'hint'
  | 'invalid'
  | 'lock'
  | 'move'
  | 'shuffle'
  | 'whoosh';
type EffectCue = 'complete' | 'frog' | 'hint' | 'invalid' | 'move';
type SoundRange = readonly [number, number];

type AmbientBedTrack = {
  id: string;
  src: string;
  volume: number;
};

type AmbientAccentTrack = {
  gapMs: SoundRange;
  id: string;
  playbackRate: SoundRange;
  src: string;
  volume: SoundRange;
};

type SoundPack = {
  ambience: {
    accents: readonly AmbientAccentTrack[];
    beds: readonly AmbientBedTrack[];
  };
  effects: Record<EffectCue, string>;
  id: string;
};

type SoundContextValue = {
  isEnabled: boolean;
  isMuted: boolean;
  playSound: (cue: SoundCue) => void;
  stopAmbience: () => void;
  startAmbience: () => void;
  toggleMuted: () => void;
};

type SoundProviderProps = {
  children: ReactNode;
  enabled?: boolean;
};

const SoundContext = createContext<SoundContextValue | null>(null);
const SOUND_STORAGE_KEY = 'sliding-tiles:sound-muted';
const STARTUP_BLUR_IGNORE_MS = 1800;
const AUTOSTART_RETRY_DELAY_MS = 300;
const AUTOSTART_MAX_RETRIES = 12;
const SOUND_PACKS = {
  pond: {
    ambience: {
      accents: [
        {
          gapMs: [8500, 18000],
          id: 'frog-medium',
          playbackRate: [0.92, 1.08],
          src: '/sounds/frog-medium.wav',
          volume: [0.05, 0.1],
        },
        {
          gapMs: [22000, 52000],
          id: 'frog-ambient-long',
          playbackRate: [0.96, 1.03],
          src: '/sounds/frog-ambient-long.wav',
          volume: [0.035, 0.075],
        },
        {
          gapMs: [11000, 26000],
          id: 'frog-short',
          playbackRate: [0.86, 1.16],
          src: '/sounds/frog-short.wav',
          volume: [0.035, 0.08],
        },
      ],
      beds: [
        {
          id: 'water',
          src: '/sounds/flowing-canal.wav',
          volume: 0.12,
        },
        {
          id: 'music',
          src: '/sounds/background-music.mp3',
          volume: 0.2,
        },
      ],
    },
    effects: {
      complete: '/sounds/win.wav',
      frog: '/sounds/frog-short.wav',
      hint: '/sounds/hint.wav',
      invalid: '/sounds/wrong-move.mp3',
      move: '/sounds/move.wav',
    },
    id: 'pond',
  },
} as const;
const ACTIVE_SOUND_PACK: SoundPack = SOUND_PACKS.pond;

function getStoredMutedPreference() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(SOUND_STORAGE_KEY) === 'true';
}

function randomBetween([min, max]: SoundRange) {
  return min + Math.random() * (max - min);
}

export function SoundProvider({
  children,
  enabled = true,
}: SoundProviderProps) {
  const ambientBedRefs = useRef(new Map<string, HTMLAudioElement>());
  const ambientAccentRefs = useRef(new Map<string, HTMLAudioElement>());
  const accentTimeoutRefs = useRef(new Map<string, number>());
  const moveSoundRef = useRef<HTMLAudioElement>(null);
  const invalidSoundRef = useRef<HTMLAudioElement>(null);
  const hintSoundRef = useRef<HTMLAudioElement>(null);
  const completeSoundRef = useRef<HTMLAudioElement>(null);
  const frogSoundRef = useRef<HTMLAudioElement>(null);
  const whooshSoundRef = useRef<HTMLAudioElement>(null);
  const hasStartedAmbienceRef = useRef(false);
  const isAmbienceEnabledRef = useRef(false);
  const canPersistMutedPreferenceRef = useRef(false);
  const shouldAutostartAmbienceRef = useRef(false);
  const ignoreBlurUntilRef = useRef(0);
  const autostartRetryTimeoutRef = useRef<number | null>(null);
  const autostartRetryCountRef = useRef(0);
  const [isAmbienceEnabled, setIsAmbienceEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const isMutedRef = useRef(isMuted);

  const getAllAudioElements = useCallback(
    () => [
      ...ambientBedRefs.current.values(),
      ...ambientAccentRefs.current.values(),
      moveSoundRef.current,
      invalidSoundRef.current,
      hintSoundRef.current,
      completeSoundRef.current,
      frogSoundRef.current,
      whooshSoundRef.current,
    ],
    [],
  );

  const clearAccentTimers = useCallback(() => {
    accentTimeoutRefs.current.forEach((timeout) => {
      window.clearTimeout(timeout);
    });
    accentTimeoutRefs.current.clear();
  }, []);

  const pauseAmbience = useCallback(() => {
    clearAccentTimers();
    [
      ...ambientBedRefs.current.values(),
      ...ambientAccentRefs.current.values(),
    ].forEach((audioElement) => audioElement.pause());
  }, [clearAccentTimers]);

  const clearAutostartRetry = useCallback(() => {
    if (autostartRetryTimeoutRef.current !== null) {
      window.clearTimeout(autostartRetryTimeoutRef.current);
      autostartRetryTimeoutRef.current = null;
    }
    autostartRetryCountRef.current = 0;
  }, []);

  const scheduleAccentTrack = useCallback((track: AmbientAccentTrack) => {
    window.clearTimeout(accentTimeoutRefs.current.get(track.id));

    const playAccent = () => {
      accentTimeoutRefs.current.delete(track.id);

      if (isMutedRef.current || !hasStartedAmbienceRef.current) {
        return;
      }

      const audioElement = ambientAccentRefs.current.get(track.id);
      if (!audioElement) {
        return;
      }

      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.muted = false;
      audioElement.playbackRate = randomBetween(track.playbackRate);
      audioElement.volume = randomBetween(track.volume);
      void audioElement.play().catch(() => undefined);

      const nextTimeout = window.setTimeout(
        playAccent,
        randomBetween(track.gapMs),
      );
      accentTimeoutRefs.current.set(track.id, nextTimeout);
    };

    const timeout = window.setTimeout(playAccent, randomBetween(track.gapMs));

    accentTimeoutRefs.current.set(track.id, timeout);
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
    if (enabled && canPersistMutedPreferenceRef.current) {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(isMuted));
    }
  }, [applyMutedState, enabled, isMuted]);

  const playAudio = useCallback(
    (
      audioElement: HTMLAudioElement | null,
      { playbackRate = 1, volume = 0.45 } = {},
    ) => {
      if (!enabled || !audioElement || isMuted) {
        return;
      }

      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.playbackRate = playbackRate;
      audioElement.volume = volume;
      void audioElement.play().catch(() => undefined);
    },
    [enabled, isMuted],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const storedMutedPreference = getStoredMutedPreference();
      shouldAutostartAmbienceRef.current = !storedMutedPreference;
      ignoreBlurUntilRef.current = Date.now() + STARTUP_BLUR_IGNORE_MS;
      autostartRetryCountRef.current = 0;
      setNeedsAudioUnlock(false);
      canPersistMutedPreferenceRef.current = true;
      applyMutedState(storedMutedPreference);
      setIsMuted(storedMutedPreference);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [applyMutedState, enabled]);

  useEffect(() => {
    if (enabled) {
      return;
    }

    isAmbienceEnabledRef.current = false;
    hasStartedAmbienceRef.current = false;
    shouldAutostartAmbienceRef.current = false;
    canPersistMutedPreferenceRef.current = false;
    clearAutostartRetry();
    pauseAmbience();

    if (!isMutedRef.current) {
      applyMutedState(true);
      setIsMuted(true);
    }
  }, [applyMutedState, clearAutostartRetry, enabled, pauseAmbience]);

  const playAmbience = useCallback(
    (force = false) => {
      if (!enabled || !isAmbienceEnabledRef.current) {
        return;
      }

      hasStartedAmbienceRef.current = true;

      if (isMutedRef.current && !force) {
        pauseAmbience();
        return;
      }

      let hasPlayableBed = false;

      ACTIVE_SOUND_PACK.ambience.beds.forEach((track) => {
        const audioElement = ambientBedRefs.current.get(track.id);
        if (!audioElement) {
          return;
        }

        hasPlayableBed = true;
        audioElement.muted = false;
        audioElement.volume = track.volume;
        void audioElement.play().catch((error: unknown) => {
          const domError = error as DOMException | undefined;
          if (
            domError?.name === 'NotAllowedError' &&
            !isMutedRef.current &&
            isAmbienceEnabledRef.current
          ) {
            setNeedsAudioUnlock(true);
          }
        });
      });

      if (hasPlayableBed) {
        setNeedsAudioUnlock(false);
      }

      ACTIVE_SOUND_PACK.ambience.accents.forEach(scheduleAccentTrack);
    },
    [enabled, pauseAmbience, scheduleAccentTrack],
  );

  const scheduleAutostartRetry = useCallback(() => {
    const runRetry = () => {
      if (autostartRetryCountRef.current >= AUTOSTART_MAX_RETRIES) {
        autostartRetryTimeoutRef.current = null;
        return;
      }

      if (
        !isMutedRef.current &&
        hasStartedAmbienceRef.current &&
        !document.hidden
      ) {
        playAmbience(true);
      }

      autostartRetryCountRef.current += 1;
      autostartRetryTimeoutRef.current = window.setTimeout(
        runRetry,
        AUTOSTART_RETRY_DELAY_MS,
      );
    };

    if (autostartRetryTimeoutRef.current !== null) {
      window.clearTimeout(autostartRetryTimeoutRef.current);
    }

    autostartRetryTimeoutRef.current = window.setTimeout(
      runRetry,
      AUTOSTART_RETRY_DELAY_MS,
    );
  }, [playAmbience]);

  useEffect(() => {
    if (!enabled) {
      clearAutostartRetry();
      pauseAmbience();
      return;
    }

    if (!isAmbienceEnabledRef.current) {
      clearAutostartRetry();
      pauseAmbience();
      return;
    }

    if (isMuted) {
      clearAutostartRetry();
      pauseAmbience();
      return;
    }

    if (shouldAutostartAmbienceRef.current) {
      shouldAutostartAmbienceRef.current = false;
      playAmbience(true);
      scheduleAutostartRetry();
      return;
    }

    clearAutostartRetry();

    if (hasStartedAmbienceRef.current) {
      playAmbience();
    }
  }, [
    clearAutostartRetry,
    enabled,
    isMuted,
    pauseAmbience,
    playAmbience,
    scheduleAutostartRetry,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleUserInteraction = () => {
      if (!isAmbienceEnabledRef.current) {
        return;
      }

      setNeedsAudioUnlock(false);
      playAmbience(true);
    };
    const handleFocus = () => {
      if (isAmbienceEnabledRef.current && hasStartedAmbienceRef.current) {
        playAmbience();
      }
    };
    const handleBlur = () => {
      if (document.hidden && Date.now() >= ignoreBlurUntilRef.current) {
        pauseAmbience();
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseAmbience();
      } else if (
        isAmbienceEnabledRef.current &&
        hasStartedAmbienceRef.current
      ) {
        playAmbience();
      }
    };

    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearAutostartRetry();
      pauseAmbience();
      hasStartedAmbienceRef.current = false;
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearAutostartRetry, enabled, pauseAmbience, playAmbience]);

  const playSound = useCallback(
    (cue: SoundCue) => {
      if (!enabled || isMuted) {
        return;
      }

      playAmbience();

      switch (cue) {
        case 'move':
          playAudio(moveSoundRef.current, { volume: 0.32 });
          break;
        case 'frog':
          playAudio(frogSoundRef.current, { volume: 0.12 });
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
            if (!isMutedRef.current) {
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
            if (!isMutedRef.current) {
              playAudio(frogSoundRef.current, { volume: 0.16 });
            }
          }, 80);
          break;
        case 'shuffle':
          [0, 70, 145, 230].forEach((delay, index) => {
            window.setTimeout(() => {
              if (!isMutedRef.current) {
                playAudio(moveSoundRef.current, {
                  playbackRate: 0.86 + index * 0.08,
                  volume: 0.2,
                });
              }
            }, delay);
          });
          break;
        case 'whoosh':
          playAudio(whooshSoundRef.current, {
            playbackRate: 1,
            volume: 0.62,
          });
          window.setTimeout(() => {
            const whooshAudio = whooshSoundRef.current;
            if (whooshAudio && !whooshAudio.paused) {
              whooshAudio.pause();
              whooshAudio.currentTime = 0;
            }
          }, 420);
          break;
      }
    },
    [enabled, isMuted, playAmbience, playAudio],
  );

  const toggleMuted = useCallback(() => {
    if (!enabled) {
      return;
    }

    const nextMuted = !isMutedRef.current;
    applyMutedState(nextMuted);
    setIsMuted(nextMuted);

    if (!nextMuted && isAmbienceEnabledRef.current) {
      playAmbience(true);
    }
  }, [applyMutedState, enabled, playAmbience]);

  const startAmbience = useCallback(() => {
    if (!enabled) {
      return;
    }

    isAmbienceEnabledRef.current = true;
    setIsAmbienceEnabled(true);
    hasStartedAmbienceRef.current = true;

    if (!isMutedRef.current) {
      playAmbience(true);
    }
  }, [enabled, playAmbience]);

  const stopAmbience = useCallback(() => {
    isAmbienceEnabledRef.current = false;
    setIsAmbienceEnabled(false);
    hasStartedAmbienceRef.current = false;
    clearAutostartRetry();
    pauseAmbience();
    setNeedsAudioUnlock(false);
  }, [clearAutostartRetry, pauseAmbience]);

  const setAmbientBedRef = useCallback(
    (id: string) => (audioElement: HTMLAudioElement | null) => {
      if (audioElement) {
        ambientBedRefs.current.set(id, audioElement);
        audioElement.muted = isMutedRef.current;
      } else {
        ambientBedRefs.current.delete(id);
      }
    },
    [],
  );

  const setAmbientAccentRef = useCallback(
    (id: string) => (audioElement: HTMLAudioElement | null) => {
      if (audioElement) {
        ambientAccentRefs.current.set(id, audioElement);
        audioElement.muted = isMutedRef.current;
      } else {
        window.clearTimeout(accentTimeoutRefs.current.get(id));
        accentTimeoutRefs.current.delete(id);
        ambientAccentRefs.current.delete(id);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      isEnabled: enabled,
      isMuted,
      playSound,
      startAmbience,
      stopAmbience,
      toggleMuted,
    }),
    [enabled, isMuted, playSound, startAmbience, stopAmbience, toggleMuted],
  );

  return (
    <SoundContext.Provider value={value}>
      {children}
      {enabled && isAmbienceEnabled && needsAudioUnlock && !isMuted ? (
        <button
          aria-label="Enable sound"
          onClick={() => {
            setNeedsAudioUnlock(false);
            playAmbience(true);
          }}
          style={{
            backdropFilter: 'blur(4px)',
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '999px',
            bottom: '1rem',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 700,
            left: '50%',
            padding: '0.55rem 0.95rem',
            position: 'fixed',
            transform: 'translateX(-50%)',
            zIndex: 80,
          }}
          type="button"
        >
          Tap to enable sound
        </button>
      ) : null}
      {enabled ? (
        <>
          {ACTIVE_SOUND_PACK.ambience.beds.map((track) => (
            <audio
              key={track.id}
              loop
              muted={isMuted}
              preload="auto"
              ref={setAmbientBedRef(track.id)}
              src={track.src}
            />
          ))}
          {ACTIVE_SOUND_PACK.ambience.accents.map((track) => (
            <audio
              key={track.id}
              muted={isMuted}
              preload="auto"
              ref={setAmbientAccentRef(track.id)}
              src={track.src}
            />
          ))}
          <audio
            muted={isMuted}
            ref={moveSoundRef}
            preload="auto"
            src={ACTIVE_SOUND_PACK.effects.move}
          />
          <audio
            muted={isMuted}
            ref={invalidSoundRef}
            preload="auto"
            src={ACTIVE_SOUND_PACK.effects.invalid}
          />
          <audio
            muted={isMuted}
            ref={hintSoundRef}
            preload="auto"
            src={ACTIVE_SOUND_PACK.effects.hint}
          />
          <audio
            muted={isMuted}
            ref={completeSoundRef}
            preload="auto"
            src={ACTIVE_SOUND_PACK.effects.complete}
          />
          <audio
            muted={isMuted}
            ref={frogSoundRef}
            preload="auto"
            src={ACTIVE_SOUND_PACK.effects.frog}
          />
          <audio
            muted={isMuted}
            ref={whooshSoundRef}
            preload="auto"
            src="/sounds/mixkit-heavy-sliding-door-1523.wav"
          />
        </>
      ) : null}
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
