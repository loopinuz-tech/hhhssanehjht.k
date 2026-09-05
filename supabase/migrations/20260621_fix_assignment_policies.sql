-- Fix: Recreate assignment policies with attempt read access
-- Drop existing policies first

DROP POLICY IF EXISTS "Admin full access on assignments" ON public.builder_test_assignments;
DROP POLICY IF EXISTS "Creator manage own assignments" ON public.builder_test_assignments;
DROP POLICY IF EXISTS "Users read own assignments" ON public.builder_test_assignments;
DROP POLICY IF EXISTS "Assigned read attempts for assigned tests" ON public.builder_test_attempts;
DROP POLICY IF EXISTS "Assigned read answers for assigned tests" ON public.builder_attempt_answers;

-- Recreate assignment policies
CREATE POLICY "Admin full access on assignments" ON public.builder_test_assignments
    FOR ALL USING (public.is_platform_admin());

CREATE POLICY "Creator manage own assignments" ON public.builder_test_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.builder_tests
            WHERE builder_tests.id = builder_test_assignments.test_id
            AND builder_tests.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users read own assignments" ON public.builder_test_assignments
    FOR SELECT USING (user_id = auth.uid());

-- Assigned users can read ALL attempts on assigned tests (teacher view)
CREATE POLICY "Assigned read attempts for assigned tests" ON public.builder_test_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.builder_test_assignments
            WHERE builder_test_assignments.test_id = builder_test_attempts.test_id
            AND builder_test_assignments.user_id = auth.uid()
        )
    );

-- Assigned users can read ALL answers for attempts on assigned tests
CREATE POLICY "Assigned read answers for assigned tests" ON public.builder_attempt_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.builder_test_attempts a
            JOIN public.builder_test_assignments ba ON ba.test_id = a.test_id
            WHERE a.id = builder_attempt_answers.attempt_id
            AND ba.user_id = auth.uid()
        )
    );
