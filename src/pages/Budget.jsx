import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useT, getLang, LANG_LOCALES } from '../lib/i18n'

// ─────────────────────────────────────────────────────────────────────────────
// SMART CATEGORY DETECTION  (logic unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const SMART_CATEGORIES = {
  Needs:       ['rent','rental','mortgage','electric','electricity','water','gas','internet','phone','insurance','grocery','groceries','food','transport','bus','metro','subway','train','car payment','loan','medical','doctor','hospital','pharmacy','childcare','school','tuition','utilities','bill','tax'],
  Wants:       ['restaurant','coffee','starbucks','netflix','spotify','amazon','shopping','clothes','clothing','entertainment','gym','vacation','travel','hotel','airbnb','uber','lyft','dining','bar','movie','cinema','games','gaming','apple','subscription','salon','haircut','nails','beauty'],
  Giving:      ['church','tithe','offering','donation','charity','mission','ministry','gift','giving','nonprofit','volunteer','zakat','sadaqah'],
  Savings:     ['savings','emergency','fund','reserve','deposit','piggy','invest','401k','ira','retirement','college','future'],
  Investments: ['stock','stocks','crypto','bitcoin','ethereum','index','fund','etf','roth','brokerage','robinhood','fidelity','vanguard','real estate','property','rental income','dividend'],
}
function smartCategory(label) {
  const lower = (label || '').toLowerCase()
  for (const [cat, keywords] of Object.entries(SMART_CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'Needs'
}

const CATEGORIES = ['Needs', 'Wants', 'Giving', 'Savings', 'Investments']
const fmt = (n, sym = '') => `${sym}${Number(n || 0).toLocaleString(LANG_LOCALES[getLang()] || 'en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}`

function getMonthYear(offset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function formatMonthLabel(my) {
  const [y, m] = my.split('-')
  return new Date(y, m - 1).toLocaleDateString('en-US', { month:'long', year:'numeric' })
}
function getMonthSelectOptions() {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 72, 1)
  const opts  = []
  for (let i = 0; i < 120; i++) {
    const d     = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({ value, label: d.toLocaleDateString('en-US', { month:'long', year:'numeric' }) })
  }
  return opts
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const CAT_META = {
  Needs:       { icon:'🏠', color:'#1A6878', bg:'rgba(26,104,120,0.10)'  },
  Wants:       { icon:'🎯', color:'#C28A35', bg:'rgba(194,138,53,0.10)' },
  Giving:      { icon:'🎁', color:'#8B4A5A', bg:'rgba(139,74,90,0.10)'  },
  Savings:     { icon:'💰', color:'#1D8C6A', bg:'rgba(29,140,106,0.10)' },
  Investments: { icon:'📈', color:'#1D8C6A', bg:'rgba(29,140,106,0.10)' },
}

const sh = {
  shadow: {
    xs: '0 1px 2px rgba(43,40,37,0.06)',
    sm: '0 1px 4px rgba(43,40,37,0.07), 0 1px 2px rgba(43,40,37,0.05)',
    md: '0 3px 12px rgba(43,40,37,0.09)',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENT INSIGHT ENGINE
// Pure function — derives a calm, contextual message from the month's numbers.
// Never shames, always guides.
// ─────────────────────────────────────────────────────────────────────────────
function getInsight(income, expenses, surplus, catTotals) {
  if (!income && !expenses) return null
  if (!income) return {
    icon: '📥',
    text: 'Add your income first to see how your spending is tracking.',
    tone: 'neutral',
  }
  const pct = income > 0 ? Math.round(expenses / income * 100) : 0
  if (pct === 0) return {
    icon: '📝',
    text: "No expenses logged yet. Add them to get a complete picture of this month.",
    tone: 'neutral',
  }

  // Find biggest spending category for contextual nudge
  const topCat = CATEGORIES
    .filter(c => (catTotals[c] || 0) > 0)
    .sort((a, b) => (catTotals[b] || 0) - (catTotals[a] || 0))[0]

  const topLabel = topCat ? `Your largest category is ${topCat}.` : ''

  if (pct <= 50)  return { icon:'✦',  text:`Outstanding — you've used only ${pct}% of your income. ${topLabel} You're building real financial margin.`,                   tone:'positive' }
  if (pct <= 70)  return { icon:'✦',  text:`You've used ${pct}% of your income. ${topLabel} Great balance — keep this rhythm.`,                                          tone:'positive' }
  if (pct <= 85)  return { icon:'💡', text:`${pct}% of income used this month. ${topLabel} You're on track — stay mindful of discretionary spending.`,                  tone:'gentle'   }
  if (pct <= 100) return { icon:'💡', text:`You've used ${pct}% of your income. ${topLabel} A small reduction in Wants can significantly improve your margin.`,         tone:'caution'  }
  return               { icon:'🔍', text:`Your spending is ${pct - 100}% over income this month. ${topLabel} Let's review where you can create more breathing room.`,  tone:'caution'  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED INPUT STYLES
// ─────────────────────────────────────────────────────────────────────────────
const inputStyle = {
  padding:'10px 12px', border:'1px solid var(--border)', borderRadius:9,
  fontSize:13, background:'var(--white)', color:'var(--text)', outline:'none',
  width:'100%', boxSizing:'border-box',
}
const selectStyle = {
  ...inputStyle, appearance:'none', WebkitAppearance:'none', cursor:'pointer',
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Budget({ session }) {
  const tr   = useT()
  const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦', KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA', INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' }

  const [monthOffset,   setMonthOffset]   = useState(0)
  const [entries,       setEntries]       = useState([])
  const [templates,     setTemplates]     = useState([])
  const [currencySymbol,setCurrencySymbol]= useState('$')
  const [loading,       setLoading]       = useState(true)
  const [editingId,     setEditingId]     = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [applying,      setApplying]      = useState(false)
  const [newRow,        setNewRow]        = useState(null)
  const [toast,         setToast]         = useState(null)
  const [toastType,     setToastType]     = useState('success')
  const [showTemplates, setShowTemplates] = useState(false)

  const updateTimeout = useRef(null)
  const prevEditingId = useRef(null)

  const monthYear        = getMonthYear(monthOffset)
  const currentMonthYear = getMonthYear(0)
  const userId           = session.user.id
  const sym              = currencySymbol

  // ── Data fetching (unchanged) ──────────────────────────────────────────────
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
    const { data } = await supabase.from('recurring_templates').select('*').eq('user_id', userId).order('created_at', { ascending:true })
    setTemplates(data || [])
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
      if (data?.currency) setCurrencySymbol(SYMBOLS[data.currency] || '$')
    }
    loadCurrency()
    fetchTemplates()
  }, [])

  useEffect(() => { fetchEntries() }, [monthYear])

  useEffect(() => {
    if (prevEditingId.current !== null && editingId === null) showToast('✓ Saved')
    prevEditingId.current = editingId
  }, [editingId])

  // ── Mutations (unchanged) ──────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(null), type === 'error' ? 6000 : 2000)
  }
  async function updateEntry(id, field, value) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]:value } : e))
    clearTimeout(updateTimeout.current)
    updateTimeout.current = setTimeout(async () => {
      const { error } = await supabase.from('budget_entries').update({ [field]: field === 'amount' ? parseFloat(value) || 0 : value }).eq('id', id)
      if (error) showToast('⚠️ Save failed — check your connection', 'error')
    }, 500)
  }
  async function deleteEntry(id) {
    await supabase.from('budget_entries').delete().eq('id', id)
    fetchEntries()
  }
  async function saveNewRow() {
    if (!newRow.label || !newRow.amount) { showToast('⚠️ Please fill in both description and amount', 'error'); return }
    if (!userId)                          { showToast('⚠️ Not logged in — please refresh', 'error');             return }
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
      const { error } = await supabase.from('budget_entries').insert(payload).select()
      if (error) throw error
      if (newRow.saveAsRecurring) {
        const { error: tErr } = await supabase.from('recurring_templates').insert({
          user_id:  userId, type:newRow.type, label:newRow.label.trim(),
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
  function downloadCSV() {
    const headers = ['Type','Description','Category','Amount']
    const rows    = entries.map(e => [e.type, `"${(e.label||'').replace(/"/g,'""')}"`, e.category||'', Number(e.amount).toFixed(2)])
    const csv     = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob    = new Blob([csv], { type:'text/csv' })
    const url     = URL.createObjectURL(blob)
    const a       = Object.assign(document.createElement('a'), { href:url, download:`budget-${monthYear}.csv` })
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const income   = entries.filter(e => e.type==='income').reduce((s,e) => s+Number(e.amount), 0)
  const expenses = entries.filter(e => e.type==='expense').reduce((s,e) => s+Number(e.amount), 0)
  const surplus  = income - expenses
  const catTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = entries.filter(e => e.type==='expense' && e.category===cat).reduce((s,e) => s+Number(e.amount), 0)
    return acc
  }, {})
  const spentPct = income > 0 ? Math.min(100, Math.round(expenses / income * 100)) : 0
  const insight  = getInsight(income, expenses, surplus, catTotals)

  const incomeEntries  = entries.filter(e => e.type === 'income')
  const expenseEntries = entries.filter(e => e.type === 'expense')

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom:110 }}>

      {/* ── Toast notification ──────────────────────────────────────────── */}
      {toast && (
        <div
          onClick={() => setToast(null)}
          style={{
            position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
            background: toastType === 'error' ? 'var(--red)' : 'var(--green)',
            color:'white', padding:'10px 20px', borderRadius:30,
            fontSize:14, fontWeight:600, zIndex:1000,
            boxShadow:'0 4px 20px rgba(0,0,0,0.2)', cursor:'pointer',
            maxWidth:'88vw', textAlign:'center', lineHeight:1.4,
          }}
        >
          {toast}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HERO  ·  Full-bleed dark-green header, month nav, summary cards
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(158deg, #091f17 0%, #0e2d1f 40%, #155538 80%, #1D8C6A 100%)',
        margin:'-16px -16px 0', padding:'24px 20px 28px',
      }}>
        {/* Month navigation */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:22 }}>
          <button
            onClick={() => setMonthOffset(o => o-1)}
            style={{ width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.10)', color:'white', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          >‹</button>

          <select
            value={monthYear}
            onChange={e => {
              const now = new Date()
              const [y, m] = e.target.value.split('-')
              setMonthOffset((parseInt(y) - now.getFullYear()) * 12 + (parseInt(m) - 1 - now.getMonth()))
            }}
            style={{ flex:1, padding:'9px 14px', borderRadius:10, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.10)', color:'white', fontSize:14, fontWeight:700, textAlign:'center', cursor:'pointer', outline:'none', WebkitAppearance:'none', appearance:'none' }}
          >
            {getMonthSelectOptions().map(m => <option key={m.value} value={m.value} style={{ color:'#1a1a1a' }}>{m.label}</option>)}
          </select>

          <button
            onClick={() => setMonthOffset(o => o+1)}
            disabled={monthOffset >= 0}
            style={{ width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.10)', color:'white', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity:monthOffset >= 0 ? 0.3 : 1 }}
          >›</button>

          {entries.length > 0 && (
            <button
              onClick={downloadCSV} title="Download CSV"
              style={{ width:34, height:34, borderRadius:10, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.10)', color:'white', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            >⬇</button>
          )}
        </div>

        {/* Income headline */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.42)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
            Monthly Income
          </div>
          <div style={{ fontSize:34, fontWeight:900, color:'#fff', letterSpacing:'-1px', marginBottom:4, lineHeight:1 }}>
            {loading
              ? <span style={{ opacity:0.35 }}>—</span>
              : <>{sym}{fmt(income)}</>
            }
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.48)' }}>
            {loading ? 'Loading…' : `${incomeEntries.length} income source${incomeEntries.length !== 1 ? 's' : ''} · ${expenseEntries.length} expense${expenseEntries.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Spent / Surplus mini tiles */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ background:'rgba(255,255,255,0.09)', borderRadius:12, padding:'13px 14px', border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginBottom:5, letterSpacing:'0.07em', textTransform:'uppercase' }}>Spent</div>
            <div style={{ fontSize:20, fontWeight:800, color: expenses > income && income > 0 ? '#f7b8b8' : '#fff', letterSpacing:'-0.5px' }}>
              {sym}{fmt(expenses)}
            </div>
          </div>
          <div style={{ background: surplus >= 0 ? 'rgba(61,200,155,0.18)' : 'rgba(200,100,100,0.18)', borderRadius:12, padding:'13px 14px', border:`1px solid ${surplus >= 0 ? 'rgba(61,200,155,0.28)' : 'rgba(200,100,100,0.28)'}` }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginBottom:5, letterSpacing:'0.07em', textTransform:'uppercase' }}>
              {surplus >= 0 ? 'Surplus' : 'Over by'}
            </div>
            <div style={{ fontSize:20, fontWeight:800, color: surplus >= 0 ? '#76EDC5' : '#f7b8b8', letterSpacing:'-0.5px' }}>
              {surplus >= 0 ? '+' : '-'}{sym}{fmt(Math.abs(surplus))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop:20 }}>

        {/* ── Spending Momentum + Insight ─────────────────────────────── */}
        {(income > 0 || expenses > 0) && (
          <div style={{ background:'var(--white)', borderRadius:16, padding:'17px 16px', marginBottom:14, border:'1px solid var(--border)', boxShadow:sh.shadow.sm }}>

            {income > 0 && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:7 }}>
                  <span>{spentPct}% of income used</span>
                  <span style={{ color: surplus >= 0 ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                    {surplus >= 0 ? `${sym}${fmt(surplus)} remaining` : `${sym}${fmt(Math.abs(surplus))} over`}
                  </span>
                </div>
                <div style={{ height:8, background:'var(--gray-light)', borderRadius:4, overflow:'hidden', marginBottom:insight ? 13 : 0 }}>
                  <div style={{
                    height:'100%',
                    width:`${spentPct}%`,
                    borderRadius:4,
                    background: spentPct > 100 ? 'var(--red)' : spentPct > 85 ? '#C28A35' : 'linear-gradient(90deg, var(--green-mid), var(--green))',
                    transition:'width 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}/>
                </div>
              </>
            )}

            {insight && (
              <div style={{
                display:'flex', gap:10, alignItems:'flex-start',
                padding:'11px 13px', borderRadius:11,
                background: insight.tone === 'positive' ? 'rgba(29,140,106,0.06)' : insight.tone === 'caution' ? 'rgba(194,138,53,0.07)' : 'rgba(112,107,101,0.06)',
              }}>
                <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{insight.icon}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.65 }}>{insight.text}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Category Breakdown ──────────────────────────────────────── */}
        {expenses > 0 && (
          <div style={{ background:'var(--white)', borderRadius:16, padding:'17px 16px', marginBottom:14, border:'1px solid var(--border)', boxShadow:sh.shadow.sm }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:15, letterSpacing:'-0.2px' }}>
              Spending by Category
            </div>
            {CATEGORIES
              .filter(cat => (catTotals[cat] || 0) > 0)
              .sort((a, b) => (catTotals[b] || 0) - (catTotals[a] || 0))
              .map(cat => {
                const meta = CAT_META[cat] || {}
                const pct  = Math.round((catTotals[cat] || 0) / expenses * 100)
                return (
                  <div key={cat} style={{ marginBottom:13 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:30, height:30, borderRadius:9, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>
                          {meta.icon}
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{cat}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:meta.color }}>{sym}{fmt(catTotals[cat])}</span>
                        <span style={{ fontSize:10, color:'var(--text-faint)', minWidth:28, textAlign:'right' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height:5, background:'var(--gray-light)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:meta.color, opacity:0.75, borderRadius:3, transition:'width 0.6s cubic-bezier(0.16,1,0.3,1)' }}/>
                    </div>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* ── Recurring apply banner ──────────────────────────────────── */}
        {templates.length > 0 && monthYear === currentMonthYear && (
          <div style={{
            background: entries.length === 0 ? 'rgba(29,140,106,0.06)' : 'var(--white)',
            border:`1px solid ${entries.length === 0 ? 'rgba(29,140,106,0.2)' : 'var(--border)'}`,
            borderRadius:14, padding:'13px 16px', marginBottom:14,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <span style={{ fontSize:20 }}>🔄</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--green)' }}>
                {entries.length === 0 ? 'Apply recurring entries?' : 'Re-apply recurring entries'}
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>
                {templates.length} template{templates.length !== 1 ? 's' : ''} · {formatMonthLabel(monthYear)}
              </div>
            </div>
            <button
              onClick={applyRecurring} disabled={applying}
              style={{ padding:'8px 15px', background:'var(--green)', color:'white', border:'none', borderRadius:9, fontWeight:700, fontSize:12, cursor:'pointer', flexShrink:0 }}
            >
              {applying ? '…' : '✓ Apply'}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            INCOME SECTION
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:3, height:18, borderRadius:2, background:'var(--green)', flexShrink:0 }}/>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', letterSpacing:'-0.25px' }}>
                {tr.income || 'Income'}
              </div>
            </div>
            <button
              onClick={() => { setEditingId(null); setNewRow({ type:'income', label:'', amount:'' }) }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', background:'var(--green-light)', color:'var(--green-dark)', border:'1px solid rgba(29,140,106,0.18)', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer' }}
            >
              + Add income
            </button>
          </div>

          <div style={{ background:'var(--white)', borderRadius:16, border:'1px solid var(--border)', boxShadow:sh.shadow.sm, overflow:'hidden' }}>

            {/* Entry rows */}
            {incomeEntries.length === 0 && !newRow && (
              <div style={{ padding:'24px 16px', textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:8, opacity:0.5 }}>💵</div>
                <div style={{ fontSize:13, color:'var(--text-muted)' }}>No income logged yet</div>
                <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:3 }}>Tap "+ Add income" to get started</div>
              </div>
            )}

            {incomeEntries.map((e, idx) => (
              <div key={e.id}>
                {editingId === e.id ? (
                  /* ── Edit mode ── */
                  <div style={{ padding:'13px 16px', background:'rgba(29,140,106,0.04)', borderBottom: idx < incomeEntries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                      <input
                        value={e.label}
                        onChange={ev => updateEntry(e.id, 'label', ev.target.value)}
                        style={{ ...inputStyle, flex:1 }}
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={e.amount}
                        onChange={ev => updateEntry(e.id, 'amount', ev.target.value)}
                        style={{ ...inputStyle, width:90 }}
                        placeholder="0.00"
                      />
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ padding:'8px 18px', background:'var(--green)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}
                      >
                        Done ✓
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Display mode ── */
                  <div
                    className="sh-tappable"
                    onClick={() => setEditingId(e.id)}
                    style={{
                      display:'flex', alignItems:'center', gap:13, padding:'13px 16px', cursor:'pointer',
                      borderBottom: idx < incomeEntries.length - 1 || newRow?.type === 'income' ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ width:38, height:38, borderRadius:11, background:'rgba(29,140,106,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                      💵
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {e.label || 'Unnamed'}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text-faint)', marginTop:1 }}>Tap to edit</div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--green)', flexShrink:0 }}>
                      {sym}{fmt(e.amount)}
                    </div>
                    <button
                      onClick={ev => { ev.stopPropagation(); deleteEntry(e.id) }}
                      style={{ fontSize:16, color:'var(--text-faint)', background:'none', border:'none', cursor:'pointer', padding:'4px 2px', lineHeight:1, flexShrink:0 }}
                    >×</button>
                  </div>
                )}
              </div>
            ))}

            {/* New income form */}
            {newRow?.type === 'income' && (
              <div style={{ padding:'14px 16px', background:'rgba(29,140,106,0.04)', borderTop: incomeEntries.length > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display:'flex', gap:8, marginBottom:9 }}>
                  <input
                    value={newRow.label}
                    onChange={e => setNewRow(r => ({ ...r, label:e.target.value }))}
                    placeholder="e.g. Salary, Freelance…"
                    style={{ ...inputStyle, flex:1 }}
                    autoFocus
                  />
                  <input
                    type="number"
                    value={newRow.amount}
                    onChange={e => setNewRow(r => ({ ...r, amount:e.target.value }))}
                    placeholder="0.00"
                    style={{ ...inputStyle, width:88 }}
                  />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-muted)', cursor:'pointer' }}>
                    <input type="checkbox" checked={!!newRow.saveAsRecurring} onChange={e => setNewRow(r => ({ ...r, saveAsRecurring:e.target.checked }))}/>
                    Repeat monthly
                  </label>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setNewRow(null)} style={{ padding:'8px 14px', border:'1px solid var(--border)', background:'transparent', borderRadius:8, fontSize:12, cursor:'pointer', color:'var(--text-muted)' }}>
                      Cancel
                    </button>
                    <button onClick={saveNewRow} disabled={saving} style={{ padding:'8px 18px', background:'var(--green)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', opacity:saving?0.7:1 }}>
                      {saving ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Total row */}
            {incomeEntries.length > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'rgba(29,140,106,0.04)', borderTop:'1px solid var(--border)' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  {tr.totalIncome || 'Total Income'}
                </span>
                <span style={{ fontSize:15, fontWeight:800, color:'var(--green)' }}>
                  {sym}{fmt(income)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Recurring Templates accordion ───────────────────────────── */}
        {templates.length > 0 && (
          <div style={{ marginBottom:14 }}>
            <button
              onClick={() => setShowTemplates(s => !s)}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'12px 16px', background:'var(--white)', border:'1px solid var(--border)', borderRadius: showTemplates ? '14px 14px 0 0' : 14, cursor:'pointer', fontWeight:700, fontSize:13, color:'var(--text)', boxShadow:sh.shadow.xs }}
            >
              <span>🔄</span>
              <span style={{ flex:1, textAlign:'left' }}>Recurring Templates ({templates.length})</span>
              <span style={{ color:'var(--text-faint)', fontSize:13 }}>{showTemplates ? '▲' : '▼'}</span>
            </button>

            {showTemplates && (
              <div style={{ border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 14px 14px', overflow:'hidden' }}>
                {templates.map((t, i) => (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', background:'var(--white)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:34, height:34, borderRadius:10, background: t.type === 'income' ? 'rgba(29,140,106,0.10)' : CAT_META[t.category]?.bg || 'rgba(112,107,101,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                      {t.type === 'income' ? '💵' : CAT_META[t.category]?.icon || '💳'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.label}</div>
                      <div style={{ fontSize:10, color:'var(--text-faint)', marginTop:1 }}>{t.type}{t.category ? ` · ${t.category}` : ''}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color: t.type === 'income' ? 'var(--green)' : 'var(--red)', flexShrink:0 }}>
                      {sym}{Number(t.amount).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                    </div>
                    <button onClick={() => deleteTemplate(t.id)} style={{ fontSize:15, color:'var(--text-faint)', background:'none', border:'none', cursor:'pointer', padding:'4px 2px', lineHeight:1, flexShrink:0 }}>×</button>
                  </div>
                ))}
                <div style={{ padding:'12px 16px', background:'var(--bg)', borderTop:'1px solid var(--border)' }}>
                  <button onClick={applyRecurring} disabled={applying} style={{ width:'100%', padding:'11px', background:'var(--green)', color:'white', border:'none', borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer' }}>
                    {applying ? 'Applying…' : `✓ Apply all to ${formatMonthLabel(monthYear)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            EXPENSE SECTION
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:3, height:18, borderRadius:2, background:'var(--red)', flexShrink:0 }}/>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', letterSpacing:'-0.25px' }}>
                {tr.expenses || 'Expenses'}
              </div>
            </div>
            <button
              onClick={() => { setEditingId(null); setNewRow({ type:'expense', category:'Needs', label:'', amount:'' }) }}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', background:'var(--red-light)', color:'var(--red)', border:'1px solid rgba(140,64,64,0.18)', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer' }}
            >
              + Add expense
            </button>
          </div>

          <div style={{ background:'var(--white)', borderRadius:16, border:'1px solid var(--border)', boxShadow:sh.shadow.sm, overflow:'hidden' }}>

            {expenseEntries.length === 0 && !newRow && (
              <div style={{ padding:'24px 16px', textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:8, opacity:0.5 }}>💳</div>
                <div style={{ fontSize:13, color:'var(--text-muted)' }}>No expenses logged yet</div>
                <div style={{ fontSize:11, color:'var(--text-faint)', marginTop:3 }}>Tap "+ Add expense" to get started</div>
              </div>
            )}

            {expenseEntries.map((e, idx) => {
              const meta = CAT_META[e.category] || CAT_META.Needs
              const isLast = idx === expenseEntries.length - 1
              return (
                <div key={e.id}>
                  {editingId === e.id ? (
                    /* ── Edit mode ── */
                    <div style={{ padding:'13px 16px', background:'rgba(140,64,64,0.04)', borderBottom: !isLast ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                        <input
                          value={e.label}
                          onChange={ev => updateEntry(e.id, 'label', ev.target.value)}
                          style={{ ...inputStyle, flex:1 }}
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={e.amount}
                          onChange={ev => updateEntry(e.id, 'amount', ev.target.value)}
                          style={{ ...inputStyle, width:90 }}
                          placeholder="0.00"
                        />
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <select
                          value={e.category || 'Needs'}
                          onChange={ev => updateEntry(e.id, 'category', ev.target.value)}
                          style={{ ...selectStyle, flex:1, fontSize:12 }}
                        >
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding:'10px 18px', background:'var(--red)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', flexShrink:0 }}
                        >
                          Done ✓
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display mode ── */
                    <div
                      className="sh-tappable"
                      onClick={() => setEditingId(e.id)}
                      style={{
                        display:'flex', alignItems:'center', gap:13, padding:'13px 16px', cursor:'pointer',
                        borderBottom: !isLast || newRow?.type === 'expense' ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div style={{ width:38, height:38, borderRadius:11, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {e.label || 'Unnamed'}
                        </div>
                        {e.category && (
                          <div style={{ fontSize:9, fontWeight:800, color:meta.color, marginTop:2, letterSpacing:'0.07em', textTransform:'uppercase' }}>
                            {e.category}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', flexShrink:0 }}>
                        {sym}{fmt(e.amount)}
                      </div>
                      <button
                        onClick={ev => { ev.stopPropagation(); deleteEntry(e.id) }}
                        style={{ fontSize:16, color:'var(--text-faint)', background:'none', border:'none', cursor:'pointer', padding:'4px 2px', lineHeight:1, flexShrink:0 }}
                      >×</button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* New expense form */}
            {newRow?.type === 'expense' && (
              <div style={{ padding:'14px 16px', background:'rgba(140,64,64,0.04)', borderTop: expenseEntries.length > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display:'flex', gap:8, marginBottom:9 }}>
                  <input
                    value={newRow.label}
                    onChange={e => setNewRow(r => ({ ...r, label:e.target.value, category:smartCategory(e.target.value) }))}
                    placeholder="e.g. Rent, Coffee, Netflix…"
                    style={{ ...inputStyle, flex:1 }}
                    autoFocus
                  />
                  <input
                    type="number"
                    value={newRow.amount}
                    onChange={e => setNewRow(r => ({ ...r, amount:e.target.value }))}
                    placeholder="0.00"
                    style={{ ...inputStyle, width:88 }}
                  />
                </div>
                <div style={{ marginBottom:9 }}>
                  <select
                    value={newRow.category}
                    onChange={e => setNewRow(r => ({ ...r, category:e.target.value }))}
                    style={{ ...selectStyle }}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-muted)', cursor:'pointer' }}>
                    <input type="checkbox" checked={!!newRow.saveAsRecurring} onChange={e => setNewRow(r => ({ ...r, saveAsRecurring:e.target.checked }))}/>
                    Repeat monthly
                  </label>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setNewRow(null)} style={{ padding:'8px 14px', border:'1px solid var(--border)', background:'transparent', borderRadius:8, fontSize:12, cursor:'pointer', color:'var(--text-muted)' }}>
                      Cancel
                    </button>
                    <button onClick={saveNewRow} disabled={saving} style={{ padding:'8px 18px', background:'var(--red)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', opacity:saving?0.7:1 }}>
                      {saving ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Total + surplus rows */}
            {expenseEntries.length > 0 && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', background:'rgba(140,64,64,0.04)', borderTop:'1px solid var(--border)' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                    {tr.totalExpenses || 'Total Expenses'}
                  </span>
                  <span style={{ fontSize:15, fontWeight:800, color:'var(--red)' }}>{sym}{fmt(expenses)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', background: surplus >= 0 ? 'rgba(29,140,106,0.05)' : 'rgba(140,64,64,0.05)', borderTop:'1px solid var(--border)', borderRadius:'0 0 16px 16px' }}>
                  <span style={{ fontSize:11, fontWeight:700, color: surplus >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                    {surplus >= 0 ? (tr.netSurplus || 'Net Surplus') : 'Over Budget'}
                  </span>
                  <span style={{ fontSize:15, fontWeight:800, color: surplus >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {surplus >= 0 ? '+' : '-'}{sym}{fmt(Math.abs(surplus))}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
