-- 20260831_user_device_logs.sql
-- Foydalanuvchilarning qurilma loglarini saqlash

CREATE TABLE IF NOT EXISTS public.user_device_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  user_agent TEXT,
  screen_info TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_device_logs_user_id ON public.user_device_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_fingerprint ON public.user_device_logs(fingerprint);

-- RLS
ALTER TABLE public.user_device_logs ENABLE ROW LEVEL SECURITY;

-- User can insert/update their own logs
CREATE POLICY "device_logs_own_write"
  ON public.user_device_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "device_logs_own_update"
  ON public.user_device_logs FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can read all
CREATE POLICY "device_logs_admin_read"
  ON public.user_device_logs FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
