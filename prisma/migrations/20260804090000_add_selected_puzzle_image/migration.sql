ALTER TABLE "users" ADD COLUMN "selected_puzzle_image_id" TEXT;
CREATE INDEX "users_selected_puzzle_image_id_idx" ON "users"("selected_puzzle_image_id");
ALTER TABLE "users" ADD CONSTRAINT "users_selected_puzzle_image_id_fkey" FOREIGN KEY ("selected_puzzle_image_id") REFERENCES "puzzle_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
