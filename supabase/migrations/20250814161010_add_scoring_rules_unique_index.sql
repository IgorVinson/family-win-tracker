-- Add unique index (supports ON CONFLICT in upsert) for scoring_rules (kid_id, activity_id)
-- Also eliminate any duplicate rows before creating the index

-- 1. Remove duplicates keeping the most recently updated (fallback to created_at)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY kid_id, activity_id ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id) AS rn
  FROM scoring_rules
)
DELETE FROM scoring_rules sr
USING ranked r
WHERE sr.id = r.id
  AND r.rn > 1;

-- 2. Create the unique index if it does not already exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_scoring_rules_kid_activity ON scoring_rules(kid_id, activity_id);

-- Note: A UNIQUE INDEX is sufficient for Postgres ON CONFLICT(kid_id, activity_id)
-- No further code changes required; the existing supabase-js upsert will now succeed.
