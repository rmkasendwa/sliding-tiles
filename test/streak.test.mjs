import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateStreakUpdate } from '../dist/api/leaderboard/leaderboard.service.js';

test('streaks increment on consecutive local days', () => {
  const result = calculateStreakUpdate({
    celebratedMilestones: [],
    currentStreak: 2,
    lastCompletionLocalDate: '2026-08-06',
    localDate: '2026-08-07',
    longestStreak: 4,
  });

  assert.equal(result.currentStreak, 3);
  assert.equal(result.longestStreak, 4);
  assert.equal(result.newlyAchievedMilestone, null);
});

test('same-day completions keep streaks unchanged', () => {
  const result = calculateStreakUpdate({
    celebratedMilestones: [],
    currentStreak: 6,
    lastCompletionLocalDate: '2026-08-07',
    localDate: '2026-08-07',
    longestStreak: 6,
  });

  assert.equal(result.currentStreak, 6);
  assert.equal(result.longestStreak, 6);
  assert.equal(result.newlyAchievedMilestone, null);
});

test('missed local days reset the current streak', () => {
  const result = calculateStreakUpdate({
    celebratedMilestones: [],
    currentStreak: 9,
    lastCompletionLocalDate: '2026-08-05',
    localDate: '2026-08-07',
    longestStreak: 9,
  });

  assert.equal(result.currentStreak, 1);
  assert.equal(result.longestStreak, 9);
});

test('streak milestone celebrations are recorded once', () => {
  const firstHit = calculateStreakUpdate({
    celebratedMilestones: [],
    currentStreak: 6,
    lastCompletionLocalDate: '2026-08-06',
    localDate: '2026-08-07',
    longestStreak: 6,
  });

  assert.equal(firstHit.currentStreak, 7);
  assert.equal(firstHit.newlyAchievedMilestone, 7);
  assert.deepEqual(firstHit.celebratedMilestones, [7]);

  const alreadyCelebrated = calculateStreakUpdate({
    celebratedMilestones: firstHit.celebratedMilestones,
    currentStreak: 7,
    lastCompletionLocalDate: '2026-08-07',
    localDate: '2026-08-07',
    longestStreak: 7,
  });

  assert.equal(alreadyCelebrated.currentStreak, 7);
  assert.equal(alreadyCelebrated.newlyAchievedMilestone, null);
  assert.deepEqual(alreadyCelebrated.celebratedMilestones, [7]);
});
