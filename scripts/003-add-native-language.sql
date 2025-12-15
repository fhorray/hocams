-- Add native_language column to users table for language preference
ALTER TABLE users ADD COLUMN IF NOT EXISTS native_language TEXT DEFAULT 'English';

-- Common languages for Turkish learners
COMMENT ON COLUMN users.native_language IS 'User native language for translations (e.g., English, German, French, Spanish, Arabic, Russian)';
