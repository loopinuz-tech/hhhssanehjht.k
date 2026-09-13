
-- ============================================================
-- OLYMPIAD SYSTEM
-- ============================================================

-- 1. Olympiads Table
CREATE TABLE IF NOT EXISTS public.olympiads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  entry_fee_uzs BIGINT DEFAULT 0,
  entry_fee_educoins INTEGER DEFAULT 0,
  prize_pool_uzs BIGINT DEFAULT 0,
  prize_pool_educoins INTEGER DEFAULT 0,
  prizes JSONB DEFAULT '[]'::jsonb, -- Array of objects: {rank: 1, reward: '1 000 000 UZS', item: 'Laptop'}
  rules TEXT,
  assessment_criteria TEXT,
  technical_tasks TEXT,
  olympiad_type TEXT DEFAULT 'test' CHECK (olympiad_type IN ('test', 'written', 'mixed')),
  show_leaderboard BOOLEAN DEFAULT true,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  questions_count INTEGER DEFAULT 30,
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Olympiad Questions
CREATE TABLE IF NOT EXISTS public.olympiad_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olympiad_id UUID REFERENCES public.olympiads(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option INTEGER NOT NULL,
  image_url TEXT,
  order_number INTEGER DEFAULT 0,
  level TEXT DEFAULT 'bilish',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Olympiad Registrations
CREATE TABLE IF NOT EXISTS public.olympiad_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olympiad_id UUID REFERENCES public.olympiads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'free')),
  payment_method TEXT CHECK (payment_method IN ('uzs', 'educoin', 'none')),
  is_hidden BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(olympiad_id, user_id)
);

-- 4. Olympiad Attempts
CREATE TABLE IF NOT EXISTS public.olympiad_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  olympiad_id UUID REFERENCES public.olympiads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies
ALTER TABLE public.olympiads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olympiad_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olympiad_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olympiad_attempts ENABLE ROW LEVEL SECURITY;

-- Olympiads Policies
CREATE POLICY "Public can view active olympiads" ON public.olympiads 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage olympiads" ON public.olympiads 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Questions Policies
CREATE POLICY "Registered users can view questions" ON public.olympiad_questions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.olympiad_registrations WHERE olympiad_id = olympiad_questions.olympiad_id AND user_id = auth.uid() AND payment_status = 'paid')
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins can manage questions" ON public.olympiad_questions 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Registrations Policies
CREATE POLICY "Users can view own registrations" ON public.olympiad_registrations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register" ON public.olympiad_registrations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage registrations" ON public.olympiad_registrations 
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Attempts Policies
CREATE POLICY "Users can view own attempts" ON public.olympiad_attempts 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can start attempts" ON public.olympiad_attempts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attempts" ON public.olympiad_attempts 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all attempts" ON public.olympiad_attempts 
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_olympiads_updated_at 
  BEFORE UPDATE ON public.olympiads 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
