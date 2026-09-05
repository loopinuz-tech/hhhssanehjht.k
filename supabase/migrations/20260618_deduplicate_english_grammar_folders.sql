-- Remove duplicate test_folders by name under "Ingiliz tili" subject

-- Step 1: Find duplicates (run this first to check)
SELECT name, COUNT(*) as cnt
FROM public.test_folders
WHERE subject = 'Ingiliz tili' AND category = 'mavzulashtirilgan'
GROUP BY name
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicates using CTE (keeps row with smallest id)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) as rn
  FROM public.test_folders
  WHERE subject = 'Ingiliz tili' AND category = 'mavzulashtirilgan'
)
DELETE FROM public.test_folders
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
