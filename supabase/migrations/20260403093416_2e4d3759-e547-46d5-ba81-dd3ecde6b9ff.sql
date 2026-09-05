
-- Telegram auth codes table
CREATE TABLE public.telegram_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  chat_id bigint NOT NULL,
  phone text,
  full_name text,
  avatar_url text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE public.telegram_auth_codes ENABLE ROW LEVEL SECURITY;

-- No public policies - only service_role can access this table

-- Telegram bot state for polling
CREATE TABLE public.telegram_bot_state (
  id int PRIMARY KEY CHECK (id = 1),
  update_offset bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

-- No public policies - only service_role can access

-- Seed the singleton row
INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

-- Index for faster code lookups
CREATE INDEX idx_telegram_auth_codes_code ON public.telegram_auth_codes (code);
CREATE INDEX idx_telegram_auth_codes_chat_id ON public.telegram_auth_codes (chat_id);
