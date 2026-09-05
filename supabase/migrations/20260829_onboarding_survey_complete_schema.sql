-- ============================================================================
-- EduContest Onboarding Survey & Profiles Complete Schema Migration
-- Migration Date: 2026-08-29
-- Purpose: Ensures all onboarding survey fields, target goals, schedule options,
--          subject levels, and subscription fields exist on public.profiles table.
-- ============================================================================

-- 1. Ensure public.profiles table exists with base columns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'student',
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add/Verify all onboarding survey fields safely using ALTER TABLE
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/1.png',
    ADD COLUMN IF NOT EXISTS main_goal TEXT,
    ADD COLUMN IF NOT EXISTS target_subject TEXT,
    ADD COLUMN IF NOT EXISTS target_subjects JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS target_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS target_date_label TEXT,
    ADD COLUMN IF NOT EXISTS target_date_labels JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS target_score NUMERIC DEFAULT 140,
    ADD COLUMN IF NOT EXISTS exact_date DATE,
    ADD COLUMN IF NOT EXISTS current_level TEXT DEFAULT 'B',
    ADD COLUMN IF NOT EXISTS subject_levels JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS study_hours TEXT DEFAULT '30 min/day',
    ADD COLUMN IF NOT EXISTS study_days JSONB DEFAULT '["Du", "Se", "Cho", "Pay", "Ju", "Sha"]'::jsonb,
    ADD COLUMN IF NOT EXISTS mock_test_day TEXT DEFAULT 'Yak',
    ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'standart',
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;

-- 3. Create performance indexes for profile querying and subscription checks
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_main_goal ON public.profiles(main_goal);
CREATE INDEX IF NOT EXISTS idx_profiles_target_subject ON public.profiles(target_subject);

-- 4. Enable RLS (Row Level Security) and ensure correct policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Public profiles read access'
    ) THEN
        CREATE POLICY "Public profiles read access" ON public.profiles
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Automatic handle_updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Confirmation Message
COMMENT ON TABLE public.profiles IS 'User profiles containing onboarding survey details, learning targets, and subscription status';
