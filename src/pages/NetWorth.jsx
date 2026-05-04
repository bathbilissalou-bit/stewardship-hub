import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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

const fmt  = (n, sym='$') => `${sym}${Math.abs(Number(n||0)).toLocaleString('en-US',{maximumFractionDigits:0})}`
const fmtK = n => {
  const abs = Math.abs(n)
  return abs >= 1000000 ? `${(abs/1000000).toFixed(1)}M` : abs >= 1000 ? `${(abs/1000).toFixed(0)}k` : `${abs.toFixed(0)}`
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function NetWorth({ session }) {
  const userId = session.user.id
  const [symbol,      setSymbol]      = useState('$')
  const [items,       setItems]       = useState([])     // manual net_worth_items
  const [investments, setInvestments] = useState([])
  const [loans,       setLoans]       = useState([])
  const [snapshots,   setSnapshots]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('overview')  // overview | assets | liabilities
  const [showAdd,     setShowAdd]     = useState(false)
  const [editItem,    setEditItem]    = useState(null)
  const [addType,     setAddType]     = useState('asset')     // asset | liability
  const [saving,      setSaving]      = useState(false)
  const [form,        setForm]        = useState({ name:'', amount:'', category:'Cash & Savings' })

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

    // Save today's snapshot
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

  // ── Totals ──────────────────────────────────────────────────────────────────
  const manualAssets = items.filter(i => i.type === 'asset').reduce((s,i) => s + Number(i.amount), 0)
  const investTotal  = investments.reduce((s,i) => s + Number(i.current_value||0), 0)
  const totalAssets  = manualAssets + investTotal

  const manualLiab   = items.filter(i => i.type === 'liability').reduce((s,i) => s + Number(i.amount), 0)
  const loanTotal    = loans.reduce((s,l) => s + Number(l.remaining_balance||l.principal||0), 0)
  const totalLiab    = manualLiab + loanTotal

  const netWorth     = totalAssets - totalLiab
  const assetPct     = totalAssets > 0 ? Math.round(totalAssets / (totalAssets + totalLiab) * 100) : 0

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = snapshots.map(s => {
    const [yr, mo] = s.month_year.split('-')
    return { month: MONTH_LABELS[parseInt(mo,10)-1], netWorth: Number(s.net_worth) }
  })

  const trend = snapshots.length >= 2
    ? snapshots[snapshots.length-1].net_worth - snapshots[snapshots.length-2].net_worth
    : null

  // ── Asset / Liability rows ──────────────────────────────────────────────────
  const assetRows = [
    ...investments.map(i => ({ name: i.name || i.ticker, amount: Number(i.current_value||0), category:'Investments', isAuto:true })),
    ...items.filter(i => i.type === 'asset').map(i => ({ ...i, isAuto:false })),
  ]
  const liabRows = [
    ...loans.map(l => ({ name: l.label, amount: Number(l.remaining_balance||l.principal||0), category:'Loan', isAuto:true })),
    ...items.filter(i => i.type === 'liability').map(i => ({ ...i, isAuto:false })),
  ]

  return (
    <div style={{ paddingBottom:100 }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${netWorth>=0?'#1D9E75,#0F6E56':'#A32D2D,#7B1C1C'})`, borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:11, fontWeight:700, opacity:0.75, letterSpacing:'0.08em' }}>NET WORTH</div>
        <div style={{ fontSize:38, fontWeight:900, letterSpacing:'-1px', margin:'4px 0 2px' }}>
          {netWorth >= 0 ? '+' : '-'}{symbol}{fmtK(Math.abs(netWorth))}
        </div>
        {trend !== null && (
          <div style={{ fontSize:12, opacity:0.85 }}>
            {trend >= 0 ? '▲' : '▼'} {symbol}{fmtK(Math.abs(trend))} vs last month
          </div>
        )}
        {/* Assets vs Liabilities bar */}
        <div style={{ marginTop:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, opacity:0.8, marginBottom:4 }}>
            <span>Assets {assetPct}%</span>
            <span>Liabilities {100-assetPct}%</span>
          </div>
          <div style={{ height:6, background:'rgba(255,255,255,0.25)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${assetPct}%`, background:'white', borderRadius:3 }} />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'24px 0 16px' }}>
        <div style={{ background:'#E1F5EE', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#0F6E56', fontWeight:600, marginBottom:4 }}>💚 Total Assets</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#0F6E56' }}>{fmt(totalAssets, symbol)}</div>
          <div style={{ fontSize:10, color:'#1D9E75', marginTop:2 }}>{assetRows.length} item{assetRows.length!==1?'s':''}</div>
        </div>
        <div style={{ background:'#FCEBEB', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#A32D2D', fontWeight:600, marginBottom:4 }}>🔴 Total Liabilities</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#A32D2D' }}>{fmt(totalLiab, symbol)}</div>
          <div style={{ fontSize:10, color:'#A32D2D', marginTop:2 }}>{liabRows.length} item{liabRows.length!==1?'s':''}</div>
        </div>
      </div>

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <div style={{ background:'white', borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>📈 Net Worth Over Time</div>
          <div style={{ fontSize:11, color:'#9ca3af', marginBottom:12 }}>Last {chartData.length} months</div>
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
                formatter={v => [`${symbol}${Number(v).toLocaleString()}`, 'Net Worth']}
                contentStyle={{ fontSize:11, borderRadius:10, border:'1px solid #e5e7eb' }}
              />
              <Area type="monotone" dataKey="netWorth" stroke={netWorth>=0?'#1D9E75':'#A32D2D'}
                strokeWidth={2.5} fill="url(#nwGrad)" dot={{ r:3, fill:netWorth>=0?'#1D9E75':'#A32D2D' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['overview','📊 Overview'],['assets','💚 Assets'],['liabilities','🔴 Liabilities']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ flex:1, padding:'9px 4px', borderRadius:10, border:'1.5px solid', fontWeight:700, fontSize:11, cursor:'pointer',
              borderColor: tab===v ? '#1D9E75' : '#e5e7eb',
              background:  tab===v ? '#1D9E75' : 'white',
              color:       tab===v ? 'white'   : '#6b7280' }}>
            {l}
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {/* ── OVERVIEW TAB ── */}
      {!loading && tab === 'overview' && (
        <>
          {/* Assets breakdown */}
          {assetRows.length > 0 && (
            <div style={{ background:'white', borderRadius:14, padding:'14px 16px', marginBottom:12, border:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#0F6E56', marginBottom:10 }}>💚 Assets</div>
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

          {/* Liabilities breakdown */}
          {liabRows.length > 0 && (
            <div style={{ background:'white', borderRadius:14, padding:'14px 16px', marginBottom:12, border:'1px solid #e5e7eb' }}>
              <div style={{ fontWeight:700, fontSize:13, color:'#A32D2D', marginBottom:10 }}>🔴 Liabilities</div>
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
              <div style={{ fontWeight:700, color:'#374151', marginBottom:6 }}>Start tracking your net worth</div>
              <div style={{ fontSize:13, marginBottom:16 }}>Add your assets and liabilities to see your full financial picture</div>
            </div>
          )}

          {/* Tip if investments/loans exist */}
          {(investments.length > 0 || loans.length > 0) && (
            <div style={{ background:'#EBF4FB', border:'1px solid #185FA5', borderRadius:12, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#185FA5' }}>
              ✦ Your <Link to="/investments" style={{ color:'#185FA5', fontWeight:700 }}>investments</Link> and <Link to="/loans" style={{ color:'#185FA5', fontWeight:700 }}>loans</Link> are included automatically.
            </div>
          )}
        </>
      )}

      {/* ── ASSETS TAB ── */}
      {!loading && tab === 'assets' && (
        <>
          <button onClick={() => { setAddType('asset'); setForm(f=>({...f,category:'Cash & Savings'})); setShowAdd(true) }}
            style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:14 }}>
            + Add Asset
          </button>

          {/* Auto-imported investments */}
          {investments.length > 0 && (
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:6, marginLeft:2 }}>AUTO-IMPORTED FROM INVESTMENTS</div>
          )}
          {investments.map((inv,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#E1F5EE', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #1D9E7533' }}>
              <span style={{ fontSize:22 }}>📈</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{inv.name || inv.ticker}</div>
                <div style={{ fontSize:10, color:'#0F6E56' }}>Investment · auto-synced</div>
              </div>
              <div style={{ fontWeight:700, color:'#0F6E56', fontSize:14 }}>{fmt(inv.current_value, symbol)}</div>
            </div>
          ))}

          {/* Manual assets */}
          {items.filter(i=>i.type==='asset').length > 0 && (
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, margin:'10px 0 6px 2px' }}>MANUAL ASSETS</div>
          )}
          {items.filter(i=>i.type==='asset').map(item => {
            const cat = catMap[item.category] || { icon:'📦', color:'#1D9E75' }
            return (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #e5e7eb' }}>
                <span style={{ fontSize:22 }}>{cat.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{item.name}</div>
                  <div style={{ fontSize:10, color:'#9ca3af' }}>{item.category}</div>
                </div>
                <div style={{ fontWeight:700, color:'#0F6E56', fontSize:14 }}>{fmt(item.amount, symbol)}</div>
                <button onClick={() => openEditItem(item)} style={{ color:'#9ca3af', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✏️</button>
                <button onClick={() => deleteItem(item.id)} style={{ color:'#d1d5db', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            )
          })}

          {assetRows.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px', color:'#9ca3af', fontSize:13 }}>No assets yet — add cash, property, vehicle or other assets</div>
          )}
        </>
      )}

      {/* ── LIABILITIES TAB ── */}
      {!loading && tab === 'liabilities' && (
        <>
          <button onClick={() => { setAddType('liability'); setForm(f=>({...f,category:'Credit Card'})); setShowAdd(true) }}
            style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:14 }}>
            + Add Liability
          </button>

          {/* Auto-imported loans */}
          {loans.length > 0 && (
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:6, marginLeft:2 }}>AUTO-IMPORTED FROM LOANS</div>
          )}
          {loans.map((loan,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#FCEBEB', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #A32D2D33' }}>
              <span style={{ fontSize:22 }}>🏦</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{loan.label}</div>
                <div style={{ fontSize:10, color:'#A32D2D' }}>Loan · auto-synced</div>
              </div>
              <div style={{ fontWeight:700, color:'#A32D2D', fontSize:14 }}>{fmt(loan.remaining_balance||loan.principal, symbol)}</div>
            </div>
          ))}

          {/* Manual liabilities */}
          {items.filter(i=>i.type==='liability').length > 0 && (
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, margin:'10px 0 6px 2px' }}>MANUAL LIABILITIES</div>
          )}
          {items.filter(i=>i.type==='liability').map(item => {
            const cat = catMap[item.category] || { icon:'📋', color:'#A32D2D' }
            return (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid #e5e7eb' }}>
                <span style={{ fontSize:22 }}>{cat.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{item.name}</div>
                  <div style={{ fontSize:10, color:'#9ca3af' }}>{item.category}</div>
                </div>
                <div style={{ fontWeight:700, color:'#A32D2D', fontSize:14 }}>{fmt(item.amount, symbol)}</div>
                <button onClick={() => openEditItem(item)} style={{ color:'#9ca3af', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✏️</button>
                <button onClick={() => deleteItem(item.id)} style={{ color:'#d1d5db', background:'none', border:'none', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
            )
          })}

          {liabRows.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px', color:'#9ca3af', fontSize:13 }}>No liabilities — great! Add credit cards or other debts if any</div>
          )}
        </>
      )}

      {/* ── Edit Modal ── */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{addType === 'asset' ? '✏️ Edit Asset' : '✏️ Edit Liability'}</div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>Name</label>
              <input type="text" autoFocus placeholder="Name"
                value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>Current Value ({symbol})</label>
              <input type="number" placeholder="0.00" min="0" step="0.01"
                value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
            </div>

            <div className="form-group" style={{ marginBottom:16 }}>
              <label>Category</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                {(addType==='asset' ? ASSET_CATS : LIAB_CATS).map(cat => (
                  <button key={cat.label} onClick={() => setForm(f=>({...f,category:cat.label}))}
                    style={{ padding:'5px 10px', borderRadius:20, border:'1.5px solid', fontSize:11, fontWeight:600, cursor:'pointer',
                      borderColor: form.category===cat.label ? cat.color : '#e5e7eb',
                      background:  form.category===cat.label ? cat.color+'18' : 'white',
                      color:       form.category===cat.label ? cat.color : '#6b7280' }}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setEditItem(null)}
                style={{ padding:'13px', background:'#f3f4f6', color:'#666', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={updateItem} disabled={saving || !form.name || !form.amount}
                style={{ flex:2, padding:'13px', background: addType==='asset' ? 'linear-gradient(135deg,#1D9E75,#0F6E56)' : 'linear-gradient(135deg,#A32D2D,#7B1C1C)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', opacity: form.name&&form.amount?1:0.5 }}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{addType === 'asset' ? '💚 Add Asset' : '🔴 Add Liability'}</div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>Name</label>
              <input type="text" autoFocus placeholder={addType==='asset' ? 'e.g. Savings Account, House…' : 'e.g. Visa Card, Mortgage…'}
                value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>Current Value ({symbol})</label>
              <input type="number" placeholder="0.00" min="0" step="0.01"
                value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
            </div>

            <div className="form-group" style={{ marginBottom:16 }}>
              <label>Category</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                {(addType==='asset' ? ASSET_CATS : LIAB_CATS).map(cat => (
                  <button key={cat.label} onClick={() => setForm(f=>({...f,category:cat.label}))}
                    style={{ padding:'5px 10px', borderRadius:20, border:'1.5px solid', fontSize:11, fontWeight:600, cursor:'pointer',
                      borderColor: form.category===cat.label ? cat.color : '#e5e7eb',
                      background:  form.category===cat.label ? cat.color+'18' : 'white',
                      color:       form.category===cat.label ? cat.color : '#6b7280' }}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowAdd(false)}
                style={{ padding:'13px', background:'#f3f4f6', color:'#666', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={addItem} disabled={saving || !form.name || !form.amount}
                style={{ flex:2, padding:'13px', background: addType==='asset' ? 'linear-gradient(135deg,#1D9E75,#0F6E56)' : 'linear-gradient(135deg,#A32D2D,#7B1C1C)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', opacity: form.name&&form.amount?1:0.5 }}>
                {saving ? 'Saving…' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
