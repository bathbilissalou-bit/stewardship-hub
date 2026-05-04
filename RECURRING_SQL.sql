-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com → Your Project → SQL Editor → New Query → Paste & Run

CREATE TABLE IF NOT EXISTS recurring_templates (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'income',   -- 'income' | 'expense'
  label       TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  category    TEXT DEFAULT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own templates"   ON recurring_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own templates" ON recurring_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own templates" ON recurring_templates FOR DELETE USING (auth.uid() = user_id);
