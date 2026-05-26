-- Rename columns to snake_case while preserving existing data.
ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "game_states" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "game_states" RENAME COLUMN "startedAt" TO "started_at";
ALTER TABLE "game_states" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "leaderboards" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "leaderboards" RENAME COLUMN "timeSeconds" TO "time_seconds";
ALTER TABLE "leaderboards" RENAME COLUMN "completedAt" TO "completed_at";

-- Rename indexes and constraints to match snake_case naming.
ALTER INDEX "game_states_userId_key" RENAME TO "game_states_user_id_key";
ALTER INDEX "leaderboards_level_timeSeconds_moves_idx" RENAME TO "leaderboards_level_time_seconds_moves_idx";
ALTER INDEX "leaderboards_userId_completedAt_idx" RENAME TO "leaderboards_user_id_completed_at_idx";

ALTER TABLE "game_states" RENAME CONSTRAINT "game_states_userId_fkey" TO "game_states_user_id_fkey";
ALTER TABLE "leaderboards" RENAME CONSTRAINT "leaderboards_userId_fkey" TO "leaderboards_user_id_fkey";
