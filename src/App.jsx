import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { getLang, RTL_LANGS, getLoadingUi } from './lib/i18n-core'
import { hardLocalLogout } from './lib/logout'
import Layout from './components/Layout'

// ── Eagerly loaded (needed immediately for auth flow) ─────────────────────────
import Login        from './pages/Login'
import Signup       from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Welcome      from './pages/Welcome'
import Privacy      from './pages/Privacy'
import Onboarding   from './pages/Onboarding'
import SupabaseDiagnostic from './pages/SupabaseDiagnostic'

// ── Lazy loaded (only fetched when user navigates to that page) ───────────────
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Budget          = lazy(() => import('./pages/Budget'))
const Loans           = lazy(() => import('./pages/Loans'))
const Challenge       = lazy(() => import('./pages/Challenge'))
const Investments     = lazy(() => import('./pages/Investments'))
const Nutrition       = lazy(() => import('./pages/Nutrition'))
const Faith           = lazy(() => import('./pages/Faith'))
const Community       = lazy(() => import('./pages/Community'))
const HowToUse        = lazy(() => import('./pages/HowToUse'))
const BudgetReport    = lazy(() => import('./pages/BudgetReport'))
const Settings        = lazy(() => import('./pages/Settings'))
const Explore         = lazy(() => import('./pages/Explore'))
const SavingsGoals    = lazy(() => import('./pages/SavingsGoals'))
const Giving          = lazy(() => import('./pages/Giving'))
const Bills           = lazy(() => import('./pages/Bills'))
const AICoach         = lazy(() => import('./pages/AICoach'))
const Premium         = lazy(() => import('./pages/Premium'))
const CurrencyConverter = lazy(() => import('./pages/CurrencyConverter'))
const Receipts        = lazy(() => import('./pages/Receipts'))
const Travel          = lazy(() => import('./pages/Travel'))
const FamilyBudget    = lazy(() => import('./pages/FamilyBudget'))
const Birthdays       = lazy(() => import('./pages/Birthdays'))
const Subscriptions   = lazy(() => import('./pages/Subscriptions'))
const NetWorth        = lazy(() => import('./pages/NetWorth'))
const DebtPlanner     = lazy(() => import('./pages/DebtPlanner'))
const Search          = lazy(() => import('./pages/Search'))

// ── Page-change loading indicator ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:28, animation:'spin 1s linear infinite' }}>✦</div>
    </div>
  )
}

function safeReturnPath(stateFrom) {
  if (typeof stateFrom !== 'string' || !stateFrom.startsWith('/') || stateFrom.startsWith('//')) return '/'
  return stateFrom
}


/** Redirect unauthenticated visitors to login but remember the URL they wanted. */
function RequireAuth({ session, onboardingDone, lang, setLang }) {
  const location = useLocation()
  if (!session) {
    const from = `${location.pathname}${location.search || ''}`
    return <Navigate to="/login" replace state={{ from }} />
  }
  if (!onboardingDone) return <Navigate to="/onboarding" replace />
  return <Layout session={session} lang={lang} setLang={setLang} />
}

function LoginPage({ session }) {
  const location = useLocation()
  if (session) return <Navigate to={safeReturnPath(location.state?.from)} replace />
  return <Login />
}

function SignupPage({ session }) {
  const location = useLocation()
  if (session) return <Navigate to={safeReturnPath(location.state?.from)} replace />
  return <Signup />
}

function App() {
  const [session, setSession]           = useState(null)
  const [isPremium, setIsPremium]       = useState(false)
  const [loading, setLoading]           = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('sh_onboarding_done') === 'true'
  )
  const [lang, setLangState]   = useState(getLang())
  const [theme, setThemeState] = useState(() => localStorage.getItem('sh_theme') || 'light')

  // Track whether we've already resolved loading (prevents double-fire)
  const resolvedRef = useRef(false)

  useEffect(() => {
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function setTheme(t) {
    localStorage.setItem('sh_theme', t)
    setThemeState(t)
  }

  // ── Resolve loading exactly once ─────────────────────────────────────────────
  function resolveLoading(sess) {
    if (resolvedRef.current) return
    resolvedRef.current = true
    console.log('[App] resolveLoading — session:', sess?.user?.id ?? 'none')
    setSession(sess ?? null)
    setLoading(false)
  }

  useEffect(() => {
    console.log('[App] mounted — starting auth bootstrap')

    // HARD TIMEOUT: app MUST render within 4 s no matter what Supabase does.
    // If this fires, we show the login page (safe fallback).
    const hardTimeout = setTimeout(() => {
      console.warn('[App] HARD TIMEOUT — forcing render without session')
      resolveLoading(null)
    }, 4000)

    // ── Subscribe to auth state FIRST ────────────────────────────────────────
    // CRITICAL RULES:
    //  1. Never call supabase.auth.getSession() / refreshSession() from inside this handler
    //     — it re-enters the SDK while it is initialising and can deadlock.
    //  2. Never await DB calls (e.g. users table) inside this handler — fire-and-forget only.
    //  3. The `session` argument already contains the refreshed token (SDK handles it).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('[App] onAuthStateChange:', event, sess?.user?.id ?? 'no-user')

      if (event === 'SIGNED_OUT') {
        clearTimeout(hardTimeout)
        setSession(null)
        setOnboardingDone(false)
        // resolveLoading not needed here (already resolved after INITIAL_SESSION)
        return
      }

      if (event === 'INITIAL_SESSION') {
        clearTimeout(hardTimeout)
        // Use the session the SDK already resolved — do NOT call getSession() again.
        resolveLoading(sess ?? null)

        // Load onboarding from localStorage immediately (synchronous, no hang).
        const localDone = localStorage.getItem('sh_onboarding_done') === 'true'
        setOnboardingDone(localDone)

        // Background DB check — fire-and-forget, does not block rendering.
        if (sess?.user?.id) {
          supabase
            .from('users')
            .select('onboarding_done')
            .eq('id', sess.user.id)
            .single()
            .then(({ data }) => {
              const dbDone = data?.onboarding_done === true
              if (dbDone) {
                localStorage.setItem('sh_onboarding_done', 'true')
                setOnboardingDone(true)
              }
            })
            .catch(() => { /* offline / network error — local value already applied */ })
        }
        return
      }

      // TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, etc.
      // Just sync the session; SDK already refreshed the token.
      setSession(sess ?? null)
      if (!sess) setOnboardingDone(false)
    })

    // Language sync across tabs
    function handleStorage(e) {
      if (e.key === 'sh_lang') setLangState(e.newValue || 'en')
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      clearTimeout(hardTimeout)
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  if (loading) {
    const lt = getLoadingUi(lang)
    return (
      <div className="loading-screen">
        <div className="loading-logo">✦</div>
        <p>{lt.loadingAppName}</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/welcome"         element={<Welcome />} />
          <Route path="/privacy"         element={<Privacy />} />
          <Route path="/diagnostics"     element={<SupabaseDiagnostic />} />
          <Route path="/login"           element={<LoginPage session={session} />} />
          <Route path="/signup"          element={<SignupPage session={session} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding"      element={
            session
              ? <Onboarding session={session} onComplete={() => setOnboardingDone(true)} />
              : <Navigate to="/login" />
          } />

          <Route path="/" element={
            <RequireAuth session={session} onboardingDone={onboardingDone} lang={lang} setLang={setLangState} />
          }>
            <Route index                  element={<Dashboard       session={session} lang={lang} />} />
            <Route path="budget"          element={<Budget          session={session} lang={lang} />} />
            <Route path="investments"     element={<Investments     session={session} lang={lang} />} />
            <Route path="loans"           element={<Loans           session={session} lang={lang} />} />
            <Route path="challenge"       element={<Challenge       session={session} lang={lang} />} />
            <Route path="nutrition"       element={<Nutrition       session={session} />} />
            <Route path="faith"           element={<Faith           session={session} lang={lang} />} />
            <Route path="community"       element={<Community       session={session} lang={lang} />} />
            <Route path="birthdays"       element={<Birthdays       session={session} />} />
            <Route path="howtouse"        element={<HowToUse        lang={lang} />} />
            <Route path="report"          element={<BudgetReport    session={session} lang={lang} />} />
            <Route path="settings"        element={<Settings        session={session} isPremium={isPremium} theme={theme} setTheme={setTheme} />} />
            <Route path="savings"         element={<SavingsGoals    session={session} />} />
            <Route path="giving"          element={<Giving          session={session} />} />
            <Route path="bills"           element={<Bills           session={session} />} />
            <Route path="coach"           element={<AICoach         session={session} />} />
            <Route path="premium"         element={<Premium         session={session} isPremium={isPremium} />} />
            <Route path="currency"        element={<CurrencyConverter />} />
            <Route path="receipts"        element={<Receipts        session={session} />} />
            <Route path="travel"          element={<Travel          session={session} />} />
            <Route path="family"          element={<FamilyBudget    session={session} />} />
            <Route path="subscriptions"   element={<Subscriptions   session={session} />} />
            <Route path="networth"        element={<NetWorth        session={session} />} />
            <Route path="debtplanner"     element={<DebtPlanner     session={session} />} />
            <Route path="search"          element={<Search          session={session} />} />
            <Route path="explore"         element={<Explore lang={lang} />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
