-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com → Your Project → SQL Editor → New Query → Paste & Run

CREATE TABLE IF NOT EXISTS subscriptions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  icon             TEXT DEFAULT '📦',
  amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_cycle    TEXT NOT NULL DEFAULT 'monthly',  -- 'monthly' | 'yearly' | 'weekly'
  category         TEXT DEFAULT 'Other',
  next_billing_date DATE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
