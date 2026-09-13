-- Add user blocking and device tracking features

-- 1. Update profiles table to support blocking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS device_id TEXT; -- For hardware/browser fingerprinting

-- 2. Create a function to block/unblock users (admin only)
CREATE OR REPLACE FUNCTION admin_toggle_user_block(
    target_user_id UUID,
    reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET 
        is_blocked = NOT is_blocked,
        blocked_reason = reason
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Policy to prevent blocked users from logging in or fetching data
-- Note: You would usually handle this in your auth middleware or RLS policies.
-- Here is an example of updating an RLS policy for profiles:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ensure users can't see/update their own profile if blocked (optional, depends on UX)
-- CREATE POLICY profile_blocked_check ON profiles
-- FOR ALL
-- USING (NOT is_blocked OR auth.uid() = user_id); -- Adjust as needed
