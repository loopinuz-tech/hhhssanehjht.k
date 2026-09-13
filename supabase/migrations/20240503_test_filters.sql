-- Add difficulty level to test folders
ALTER TABLE public.test_folders ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'oson' CHECK (difficulty IN ('oson', 'osrta', 'qiyin'));

-- This allows filtering folders by difficulty.
-- Also ensures notifications can be marked as read when viewed.
