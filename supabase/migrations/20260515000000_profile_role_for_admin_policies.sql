-- Several later policies check profiles.role directly. Keep this early so a
-- fresh database can apply every migration in filename order.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

UPDATE public.profiles
SET role = 'admin'
WHERE user_id IN (
  SELECT user_id
  FROM public.user_roles
  WHERE role::text = 'admin'
)
AND COALESCE(role, 'user') <> 'admin';
