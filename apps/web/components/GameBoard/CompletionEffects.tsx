import type { CSSProperties } from 'react';

import { CELEBRATION_PARTICLES, CONFETTI_PARTICLES } from './constants';

type CompletionEffectsProps = {
  confettiBurstKey: number | null;
  isCelebrating: boolean;
  isCompletionImageVisible: boolean;
};

export function CompletionEffects({
  confettiBurstKey,
  isCelebrating,
  isCompletionImageVisible,
}: CompletionEffectsProps) {
  return (
    <>
      {isCompletionImageVisible ? (
        <div
          aria-label="Completed puzzle image"
          className="completion-image-reveal pointer-events-none absolute inset-0 z-20 bg-[url('/frog.svg')] bg-cover bg-center bg-no-repeat"
          role="img"
        />
      ) : null}
      {confettiBurstKey !== null ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
          key={confettiBurstKey}
        >
          {CONFETTI_PARTICLES.map((particle, index) => (
            <span
              className="completion-confetti-piece absolute top-1/2 block"
              key={index}
              style={
                {
                  '--confetti-color': particle.color,
                  '--confetti-delay': particle.delay,
                  '--confetti-drift': particle.drift,
                  '--confetti-drift-mid': particle.driftMid,
                  '--confetti-rotation': particle.rotation,
                  '--confetti-rotation-mid': particle.rotationMid,
                  '--confetti-size': particle.size,
                  left: particle.left,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
      {isCelebrating ? (
        <div className="pointer-events-none absolute inset-0 z-30 animate-[celebration-fade-in_700ms_ease-out_both] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-panel)_18%,transparent),color-mix(in_srgb,var(--color-primary)_18%,transparent)_42%,color-mix(in_srgb,var(--color-night)_30%,transparent))]" />
          <div className="absolute inset-4 rounded-lg border border-surface/60 shadow-[inset_0_0_52px_color-mix(in_srgb,var(--color-surface)_38%,transparent),0_0_44px_color-mix(in_srgb,var(--color-celebration)_30%,transparent)]" />
          {CELEBRATION_PARTICLES.map((particle, index) => (
            <span
              className="absolute block animate-[celebration-float_1600ms_ease-out_both] rounded-full bg-celebration shadow-[0_0_26px_color-mix(in_srgb,var(--color-celebration)_90%,transparent),0_0_8px_color-mix(in_srgb,var(--color-surface)_90%,transparent)]"
              key={index}
              style={{
                animationDelay: particle.delay,
                height: particle.size,
                left: particle.left,
                top: particle.top,
                width: particle.size,
              }}
            />
          ))}
          <div className="absolute inset-x-6 bottom-6 rounded-lg border border-surface/35 bg-panel/90 px-5 py-4 text-center shadow-panel backdrop-blur">
            <p className="text-[0.78rem] font-extrabold uppercase text-accent-strong">
              Level complete
            </p>
            <p className="mt-1 text-sm text-muted">
              Enjoy the solved image. Next level is loading.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
