-- Rename existing tables to plural snake_case names.
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "GameState" RENAME TO "game_states";
ALTER TABLE "Leaderboard" RENAME TO "leaderboards";

-- Align primary key constraint names with renamed tables.
ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";
ALTER TABLE "game_states" RENAME CONSTRAINT "GameState_pkey" TO "game_states_pkey";
ALTER TABLE "leaderboards" RENAME CONSTRAINT "Leaderboard_pkey" TO "leaderboards_pkey";

-- Align index names with renamed tables.
ALTER INDEX "User_email_key" RENAME TO "users_email_key";
ALTER INDEX "GameState_userId_key" RENAME TO "game_states_userId_key";
ALTER INDEX "Leaderboard_level_timeSeconds_moves_idx" RENAME TO "leaderboards_level_timeSeconds_moves_idx";
ALTER INDEX "Leaderboard_userId_completedAt_idx" RENAME TO "leaderboards_userId_completedAt_idx";

-- Align foreign key constraint names with renamed tables.
ALTER TABLE "game_states" RENAME CONSTRAINT "GameState_userId_fkey" TO "game_states_userId_fkey";
ALTER TABLE "leaderboards" RENAME CONSTRAINT "Leaderboard_userId_fkey" TO "leaderboards_userId_fkey";
