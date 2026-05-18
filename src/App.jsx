import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { getLang, RTL_LANGS, getLoadingUi } from './lib/i18n-core'
import { hardLocalLogout } from './lib/logout'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/InstallPrompt'

// ── Eagerly loaded (needed immediately for auth flow) ─────────────────────────
import Login          from './pages/Login'
import Signup         from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Welcome        from './pages/Welcome'
import Privacy        from './pages/Privacy'
import Onboarding     from './pages/Onboarding'
import SupabaseDiagnostic from './pages/SupabaseDiagnostic'

// ── Lazy loaded ───────────────────────────────────────────────────────────────
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

function RequireAuth({ session, onboardingDone, lang, setLang }) {
  const location = useLocation()
  console.log('[RequireAuth] session:', !!session, '| onboardingDone:', onboardingDone, '| path:', location.pathname)
  if (!session) {
    const from = `${location.pathname}${location.search || ''}`
    return <Navigate to="/login" replace state={{ from }} />
  }
  if (!onboardingDone) {
    console.log('[RequireAuth] onboardingDone=false → redirecting to /onboarding')
    return <Navigate to="/onboarding" replace />
  }
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

// ─────────────────────────────────────────────────────────────────────────────
// AppRoutes — lives INSIDE BrowserRouter so it can use useNavigate.
// This is critical: navigate() and setOnboardingDone(true) must fire in the
// same component so React batches them before RequireAuth re-renders.
// ─────────────────────────────────────────────────────────────────────────────
function AppRoutes({ session, onboardingDone, setOnboardingDone, isPremium, lang, setLang, theme, setTheme }) {
  const navigate = useNavigate()

  function handleOnboardingComplete() {
    // Write to both localStorage AND sessionStorage — covers Safari private mode
    safeSet('sh_onboarding_done', 'true')
    safeSet('onboardingDone', 'true')
    // Update state and navigate in the same tick so RequireAuth renders correctly
    setOnboardingDone(true)
    navigate('/', { replace: true })
  }

  return (
    <Routes>
      <Route path="/welcome"         element={<Welcome />} />
      <Route path="/privacy"         element={<Privacy />} />
      <Route path="/diagnostics"     element={<SupabaseDiagnostic />} />
      <Route path="/login"           element={<LoginPage session={session} />} />
      <Route path="/signup"          element={<SignupPage session={session} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/onboarding"      element={
        session
          ? <Onboarding session={session} onComplete={handleOnboardingComplete} />
          : <Navigate to="/login" />
      } />

      <Route path="/" element={
        <RequireAuth session={session} onboardingDone={onboardingDone} lang={lang} setLang={setLang} />
      }>
        <Route index                  element={<Dashboard       session={session} lang={lang} />} />
        <Route path="budget"          element={<Budget          session={session} lang={lang} />} />
        <Route path="investments"     element={<Investments     session={session} lang={lang} />} />
        <Route path="loans"           element={<Loans           session={session} lang={lang} />} />
        <Route path="challenge"       element={<Challenge       session={session} lang={lang} />} />
        <Route path="nutrition"       element={<Nutrition       session={session} lang={lang} />} />
        <Route path="faith"           element={<Faith           session={session} lang={lang} />} />
        <Route path="community"       element={<Community       session={session} lang={lang} />} />
        <Route path="birthdays"       element={<Birthdays       session={session} lang={lang} />} />
        <Route path="howtouse"        element={<HowToUse        lang={lang} />} />
        <Route path="report"          element={<BudgetReport    session={session} lang={lang} />} />
        <Route path="settings"        element={<Settings        session={session} isPremium={isPremium} theme={theme} setTheme={setTheme} lang={lang} />} />
        <Route path="savings"         element={<SavingsGoals    session={session} lang={lang} />} />
        <Route path="giving"          element={<Giving          session={session} lang={lang} />} />
        <Route path="bills"           element={<Bills           session={session} lang={lang} />} />
        <Route path="coach"           element={<AICoach         session={session} lang={lang} />} />
        <Route path="premium"         element={<Premium         session={session} isPremium={isPremium} lang={lang} />} />
        <Route path="currency"        element={<CurrencyConverter lang={lang} />} />
        <Route path="receipts"        element={<Receipts        session={session} lang={lang} />} />
        <Route path="travel"          element={<Travel          session={session} lang={lang} />} />
        <Route path="family"          element={<FamilyBudget    session={session} lang={lang} />} />
        <Route path="subscriptions"   element={<Subscriptions   session={session} lang={lang} />} />
        <Route path="networth"        element={<NetWorth        session={session} lang={lang} />} />
        <Route path="debtplanner"     element={<DebtPlanner     session={session} lang={lang} />} />
        <Route path="search"          element={<Search          session={session} lang={lang} />} />
        <Route path="explore"         element={<Explore lang={lang} />} />
      </Route>
    </Routes>
  )
}

// ── Safe storage — falls back to sessionStorage for Safari private mode ──────
// localStorage is wiped by Safari after 7 days of inactivity or in private mode.
// sessionStorage survives the session even when localStorage is unavailable.
function safeGet(key) {
  try { const v = localStorage.getItem(key); if (v !== null) return v } catch {}
  try { return sessionStorage.getItem(key) } catch {}
  return null
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value) } catch {}
  try { sessionStorage.setItem(key, value) } catch {}
}
function readOnboardingDone() {
  return safeGet('sh_onboarding_done') === 'true' || safeGet('onboardingDone') === 'true'
}

// ─────────────────────────────────────────────────────────────────────────────
// App — owns auth state, wraps BrowserRouter.
// Does NOT use useNavigate (can't, because it renders BrowserRouter itself).
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  const [session, setSession]     = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [lang, setLangState]      = useState(getLang())
  const [theme, setThemeState]    = useState(() => { try { return localStorage.getItem('sh_theme') || 'light' } catch { return 'light' } })

  const [onboardingDone, setOnboardingDone] = useState(readOnboardingDone)

  console.log('[App] render — onboardingDone:', onboardingDone, '| session:', !!session, '| loading:', loading)

  const resolvedRef = useRef(false)

  useEffect(() => {
    document.documentElement.dir  = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function setTheme(t) {
    try { localStorage.setItem('sh_theme', t) } catch {}
    setThemeState(t)
  }

  function resolveLoading(sess) {
    if (resolvedRef.current) return
    resolvedRef.current = true
    console.log('[App] resolveLoading — session:', sess?.user?.id ?? 'none')
    setSession(sess ?? null)
    setLoading(false)
  }

  useEffect(() => {
    console.log('[App] mounted — starting auth bootstrap')

    const hardTimeout = setTimeout(() => {
      console.warn('[App] HARD TIMEOUT — forcing render without session')
      resolveLoading(null)
    }, 4000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('[App] onAuthStateChange:', event, sess?.user?.id ?? 'no-user')

      if (event === 'SIGNED_OUT') {
        clearTimeout(hardTimeout)
        setSession(null)
        setOnboardingDone(false)
        return
      }

      if (event === 'INITIAL_SESSION') {
        clearTimeout(hardTimeout)

        // No session — show login immediately, no DB check needed
        if (!sess?.user?.id) {
          resolveLoading(null)
          return
        }

        // Logged-in: if storage already has the flag, trust it and render now
        if (readOnboardingDone()) {
          setOnboardingDone(true)
          resolveLoading(sess)
          return
        }

        // Storage is empty — common after Safari purges localStorage or in private mode.
        // Wait for the DB before rendering so we never wrongly redirect a returning
        // user to /onboarding. Fall back after 2.5 s so the app never hangs.
        const dbGate = setTimeout(() => resolveLoading(sess), 2500)
        supabase
          .from('users').select('onboarding_done').eq('id', sess.user.id).single()
          .then(({ data }) => {
            clearTimeout(dbGate)
            const done = data?.onboarding_done === true
            if (done) { safeSet('sh_onboarding_done', 'true'); safeSet('onboardingDone', 'true') }
            setOnboardingDone(done)
            resolveLoading(sess)
          })
          .catch(() => { clearTimeout(dbGate); resolveLoading(sess) })
        return
      }

      // TOKEN_REFRESHED, USER_UPDATED, etc. — never downgrade onboardingDone
      setSession(sess ?? null)
      if (!sess) setOnboardingDone(false)
    })

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
        <p className="loading-name">{lt.loadingAppName}</p>
        <p className="loading-tagline">{lt.loadingTagline}</p>
      </div>
    )
  }

  return (
    <>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AppRoutes
              session={session}
              onboardingDone={onboardingDone}
              setOnboardingDone={setOnboardingDone}
              isPremium={isPremium}
              lang={lang}
              setLang={setLangState}
              theme={theme}
              setTheme={setTheme}
            />
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      <InstallPrompt />
    </>
  )
}

export default App
