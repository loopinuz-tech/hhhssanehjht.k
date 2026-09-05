CREATE OR REPLACE FUNCTION get_auth_email(target_phone TEXT)
RETURNS TEXT AS $$
  SELECT 'tg_' || telegram_chat_id || '@educontest.uz'
  FROM public.profiles
  WHERE phone = target_phone
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
