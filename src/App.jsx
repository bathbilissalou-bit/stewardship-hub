import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { getLang, RTL_LANGS } from './lib/i18n-core'
import Layout from './components/Layout'

// ── Eagerly loaded (needed immediately for auth flow) ─────────────────────────
import Login        from './pages/Login'
import Signup       from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Welcome      from './pages/Welcome'
import Privacy      from './pages/Privacy'
import Onboarding   from './pages/Onboarding'

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

// ── Page-change loading indicator (tiny spinner between lazy page loads) ──────
function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:28, animation:'spin 1s linear infinite' }}>✦</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('sh_onboarding_done') === 'true'
  )
  const [lang, setLangState] = useState(getLang())
  const [theme, setThemeState] = useState(() => localStorage.getItem('sh_theme') || 'light')

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

  useEffect(() => {
    const safetyTimeout = setTimeout(() => setLoading(false), 8000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session)
        if (session?.user?.id) {
          const { data } = await supabase
            .from('users')
            .select('onboarding_done')
            .eq('id', session.user.id)
            .single()
          const dbDone = data?.onboarding_done === true
          const localDone = localStorage.getItem('sh_onboarding_done') === 'true'
          setOnboardingDone(dbDone || localDone)
          if (dbDone) localStorage.setItem('sh_onboarding_done', 'true')
        }
      } catch(_) {}
      clearTimeout(safetyTimeout)
      setLoading(false)
    }).catch(() => {
      clearTimeout(safetyTimeout)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session)
        if (session?.user?.id) {
          const local = localStorage.getItem('sh_onboarding_done') === 'true'
          const { data } = await supabase
            .from('users')
            .select('onboarding_done')
            .eq('id', session.user.id)
            .single()
          const dbDone = data?.onboarding_done === true
          setOnboardingDone(dbDone || local)
          if (dbDone) localStorage.setItem('sh_onboarding_done', 'true')
        } else {
          setOnboardingDone(false)
        }
      } catch(_) {}
    })

    function handleStorage(e) {
      if (e.key === 'sh_lang') setLangState(e.newValue || 'en')
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">✦</div>
        <p>Stewardship Hub</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/welcome"        element={<Welcome />} />
          <Route path="/privacy"        element={<Privacy />} />
          <Route path="/login"          element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup"         element={!session ? <Signup /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding"     element={
            session
              ? <Onboarding session={session} onComplete={() => setOnboardingDone(true)} />
              : <Navigate to="/login" />
          } />

          <Route path="/" element={
            !session
              ? <Navigate to="/login" />
              : !onboardingDone
                ? <Navigate to="/onboarding" />
                : <Layout session={session} lang={lang} setLang={setLangState} />
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
            <Route path="explore"         element={<Explore />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
