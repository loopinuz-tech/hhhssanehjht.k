-- Migration to add total_questions and correct_answers to mock_test_submissions
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_test_submissions' AND column_name='total_questions') THEN
        ALTER TABLE public.mock_test_submissions ADD COLUMN total_questions INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_test_submissions' AND column_name='correct_answers') THEN
        ALTER TABLE public.mock_test_submissions ADD COLUMN correct_answers NUMERIC(5, 2) DEFAULT 0;
    END IF;
END $$;
