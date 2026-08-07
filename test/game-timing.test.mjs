import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getActiveStartForResume,
  getIdlePausedSnapshot,
  getTimerSnapshot,
} from '../apps/web/components/GameBoard/gameTiming.ts';
import { calculateCompletionTiming } from '../dist/api/leaderboard/leaderboard.service.js';

function createCompletedBoard({
  elapsedTimeMs,
  pausedDurationMs = 0,
  startedAt = '2026-08-07T12:00:00.000Z',
  totalElapsedTimeMs,
}) {
  return {
    dimensions: [3, 2],
    elapsedTimeMs,
    emptySlot: [1, 2],
    level: 1,
    movableSlots: [
      [0, 2],
      [1, 1],
    ],
    moves: 8,
    pausedDurationMs,
    startedAt,
    tileGrid: [],
    totalElapsedTimeMs,
  };
}

test('idle pause stops active time after the inactivity threshold', () => {
  const state = {
    activeStartedAtMs: 0,
    pausedDurationMs: 0,
    sessionStartedAtMs: 0,
  };

  const snapshot = getIdlePausedSnapshot({
    idleStartedAtMs: 5_000,
    nowMs: 21_000,
    state,
  });

  assert.equal(snapshot.totalElapsedTimeMs, 21_000);
  assert.equal(snapshot.pausedDurationMs, 6_000);
  assert.equal(snapshot.activeElapsedTimeMs, 15_000);
});

test('resuming after idle preserves active time and counts the paused gap', () => {
  const pausedSnapshot = getIdlePausedSnapshot({
    idleStartedAtMs: 5_000,
    nowMs: 21_000,
    state: {
      activeStartedAtMs: 0,
      pausedDurationMs: 0,
      sessionStartedAtMs: 0,
    },
  });
  const activeStartedAtMs = getActiveStartForResume({
    activeElapsedTimeMs: pausedSnapshot.activeElapsedTimeMs,
    nowMs: 25_000,
    pausedDurationMs: pausedSnapshot.pausedDurationMs + 4_000,
  });
  const resumedSnapshot = getTimerSnapshot(
    {
      activeStartedAtMs,
      pausedDurationMs: pausedSnapshot.pausedDurationMs + 4_000,
      sessionStartedAtMs: 0,
    },
    28_000,
  );

  assert.equal(resumedSnapshot.totalElapsedTimeMs, 28_000);
  assert.equal(resumedSnapshot.pausedDurationMs, 10_000);
  assert.equal(resumedSnapshot.activeElapsedTimeMs, 18_000);
});

test('completion timing records active, paused, and total seconds separately', () => {
  const timing = calculateCompletionTiming(
    createCompletedBoard({
      elapsedTimeMs: 42_000,
      pausedDurationMs: 18_000,
      totalElapsedTimeMs: 60_000,
    }),
  );

  assert.deepEqual(timing, {
    pausedDurationSeconds: 18,
    timeSeconds: 42,
    totalTimeSeconds: 60,
  });
});

test('completion timing derives total duration from pause history when needed', () => {
  const timing = calculateCompletionTiming(
    createCompletedBoard({
      elapsedTimeMs: 42_000,
      pausedDurationMs: 18_000,
    }),
  );

  assert.deepEqual(timing, {
    pausedDurationSeconds: 18,
    timeSeconds: 42,
    totalTimeSeconds: 60,
  });
});
