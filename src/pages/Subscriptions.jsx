import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SYMBOLS = { USD:'$',EUR:'€',GBP:'£',CAD:'C$',AUD:'A$',NGN:'₦',KES:'KSh',GHS:'₵',ZAR:'R',XOF:'CFA',XAF:'FCFA',INR:'₹',BRL:'R$',MXN:'MX$',CNY:'¥',JPY:'¥',KRW:'₩',RUB:'₽' }

const CATEGORIES = [
  { label:'Entertainment', icon:'🎬', color:'#534AB7' },
  { label:'Music',         icon:'🎵', color:'#C2185B' },
  { label:'Software',      icon:'💻', color:'#185FA5' },
  { label:'Health',        icon:'💪', color:'#1D9E75' },
  { label:'Food',          icon:'🍔', color:'#BA7517' },
  { label:'Utilities',     icon:'⚡', color:'#5F5E5A' },
  { label:'Finance',       icon:'💳', color:'#3B6D11' },
  { label:'Other',         icon:'📦', color:'#9ca3af' },
]

const CYCLES = ['monthly','yearly','weekly']

const POPULAR = [
  { name:'Netflix',    icon:'🎬', category:'Entertainment', amount:15.99, billing_cycle:'monthly' },
  { name:'Spotify',   icon:'🎵', category:'Music',         amount:9.99,  billing_cycle:'monthly' },
  { name:'YouTube Premium', icon:'▶️', category:'Entertainment', amount:13.99, billing_cycle:'monthly' },
  { name:'Apple iCloud',    icon:'☁️', category:'Software',  amount:0.99,  billing_cycle:'monthly' },
  { name:'Amazon Prime',    icon:'📦', category:'Other',     amount:14.99, billing_cycle:'monthly' },
  { name:'Disney+',   icon:'✨', category:'Entertainment', amount:7.99,  billing_cycle:'monthly' },
  { name:'ChatGPT',   icon:'🤖', category:'Software',      amount:20,    billing_cycle:'monthly' },
  { name:'Gym',       icon:'💪', category:'Health',         amount:40,    billing_cycle:'monthly' },
]

const catMap = Object.fromEntries(CATEGORIES.map(c => [c.label, c]))

function toMonthly(amount, cycle) {
  if (cycle === 'yearly')  return amount / 12
  if (cycle === 'weekly')  return amount * 52 / 12
  return amount
}

function toYearly(amount, cycle) {
  if (cycle === 'yearly') return amount
  if (cycle === 'weekly') return amount * 52
  return amount * 12
}

const fmt = (n, sym='$') => `${sym}${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`

function nextBillingDate(cycle) {
  const d = new Date()
  if (cycle === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
  else d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Subscriptions({ session }) {
  const userId = session.user.id
  const [subs, setSubs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [symbol, setSymbol]     = useState('$')
  const [showAdd, setShowAdd]   = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [editSub, setEditSub]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [filterCat, setFilterCat] = useState('All')
  const [form, setForm] = useState({
    name: '', icon: '📦', amount: '', billing_cycle: 'monthly',
    category: 'Entertainment', next_billing_date: nextBillingDate('monthly'),
  })

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setSymbol(SYMBOLS[data.currency] || '$') })
    loadSubs()
  }, [userId])

  async function loadSubs() {
    setLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setSubs(data || [])
    setLoading(false)
  }

  async function addSub(subData) {
    setSaving(true)
    await supabase.from('subscriptions').insert({ ...subData, user_id: userId })
    await loadSubs()
    setSaving(false)
    setShowAdd(false)
    setShowQuick(false)
    resetForm()
  }

  async function deleteSub(id) {
    await supabase.from('subscriptions').delete().eq('id', id)
    setSubs(prev => prev.filter(s => s.id !== id))
  }

  async function updateSub() {
    if (!editSub || !form.name || !form.amount) return
    setSaving(true)
    await supabase.from('subscriptions').update({
      name: form.name, icon: form.icon, amount: parseFloat(form.amount),
      billing_cycle: form.billing_cycle, category: form.category,
      next_billing_date: form.next_billing_date,
    }).eq('id', editSub.id)
    await loadSubs()
    setSaving(false)
    setEditSub(null)
    resetForm()
  }

  function openEdit(sub) {
    setEditSub(sub)
    setForm({ name: sub.name, icon: sub.icon || '📦', amount: String(sub.amount), billing_cycle: sub.billing_cycle, category: sub.category, next_billing_date: sub.next_billing_date || nextBillingDate(sub.billing_cycle) })
    setShowAdd(false); setShowQuick(false)
  }

  function resetForm() {
    setForm({ name:'', icon:'📦', amount:'', billing_cycle:'monthly', category:'Entertainment', next_billing_date: nextBillingDate('monthly') })
  }

  function handleCycleChange(cycle) {
    setForm(f => ({ ...f, billing_cycle: cycle, next_billing_date: nextBillingDate(cycle) }))
  }

  const filtered = filterCat === 'All' ? subs : subs.filter(s => s.category === filterCat)
  const totalMonthly = subs.reduce((s, sub) => s + toMonthly(Number(sub.amount), sub.billing_cycle), 0)
  const totalYearly  = subs.reduce((s, sub) => s + toYearly(Number(sub.amount), sub.billing_cycle), 0)

  // Group by category for summary
  const byCat = CATEGORIES.map(cat => ({
    ...cat,
    total: subs.filter(s => s.category === cat.label).reduce((s, sub) => s + toMonthly(Number(sub.amount), sub.billing_cycle), 0),
    count: subs.filter(s => s.category === cat.label).length,
  })).filter(c => c.count > 0)

  // Upcoming in next 7 days
  const upcoming = subs
    .map(s => ({ ...s, days: daysUntil(s.next_billing_date) }))
    .filter(s => s.days !== null && s.days >= 0 && s.days <= 7)
    .sort((a, b) => a.days - b.days)

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#534AB7,#3730a3)', borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>🔄</div>
        <h2 style={{ color:'white', margin:'0 0 2px', fontSize:22, fontWeight:800 }}>Subscriptions</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>Track & cancel what you don't use</p>
      </div>

      {/* Summary card */}
      <div style={{ background:'white', borderRadius:16, padding:'20px 16px', margin:'24px 0 16px', border:'1px solid #e5e7eb', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom: byCat.length ? 16 : 0 }}>
          <div>
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:4 }}>MONTHLY TOTAL</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#534AB7' }}>{fmt(totalMonthly, symbol)}</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{subs.length} subscription{subs.length !== 1 ? 's' : ''}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:4 }}>YEARLY TOTAL</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#374151' }}>{fmt(totalYearly, symbol)}</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>per year</div>
          </div>
        </div>

        {/* Category bars */}
        {byCat.length > 0 && (
          <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:14 }}>
            {byCat.sort((a,b) => b.total - a.total).map((cat, i) => (
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:14 }}>{cat.icon}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{cat.label}</span>
                    <span style={{ fontSize:10, color:'#9ca3af' }}>({cat.count})</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:cat.color }}>{fmt(cat.total, symbol)}/mo</span>
                </div>
                <div style={{ height:5, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${totalMonthly > 0 ? (cat.total/totalMonthly*100) : 0}%`, background:cat.color, borderRadius:3 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming billing alert */}
      {upcoming.length > 0 && (
        <div style={{ background:'#FFF3CD', border:'1px solid #BA7517', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#7A4D0F', marginBottom:8 }}>⏰ Billing soon</div>
          {upcoming.map(s => (
            <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span>{s.icon}</span>
                <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{s.name}</span>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#BA7517' }}>{fmt(s.amount, symbol)}</span>
                <span style={{ fontSize:10, color:'#9ca3af', marginLeft:6 }}>
                  {s.days === 0 ? 'today' : `in ${s.days}d`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <button onClick={() => { setShowQuick(true); setShowAdd(false) }}
          style={{ flex:1, padding:'12px', background:'#534AB7', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          ⚡ Quick Add
        </button>
        <button onClick={() => { setShowAdd(true); setShowQuick(false) }}
          style={{ flex:1, padding:'12px', background:'white', color:'#534AB7', border:'2px solid #534AB7', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          + Custom
        </button>
      </div>

      {/* Category filter */}
      {subs.length > 0 && (
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none', marginBottom:12 }}>
          {['All', ...CATEGORIES.filter(c => subs.some(s => s.category === c.label)).map(c => c.label)].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              style={{ flexShrink:0, padding:'5px 12px', borderRadius:20, border:'1.5px solid', fontSize:11, fontWeight:600, cursor:'pointer',
                borderColor: filterCat===cat ? '#534AB7' : '#e5e7eb',
                background: filterCat===cat ? '#534AB7' : 'white',
                color: filterCat===cat ? 'white' : '#6b7280',
              }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Subscriptions list */}
      {loading && <div className="spinner" />}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔄</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#374151', marginBottom:6 }}>No subscriptions yet</div>
          <div style={{ fontSize:13, color:'#9ca3af', marginBottom:20 }}>Add your recurring bills to see your true monthly cost</div>
        </div>
      )}

      {!loading && filtered.map(sub => {
        const cat = catMap[sub.category] || catMap['Other']
        const days = daysUntil(sub.next_billing_date)
        const monthlyEq = toMonthly(Number(sub.amount), sub.billing_cycle)
        return (
          <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:14, padding:'14px 16px', marginBottom:8, border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
            {/* Icon */}
            <div style={{ width:44, height:44, borderRadius:12, background:cat.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              {sub.icon}
            </div>
            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#111827' }}>{sub.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                <span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background:cat.color+'18', color:cat.color, fontWeight:600 }}>{cat.icon} {sub.category}</span>
                {days !== null && (
                  <span style={{ fontSize:10, color: days <= 3 ? '#A32D2D' : '#9ca3af' }}>
                    {days === 0 ? '🔔 due today' : days < 0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
                  </span>
                )}
              </div>
            </div>
            {/* Amount */}
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#534AB7' }}>{fmt(sub.amount, symbol)}</div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>/{sub.billing_cycle === 'yearly' ? 'yr' : sub.billing_cycle === 'weekly' ? 'wk' : 'mo'}</div>
              {sub.billing_cycle !== 'monthly' && (
                <div style={{ fontSize:9, color:'#d1d5db' }}>{fmt(monthlyEq, symbol)}/mo</div>
              )}
            </div>
            {/* Edit & Delete */}
            <button onClick={() => openEdit(sub)}
              style={{ fontSize:14, color:'#9ca3af', background:'none', border:'none', cursor:'pointer', padding:'4px', flexShrink:0 }}>✏️</button>
            <button onClick={() => deleteSub(sub.id)}
              style={{ fontSize:14, color:'#d1d5db', background:'none', border:'none', cursor:'pointer', padding:'4px', flexShrink:0 }}>✕</button>
          </div>
        )
      })}

      {/* Quick Add modal */}
      {showQuick && (
        <div className="modal-overlay" onClick={() => setShowQuick(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">⚡ Quick Add</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {POPULAR.map((p, i) => (
                <button key={i} onClick={() => addSub({ ...p, next_billing_date: nextBillingDate(p.billing_cycle) })}
                  style={{ padding:'12px 10px', borderRadius:12, border:'1.5px solid #e5e7eb', background:'white', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{p.name}</div>
                    <div style={{ fontSize:10, color:'#9ca3af' }}>{fmt(p.amount, symbol)}/mo</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowQuick(false)}
              style={{ width:'100%', padding:'13px', background:'#f3f4f6', border:'none', borderRadius:10, fontWeight:600, color:'#666', cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Custom Add modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); resetForm() }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">+ Add Subscription</div>

            {/* Icon picker row */}
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:6, marginBottom:12, scrollbarWidth:'none' }}>
              {['📦','🎬','🎵','💻','💪','🍔','⚡','💳','☁️','▶️','✨','🤖','📱','🎮','📰','🏃','🌐','🔒'].map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  style={{ flexShrink:0, width:36, height:36, borderRadius:10, border:`2px solid ${form.icon===ic?'#534AB7':'#e5e7eb'}`, background:form.icon===ic?'#f0effe':'white', fontSize:18, cursor:'pointer' }}>
                  {ic}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>Name</label>
              <input type="text" placeholder="e.g. Netflix, Gym, iCloud…" autoFocus
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" placeholder="0.00" min="0" step="0.01"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Billing</label>
                <select value={form.billing_cycle} onChange={e => handleCycleChange(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14, background:'white' }}>
                  {CYCLES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>Category</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.label} onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                    style={{ padding:'5px 10px', borderRadius:20, border:'1.5px solid', fontSize:11, fontWeight:600, cursor:'pointer',
                      borderColor: form.category===cat.label ? cat.color : '#e5e7eb',
                      background: form.category===cat.label ? cat.color+'18' : 'white',
                      color: form.category===cat.label ? cat.color : '#6b7280',
                    }}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom:16 }}>
              <label>Next billing date</label>
              <input type="date" value={form.next_billing_date}
                onChange={e => setForm(f => ({ ...f, next_billing_date: e.target.value }))} />
            </div>

            <div className="modal-actions">
              <button onClick={() => { setShowAdd(false); resetForm() }}
                style={{ padding:'13px', background:'#f3f4f6', color:'#666', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={() => addSub(form)} disabled={saving || !form.name || !form.amount}
                style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#534AB7,#3730a3)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', opacity: form.name && form.amount ? 1 : 0.5 }}>
                {saving ? 'Saving…' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editSub && (
        <div className="modal-overlay" onClick={() => { setEditSub(null); resetForm() }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">✏️ Edit Subscription</div>
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:6, marginBottom:12, scrollbarWidth:'none' }}>
              {['📦','🎬','🎵','💻','💪','🍔','⚡','💳','☁️','▶️','✨','🤖','📱','🎮','📰','🏃','🌐','🔒'].map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  style={{ flexShrink:0, width:36, height:36, borderRadius:10, border:`2px solid ${form.icon===ic?'#534AB7':'#e5e7eb'}`, background:form.icon===ic?'#f0effe':'white', fontSize:18, cursor:'pointer' }}>{ic}</button>
              ))}
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label>Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Billing</label>
                <select value={form.billing_cycle} onChange={e => handleCycleChange(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14, background:'white' }}>
                  {CYCLES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label>Category</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.label} onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                    style={{ padding:'5px 10px', borderRadius:20, border:'1.5px solid', fontSize:11, fontWeight:600, cursor:'pointer',
                      borderColor: form.category===cat.label ? cat.color : '#e5e7eb',
                      background:  form.category===cat.label ? cat.color+'18' : 'white',
                      color:       form.category===cat.label ? cat.color : '#6b7280' }}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label>Next billing date</label>
              <input type="date" value={form.next_billing_date} onChange={e => setForm(f => ({ ...f, next_billing_date: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button onClick={() => { setEditSub(null); resetForm() }}
                style={{ padding:'13px', background:'#f3f4f6', color:'#666', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={updateSub} disabled={saving || !form.name || !form.amount}
                style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#534AB7,#3730a3)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer', opacity: form.name && form.amount ? 1 : 0.5 }}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
