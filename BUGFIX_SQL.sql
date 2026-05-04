-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com → Your Project → SQL Editor → New Query → Paste & Run

-- Fix 1: Store onboarding_done in Supabase (works across all devices)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT FALSE;

-- Fix 2: Track which month a bill was paid (auto-resets each month)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS paid_month TEXT DEFAULT NULL;
