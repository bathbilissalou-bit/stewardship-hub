-- ══════════════════════════════════════════════════════════════
-- NUTRITION FIX — Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- STEP 1: nutrition_profiles table
CREATE TABLE IF NOT EXISTS nutrition_profiles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  gender        TEXT DEFAULT 'male',
  age           INT DEFAULT 25,
  weight_kg     NUMERIC(6,2) DEFAULT 70,
  height_cm     NUMERIC(6,2) DEFAULT 170,
  target_weight NUMERIC(6,2) DEFAULT 65,
  goal          TEXT DEFAULT 'maintenance',
  activity      TEXT DEFAULT 'moderate',
  diet          TEXT DEFAULT 'none',
  country       TEXT DEFAULT 'US',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing table (safe)
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS gender        TEXT DEFAULT 'male';
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS age           INT DEFAULT 25;
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS weight_kg     NUMERIC(6,2) DEFAULT 70;
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS height_cm     NUMERIC(6,2) DEFAULT 170;
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS target_weight NUMERIC(6,2) DEFAULT 65;
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS goal          TEXT DEFAULT 'maintenance';
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS activity      TEXT DEFAULT 'moderate';
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS diet          TEXT DEFAULT 'none';
ALTER TABLE nutrition_profiles ADD COLUMN IF NOT EXISTS country       TEXT DEFAULT 'US';

-- Add UNIQUE constraint on user_id (required for upsert onConflict:'user_id')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='nutrition_profiles' AND constraint_type='UNIQUE'
    AND constraint_name='nutrition_profiles_user_id_key'
  ) THEN
    ALTER TABLE nutrition_profiles ADD CONSTRAINT nutrition_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- RLS
ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own profile"   ON nutrition_profiles;
DROP POLICY IF EXISTS "Insert own profile" ON nutrition_profiles;
DROP POLICY IF EXISTS "Update own profile" ON nutrition_profiles;
CREATE POLICY "View own profile"   ON nutrition_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own profile" ON nutrition_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own profile" ON nutrition_profiles FOR UPDATE USING (auth.uid() = user_id);

-- STEP 2: weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight     NUMERIC(6,2) NOT NULL,
  note       TEXT DEFAULT NULL,
  logged_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE weight_logs ADD COLUMN IF NOT EXISTS weight    NUMERIC(6,2) NOT NULL DEFAULT 0;
ALTER TABLE weight_logs ADD COLUMN IF NOT EXISTS note      TEXT DEFAULT NULL;
ALTER TABLE weight_logs ADD COLUMN IF NOT EXISTS logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- RLS
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own weight logs"   ON weight_logs;
DROP POLICY IF EXISTS "Insert own weight logs" ON weight_logs;
DROP POLICY IF EXISTS "Delete own weight logs" ON weight_logs;
CREATE POLICY "View own weight logs"   ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own weight logs" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own weight logs" ON weight_logs FOR DELETE USING (auth.uid() = user_id);

-- STEP 3: Verify
SELECT 'nutrition_profiles' AS tbl, column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='nutrition_profiles'
UNION ALL
SELECT 'weight_logs', column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='weight_logs'
ORDER BY tbl, column_name;
