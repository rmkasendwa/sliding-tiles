-- Ensure stored emails are normalized before enforcing case-insensitive uniqueness.
-- If legacy data contains case-only duplicates, keep the earliest account on the
-- normalized address and move later duplicate accounts to deterministic
-- plus-addressed placeholders. This preserves every user row instead of deleting
-- accounts while allowing the unique lower(email) index to be created safely.
WITH normalized AS (
  SELECT
    id,
    created_at,
    LOWER(TRIM(email)) AS normalized_email
  FROM users
), ranked AS (
  SELECT
    id,
    normalized_email,
    ROW_NUMBER() OVER (
      PARTITION BY normalized_email
      ORDER BY created_at, id
    ) AS duplicate_rank
  FROM normalized
), resolved AS (
  SELECT
    id,
    CASE
      WHEN duplicate_rank = 1 THEN normalized_email
      WHEN POSITION('@' IN normalized_email) > 1 THEN CONCAT(
        SPLIT_PART(normalized_email, '@', 1),
        '+duplicate-',
        duplicate_rank::text,
        '-',
        SUBSTRING(id FROM 1 FOR 8),
        '@',
        SPLIT_PART(normalized_email, '@', 2)
      )
      ELSE CONCAT(
        'duplicate-',
        duplicate_rank::text,
        '-',
        SUBSTRING(id FROM 1 FOR 8),
        '@invalid.local'
      )
    END AS resolved_email
  FROM ranked
)
UPDATE users AS u
SET email = r.resolved_email
FROM resolved AS r
WHERE u.id = r.id
  AND u.email <> r.resolved_email;

DROP INDEX IF EXISTS users_email_key;

CREATE UNIQUE INDEX users_email_lower_key ON users (LOWER(email));
