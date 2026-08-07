CREATE TABLE "user_streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_completion_local_date" TEXT,
    "last_completion_time_zone" TEXT,
    "celebrated_milestones" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_streaks_user_id_key" ON "user_streaks"("user_id");
CREATE INDEX "user_streaks_user_id_last_completion_local_date_idx" ON "user_streaks"("user_id", "last_completion_local_date");

ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
