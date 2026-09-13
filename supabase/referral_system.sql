-- ══════════════════════════════════════════════════════════════════
-- EduContest Referral System - SQL Migration
-- ══════════════════════════════════════════════════════════════════
-- Maqsad:
--   5 do'st taklif qilsa → 7 kunlik Premium bepul
--   10 do'st taklif qilsa → 14 kunlik Premium bepul
-- ══════════════════════════════════════════════════════════════════

-- 1. profiles jadvaliga referral ustunlari qo'shish
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_bonus_claimed_5  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_bonus_claimed_10 BOOLEAN DEFAULT FALSE;

-- 2. Har bir foydalanuvchi uchun unikal referral kodi yaratish
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

-- 3. Mavjud foydalanuvchilarga referral kodi berish (bir martali)
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- 4. Yangi user yaratilganda avtomatik referral kodi berish
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

-- 5. Referral bonuslarini tekshirib, Premium beruvchi funksiya
CREATE OR REPLACE FUNCTION check_and_grant_referral_bonus(inviter_user_id UUID)
RETURNS VOID AS $$
DECLARE
  referral_count INT;
  inviter_profile RECORD;
  new_expires TIMESTAMPTZ;
BEGIN
  -- Tastiqlanganlarni sanash (faqat ro'yxatdan o'tgan do'stlar)
  SELECT COUNT(*)
  INTO referral_count
  FROM profiles
  WHERE referred_by = inviter_user_id;

  SELECT *
  INTO inviter_profile
  FROM profiles
  WHERE user_id = inviter_user_id;

  -- 10 ta do'st → 14 kunlik (faqat bir marta)
  IF referral_count >= 10 AND NOT inviter_profile.referral_bonus_claimed_10 THEN
    new_expires := GREATEST(
      COALESCE(inviter_profile.subscription_expires_at, NOW()),
      NOW()
    ) + INTERVAL '14 days';

    UPDATE profiles SET
      subscription_tier          = 'premium',
      subscription_expires_at    = new_expires,
      referral_bonus_claimed_10  = TRUE,
      referral_bonus_claimed_5   = TRUE   -- 5 ham davom etsin deb
    WHERE user_id = inviter_user_id;

    -- Bildirishnoma yozish (agar notifications jadvali bo'lsa)
    INSERT INTO notifications (user_id, title, body, type, created_at)
    VALUES (
      inviter_user_id,
      '🎉 14 kunlik Premium faollashtirildi!',
      '10 ta do''st taklif qilganingiz uchun 14 kunlik Premium bepul berildi!',
      'referral_bonus',
      NOW()
    ) ON CONFLICT DO NOTHING;

    RETURN;
  END IF;

  -- 5 ta do'st → 7 kunlik (faqat bir marta)
  IF referral_count >= 5 AND NOT inviter_profile.referral_bonus_claimed_5 THEN
    new_expires := GREATEST(
      COALESCE(inviter_profile.subscription_expires_at, NOW()),
      NOW()
    ) + INTERVAL '7 days';

    UPDATE profiles SET
      subscription_tier       = 'premium',
      subscription_expires_at = new_expires,
      referral_bonus_claimed_5 = TRUE
    WHERE user_id = inviter_user_id;

    INSERT INTO notifications (user_id, title, body, type, created_at)
    VALUES (
      inviter_user_id,
      '🎉 7 kunlik Premium faollashtirildi!',
      '5 ta do''st taklif qilganingiz uchun 7 kunlik Premium bepul berildi!',
      'referral_bonus',
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Yangi foydalanuvchi ro'yxatdan o'tganda bonusni avtomatik tekshirish
CREATE OR REPLACE FUNCTION on_referred_user_registered()
RETURNS TRIGGER AS $$
BEGIN
  -- Faqat referred_by to'ldirilgan bo'lsa
  IF NEW.referred_by IS NOT NULL AND (OLD.referred_by IS NULL OR OLD IS NULL) THEN
    PERFORM check_and_grant_referral_bonus(NEW.referred_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_referral_bonus ON profiles;
CREATE TRIGGER tr_referral_bonus
  AFTER INSERT OR UPDATE OF referred_by ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_referred_user_registered();

-- ══════════════════════════════════════════════════════════════════
-- 7. RPC: Referral kodi orqali do'stni bog'lash
--    Frontenddan: supabase.rpc('apply_referral_code', {code: 'ABC12345'})
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION apply_referral_code(code TEXT)
RETURNS JSON AS $$
DECLARE
  inviter_id   UUID;
  current_user_id UUID := auth.uid();
  current_profile RECORD;
BEGIN
  -- Joriy user profilini olish
  SELECT * INTO current_profile FROM profiles WHERE user_id = current_user_id;

  -- Allaqachon boshqa kishi taklif qilganmi?
  IF current_profile.referred_by IS NOT NULL THEN
    RETURN json_build_object('success', false, 'message', 'Siz allaqachon referral kod ishlatgansiz');
  END IF;

  -- O'z kodini ishlatishga urinish
  IF current_profile.referral_code = upper(trim(code)) THEN
    RETURN json_build_object('success', false, 'message', 'O''z referral kodingizni ishlatib bo''lmaydi');
  END IF;

  -- Taklif qiluvchini topish
  SELECT user_id INTO inviter_id
  FROM profiles
  WHERE referral_code = upper(trim(code));

  IF inviter_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Referral kod topilmadi');
  END IF;

  -- Bog'lash
  UPDATE profiles
  SET referred_by = inviter_id
  WHERE user_id = current_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Referral kod muvaffaqiyatli qo''llanildi!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════════
-- 8. RPC: Mening do'stlarim ro'yxati (referral dashboard uchun)
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_my_referrals()
RETURNS JSON AS $$
DECLARE
  current_user_id UUID := auth.uid();
  result JSON;
  referral_count INT;
  my_code TEXT;
BEGIN
  SELECT referral_code INTO my_code
  FROM profiles WHERE user_id = current_user_id;

  SELECT COUNT(*) INTO referral_count
  FROM profiles WHERE referred_by = current_user_id;

  SELECT json_build_object(
    'referral_code', my_code,
    'total_count', referral_count,
    'friends', (
      SELECT COALESCE(json_agg(json_build_object(
        'full_name',   p.full_name,
        'avatar_url',  p.avatar_url,
        'joined_at',   p.created_at,
        'subscription_tier', p.subscription_tier
      ) ORDER BY p.created_at DESC), '[]')
      FROM profiles p
      WHERE p.referred_by = current_user_id
    ),
    'bonus_5_claimed',  (SELECT referral_bonus_claimed_5  FROM profiles WHERE user_id = current_user_id),
    'bonus_10_claimed', (SELECT referral_bonus_claimed_10 FROM profiles WHERE user_id = current_user_id)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════════
-- 9. Notifications jadvaliga type ustuni (agar yo'q bo'lsa)
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';

-- ══════════════════════════════════════════════════════════════════
-- 10. Row Level Security
-- ══════════════════════════════════════════════════════════════════
-- profiles ga allaqachon RLS bor deb hisoblaymiz.
-- get_my_referrals() va apply_referral_code() SECURITY DEFINER —
-- foydalanuvchi faqat o'z ma'lumotlarini ko'radi.

-- ══════════════════════════════════════════════════════════════════
-- TEST: referral_code mavjudligini tekshirish
-- ══════════════════════════════════════════════════════════════════
-- SELECT user_id, full_name, referral_code, referred_by,
--        referral_bonus_claimed_5, referral_bonus_claimed_10
-- FROM profiles LIMIT 10;
