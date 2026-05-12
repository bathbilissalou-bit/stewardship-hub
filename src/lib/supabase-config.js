/**
 * Resolved at build time (Vite replaces import.meta.env.*).
 * Vercel: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY for Production (+ Preview if needed).
 * EXPO_PUBLIC_* fallbacks exist only if tooling shares the same vars.
 */
const FALLBACK_URL = 'https://mukccbbpayuyynmlkcia.supabase.co'
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a2NjYmJwYXl1eXlubWxrY2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTM1ODQsImV4cCI6MjA5MjEyOTU4NH0.vdv_7r0bZ-QjeHgFnR0QXhtl4OpSek17l0E9MzGrQOc'

function trimEnv(v) {
  if (v == null || v === '') return ''
  const s = String(v).trim()
  return s
}

export function getSupabaseBuildConfig() {
  const viteUrl = trimEnv(import.meta.env.VITE_SUPABASE_URL)
  const expoUrl = trimEnv(import.meta.env.EXPO_PUBLIC_SUPABASE_URL)
  const viteKey = trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)
  const expoKey = trimEnv(import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)

  const url = viteUrl || expoUrl || FALLBACK_URL
  const anonKey = viteKey || expoKey || FALLBACK_ANON_KEY

  return {
    url,
    anonKey,
    usingFallbackUrl: !(viteUrl || expoUrl),
    usingFallbackKey: !(viteKey || expoKey),
    envPresent: {
      VITE_SUPABASE_URL: !!viteUrl,
      EXPO_PUBLIC_SUPABASE_URL: !!expoUrl,
      VITE_SUPABASE_ANON_KEY: !!viteKey,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: !!expoKey,
    },
    mode: import.meta.env.MODE,
  }
}
