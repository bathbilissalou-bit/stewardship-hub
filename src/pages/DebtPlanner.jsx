import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const SYMBOLS = { USD:'$',EUR:'€',GBP:'£',CAD:'C$',AUD:'A$',NGN:'₦',KES:'KSh',GHS:'₵',ZAR:'R',XOF:'CFA',XAF:'FCFA',INR:'₹',BRL:'R$',MXN:'MX$',CNY:'¥',JPY:'¥',KRW:'₩',RUB:'₽' }
const TYPE_ICONS = { mortgage:'🏠', car:'🚗', student:'🎓', personal:'👤', credit_card:'💳', other:'📋' }
const TYPE_LABELS = { mortgage:'Mortgage', car:'Car Loan', student:'Student Loan', personal:'Personal Loan', credit_card:'Credit Card', other:'Other' }

const fmt  = (n, sym='$') => `${sym}${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}`
const fmtD = (n, sym='$') => `${sym}${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`

function monthsToStr(m) {
  if (!m || m >= 600) return '50+ yrs'
  const yrs = Math.floor(m / 12)
  const mos = m % 12
  if (yrs === 0) return `${mos}mo`
  if (mos === 0) return `${yrs}yr`
  return `${yrs}yr ${mos}mo`
}

function addMonths(n) {
  const d = new Date()
  d.setMonth(d.getMonth() + (n || 0))
  return d.toLocaleDateString('en-US', { month:'short', year:'numeric' })
}

// ── Core simulation ────────────────────────────────────────────────────────────
function simulate(loansInput, extraMonthly, strategy) {
  if (!loansInput.length) return { months:0, totalInterest:0, order:[] }

  let loans = loansInput.map(l => ({
    id:         l.id,
    name:       l.lender_name || TYPE_LABELS[l.loan_type] || 'Loan',
    balance:    Number(l.remaining_balance || l.principal || 0),
    monthlyRate: Number(l.interest_rate || 0) / 12,   // stored as decimal e.g. 0.05
    minPayment: Number(l.monthly_payment || 0),
    paidOffMonth: null,
  }))

  // Sort by strategy
  if (strategy === 'snowball')  loans.sort((a, b) => a.balance - b.balance)
  else                          loans.sort((a, b) => b.monthlyRate - a.monthlyRate)

  let totalInterest = 0
  let months        = 0
  let rollingExtra  = Number(extraMonthly) || 0

  while (loans.some(l => l.balance > 0.01) && months < 600) {
    months++
    // Target = first loan still with balance
    const targetIdx = loans.findIndex(l => l.balance > 0.01)

    for (let i = 0; i < loans.length; i++) {
      if (loans[i].balance <= 0.01) continue

      // Accrue interest
      const interest = loans[i].balance * loans[i].monthlyRate
      totalInterest += interest
      loans[i].balance += interest

      // Payment = min + extra (only to target)
      let payment = loans[i].minPayment + (i === targetIdx ? rollingExtra : 0)
      payment = Math.min(payment, loans[i].balance)
      loans[i].balance -= payment

      // Paid off — roll its minimum into extra
      if (loans[i].balance < 0.01) {
        loans[i].balance = 0
        loans[i].paidOffMonth = months
        rollingExtra += loans[i].minPayment
      }
    }
  }

  return {
    months,
    totalInterest,
    order: loans.map(l => ({ name: l.name, paidOffMonth: l.paidOffMonth })),
  }
}

export default function DebtPlanner({ session }) {
  const userId = session.user.id
  const [symbol,  setSymbol]  = useState('$')
  const [loans,   setLoans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [extra,   setExtra]   = useState('100')
  const [method,  setMethod]  = useState('both') // 'both' | 'snowball' | 'avalanche'

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setSymbol(SYMBOLS[data.currency] || '$') })
    supabase.from('loans').select('*').eq('user_id', userId).eq('status','active')
      .then(({ data }) => { setLoans(data || []); setLoading(false) })
  }, [userId])

  const extraNum   = Math.max(0, parseFloat(extra) || 0)
  const totalDebt  = loans.reduce((s,l) => s + Number(l.remaining_balance || l.principal || 0), 0)
  const totalMin   = loans.reduce((s,l) => s + Number(l.monthly_payment || 0), 0)

  // Without extra
  const baseSnow = simulate(loans, 0, 'snowball')
  const baseAval = simulate(loans, 0, 'avalanche')

  // With extra
  const snow = simulate(loans, extraNum, 'snowball')
  const aval = simulate(loans, extraNum, 'avalanche')

  // Winner
  const avalWins   = aval.totalInterest < snow.totalInterest
  const interestSaved = Math.abs(snow.totalInterest - aval.totalInterest)

  // Chart data — months saved & interest saved per method vs baseline
  const chartData = [
    {
      name: 'No Extra',
      Snowball:  Math.round(baseSnow.totalInterest),
      Avalanche: Math.round(baseAval.totalInterest),
    },
    {
      name: `+${symbol}${extraNum}/mo`,
      Snowball:  Math.round(snow.totalInterest),
      Avalanche: Math.round(aval.totalInterest),
    },
  ]

  if (loading) return (
    <div style={{ paddingTop:60, textAlign:'center' }}>
      <div className="spinner" />
    </div>
  )

  if (loans.length === 0) return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>📉</div>
        <h2 style={{ color:'white', margin:'0 0 2px', fontSize:22, fontWeight:800 }}>Debt Payoff Planner</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>Snowball vs Avalanche calculator</p>
      </div>
      <div style={{ textAlign:'center', padding:'60px 24px' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#1D9E75', marginBottom:8 }}>No active loans!</div>
        <div style={{ fontSize:14, color:'#9ca3af', marginBottom:24 }}>Add loans in the Loans page to use the planner.</div>
        <Link to="/loans">
          <button style={{ padding:'13px 28px', background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer' }}>
            Go to Loans →
          </button>
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ paddingBottom:100 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>📉</div>
        <h2 style={{ color:'white', margin:'0 0 2px', fontSize:22, fontWeight:800 }}>Debt Payoff Planner</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>Snowball vs Avalanche — find your fastest path to debt-free</p>
      </div>

      {/* Debt summary */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'24px 0 16px' }}>
        <div style={{ background:'#FCEBEB', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#A32D2D', fontWeight:600, marginBottom:4 }}>💳 Total Debt</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#A32D2D' }}>{fmt(totalDebt, symbol)}</div>
          <div style={{ fontSize:10, color:'#A32D2D', opacity:0.7, marginTop:2 }}>{loans.length} active loan{loans.length!==1?'s':''}</div>
        </div>
        <div style={{ background:'#f3f4f6', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#5F5E5A', fontWeight:600, marginBottom:4 }}>📅 Min Monthly</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#374151' }}>{fmt(totalMin, symbol)}</div>
          <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>required payments</div>
        </div>
      </div>

      {/* Extra payment slider */}
      <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>⚡ Extra Monthly Payment</div>
        <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>How much extra can you put toward debt each month?</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, padding:'12px 14px', border:'2px solid #A32D2D', borderRadius:12 }}>
            <span style={{ fontSize:18, fontWeight:700, color:'#A32D2D' }}>{symbol}</span>
            <input
              type="number" min="0" step="10" placeholder="100"
              value={extra} onChange={e => setExtra(e.target.value)}
              style={{ flex:1, border:'none', outline:'none', fontSize:22, fontWeight:700, color:'#A32D2D', width:0 }}
            />
          </div>
          <span style={{ fontSize:12, color:'#9ca3af' }}>/ month</span>
        </div>
        {/* Quick presets */}
        <div style={{ display:'flex', gap:6 }}>
          {[50,100,200,500].map(n => (
            <button key={n} onClick={() => setExtra(String(n))}
              style={{ flex:1, padding:'7px 4px', borderRadius:8, border:`1.5px solid ${extraNum===n?'#A32D2D':'#e5e7eb'}`, background:extraNum===n?'#FCEBEB':'white', color:extraNum===n?'#A32D2D':'#6b7280', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              +{symbol}{n}
            </button>
          ))}
        </div>
      </div>

      {/* Results comparison */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {/* Snowball */}
        <div style={{ background: !avalWins ? '#FFF3CD' : 'white', borderRadius:16, padding:'16px', border:`2px solid ${!avalWins?'#BA7517':'#e5e7eb'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#BA7517' }}>❄️ Snowball</div>
            {!avalWins && <div style={{ fontSize:9, fontWeight:700, background:'#BA7517', color:'white', padding:'2px 7px', borderRadius:10 }}>BEST</div>}
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:10, lineHeight:1.5 }}>Lowest balance first. Fast wins, great motivation.</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af' }}>Debt-free in</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#374151' }}>{monthsToStr(snow.months)}</div>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{addMonths(snow.months)}</div>
          </div>
          <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af' }}>Total interest</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#A32D2D' }}>{fmt(snow.totalInterest, symbol)}</div>
          </div>
          {extraNum > 0 && baseSnow.months > snow.months && (
            <div style={{ marginTop:8, background:'#E1F5EE', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#0F6E56', fontWeight:600 }}>
              💚 Save {monthsToStr(baseSnow.months - snow.months)} & {fmt(baseSnow.totalInterest - snow.totalInterest, symbol)}
            </div>
          )}
        </div>

        {/* Avalanche */}
        <div style={{ background: avalWins ? '#FFF3CD' : 'white', borderRadius:16, padding:'16px', border:`2px solid ${avalWins?'#BA7517':'#e5e7eb'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#185FA5' }}>🌊 Avalanche</div>
            {avalWins && <div style={{ fontSize:9, fontWeight:700, background:'#BA7517', color:'white', padding:'2px 7px', borderRadius:10 }}>BEST</div>}
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:10, lineHeight:1.5 }}>Highest interest first. Saves the most money.</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af' }}>Debt-free in</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#374151' }}>{monthsToStr(aval.months)}</div>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{addMonths(aval.months)}</div>
          </div>
          <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af' }}>Total interest</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#A32D2D' }}>{fmt(aval.totalInterest, symbol)}</div>
          </div>
          {extraNum > 0 && baseAval.months > aval.months && (
            <div style={{ marginTop:8, background:'#E1F5EE', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#0F6E56', fontWeight:600 }}>
              💚 Save {monthsToStr(baseAval.months - aval.months)} & {fmt(baseAval.totalInterest - aval.totalInterest, symbol)}
            </div>
          )}
        </div>
      </div>

      {/* Interest comparison tip */}
      {interestSaved > 1 && (
        <div style={{ background: avalWins ? '#EBF4FB' : '#FFF3CD', border:`1px solid ${avalWins?'#185FA5':'#BA7517'}`, borderRadius:12, padding:'12px 14px', marginBottom:16, fontSize:13, color: avalWins?'#185FA5':'#7A4D0F', fontWeight:600 }}>
          {avalWins
            ? `🌊 Avalanche saves you ${fmt(interestSaved, symbol)} more in interest than Snowball.`
            : `❄️ Both methods save similarly — Snowball gives faster psychological wins.`}
        </div>
      )}

      {/* Interest chart */}
      {extraNum > 0 && (
        <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>📊 Interest Paid Comparison</div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:14 }}>With vs without extra {symbol}{extraNum}/mo</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={40}
                tickFormatter={v => `${symbol}${v>=1000?`${(v/1000).toFixed(0)}k`:v}`} />
              <Tooltip formatter={(v, name) => [`${symbol}${Number(v).toLocaleString()}`, name]}
                contentStyle={{ fontSize:11, borderRadius:10, border:'1px solid #e5e7eb' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="Snowball"  fill="#BA7517" radius={[4,4,0,0]} />
              <Bar dataKey="Avalanche" fill="#185FA5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payoff order — Snowball */}
      <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:12, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>❄️ Snowball Payoff Order</div>
        {snow.order.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom: i < snow.order.length-1 ? 10 : 0 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:'#BA751718', border:'2px solid #BA7517', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#BA7517', flexShrink:0 }}>
              {i+1}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{item.name}</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>Paid off {item.paidOffMonth ? addMonths(item.paidOffMonth) : '—'}</div>
            </div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>{monthsToStr(item.paidOffMonth)}</div>
          </div>
        ))}
      </div>

      {/* Payoff order — Avalanche */}
      <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🌊 Avalanche Payoff Order</div>
        {aval.order.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom: i < aval.order.length-1 ? 10 : 0 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:'#185FA518', border:'2px solid #185FA5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#185FA5', flexShrink:0 }}>
              {i+1}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{item.name}</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>Paid off {item.paidOffMonth ? addMonths(item.paidOffMonth) : '—'}</div>
            </div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>{monthsToStr(item.paidOffMonth)}</div>
          </div>
        ))}
      </div>

      {/* Your loans */}
      <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>Your Active Loans</div>
      {loans.map(loan => {
        const bal = Number(loan.remaining_balance || loan.principal || 0)
        const rate = Number(loan.interest_rate || 0) * 100
        return (
          <div key={loan.id} style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #e5e7eb' }}>
            <span style={{ fontSize:22 }}>{TYPE_ICONS[loan.loan_type] || '📋'}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{loan.lender_name || TYPE_LABELS[loan.loan_type]}</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>{rate.toFixed(1)}% APR · {fmtD(loan.monthly_payment, symbol)}/mo min</div>
            </div>
            <div style={{ fontWeight:700, color:'#A32D2D', fontSize:14 }}>{fmt(bal, symbol)}</div>
          </div>
        )
      })}

      <div style={{ marginTop:12, textAlign:'center' }}>
        <Link to="/loans" style={{ fontSize:13, color:'#9ca3af', textDecoration:'none' }}>
          Manage loans → Loans page
        </Link>
      </div>
    </div>
  )
}
