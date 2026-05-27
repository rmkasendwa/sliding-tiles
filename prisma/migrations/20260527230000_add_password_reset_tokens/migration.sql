ALTER TABLE "users"
ADD COLUMN "reset_password_token_hash" TEXT,
ADD COLUMN "reset_password_token_expires_at" TIMESTAMP(3);

CREATE INDEX "users_reset_password_token_hash_idx"
ON "users"("reset_password_token_hash");
