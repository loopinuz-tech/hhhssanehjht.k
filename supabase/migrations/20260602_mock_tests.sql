
-- Mock Tests (Predictive/Full Tests) System
CREATE TYPE mock_test_type AS ENUM ('milliy_sertifikat', 'full_test', 'predicted_test');
CREATE TYPE mock_question_type AS ENUM ('multiple_choice', 'matching', 'written');

-- 1. Mock Tests Table
CREATE TABLE IF NOT EXISTS public.mock_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    type mock_test_type DEFAULT 'milliy_sertifikat',
    price_cash DECIMAL(12, 2) DEFAULT 0,
    price_educoin INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    duration_minutes INTEGER DEFAULT 120,
    questions_count INTEGER DEFAULT 45,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Mock Test Questions Table
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_image TEXT,
    type mock_question_type NOT NULL,
    
    -- For multiple choice: JSON array of options
    -- For matching: JSON object { "left": ["A", "B"], "right": ["1", "2"] }
    -- For written: null or instructions
    metadata JSONB,
    
    -- Correct answer format depends on type:
    -- MC: "A", "B", "C", "D"
    -- Matching: JSON mapping { "A": "2", "B": "1" }
    -- Written: JSON { "a": "answer_a", "b": "answer_b" }
    correct_answer JSONB NOT NULL,
    
    explanation TEXT,
    points_a DECIMAL(4, 2), -- Specifically for written part A
    points_b DECIMAL(4, 2), -- Specifically for written part B
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Mock Test Submissions (Results)
CREATE TABLE IF NOT EXISTS public.mock_test_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL, -- { "1": "A", "33": {"A":"1", "B":"2"}, "36": {"a": "val", "b": "val"} }
    score DECIMAL(6, 2) DEFAULT 0,
    raw_results JSONB, -- Breakdown of which ones were right/wrong
    ai_feedback TEXT, -- AI feedback for written answers
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_submissions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active tests
CREATE POLICY "Public can view active mock tests" ON public.mock_tests
    FOR SELECT USING (is_active = true);

-- Only admins can manage mock tests
CREATE POLICY "Admins can manage mock tests" ON public.mock_tests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'sub_admin')
        )
    );

-- Questions: Viewable if you have access to the test (implied for simplified version)
CREATE POLICY "Users can view questions of active tests" ON public.mock_test_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mock_tests
            WHERE id = test_id AND is_active = true
        )
    );

CREATE POLICY "Admins can manage mock questions" ON public.mock_test_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'sub_admin')
        )
    );

-- Submissions: Users view their own, admins view all
CREATE POLICY "Users can view their own submissions" ON public.mock_test_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions" ON public.mock_test_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON public.mock_test_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'sub_admin')
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mock_tests_updated_at
    BEFORE UPDATE ON public.mock_tests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
