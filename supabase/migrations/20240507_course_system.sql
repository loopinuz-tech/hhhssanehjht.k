-- Kurslar tizimi uchun SQL migratsiyasi

-- 1. Kurslar jadvali
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    price DECIMAL(12,2) DEFAULT 0.00,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    student_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: Talabalar sonini yangilash
CREATE OR REPLACE FUNCTION public.update_course_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.courses SET student_count = student_count + 1 WHERE id = NEW.course_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.courses SET student_count = student_count - 1 WHERE id = OLD.course_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);

-- 2. Kurs modullari (Bo'limlar)
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);

-- 3. Kurs darslari (Videolar va materiallar)
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT,
    content TEXT,
    material_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);

-- 4. Kurs sotib olishlar (Enrollments)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purchased_at TIMESTAMPTZ DEFAULT now(),
    price_paid DECIMAL(12,2),
    UNIQUE(course_id, user_id)
);

DROP TRIGGER IF EXISTS tr_update_course_student_count ON public.course_enrollments;
CREATE TRIGGER tr_update_course_student_count
    AFTER INSERT OR DELETE ON public.course_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_course_student_count();

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);

-- 5. Izohlar (Reviews/Comments)
CREATE TABLE IF NOT EXISTS public.course_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Layklar (Likes)
CREATE TABLE IF NOT EXISTS public.course_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(lesson_id, user_id)
);

-- 7. Chat xonalari (Kurs bo'yicha)
CREATE TABLE IF NOT EXISTS public.course_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, teacher_id, student_id)
);

-- 8. Chat xabarlari
CREATE TABLE IF NOT EXISTS public.course_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.course_chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) qoidalari - Idempotent usulda (bor bo'lsa o'tkazib yuboradi)

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Admins can view all courses') THEN
        CREATE POLICY "Admins can view all courses" ON public.courses FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Public courses are viewable by everyone') THEN
        CREATE POLICY "Public courses are viewable by everyone" ON public.courses FOR SELECT USING (status = 'approved' OR teacher_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Teachers can manage their own courses') THEN
        CREATE POLICY "Teachers can manage their own courses" ON public.courses FOR ALL USING (teacher_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_lessons' AND policyname = 'Students can view lessons of purchased courses') THEN
        CREATE POLICY "Students can view lessons of purchased courses" ON public.course_lessons FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.course_modules m
                JOIN public.course_enrollments e ON e.course_id = m.course_id
                WHERE m.id = module_id AND e.user_id = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM public.course_modules m
                JOIN public.courses c ON c.id = m.course_id
                WHERE m.id = module_id AND c.teacher_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_chats' AND policyname = 'Users can see their own chats') THEN
        CREATE POLICY "Users can see their own chats" ON public.course_chats FOR SELECT USING (teacher_id = auth.uid() OR student_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_messages' AND policyname = 'Users can see messages in their chats') THEN
        CREATE POLICY "Users can see messages in their chats" ON public.course_messages FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.course_chats c
                WHERE c.id = chat_id AND (c.teacher_id = auth.uid() OR c.student_id = auth.uid())
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_modules' AND policyname = 'Teachers can manage modules') THEN
        CREATE POLICY "Teachers can manage modules" ON public.course_modules FOR ALL USING (
            EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_lessons' AND policyname = 'Teachers can manage lessons') THEN
        CREATE POLICY "Teachers can manage lessons" ON public.course_lessons FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.course_modules m
                JOIN public.courses c ON c.id = m.course_id
                WHERE m.id = module_id AND c.teacher_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_enrollments' AND policyname = 'Students can enroll themselves') THEN
        CREATE POLICY "Students can enroll themselves" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_enrollments' AND policyname = 'Users can see their own enrollments') THEN
        CREATE POLICY "Users can see their own enrollments" ON public.course_enrollments FOR SELECT USING (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid()
        ));
    END IF;

    -- Storage Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Covers are public') THEN
        CREATE POLICY "Covers are public" ON storage.objects FOR SELECT USING (bucket_id = 'course-covers');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Videos are public') THEN
        CREATE POLICY "Videos are public" ON storage.objects FOR SELECT USING (bucket_id = 'course-videos');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers can upload covers') THEN
        CREATE POLICY "Teachers can upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-covers' AND auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Teachers can upload videos') THEN
        CREATE POLICY "Teachers can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-videos' AND auth.role() = 'authenticated');
    END IF;
END $$;

-- 10. Izohlar (Reviews) uchun RLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_reviews' AND policyname = 'Reviews are viewable by everyone') THEN
        CREATE POLICY "Reviews are viewable by everyone" ON public.course_reviews FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_reviews' AND policyname = 'Users can post reviews') THEN
        CREATE POLICY "Users can post reviews" ON public.course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 11. Kursni sotib olish funksiyasi (Wallet orqali)
CREATE OR REPLACE FUNCTION public.buy_course(p_course_id UUID)
RETURNS JSON AS $$
DECLARE
    v_course_price DECIMAL(12,2);
    v_user_balance BIGINT;
    v_teacher_id UUID;
BEGIN
    -- 1. Kurs narxi va egasini olish
    SELECT price, teacher_id INTO v_course_price, v_teacher_id
    FROM public.courses
    WHERE id = p_course_id;

    -- 2. Foydalanuvchi balansini tekshirish
    SELECT balance INTO v_user_balance
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
    -- Balansdan ayirish
    UPDATE public.profiles
    SET balance = balance - v_course_price
    WHERE user_id = auth.uid();

    -- O'qituvchiga pulni o'tkazish (Platforma komissiyasi yo'q deb hisoblaymiz)
    UPDATE public.profiles
    SET balance = balance + v_course_price
    WHERE user_id = v_teacher_id;

    -- A'zo qilish
    INSERT INTO public.course_enrollments (course_id, user_id, price_paid)
    VALUES (p_course_id, auth.uid(), v_course_price);

    RETURN json_build_object('success', true, 'message', 'Kurs muvaffaqiyatli sotib olindi');

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Muhim: teacher_id foreign keyni to'g'irlash (Agar u auth.usersga qarab qolgan bo'lsa)
DO $$
BEGIN
    -- Eski constraintni o'chirish
    ALTER TABLE IF EXISTS public.courses DROP CONSTRAINT IF EXISTS courses_teacher_id_fkey;
    
    -- Yangi constraintni qo'shish (profiles jadvaliga)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.courses 
        ADD CONSTRAINT courses_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN others THEN
        NULL; -- Xatolik bo'lsa o'tkazib yuborish
END $$;

-- Realtime uchun funksiya (Chat yangilanishi uchun)
CREATE OR REPLACE FUNCTION public.handle_new_course_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.course_chats
    SET last_message = NEW.message_text,
        updated_at = now()
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_course_message ON public.course_messages;
CREATE TRIGGER on_new_course_message
    AFTER INSERT ON public.course_messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_course_message();

-- 9. Storage Buckets yaratish (Agar mavjud bo'lmasa)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-covers', 'course-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-videos', 'course-videos', true)
ON CONFLICT (id) DO NOTHING;
