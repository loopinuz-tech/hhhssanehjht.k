-- Test assignments: admin assigns tests to specific users
CREATE TABLE IF NOT EXISTS public.builder_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.builder_tests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(test_id, user_id)
);

ALTER TABLE public.builder_test_assignments ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on assignments" ON public.builder_test_assignments
    FOR ALL USING (public.is_platform_admin());

-- Creator can manage assignments for own tests
CREATE POLICY "Creator manage own assignments" ON public.builder_test_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.builder_tests
            WHERE builder_tests.id = builder_test_assignments.test_id
            AND builder_tests.creator_id = auth.uid()
        )
    );

-- Users can read their own assignments
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

CREATE INDEX IF NOT EXISTS idx_assignments_test ON public.builder_test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON public.builder_test_assignments(user_id);
