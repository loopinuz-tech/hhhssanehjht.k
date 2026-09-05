-- =========================================================
-- Migration: 20260828_subscription_features_and_limits.sql
-- Description: Subscriptions system features & daily limits enforcement
-- =========================================================

-- 1. Helper function to check if user has active Premium or Pro tier
CREATE OR REPLACE FUNCTION public.is_premium_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = uid
      AND (
        subscription_tier IN ('premium', 'pro')
        OR is_lifetime = true
        OR (subscription_expires_at IS NOT NULL AND subscription_expires_at > now())
      )
  );
$$;

-- 2. Helper function to check if user has active Pro tier (Teacher / Creator)
CREATE OR REPLACE FUNCTION public.is_pro_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = uid
      AND (
        subscription_tier = 'pro'
        OR is_lifetime = true
        OR (subscription_expires_at IS NOT NULL AND subscription_expires_at > now())
      )
  );
$$;

-- 3. Create Daily Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  usage_date date DEFAULT CURRENT_DATE,
  usage_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_daily_usage_unique UNIQUE(user_id, feature_name, usage_date)
);

ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own daily usage" ON public.user_daily_usage;
  CREATE POLICY "Users can read own daily usage"
    ON public.user_daily_usage FOR SELECT
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert/update own daily usage" ON public.user_daily_usage;
  CREATE POLICY "Users can insert/update own daily usage"
    ON public.user_daily_usage FOR ALL
    USING (auth.uid() = user_id);
END $$;

CREATE INDEX IF NOT EXISTS idx_user_daily_usage_lookup 
  ON public.user_daily_usage (user_id, feature_name, usage_date);

-- 4. Check feature access and daily limits
CREATE OR REPLACE FUNCTION public.check_user_daily_feature_limit(uid uuid, p_feature text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier text := 'standart';
  v_is_lifetime boolean := false;
  v_expires_at timestamptz;
  v_current_count int := 0;
  v_max_limit int := 0;
  v_allowed boolean := true;
BEGIN
  -- Get user subscription status
  SELECT 
    COALESCE(subscription_tier, 'standart'),
    COALESCE(is_lifetime, false),
    subscription_expires_at
  INTO v_tier, v_is_lifetime, v_expires_at
  FROM public.profiles
  WHERE user_id = uid;

  -- Check if subscription expired
  IF v_tier != 'standart' AND NOT v_is_lifetime AND (v_expires_at IS NULL OR v_expires_at < now()) THEN
    v_tier := 'standart';
  END IF;

  -- Get usage for today
  SELECT COALESCE(usage_count, 0) INTO v_current_count
  FROM public.user_daily_usage
  WHERE user_id = uid
    AND feature_name = p_feature
    AND usage_date = CURRENT_DATE;

  -- Define limits based on feature and tier
  IF v_tier IN ('premium', 'pro') OR v_is_lifetime THEN
    v_max_limit := -1; -- Unlimited
    v_allowed := true;
  ELSE
    -- Standart (Free) Limits
    IF p_feature = 'ai_chat' THEN
      v_max_limit := 10;
    ELSIF p_feature = 'essay_checker' THEN
      v_max_limit := 3;
    ELSIF p_feature = 'test_attempt' THEN
      v_max_limit := 5;
    ELSIF p_feature = 'vision_ai' THEN
      v_max_limit := 0; -- Restricted on free tier
    ELSIF p_feature = 'course_create' THEN
      v_max_limit := 1;
    ELSE
      v_max_limit := 10;
    END IF;

    IF v_max_limit = 0 THEN
      v_allowed := false;
    ELSIF v_max_limit > 0 AND v_current_count >= v_max_limit THEN
      v_allowed := false;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'tier', v_tier,
    'feature', p_feature,
    'current_count', v_current_count,
    'max_limit', v_max_limit,
    'remaining', CASE WHEN v_max_limit < 0 THEN -1 ELSE GREATEST(0, v_max_limit - v_current_count) END
  );
END $$;

-- 5. Increment user feature usage
CREATE OR REPLACE FUNCTION public.increment_user_feature_usage(uid uuid, p_feature text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_check jsonb;
BEGIN
  v_check := public.check_user_daily_feature_limit(uid, p_feature);

  IF NOT (v_check->>'allowed')::boolean THEN
    RETURN v_check;
  END IF;

  INSERT INTO public.user_daily_usage (user_id, feature_name, usage_date, usage_count, updated_at)
  VALUES (uid, p_feature, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, feature_name, usage_date)
  DO UPDATE SET 
    usage_count = user_daily_usage.usage_count + 1,
    updated_at = now();

  -- Re-check status after increment
  RETURN public.check_user_daily_feature_limit(uid, p_feature);
END $$;
