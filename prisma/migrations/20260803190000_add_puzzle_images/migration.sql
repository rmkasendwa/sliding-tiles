CREATE TABLE "puzzle_images" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "puzzle_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "puzzle_images_user_id_content_hash_key" ON "puzzle_images"("user_id", "content_hash");
CREATE INDEX "puzzle_images_user_id_updated_at_idx" ON "puzzle_images"("user_id", "updated_at");
ALTER TABLE "puzzle_images" ADD CONSTRAINT "puzzle_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
