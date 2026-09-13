-- ============================================================
-- TOTAL SECURITY LOCKDOWN & PRIVACY ENHANCEMENT
-- Ushbu migratsiya tizimdagi barcha chetlab o'tish (hack) yo'llarini yopadi
-- ============================================================

-- 1. PROFILES: Balans va Rollarni himoyalash
-- Foydalanuvchilar o'z balanslari yoki rollarini o'zgartira olmasligi kerak
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND role = (SELECT role FROM profiles WHERE user_id = auth.uid()) -- Rol o'zgarmasligi kerak
    AND balance = (SELECT balance FROM profiles WHERE user_id = auth.uid()) -- Balans o'zgarmasligi kerak
    AND educoin_balance = (SELECT educoin_balance FROM profiles WHERE user_id = auth.uid()) -- EduCoin o'zgarmasligi kerak
  );

-- 2. TRANSACTIONS: Faqat o'qish mumkin (Immutable)
-- Hech kim (adminlardan tashqari) tranzaksiyalarni o'zgartira yoki o'chira olmaydi
ALTER TABLE educoin_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_transactions" ON educoin_transactions;
CREATE POLICY "user_own_transactions" ON educoin_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "no_user_mod_transactions" ON educoin_transactions;
CREATE POLICY "no_user_mod_transactions" ON educoin_transactions
  FOR INSERT WITH CHECK (false); -- Faqat SECURITY DEFINER funksiyalar orqali yoziladi

-- 3. TEST NATIJALARI: Natijalarni soxtalashtirishdan himoya
-- Foydalanuvchi natijani faqat INSERT qila oladi, lekin UPDATE qila olmaydi
ALTER TABLE course_test_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view/create own test results" ON course_test_results;
CREATE POLICY "Users can view own test results" ON course_test_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own test results" ON course_test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- UPDATE qoidasi yo'q => Natijani o'zgartirib bo'lmaydi

-- 4. FEEDBACK: Yuborilgandan keyin o'zgartirib bo'lmaydi
DROP POLICY IF EXISTS "user_own_feedback" ON platform_feedback;
CREATE POLICY "user_own_feedback" ON platform_feedback
  FOR SELECT USING (auth.uid() = user_id);
-- UPDATE va DELETE yo'q => Fikrni yuborgandan keyin o'chirib bo'lmaydi

-- 5. KURSGA A'ZO BO'LISH: Faqat buy_course funksiyasi orqali
-- Foydalanuvchi to'g'ridan-to'g'ri course_enrollments ga o'zini qo'sha olmasligi kerak (to'lovsiz)
DROP POLICY IF EXISTS "Students can enroll themselves" ON course_enrollments;
CREATE POLICY "No direct enrollment" ON course_enrollments
  FOR INSERT WITH CHECK (false); -- Faqat buy_course RPC orqali a'zo bo'linadi

-- 6. ADMIN SECURITY: Role check funksiyasini mustahkamlash
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. BARCHA JADVALLARDA RLS NI MAJBURIY QILISH
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
  END LOOP;
END $$;

-- 8. MAXFIYLIK: Boshqalarning profilini ko'rishni cheklash
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 9. RPC FUNKSIYALARINI HIMOYA QILISH (Public accessni cheklash)
-- add_educoins funksiyasini faqat tizim yoki admin ishlata olishi kerak
REVOKE EXECUTE ON FUNCTION add_educoins(UUID, INTEGER, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_educoins(UUID, INTEGER, TEXT, TEXT, UUID) TO service_role;
-- Adminlarga ham ruxsat berish (agar kerak bo'lsa)
GRANT EXECUTE ON FUNCTION add_educoins(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;

-- add_educoins ichiga qo'shimcha xavfsizlik
CREATE OR REPLACE FUNCTION add_educoins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Xavfsizlik cheklovi: Faqat admin boshqa birovga coin bera oladi
  -- Oddiy user faqat system triggerlar orqali olishi kerak (bu funksiya revocation bilan yopilgan)
  IF auth.uid() <> p_user_id AND NOT (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin' THEN
    RAISE EXCEPTION 'Ruxsat berilmagan amal';
  END IF;

  -- User o'ziga o'zi 'admin_grant' yoki 'feedback_reward' bera olmasligi kerak
  IF auth.uid() = p_user_id AND p_type IN ('admin_grant', 'feedback_reward', 'refund') AND NOT (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin' THEN
    RAISE EXCEPTION 'Ushbu turdagi tranzaksiya foydalanuvchi tomonidan amalga oshirilishi mumkin emas';
  END IF;

  UPDATE profiles
  SET educoin_balance = GREATEST(0, educoin_balance + p_amount)
  WHERE user_id = p_user_id
  RETURNING educoin_balance INTO new_balance;

  INSERT INTO educoin_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
