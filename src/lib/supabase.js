import { createClient } from '@supabase/supabase-js'
import { getSupabaseBuildConfig } from './supabase-config'

const { url, anonKey } = getSupabaseBuildConfig()

/**
 * Uses only the anon public key. Never instantiate the service_role key in the browser.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})
