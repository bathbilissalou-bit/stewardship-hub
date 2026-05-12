import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT, interpolate, getLang, LANG_LOCALES } from '../lib/i18n'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const SYMBOLS = { USD:'$',EUR:'€',GBP:'£',CAD:'C$',AUD:'A$',NGN:'₦',KES:'KSh',GHS:'₵',ZAR:'R',XOF:'CFA',XAF:'FCFA',INR:'₹',BRL:'R$',MXN:'MX$',CNY:'¥',JPY:'¥',KRW:'₩',RUB:'₽' }

const ASSET_CATS = [
  { label:'Cash & Savings', icon:'💵', color:'#1D9E75' },
  { label:'Property',       icon:'🏠', color:'#8B5E3C' },
  { label:'Vehicle',        icon:'🚗', color:'#534AB7' },
  { label:'Business',       icon:'💼', color:'#185FA5' },
  { label:'Crypto',         icon:'₿',  color:'#BA7517' },
  { label:'Other Asset',    icon:'📦', color:'#5F5E5A' },
]

const LIAB_CATS = [
  { label:'Credit Card',    icon:'💳', color:'#A32D2D' },
  { label:'Mortgage',       icon:'🏦', color:'#7B1C1C' },
  { label:'Student Loan',   icon:'🎓', color:'#C2185B' },
  { label:'Other Debt',     icon:'📋', color:'#9ca3af' },
]

const ALL_CATS = [...ASSET_CATS, ...LIAB_CATS]
const catMap   = Object.fromEntries(ALL_CATS.map(c => [c.label, c]))

const NW_CAT_TR = {
  'Cash & Savings': 'nw_cat_cash',
  Property: 'nw_cat_property',
  Vehicle: 'nw_cat_vehicle',
  Business: 'nw_cat_business',
  Crypto: 'nw_cat_crypto',
  'Other Asset': 'nw_cat_other_asset',
  'Credit Card': 'nw_cat_credit',
  Mortgage: 'nw_cat_mortgage',
  'Student Loan': 'nw_cat_student',
  'Other Debt': 'nw_cat_other_debt',
  Investments: 'nw_cat_investments',
  Loan: 'nw_cat_loan',
}

function nwCatLabel(tr, cat) {
  const k = NW_CAT_TR[cat]
  return k ? tr[k] : cat
}

export default function NetWorth({ session }) {
  const tr = useT()
  const loc = LANG_LOCALES[getLang()] || 'en-US'
  const userId = session.user.id
  const [symbol,      setSymbol]      = useState('$')
  const [items,       setItems]       = useState([])
  const [investments, setInvestments] = useState([])
  const [loans,       setLoans]       = useState([])
  const [snapshots,   setSnapshots]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('overview')
  const [showAdd,     setShowAdd]     = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [addType,     setAddType]     = useState('asset')
  const [saving,      setSaving]      = useState(false)
  const [form,        setForm]        = useState({ name:'', amount:'', category:'Cash & Savings' })

  const fmt  = (n, sym='$') => `${sym}${Math.abs(Number(n||0)).toLocaleString(loc,{maximumFractionDigits:0})}`
  const fmtK = n => {
    const abs = Math.abs(n)
    return abs >= 1000000 ? `${(abs/1000000).toLocaleString(loc,{ maximumFractionDigits:1 })}M`
      : abs >= 1000 ? `${(abs/1000).toLocaleString(loc,{ maximumFractionDigits:0 })}k`
      : `${abs.toLocaleString(loc,{ maximumFractionDigits:0 })}`
  }

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setSymbol(SYMBOLS[data.currency] || '$') })
    loadAll()
  }, [userId])

  async function loadAll() {
    setLoading(true)
    const [
      { data: manualItems },
      { data: inv },
      { data: ln },
      { data: snaps },
    ] = await Promise.all([
      supabase.from('net_worth_items').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('investments').select('name,current_value,ticker').eq('user_id', userId),
      supabase.from('loans').select('label,remaining_balance,principal').eq('user_id', userId).eq('status','active'),
      supabase.from('net_worth_snapshots').select('month_year,net_worth').eq('user_id', userId).order('month_year', { ascending: true }).limit(12),
    ])
    setItems(manualItems || [])
    setInvestments(inv || [])
    setLoans(ln || [])
    setSnapshots(snaps || [])

    const now = new Date()
    const my  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    const totalAssets = (manualItems||[]).filter(i=>i.type==='asset').reduce((s,i)=>s+Number(i.amount),0)
      + (inv||[]).reduce((s,i)=>s+Number(i.current_value||0),0)
    const totalLiab   = (manualItems||[]).filter(i=>i.type==='liability').reduce((s,i)=>s+Number(i.amount),0)
      + (ln||[]).reduce((s,i)=>s+Number(i.remaining_balance||i.principal||0),0)
    const nw = totalAssets - totalLiab
    await supabase.from('net_worth_snapshots').upsert(
      { user_id: userId, month_year: my, net_worth: nw },
      { onConflict: 'user_id,month_year' }
    )
    setLoading(false)
  }

  async function addItem() {
    if (!form.name || !form.amount) return
    setSaving(true)
    await supabase.from('net_worth_items').insert({
      user_id: userId,
      type: addType,
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
    })
    await loadAll()
    setSaving(false)
    setShowAdd(false)
    setForm({ name:'', amount:'', category:'Cash & Savings' })
  }

  async function deleteItem(id) {
    await supabase.from('net_worth_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function updateItem() {
    if (!editItem || !form.name || !form.amount) return
    setSaving(true)
    await supabase.from('net_worth_items')
      .update({ name: form.name, amount: parseFloat(form.amount), category: form.category })
      .eq('id', editItem.id)
    await loadAll()
    setSaving(false)
    setEditItem(null)
    setForm({ name:'', amount:'', category:'Cash & Savings' })
  }

  function openEditItem(item) {
    setEditItem(item)
    setAddType(item.type)
    setForm({ name: item.name, amount: String(item.amount), category: item.category })
    setShowAdd(false)
  }

  const manualAssets = items.filter(i => i.type === 'asset').reduce((s,i) => s + Number(i.amount), 0)
  const investTotal  = investments.reduce((s,i) => s + Number(i.current_value||0), 0)
  const totalAssets  = manualAssets + investTotal

  const manualLiab   = items.filter(i => i.type === 'liability').reduce((s,i) => s + Number(i.amount), 0)
  const loanTotal    = loans.reduce((s,l) => s + Number(l.remaining_balance||l.principal||0), 0)
  const totalLiab    = manualLiab + loanTotal

  const netWorth     = totalAssets - totalLiab
  const assetPct     = totalAssets > 0 ? Math.round(totalAssets / (totalAssets + totalLiab) * 100) : 0

  const chartData = useMemo(() => snapshots.map(s => {
    const [, mo] = s.month_year.split('-')
    const d = new Date(2000, parseInt(mo, 10) - 1, 1)
    return { month: d.toLocaleDateString(loc, { month: 'short' }), netWorth: Number(s.net_worth) }
  }), [snapshots, loc])

  const trend = snapshots.length >= 2
    ? snapshots[snapshots.length-1].net_worth - snapshots[snapshots.length-2].net_worth
    : null

  const assetRows = [
    ...investments.map(i => ({ name: i.name || i.ticker, amount: Number(i.current_value||0), category:'Investments', isAuto:true })),
    ...items.filter(i => i.type === 'asset').map(i => ({ ...i, isAuto:false })),
  ]
  const liabRows = [
    ...loans.map(l => ({ name: l.label, amount: Number(l.remaining_balance||l.principal||0), category:'Loan', isAuto:true })),
    ...items.filter(i => i.type === 'liability').map(i => ({ ...i, isAuto:false })),
  ]

  const tabDefs = [
    ['overview', tr.nw_tab_overview],
    ['assets', tr.nw_tab_assets],
    ['liabilities', tr.nw_tab_liabilities],
  ]

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:`linear-gradient(135deg, ${netWorth>=0?'#1D9E75,#0F6E56':'#A32D2D,#7B1C1C'})`, borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:11, fontWeight:700, opacity:0.75, letterSpacing:'0.08em' }}>{tr.nw_badge}</div>
        <div style={{ fontSize:38, fontWeight:900, letterSpacing:'-1px', margin:'4px 0 2px' }}>
          {netWorth >= 0 ? '+' : '-'}{symbol}{fmtK(Math.abs(netWorth))}
        </div>
        {trend !== null && (
          <div style={{ fontSize:12, opacity:0.85 }}>
            {interpolate(tr.nw_vs_last, {
              arrow: trend >= 0 ? '▲' : '▼',
              sym: symbol,
              amt: fmtK(Math.abs(trend)),
            })}
          </div>
        )}
        <div style={{ marginTop:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, opacity:0.8, marginBottom:4 }}>
            <span>{interpolate(tr.nw_assets_pct, { n: assetPct })}</span>
            <span>{interpolate(tr.nw_liab_pct, { n: 100 - assetPct })}</span>
          </div>
          <div style={{ height:6, background:'rgba(255,255,255,0.25)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${assetPct}%`, background:'white', borderRadius:3 }} />
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'24px 0 16px' }}>
        <div style={{ background:'#E1F5EE', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#0F6E56', fontWeight:600, marginBottom:4 }}>{tr.nw_total_assets}</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#0F6E56' }}>{fmt(totalAssets, symbol)}</div>
          <div style={{ fontSize:10, color:'#1D9E75', marginTop:2 }}>
            {assetRows.length === 1 ? tr.nw_items_one : interpolate(tr.nw_items_many, { n: assetRows.length })}
          </div>
        </div>
        <div style={{ background:'#FCEBEB', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#A32D2D', fontWeight:600, marginBottom:4 }}>{tr.nw_total_liab}</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#A32D2D' }}>{fmt(totalLiab, symbol)}</div>
          <div style={{ fontSize:10, color:'#A32D2D', marginTop:2 }}>
            {liabRows.length === 1 ? tr.nw_items_one : interpolate(tr.nw_items_many, { n: liabRows.length })}
          </div>
        </div>
      </div>

      {chartData.length >= 2 && (
        <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{tr.nw_chart_title}</div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:12 }}>{interpolate(tr.nw_chart_sub, { n: chartData.length })}</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={netWorth>=0?'#1D9E75':'#A32D2D'} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={netWorth>=0?'#1D9E75':'#A32D2D'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:9, fill:'#9ca3af' }} axisLine={false} tickLine={false} width={38}
                tickFormatter={v => `${symbol}${fmtK(v)}`} />
              <Tooltip
                formatter={v => [`${symbol}${Number(v).toLocaleString(loc)}`, tr.nw_tooltip_nw]}
                contentStyle={{ fontSize:11, borderRadius:10, border:'1px solid #e5e7eb' }}
              />
              <Area type="monotone" dataKey="netWorth" stroke={netWorth>=0?'#1D9E75':'#A32D2D'}
                strokeWidth={2.5} fill="url(#nwGrad)" dot={{ r:3, fill:netWorth>=0?'#1D9E75':'#A32D2D' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {tabDefs.map(([v, l]) => (
          <button key={v} type="button" onClick={() => setTab(v)}
            style={{ flex:1, padding:'9px 4px', borderRadius:10, border:'1.5px solid', fontWeight:700, fontSize:11, cursor:'pointer',
              borderColor: tab===v ? '#1D9E75' : '#e5e7eb',
              background:  tab===v ? '#1D9E75' : 'white',
              color:       tab===v ? 'white'   : '#6b7280' }}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {assetRows.length > 0 && (
            <div style={{ background:'white', borderRadius:14, padding:'14px 16px', marginBottom:12, border:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#0F6E56', marginBottom:10 }}>{tr.nw_assets_section}</div>
              {assetRows.sort((a,b) => b.amount - a.amount).slice(0,5).map((row,i) => {
                const cat = catMap[row.category] || { icon:'📦', color:'#1D9E75' }
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:i<assetRows.length-1?10:0 }}>
                    <span style={{ fontSize:18 }}>{row.isAuto ? '📈' : cat.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>{row.name}</div>
                      <div style={{ height:4, background:'#f3f4f6', borderRadius:2, marginTop:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${totalAssets>0?row.amount/totalAssets*100:0}%`, background:row.isAuto?'#1D9E75':(catMap[row.category]?.color||'#1D9E75'), borderRadius:2 }} />
                      </div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0F6E56', flexShrink:0 }}>{fmt(row.amount, symbol)}</div>
                  </div>
                )
              })}
            </div>
          )}

          {liabRows.length > 0 && (
            <div style={{ background:'white', borderRadius:14, padding:'14px 16px', marginBottom:12, border:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#A32D2D', marginBottom:10 }}>{tr.nw_liab_section}</div>
              {liabRows.sort((a,b) => b.amount - a.amount).slice(0,5).map((row,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:i<liabRows.length-1?10:0 }}>
                  <span style={{ fontSize:18 }}>{row.isAuto ? '🏦' : (catMap[row.category]?.icon||'📋')}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>{row.name}</div>
                    <div style={{ height:4, background:'#f3f4f6', borderRadius:2, marginTop:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${totalLiab>0?row.amount/totalLiab*100:0}%`, background:'#A32D2D', borderRadius:2 }} />
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#A32D2D', flexShrink:0 }}>{fmt(row.amount, symbol)}</div>
                </div>
              ))}
            </div>
          )}

          {assetRows.length === 0 && liabRows.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 20px', color:'#9ca3af' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>💰</div>
              <div style={{ fontWeight:700, color:'#374151', marginBottom:6 }}>{loading ? tr.nw_empty_loading : tr.nw_empty_start}</div>
              {!loading && <div style={{ fontSize:13, marginBottom:16 }}>{tr.nw_empty_hint}</div>}
            </div>
          )}

          {(investments.length > 0 || loans.length > 0) && (
            <div style={{ background:'#EBF4FB', border:'1px solid #185FA5', borderRadius:12, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#185FA5' }}>
              {tr.nw_tip_lead}
              <Link to="/investments" style={{ color:'#185FA5', fontWeight:700 }}>{tr.nw_tip_inv}</Link>
              {tr.nw_tip_between}
              <Link to="/loans" style={{ color:'#185FA5', fontWeight:700 }}>{tr.nw_tip_loans}</Link>
              {tr.nw_tip_tail}
            </div>
          )}
        </>
      )}

      {tab === 'assets' && (
        <>
          <button type="button" onClick={() => { setAddType('asset'); setForm(f=>({...f,category:'Cash & Savings'})); setShowAdd(true) }}
            style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:14 }}>
            {tr.nw_add_asset}
          </button>

          {investments.length > 0 && (
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:6, marginLeft:2 }}>{tr.nw_auto_invest}</div>
          )}
          {investments.map((inv,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#E1F5EE', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #1D9E7533' }}>
              <span style={{ fontSize:22 }}>📈</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{inv.name || inv.ticker}</div>
                <div style={{ fontSize:10, color:'#0F6E56' }}>{tr.nw_inv_line}</div>
              </div>
              <div style={{ fontWeight:700, color:'#0F6E56', fontSize:14 }}>{fmt(inv.current_value, symbol)}</div>
            </div>
          ))}

          {items.filter(i=>i.type==='asset').length > 0 && (
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, margin:'10px 0 6px 2px' }}>{tr.nw_manual_assets}</div>
          )}
          {items.filter(i=>i.type==='asset').map(item => {
            const cat = catMap[item.category] || { icon:'📦', color:'#1D9E75' }
            return (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #e5e7eb' }}>
                <span style={{ fontSize:22 }}>{cat.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{item.name}</div>
                  <div style={{ fontSize:10, color:'#9ca3af' }}>{nwCatLabel(tr, item.category)}</div>
                </div>
                <div style={{ fontWeight:700, color:'#0F6E56', fontSize:14 }}>{fmt(item.amount, symbol)}</div>
                <button type="button" onClick={() => openEditItem(item)} style={{ color:'#9ca3af', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✏️</button>
                <button type="button" onClick={() => deleteItem(item.id)} style={{ color:'#d1d5db', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            )
          })}

          {assetRows.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px', color:'#9ca3af', fontSize:13 }}>{loading ? tr.nw_empty_loading : tr.nw_no_assets}</div>
          )}
        </>
      )}

      {tab === 'liabilities' && (
        <>
          <button type="button" onClick={() => { setAddType('liability'); setForm(f=>({...f,category:'Credit Card'})); setShowAdd(true) }}
            style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:14 }}>
            {tr.nw_add_liability}
          </button>

          {loans.length > 0 && (
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:6, marginLeft:2 }}>{tr.nw_auto_loans}</div>
          )}
          {loans.map((loan,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#FCEBEB', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #A32D2D33' }}>
              <span style={{ fontSize:22 }}>🏦</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{loan.label}</div>
                <div style={{ fontSize:10, color:'#A32D2D' }}>{tr.nw_loan_line}</div>
              </div>
              <div style={{ fontWeight:700, color:'#A32D2D', fontSize:14 }}>{fmt(loan.remaining_balance||loan.principal, symbol)}</div>
            </div>
          ))}

          {items.filter(i=>i.type==='liability').length > 0 && (
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, margin:'10px 0 6px 2px' }}>{tr.nw_manual_liab}</div>
          )}
          {items.filter(i=>i.type==='liability').map(item => {
            const cat = catMap[item.category] || { icon:'📋', color:'#A32D2D' }
            return (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #e5e7eb' }}>
                <span style={{ fontSize:22 }}>{cat.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{item.name}</div>
                  <div style={{ fontSize:10, color:'#9ca3af' }}>{nwCatLabel(tr, item.category)}</div>
                </div>
                <div style={{ fontWeight:700, color:'#A32D2D', fontSize:14 }}>{fmt(item.amount, symbol)}</div>
                <button type="button" onClick={() => openEditItem(item)} style={{ color:'#9ca3af', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✏️</button>
                <button type="button" onClick={() => deleteItem(item.id)} style={{ color:'#d1d5db', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            )
          })}

          {liabRows.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px', color:'#9ca3af', fontSize:13 }}>{loading ? tr.nw_empty_loading : tr.nw_liab_zero_hint}</div>
          )}
        </>
      )}

      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{addType === 'asset' ? tr.nw_edit_asset : tr.nw_edit_liab}</div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.nw_field_name}</label>
              <input type="text" autoFocus placeholder={tr.nw_field_name}
                value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{interpolate(tr.nw_current_value, { sym: symbol })}</label>
              <input type="number" placeholder="0.00" min="0" step="0.01"
                value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
            </div>

            <div className="form-group" style={{ marginBottom:16 }}>
              <label>{tr.nw_field_category}</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                {(addType==='asset' ? ASSET_CATS : LIAB_CATS).map(cat => (
                  <button key={cat.label} type="button" onClick={() => setForm(f=>({...f,category:cat.label}))}
                    style={{ padding:'5px 10px', borderRadius:20, border:'1.5px solid', fontSize:11, fontWeight:600, cursor:'pointer',
                      borderColor: form.category===cat.label ? cat.color : '#e5e7eb',
                      background:  form.category===cat.label ? cat.color+'18' : 'white',
                      color:       form.category===cat.label ? cat.color : '#6b7280' }}>
                    {cat.icon} {nwCatLabel(tr, cat.label)}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setEditItem(null)}
                style={{ padding:'13px', background:'#f3f4f6', color:'#666', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
                {tr.nw_cancel}
              </button>
              <button type="button" onClick={updateItem} disabled={saving || !form.name || !form.amount}
                style={{ flex:2, padding:'13px', background: addType==='asset' ? 'linear-gradient(135deg,#1D9E75,#0F6E56)' : 'linear-gradient(135deg,#A32D2D,#7B1C1C)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', opacity: form.name&&form.amount?1:0.5 }}>
                {saving ? tr.nw_saving_btn : tr.nw_save_changes}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{addType === 'asset' ? tr.nw_add_asset_modal : tr.nw_add_liab_modal}</div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.nw_field_name}</label>
              <input type="text" autoFocus placeholder={addType==='asset' ? tr.nw_ph_asset : tr.nw_ph_liab}
                value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{interpolate(tr.nw_current_value, { sym: symbol })}</label>
              <input type="number" placeholder="0.00" min="0" step="0.01"
                value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
            </div>

            <div className="form-group" style={{ marginBottom:16 }}>
              <label>{tr.nw_field_category}</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                {(addType==='asset' ? ASSET_CATS : LIAB_CATS).map(cat => (
                  <button key={cat.label} type="button" onClick={() => setForm(f=>({...f,category:cat.label}))}
                    style={{ padding:'5px 10px', borderRadius:20, border:'1.5px solid', fontSize:11, fontWeight:600, cursor:'pointer',
                      borderColor: form.category===cat.label ? cat.color : '#e5e7eb',
                      background:  form.category===cat.label ? cat.color+'18' : 'white',
                      color:       form.category===cat.label ? cat.color : '#6b7280' }}>
                    {cat.icon} {nwCatLabel(tr, cat.label)}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setShowAdd(false)}
                style={{ padding:'13px', background:'#f3f4f6', color:'#666', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
                {tr.nw_cancel}
              </button>
              <button type="button" onClick={addItem} disabled={saving || !form.name || !form.amount}
                style={{ flex:2, padding:'13px', background: addType==='asset' ? 'linear-gradient(135deg,#1D9E75,#0F6E56)' : 'linear-gradient(135deg,#A32D2D,#7B1C1C)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', opacity: form.name&&form.amount?1:0.5 }}>
                {saving ? tr.nw_saving_btn : tr.nw_add_save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
