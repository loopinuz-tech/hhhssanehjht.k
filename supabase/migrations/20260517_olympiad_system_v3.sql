
-- Fix Olympiad Registrations relation to allow profiles join from client
ALTER TABLE public.olympiad_registrations DROP CONSTRAINT IF EXISTS olympiad_registrations_user_id_fkey;
ALTER TABLE public.olympiad_registrations 
  ADD CONSTRAINT olympiad_registrations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Ensure is_hidden has a default value if missing
ALTER TABLE public.olympiad_registrations ALTER COLUMN is_hidden SET DEFAULT false;
UPDATE public.olympiad_registrations SET is_hidden = false WHERE is_hidden IS NULL;
