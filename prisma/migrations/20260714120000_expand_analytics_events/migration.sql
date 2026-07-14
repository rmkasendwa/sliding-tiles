ALTER TABLE "anonymous_analytics_events"
  ADD COLUMN "user_id" TEXT,
  ADD COLUMN "signed_in" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "pathname" TEXT,
  ADD COLUMN "referrer" TEXT,
  ADD COLUMN "device_type" TEXT,
  ADD COLUMN "browser" TEXT,
  ADD COLUMN "operating_system" TEXT,
  ADD COLUMN "ip_address" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "metadata" JSONB;

CREATE INDEX "anonymous_analytics_events_user_id_occurred_at_idx"
  ON "anonymous_analytics_events"("user_id", "occurred_at");

ALTER TABLE "anonymous_analytics_events"
  ADD CONSTRAINT "anonymous_analytics_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
