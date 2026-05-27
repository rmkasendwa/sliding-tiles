WITH normalized AS (
  SELECT
    id,
    created_at,
    COALESCE(
      NULLIF(LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '_', 'g')), ''),
      'player'
    ) AS base_username
  FROM "users"
), legacy_ranked AS (
  SELECT
    id,
    CASE
      WHEN ROW_NUMBER() OVER (PARTITION BY base_username ORDER BY created_at, id) = 1
        THEN base_username
      ELSE CONCAT(
        base_username,
        '_',
        ROW_NUMBER() OVER (PARTITION BY base_username ORDER BY created_at, id)
      )
    END AS legacy_username
  FROM normalized
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
  FROM (
    SELECT
      id,
      created_at,
      (('x' || SUBSTRING(MD5(id) FROM 1 FOR 15))::bit(60)::bigint) AS base_number
    FROM "users"
  ) numbered
), replacements AS (
  SELECT
    u.id,
    g.generated_username AS new_username
  FROM "users" u
  INNER JOIN legacy_ranked l ON l.id = u.id
  INNER JOIN generated g ON g.id = u.id
  WHERE u.username = l.legacy_username
)
UPDATE "users" AS u
SET "username" = r.new_username
FROM replacements AS r
WHERE u.id = r.id;
