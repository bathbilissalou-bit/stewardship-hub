import { useState, useEffect } from 'react'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Tithe','Offering','Charity','Mission','Zakat','Sadaqah','Gift','Other']
const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦', KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA', INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' }
const CAT_ICONS = { Tithe:'⛪', Offering:'🙏', Charity:'❤️', Mission:'🌍', Zakat:'☪️', Sadaqah:'💚', Gift:'🎁', Other:'✦' }
const fmt = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})

function getMonthYear() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

export default function Giving({ session }) {
  const tr = useT()
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ amount:'', category:'Tithe', recipient:'', note:'', date:new Date().toISOString().split('T')[0] })
  const [goalAmount, setGoalAmount] = useState(500)
  const userId = session.user.id
  const thisMonth = getMonthYear()

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setCurrencySymbol(SYMBOLS[data.currency] || data.currency) })
  }, [userId])

  async function fetchEntries() {
    setLoading(true)
    const { data } = await supabase.from('giving_entries').select('*').eq('user_id', userId).order('date',{ascending:false})
    setEntries(data||[])
    setLoading(false)
  }
  useEffect(() => { fetchEntries() }, [])

  async function saveEntry() {
    if (!form.amount) return
    setSaving(true)
    await supabase.from('giving_entries').insert({ user_id:userId, amount:parseFloat(form.amount), category:form.category, recipient:form.recipient, note:form.note, date:form.date })
    setSaving(false); setShowModal(false)
    setForm({ amount:'', category:'Tithe', recipient:'', note:'', date:new Date().toISOString().split('T')[0] })
    fetchEntries()
  }

  async function deleteEntry(id) { await supabase.from('giving_entries').delete().eq('id', id); fetchEntries() }

  const thisMonthEntries = entries.filter(e => e.date?.startsWith(thisMonth))
  const thisMonthTotal = thisMonthEntries.reduce((s,e) => s+Number(e.amount), 0)
  const allTimeTotal = entries.reduce((s,e) => s+Number(e.amount), 0)
  const givingPct = Math.min(100, Math.round(thisMonthTotal/goalAmount*100))

  const byCat = CATEGORIES.map(cat => ({
    cat, icon:CAT_ICONS[cat],
    total: entries.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amount),0)
  })).filter(c => c.total > 0).sort((a,b)=>b.total-a.total)

  return (
    <div style={{paddingBottom:100}}>
      <div style={{ background:'linear-gradient(135deg, #C2185B, #880E4F)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>🎁</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.givingTitle||"Giving & Tithe"}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.givingSubtitle||"Track your generosity journey"}</p>
      </div>

      {/* Monthly giving card */}
      <div style={{background:'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius:16, padding:'18px 20px', marginBottom:16, color:'white'}}>
        <div style={{fontSize:11, opacity:0.8, marginBottom:4}}>{tr.thisMonthGiving||"THIS MONTH'S GIVING"}</div>
        <div style={{fontSize:32, fontWeight:800}}>{currencySymbol}{fmt(thisMonthTotal)}</div>
        <div style={{fontSize:12, opacity:0.7, marginBottom:12}}>of {currencySymbol}{fmt(goalAmount)} {tr.ofMonthlyGoal||'monthly goal'}</div>
        <div style={{height:8, background:'rgba(255,255,255,0.3)', borderRadius:4, overflow:'hidden', marginBottom:8}}>
          <div style={{height:'100%', width:`${givingPct}%`, background:'white', borderRadius:4}}/>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:11, opacity:0.8}}>
          <span>{givingPct}{tr.pctOfGoal||'% of goal'}</span>
          <span>{tr.allTimeGiving||'All time'}: {currencySymbol}{fmt(allTimeTotal)}</span>
        </div>
      </div>

      {/* Monthly goal setter */}
      <div className="card" style={{marginBottom:16, display:'flex', alignItems:'center', gap:12}}>
        <span style={{fontSize:20}}>🎯</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:600}}>{tr.monthlyGivingGoal||'Monthly giving goal'}</div>
          <div style={{fontSize:11, color:'var(--text-muted)'}}>{tr.setTargetGiving||'Set your target giving amount'}</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <span style={{fontSize:13, color:'var(--text-muted)'}}>$</span>
          <input type="number" value={goalAmount} onChange={e=>setGoalAmount(Number(e.target.value))}
            style={{width:80, padding:'6px 8px', border:'1px solid var(--border)', borderRadius:8, fontSize:14, fontWeight:600, textAlign:'center', background:'var(--bg)', color:'var(--text)', outline:'none'}}/>
        </div>
      </div>

      {/* Category breakdown */}
      {byCat.length > 0 && (
        <div className="card" style={{marginBottom:16}}>
          <div style={{fontWeight:700, fontSize:14, marginBottom:12}}>{tr.byCategory||'By category'}</div>
          {byCat.map((c,i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
              <div style={{width:36, height:36, borderRadius:10, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0}}>{c.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:600}}>{c.cat}</div>
                <div style={{height:4, background:'#f3f4f6', borderRadius:2, marginTop:4, overflow:'hidden'}}>
                  <div style={{height:'100%', width:`${Math.round(c.total/allTimeTotal*100)}%`, background:'#1D9E75', borderRadius:2}}/>
                </div>
              </div>
              <div style={{fontWeight:700, fontSize:13, color:'var(--green)'}}>{currencySymbol}{fmt(c.total)}</div>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <div className="empty-state"><div className="icon">🎁</div><p>{loading ? '⏳ Loading…' : (tr.noGivingYet||'No giving entries yet')}</p>{!loading && <p style={{marginTop:8,fontSize:13}}>{tr.tapRecordGift||'Tap + to record your first gift'}</p>}</div>
      )}

      {/* Entries list */}
      {entries.slice(0,20).map(e => (
        <div key={e.id} className="card" style={{display:'flex', alignItems:'center', gap:12, marginBottom:8, padding:'12px 16px'}}>
          <div style={{width:40, height:40, borderRadius:12, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>{CAT_ICONS[e.category]||'✦'}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600, fontSize:14}}>{e.category}{e.recipient?` — ${e.recipient}`:''}</div>
            <div style={{fontSize:11, color:'var(--text-muted)'}}>{e.note||''} · {e.date}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontWeight:700, color:'var(--green)', fontSize:15}}>{currencySymbol}{fmt(e.amount)}</div>
            <button onClick={()=>deleteEntry(e.id)} style={{fontSize:11, color:'#ef4444', background:'none', border:'none', cursor:'pointer', marginTop:2}}>{tr.deleteBtn||'Delete'}</button>
          </div>
        </div>
      ))}

      <button className="fab" onClick={()=>setShowModal(true)}>+</button>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{tr.recordGiving||'Record giving'}</div>
            <div className="form-group" style={{marginBottom:12}}>
              <label>{tr.amountLabel||'Amount'}</label>
              <input type="number" placeholder="100" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} min="0" autoFocus/>
            </div>
            <div className="form-group" style={{marginBottom:12}}>
              <label>Category</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                {CATEGORIES.map(cat=>(
                  <button key={cat} onClick={()=>setForm(f=>({...f,category:cat}))}
                    style={{padding:'6px 12px',borderRadius:20,border:'1px solid',borderColor:form.category===cat?'var(--green)':'var(--border)',background:form.category===cat?'var(--green-light)':'var(--bg)',color:form.category===cat?'var(--green-dark)':'var(--text-muted)',fontSize:12,fontWeight:500,cursor:'pointer'}}>
                    {CAT_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{marginBottom:12}}>
              <label>{tr.recipientOpt||'Recipient — optional'}</label>
              <input type="text" placeholder="e.g. Church, Red Cross" value={form.recipient} onChange={e=>setForm(f=>({...f,recipient:e.target.value}))}/>
            </div>
            <div className="form-group" style={{marginBottom:12}}>
              <label>{tr.noteOpt||'Note — optional'}</label>
              <input type="text" placeholder="e.g. Sunday offering" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
            </div>
            <div className="form-group" style={{marginBottom:16}}>
              <label>{tr.dateLabel||'Date'}</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
            </div>
            <div className="modal-actions">
              <button onClick={()=>setShowModal(false)} style={{padding:"14px", fontSize:14, fontWeight:600, background:"#f3f4f6", color:"#666", border:"none", borderRadius:10, cursor:"pointer"}}>{tr.cancel||"Cancel"}</button>
              <button onClick={saveEntry} disabled={saving} style={{flex:2, padding:"14px", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #1D9E75, #0F6E56)", color:"white", border:"none", borderRadius:10, cursor:"pointer"}}>{saving ? "💾 Saving…" : "💾 Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
