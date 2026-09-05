
-- Add disqualification tracking to Olympiad Registrations
ALTER TABLE public.olympiad_registrations ADD COLUMN IF NOT EXISTS is_disqualified BOOLEAN DEFAULT false;
ALTER TABLE public.olympiad_registrations ADD COLUMN IF NOT EXISTS disqualification_reason TEXT;

-- Index for performance on leaderboard and disqualification lists
CREATE INDEX IF NOT EXISTS idx_olympiad_registrations_status ON public.olympiad_registrations(olympiad_id, is_disqualified, is_hidden);
