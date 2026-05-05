import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STEPS = [
  {
    icon: '👋',
    title: 'Welcome to Stewardship Hub!',
    desc: 'Your faith-based financial companion. Let\'s set up your account in 3 easy steps.',
    tip: 'This will take less than 2 minutes!'
  },
  {
    icon: '💰',
    title: 'What is your monthly income?',
    desc: 'Enter how much you earn each month. You can always change this later.',
    tip: 'Include all sources: salary, side income, benefits, etc.'
  },
  {
    icon: '🌍',
    title: 'Pick your currency',
    desc: 'Choose the currency you use most. You can change this in Settings anytime.',
    tip: 'We support 18+ currencies including NGN, KES, GHS, CFA and more!'
  },
  {
    icon: '🎯',
    title: 'What is your #1 financial goal?',
    desc: 'Pick the goal that matters most to you right now.',
    tip: 'You can work on multiple goals — just pick the most important one first.'
  },
]

const CURRENCIES = [
  { code:'USD', symbol:'$', name:'US Dollar', flag:'🇺🇸' },
  { code:'CAD', symbol:'C$', name:'Canadian Dollar', flag:'🇨🇦' },
  { code:'EUR', symbol:'€', name:'Euro', flag:'🇪🇺' },
  { code:'GBP', symbol:'£', name:'British Pound', flag:'🇬🇧' },
  { code:'NGN', symbol:'₦', name:'Nigerian Naira', flag:'🇳🇬' },
  { code:'KES', symbol:'KSh', name:'Kenyan Shilling', flag:'🇰🇪' },
  { code:'GHS', symbol:'₵', name:'Ghanaian Cedi', flag:'🇬🇭' },
  { code:'XOF', symbol:'CFA', name:'West African CFA', flag:'🌍' },
  { code:'ZAR', symbol:'R', name:'South African Rand', flag:'🇿🇦' },
  { code:'AUD', symbol:'A$', name:'Australian Dollar', flag:'🇦🇺' },
  { code:'INR', symbol:'₹', name:'Indian Rupee', flag:'🇮🇳' },
  { code:'BRL', symbol:'R$', name:'Brazilian Real', flag:'🇧🇷' },
]

const GOALS = [
  { icon:'🏦', title:'Get out of debt', desc:'Pay off loans and credit cards' },
  { icon:'💰', title:'Build emergency fund', desc:'Save 3-6 months of expenses' },
  { icon:'🏠', title:'Buy a home', desc:'Save for a down payment' },
  { icon:'📈', title:'Start investing', desc:'Grow my wealth over time' },
  { icon:'🎁', title:'Give more', desc:'Increase my tithes and charity' },
  { icon:'✈️', title:'Save for a goal', desc:'Vacation, car, education, etc.' },
]

export default function Onboarding({ session }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [income, setIncome] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [goal, setGoal] = useState('')
  const [saving, setSaving] = useState(false)

  async function finish() {
    setSaving(true)
    try {
      const userId = session.user.id
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

      // Save currency to profile
      await supabase.from('users').upsert({ id: userId, currency }, { onConflict: 'id' })

      // Save income to budget if provided
      if (income && parseFloat(income) > 0) {
        await supabase.from('budget_entries').insert({
          user_id: userId,
          month_year: monthYear,
          type: 'income',
          label: 'Monthly Income',
          amount: parseFloat(income),
          category: null
        })
      }

      // Save goal to savings goals if selected
      if (goal) {
        await supabase.from('savings_goals').insert({
          user_id: userId,
          name: goal,
          target_amount: 1000,
          current_amount: 0,
          icon: GOALS.find(g=>g.title===goal)?.icon || '🎯',
          color: '#1D9E75'
        })
      }

      // Mark onboarding complete
      await supabase.from('users').upsert({ id: userId, onboarding_done: true }, { onConflict: 'id' })
    } catch(e) {
      // Even if something fails, let the user through
    }
    setSaving(false)
    navigate('/')
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg, #0F6E56 0%, #1D9E75 40%, #f8fdf9 100%)', padding:'0 0 40px' }}>
      {/* Progress bar */}
      <div style={{ height:4, background:'rgba(255,255,255,0.3)' }}>
        <div style={{ height:'100%', width:`${progress}%`, background:'white', transition:'width 0.4s ease' }}/>
      </div>

      {/* Step indicator */}
      <div style={{ display:'flex', justifyContent:'center', gap:8, padding:'16px 0 0' }}>
        {STEPS.map((_,i) => (
          <div key={i} style={{ width:i===step?24:8, height:8, borderRadius:4, background:i<=step?'white':'rgba(255,255,255,0.3)', transition:'all 0.3s' }}/>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'24px 24px 0', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{STEPS[step].icon}</div>
        <h1 style={{ color:'white', fontSize:24, fontWeight:800, margin:'0 0 8px', lineHeight:1.3 }}>{STEPS[step].title}</h1>
        <p style={{ color:'rgba(255,255,255,0.85)', fontSize:15, margin:'0 0 8px', lineHeight:1.6 }}>{STEPS[step].desc}</p>
        <div style={{ display:'inline-block', background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'6px 14px', fontSize:12, color:'rgba(255,255,255,0.9)', marginBottom:24 }}>
          💡 {STEPS[step].tip}
        </div>
      </div>

      {/* Step content */}
      <div style={{ padding:'0 20px', maxWidth:480, margin:'0 auto' }}>
        {/* Step 0 - Welcome */}
        {step === 0 && (
          <div style={{ background:'white', borderRadius:20, padding:20, marginBottom:16 }}>
            {[
              { icon:'💳', text:'Track every dollar you spend' },
              { icon:'📈', text:'Grow your investments' },
              { icon:'🎁', text:'Track your tithes & giving' },
              { icon:'🤖', text:'Get AI financial advice' },
              { icon:'🌍', text:'Available in 15 languages' },
            ].map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:i<4?'1px solid #f3f4f6':'none' }}>
                <span style={{ fontSize:24 }}>{item.icon}</span>
                <span style={{ fontSize:14, fontWeight:500 }}>{item.text}</span>
                <span style={{ marginLeft:'auto', color:'#1D9E75' }}>✓</span>
              </div>
            ))}
          </div>
        )}

        {/* Step 1 - Income */}
        {step === 1 && (
          <div style={{ background:'white', borderRadius:20, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:13, color:'#666', marginBottom:8 }}>Monthly income amount</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', border:'2px solid #1D9E75', borderRadius:12, marginBottom:12 }}>
              <span style={{ fontSize:20, color:'#1D9E75', fontWeight:700 }}>$</span>
              <input
                type="number"
                placeholder="e.g. 3000"
                value={income}
                onChange={e => setIncome(e.target.value)}
                style={{ flex:1, border:'none', outline:'none', fontSize:24, fontWeight:700, color:'#1D9E75' }}
                autoFocus
              />
            </div>
            <div style={{ fontSize:12, color:'#999', textAlign:'center' }}>You can skip this and add it later in the Budget section</div>
          </div>
        )}

        {/* Step 2 - Currency */}
        {step === 2 && (
          <div style={{ background:'white', borderRadius:20, padding:16, marginBottom:16, maxHeight:340, overflowY:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => setCurrency(c.code)}
                  style={{ padding:'12px', borderRadius:12, border:`2px solid ${currency===c.code?'#1D9E75':'#f3f4f6'}`, background:currency===c.code?'#E1F5EE':'white', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{c.flag}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:currency===c.code?'#0F6E56':'#333' }}>{c.symbol} {c.code}</div>
                    <div style={{ fontSize:10, color:'#999' }}>{c.name}</div>
                  </div>
                  {currency===c.code && <span style={{ marginLeft:'auto', color:'#1D9E75', fontSize:16 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 - Goal */}
        {step === 3 && (
          <div style={{ background:'white', borderRadius:20, padding:16, marginBottom:16 }}>
            {GOALS.map((g,i) => (
              <button key={i} onClick={() => setGoal(g.title)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:`2px solid ${goal===g.title?'#1D9E75':'#f3f4f6'}`, background:goal===g.title?'#E1F5EE':'white', cursor:'pointer', marginBottom:8, textAlign:'left' }}>
                <span style={{ fontSize:28, flexShrink:0 }}>{g.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:goal===g.title?'#0F6E56':'#333' }}>{g.title}</div>
                  <div style={{ fontSize:12, color:'#999' }}>{g.desc}</div>
                </div>
                {goal===g.title && <span style={{ color:'#1D9E75', fontSize:18 }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display:'flex', gap:10 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s-1)}
              style={{ flex:1, padding:'14px', background:'rgba(255,255,255,0.2)', color:'white', border:'1px solid rgba(255,255,255,0.4)', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer' }}>
              ← Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < STEPS.length - 1) setStep(s => s+1)
              else finish()
            }}
            disabled={saving}
            style={{ flex:2, padding:'14px', background:'white', color:'#0F6E56', border:'none', borderRadius:12, fontSize:16, fontWeight:800, cursor:'pointer' }}>
            {saving ? 'Setting up...' : step === STEPS.length-1 ? '🚀 Start using the app!' : 'Continue →'}
          </button>
        </div>

        {step === 1 && (
          <button onClick={() => setStep(s => s+1)}
            style={{ width:'100%', marginTop:10, padding:'12px', background:'transparent', color:'rgba(255,255,255,0.7)', border:'none', fontSize:14, cursor:'pointer' }}>
            Skip for now →
          </button>
        )}
        {step === 3 && (
          <button onClick={finish}
            style={{ width:'100%', marginTop:10, padding:'12px', background:'transparent', color:'rgba(255,255,255,0.7)', border:'none', fontSize:14, cursor:'pointer' }}>
            Skip for now →
          </button>
        )}
      </div>
    </div>
  )
}
