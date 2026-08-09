import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateAchievements } from '../dist/api/achievements/achievement-definitions.js';

function createContext(overrides = {}) {
  return {
    board: {
      level: 1,
      moves: 12,
      timeSeconds: 45,
      totalTimeSeconds: 45,
    },
    completionCount: 1,
    highestOriginalLevel: 1,
    isOriginalAttempt: true,
    leaderboardRank: null,
    maxAvailableLevel: null,
    ...overrides,
  };
}

test('awards first-completion and no-undo achievements from completion context', () => {
  const achievements = evaluateAchievements(createContext()).map(
    (achievement) => achievement.achievementId,
  );

  assert.ok(achievements.includes('first_puzzle_completed'));
  assert.ok(achievements.includes('complete_without_undo'));
});

test('awards milestone and speed achievements from configured thresholds', () => {
  const achievements = evaluateAchievements(
    createContext({
      board: {
        level: 10,
        moves: 90,
        timeSeconds: 24,
        totalTimeSeconds: 30,
      },
      completionCount: 10,
      highestOriginalLevel: 10,
    }),
  ).map((achievement) => achievement.achievementId);

  assert.ok(achievements.includes('complete_10_levels'));
  assert.ok(achievements.includes('complete_under_30_seconds'));
});

test('does not award all-levels achievement without a configured max level', () => {
  const achievements = evaluateAchievements(
    createContext({
      highestOriginalLevel: 100,
      maxAvailableLevel: null,
    }),
  ).map((achievement) => achievement.achievementId);

  assert.ok(!achievements.includes('finish_all_available_levels'));
});

test('awards leaderboard achievement when rank reaches the top 10', () => {
  const achievements = evaluateAchievements(
    createContext({
      leaderboardRank: 10,
    }),
  );
  const leaderboardAchievement = achievements.find(
    (achievement) => achievement.achievementId === 'reach_top_10_leaderboard',
  );

  assert.deepEqual(leaderboardAchievement?.metadata, { leaderboardRank: 10 });
});
