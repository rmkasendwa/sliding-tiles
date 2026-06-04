ALTER TABLE "leaderboards"
  ADD COLUMN "attempt_type" TEXT NOT NULL DEFAULT 'original',
  ADD COLUMN "replay_of_id" TEXT,
  ADD COLUMN "puzzle_config" JSONB;

CREATE INDEX "leaderboards_replay_of_id_idx" ON "leaderboards"("replay_of_id");
