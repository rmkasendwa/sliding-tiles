CREATE TABLE "daily_challenge_scores" (
    "id" TEXT NOT NULL,
    "challenge_date" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "moves" INTEGER NOT NULL,
    "time_seconds" INTEGER NOT NULL,
    "puzzle_config" JSONB,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenge_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_challenge_scores_challenge_date_user_id_key" ON "daily_challenge_scores"("challenge_date", "user_id");
CREATE INDEX "daily_challenge_scores_date_time_moves_idx" ON "daily_challenge_scores"("challenge_date", "time_seconds", "moves");
CREATE INDEX "daily_challenge_scores_user_completed_at_idx" ON "daily_challenge_scores"("user_id", "completed_at");

ALTER TABLE "daily_challenge_scores" ADD CONSTRAINT "daily_challenge_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
