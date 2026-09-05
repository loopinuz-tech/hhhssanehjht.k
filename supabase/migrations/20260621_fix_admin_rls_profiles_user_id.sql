-- Step 1: Create is_platform_admin() function (if not exists)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND COALESCE(p.role, 'user') IN ('admin', 'sub_admin')
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::text = 'admin'
  );
$$;

-- Step 2: Drop and recreate all admin RLS policies using is_platform_admin()

-- builder_tests
DROP POLICY IF EXISTS "Admin full access on builder_tests" ON public.builder_tests;
CREATE POLICY "Admin full access on builder_tests" ON public.builder_tests
    FOR ALL USING (public.is_platform_admin());

-- builder_questions
DROP POLICY IF EXISTS "Admin full access on builder_questions" ON public.builder_questions;
CREATE POLICY "Admin full access on builder_questions" ON public.builder_questions
    FOR ALL USING (public.is_platform_admin());

-- builder_answer_options
DROP POLICY IF EXISTS "Admin full access on builder_answer_options" ON public.builder_answer_options;
CREATE POLICY "Admin full access on builder_answer_options" ON public.builder_answer_options
    FOR ALL USING (public.is_platform_admin());

-- builder_test_attempts
DROP POLICY IF EXISTS "Admin full access on attempts" ON public.builder_test_attempts;
CREATE POLICY "Admin full access on attempts" ON public.builder_test_attempts
    FOR ALL USING (public.is_platform_admin());

-- builder_attempt_answers
DROP POLICY IF EXISTS "Admin full access on answers" ON public.builder_attempt_answers;
CREATE POLICY "Admin full access on answers" ON public.builder_attempt_answers
    FOR ALL USING (public.is_platform_admin());

-- questions
DROP POLICY IF EXISTS "admin_view_all_questions" ON public.questions;
CREATE POLICY "admin_view_all_questions" ON public.questions
  FOR SELECT USING (public.is_platform_admin());

DROP POLICY IF EXISTS "admin_update_all_questions" ON public.questions;
CREATE POLICY "admin_update_all_questions" ON public.questions
  FOR UPDATE USING (public.is_platform_admin())
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_all_questions" ON public.questions;
CREATE POLICY "admin_delete_all_questions" ON public.questions
  FOR DELETE USING (public.is_platform_admin());

DROP POLICY IF EXISTS "sub_admin_update_questions" ON public.questions;
CREATE POLICY "sub_admin_update_questions" ON public.questions
  FOR UPDATE USING (public.is_platform_admin())
  WITH CHECK (true);

-- Step 3: Sync profiles.role from user_roles
UPDATE public.profiles p
SET role = ur.role::text
FROM public.user_roles ur
WHERE p.user_id = ur.user_id
  AND p.role IS DISTINCT FROM ur.role::text;
