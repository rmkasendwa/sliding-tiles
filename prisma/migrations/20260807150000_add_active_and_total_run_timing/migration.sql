ALTER TABLE "leaderboards"
ADD COLUMN "total_time_seconds" INTEGER,
ADD COLUMN "paused_duration_seconds" INTEGER NOT NULL DEFAULT 0;

UPDATE "leaderboards"
SET "total_time_seconds" = "time_seconds"
WHERE "total_time_seconds" IS NULL;

ALTER TABLE "daily_challenge_scores"
ADD COLUMN "total_time_seconds" INTEGER,
ADD COLUMN "paused_duration_seconds" INTEGER NOT NULL DEFAULT 0;

UPDATE "daily_challenge_scores"
SET "total_time_seconds" = "time_seconds"
WHERE "total_time_seconds" IS NULL;
