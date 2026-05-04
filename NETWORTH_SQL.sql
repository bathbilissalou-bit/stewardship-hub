-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com → Your Project → SQL Editor → New Query → Paste & Run

-- 1. Manual assets & liabilities
CREATE TABLE IF NOT EXISTS net_worth_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('asset','liability')),
  name        TEXT NOT NULL,
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  category    TEXT DEFAULT 'Other Asset',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Monthly net worth snapshots (for the trend chart)
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year  TEXT NOT NULL,           -- e.g. '2025-05'
  net_worth   NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- 3. Enable RLS
ALTER TABLE net_worth_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- 4. Policies — net_worth_items
CREATE POLICY "View own items"   ON net_worth_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own items" ON net_worth_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own items" ON net_worth_items FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Update own items" ON net_worth_items FOR UPDATE USING (auth.uid() = user_id);

-- 5. Policies — net_worth_snapshots
CREATE POLICY "View own snapshots"   ON net_worth_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own snapshots" ON net_worth_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Upsert own snapshots" ON net_worth_snapshots FOR UPDATE USING (auth.uid() = user_id);
