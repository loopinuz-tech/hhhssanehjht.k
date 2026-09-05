-- Fix RLS for builder_test_attempts and builder_attempt_answers

-- Enable RLS
ALTER TABLE public.builder_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_attempt_answers ENABLE ROW LEVEL SECURITY;

-- Students can read their own attempts
CREATE POLICY "Students read own attempts" ON public.builder_test_attempts
    FOR SELECT USING (student_id = auth.uid());

-- Students can insert their own attempts
CREATE POLICY "Students insert own attempts" ON public.builder_test_attempts
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own attempts (for finishing)
CREATE POLICY "Students update own attempts" ON public.builder_test_attempts
    FOR UPDATE USING (student_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin full access on attempts" ON public.builder_test_attempts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Students can read their own answers
CREATE POLICY "Students read own answers" ON public.builder_attempt_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.builder_test_attempts
            WHERE builder_test_attempts.id = builder_attempt_answers.attempt_id
            AND builder_test_attempts.student_id = auth.uid()
        )
    );

-- Students can insert answers for their own attempts
CREATE POLICY "Students insert own answers" ON public.builder_attempt_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.builder_test_attempts
            WHERE builder_test_attempts.id = builder_attempt_answers.attempt_id
            AND builder_test_attempts.student_id = auth.uid()
        )
    );

-- Admin full access on answers
CREATE POLICY "Admin full access on answers" ON public.builder_attempt_answers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
