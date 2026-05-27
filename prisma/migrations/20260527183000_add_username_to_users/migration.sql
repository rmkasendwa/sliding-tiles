ALTER TABLE "users" ADD COLUMN "username" TEXT;

WITH base AS (
  SELECT
    id,
    created_at,
    (('x' || SUBSTRING(MD5(id) FROM 1 FOR 15))::bit(60)::bigint) AS base_number
  FROM "users"
), generated AS (
  SELECT
    id,
    CASE
      WHEN ROW_NUMBER() OVER (PARTITION BY base_number ORDER BY created_at, id) = 1
        THEN CONCAT('user', base_number::text)
      ELSE CONCAT(
        'user',
        base_number::text,
        ROW_NUMBER() OVER (PARTITION BY base_number ORDER BY created_at, id)::text
      )
    END AS generated_username
  FROM base
)
UPDATE "users" AS u
SET "username" = g.generated_username
FROM generated AS g
WHERE u.id = g.id;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
