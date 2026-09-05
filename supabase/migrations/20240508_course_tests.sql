-- Kurs testlari tizimi uchun SQL migratsiyasi

-- 1. Kurs testlari jadvali
CREATE TABLE IF NOT EXISTS public.course_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    passing_score INTEGER DEFAULT 70,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Kurs test savollari jadvali
CREATE TABLE IF NOT EXISTS public.course_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.course_tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    image_url TEXT,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_option INTEGER NOT NULL,
    explanation TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Kurs test natijalari jadvali
CREATE TABLE IF NOT EXISTS public.course_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.course_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ DEFAULT now()
);

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_course_tests_course_id ON public.course_tests(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tests_module_id ON public.course_tests(module_id);
CREATE INDEX IF NOT EXISTS idx_course_test_questions_test_id ON public.course_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_course_test_results_user_id ON public.course_test_results(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.course_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_test_results ENABLE ROW LEVEL SECURITY;

-- 4. RLS Qoidalari

-- Teachers manage their own tests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_tests' AND policyname = 'Teachers can manage tests for their courses') THEN
        CREATE POLICY "Teachers can manage tests for their courses" ON public.course_tests
            FOR ALL USING (EXISTS (
                SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_test_questions' AND policyname = 'Teachers can manage questions for their tests') THEN
        CREATE POLICY "Teachers can manage questions for their tests" ON public.course_test_questions
            FOR ALL USING (EXISTS (
                SELECT 1 FROM public.course_tests t
                JOIN public.courses c ON c.id = t.course_id
                WHERE t.id = test_id AND c.teacher_id = auth.uid()
            ));
    END IF;

    -- Students view tests/questions of purchased courses
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_tests' AND policyname = 'Students can view tests of purchased courses') THEN
        CREATE POLICY "Students can view tests of purchased courses" ON public.course_tests
            FOR SELECT USING (EXISTS (
                SELECT 1 FROM public.course_enrollments WHERE course_id = course_tests.course_id AND user_id = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_test_questions' AND policyname = 'Students can view questions of purchased courses') THEN
        CREATE POLICY "Students can view questions of purchased courses" ON public.course_test_questions
            FOR SELECT USING (EXISTS (
                SELECT 1 FROM public.course_tests t
                JOIN public.course_enrollments e ON e.course_id = t.course_id
                WHERE t.id = test_id AND e.user_id = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM public.course_tests t
                JOIN public.courses c ON c.id = t.course_id
                WHERE t.id = test_id AND c.teacher_id = auth.uid()
            ));
    END IF;

    -- Results tracking
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_test_results' AND policyname = 'Users can view/create own test results') THEN
        CREATE POLICY "Users can view/create own test results" ON public.course_test_results
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_test_results' AND policyname = 'Teachers can view results for their courses') THEN
        CREATE POLICY "Teachers can view results for their courses" ON public.course_test_results
            FOR SELECT USING (EXISTS (
                SELECT 1 FROM public.course_tests t
                JOIN public.courses c ON c.id = t.course_id
                WHERE t.id = test_id AND c.teacher_id = auth.uid()
            ));
    END IF;
END $$;
