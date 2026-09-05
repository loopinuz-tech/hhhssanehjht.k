-- Migration: Add slug column to public.mock_tests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mock_tests' AND column_name = 'slug'
    ) THEN
        ALTER TABLE public.mock_tests ADD COLUMN slug TEXT;
    END IF;
END $$;
