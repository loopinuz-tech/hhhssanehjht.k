-- Fix missing educoin_price column and ensure profiles are publicly readable

-- 1. Ensure educoin_price column exists on courses (referenced by buy_course function)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS educoin_price INTEGER DEFAULT 0;

-- 2. Ensure profiles are publicly readable for course teacher info
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- 3. Ensure the foreign key from courses.teacher_id -> profiles.user_id exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'courses_teacher_id_fkey' 
    AND table_schema = 'public' 
    AND table_name = 'courses'
  ) THEN
    ALTER TABLE public.courses 
    ADD CONSTRAINT courses_teacher_id_fkey 
    FOREIGN KEY (teacher_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 4. Ensure RLS is enabled on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 5. Ensure public can view approved courses
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON public.courses;
CREATE POLICY "Public courses are viewable by everyone" ON public.courses 
  FOR SELECT USING (status = 'approved' OR teacher_id = auth.uid());

-- 6. Ensure teachers can manage their own courses
DROP POLICY IF EXISTS "Teachers can manage their own courses" ON public.courses;
CREATE POLICY "Teachers can manage their own courses" ON public.courses 
  FOR ALL USING (teacher_id = auth.uid());
