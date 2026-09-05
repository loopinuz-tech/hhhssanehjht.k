
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.test_category AS ENUM ('mavzulashtirilgan', 'attestatsiya', 'pedagogik');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal');
CREATE TYPE public.complaint_status AS ENUM ('pending', 'reviewed', 'resolved');

-- ============ USER ROLES (create first for has_role function) ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ HAS_ROLE FUNCTION (before any policies that use it) ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ UPDATED_AT TRIGGER FUNCTION ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  telegram_chat_id TEXT,
  balance BIGINT NOT NULL DEFAULT 0,
  is_lifetime BOOLEAN NOT NULL DEFAULT false,
  has_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TEST FOLDERS ============
CREATE TABLE public.test_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category test_category NOT NULL DEFAULT 'mavzulashtirilgan',
  price INTEGER NOT NULL DEFAULT 2000,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  questions_count INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.test_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active folders" ON public.test_folders FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage folders" ON public.test_folders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_test_folders_updated_at BEFORE UPDATE ON public.test_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ QUESTIONS ============
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES public.test_folders(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  image_url TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option INTEGER NOT NULL,
  order_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TEST SESSIONS ============
CREATE TABLE public.test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.test_folders(id) ON DELETE CASCADE NOT NULL,
  category test_category NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.test_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.test_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.test_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.test_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============ TEST ANSWERS ============
CREATE TABLE public.test_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.test_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  selected_option INTEGER,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own answers" ON public.test_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.test_sessions WHERE id = test_answers.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create own answers" ON public.test_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.test_sessions WHERE id = test_answers.session_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all answers" ON public.test_answers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============ WALLET TRANSACTIONS ============
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL,
  type transaction_type NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage transactions" ON public.wallet_transactions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ RESOURCES ============
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  category TEXT,
  added_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active resources" ON public.resources FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage resources" ON public.resources FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMPLAINTS ============
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'pending',
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage complaints" ON public.complaints FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUPPORT MESSAGES ============
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES public.support_messages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.support_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND is_from_admin = false);
CREATE POLICY "Admins can manage messages" ON public.support_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ ADMIN SETTINGS ============
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view settings" ON public.admin_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.admin_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LEADERBOARD VIEW ============
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.full_name,
  p.avatar_url,
  COUNT(ts.id) AS total_attempts,
  COALESCE(SUM(ts.correct_answers), 0) AS total_correct,
  COALESCE(SUM(ts.total_questions), 0) AS total_questions,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ts.correct_answers), 0) DESC) AS rank
FROM public.profiles p
LEFT JOIN public.test_sessions ts ON ts.user_id = p.user_id AND ts.finished_at IS NOT NULL
GROUP BY p.id, p.full_name, p.avatar_url
HAVING COUNT(ts.id) > 0
ORDER BY total_correct DESC
LIMIT 25;

-- ============ INSERT DEFAULT SETTINGS ============
INSERT INTO public.admin_settings (key, value) VALUES
  ('lifetime_price', '200000'),
  ('qr_image_url', ''),
  ('platform_name', 'Educontest');

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);
CREATE POLICY "Anyone can view resources files" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Authenticated can upload resource files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resources');
CREATE POLICY "Authenticated can update resource files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resources');
CREATE POLICY "Authenticated can delete resource files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resources');

INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);
CREATE POLICY "Anyone can view question images" ON storage.objects FOR SELECT USING (bucket_id = 'question-images');
CREATE POLICY "Authenticated can upload question images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'question-images');
CREATE POLICY "Authenticated can delete question images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'question-images');
