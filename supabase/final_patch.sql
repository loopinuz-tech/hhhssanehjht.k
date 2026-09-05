-- ═══════════════════════════════════════════════════════════════════════════
-- EduContest — Final SQL Patch
-- Supabase SQL Editor'da bir marta ishga tushiring (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Question level enum va column ────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE question_level AS ENUM ('bilish', 'qollash', 'mulohaza');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE questions ADD COLUMN IF NOT EXISTS level question_level DEFAULT 'bilish';

-- ── 2. Get auth email RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_auth_email(target_phone TEXT)
RETURNS TEXT AS $$
  SELECT 'tg_' || telegram_chat_id || '@educontest.uz'
  FROM public.profiles
  WHERE phone = target_phone
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── 3. Mistakes table (backend_completion migration'dan tushib qolgan) ──
CREATE TABLE IF NOT EXISTS public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  correct_solution TEXT,
  tags TEXT[] DEFAULT '{}',
  reason TEXT DEFAULT 'concept',
  image_url TEXT,
  reviewed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mistakes_owner_all" ON public.mistakes;
CREATE POLICY "mistakes_owner_all" ON public.mistakes
  FOR ALL USING (auth.uid() = user_id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_platform_admin());

-- ── 4. Mock test questions metadata fix ────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mock_test_type') THEN
        CREATE TYPE mock_test_type AS ENUM ('milliy_sertifikat', 'full_test', 'predicted_test');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mock_question_type') THEN
        CREATE TYPE mock_question_type AS ENUM ('multiple_choice', 'matching', 'written');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name='mock_test_questions' AND column_name='metadata') THEN
        ALTER TABLE public.mock_test_questions ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- ── 5. Referral system qayta yaratish (idempotent) ─────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_bonus_claimed_5  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_bonus_claimed_10 BOOLEAN DEFAULT FALSE;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  TEXT := '';
  i     INT;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    new_code := generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;
  NEW.referral_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_assign_referral_code ON profiles;
CREATE TRIGGER tr_assign_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION assign_referral_code();

CREATE OR REPLACE FUNCTION check_and_grant_referral_bonus(inviter_user_id UUID)
RETURNS VOID AS $$
DECLARE
  referral_count INT;
  inviter_profile RECORD;
  new_expires TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*) INTO referral_count
  FROM profiles WHERE referred_by = inviter_user_id;
  SELECT * INTO inviter_profile FROM profiles WHERE user_id = inviter_user_id;
  IF referral_count >= 10 AND NOT inviter_profile.referral_bonus_claimed_10 THEN
    new_expires := GREATEST(COALESCE(inviter_profile.subscription_expires_at, NOW()), NOW()) + INTERVAL '14 days';
    UPDATE profiles SET subscription_tier='premium', subscription_expires_at=new_expires,
      referral_bonus_claimed_10=TRUE, referral_bonus_claimed_5=TRUE
    WHERE user_id = inviter_user_id;
    INSERT INTO notifications (user_id, title, body, type, created_at)
    VALUES (inviter_user_id, '14 kunlik Premium faollashtirildi!',
      '10 ta do''st taklif qilganingiz uchun 14 kunlik Premium bepul berildi!',
      'referral_bonus', NOW()) ON CONFLICT DO NOTHING;
    RETURN;
  END IF;
  IF referral_count >= 5 AND NOT inviter_profile.referral_bonus_claimed_5 THEN
    new_expires := GREATEST(COALESCE(inviter_profile.subscription_expires_at, NOW()), NOW()) + INTERVAL '7 days';
    UPDATE profiles SET subscription_tier='premium', subscription_expires_at=new_expires,
      referral_bonus_claimed_5=TRUE
    WHERE user_id = inviter_user_id;
    INSERT INTO notifications (user_id, title, body, type, created_at)
    VALUES (inviter_user_id, '7 kunlik Premium faollashtirildi!',
      '5 ta do''st taklif qilganingiz uchun 7 kunlik Premium bepul berildi!',
      'referral_bonus', NOW()) ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_referred_user_registered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL AND (OLD.referred_by IS NULL OR OLD IS NULL) THEN
    PERFORM check_and_grant_referral_bonus(NEW.referred_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_referral_bonus ON profiles;
CREATE TRIGGER tr_referral_bonus
  AFTER INSERT OR UPDATE OF referred_by ON profiles
  FOR EACH ROW EXECUTE FUNCTION on_referred_user_registered();

CREATE OR REPLACE FUNCTION apply_referral_code(code TEXT)
RETURNS JSON AS $$
DECLARE
  inviter_id UUID;
  current_user_id UUID := auth.uid();
  current_profile RECORD;
BEGIN
  SELECT * INTO current_profile FROM profiles WHERE user_id = current_user_id;
  IF current_profile.referred_by IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Siz allaqachon referral kod ishlatgansiz');
  END IF;
  IF current_profile.referral_code = upper(trim(code)) THEN
    RETURN json_build_object('success', false, 'message', 'O''z referral kodingizni ishlatib bo''lmaydi');
  END IF;
  SELECT user_id INTO inviter_id FROM profiles WHERE referral_code = upper(trim(code));
  IF inviter_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Referral kod topilmadi');
  END IF;
  UPDATE profiles SET referred_by = inviter_id WHERE user_id = current_user_id;
  RETURN json_build_object('success', true, 'message', 'Referral kod muvaffaqiyatli qo''llanildi!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_referrals()
RETURNS JSON AS $$
DECLARE
  current_user_id UUID := auth.uid();
  result JSON;
  referral_count INT;
  my_code TEXT;
BEGIN
  SELECT referral_code INTO my_code FROM profiles WHERE user_id = current_user_id;
  SELECT COUNT(*) INTO referral_count FROM profiles WHERE referred_by = current_user_id;
  SELECT json_build_object(
    'referral_code', my_code,
    'total_count', referral_count,
    'friends', (SELECT COALESCE(json_agg(json_build_object(
      'full_name', p.full_name, 'avatar_url', p.avatar_url, 'joined_at', p.created_at,
      'subscription_tier', p.subscription_tier) ORDER BY p.created_at DESC), '[]')
      FROM profiles p WHERE p.referred_by = current_user_id),
    'bonus_5_claimed', (SELECT referral_bonus_claimed_5 FROM profiles WHERE user_id = current_user_id),
    'bonus_10_claimed', (SELECT referral_bonus_claimed_10 FROM profiles WHERE user_id = current_user_id)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. Questions table — public SELECT (logout rejimida ham ko'rinishi uchun) ──
DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.questions;
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);

-- ── 6. Tekshirish so'rovlari ────────────────────────────────────────────
-- SELECT EXISTS (SELECT 1 FROM mistakes LIMIT 1) AS mistakes_table_ready;
-- SELECT referral_code FROM profiles WHERE referral_code IS NOT NULL LIMIT 5;
