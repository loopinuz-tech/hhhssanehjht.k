-- Profil ma'lumotlarini to'liq saqlash uchun bazani yangilash
-- Ushbu kodni Supabase SQL Editor-da run qiling

-- 1. Profiles jadvaliga yetishmayotgan ustunlarni qo'shish
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS pinfl TEXT;

-- 2. Avatars storage bucketi uchun RLS qoidalari (agar mavjud bo'lmasa)
-- Eskirgan qoidalarni o'chirish va yangilarini o'rnatish
DO $$
BEGIN
    -- Avatars bucketi mavjudligini tekshirish va yaratish
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;

    -- SELECT (Hamma ko'ra oladi)
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

    -- INSERT (Faqat login qilganlar o'zi uchun rasm yuklay oladi)
    DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
    CREATE POLICY "Authenticated users can upload avatars" ON storage.objects 
    FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

    -- UPDATE (Faqat o'zinikini yangilash)
    DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
    CREATE POLICY "Users can update own avatars" ON storage.objects 
    FOR UPDATE TO authenticated 
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

    -- DELETE (Faqat o'zinikini o'chirish)
    DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
    CREATE POLICY "Users can delete own avatars" ON storage.objects 
    FOR DELETE TO authenticated 
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
END $$;
