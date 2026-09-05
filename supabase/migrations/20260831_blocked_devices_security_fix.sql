-- 20260831_blocked_devices_security_fix.sql
-- Security Hardening for blocked_devices table & RLS policies

-- 1. Add ip_address column if not exists
ALTER TABLE public.blocked_devices 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 2. Create index on ip_address
CREATE INDEX IF NOT EXISTS idx_blocked_devices_ip ON public.blocked_devices(ip_address);

-- 3. Drop open policy that allowed anon users to read all records
DROP POLICY IF EXISTS "blocked_devices_read_all" ON public.blocked_devices;

-- 4. Create secure policy: Admins can read all records
CREATE POLICY "blocked_devices_admin_select"
  ON public.blocked_devices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- 5. RPC Security Definer Function: Safe device block checker without exposing full table to anon
CREATE OR REPLACE FUNCTION public.check_device_blocked(
  p_fingerprint TEXT DEFAULT NULL,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
BEGIN
  -- Check fingerprint match
  IF p_fingerprint IS NOT NULL AND p_fingerprint != '' THEN
    SELECT id, reason INTO v_match
    FROM public.blocked_devices
    WHERE fingerprint = p_fingerprint
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'is_blocked', true,
        'reason', COALESCE(v_match.reason, 'Qurilmangiz EduContest platformasidan bloklangan')
      );
    END IF;
  END IF;

  -- Check IP match
  IF p_ip IS NOT NULL AND p_ip != '' THEN
    SELECT id, reason INTO v_match
    FROM public.blocked_devices
    WHERE ip_address = p_ip
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'is_blocked', true,
        'reason', COALESCE(v_match.reason, 'IP manzilingiz EduContest platformasidan bloklangan')
      );
    END IF;
  END IF;

  -- Not blocked
  RETURN jsonb_build_object(
    'is_blocked', false,
    'reason', NULL
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.check_device_blocked(TEXT, TEXT) TO anon, authenticated, service_role;
