import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { getLang, RTL_LANGS } from './lib/i18n'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Loans from './pages/Loans'
import Challenge from './pages/Challenge'
import Investments from './pages/Investments'
import Nutrition from './pages/Nutrition'
import Faith from './pages/Faith'
import Community from './pages/Community'
import HowToUse from './pages/HowToUse'
import BudgetReport from './pages/BudgetReport'
import Settings from './pages/Settings'
import Explore from './pages/Explore'
import SavingsGoals from './pages/SavingsGoals'
import Giving from './pages/Giving'
import Bills from './pages/Bills'
import AICoach from './pages/AICoach'
import Welcome from './pages/Welcome'
import Privacy from './pages/Privacy'
import Premium from './pages/Premium'
import CurrencyConverter from './pages/CurrencyConverter'
import Receipts from './pages/Receipts'
import Travel from './pages/Travel'
import FamilyBudget from './pages/FamilyBudget'
import Onboarding from './pages/Onboarding'
import Birthdays from './pages/Birthdays'
import Subscriptions from './pages/Subscriptions'
import NetWorth from './pages/NetWorth'
import DebtPlanner from './pages/DebtPlanner'
import Search from './pages/Search'
import Layout from './components/Layout'

function App() {
  const [session, setSession] = useState(null)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  // Initialize from localStorage immediately — no async wait needed
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
    // Safety net — never stay stuck on loading screen more than 8 seconds
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
          // localStorage wins — never overwrite a true value with false from DB
          const dbDone = data?.onboarding_done === true
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

    // Listen for language changes
    function handleStorage(e) {
      if (e.key === 'sh_lang') {
        setLangState(e.newValue || 'en')
      }
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
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={session ? <Onboarding session={session} onComplete={() => setOnboardingDone(true)} /> : <Navigate to="/login" />} />
        <Route path="/" element={
          !session
            ? <Navigate to="/login" />
            : !onboardingDone
              ? <Navigate to="/onboarding" />
              : <Layout session={session} lang={lang} setLang={setLangState} />
        }>
          <Route index element={<Dashboard session={session} lang={lang} />} />
          <Route path="budget" element={<Budget session={session} lang={lang} />} />
          <Route path="investments" element={<Investments session={session} lang={lang} />} />
          <Route path="loans" element={<Loans session={session} lang={lang} />} />
          <Route path="challenge" element={<Challenge session={session} lang={lang} />} />
          <Route path="nutrition" element={<Nutrition session={session} />} />
          <Route path="faith" element={<Faith session={session} lang={lang} />} />
          <Route path="community" element={<Community session={session} lang={lang} />} />
          <Route path="birthdays" element={<Birthdays session={session} />} />
          <Route path="howtouse" element={<HowToUse lang={lang} />} />
          <Route path="report" element={<BudgetReport session={session} lang={lang} />} />
          <Route path="settings" element={<Settings session={session} isPremium={isPremium} theme={theme} setTheme={setTheme} />} />
          <Route path="savings" element={<SavingsGoals session={session} />} />
          <Route path="giving" element={<Giving session={session} />} />
          <Route path="bills" element={<Bills session={session} />} />
          <Route path="coach" element={<AICoach session={session} />} />
          <Route path="premium" element={<Premium session={session} isPremium={isPremium} />} />
          <Route path="currency" element={<CurrencyConverter />} />
          <Route path="receipts" element={<Receipts session={session} />} />
          <Route path="travel"   element={<Travel   session={session} />} />
          <Route path="family"        element={<FamilyBudget  session={session} />} />
          <Route path="subscriptions" element={<Subscriptions session={session} />} />
          <Route path="networth"      element={<NetWorth      session={session} />} />
          <Route path="debtplanner"   element={<DebtPlanner   session={session} />} />
          <Route path="search"        element={<Search        session={session} />} />
          <Route path="explore" element={<Explore />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
