import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA', flag: '🌍' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
]

/** Canonical English names stored in DB / matched on finish (stable across locales). */
const GOAL_OPTIONS = [
  { icon: '🏦', storeName: 'Get out of debt', titleKey: 'onboard_goal_debt_title', descKey: 'onboard_goal_debt_desc' },
  { icon: '💰', storeName: 'Build emergency fund', titleKey: 'onboard_goal_emergency_title', descKey: 'onboard_goal_emergency_desc' },
  { icon: '🏠', storeName: 'Buy a home', titleKey: 'onboard_goal_home_title', descKey: 'onboard_goal_home_desc' },
  { icon: '📈', storeName: 'Start investing', titleKey: 'onboard_goal_invest_title', descKey: 'onboard_goal_invest_desc' },
  { icon: '🎁', storeName: 'Give more', titleKey: 'onboard_goal_give_title', descKey: 'onboard_goal_give_desc' },
  { icon: '✈️', storeName: 'Save for a goal', titleKey: 'onboard_goal_save_title', descKey: 'onboard_goal_save_desc' },
]

export default function Onboarding({ session }) {
  const tr = useT()
  const STEPS = [
    { icon: '👋', title: tr.onboard_step0_title, desc: tr.onboard_step0_desc, tip: tr.onboard_step0_tip },
    { icon: '💰', title: tr.onboard_step1_title, desc: tr.onboard_step1_desc, tip: tr.onboard_step1_tip },
    { icon: '🌍', title: tr.onboard_step2_title, desc: tr.onboard_step2_desc, tip: tr.onboard_step2_tip },
    { icon: '🎯', title: tr.onboard_step3_title, desc: tr.onboard_step3_desc, tip: tr.onboard_step3_tip },
  ]

  const [step, setStep] = useState(0)
  const [income, setIncome] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [goal, setGoal] = useState('')

  function finish() {
    try { localStorage.setItem('sh_onboarding_done', 'true') } catch {}

    const userId = session?.user?.id
    if (userId) {
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      supabase.from('users')
        .upsert({ id: userId, currency, onboarding_done: true }, { onConflict: 'id' })
        .catch(() => {})

      if (income && parseFloat(income) > 0) {
        supabase.from('budget_entries').insert({
          user_id: userId,
          month_year: monthYear,
          type: 'income',
          label: tr.budget_monthly_income_row || 'Monthly Income',
          amount: parseFloat(income),
          category: null,
        }).catch(() => {})
      }

      if (goal) {
        supabase.from('savings_goals').insert({
          user_id: userId,
          name: goal,
          target_amount: 1000,
          current_amount: 0,
          icon: GOAL_OPTIONS.find(g => g.storeName === goal)?.icon || '🎯',
          color: '#1D9E75',
        }).catch(() => {})
      }
    }

    window.location.replace('/')
  }

  const progress = (step / (STEPS.length - 1)) * 100

  const bullets = [
    { icon: '💳', text: tr.onboard_bullet1 },
    { icon: '📈', text: tr.onboard_bullet2 },
    { icon: '🎁', text: tr.onboard_bullet3 },
    { icon: '🤖', text: tr.onboard_bullet4 },
    { icon: '🌍', text: tr.onboard_bullet5 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0F6E56 0%, #1D9E75 40%, #f8fdf9 100%)', padding: '0 0 40px' }}>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.3)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'white', transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 0 0' }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i <= step ? 'white' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }} />
        ))}
      </div>

      <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{STEPS[step].icon}</div>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3 }}>{STEPS[step].title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, margin: '0 0 8px', lineHeight: 1.6 }}>{STEPS[step].desc}</p>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 24 }}>
          💡 {STEPS[step].tip}
        </div>
      </div>

      <div style={{ padding: '0 20px', maxWidth: 480, margin: '0 auto' }}>
        {step === 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            {bullets.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{item.text}</span>
                <span style={{ marginLeft: 'auto', color: '#1D9E75' }}>✓</span>
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{tr.onboard_income_label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '2px solid #1D9E75', borderRadius: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 20, color: '#1D9E75', fontWeight: 700 }}>$</span>
              <input
                type="number"
                placeholder={tr.onboard_income_placeholder}
                value={income}
                onChange={e => setIncome(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 24, fontWeight: 700, color: '#1D9E75' }}
                autoFocus
              />
            </div>
            <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>{tr.onboard_skip_hint}</div>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 16, maxHeight: 340, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CURRENCIES.map(c => (
                <button key={c.code} type="button" onClick={() => setCurrency(c.code)}
                  style={{ padding: '12px', borderRadius: 12, border: `2px solid ${currency === c.code ? '#1D9E75' : '#f3f4f6'}`, background: currency === c.code ? '#E1F5EE' : 'white', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{c.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: currency === c.code ? '#0F6E56' : '#333' }}>{c.symbol} {c.code}</div>
                    <div style={{ fontSize: 10, color: '#999' }}>{c.name}</div>
                  </div>
                  {currency === c.code && <span style={{ marginLeft: 'auto', color: '#1D9E75', fontSize: 16 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 16 }}>
            {GOAL_OPTIONS.map((g, i) => (
              <button key={i} type="button" onClick={() => setGoal(g.storeName)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${goal === g.storeName ? '#1D9E75' : '#f3f4f6'}`, background: goal === g.storeName ? '#E1F5EE' : 'white', cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: goal === g.storeName ? '#0F6E56' : '#333' }}>{tr[g.titleKey]}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{tr[g.descKey]}</div>
                </div>
                {goal === g.storeName && <span style={{ color: '#1D9E75', fontSize: 18 }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {tr.onboard_back}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (step < STEPS.length - 1) setStep(s => s + 1)
              else finish()
            }}
            style={{ flex: 2, padding: '14px', background: 'white', color: '#0F6E56', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
            {step === STEPS.length - 1 ? tr.onboard_start_app : tr.onboard_continue}
          </button>
        </div>

        {step === 1 && (
          <button type="button" onClick={() => setStep(s => s + 1)}
            style={{ width: '100%', marginTop: 10, padding: '12px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontSize: 14, cursor: 'pointer' }}>
            {tr.onboard_skip_now}
          </button>
        )}
        {step === 3 && (
          <button type="button" onClick={finish}
            style={{ width: '100%', marginTop: 10, padding: '12px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', fontSize: 14, cursor: 'pointer' }}>
            {tr.onboard_skip_now}
          </button>
        )}
      </div>
    </div>
  )
}
