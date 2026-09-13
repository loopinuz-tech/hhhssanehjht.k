-- Kurslar tizimidagi xatolarni tuzatish va yangi funksiyalar qo'shish

-- 1. Course_reviews jadvalidagi user_id constraint-ni profiles jadvaliga yo'naltirish
-- Bu joining (full_name, avatar_url) ishlashi uchun zarur
ALTER TABLE public.course_reviews DROP CONSTRAINT IF EXISTS course_reviews_user_id_fkey;
ALTER TABLE public.course_reviews 
ADD CONSTRAINT course_reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 2. buy_course funksiyasini yangilash (Xabarnoma qo'shish va balansni tekshirish)
CREATE OR REPLACE FUNCTION public.buy_course(p_course_id UUID)
RETURNS JSON AS $$
DECLARE
    v_course_price DECIMAL(12,2);
    v_course_title TEXT;
    v_user_balance BIGINT;
    v_teacher_id UUID;
    v_buyer_name TEXT;
BEGIN
    -- 1. Kurs ma'lumotlarini olish
    SELECT title, price, teacher_id INTO v_course_title, v_course_price, v_teacher_id
    FROM public.courses
    WHERE id = p_course_id;

    -- 2. Foydalanuvchi ma'lumotlarini olish
    SELECT balance, full_name INTO v_user_balance, v_buyer_name
    FROM public.profiles
    WHERE user_id = auth.uid();

    -- 3. Tekshiruvlar
    IF v_course_price > v_user_balance THEN
        RETURN json_build_object('success', false, 'message', 'Balans yetarli emas');
    END IF;

    IF EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = p_course_id AND user_id = auth.uid()) THEN
        RETURN json_build_object('success', false, 'message', 'Siz allaqachon a''zo bo''lgansiz');
    END IF;

    -- 4. To'lovni amalga oshirish
    -- Balansdan ayirish (Sotib oluvchi)
    UPDATE public.profiles
    SET balance = balance - v_course_price
    WHERE user_id = auth.uid();

    -- Balansga qo'shish (O'qituvchi)
    UPDATE public.profiles
    SET balance = balance + v_course_price
    WHERE user_id = v_teacher_id;

    -- A'zo qilish
    INSERT INTO public.course_enrollments (course_id, user_id, price_paid)
    VALUES (p_course_id, auth.uid(), v_course_price);

    -- 5. Bildirishnomalar yuborish
    -- O'qituvchiga xabar
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (v_teacher_id, 'Yangi sotuv!', v_buyer_name || ' sizning "' || v_course_title || '" kursingizni sotib oldi.');

    -- O'quvchiga xabar
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (auth.uid(), 'Tabriklaymiz!', '"' || v_course_title || '" kursiga muvaffaqiyatli a''zo bo''ldingiz.');

    RETURN json_build_object('success', true, 'message', 'Kurs muvaffaqiyatli sotib olindi');

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS qoidalarini tekshirish va to'g'irlash (Izohlar hamma uchun ko'rinishi uchun)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.course_reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.course_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can post reviews" ON public.course_reviews;
CREATE POLICY "Users can post reviews" ON public.course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Kurs darslarini ko'rish qoidasini mustahkamlash
DROP POLICY IF EXISTS "Students can view lessons of purchased courses" ON public.course_lessons;
CREATE POLICY "Students can view lessons of purchased courses" ON public.course_lessons FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.course_modules m
        JOIN public.course_enrollments e ON e.course_id = m.course_id
        WHERE m.id = module_id AND e.user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.course_modules m
        JOIN public.courses c ON c.id = m.course_id
        WHERE m.id = module_id AND c.teacher_id = auth.uid()
    ) OR EXISTS (
        -- Adminlar ham ko'ra olishi uchun
        SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
);
