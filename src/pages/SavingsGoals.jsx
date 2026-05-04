import { useState, useEffect } from 'react'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'

const GOAL_ICONS  = ['🎯','🏠','🚗','✈️','💍','🎓','👶','💻','🏖️','⛪','💰','🏋️','🎸','🌍','🐾','🏥']
const GOAL_COLORS = ['#1D9E75','#185FA5','#BA7517','#A32D2D','#7F77DD','#3B6D11','#0F6E56','#534AB7']
const SYMBOLS     = { USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦', KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA', INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' }
const fmt  = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
const fmtS = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})

// Duration quick-picks
const DURATIONS = [
  { label:'3 mo',   months:3  },
  { label:'6 mo',   months:6  },
  { label:'1 year', months:12 },
  { label:'2 yrs',  months:24 },
  { label:'3 yrs',  months:36 },
  { label:'5 yrs',  months:60 },
]

function monthsFromDeadline(deadline, created) {
  if (!deadline) return null
  const start = created ? new Date(created) : new Date()
  const end   = new Date(deadline)
  return Math.max(1, Math.round((end - start) / (1000*60*60*24*30.44)))
}

function deadlineFromMonths(months) {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function formatDuration(months) {
  if (!months) return null
  if (months < 12) return `${months}-month goal`
  const yrs = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return `${yrs}-year goal`
  return `${yrs}y ${rem}mo goal`
}

function timeProgress(deadline, created) {
  if (!deadline) return null
  const start   = created ? new Date(created) : new Date()
  const end     = new Date(deadline)
  const now     = new Date()
  const total   = end - start
  const elapsed = now - start
  return Math.min(100, Math.max(0, Math.round(elapsed / total * 100)))
}

function monthlyNeeded(target, current, deadline) {
  if (!deadline) return null
  const months = Math.max(1, Math.ceil((new Date(deadline) - new Date()) / (1000*60*60*24*30.44)))
  const remaining = Number(target) - Number(current)
  if (remaining <= 0) return 0
  return remaining / months
}

export default function SavingsGoals({ session }) {
  const tr = useT()
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [goals,          setGoals]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showModal,      setShowModal]      = useState(false)
  const [showAddModal,   setShowAddModal]   = useState(false)
  const [selectedGoal,   setSelectedGoal]   = useState(null)
  const [addAmount,      setAddAmount]      = useState('')
  const [saving,         setSaving]         = useState(false)
  const [form, setForm] = useState({
    name:'', target_amount:'', current_amount:'',
    icon:'🎯', color:'#1D9E75', deadline:'',
    duration_months: null,   // selected quick-pick months
  })
  const userId = session.user.id

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setCurrencySymbol(SYMBOLS[data.currency] || data.currency) })
  }, [userId])

  async function fetchGoals() {
    setLoading(true)
    const { data } = await supabase.from('savings_goals').select('*').eq('user_id', userId).eq('status','active').order('created_at',{ascending:false})
    setGoals(data||[])
    setLoading(false)
  }
  useEffect(() => { fetchGoals() }, [])

  // Pick a quick duration → auto-set deadline
  function pickDuration(months) {
    setForm(f => ({ ...f, duration_months: months, deadline: deadlineFromMonths(months) }))
  }

  async function saveGoal() {
    if (!form.name || !form.target_amount) return
    setSaving(true)
    const { error } = await supabase.from('savings_goals').insert({
      user_id:        userId,
      name:           form.name,
      target_amount:  parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount||0),
      icon:           form.icon,
      color:          form.color,
      deadline:       form.deadline || null,
    })
    setSaving(false)
    if (error) { alert('Failed to save goal. Please try again.'); return }
    setShowModal(false)
    setForm({ name:'', target_amount:'', current_amount:'', icon:'🎯', color:'#1D9E75', deadline:'', duration_months:null })
    fetchGoals()
  }

  async function addToGoal() {
    if (!addAmount || !selectedGoal) return
    setSaving(true)
    const newAmount = Number(selectedGoal.current_amount) + parseFloat(addAmount)
    const status = newAmount >= Number(selectedGoal.target_amount) ? 'completed' : 'active'
    const { error } = await supabase.from('savings_goals').update({ current_amount:newAmount, status }).eq('id', selectedGoal.id)
    setSaving(false)
    if (error) { alert('Failed to update goal. Please try again.'); return }
    setShowAddModal(false); setAddAmount(''); fetchGoals()
  }

  async function deleteGoal(id) { await supabase.from('savings_goals').delete().eq('id', id); fetchGoals() }

  const totalSaved     = goals.reduce((s,g) => s+Number(g.current_amount), 0)
  const totalTarget    = goals.reduce((s,g) => s+Number(g.target_amount), 0)
  const completedGoals = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>💰</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.savingsGoals||'Savings Goals'}</h2>
        <p  style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.savingsSubtitle||'Save with intention and purpose'}</p>
      </div>

      {goals.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
          <div className="metric-card"><div className="metric-label">{tr.totalSaved||'Total saved'}</div><div className="metric-value green" style={{fontSize:15}}>{currencySymbol}{fmt(totalSaved)}</div></div>
          <div className="metric-card"><div className="metric-label">{tr.targetLabel||'Target'}</div><div className="metric-value" style={{fontSize:15}}>{currencySymbol}{fmt(totalTarget)}</div></div>
          <div className="metric-card"><div className="metric-label">{tr.completedLabel||'Completed'}</div><div className="metric-value green" style={{fontSize:15}}>{completedGoals}</div></div>
        </div>
      )}

      {loading && <div className="spinner"/>}
      {!loading && goals.length === 0 && (
        <div className="empty-state">
          <div className="icon">🎯</div>
          <p>{tr.noGoalsYet||'No savings goals yet'}</p>
          <p style={{marginTop:8, fontSize:13}}>{tr.tapToSetGoal||'Tap + to set your first goal'}</p>
        </div>
      )}

      {goals.map(goal => {
        const pct       = Math.min(100, Math.round(Number(goal.current_amount)/Number(goal.target_amount)*100))
        const remaining = Number(goal.target_amount) - Number(goal.current_amount)
        const done      = pct >= 100
        const daysLeft  = goal.deadline ? Math.ceil((new Date(goal.deadline)-new Date())/(1000*60*60*24)) : null
        const timePct   = timeProgress(goal.deadline, goal.created_at)
        const months    = monthsFromDeadline(goal.deadline, goal.created_at)
        const durLabel  = formatDuration(months)
        const monthly   = monthlyNeeded(goal.target_amount, goal.current_amount, goal.deadline)

        return (
          <div key={goal.id} className="card" style={{ marginBottom:12, padding:'16px' }}>
            {/* Header row */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:goal.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, border:`2px solid ${goal.color}44` }}>
                  {goal.icon}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{goal.name}</div>
                  {durLabel && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:2, padding:'2px 8px', background:goal.color+'18', borderRadius:10 }}>
                      <span style={{ fontSize:10 }}>⏱</span>
                      <span style={{ fontSize:10, fontWeight:700, color:goal.color }}>{durLabel}</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => deleteGoal(goal.id)} style={{ fontSize:12, color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>✕</button>
            </div>

            {/* Amount progress */}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
              <span style={{ fontWeight:700, color:goal.color }}>{currencySymbol}{fmt(goal.current_amount)}</span>
              <span style={{ color:'var(--text-muted)', fontSize:12 }}>of {currencySymbol}{fmt(goal.target_amount)}</span>
            </div>
            <div style={{ height:9, background:'#f3f4f6', borderRadius:5, overflow:'hidden', marginBottom:6 }}>
              <div style={{ height:'100%', width:`${pct}%`, background:done?'#1D9E75':goal.color, borderRadius:5, transition:'width 0.5s' }}/>
            </div>

            {/* Time progress (only if deadline set) */}
            {timePct !== null && !done && (
              <div style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginBottom:3 }}>
                  <span>⏱ Time elapsed</span>
                  <span style={{ fontWeight:600, color: timePct > pct ? '#A32D2D' : '#1D9E75' }}>{timePct}%</span>
                </div>
                <div style={{ height:5, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${timePct}%`, background: timePct > pct ? '#A32D2D88' : '#1D9E7566', borderRadius:3, transition:'width 0.5s' }}/>
                </div>
                {timePct > pct && (
                  <div style={{ fontSize:10, color:'#A32D2D', marginTop:2, fontWeight:600 }}>⚠️ Behind schedule — add funds to catch up</div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontSize:12, fontWeight:700, color:done?'#1D9E75':goal.color }}>{pct}%</span>
                {daysLeft !== null && (
                  <span style={{ fontSize:11, color: daysLeft<=30?'#A32D2D':'var(--text-muted)', fontWeight: daysLeft<=30 ? 600 : 400 }}>
                    {daysLeft > 0 ? `${daysLeft} ${tr.daysLeft||'days left'}` : (tr.deadlinePassed||'Deadline passed')}
                  </span>
                )}
                {monthly !== null && !done && monthly > 0 && (
                  <span style={{ fontSize:11, color:'var(--text-muted)', background:'#f3f4f6', padding:'2px 7px', borderRadius:8 }}>
                    {currencySymbol}{fmtS(monthly)}/mo needed
                  </span>
                )}
              </div>
              {done
                ? <span style={{ fontSize:12, fontWeight:700, color:'#1D9E75' }}>🎉 {tr.goalReached||'Goal reached!'}</span>
                : (
                  <button onClick={() => { setSelectedGoal(goal); setShowAddModal(true) }}
                    style={{ padding:'6px 14px', background:goal.color, color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {tr.addFunds||'+ Add funds'}
                  </button>
                )
              }
            </div>
          </div>
        )
      })}

      <button className="fab" onClick={() => setShowModal(true)}>+</button>

      {/* ── New goal modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{tr.newGoal||'New savings goal'}</div>

            <div className="form-group" style={{marginBottom:12}}>
              <label>{tr.goalName||'Goal name'}</label>
              <input type="text" placeholder="e.g. Emergency Fund, Vacation, New Car"
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>

            <div className="form-group" style={{marginBottom:12}}>
              <label>{tr.targetAmount||'Target amount'} ({currencySymbol})</label>
              <input type="number" placeholder="5000" min="0"
                value={form.target_amount} onChange={e=>setForm(f=>({...f,target_amount:e.target.value}))}/>
            </div>

            <div className="form-group" style={{marginBottom:12}}>
              <label>{tr.alreadySaved||'Already saved'} — optional</label>
              <input type="number" placeholder="0" min="0"
                value={form.current_amount} onChange={e=>setForm(f=>({...f,current_amount:e.target.value}))}/>
            </div>

            {/* ── Duration picker ── */}
            <div className="form-group" style={{marginBottom:12}}>
              <label>⏱ Saving duration</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                {DURATIONS.map(d => (
                  <button key={d.months} onClick={() => pickDuration(d.months)}
                    style={{ padding:'6px 12px', borderRadius:20, border:'1.5px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                      borderColor: form.duration_months === d.months ? '#1D9E75' : 'var(--border)',
                      background:  form.duration_months === d.months ? '#E1F5EE'  : 'var(--bg)',
                      color:       form.duration_months === d.months ? '#1D9E75'  : 'var(--text-muted)' }}>
                    {d.label}
                  </button>
                ))}
                <button onClick={() => setForm(f=>({...f, duration_months:null, deadline:''}))}
                  style={{ padding:'6px 12px', borderRadius:20, border:'1.5px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                    borderColor: !form.duration_months && !form.deadline ? '#1D9E75' : 'var(--border)',
                    background:  !form.duration_months && !form.deadline ? '#E1F5EE'  : 'var(--bg)',
                    color:       !form.duration_months && !form.deadline ? '#1D9E75'  : 'var(--text-muted)' }}>
                  No deadline
                </button>
              </div>
              {/* Or pick a custom date */}
              <div style={{ marginTop:8 }}>
                <label style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>Or pick a custom end date:</label>
                <input type="date" style={{ marginTop:4 }} value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value, duration_months: null }))}/>
              </div>
              {/* Live preview */}
              {form.deadline && (
                <div style={{ marginTop:8, padding:'8px 12px', background:'#E1F5EE', borderRadius:8, fontSize:12, color:'#0F6E56', fontWeight:600 }}>
                  📅 {formatDuration(monthsFromDeadline(form.deadline, null))} — ends {new Date(form.deadline).toLocaleDateString('en-US',{month:'short',year:'numeric'})}
                  {form.target_amount && (
                    <div style={{ marginTop:4, fontSize:11, color:'#1D9E75' }}>
                      💡 Save {currencySymbol}{fmtS(monthlyNeeded(form.target_amount, form.current_amount||0, form.deadline))}/month to reach your goal
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Icon picker */}
            <div className="form-group" style={{marginBottom:12}}>
              <label>{tr.iconLabel||'Icon'}</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                {GOAL_ICONS.map(icon=>(
                  <button key={icon} onClick={()=>setForm(f=>({...f,icon}))}
                    style={{width:36,height:36,borderRadius:8,border:`2px solid ${form.icon===icon?'var(--green)':'var(--border)'}`,background:form.icon===icon?'var(--green-light)':'var(--bg)',fontSize:18,cursor:'pointer'}}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="form-group" style={{marginBottom:16}}>
              <label>{tr.colorLabel||'Color'}</label>
              <div style={{display:'flex',gap:8,marginTop:4}}>
                {GOAL_COLORS.map(color=>(
                  <div key={color} onClick={()=>setForm(f=>({...f,color}))}
                    style={{width:28,height:28,borderRadius:'50%',background:color,cursor:'pointer',border:form.color===color?'3px solid #000':'3px solid transparent'}}/>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={()=>setShowModal(false)}
                style={{padding:"14px", fontSize:14, fontWeight:600, background:"#f3f4f6", color:"#666", border:"none", borderRadius:10, cursor:"pointer"}}>
                {tr.cancel||'Cancel'}
              </button>
              <button onClick={saveGoal} disabled={saving}
                style={{flex:2, padding:"14px", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #1D9E75, #0F6E56)", color:"white", border:"none", borderRadius:10, cursor:"pointer"}}>
                {saving ? (tr.saving||'💾 Saving…') : (tr.saveGoal||'💾 Save Goal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add funds modal ─────────────────────────────────────────────────── */}
      {showAddModal && selectedGoal && (
        <div className="modal-overlay" onClick={()=>setShowAddModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:'center',fontSize:40,marginBottom:8}}>{selectedGoal.icon}</div>
            <div className="modal-title">{selectedGoal.name}</div>
            {/* Duration badge */}
            {selectedGoal.deadline && (
              <div style={{ textAlign:'center', marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#1D9E75', background:'#E1F5EE', padding:'3px 10px', borderRadius:12 }}>
                  ⏱ {formatDuration(monthsFromDeadline(selectedGoal.deadline, selectedGoal.created_at))}
                </span>
              </div>
            )}
            <div style={{textAlign:'center',fontSize:13,color:'var(--text-muted)',marginBottom:8}}>
              {currencySymbol}{fmt(selectedGoal.current_amount)} {tr.totalSaved||'saved'} of {currencySymbol}{fmt(selectedGoal.target_amount)}
            </div>
            {/* Monthly guidance */}
            {monthlyNeeded(selectedGoal.target_amount, selectedGoal.current_amount, selectedGoal.deadline) > 0 && (
              <div style={{ background:'#E1F5EE', borderRadius:10, padding:'8px 12px', marginBottom:14, fontSize:12, color:'#0F6E56', fontWeight:600, textAlign:'center' }}>
                💡 Add {currencySymbol}{fmtS(monthlyNeeded(selectedGoal.target_amount, selectedGoal.current_amount, selectedGoal.deadline))}/month to stay on track
              </div>
            )}
            <div className="form-group" style={{marginBottom:16}}>
              <label>{tr.amountLabel||'Amount to add'} ({currencySymbol})</label>
              <input type="number" placeholder="100" min="0" autoFocus value={addAmount} onChange={e=>setAddAmount(e.target.value)}/>
            </div>
            <div className="modal-actions">
              <button onClick={()=>setShowAddModal(false)}
                style={{padding:"14px", fontSize:14, fontWeight:600, background:"#f3f4f6", color:"#666", border:"none", borderRadius:10, cursor:"pointer"}}>
                {tr.cancel||'Cancel'}
              </button>
              <button onClick={addToGoal} disabled={saving}
                style={{flex:2, padding:"14px", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #1D9E75, #0F6E56)", color:"white", border:"none", borderRadius:10, cursor:"pointer"}}>
                {saving ? (tr.saving||'💾 Saving…') : (tr.save||'💾 Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
