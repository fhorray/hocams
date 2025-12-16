-- Add CEFR level column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cefr_level TEXT DEFAULT 'A1';

-- Add example sentences and pronunciation to vocabulary
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS example_sentence TEXT;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS pronunciation TEXT;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN users.cefr_level IS 'CEFR proficiency level: A1, A2, B1, B2, C1, C2';
