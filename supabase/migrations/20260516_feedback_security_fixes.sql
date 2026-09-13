-- 1. Feedbackni ko'rishda RLS muammosini hal qilish
-- Soddaroq va ishonchli policy
DROP POLICY IF EXISTS "admin_all_feedback" ON platform_feedback;
CREATE POLICY "admin_all_feedback" ON platform_feedback
  FOR ALL USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- 2. Feedback jo'natishda xatolik bo'lmasligi uchun default qiymatlarni tekshirish
ALTER TABLE platform_feedback ALTER COLUMN educoin_reward SET DEFAULT 0;

-- 3. Feedbacklarni osonroq o'qish uchun maxsus view yaratamiz (Admin uchun)
DROP VIEW IF EXISTS admin_feedback_view;
CREATE VIEW admin_feedback_view WITH (security_invoker = true) AS
SELECT 
    f.*,
    p.full_name as user_name,
    p.phone as user_phone
FROM platform_feedback f
LEFT JOIN profiles p ON f.user_id = p.user_id;

-- 4. View xavfsizligini ta'minlash (Security Advisor dagi 2-rasm xatoliklari)
-- Agar ALTER VIEW ishlamasa, VIEW ni boshqatdan yaratish kerak bo'ladi (invoker bilan)
-- Lekin ALTER VIEW SET (security_invoker = true) eng to'g'ri yo'l PG15 da.

ALTER VIEW IF EXISTS admin_top_tests SET (security_invoker = on);
ALTER VIEW IF EXISTS daily_revenue_stats SET (security_invoker = on);
ALTER VIEW IF EXISTS admin_course_revenue_stats SET (security_invoker = on);
ALTER VIEW IF EXISTS admin_dashboard_summary SET (security_invoker = on);
ALTER VIEW IF EXISTS student_accuracy_overview SET (security_invoker = on);

-- 5. Admin profilini tekshirish (Agar o'zingizni admin qila olmayotgan bo'lsangiz)
-- Ushbu qismni faqat kerak bo'lsa ishlating (user_id o'rniga o'z id ingizni qo'ying)
-- UPDATE profiles SET role = 'admin' WHERE user_id = 'SIZNING_USER_ID';
