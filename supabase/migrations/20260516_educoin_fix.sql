-- Boshlang'ich default qiymatni 10 ga o'zgartirish
ALTER TABLE profiles ALTER COLUMN educoin_balance SET DEFAULT 10;

-- Agarda oldin ro'yxatdan o'tib faqatgina boshlang'ich 50 coins olganlar bo'lsa (va umuman ishlatmagan bo'lsa),
-- ularni ham adolatli tarzda 10 ga tushirib qo'yish (ixtiyoriy):
UPDATE profiles 
SET educoin_balance = 10 
WHERE educoin_balance = 50 
AND NOT EXISTS (
  SELECT 1 FROM educoin_transactions 
  WHERE user_id = profiles.user_id
);
