export const IDLE_PAUSE_DELAY_MS = 10_000;

export type GameTimerSnapshot = {
  activeElapsedTimeMs: number;
  pausedDurationMs: number;
  totalElapsedTimeMs: number;
};

export type RunningTimerState = {
  activeStartedAtMs: number;
  pausedDurationMs: number;
  sessionStartedAtMs: number;
};

export function getTimerSnapshot(
  state: RunningTimerState,
  nowMs: number,
): GameTimerSnapshot {
  const totalElapsedTimeMs = Math.max(0, nowMs - state.sessionStartedAtMs);
  const activeElapsedTimeMs = Math.max(
    0,
    nowMs - state.activeStartedAtMs - state.pausedDurationMs,
  );

  return {
    activeElapsedTimeMs,
    pausedDurationMs: Math.max(0, state.pausedDurationMs),
    totalElapsedTimeMs,
  };
}

export function getIdlePausedSnapshot({
  idleStartedAtMs,
  nowMs,
  pauseDelayMs = IDLE_PAUSE_DELAY_MS,
  state,
}: {
  idleStartedAtMs: number;
  nowMs: number;
  pauseDelayMs?: number;
  state: RunningTimerState;
}): GameTimerSnapshot {
  const pausedAtMs = idleStartedAtMs + pauseDelayMs;
  const idlePauseDurationMs = Math.max(0, nowMs - pausedAtMs);
  const pausedDurationMs = state.pausedDurationMs + idlePauseDurationMs;

  return getTimerSnapshot(
    {
      ...state,
      pausedDurationMs,
    },
    nowMs,
  );
}

export function getActiveStartForResume({
  activeElapsedTimeMs,
  nowMs,
  pausedDurationMs,
}: {
  activeElapsedTimeMs: number;
  nowMs: number;
  pausedDurationMs: number;
}) {
  return nowMs - activeElapsedTimeMs - pausedDurationMs;
}
