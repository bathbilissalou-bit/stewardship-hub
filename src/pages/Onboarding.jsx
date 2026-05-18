import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

// Falls back to sessionStorage so Safari private mode still works
function safeSet(key, value) {
  try { localStorage.setItem(key, value) } catch {}
  try { sessionStorage.setItem(key, value) } catch {}
}

const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',           flag: '🇺🇸' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',     flag: '🇨🇦' },
  { code: 'EUR', symbol: '€',   name: 'Euro',                flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',       flag: '🇬🇧' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',      flag: '🇳🇬' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',     flag: '🇰🇪' },
  { code: 'GHS', symbol: '₵',   name: 'Ghanaian Cedi',       flag: '🇬🇭' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA',    flag: '🌍' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand',  flag: '🇿🇦' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',   flag: '🇦🇺' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',        flag: '🇮🇳' },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real',      flag: '🇧🇷' },
]

const GOAL_OPTIONS = [
  { icon: '🏦', storeName: 'Get out of debt',      titleKey: 'onboard_goal_debt_title',      descKey: 'onboard_goal_debt_desc'      },
  { icon: '💰', storeName: 'Build emergency fund', titleKey: 'onboard_goal_emergency_title', descKey: 'onboard_goal_emergency_desc' },
  { icon: '🏠', storeName: 'Buy a home',           titleKey: 'onboard_goal_home_title',      descKey: 'onboard_goal_home_desc'      },
  { icon: '📈', storeName: 'Start investing',      titleKey: 'onboard_goal_invest_title',    descKey: 'onboard_goal_invest_desc'    },
  { icon: '🎁', storeName: 'Give more',            titleKey: 'onboard_goal_give_title',      descKey: 'onboard_goal_give_desc'      },
  { icon: '✈️', storeName: 'Save for a goal',      titleKey: 'onboard_goal_save_title',      descKey: 'onboard_goal_save_desc'      },
]

const noSelect = {
  WebkitUserSelect:        'none',
  userSelect:              'none',
  WebkitTouchCallout:      'none',
  touchAction:             'manipulation',
  WebkitTapHighlightColor: 'transparent',
  cursor:                  'pointer',
}

export default function Onboarding({ session, onComplete }) {
  const tr = useT()

  const STEPS = [
    { icon: '👋', title: tr.onboard_step0_title, desc: tr.onboard_step0_desc, tip: tr.onboard_step0_tip },
    { icon: '💰', title: tr.onboard_step1_title, desc: tr.onboard_step1_desc, tip: tr.onboard_step1_tip },
    { icon: '🌍', title: tr.onboard_step2_title, desc: tr.onboard_step2_desc, tip: tr.onboard_step2_tip },
    { icon: '🎯', title: tr.onboard_step3_title, desc: tr.onboard_step3_desc, tip: tr.onboard_step3_tip },
  ]

  const [step, setStep]         = useState(0)
  const [income, setIncome]     = useState('')
  const [currency, setCurrency] = useState('USD')
  const [goal, setGoal]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  function selectGoal(storeName) {
    setGoal(storeName)
    setError('')
  }

  async function completeOnboarding() {
    safeSet('sh_onboarding_done', 'true')
    safeSet('onboardingDone', 'true')
    if (goal) safeSet('financialGoal', goal)

    const userId = session?.user?.id
    if (userId) {
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Await the critical DB write so the onboarding flag is persisted before navigation
      const { error: upsertError } = await supabase.from('users')
        .upsert({ id: userId, currency, onboarding_done: true }, { onConflict: 'id' })
      if (upsertError) {
        console.error('[Onboarding] users upsert failed:', upsertError)
        setError(`Could not save onboarding (${upsertError.code || upsertError.message}). Please try again or contact support.`)
        setLoading(false)
        return
      }

      if (income && parseFloat(income) > 0) {
        supabase.from('budget_entries').insert({
          user_id: userId, month_year: monthYear, type: 'income',
          label: tr.budget_monthly_income_row || 'Monthly Income',
          amount: parseFloat(income), category: null,
        }).catch(() => {})
      }

      if (goal) {
        supabase.from('savings_goals').insert({
          user_id: userId, name: goal, target_amount: 1000, current_amount: 0,
          icon: GOAL_OPTIONS.find(g => g.storeName === goal)?.icon || '🎯',
          color: '#1D9E75',
        }).catch(() => {})
      }
    }

    if (typeof onComplete === 'function') {
      onComplete()
    } else {
      window.location.href = '/'
    }
  }

  const handleStart = () => {
    if (loading) return
    if (!goal) { setError('Please choose one goal first.'); return }
    setError('')
    setLoading(true)
    completeOnboarding().catch(() => setLoading(false))
  }

  const handleSkip = () => {
    if (loading) return
    setError('')
    setLoading(true)
    completeOnboarding().catch(() => setLoading(false))
  }

  const isLastStep = step === STEPS.length - 1
  const progress   = (step / (STEPS.length - 1)) * 100

  const bullets = [
    { icon: '💳', text: tr.onboard_bullet1 },
    { icon: '📈', text: tr.onboard_bullet2 },
    { icon: '🎁', text: tr.onboard_bullet3 },
    { icon: '🤖', text: tr.onboard_bullet4 },
    { icon: '🌍', text: tr.onboard_bullet5 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F6E56 0%, #1D9E75 40%, #f8fdf9 100%)', padding: '0 0 40px', ...noSelect }}>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.3)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'white', transition: 'width 0.4s ease' }} />
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 0 0' }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i <= step ? 'white' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }} />
        ))}
      </div>

      {/* Header */}
      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16, pointerEvents: 'none' }}>{STEPS[step].icon}</div>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3, pointerEvents: 'none' }}>{STEPS[step].title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, margin: '0 0 8px', lineHeight: 1.6, pointerEvents: 'none' }}>{STEPS[step].desc}</p>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 24, pointerEvents: 'none' }}>
          💡 {STEPS[step].tip}
        </div>
      </div>

      <div style={{ padding: '0 20px', maxWidth: 480, margin: '0 auto' }}>

        {/* Step 0 — motivational hook + feature list */}
        {step === 0 && (
          <>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '14px 18px', marginBottom: 12, textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.95)', lineHeight: 1.7, fontStyle: 'italic' }}>
                "Every great financial turnaround starts with one decision — <strong style={{ color: 'white' }}>not anymore.</strong>"
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                Built for families, leaders, and anyone ready to change their money story.
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 16 }}>
              {bullets.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < bullets.length - 1 ? '1px solid #f3f4f6' : 'none', pointerEvents: 'none' }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{item.text}</span>
                  <span style={{ marginLeft: 'auto', color: '#1D9E75' }}>✓</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step 1 — income */}
        {step === 1 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8, pointerEvents: 'none' }}>{tr.onboard_income_label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '2px solid #1D9E75', borderRadius: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 20, color: '#1D9E75', fontWeight: 700, pointerEvents: 'none' }}>$</span>
              <input
                type="number"
                placeholder={tr.onboard_income_placeholder}
                value={income}
                onChange={e => setIncome(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 24, fontWeight: 700, color: '#1D9E75', background: 'transparent', WebkitAppearance: 'none', userSelect: 'text', WebkitUserSelect: 'text' }}
              />
            </div>
            <div style={{ fontSize: 12, color: '#999', textAlign: 'center', pointerEvents: 'none' }}>{tr.onboard_skip_hint}</div>
          </div>
        )}

        {/* Step 2 — currency */}
        {step === 2 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 16, maxHeight: 340, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CURRENCIES.map(c => (
                <button key={c.code} type="button"
                  onClick={() => setCurrency(c.code)}
                  onTouchEnd={e => { e.preventDefault(); setCurrency(c.code) }}
                  style={{ padding: '12px', borderRadius: 12, border: `2px solid ${currency === c.code ? '#1D9E75' : '#f3f4f6'}`, background: currency === c.code ? '#E1F5EE' : 'white', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, ...noSelect }}>
                  <span style={{ fontSize: 20, pointerEvents: 'none' }}>{c.flag}</span>
                  <div style={{ pointerEvents: 'none' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: currency === c.code ? '#0F6E56' : '#333' }}>{c.symbol} {c.code}</div>
                    <div style={{ fontSize: 10, color: '#999' }}>{c.name}</div>
                  </div>
                  {currency === c.code && <span style={{ marginLeft: 'auto', color: '#1D9E75', fontSize: 16, pointerEvents: 'none' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — goal selection */}
        {step === 3 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 12 }}>
            {GOAL_OPTIONS.map((g, i) => {
              const selected = goal === g.storeName
              return (
                <button key={i} type="button"
                  onClick={() => selectGoal(g.storeName)}
                  onTouchEnd={e => { e.preventDefault(); selectGoal(g.storeName) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 12, border: `2px solid ${selected ? '#1D9E75' : '#f3f4f6'}`, background: selected ? '#E1F5EE' : 'white', marginBottom: 8, textAlign: 'left', minHeight: 64, ...noSelect }}>
                  <span style={{ fontSize: 28, flexShrink: 0, pointerEvents: 'none' }}>{g.icon}</span>
                  <div style={{ flex: 1, pointerEvents: 'none' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: selected ? '#0F6E56' : '#333', marginBottom: 2 }}>{tr[g.titleKey] || g.storeName}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{tr[g.descKey]}</div>
                  </div>
                  <div style={{ width: 24, flexShrink: 0, textAlign: 'center', pointerEvents: 'none' }}>
                    {selected && <span style={{ color: '#1D9E75', fontSize: 18, fontWeight: 700 }}>✓</span>}
                  </div>
                </button>
              )
            })}

            {error ? (
              <div style={{ marginTop: 4, padding: '10px 14px', background: '#FFF3CD', borderRadius: 10, fontSize: 13, color: '#856404', border: '1px solid #FFEEBA', textAlign: 'center', pointerEvents: 'none' }}>
                {error}
              </div>
            ) : null}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button type="button"
              onClick={() => { setStep(s => s - 1); setError('') }}
              onTouchEnd={e => { e.preventDefault(); setStep(s => s - 1); setError('') }}
              style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 12, fontSize: 15, fontWeight: 600, minHeight: 54, ...noSelect }}>
              <span style={{ pointerEvents: 'none' }}>{tr.onboard_back || '← Back'}</span>
            </button>
          )}

          <button type="button"
            disabled={isLastStep && loading}
            onClick={isLastStep ? handleStart : () => setStep(s => s + 1)}
            onTouchEnd={e => { e.preventDefault(); if (isLastStep) handleStart(); else setStep(s => s + 1) }}
            style={{ flex: 2, padding: '16px', background: 'white', color: '#0F6E56', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, minHeight: 54, opacity: isLastStep && loading ? 0.7 : 1, ...noSelect }}>
            <span style={{ pointerEvents: 'none' }}>
              {isLastStep && loading ? '⏳ Saving…' : isLastStep ? (tr.onboard_start_app || '🚀 Start using the app!') : (tr.onboard_continue || 'Continue →')}
            </span>
          </button>
        </div>

        {/* Skip links */}
        {step === 1 && (
          <button type="button"
            onClick={() => setStep(s => s + 1)}
            onTouchEnd={e => { e.preventDefault(); setStep(s => s + 1) }}
            style={{ width: '100%', marginTop: 12, padding: '14px', background: 'transparent', color: 'rgba(255,255,255,0.75)', border: 'none', fontSize: 14, minHeight: 44, ...noSelect }}>
            <span style={{ pointerEvents: 'none' }}>{tr.onboard_skip_now || 'Skip for now →'}</span>
          </button>
        )}
        {step === 3 && (
          <button type="button"
            disabled={loading}
            onClick={handleSkip}
            onTouchEnd={e => { e.preventDefault(); handleSkip() }}
            style={{ width: '100%', marginTop: 12, padding: '14px', background: 'transparent', color: 'rgba(255,255,255,0.75)', border: 'none', fontSize: 14, minHeight: 44, opacity: loading ? 0.5 : 1, ...noSelect }}>
            <span style={{ pointerEvents: 'none' }}>{tr.onboard_skip_now || 'Skip for now →'}</span>
          </button>
        )}

      </div>
    </div>
  )
}
