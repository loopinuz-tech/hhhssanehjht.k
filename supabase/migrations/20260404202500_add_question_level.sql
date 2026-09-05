-- Add question level enum and column
DO $$ BEGIN
    CREATE TYPE question_level AS ENUM ('bilish', 'qollash', 'mulohaza');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE questions ADD COLUMN IF NOT EXISTS level question_level DEFAULT 'bilish';
