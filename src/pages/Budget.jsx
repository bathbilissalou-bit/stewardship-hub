import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useT, getLang, LANG_LOCALES } from '../lib/i18n'
import { Link } from 'react-router-dom'


const SMART_CATEGORIES = {
  Needs: ['rent','rental','mortgage','electric','electricity','water','gas','internet','phone','insurance','grocery','groceries','food','transport','bus','metro','subway','train','car payment','loan','medical','doctor','hospital','pharmacy','childcare','school','tuition','utilities','bill','tax'],
  Wants: ['restaurant','coffee','starbucks','netflix','spotify','amazon','shopping','clothes','clothing','entertainment','gym','vacation','travel','hotel','airbnb','uber','lyft','dining','bar','movie','cinema','games','gaming','apple','subscription','salon','haircut','nails','beauty'],
  Giving: ['church','tithe','offering','donation','charity','mission','ministry','gift','giving','nonprofit','volunteer','zakat','sadaqah'],
  Savings: ['savings','emergency','fund','reserve','deposit','piggy','invest','401k','ira','retirement','college','future'],
  Investments: ['stock','stocks','crypto','bitcoin','ethereum','index','fund','etf','roth','brokerage','robinhood','fidelity','vanguard','real estate','property','rental income','dividend'],
}

function smartCategory(label) {
  const lower = (label||'').toLowerCase()
  for (const [cat, keywords] of Object.entries(SMART_CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'Needs'
}

const CATEGORIES = ['Needs', 'Wants', 'Giving', 'Savings', 'Investments']
const fmt = n => Number(n||0).toLocaleString(LANG_LOCALES[getLang()]||'en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })

function getMonthYear(offset=0) {
  const d = new Date(); d.setMonth(d.getMonth()+offset)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
function formatMonthLabel(my) {
  const [y,m] = my.split('-')
  return new Date(y,m-1).toLocaleDateString('en-US',{month:'long',year:'numeric'})
}
function getAllMonths() {
  const year = new Date().getFullYear()
  return Array.from({length:12},(_,i)=>{
    const m = String(i+1).padStart(2,'0')
    return { value:`${year}-${m}`, label:new Date(year,i).toLocaleDateString('en-US',{month:'long',year:'numeric'}) }
  })
}

const CELL = { padding:'8px 10px', borderRight:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', fontSize:12, background:'white', color:'#1a1a1a' }
const HEAD = { ...CELL, background:'#f3f4f6', fontWeight:600, fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }
const INPUT_CELL = { ...CELL, padding:0 }

function EditableCell({ value, onChange, type='text', placeholder='' }) {
  return (
    <td style={INPUT_CELL}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'8px 10px', border:'none', outline:'none', fontSize:13, background:'transparent', color:'#1a1a1a' }} />
    </td>
  )
}
function SelectCell({ value, onChange, options }) {
  return (
    <td style={INPUT_CELL}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'8px 6px', border:'none', outline:'none', fontSize:12, background:'transparent', color:'#1a1a1a', appearance:'none' }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </td>
  )
}

export default function Budget({ session }) {
  const tr = useT()
  const [monthOffset, setMonthOffset] = useState(0)
  const [entries, setEntries] = useState([])
  const [templates, setTemplates] = useState([])
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [newRow, setNewRow] = useState(null)
  const [toast, setToast] = useState(null)
  const [toastType, setToastType] = useState('success')
  const [showTemplates, setShowTemplates] = useState(false)
  const updateTimeout = useRef(null)
  const prevEditingId = useRef(null)
  const monthYear = getMonthYear(monthOffset)
  const currentMonthYear = getMonthYear(0)
  const userId = session.user.id
  const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦', KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA', INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' }

  async function fetchEntries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('budget_entries').select('*')
      .eq('user_id', userId).eq('month_year', monthYear)
      .order('created_at', { ascending:true })
    if (error) showToast('⚠️ Could not load entries — check connection', 'error')
    setEntries(data || [])
    setLoading(false)
  }

  async function fetchTemplates() {
    const { data } = await supabase.from('recurring_templates').select('*').eq('user_id', userId).order('created_at',{ascending:true})
    setTemplates(data||[])
  }

  async function applyRecurring() {
    if (!templates.length) return
    setApplying(true)
    const rows = templates.map(t => ({ user_id:userId, month_year:monthYear, type:t.type, label:t.label, amount:t.amount, category:t.category||null }))
    await supabase.from('budget_entries').insert(rows)
    await fetchEntries()
    setApplying(false)
    showToast(`✓ Applied ${rows.length} recurring entries`)
  }

  async function deleteTemplate(id) {
    await supabase.from('recurring_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    async function loadCurrency() {
      const { data } = await supabase.from('users').select('currency').eq('id', session.user.id).single()
      if (data?.currency) setCurrencySymbol(SYMBOLS[data.currency]||'$')
    }
    loadCurrency()
    fetchTemplates()
  }, [])

  useEffect(() => { fetchEntries() }, [monthYear])

  useEffect(() => {
    if (prevEditingId.current !== null && editingId === null) {
      showToast('✓ Saved')
    }
    prevEditingId.current = editingId
  }, [editingId])

  const income = entries.filter(e=>e.type==='income').reduce((s,e)=>s+Number(e.amount),0)
  const expenses = entries.filter(e=>e.type==='expense').reduce((s,e)=>s+Number(e.amount),0)
  const surplus = income - expenses
  const catTotals = CATEGORIES.reduce((acc,cat) => { acc[cat]=entries.filter(e=>e.type==='expense'&&e.category===cat).reduce((s,e)=>s+Number(e.amount),0); return acc },{})

  function showToast(msg, type='success') {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(null), type === 'error' ? 6000 : 2000)
  }

  async function updateEntry(id, field, value) {
    setEntries(prev=>prev.map(e=>e.id===id?{...e,[field]:value}:e))
    clearTimeout(updateTimeout.current)
    updateTimeout.current = setTimeout(async () => {
      const { error } = await supabase.from('budget_entries').update({[field]: field==='amount'?parseFloat(value)||0:value}).eq('id',id)
      if (error) showToast('⚠️ Save failed — check your connection', 'error')
    }, 500)
  }
  async function deleteEntry(id) { await supabase.from('budget_entries').delete().eq('id',id); fetchEntries() }

  function downloadCSV() {
    const headers = ['Type','Description','Category','Amount']
    const rows = entries.map(e => [
      e.type,
      `"${(e.label||'').replace(/"/g,'""')}"`,
      e.category || '',
      Number(e.amount).toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `budget-${monthYear}.csv`; a.click()
    URL.revokeObjectURL(url)
  }
  async function saveNewRow() {
    if (!newRow.label || !newRow.amount) {
      showToast('⚠️ Please fill in both description and amount', 'error')
      return
    }
    if (!userId) {
      showToast('⚠️ Not logged in — please refresh', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        user_id:    userId,
        month_year: monthYear,
        type:       newRow.type,
        category:   newRow.type === 'expense' ? (newRow.category || 'Needs') : null,
        label:      newRow.label.trim(),
        amount:     parseFloat(newRow.amount) || 0,
      }
      console.log('[Budget] inserting:', payload)
      const { data, error } = await supabase.from('budget_entries').insert(payload).select()
      console.log('[Budget] insert result:', { data, error })
      if (error) throw error

      // Optionally save as recurring template
      if (newRow.saveAsRecurring) {
        const { error: tErr } = await supabase.from('recurring_templates').insert({
          user_id:  userId,
          type:     newRow.type,
          label:    newRow.label.trim(),
          amount:   parseFloat(newRow.amount) || 0,
          category: newRow.type === 'expense' ? (newRow.category || 'Needs') : null,
        })
        if (tErr) console.warn('[Budget] template insert error:', tErr)
        await fetchTemplates()
        showToast('✓ Saved + added to recurring')
      } else {
        showToast('✓ Entry saved')
      }
      setNewRow(null)
      fetchEntries()
    } catch(err) {
      console.error('[Budget] save error:', err)
      const msg = err?.message || err?.details || err?.hint || 'Please try again'
      showToast(`⚠️ ${msg}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function testInsert() {
    const result = await supabase.from('budget_entries').insert({
      user_id:    userId,
      month_year: monthYear,
      type:       'income',
      label:      'TEST ENTRY',
      amount:     1,
      category:   null,
    }).select()
    alert('userId: ' + userId + '\nmonthYear: ' + monthYear + '\nerror: ' + JSON.stringify(result.error) + '\ndata: ' + JSON.stringify(result.data))
  }

  return (
    <div>
      {/* TEMP DEBUG BUTTON — remove after fix */}
      <button onClick={testInsert}
        style={{ width:'100%', padding:12, background:'#7c3aed', color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', marginBottom:8 }}>
        🔬 Test DB Insert (tap to diagnose)
      </button>

      {toast && (
        <div onClick={() => setToast(null)} style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', background: toastType === 'error' ? '#A32D2D' : '#1D9E75', color:'white', padding:'10px 20px', borderRadius:30, fontSize:14, fontWeight:600, zIndex:1000, boxShadow:'0 4px 15px rgba(0,0,0,0.2)', cursor:'pointer', maxWidth:'90vw', textAlign:'center', lineHeight:1.4 }}>
          {toast}
        </div>
      )}
      <div style={{ background:'linear-gradient(135deg, #185FA5, #0D3D6E)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>💳</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.budgetTrackerTitle||"Budget Tracker"}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.budgetSubtitle||"Track every dollar with purpose"}</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <button onClick={() => setMonthOffset(o=>o-1)} style={{ padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:16 }}>‹</button>
        <select value={monthYear} onChange={e => {
          const now = new Date()
          const [y,m] = e.target.value.split('-')
          const diff = (parseInt(y)-now.getFullYear())*12 + (parseInt(m)-1-now.getMonth())
          setMonthOffset(diff)
        }} style={{ flex:1, padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:15, fontWeight:600, textAlign:'center', cursor:'pointer', outline:'none' }}>
          {getAllMonths().map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <button onClick={() => setMonthOffset(o=>o+1)} disabled={monthOffset>=0} style={{ padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:16, opacity:monthOffset>=0?0.3:1 }}>›</button>
        {entries.length > 0 && (
          <button onClick={downloadCSV} title="Download CSV" style={{ padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', fontSize:16 }}>⬇️</button>
        )}
      </div>
      <div className="metric-grid" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
        <div className="metric-card"><div className="metric-label">{tr.income}</div><div className="metric-value green" style={{ fontSize:16 }}>{currencySymbol}{fmt(income)}</div></div>
        <div className="metric-card"><div className="metric-label">{tr.expenses}</div><div className="metric-value red" style={{ fontSize:16 }}>{currencySymbol}{fmt(expenses)}</div></div>
        <div className="metric-card"><div className="metric-label">{tr.surplus||'Surplus'}</div><div className={`metric-value ${surplus>=0?'green':'red'}`} style={{ fontSize:16 }}>{surplus>=0?'+':'-'}{currencySymbol}{fmt(Math.abs(surplus))}</div></div>
      </div>
      <div style={{ overflowX:'auto', marginBottom:16, borderRadius:10, border:'1px solid #e5e7eb' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', borderTop:'1px solid #e5e7eb', borderLeft:'1px solid #e5e7eb' }}>
          <thead><tr>{CATEGORIES.map(cat=><th key={cat} style={{ ...HEAD, border:'none', borderRight:'1px solid #e5e7eb', textAlign:'center' }}>{cat}</th>)}</tr></thead>
          <tbody><tr>{CATEGORIES.map(cat=><td key={cat} style={{ ...CELL, border:'none', borderRight:'1px solid #e5e7eb', textAlign:'center', color:catTotals[cat]>0?'#A32D2D':'#9ca3af' }}>${fmt(catTotals[cat])}</td>)}</tr></tbody>
        </table>
      </div>
      <>
          {/* Auto-fill banner — shown for current month whenever templates exist */}
          {templates.length > 0 && monthYear === currentMonthYear && (
            <div style={{ background: entries.length === 0 ? 'linear-gradient(135deg,#E1F5EE,#EBF4FB)' : 'var(--white)', border:`1px solid ${entries.length === 0 ? '#1D9E75' : 'var(--border)'}`, borderRadius:14, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:22 }}>🔄</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:'#0F6E56' }}>
                  {entries.length === 0 ? 'Apply recurring entries?' : 'Re-apply recurring entries'}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>
                  {templates.length} template{templates.length!==1?'s':''} · {formatMonthLabel(monthYear)}
                </div>
              </div>
              <button onClick={applyRecurring} disabled={applying}
                style={{ padding:'8px 14px', background:'#1D9E75', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:12, cursor:'pointer', flexShrink:0 }}>
                {applying ? '…' : '✓ Apply'}
              </button>
            </div>
          )}

          {/* Income */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div className="section-title" style={{ margin:0 }}>{tr.income}</div>
              <button onClick={() => setNewRow({ type:'income', category:'Needs', label:'', amount:'' })} style={{ fontSize:12, padding:'4px 12px', background:'var(--green)', color:'white', border:'none', borderRadius:6, cursor:'pointer' }}>{tr.addRow||'+ Add row'}</button>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{tr.tapToEdit||'Tap any row to edit'}</div>
            <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #e5e7eb' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', borderTop:'1px solid #e5e7eb', borderLeft:'1px solid #e5e7eb' }}>
                <thead><tr><th style={{ ...HEAD, width:'60%' }}>{tr.label||'Description'}</th><th style={{ ...HEAD, width:'30%' }}>{tr.amount}</th><th style={{ ...HEAD, width:'10%' }}></th></tr></thead>
                <tbody>
                  {entries.filter(e=>e.type==='income').map(e=>(
                    <tr key={e.id} style={{ background:editingId===e.id?'#f0fdf4':'white' }} onClick={() => setEditingId(e.id)}>
                      {editingId===e.id ? (<><EditableCell value={e.label} onChange={v=>updateEntry(e.id,'label',v)} /><EditableCell value={e.amount} onChange={v=>updateEntry(e.id,'amount',v)} type="number" /></>) : (<><td style={CELL}>{e.label}</td><td style={{ ...CELL, color:'#1D9E75', fontWeight:600 }}>{currencySymbol}{fmt(e.amount)}</td></>)}
                      <td style={{ ...CELL, textAlign:'center', cursor:'pointer', color:'#ef4444' }} onClick={ev=>{ev.stopPropagation();deleteEntry(e.id)}}>✕</td>
                    </tr>
                  ))}
                  {newRow?.type==='income' && (
                    <>
                      <tr style={{ background:'#f0fdf4' }}>
                        <EditableCell value={newRow.label} onChange={v=>setNewRow(r=>({...r,label:v}))} placeholder={tr.label||'e.g. Salary'} />
                        <EditableCell value={newRow.amount} onChange={v=>setNewRow(r=>({...r,amount:v}))} type="number" placeholder="0.00" />
                        <td style={{ ...CELL, textAlign:'center' }}><button onClick={saveNewRow} disabled={saving} style={{ fontSize:11, padding:'3px 8px', background:'var(--green)', color:'white', border:'none', borderRadius:4, cursor:'pointer' }}>{tr.save}</button></td>
                      </tr>
                      <tr style={{ background:'#f0fdf4' }}>
                        <td colSpan={3} style={{ ...CELL, borderTop:'none' }}>
                          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#0F6E56', cursor:'pointer' }}>
                            <input type="checkbox" checked={!!newRow.saveAsRecurring} onChange={e=>setNewRow(r=>({...r,saveAsRecurring:e.target.checked}))} />
                            🔄 Repeat every month
                          </label>
                        </td>
                      </tr>
                    </>
                  )}
                  <tr style={{ background:'#f9fafb' }}>
                    <td style={{ ...HEAD, borderBottom:'none' }}>{tr.totalIncome||'Total income'}</td>
                    <td style={{ ...HEAD, borderBottom:'none', color:'#1D9E75', fontSize:14 }}>{currencySymbol}{fmt(income)}</td>
                    <td style={{ ...HEAD, borderBottom:'none' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Recurring templates section */}
          {templates.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <button onClick={() => setShowTemplates(s => !s)}
                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'12px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:13, color:'var(--text)' }}>
                <span>🔄</span>
                <span style={{ flex:1, textAlign:'left' }}>Recurring Templates ({templates.length})</span>
                <span style={{ color:'var(--text-muted)', fontSize:16 }}>{showTemplates ? '▲' : '▼'}</span>
              </button>
              {showTemplates && (
                <div style={{ border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden' }}>
                  {templates.map((t, i) => (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--white)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize:14 }}>{t.type === 'income' ? '💚' : '🔴'}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{t.label}</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)' }}>{t.type}{t.category ? ` · ${t.category}` : ''}</div>
                      </div>
                      <div style={{ fontWeight:700, fontSize:13, color: t.type === 'income' ? '#1D9E75' : '#A32D2D' }}>
                        {currencySymbol}{Number(t.amount).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </div>
                      <button onClick={() => deleteTemplate(t.id)} style={{ fontSize:13, color:'#d1d5db', background:'none', border:'none', cursor:'pointer' }}>✕</button>
                    </div>
                  ))}
                  <div style={{ padding:'10px 14px', background:'#f9fafb', borderTop:'1px solid var(--border)' }}>
                    <button onClick={applyRecurring} disabled={applying}
                      style={{ width:'100%', padding:'10px', background:'#1D9E75', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                      {applying ? 'Applying…' : `✓ Apply all to ${formatMonthLabel(monthYear)}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expenses */}
          <div style={{ marginBottom:80 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div className="section-title" style={{ margin:0 }}>{tr.expenses}</div>
              <button onClick={() => setNewRow({ type:'expense', category:'Needs', label:'', amount:'' })} style={{ fontSize:12, padding:'4px 12px', background:'#A32D2D', color:'white', border:'none', borderRadius:6, cursor:'pointer' }}>{tr.addRow||'+ Add row'}</button>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{tr.tapToEdit||'Tap any row to edit'}</div>
            <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #e5e7eb' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', borderTop:'1px solid #e5e7eb', borderLeft:'1px solid #e5e7eb' }}>
                <thead><tr><th style={{ ...HEAD, width:'40%' }}>{tr.label||'Description'}</th><th style={{ ...HEAD, width:'25%' }}>{tr.category}</th><th style={{ ...HEAD, width:'25%' }}>{tr.amount}</th><th style={{ ...HEAD, width:'10%' }}></th></tr></thead>
                <tbody>
                  {entries.filter(e=>e.type==='expense').map(e=>(
                    <tr key={e.id} style={{ background:editingId===e.id?'#fff7f7':'white' }} onClick={() => setEditingId(e.id)}>
                      {editingId===e.id ? (<><EditableCell value={e.label} onChange={v=>updateEntry(e.id,'label',v)} /><SelectCell value={e.category||'Needs'} onChange={v=>updateEntry(e.id,'category',v)} options={CATEGORIES} /><EditableCell value={e.amount} onChange={v=>updateEntry(e.id,'amount',v)} type="number" /></>) : (<><td style={CELL}>{e.label}</td><td style={CELL}><span className={`cat-badge cat-${(e.category||'needs').toLowerCase()}`}>{e.category}</span></td><td style={{ ...CELL, color:'#A32D2D', fontWeight:600 }}>{currencySymbol}{fmt(e.amount)}</td></>)}
                      <td style={{ ...CELL, textAlign:'center', cursor:'pointer', color:'#ef4444' }} onClick={ev=>{ev.stopPropagation();deleteEntry(e.id)}}>✕</td>
                    </tr>
                  ))}
                  {newRow?.type==='expense' && (
                    <>
                      <tr style={{ background:'#fff7f7' }}>
                        <EditableCell value={newRow.label} onChange={v=>setNewRow(r=>({...r,label:v,category:smartCategory(v)}))} placeholder={tr.label||'e.g. Rent'} />
                        <SelectCell value={newRow.category} onChange={v=>setNewRow(r=>({...r,category:v}))} options={CATEGORIES} />
                        <EditableCell value={newRow.amount} onChange={v=>setNewRow(r=>({...r,amount:v}))} type="number" placeholder="0.00" />
                        <td style={{ ...CELL, textAlign:'center' }}><button onClick={saveNewRow} disabled={saving} style={{ fontSize:11, padding:'3px 8px', background:'#A32D2D', color:'white', border:'none', borderRadius:4, cursor:'pointer' }}>{tr.save}</button></td>
                      </tr>
                      <tr style={{ background:'#fff7f7' }}>
                        <td colSpan={4} style={{ ...CELL, borderTop:'none' }}>
                          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#A32D2D', cursor:'pointer' }}>
                            <input type="checkbox" checked={!!newRow.saveAsRecurring} onChange={e=>setNewRow(r=>({...r,saveAsRecurring:e.target.checked}))} />
                            🔄 Repeat every month
                          </label>
                        </td>
                      </tr>
                    </>
                  )}
                  <tr style={{ background:'#f9fafb' }}>
                    <td style={{ ...HEAD, borderBottom:'none' }} colSpan={2}>{tr.totalExpenses||'Total expenses'}</td>
                    <td style={{ ...HEAD, borderBottom:'none', color:'#A32D2D', fontSize:14 }}>{currencySymbol}{fmt(expenses)}</td>
                    <td style={{ ...HEAD, borderBottom:'none' }}></td>
                  </tr>
                  <tr style={{ background:surplus>=0?'#f0fdf4':'#fff7f7' }}>
                    <td style={{ ...HEAD, borderBottom:'none', color:surplus>=0?'#1D9E75':'#A32D2D' }} colSpan={2}>{tr.netSurplus||'Net surplus'}</td>
                    <td style={{ ...HEAD, borderBottom:'none', color:surplus>=0?'#1D9E75':'#A32D2D', fontSize:14 }}>{surplus>=0?'+':'-'}{currencySymbol}{fmt(Math.abs(surplus))}</td>
                    <td style={{ ...HEAD, borderBottom:'none' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
    </div>
  )
}
