-- ══════════════════════════════════════════════════════════════
-- BUDGET FIX — Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- STEP 1: Create budget_entries table (if it doesn't exist at all)
CREATE TABLE IF NOT EXISTS budget_entries (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year  TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'expense',
  category    TEXT DEFAULT NULL,
  label       TEXT NOT NULL DEFAULT '',
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes       TEXT DEFAULT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Add any missing columns to existing table (safe — won't break existing data)
ALTER TABLE budget_entries ADD COLUMN IF NOT EXISTS month_year  TEXT NOT NULL DEFAULT '';
ALTER TABLE budget_entries ADD COLUMN IF NOT EXISTS type        TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE budget_entries ADD COLUMN IF NOT EXISTS category    TEXT DEFAULT NULL;
ALTER TABLE budget_entries ADD COLUMN IF NOT EXISTS label       TEXT NOT NULL DEFAULT '';
ALTER TABLE budget_entries ADD COLUMN IF NOT EXISTS amount      NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE budget_entries ADD COLUMN IF NOT EXISTS notes       TEXT DEFAULT NULL;
ALTER TABLE budget_entries ADD COLUMN IF NOT EXISTS user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- STEP 3: Enable RLS
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop old policies (if any) and recreate them cleanly
DROP POLICY IF EXISTS "Users can view own budget entries"   ON budget_entries;
DROP POLICY IF EXISTS "Users can insert own budget entries" ON budget_entries;
DROP POLICY IF EXISTS "Users can update own budget entries" ON budget_entries;
DROP POLICY IF EXISTS "Users can delete own budget entries" ON budget_entries;
DROP POLICY IF EXISTS "View own budget entries"   ON budget_entries;
DROP POLICY IF EXISTS "Insert own budget entries" ON budget_entries;
DROP POLICY IF EXISTS "Update own budget entries" ON budget_entries;
DROP POLICY IF EXISTS "Delete own budget entries" ON budget_entries;

CREATE POLICY "View own budget entries"
  ON budget_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Insert own budget entries"
  ON budget_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own budget entries"
  ON budget_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Delete own budget entries"
  ON budget_entries FOR DELETE
  USING (auth.uid() = user_id);

-- STEP 5: Also fix recurring_templates table
CREATE TABLE IF NOT EXISTS recurring_templates (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'income',
  label       TEXT NOT NULL DEFAULT '',
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  category    TEXT DEFAULT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View own templates"   ON recurring_templates;
DROP POLICY IF EXISTS "Insert own templates" ON recurring_templates;
DROP POLICY IF EXISTS "Update own templates" ON recurring_templates;
DROP POLICY IF EXISTS "Delete own templates" ON recurring_templates;

CREATE POLICY "View own templates"   ON recurring_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own templates" ON recurring_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own templates" ON recurring_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own templates" ON recurring_templates FOR DELETE USING (auth.uid() = user_id);

-- STEP 6: Verify — show all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'budget_entries'
ORDER BY ordinal_position;
