-- 20260831_blocked_devices.sql
-- Bloklangan qurilmalarni saqlash uchun jadval

CREATE TABLE IF NOT EXISTS public.blocked_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  full_name TEXT,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_blocked_devices_fingerprint ON public.blocked_devices(fingerprint);
CREATE INDEX IF NOT EXISTS idx_blocked_devices_user_id ON public.blocked_devices(user_id);

-- RLS
ALTER TABLE public.blocked_devices ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can READ to check if they're blocked
CREATE POLICY "blocked_devices_read_all"
  ON public.blocked_devices FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "blocked_devices_admin_write"
  ON public.blocked_devices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
