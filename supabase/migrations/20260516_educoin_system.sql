-- ============================================================
-- EDUCOIN SYSTEM — Full SQL Migration
-- 20 EduCoin = 2,000 UZS
-- ============================================================

-- 1. EduCoin balance column on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS educoin_balance INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS last_active_date DATE,
  ADD COLUMN IF NOT EXISTS login_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_streaks INTEGER NOT NULL DEFAULT 0;

-- 2. EduCoin transactions log
CREATE TABLE IF NOT EXISTS educoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                    -- positive = earned, negative = spent
  type TEXT NOT NULL CHECK (type IN (
    'daily_login',      -- kunlik kirish mukofoti
    'streak_bonus',     -- ketma-ket kunlik bonus
    'ai_explain',       -- AI tushuntirish (−1)
    'test_purchase',    -- test sotib olish
    'course_purchase',  -- kurs sotib olish
    'feedback_reward',  -- fikr uchun mukofot
    'admin_grant',      -- admin tomonidan berilgan
    'refund'            -- qaytarilgan
  )),
  description TEXT,
  reference_id UUID,                          -- test_id, course_id va h.k.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daily streak milestones config
CREATE TABLE IF NOT EXISTS streak_milestones (
  id SERIAL PRIMARY KEY,
  streak_days INTEGER NOT NULL UNIQUE,        -- 7, 14, 20, 30, 90
  bonus_coins INTEGER NOT NULL,
  badge_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert milestone configs
INSERT INTO streak_milestones (streak_days, bonus_coins, badge_name) VALUES
  (7,  20,  'Haftalik Sabot'),
  (14, 40,  'Ikki Haftali Qahramon'),
  (20, 60,  'Yigirma Kun Ustozi'),
  (30, 100, 'Oylik Champion'),
  (90, 350, 'Chorak Yil Afsonasi')
ON CONFLICT (streak_days) DO NOTHING;

-- 4. Platform feedback table
CREATE TABLE IF NOT EXISTS platform_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'positive',         -- Ijobiy fikr       → +5 EduCoin
    'negative',         -- Salbiy fikr        → +3 EduCoin
    'bug_report',       -- Xatolik topdi      → +5 EduCoin
    'feature_request',  -- Qo'shimcha taklif  → +3 EduCoin
    'general'           -- Umumiy fikr        → +3 EduCoin
  )),
  category TEXT CHECK (category IN (
    'ui_ux',
    'content',
    'performance',
    'bug',
    'payment',
    'other'
  )),
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  educoin_reward INTEGER NOT NULL DEFAULT 0,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Test folders — add educoin_price column
ALTER TABLE test_folders
  ADD COLUMN IF NOT EXISTS educoin_price INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'free'
    CHECK (payment_type IN ('free', 'uzs', 'educoin', 'both'));

-- 6. Courses — add educoin_price column
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS educoin_price INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'free'
    CHECK (payment_type IN ('free', 'uzs', 'educoin', 'both'));

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Add/Remove EduCoins (atomic)
CREATE OR REPLACE FUNCTION add_educoins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Update balance (never below 0)
  UPDATE profiles
  SET educoin_balance = GREATEST(0, educoin_balance + p_amount)
  WHERE user_id = p_user_id
  RETURNING educoin_balance INTO new_balance;

  -- Log transaction
  INSERT INTO educoin_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Daily login check & streak update
CREATE OR REPLACE FUNCTION process_daily_login(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_last_date DATE;
  v_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_coins_earned INTEGER := 0;
  v_streak_bonus INTEGER := 0;
  v_milestone TEXT := NULL;
  v_already_claimed BOOLEAN := false;
BEGIN
  SELECT last_active_date, login_streak
  INTO v_last_date, v_streak
  FROM profiles
  WHERE user_id = p_user_id;

  -- Already claimed today
  IF v_last_date = v_today THEN
    v_already_claimed := true;
    RETURN json_build_object(
      'already_claimed', true,
      'streak', v_streak,
      'coins_earned', 0
    );
  END IF;

  -- Streak logic
  IF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    v_streak := v_streak + 1;
  ELSE
    -- Streak broken or first time
    v_streak := 1;
  END IF;

  -- Base daily reward: 3 EduCoins
  v_coins_earned := 3;

  -- Check streak milestones
  SELECT bonus_coins, badge_name
  INTO v_streak_bonus, v_milestone
  FROM streak_milestones
  WHERE streak_days = v_streak;

  IF v_streak_bonus > 0 THEN
    v_coins_earned := v_coins_earned + v_streak_bonus;
  END IF;

  -- Streak multiplier (every 7 days = +2 bonus)
  IF v_streak > 1 AND v_streak % 7 = 0 AND v_milestone IS NULL THEN
    v_coins_earned := v_coins_earned + 2;
  END IF;

  -- Update profile
  UPDATE profiles
  SET
    last_active_date = v_today,
    login_streak = v_streak,
    total_streaks = total_streaks + 1,
    educoin_balance = educoin_balance + v_coins_earned
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO educoin_transactions (user_id, amount, type, description)
  VALUES (
    p_user_id,
    v_coins_earned,
    CASE WHEN v_milestone IS NOT NULL THEN 'streak_bonus' ELSE 'daily_login' END,
    CASE
      WHEN v_milestone IS NOT NULL THEN v_streak || ' kunlik streak: ' || v_milestone
      ELSE v_streak || ' kunlik ketma-ket kirish'
    END
  );

  RETURN json_build_object(
    'already_claimed', false,
    'streak', v_streak,
    'coins_earned', v_coins_earned,
    'milestone', v_milestone,
    'streak_bonus', v_streak_bonus
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Submit feedback & reward EduCoins
CREATE OR REPLACE FUNCTION submit_feedback_and_reward(
  p_user_id UUID,
  p_feedback_type TEXT,
  p_category TEXT,
  p_message TEXT,
  p_rating INTEGER DEFAULT NULL
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
    educoin_reward, rewarded_at
  ) VALUES (
    p_user_id, p_feedback_type, p_category, p_message, p_rating,
    v_reward, NOW()
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

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_educoin_tx_user ON educoin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON platform_feedback(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE educoin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;

-- EduCoin transactions: user only sees own
CREATE POLICY "user_own_transactions" ON educoin_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Feedback: user only sees own
CREATE POLICY "user_own_feedback" ON platform_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_insert_feedback" ON platform_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Streak milestones: everyone can read
CREATE POLICY "public_read_milestones" ON streak_milestones
  FOR SELECT USING (true);

-- Admin sees everything
CREATE POLICY "admin_all_transactions" ON educoin_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_all_feedback" ON platform_feedback
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SAMPLE: Update existing test categories to use educoin prices
-- Uncomment and adjust as needed:
-- ============================================================
-- UPDATE test_folders SET educoin_price = 5, payment_type = 'both' WHERE category = 'mavzulashtirilgan';
-- UPDATE test_folders SET educoin_price = 20, payment_type = 'both' WHERE category = 'attestatsiya';
-- UPDATE test_folders SET educoin_price = 10, payment_type = 'both' WHERE category = 'pedagogik';
