-- Tests Builder System (User creates, Admin approves)

-- 1. Tests Table with approval system
CREATE TABLE IF NOT EXISTS public.builder_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) DEFAULT 'Matematika',
    grade VARCHAR(50),
    time_limit_min INTEGER DEFAULT 30,
    shuffle_order BOOLEAN DEFAULT false,
    show_result VARCHAR(30) DEFAULT 'immediate'
        CHECK (show_result IN ('immediate','after_review','hidden')),
    fullscreen_mode BOOLEAN DEFAULT true,
    max_attempts INTEGER DEFAULT 1,
    cover_image_url TEXT,
    opens_at TIMESTAMPTZ,
    closes_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft','pending','active','archived','rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Questions Table
CREATE TABLE IF NOT EXISTS public.builder_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.builder_tests(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    question_text TEXT,
    question_image TEXT,
    answer_type VARCHAR(20) NOT NULL
        CHECK (answer_type IN ('variants','written','truefalse','matching','listening','reading')),
    explanation TEXT,
    points INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Answer Options Table
CREATE TABLE IF NOT EXISTS public.builder_answer_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.builder_questions(id) ON DELETE CASCADE,
    label CHAR(1) CHECK (label IN ('A','B','C','D','E','F')),
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0
);

-- 4. Test Attempts Table
CREATE TABLE IF NOT EXISTS public.builder_test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.builder_tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ,
    time_spent_sec INTEGER,
    score_percent NUMERIC(5,2),
    correct_count INTEGER,
    wrong_count INTEGER,
    total_points INTEGER,
    mode VARCHAR(20) CHECK (mode IN ('fullscreen','normal')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Attempt Answers Table
CREATE TABLE IF NOT EXISTS public.builder_attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.builder_test_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.builder_questions(id),
    selected_option_id UUID REFERENCES public.builder_answer_options(id),
    written_answer TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_builder_tests_creator ON public.builder_tests(creator_id);
CREATE INDEX IF NOT EXISTS idx_builder_tests_status ON public.builder_tests(status);
CREATE INDEX IF NOT EXISTS idx_builder_questions_test ON public.builder_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_builder_options_question ON public.builder_answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_builder_attempts_student ON public.builder_test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_builder_attempts_test ON public.builder_test_attempts(test_id);

-- RLS Policies
ALTER TABLE public.builder_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_answer_options ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on builder_tests" ON public.builder_tests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin full access on builder_questions" ON public.builder_questions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin full access on builder_answer_options" ON public.builder_answer_options
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Creator can manage their own tests
CREATE POLICY "Creator manage own tests" ON public.builder_tests
    FOR ALL USING (creator_id = auth.uid());

-- Creator can manage questions for their tests
CREATE POLICY "Creator manage own questions" ON public.builder_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.builder_tests 
            WHERE builder_tests.id = builder_questions.test_id 
            AND builder_tests.creator_id = auth.uid()
        )
    );

-- Creator can manage options for their questions
CREATE POLICY "Creator manage own options" ON public.builder_answer_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.builder_questions q
            JOIN public.builder_tests t ON t.id = q.test_id
            WHERE q.id = builder_answer_options.question_id 
            AND t.creator_id = auth.uid()
        )
    );

-- Public can read active tests (for taking tests)
CREATE POLICY "Public read active tests" ON public.builder_tests
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public read questions for active tests" ON public.builder_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.builder_tests 
            WHERE builder_tests.id = builder_questions.test_id 
            AND builder_tests.status = 'active'
        )
    );

CREATE POLICY "Public read options for active tests" ON public.builder_answer_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.builder_questions q
            JOIN public.builder_tests t ON t.id = q.test_id
            WHERE q.id = builder_answer_options.question_id 
            AND t.status = 'active'
        )
    );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_builder_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_builder_tests_updated_at
    BEFORE UPDATE ON public.builder_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_builder_tests_updated_at();
