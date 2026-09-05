-- ========================================================
-- MOCK TESTS & QUESTIONS SCHEMA FIX
-- Enables metadata column, question_subtext, flexible question types, and RLS
-- ========================================================

-- 1. Ensure type columns are TEXT rather than restricted ENUMs
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_tests' AND column_name='type' AND udt_name='mock_test_type') THEN
        ALTER TABLE public.mock_tests ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_test_questions' AND column_name='type' AND udt_name='mock_question_type') THEN
        ALTER TABLE public.mock_test_questions ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
END $$;

-- 2. Create or Update mock_tests
CREATE TABLE IF NOT EXISTS public.mock_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    type TEXT DEFAULT 'milliy_sertifikat',
    price_cash DECIMAL(12, 2) DEFAULT 0,
    price_educoin INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    duration_minutes INTEGER DEFAULT 60,
    questions_count INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create or Update mock_test_questions
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_subtext TEXT,
    question_image TEXT,
    type TEXT NOT NULL DEFAULT 'multiple_choice',
    metadata JSONB DEFAULT '{}'::jsonb,
    correct_answer JSONB,
    explanation TEXT,
    points_a DECIMAL(4, 2) DEFAULT 1.0,
    points_b DECIMAL(4, 2) DEFAULT 1.0,
    difficulty INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ENSURE metadata, question_subtext, and difficulty columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_test_questions' AND column_name='question_subtext') THEN
        ALTER TABLE public.mock_test_questions ADD COLUMN question_subtext TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_test_questions' AND column_name='question_image') THEN
        ALTER TABLE public.mock_test_questions ADD COLUMN question_image TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_test_questions' AND column_name='metadata') THEN
        ALTER TABLE public.mock_test_questions ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mock_test_questions' AND column_name='difficulty') THEN
        ALTER TABLE public.mock_test_questions ADD COLUMN difficulty INTEGER DEFAULT 1;
    END IF;
END $$;

-- 5. RLS Policies
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active mock tests" ON public.mock_tests;
CREATE POLICY "Public can view active mock tests" ON public.mock_tests FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage mock tests" ON public.mock_tests;
CREATE POLICY "Admins can manage mock tests" ON public.mock_tests FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'sub_admin'))
);

DROP POLICY IF EXISTS "Users can view questions of active tests" ON public.mock_test_questions;
CREATE POLICY "Users can view questions of active tests" ON public.mock_test_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.mock_tests WHERE id = test_id AND is_active = true)
);

DROP POLICY IF EXISTS "Admins can manage mock questions" ON public.mock_test_questions;
CREATE POLICY "Admins can manage mock questions" ON public.mock_test_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'sub_admin'))
);

NOTIFY pgrst, 'reload schema';
