import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT, getLang, LANG_LOCALES } from '../lib/i18n'
import { getDailyVerse } from '../lib/verses'

// ── Lazy charts: recharts (411 kB) only fetched when charts render ─────────────
const LazyDonut = lazy(() =>
  import('./DashboardCharts').then(m => ({ default: m.DonutChart }))
)
const LazyTrend = lazy(() =>
  import('./DashboardCharts').then(m => ({ default: m.TrendChart }))
)

// ── Cache helpers (stale-while-revalidate) ────────────────────────────────────
const CACHE_KEY = uid => `sh_dash_v3_${uid}`
function loadCache(uid) {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY(uid)) || 'null') } catch { return null }
}
function saveCache(uid, data) { localStorage.setItem(CACHE_KEY(uid), JSON.stringify(data)) }

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt    = (n, symbol='$') => `${symbol}${Number(n||0).toLocaleString('en-US',{maximumFractionDigits:0})}`
const fmtCur = (n, cur) => fmt(n, cur?.symbol||'$')

const CAT_CONFIG = {
  Needs:      { color:'#185FA5', icon:'🏠', label:'Needs'   },
  Wants:      { color:'#BA7517', icon:'🎯', label:'Wants'   },
  Giving:     { color:'#1D9E75', icon:'🎁', label:'Giving'  },
  Savings:    { color:'#5F5E5A', icon:'🏦', label:'Savings' },
  Investments:{ color:'#3B6D11', icon:'📈', label:'Invest'  },
}

const CURRENCY_SYMBOLS = {
  USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦',
  KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA',
  INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽',
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Skeleton shimmer ───────────────────────────────────────────────────────────
function Skeleton({ h=18, r=6, style={} }) {
  return (
    <div style={{
      height:h, borderRadius:r,
      background:'linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%)',
      backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite',
      ...style,
    }}/>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Dashboard({ session, lang }) {
  const tr     = useT()
  const verse  = getDailyVerse(lang || getLang())
  const locale = LANG_LOCALES[lang] || 'en-US'
  const now    = new Date()
  const hour   = now.getHours()
  const monthYear = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0]
    || session?.user?.email?.split('@')[0] || 'Friend'
  const greeting = hour < 12 ? tr.goodMorning : hour < 17 ? tr.goodAfternoon : tr.goodEvening
  const uid = session?.user?.id

  // ── Load cache immediately — no await, no spinner for returning users ────────
  const cached = uid ? loadCache(uid) : null

  const [entries,      setEntries]      = useState(cached?.entries      || [])
  const [loans,        setLoans]        = useState(cached?.loans        || [])
  const [investments,  setInvestments]  = useState(cached?.investments  || [])
  const [challenge,    setChallenge]    = useState(cached?.challenge    || 0)
  const [userCurrency, setUserCurrency] = useState(cached?.userCurrency || { code:'USD', symbol:'$' })
  const [trendData,    setTrendData]    = useState(cached?.trendData    || [])
  // loading = true only means "fetching" — we ALWAYS show content (never blank skeletons)
  const [loading,    setLoading]    = useState(!cached)
  const [refreshing, setRefreshing] = useState(!!cached)

  // ── Fetch fresh data in two waves ────────────────────────────────────────────
  // Wave 1 (fast): current month + loans + investments + currency — populates
  //   the main financial cards immediately.
  // Wave 2 (deferred): 6-month trend — heavy query, loads chart after cards.
  useEffect(() => {
    if (!uid) return

    let stale = false  // prevent setState after unmount

    async function fetchWave1() {
      try {
        const [
          { data: e }, { data: l }, { data: i },
          { count }, { data: profile },
        ] = await Promise.all([
          supabase.from('budget_entries').select('type,amount,category,label,notes').eq('user_id',uid).eq('month_year',monthYear),
          supabase.from('loans').select('id,remaining_balance,principal,status').eq('user_id',uid).eq('status','active'),
          supabase.from('investments').select('id,current_value').eq('user_id',uid),
          supabase.from('challenge_progress').select('id',{count:'exact',head:true}).eq('user_id',uid).eq('completed',true),
          supabase.from('users').select('currency').eq('id',uid).single(),
        ])

        if (stale) return
        const currency = profile?.currency
          ? { code:profile.currency, symbol:CURRENCY_SYMBOLS[profile.currency]||'$' }
          : { code:'USD', symbol:'$' }

        const wave1 = { entries:e||[], loans:l||[], investments:i||[], challenge:count||0, userCurrency:currency }
        setEntries(wave1.entries)
        setLoans(wave1.loans)
        setInvestments(wave1.investments)
        setChallenge(wave1.challenge)
        setUserCurrency(wave1.userCurrency)
        setLoading(false)
        setRefreshing(false)

        // Kick off wave 2 (trend chart) after main cards are rendered
        fetchWave2(wave1)
      } catch(err) {
        console.error('Dashboard wave1:', err)
        if (!stale) { setLoading(false); setRefreshing(false) }
      }
    }

    async function fetchWave2(wave1) {
      try {
        const months = Array.from({ length:6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
        })
        const { data: allEntries } = await supabase
          .from('budget_entries').select('type,amount,month_year')
          .eq('user_id',uid).in('month_year',months)

        if (stale) return
        const trend = months.map(my => {
          const [, mo] = my.split('-')
          const rows = (allEntries||[]).filter(r=>r.month_year===my)
          return {
            month:    MONTH_LABELS[parseInt(mo,10)-1],
            Income:   rows.filter(r=>r.type==='income').reduce((s,r)=>s+Number(r.amount),0),
            Expenses: rows.filter(r=>r.type==='expense').reduce((s,r)=>s+Number(r.amount),0),
          }
        })
        setTrendData(trend)
        // Save full data to cache now that we have everything
        saveCache(uid, { ...wave1, trendData:trend })
      } catch(err) {
        console.error('Dashboard wave2:', err)
      }
    }

    fetchWave1()
    return () => { stale = true }
  }, [uid]) // eslint-disable-line

  // ── Derived ───────────────────────────────────────────────────────────────────
  const income        = entries.filter(e=>e.type==='income').reduce((s,e)=>s+Number(e.amount),0)
  const expenses      = entries.filter(e=>e.type==='expense').reduce((s,e)=>s+Number(e.amount),0)
  const surplus       = income - expenses
  const totalDebt     = loans.reduce((s,l)=>s+Number(l.remaining_balance||l.principal),0)
  const totalInvested = investments.reduce((s,i)=>s+Number(i.current_value||0),0)
  const netWorth      = totalInvested - totalDebt
  const spentPct      = income > 0 ? Math.min(100, Math.round(expenses/income*100)) : 0
  const savedPct      = income > 0 ? Math.max(0, Math.round((income-expenses)/income*100)) : 0

  const catData = Object.entries(CAT_CONFIG).map(([cat,cfg]) => ({
    name:cat, label:cfg.label, icon:cfg.icon, color:cfg.color,
    value:entries.filter(e=>e.type==='expense'&&e.category===cat).reduce((s,e)=>s+Number(e.amount),0),
  })).filter(d=>d.value>0)

  const sym = userCurrency.symbol

  return (
    <div style={{ paddingBottom:100 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .dash-in { animation:fadeUp 0.2s ease both }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'20px 0 16px' }}>
        <div style={{ fontSize:13, color:'var(--text-muted)' }}>{greeting},</div>
        <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.5px' }}>{firstName} ✦</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
          {now.toLocaleDateString(locale,{ weekday:'long', month:'long', day:'numeric' })}
        </div>
        {refreshing && (
          <div style={{ fontSize:10, color:'#9ca3af', marginTop:3 }}>↻ Refreshing…</div>
        )}
      </div>

      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <Link to="/explore" style={{ textDecoration:'none' }}>
        <div style={{ background:'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius:14,
          padding:'12px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginBottom:2 }}>✦ New here? Start with the guide →</div>
            <div style={{ fontSize:14, fontWeight:600, color:'white' }}>{tr.exploreFeatures||'Explore all features →'}</div>
          </div>
          <div style={{ fontSize:24 }}>🧭</div>
        </div>
      </Link>

      {/* ── Verse ──────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0F6E56,#1D9E75)', borderRadius:14,
        padding:'14px 16px', marginBottom:16 }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:600, letterSpacing:'0.1em', marginBottom:6 }}>
          ✦ {tr.todayVerse}
        </div>
        <div style={{ fontSize:13, color:'white', lineHeight:1.6, fontStyle:'italic' }}>{verse.text}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:4 }}>— {verse.ref}</div>
      </div>

      {/* ── Financial content — always visible; loading just means numbers are $0 ── */}
      <div className="dash-in">

          {/* Net Worth */}
          <div style={{
            background: netWorth >= 0
              ? 'linear-gradient(135deg,#1D9E75,#0F6E56)'
              : 'linear-gradient(135deg,#A32D2D,#7a1f1f)',
            borderRadius:16, padding:'18px 20px', marginBottom:16, color:'white',
          }}>
            <div style={{ fontSize:11, opacity:0.8, marginBottom:4, letterSpacing:'0.05em' }}>
              {tr.netWorthLabel||'ESTIMATED NET WORTH'}
            </div>
            <div style={{ fontSize:34, fontWeight:800, letterSpacing:'-1px',
              opacity: loading ? 0.45 : 1, transition:'opacity 0.3s' }}>
              {netWorth>=0?'+':'-'}{fmt(Math.abs(netWorth), sym)}
            </div>
            <div style={{ fontSize:11, opacity:0.7, marginTop:4 }}>
              {loading
                ? '⏳ Loading your data…'
                : `Portfolio ${fmt(totalInvested,sym)} − Loans ${fmt(totalDebt,sym)}`}
            </div>
          </div>

          {/* Monthly overview */}
          <div className="card" style={{ marginBottom:16, padding:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{tr.monthlyOverview||'Monthly Overview'}</div>
              <Link to="/budget" style={{ fontSize:12, color:'var(--green)', textDecoration:'none', fontWeight:600 }}>
                {tr.seeDetails||'See details →'}
              </Link>
            </div>

            {income > 0 || expenses > 0 ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  {catData.length > 0 ? (
                    <Suspense fallback={
                      <div style={{ width:150, height:150, borderRadius:'50%', background:'#f3f4f6', flexShrink:0 }}/>
                    }>
                      <LazyDonut data={catData} total={expenses} symbol={sym} />
                    </Suspense>
                  ) : (
                    <div style={{ width:150, height:150, borderRadius:'50%', background:'#f3f4f6',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>No<br/>expenses</div>
                    </div>
                  )}

                  <div style={{ flex:1 }}>
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{tr.income||'Income'}</div>
                      <div style={{ fontSize:20, fontWeight:800, color:'#1D9E75' }}>{fmtCur(income, userCurrency)}</div>
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{tr.spent||'Spent'}</div>
                      <div style={{ fontSize:20, fontWeight:800, color:'#A32D2D' }}>{fmtCur(expenses, userCurrency)}</div>
                    </div>
                    <div style={{ padding:'8px 12px', background:surplus>=0?'#E1F5EE':'#FCEBEB', borderRadius:10 }}>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>
                        {surplus>=0?(tr.surplus||'Surplus'):(tr.deficit||'Deficit')}
                      </div>
                      <div style={{ fontSize:16, fontWeight:700, color:surplus>=0?'#1D9E75':'#A32D2D' }}>
                        {surplus>=0?'+':'-'}{fmtCur(Math.abs(surplus), userCurrency)}
                      </div>
                    </div>
                  </div>
                </div>

                {income > 0 && (
                  <div style={{ marginTop:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>
                      <span>{tr.spent||'Spent'} {spentPct}% {tr.ofIncome||'of income'}</span>
                      <span>{tr.savedPct||'Saved'} {savedPct}%</span>
                    </div>
                    <div style={{ height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${spentPct}%`, borderRadius:4, transition:'width 0.5s',
                        background:spentPct>90?'#A32D2D':spentPct>70?'#BA7517':'#1D9E75' }}/>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>
                  {tr.noEntriesYet||'No budget entries yet'}
                </div>
                <Link to="/budget">
                  <button style={{ padding:'8px 20px', background:'var(--green)', color:'white',
                    border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    {tr.addIncomeExp||'Add income & expenses'}
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Spending by category */}
          {catData.length > 0 && (
            <div className="card" style={{ marginBottom:16, padding:'16px' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>
                {tr.spendingByCategory||'Spending by Category'}
              </div>
              {catData.sort((a,b)=>b.value-a.value).map((cat,i) => (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:16 }}>{cat.icon}</span>
                      <span style={{ fontSize:13, fontWeight:600 }}>{cat.label}</span>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:cat.color }}>
                        {sym}{cat.value.toLocaleString()}
                      </span>
                      <span style={{ fontSize:10, color:'var(--text-muted)', marginLeft:6 }}>
                        {Math.round(cat.value/expenses*100)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.round(cat.value/expenses*100)}%`,
                      background:cat.color, borderRadius:3 }}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6-month trend — recharts loads lazily here */}
          {trendData.some(d=>d.Income>0||d.Expenses>0) && (
            <div className="card" style={{ marginBottom:16, padding:'16px' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>📊 6-Month Trend</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:12 }}>Income vs Expenses</div>
              <Suspense fallback={
                <div style={{ height:170, background:'#f9fafb', borderRadius:10,
                  display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:12 }}>
                  Loading chart…
                </div>
              }>
                <LazyTrend data={trendData} symbol={sym} />
              </Suspense>
            </div>
          )}

          {/* Quick stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            <Link to="/loans" style={{ textDecoration:'none' }}>
              <div style={{ background:'#FCEBEB', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ fontSize:11, color:'#A32D2D', fontWeight:600, marginBottom:6 }}>🏦 {tr.totalDebt||'Total Debt'}</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#A32D2D' }}>{fmt(totalDebt,sym)}</div>
                <div style={{ fontSize:11, color:'#A32D2D', opacity:0.7, marginTop:2 }}>{loans.length} {tr.loans||'loans'}</div>
              </div>
            </Link>
            <Link to="/investments" style={{ textDecoration:'none' }}>
              <div style={{ background:'#EAF3DE', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ fontSize:11, color:'#3B6D11', fontWeight:600, marginBottom:6 }}>📈 {tr.portfolio||'Portfolio'}</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#3B6D11' }}>{fmt(totalInvested,sym)}</div>
                <div style={{ fontSize:11, color:'#3B6D11', opacity:0.7, marginTop:2 }}>{investments.length} {tr.invest||'investments'}</div>
              </div>
            </Link>
          </div>

          {/* Challenge */}
          {challenge > 0 && (
            <Link to="/challenge" style={{ textDecoration:'none' }}>
              <div className="card" style={{ marginBottom:16, background:'linear-gradient(135deg,#FAEEDA,#fff)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:11, color:'#BA7517', fontWeight:600, marginBottom:4 }}>⭐ {tr.challengeTitle||'$100 CHALLENGE'}</div>
                    <div style={{ fontSize:15, fontWeight:700 }}>{tr.dayLabel||'Day'} {challenge} {tr.of30||'of 30'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:24, fontWeight:800, color:'#BA7517' }}>{Math.round(challenge/30*100)}%</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{tr.complete||'complete'}</div>
                  </div>
                </div>
                <div className="progress-wrap" style={{ marginTop:10, height:6 }}>
                  <div className="progress-fill" style={{ width:`${Math.round(challenge/30*100)}%`, background:'#BA7517' }}/>
                </div>
              </div>
            </Link>
          )}
      </div>
    </div>
  )
}
