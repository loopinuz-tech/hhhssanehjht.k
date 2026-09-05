-- 1. Add image_url to platform_feedback table
ALTER TABLE platform_feedback ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Insert storage bucket for feedback images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feedback_images', 'feedback_images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS for feedback_images bucket
CREATE POLICY "Public Feedback Images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'feedback_images');

CREATE POLICY "Users can upload feedback images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'feedback_images'
  AND auth.role() = 'authenticated'
);

-- 4. Update the RPC to accept image_url
DROP FUNCTION IF EXISTS submit_feedback_and_reward;

CREATE OR REPLACE FUNCTION submit_feedback_and_reward(
  p_user_id UUID,
  p_feedback_type TEXT,
  p_category TEXT,
  p_message TEXT,
  p_rating INTEGER DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_reward INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Determine reward
  v_reward := CASE p_feedback_type
    WHEN 'positive'        THEN 5
    WHEN 'bug_report'      THEN 5
    WHEN 'negative'        THEN 3
    WHEN 'feature_request' THEN 3
    ELSE 3
  END;

  -- Insert feedback
  INSERT INTO platform_feedback (
    user_id, feedback_type, category, message, rating,
    educoin_reward, rewarded_at, image_url
  ) VALUES (
    p_user_id, p_feedback_type, p_category, p_message, p_rating,
    v_reward, NOW(), p_image_url
  );

  -- Grant EduCoins
  SELECT add_educoins(
    p_user_id, v_reward, 'feedback_reward',
    'Platforma haqida fikr uchun mukofot'
  ) INTO v_new_balance;

  RETURN json_build_object(
    'reward', v_reward,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
