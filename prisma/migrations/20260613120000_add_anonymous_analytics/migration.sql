CREATE TABLE "anonymous_analytics_events" (
    "id" TEXT NOT NULL,
    "anonymous_player_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "level" INTEGER,
    "puzzle_size" TEXT,
    "move_count" INTEGER,
    "timer_value_ms" INTEGER,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "screen_width" INTEGER,
    "screen_height" INTEGER,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "anonymous_analytics_events_player_occurred_at_idx"
ON "anonymous_analytics_events"("anonymous_player_id", "occurred_at");

CREATE INDEX "anonymous_analytics_events_name_occurred_at_idx"
ON "anonymous_analytics_events"("event_name", "occurred_at");

CREATE INDEX "anonymous_analytics_events_session_id_idx"
ON "anonymous_analytics_events"("session_id");
