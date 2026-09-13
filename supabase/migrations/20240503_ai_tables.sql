-- Eduly AI uchun zarur bo'lgan SQL jadvallar va RLS qoidalari
-- Ushbu kodni Supabase -> SQL Editor qismiga tushirib run qiling

-- 1. Chatlar jadvali
CREATE TABLE IF NOT EXISTS public.ai_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'test_tahlil',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Xabarlar jadvali
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.ai_chats(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Xavfsizlik (RLS) qoidalari
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Chatlar uchun qoidalar
CREATE POLICY "Foydalanuvchilar o'z chatlarini ko'ra oladi" ON public.ai_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchilar chat yarata oladi" ON public.ai_chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Xabarlar uchun qoidalar
CREATE POLICY "Foydalanuvchilar o'z xabarlarini ko'ra oladi" ON public.ai_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_chats 
            WHERE public.ai_chats.id = public.ai_messages.chat_id 
            AND public.ai_chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Foydalanuvchilar xabar yubora oladi" ON public.ai_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_chats 
            WHERE public.ai_chats.id = public.ai_messages.chat_id 
            AND public.ai_chats.user_id = auth.uid()
        )
    );

-- 4. Demo ma'lumotlar (Testing uchun)
-- Eslatma: 'USER_ID' o'rniga profilingizdagi user_id UUID sini qo'ying
-- INSERT INTO public.ai_chats (user_id, title) VALUES ('haqiqiy-uuid-shu-yerga', 'Demo Chat');
