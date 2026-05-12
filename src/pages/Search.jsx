import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT, interpolate, getLang, LANG_LOCALES } from '../lib/i18n'

function buildResultTypes(tr) {
  return {
    budget:       { icon:'📊', label: tr.search_type_budget,       route:'/budget' },
    bill:         { icon:'📋', label: tr.search_type_bill,           route:'/bills' },
    subscription: { icon:'🔄', label: tr.search_type_subscription, route:'/subscriptions' },
    loan:         { icon:'🏦', label: tr.search_type_loan,           route:'/loans' },
    investment:   { icon:'📈', label: tr.search_type_investment,    route:'/investments' },
    savings:      { icon:'🎯', label: tr.search_type_savings,       route:'/savings' },
    networth:     { icon:'💎', label: tr.search_type_networth,       route:'/networth' },
  }
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
  const tr = useT()
  const RESULT_TYPES = useMemo(() => buildResultTypes(tr), [tr])
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()
  const userId = session?.user?.id
  const numLocale = LANG_LOCALES[getLang()] || 'en-US'

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || !userId) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)

    const term = q.trim().toLowerCase()
    const hits = []

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
      subtitle: `${r.type === 'income' ? tr.search_sub_income : tr.search_sub_expense} · ${r.month_year}`,
      amount: r.amount,
      amountColor: r.type === 'income' ? '#1D9E75' : '#A32D2D',
    }))

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
      subtitle: `${tr.search_due} ${r.due_date || '—'} · ${r.status === 'paid' ? tr.search_paid : tr.search_unpaid}`,
      amount: r.amount,
      amountColor: '#6366f1',
    }))

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
      subtitle: `${r.billing_cycle} · ${tr.search_next} ${r.next_billing_date || '—'}`,
      amount: r.amount,
      amountColor: '#7c3aed',
    }))

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
      subtitle: interpolate(tr.search_apr, {
        rate: (Number(r.interest_rate) * 100).toFixed(2),
        pay: `$${Number(r.monthly_payment || 0).toFixed(0)}`,
      }),
      amount: r.balance,
      amountColor: '#A32D2D',
    }))

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
      subtitle: r.ticker ? interpolate(tr.search_ticker, { t: r.ticker }) : tr.search_investment,
      amount: r.current_value,
      amountColor: '#0ea5e9',
    }))

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
      subtitle: interpolate(tr.search_funded, { pct: Math.round((r.current_amount / r.target_amount) * 100) }),
      amount: r.target_amount,
      amountColor: '#f59e0b',
    }))

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
      subtitle: `${r.type === 'asset' ? tr.search_asset : tr.search_liability} · ${r.category || ''}`,
      amount: r.amount,
      amountColor: r.type === 'asset' ? '#1D9E75' : '#A32D2D',
    }))

    setResults(hits)
    setLoading(false)
  }, [userId, tr])

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(t)
  }, [query, doSearch])

  const grouped = {}
  results.forEach(r => {
    if (!grouped[r.type]) grouped[r.type] = []
    grouped[r.type].push(r)
  })

  const hints = [tr.search_hint_rent, tr.search_hint_netflix, tr.search_hint_student, tr.search_hint_savings, tr.search_hint_dividend]

  return (
    <div style={{ padding:'0 0 80px' }}>
      <div style={{ position:'sticky', top:0, zIndex:10, background:'var(--bg)', padding:'16px 16px 8px' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:18, color:'#9ca3af', pointerEvents:'none' }}>🔍</span>
          <input
            autoFocus
            type="text"
            placeholder={tr.search_ph}
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
            <button type="button" onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
              style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9ca3af' }}>
              ✕
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div style={{ fontSize:12, color:'#9ca3af', marginTop:6, paddingLeft:4 }}>
            {results.length === 1
              ? interpolate(tr.search_results_one, { q: query })
              : interpolate(tr.search_results_many, { n: results.length, q: query })}
          </div>
        )}
      </div>

      {!query && (
        <div style={{ textAlign:'center', padding:'60px 24px 24px', color:'#9ca3af' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:8 }}>{tr.search_empty_title}</div>
          <div style={{ fontSize:13, lineHeight:1.6, whiteSpace:'pre-line' }}>
            {tr.search_empty_sub}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, marginTop:20 }}>
            {hints.map(hint => (
              <button key={hint} type="button" onClick={() => setQuery(hint)}
                style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid var(--border)', background:'var(--white)', color:'var(--text)', fontSize:12, cursor:'pointer', fontWeight:500 }}>
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>{tr.search_loading}</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'#9ca3af' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>😶</div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>{interpolate(tr.search_no_results, { q: query })}</div>
          <div style={{ fontSize:13, marginTop:6 }}>{tr.search_try_other}</div>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([type, items]) => {
        const meta = RESULT_TYPES[type]
        if (!meta) return null
        return (
          <div key={type} style={{ padding:'0 16px', marginTop:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8, paddingLeft:2 }}>
              {meta.icon} {meta.label}
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
                  ${Number(item.amount || 0).toLocaleString(numLocale, { minimumFractionDigits:0, maximumFractionDigits:0 })}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
