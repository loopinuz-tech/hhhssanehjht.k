ALTER TABLE educoin_transactions DROP CONSTRAINT IF EXISTS educoin_transactions_type_check;
ALTER TABLE educoin_transactions ADD CONSTRAINT educoin_transactions_type_check CHECK (type IN (
    'daily_login', 
    'streak_bonus',
    'ai_explain',
    'test_purchase',
    'course_purchase',
    'feedback_reward',
    'admin_grant',
    'refund',
    'coin_purchase',
    'purchase'
));
