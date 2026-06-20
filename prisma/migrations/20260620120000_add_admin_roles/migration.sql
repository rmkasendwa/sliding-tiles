CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "users"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "promoted_by_id" TEXT,
  ADD COLUMN "promoted_at" TIMESTAMP(3);

ALTER TABLE "users"
  ADD CONSTRAINT "users_promoted_by_id_fkey"
  FOREIGN KEY ("promoted_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_promoted_by_id_idx" ON "users"("promoted_by_id");
