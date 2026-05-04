-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com → Your Project → SQL Editor → New Query → Paste & Run

-- 1. Households table
CREATE TABLE IF NOT EXISTS households (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  invite_code  TEXT UNIQUE NOT NULL,
  owner_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Household members
CREATE TABLE IF NOT EXISTS household_members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id  UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  joined_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- 3. Shared income
CREATE TABLE IF NOT EXISTS family_income (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id  UUID REFERENCES households(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  month         INT NOT NULL,
  year          INT NOT NULL,
  added_by      UUID REFERENCES auth.users(id),
  added_by_name TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Shared expenses
CREATE TABLE IF NOT EXISTS family_expenses (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id  UUID REFERENCES households(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  category      TEXT DEFAULT 'Needs',
  month         INT NOT NULL,
  year          INT NOT NULL,
  added_by      UUID REFERENCES auth.users(id),
  added_by_name TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_income     ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_expenses   ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Anyone can look up a household by invite code (to join)
CREATE POLICY "Lookup household by invite code" ON households
  FOR SELECT USING (true);

CREATE POLICY "Create household" ON households
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "View household members" ON household_members
  FOR SELECT USING (true);

CREATE POLICY "Join household" ON household_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own membership" ON household_members
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "View family income" ON family_income
  FOR SELECT USING (true);

CREATE POLICY "Add family income" ON family_income
  FOR INSERT WITH CHECK (added_by = auth.uid());

CREATE POLICY "Delete own family income" ON family_income
  FOR DELETE USING (added_by = auth.uid());

CREATE POLICY "View family expenses" ON family_expenses
  FOR SELECT USING (true);

CREATE POLICY "Add family expenses" ON family_expenses
  FOR INSERT WITH CHECK (added_by = auth.uid());

CREATE POLICY "Delete own family expenses" ON family_expenses
  FOR DELETE USING (added_by = auth.uid());
