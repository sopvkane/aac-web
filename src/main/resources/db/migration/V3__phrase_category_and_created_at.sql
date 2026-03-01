ALTER TABLE phrases
  ADD COLUMN IF NOT EXISTS category varchar(50);

ALTER TABLE phrases
  ALTER COLUMN category SET DEFAULT 'general';

UPDATE phrases
SET category = 'general'
WHERE category IS NULL;

ALTER TABLE phrases
  ALTER COLUMN category SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_phrases_category_lower
  ON phrases (lower(category));