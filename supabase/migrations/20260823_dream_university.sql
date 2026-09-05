-- SQL Migration: Add dream_university column to profiles table
-- Run this in your Supabase SQL Editor:

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dream_university JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.dream_university IS 'Stores user target dream university details (name, slug, logo_url, target_score, qs_rank, manzil)';
