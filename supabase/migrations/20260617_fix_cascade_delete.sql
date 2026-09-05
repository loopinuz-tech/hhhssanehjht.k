-- Fix cascade delete for builder tables
-- Problem: builder_attempt_answers has no CASCADE on question_id/selected_option_id
-- Solution: Change foreign keys to ON DELETE SET NULL + add creator DELETE policies

-- Step 1: Drop old constraints on builder_attempt_answers
ALTER TABLE public.builder_attempt_answers
  DROP CONSTRAINT IF EXISTS builder_attempt_answers_question_id_fkey;

ALTER TABLE public.builder_attempt_answers
  DROP CONSTRAINT IF EXISTS builder_attempt_answers_selected_option_id_fkey;

-- Step 2: Re-add with ON DELETE SET NULL (safe: keeps attempt records, nullifies refs)
ALTER TABLE public.builder_attempt_answers
  ADD CONSTRAINT builder_attempt_answers_question_id_fkey
    FOREIGN KEY (question_id)
    REFERENCES public.builder_questions(id)
    ON DELETE SET NULL;

ALTER TABLE public.builder_attempt_answers
  ADD CONSTRAINT builder_attempt_answers_selected_option_id_fkey
    FOREIGN KEY (selected_option_id)
    REFERENCES public.builder_answer_options(id)
    ON DELETE SET NULL;

-- Step 3: Allow creators to delete attempt_answers for their own tests
DROP POLICY IF EXISTS "Creator delete own attempt answers" ON public.builder_attempt_answers;
CREATE POLICY "Creator delete own attempt answers" ON public.builder_attempt_answers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.builder_test_attempts a
      JOIN public.builder_tests t ON t.id = a.test_id
      WHERE a.id = builder_attempt_answers.attempt_id
      AND t.creator_id = auth.uid()
    )
  );

-- Step 4: Allow creators to delete attempts for their own tests
DROP POLICY IF EXISTS "Creator delete own attempts" ON public.builder_test_attempts;
CREATE POLICY "Creator delete own attempts" ON public.builder_test_attempts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.builder_tests
      WHERE builder_tests.id = builder_test_attempts.test_id
      AND builder_tests.creator_id = auth.uid()
    )
  );
