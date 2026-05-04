import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const RESULT_TYPES = {
  budget:       { icon:'📊', label:'Budget Entry',   route:'/budget' },
  bill:         { icon:'📋', label:'Bill',            route:'/bills' },
  subscription: { icon:'🔄', label:'Subscription',   route:'/subscriptions' },
  loan:         { icon:'🏦', label:'Loan',            route:'/loans' },
  investment:   { icon:'📈', label:'Investment',      route:'/investments' },
  savings:      { icon:'🎯', label:'Savings Goal',    route:'/savings' },
  networth:     { icon:'💎', label:'Net Worth Item',  route:'/networth' },
}

function highlight(text = '', query = '') {
  if (!query) return text
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background:'#1D9E7530', color:'#0F6E56', borderRadius:3, padding:'0 2px' }}>{p}</mark>
      : p
  )
}

export default function Search({ session }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()
  const userId = session?.user?.id

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || !userId) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)

    const term = q.trim().toLowerCase()
    const hits = []

    // ── Budget entries ──────────────────────────────────────────────────────
    const { data: budget } = await supabase
      .from('budget_entries')
      .select('id, label, amount, type, category, month_year')
      .eq('user_id', userId)
      .ilike('label', `%${term}%`)
      .limit(10)
    ;(budget || []).forEach(r => hits.push({
      type: 'budget',
      id: r.id,
      title: r.label,
      subtitle: `${r.type === 'income' ? '💚' : '🔴'} ${r.type} · ${r.month_year}`,
      amount: r.amount,
      amountColor: r.type === 'income' ? '#1D9E75' : '#A32D2D',
    }))

    // ── Bills ───────────────────────────────────────────────────────────────
    const { data: bills } = await supabase
      .from('bills')
      .select('id, name, amount, status, due_date, category')
      .eq('user_id', userId)
      .ilike('name', `%${term}%`)
      .limit(10)
    ;(bills || []).forEach(r => hits.push({
      type: 'bill',
      id: r.id,
      title: r.name,
      subtitle: `Due ${r.due_date || '—'} · ${r.status === 'paid' ? '✅ Paid' : '⏳ Unpaid'}`,
      amount: r.amount,
      amountColor: '#6366f1',
    }))

    // ── Subscriptions ───────────────────────────────────────────────────────
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('id, name, amount, billing_cycle, category, next_billing_date')
      .eq('user_id', userId)
      .ilike('name', `%${term}%`)
      .limit(10)
    ;(subs || []).forEach(r => hits.push({
      type: 'subscription',
      id: r.id,
      title: r.name,
      subtitle: `${r.billing_cycle} · next ${r.next_billing_date || '—'}`,
      amount: r.amount,
      amountColor: '#7c3aed',
    }))

    // ── Loans ───────────────────────────────────────────────────────────────
    const { data: loans } = await supabase
      .from('loans')
      .select('id, name, balance, interest_rate, monthly_payment')
      .eq('user_id', userId)
      .ilike('name', `%${term}%`)
      .limit(10)
    ;(loans || []).forEach(r => hits.push({
      type: 'loan',
      id: r.id,
      title: r.name,
      subtitle: `${(Number(r.interest_rate)*100).toFixed(2)}% APR · $${Number(r.monthly_payment||0).toFixed(0)}/mo`,
      amount: r.balance,
      amountColor: '#A32D2D',
    }))

    // ── Investments ─────────────────────────────────────────────────────────
    const { data: investments } = await supabase
      .from('investments')
      .select('id, name, current_value, ticker')
      .eq('user_id', userId)
      .ilike('name', `%${term}%`)
      .limit(10)
    ;(investments || []).forEach(r => hits.push({
      type: 'investment',
      id: r.id,
      title: r.name,
      subtitle: r.ticker ? `Ticker: ${r.ticker}` : 'Investment',
      amount: r.current_value,
      amountColor: '#0ea5e9',
    }))

    // ── Savings Goals ───────────────────────────────────────────────────────
    const { data: savings } = await supabase
      .from('savings_goals')
      .select('id, name, target_amount, current_amount')
      .eq('user_id', userId)
      .ilike('name', `%${term}%`)
      .limit(10)
    ;(savings || []).forEach(r => hits.push({
      type: 'savings',
      id: r.id,
      title: r.name,
      subtitle: `${Math.round((r.current_amount/r.target_amount)*100)}% funded`,
      amount: r.target_amount,
      amountColor: '#f59e0b',
    }))

    // ── Net Worth Items ─────────────────────────────────────────────────────
    const { data: nwItems } = await supabase
      .from('net_worth_items')
      .select('id, name, amount, type, category')
      .eq('user_id', userId)
      .ilike('name', `%${term}%`)
      .limit(10)
    ;(nwItems || []).forEach(r => hits.push({
      type: 'networth',
      id: r.id,
      title: r.name,
      subtitle: `${r.type === 'asset' ? '💚 Asset' : '🔴 Liability'} · ${r.category || ''}`,
      amount: r.amount,
      amountColor: r.type === 'asset' ? '#1D9E75' : '#A32D2D',
    }))

    setResults(hits)
    setLoading(false)
  }, [userId])

  // Debounce — fire search 350ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(t)
  }, [query, doSearch])

  const grouped = {}
  results.forEach(r => {
    if (!grouped[r.type]) grouped[r.type] = []
    grouped[r.type].push(r)
  })

  return (
    <div style={{ padding:'0 0 80px' }}>
      {/* ── Search bar ── */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:'var(--bg)', padding:'16px 16px 8px' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:18, color:'#9ca3af', pointerEvents:'none' }}>🔍</span>
          <input
            autoFocus
            type="text"
            placeholder="Search budgets, bills, loans, investments…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width:'100%', padding:'13px 14px 13px 44px', borderRadius:14,
              border:'1.5px solid var(--border)', background:'var(--white)',
              color:'var(--text)', fontSize:15, outline:'none', boxSizing:'border-box',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af' }}>
              ✕
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:6, paddingLeft:4 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
        )}
      </div>

      {/* ── Empty / idle state ── */}
      {!query && (
        <div style={{ textAlign:'center', padding:'60px 24px 24px', color:'#9ca3af' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:8 }}>Search everything</div>
          <div style={{ fontSize:13, lineHeight:1.6 }}>
            Find budget entries, bills, subscriptions,<br/>loans, investments, savings goals & more
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, marginTop:20 }}>
            {['Rent', 'Netflix', 'Student loan', 'Savings', 'Dividend'].map(hint => (
              <button key={hint} onClick={() => setQuery(hint)}
                style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid var(--border)', background:'var(--white)', color:'var(--text)', fontSize:12, cursor:'pointer', fontWeight:500 }}>
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Searching…</div>
      )}

      {/* ── No results ── */}
      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'#9ca3af' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>😶</div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>No results for "{query}"</div>
          <div style={{ fontSize:13, marginTop:6 }}>Try a different keyword</div>
        </div>
      )}

      {/* ── Results grouped by type ── */}
      {!loading && Object.entries(grouped).map(([type, items]) => {
        const meta = RESULT_TYPES[type]
        return (
          <div key={type} style={{ padding:'0 16px', marginTop:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8, paddingLeft:2 }}>
              {meta.icon} {meta.label}{items.length > 1 ? 's' : ''}
            </div>
            {items.map(item => (
              <div key={item.id}
                onClick={() => navigate(meta.route)}
                style={{ display:'flex', alignItems:'center', gap:12, background:'var(--white)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid var(--border)', cursor:'pointer' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${item.amountColor}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {highlight(item.title, query)}
                  </div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{item.subtitle}</div>
                </div>
                <div style={{ fontWeight:700, fontSize:14, color:item.amountColor, flexShrink:0 }}>
                  ${Number(item.amount || 0).toLocaleString('en', { minimumFractionDigits:0, maximumFractionDigits:0 })}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
