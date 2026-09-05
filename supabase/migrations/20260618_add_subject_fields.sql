-- Add missing columns to subjects table for AdminCatalog
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS meta_title TEXT DEFAULT '';
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT '';
