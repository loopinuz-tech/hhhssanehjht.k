-- Fix spelling inconsistency: 'Ingiliz tili' → 'Ingliz tili'
-- test_folders use 'Ingiliz tili' but subjects table uses 'Ingliz tili'

UPDATE public.test_folders
SET subject = 'Ingliz tili'
WHERE subject = 'Ingiliz tili';

-- Ensure 'Ingliz tili' is active in subjects
UPDATE public.subjects
SET is_active = true
WHERE name = 'Ingliz tili';

-- Also update any other tables that reference 'Ingiliz tili'
UPDATE public.materials
SET subject = 'Ingliz tili'
WHERE subject = 'Ingiliz tili';

UPDATE public.announcements
SET subject = 'Ingliz tili'
WHERE subject = 'Ingiliz tili';

UPDATE public.vocabularies
SET subject = 'Ingliz tili'
WHERE subject = 'Ingiliz tili';

UPDATE public.mistakes
SET subject = 'Ingliz tili'
WHERE subject = 'Ingiliz tili';
