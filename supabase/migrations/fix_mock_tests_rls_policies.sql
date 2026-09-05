-- ========================================================
-- FIX RLS POLICIES FOR MOCK TESTS, QUESTIONS & SUBMISSIONS
-- Fixes "new row violates row-level security policy for table mock_tests" error
-- ========================================================

-- Enable Row Level Security
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_submissions ENABLE ROW LEVEL SECURITY;

-- Add enable_warnings column if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_tests' AND column_name='enable_warnings') THEN
        ALTER TABLE public.mock_tests ADD COLUMN enable_warnings BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 1. Policies for mock_tests
DROP POLICY IF EXISTS "Public can view active mock tests" ON public.mock_tests;
DROP POLICY IF EXISTS "Admins can manage mock tests" ON public.mock_tests;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.mock_tests;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.mock_tests;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.mock_tests;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.mock_tests;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.mock_tests;

CREATE POLICY "Enable read access for all users" ON public.mock_tests FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.mock_tests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.mock_tests FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.mock_tests FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Policies for mock_test_questions
DROP POLICY IF EXISTS "Public can view mock test questions" ON public.mock_test_questions;
DROP POLICY IF EXISTS "Admins can manage mock test questions" ON public.mock_test_questions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.mock_test_questions;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.mock_test_questions;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.mock_test_questions;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.mock_test_questions;

CREATE POLICY "Enable read access for all users" ON public.mock_test_questions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.mock_test_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON public.mock_test_questions FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON public.mock_test_questions FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Policies for mock_test_submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON public.mock_test_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.mock_test_submissions;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.mock_test_submissions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.mock_test_submissions;

CREATE POLICY "Enable read access for authenticated users" ON public.mock_test_submissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON public.mock_test_submissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
