-- Fix: Allow test creators to read all attempts on their own tests
-- Problem: Creator can only see their own attempts (RLS filters by student_id)
-- Fix: Add SELECT policy for creators on builder_test_attempts and builder_attempt_answers

-- Creator can read ALL attempts on their own tests
CREATE POLICY "Creator read attempts for own tests" ON public.builder_test_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.builder_tests
            WHERE builder_tests.id = builder_test_attempts.test_id
            AND builder_tests.creator_id = auth.uid()
        )
    );

-- Creator can read ALL answers for attempts on their own tests
CREATE POLICY "Creator read answers for own tests" ON public.builder_attempt_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.builder_test_attempts a
            JOIN public.builder_tests t ON t.id = a.test_id
            WHERE a.id = builder_attempt_answers.attempt_id
            AND t.creator_id = auth.uid()
        )
    );
