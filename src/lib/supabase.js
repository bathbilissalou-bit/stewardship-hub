import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mukccbbpayuyynmlkcia.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a2NjYmJwYXl1eXlubWxrY2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTM1ODQsImV4cCI6MjA5MjEyOTU4NH0.vdv_7r0bZ-QjeHgFnR0QXhtl4OpSek17l0E9MzGrQOc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
