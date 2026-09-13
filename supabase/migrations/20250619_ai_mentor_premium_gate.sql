-- ============================================
-- AI Mentor: Premium/Pro access gate
-- ============================================
-- Bu SQL kodlarni Supabase SQL Editor'da bajaring

-- 1. Profilda AI Mentor uchun tezkor tekshirish funksiyasi
CREATE OR REPLACE FUNCTION public.is_premium_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = uid
      AND (
        subscription_tier IN ('premium', 'pro')
        OR is_lifetime = true
        OR subscription_expires_at > now()
      )
  );
$$;

-- 2. AI Mentor sahifasi uchun RLS policy (ixtiyoriy — agar API level'da ham himoya kerak bo'lsa)
-- profiles jadvaliga qo'shimcha policy
DO $$
BEGIN
  -- Agar mavjud bo'lsa, avval o'chirish
  DROP POLICY IF EXISTS "Premium users can access AI Mentor" ON public.profiles;
  
  CREATE POLICY "Premium users can access AI Mentor"
    ON public.profiles
    FOR SELECT
    USING (
      user_id = auth.uid()
      AND (
        subscription_tier IN ('premium', 'pro')
        OR is_lifetime = true
        OR subscription_expires_at > now()
      )
    );
END $$;

-- 3. Test: Foydalanuvchi premium ekanligini tekshirish
-- SELECT public.is_premium_user('USER_UUID_HERE');

-- 4. AI Mentor uchun kunlik limit (standart foydalanuvchilar uchun)
CREATE OR REPLACE FUNCTION public.check_ai_mentor_limit(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tier text;
  today_count int;
  max_limit int;
BEGIN
  SELECT COALESCE(subscription_tier, 'standart') INTO user_tier
  FROM public.profiles WHERE user_id = uid;

  IF user_tier IN ('premium', 'pro') THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', -1, 'tier', user_tier);
  END IF;

  SELECT COUNT(*) INTO today_count
  FROM public.ai_mentor_usage
  WHERE user_id = uid
    AND created_at >= (now() AT TIME ZONE 'Asia/Tashkent')::date;

  max_limit := 20;

  IF today_count >= max_limit THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'tier', user_tier, 'limit', max_limit);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'remaining', max_limit - today_count, 'tier', user_tier, 'limit', max_limit);
END $$;

-- 5. AI Mentor ishlatilganini qayd etish (ixtiyoriy)
CREATE TABLE IF NOT EXISTS public.ai_mentor_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_mentor_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert own usage" ON public.ai_mentor_usage;
  CREATE POLICY "Users can insert own usage"
    ON public.ai_mentor_usage FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can read own usage" ON public.ai_mentor_usage;
  CREATE POLICY "Users can read own usage"
    ON public.ai_mentor_usage FOR SELECT
    USING (auth.uid() = user_id);
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_mentor_usage_user_date 
  ON public.ai_mentor_usage (user_id, created_at);
