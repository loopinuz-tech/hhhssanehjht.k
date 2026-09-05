-- Simple fix: ensure status column exists and RLS allows admin update

-- 1. Add status column if not exists
DO $$ BEGIN
  ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Set all existing questions to active
UPDATE public.questions SET status = 'active' WHERE status IS NULL;

-- 3. Drop ALL existing policies on questions
DO $$ DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'questions' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.questions';
  END LOOP;
END $$;

-- 4. Create simple policies
-- Everyone can read active questions
CREATE POLICY "read_active" ON public.questions
  FOR SELECT USING (status = 'active');

-- Logged in users can read ALL questions (for admin panel)
CREATE POLICY "read_all_authenticated" ON public.questions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Logged in users can insert
CREATE POLICY "insert_authenticated" ON public.questions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Logged in users can update (we trust the app to control this)
CREATE POLICY "update_authenticated" ON public.questions
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (true);

-- Logged in users can delete
CREATE POLICY "delete_authenticated" ON public.questions
  FOR DELETE USING (auth.uid() IS NOT NULL);
