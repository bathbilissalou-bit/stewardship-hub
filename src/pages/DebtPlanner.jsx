import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT, interpolate, getLang, LANG_LOCALES } from '../lib/i18n'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const SYMBOLS = { USD:'$',EUR:'€',GBP:'£',CAD:'C$',AUD:'A$',NGN:'₦',KES:'KSh',GHS:'₵',ZAR:'R',XOF:'CFA',XAF:'FCFA',INR:'₹',BRL:'R$',MXN:'MX$',CNY:'¥',JPY:'¥',KRW:'₩',RUB:'₽' }
const TYPE_ICONS = { mortgage:'🏠', car:'🚗', student:'🎓', personal:'👤', credit_card:'💳', other:'📋' }

function loanDisplayName(l, tr) {
  const raw = String(l.loan_type || 'other').replace(/[^a-z0-9_]/gi, '')
  const k = `debt_type_${raw}`
  return l.lender_name || tr[k] || tr.debt_loan_fallback
}

// ── Core simulation ────────────────────────────────────────────────────────────
function simulate(loansInput, extraMonthly, strategy, tr) {
  if (!loansInput.length) return { months:0, totalInterest:0, order:[] }

  let loans = loansInput.map(l => ({
    id:         l.id,
    name:       loanDisplayName(l, tr),
    balance:    Number(l.remaining_balance || l.principal || 0),
    monthlyRate: Number(l.interest_rate || 0) / 12,
    minPayment: Number(l.monthly_payment || 0),
    paidOffMonth: null,
  }))

  if (strategy === 'snowball')  loans.sort((a, b) => a.balance - b.balance)
  else                          loans.sort((a, b) => b.monthlyRate - a.monthlyRate)

  let totalInterest = 0
  let months        = 0
  let rollingExtra  = Number(extraMonthly) || 0

  while (loans.some(l => l.balance > 0.01) && months < 600) {
    months++
    const targetIdx = loans.findIndex(l => l.balance > 0.01)

    for (let i = 0; i < loans.length; i++) {
      if (loans[i].balance <= 0.01) continue

      const interest = loans[i].balance * loans[i].monthlyRate
      totalInterest += interest
      loans[i].balance += interest

      let payment = loans[i].minPayment + (i === targetIdx ? rollingExtra : 0)
      payment = Math.min(payment, loans[i].balance)
      loans[i].balance -= payment

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
  const tr = useT()
  const loc = LANG_LOCALES[getLang()] || 'en-US'
  const userId = session.user.id
  const [symbol,  setSymbol]  = useState('$')
  const [loans,   setLoans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [extra,   setExtra]   = useState('100')

  const fmt  = (n, sym='$') => `${sym}${Number(n||0).toLocaleString(loc,{minimumFractionDigits:0,maximumFractionDigits:0})}`
  const fmtD = (n, sym='$') => `${sym}${Number(n||0).toLocaleString(loc,{minimumFractionDigits:2,maximumFractionDigits:2})}`

  function monthsToStr(m) {
    if (!m || m >= 600) return tr.debt_months_long
    const yrs = Math.floor(m / 12)
    const mos = m % 12
    if (yrs === 0) return interpolate(tr.debt_months_mo, { n: mos })
    if (mos === 0) return interpolate(tr.debt_months_yr, { n: yrs })
    return interpolate(tr.debt_months_yr_mo, { y: yrs, m: mos })
  }

  function addMonthsLabel(n) {
    const d = new Date()
    d.setMonth(d.getMonth() + (n || 0))
    return d.toLocaleDateString(loc, { month:'short', year:'numeric' })
  }

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setSymbol(SYMBOLS[data.currency] || '$') })
    supabase.from('loans').select('*').eq('user_id', userId).eq('status','active')
      .then(({ data }) => { setLoans(data || []); setLoading(false) })
  }, [userId])

  const extraNum   = Math.max(0, parseFloat(extra) || 0)
  const totalDebt  = loans.reduce((s,l) => s + Number(l.remaining_balance || l.principal || 0), 0)
  const totalMin   = loans.reduce((s,l) => s + Number(l.monthly_payment || 0), 0)

  const baseSnow = useMemo(() => simulate(loans, 0, 'snowball', tr), [loans, tr])
  const baseAval = useMemo(() => simulate(loans, 0, 'avalanche', tr), [loans, tr])
  const snow = useMemo(() => simulate(loans, extraNum, 'snowball', tr), [loans, extraNum, tr])
  const aval = useMemo(() => simulate(loans, extraNum, 'avalanche', tr), [loans, extraNum, tr])

  const avalWins   = aval.totalInterest < snow.totalInterest
  const interestSaved = Math.abs(snow.totalInterest - aval.totalInterest)

  const chartSnowKey = tr.debt_chart_series_snowball
  const chartAvalKey = tr.debt_chart_series_avalanche

  const chartData = useMemo(() => [
    {
      name: tr.debt_chart_no_extra,
      [chartSnowKey]:  Math.round(baseSnow.totalInterest),
      [chartAvalKey]: Math.round(baseAval.totalInterest),
    },
    {
      name: interpolate(tr.debt_chart_with_extra, { sym: symbol, n: extraNum }),
      [chartSnowKey]:  Math.round(snow.totalInterest),
      [chartAvalKey]: Math.round(aval.totalInterest),
    },
  ], [tr, symbol, extraNum, baseSnow, baseAval, snow, aval, chartSnowKey, chartAvalKey])

  if (loading) return (
    <div style={{ paddingTop:60, textAlign:'center' }}>
      <div className="spinner" aria-label={tr.nw_empty_loading} />
    </div>
  )

  if (loans.length === 0) return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>📉</div>
        <h2 style={{ color:'white', margin:'0 0 2px', fontSize:22, fontWeight:800 }}>{tr.debt_title}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.debt_subtitle}</p>
      </div>
      <div style={{ textAlign:'center', padding:'60px 24px' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#1D9E75', marginBottom:8 }}>{tr.debt_no_loans_title}</div>
        <div style={{ fontSize:14, color:'#9ca3af', marginBottom:24 }}>{tr.debt_no_loans_sub}</div>
        <Link to="/loans">
          <button style={{ padding:'13px 28px', background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer' }}>
            {tr.debt_go_loans}
          </button>
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>📉</div>
        <h2 style={{ color:'white', margin:'0 0 2px', fontSize:22, fontWeight:800 }}>{tr.debt_title}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.debt_subtitle_full}</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'24px 0 16px' }}>
        <div style={{ background:'#FCEBEB', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#A32D2D', fontWeight:600, marginBottom:4 }}>{tr.debt_total_debt}</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#A32D2D' }}>{fmt(totalDebt, symbol)}</div>
          <div style={{ fontSize:10, color:'#A32D2D', opacity:0.7, marginTop:2 }}>
            {loans.length === 1 ? tr.debt_active_loans_one : interpolate(tr.debt_active_loans_many, { n: loans.length })}
          </div>
        </div>
        <div style={{ background:'#f3f4f6', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#5F5E5A', fontWeight:600, marginBottom:4 }}>{tr.debt_min_monthly}</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#374151' }}>{fmt(totalMin, symbol)}</div>
          <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{tr.debt_required_payments}</div>
        </div>
      </div>

      <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{tr.debt_extra_title}</div>
        <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>{tr.debt_extra_hint}</div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, padding:'12px 14px', border:'2px solid #A32D2D', borderRadius:12 }}>
            <span style={{ fontSize:18, fontWeight:700, color:'#A32D2D' }}>{symbol}</span>
            <input
              type="number" min="0" step="10" placeholder="100"
              value={extra} onChange={e => setExtra(e.target.value)}
              style={{ flex:1, border:'none', outline:'none', fontSize:22, fontWeight:700, color:'#A32D2D', width:0 }}
            />
          </div>
          <span style={{ fontSize:12, color:'#9ca3af' }}>{tr.debt_per_month}</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[50,100,200,500].map(n => (
            <button key={n} type="button" onClick={() => setExtra(String(n))}
              style={{ flex:1, padding:'7px 4px', borderRadius:8, border:`1.5px solid ${extraNum===n?'#A32D2D':'#e5e7eb'}`, background:extraNum===n?'#FCEBEB':'white', color:extraNum===n?'#A32D2D':'#6b7280', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              +{symbol}{n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <div style={{ background: !avalWins ? '#FFF3CD' : 'white', borderRadius:16, padding:'16px', border:`2px solid ${!avalWins?'#BA7517':'#e5e7eb'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#BA7517' }}>{tr.debt_snowball}</div>
            {!avalWins && <div style={{ fontSize:9, fontWeight:700, background:'#BA7517', color:'white', padding:'2px 7px', borderRadius:10 }}>{tr.debt_best}</div>}
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:10, lineHeight:1.5 }}>{tr.debt_snowball_desc}</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{tr.debt_debt_free_in}</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#374151' }}>{monthsToStr(snow.months)}</div>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{addMonthsLabel(snow.months)}</div>
          </div>
          <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{tr.debt_total_interest}</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#A32D2D' }}>{fmt(snow.totalInterest, symbol)}</div>
          </div>
          {extraNum > 0 && baseSnow.months > snow.months && (
            <div style={{ marginTop:8, background:'#E1F5EE', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#0F6E56', fontWeight:600 }}>
              {interpolate(tr.debt_save_time_money, {
                time: monthsToStr(baseSnow.months - snow.months),
                amount: fmt(baseSnow.totalInterest - snow.totalInterest, symbol),
              })}
            </div>
          )}
        </div>

        <div style={{ background: avalWins ? '#FFF3CD' : 'white', borderRadius:16, padding:'16px', border:`2px solid ${avalWins?'#BA7517':'#e5e7eb'}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#185FA5' }}>{tr.debt_avalanche}</div>
            {avalWins && <div style={{ fontSize:9, fontWeight:700, background:'#BA7517', color:'white', padding:'2px 7px', borderRadius:10 }}>{tr.debt_best}</div>}
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:10, lineHeight:1.5 }}>{tr.debt_avalanche_desc}</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{tr.debt_debt_free_in}</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#374151' }}>{monthsToStr(aval.months)}</div>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{addMonthsLabel(aval.months)}</div>
          </div>
          <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:8 }}>
            <div style={{ fontSize:10, color:'#9ca3af' }}>{tr.debt_total_interest}</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#A32D2D' }}>{fmt(aval.totalInterest, symbol)}</div>
          </div>
          {extraNum > 0 && baseAval.months > aval.months && (
            <div style={{ marginTop:8, background:'#E1F5EE', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#0F6E56', fontWeight:600 }}>
              {interpolate(tr.debt_save_time_money, {
                time: monthsToStr(baseAval.months - aval.months),
                amount: fmt(baseAval.totalInterest - aval.totalInterest, symbol),
              })}
            </div>
          )}
        </div>
      </div>

      {interestSaved > 1 && (
        <div style={{ background: avalWins ? '#EBF4FB' : '#FFF3CD', border:`1px solid ${avalWins?'#185FA5':'#BA7517'}`, borderRadius:12, padding:'12px 14px', marginBottom:16, fontSize:13, color: avalWins?'#185FA5':'#7A4D0F', fontWeight:600 }}>
          {avalWins
            ? interpolate(tr.debt_tip_avalanche_wins, { amount: fmt(interestSaved, symbol) })
            : tr.debt_tip_similar}
        </div>
      )}

      {extraNum > 0 && (
        <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{tr.debt_chart_title}</div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:14 }}>{interpolate(tr.debt_chart_sub, { sym: symbol, n: extraNum })}</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={40}
                tickFormatter={v => `${symbol}${v>=1000?`${(v/1000).toLocaleString(loc,{ maximumFractionDigits:0 })}k`:v}`} />
              <Tooltip formatter={(v, name) => [`${symbol}${Number(v).toLocaleString(loc)}`, name]}
                contentStyle={{ fontSize:11, borderRadius:10, border:'1px solid #e5e7eb' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey={chartSnowKey} fill="#BA7517" radius={[4,4,0,0]} />
              <Bar dataKey={chartAvalKey} fill="#185FA5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:12, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>{tr.debt_order_snowball}</div>
        {snow.order.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom: i < snow.order.length-1 ? 10 : 0 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:'#BA751718', border:'2px solid #BA7517', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#BA7517', flexShrink:0 }}>
              {i+1}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{item.name}</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>
                {item.paidOffMonth
                  ? interpolate(tr.debt_paid_off_line, { date: addMonthsLabel(item.paidOffMonth) })
                  : tr.debt_paid_off_dash}
              </div>
            </div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>{monthsToStr(item.paidOffMonth)}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>{tr.debt_order_avalanche}</div>
        {aval.order.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom: i < aval.order.length-1 ? 10 : 0 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:'#185FA518', border:'2px solid #185FA5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#185FA5', flexShrink:0 }}>
              {i+1}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{item.name}</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>
                {item.paidOffMonth
                  ? interpolate(tr.debt_paid_off_line, { date: addMonthsLabel(item.paidOffMonth) })
                  : tr.debt_paid_off_dash}
              </div>
            </div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>{monthsToStr(item.paidOffMonth)}</div>
          </div>
        ))}
      </div>

      <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>{tr.debt_your_loans}</div>
      {loans.map(loan => {
        const bal = Number(loan.remaining_balance || loan.principal || 0)
        const rate = Number(loan.interest_rate || 0) * 100
        return (
          <div key={loan.id} style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #e5e7eb' }}>
            <span style={{ fontSize:22 }}>{TYPE_ICONS[loan.loan_type] || '📋'}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{loanDisplayName(loan, tr)}</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>
                {interpolate(tr.debt_apr_min, { rate: rate.toFixed(1), min: fmtD(loan.monthly_payment, symbol) })}
              </div>
            </div>
            <div style={{ fontWeight:700, color:'#A32D2D', fontSize:14 }}>{fmt(bal, symbol)}</div>
          </div>
        )
      })}

      <div style={{ marginTop:12, textAlign:'center' }}>
        <Link to="/loans" style={{ fontSize:13, color:'#9ca3af', textDecoration:'none' }}>
          {tr.debt_manage_link}
        </Link>
      </div>
    </div>
  )
}
