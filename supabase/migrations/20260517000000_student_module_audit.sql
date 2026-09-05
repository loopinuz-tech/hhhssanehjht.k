-- Consolidated Migration for Student Module Audit and Fixes
-- Standardizes naming conventions and adds missing features

-- 1. Ensure profiles has all needed columns for student settings and tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS target_score INTEGER DEFAULT 1400,
ADD COLUMN IF NOT EXISTS target_university TEXT,
ADD COLUMN IF NOT EXISTS university_logo_url TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mobile_nav_style TEXT DEFAULT 'bottom_nav',
ADD COLUMN IF NOT EXISTS desktop_nav_style TEXT DEFAULT 'left_sidebar',
ADD COLUMN IF NOT EXISTS last_daily_reward_date DATE,
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hide_live_chat BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_next_sat_time BOOLEAN DEFAULT false;

-- 2. Standardized SAT Question Bank Table
CREATE TABLE IF NOT EXISTS public.sat_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist even if the table was previously created
ALTER TABLE public.sat_questions ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.sat_questions ADD COLUMN IF NOT EXISTS sub_category TEXT;
ALTER TABLE public.sat_questions ADD COLUMN IF NOT EXISTS passage TEXT;
ALTER TABLE public.sat_questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE public.sat_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.sat_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable RLS for sat_questions
ALTER TABLE public.sat_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid errors on re-run
DROP POLICY IF EXISTS "Anyone can read active questions" ON public.sat_questions;
CREATE POLICY "Anyone can read active questions" ON public.sat_questions 
    FOR SELECT USING (is_active = true);

-- 3. Standardized SAT Submissions (Progress) Table
CREATE TABLE IF NOT EXISTS public.sat_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.sat_questions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sat_submissions ADD COLUMN IF NOT EXISTS selected_option TEXT;
ALTER TABLE public.sat_submissions ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE public.sat_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'answered' CHECK (status IN ('answered', 'flagged', 'saved'));
ALTER TABLE public.sat_submissions ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE public.sat_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure unique constraint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sat_submissions_user_id_question_id_key') THEN
        ALTER TABLE public.sat_submissions ADD CONSTRAINT sat_submissions_user_id_question_id_key UNIQUE(user_id, question_id);
    END IF;
END $$;

-- Enable RLS for sat_submissions
ALTER TABLE public.sat_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own submissions" ON public.sat_submissions;
CREATE POLICY "Users can manage their own submissions" ON public.sat_submissions 
    FOR ALL USING (auth.uid() = user_id);

-- 4. Question Highlights Table
CREATE TABLE IF NOT EXISTS public.sat_highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.sat_questions(id) ON DELETE CASCADE NOT NULL,
    selected_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sat_highlights ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.sat_highlights ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'yellow';
ALTER TABLE public.sat_highlights ADD COLUMN IF NOT EXISTS is_underline BOOLEAN DEFAULT false;

-- Enable RLS for sat_highlights
ALTER TABLE public.sat_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own highlights" ON public.sat_highlights;
CREATE POLICY "Users can manage their own highlights" ON public.sat_highlights 
    FOR ALL USING (auth.uid() = user_id);

-- 5. User Sessions Table (Security)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS browser_name TEXT;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Enable RLS for user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and delete their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view and delete their own sessions" ON public.user_sessions 
    FOR ALL USING (auth.uid() = user_id);

-- 6. Feature Flags for Gamification/New Features
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feature_name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS description TEXT;

-- Enable RLS for feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read feature flags" ON public.feature_flags;
CREATE POLICY "Everyone can read feature flags" ON public.feature_flags 
    FOR SELECT USING (true);

-- 7. Bugs and Feedback (Academic Integrity & Support)
CREATE TABLE IF NOT EXISTS public.bugs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.bugs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can report bugs" ON public.bugs;
CREATE POLICY "Users can report bugs" ON public.bugs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own reported bugs" ON public.bugs;
CREATE POLICY "Users can view their own reported bugs" ON public.bugs FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS rating INTEGER;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;
CREATE POLICY "Users can submit feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Notifications System
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications 
    FOR ALL USING (auth.uid() = user_id);

-- 9. Views for Performance Analysis (Academic Design)
CREATE OR REPLACE VIEW public.student_accuracy_overview AS
SELECT 
    user_id,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE is_correct = true) as correct_answers,
    ROUND(COUNT(*) FILTER (WHERE is_correct = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as accuracy_percentage
FROM public.sat_submissions
GROUP BY user_id;

-- 10. Indexes for Performance
CREATE INDEX IF NOT EXISTS sat_submissions_user_id_idx ON public.sat_submissions(user_id);
CREATE INDEX IF NOT EXISTS sat_questions_section_idx ON public.sat_questions(section);
CREATE INDEX IF NOT EXISTS sat_highlights_question_id_idx ON public.sat_highlights(question_id);
