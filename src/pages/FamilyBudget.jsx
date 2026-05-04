import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SYMBOLS   = { USD:'$',EUR:'€',GBP:'£',CAD:'C$',AUD:'A$',NGN:'₦',KES:'KSh',GHS:'₵',ZAR:'R',XOF:'CFA',XAF:'FCFA',INR:'₹',BRL:'R$',MXN:'MX$',CNY:'¥',JPY:'¥',KRW:'₩',RUB:'₽' }
const CATS      = ['Needs','Wants','Giving','Savings','Investments']
const CAT_COLOR = { Needs:'#185FA5',Wants:'#BA7517',Giving:'#C2185B',Savings:'#1D9E75',Investments:'#3B6D11' }
const fmt       = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function genCode() { return Math.random().toString(36).toUpperCase().slice(2,8) }

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
}

function Avatar({ name, color='#1D9E75', size=24 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:color+'33', border:`1.5px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, color, flexShrink:0 }}>
      {initials(name)}
    </div>
  )
}

const MEMBER_COLORS = ['#1D9E75','#185FA5','#BA7517','#A32D2D','#534AB7','#0F6E56','#C2185B','#3B6D11']

export default function FamilyBudget({ session }) {
  const userId  = session.user.id
  const userEmail = session.user.email

  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [household,  setHousehold]  = useState(null)   // current household
  const [members,    setMembers]    = useState([])
  const [income,     setIncome]     = useState([])
  const [expenses,   setExpenses]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('budget')  // budget | members | settings

  const now   = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())

  // Form state
  const [showIncome,  setShowIncome]  = useState(false)
  const [showExpense, setShowExpense] = useState(false)
  const [incForm,  setIncForm]  = useState({ description:'', amount:'' })
  const [expForm,  setExpForm]  = useState({ description:'', amount:'', category:'Needs' })
  const [saving,   setSaving]   = useState(false)

  // Household create/join UI
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin,   setShowJoin]   = useState(false)
  const [houseName,  setHouseName]  = useState('')
  const [joinCode,   setJoinCode]   = useState('')
  const [joinError,  setJoinError]  = useState('')
  const [displayName, setDisplayName] = useState('')
  const [copied,     setCopied]     = useState(false)

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setCurrencySymbol(SYMBOLS[data.currency] || data.currency) })
  }, [userId])

  // Load household membership
  useEffect(() => { loadHousehold() }, [userId])

  async function loadHousehold() {
    setLoading(true)
    const { data: memberRow } = await supabase
      .from('household_members')
      .select('*, households(*)')
      .eq('user_id', userId)
      .single()

    if (memberRow?.households) {
      setHousehold(memberRow.households)
    }
    setLoading(false)
  }

  // Load members + budget when household is set
  useEffect(() => {
    if (household) { loadMembers(); loadBudget() }
  }, [household, month, year])

  async function loadMembers() {
    const { data } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', household.id)
    setMembers(data || [])
  }

  async function loadBudget() {
    const [{ data: inc }, { data: exp }] = await Promise.all([
      supabase.from('family_income').select('*').eq('household_id', household.id).eq('month', month).eq('year', year).order('created_at', { ascending:false }),
      supabase.from('family_expenses').select('*').eq('household_id', household.id).eq('month', month).eq('year', year).order('created_at', { ascending:false }),
    ])
    setIncome(inc || [])
    setExpenses(exp || [])
  }

  // ── Create household ──────────────────────────────────────────────────────
  async function createHousehold() {
    if (!houseName.trim()) return
    setSaving(true)
    const code = genCode()
    const { data: hh, error } = await supabase.from('households').insert({
      name: houseName.trim(), invite_code: code, owner_id: userId,
    }).select().single()

    if (!error && hh) {
      await supabase.from('household_members').insert({
        household_id: hh.id, user_id: userId,
        display_name: displayName.trim() || userEmail.split('@')[0],
      })
      setHousehold(hh)
      setShowCreate(false)
    }
    setSaving(false)
  }

  // ── Join household ────────────────────────────────────────────────────────
  async function joinHousehold() {
    if (!joinCode.trim()) return
    setSaving(true); setJoinError('')
    const { data: hh } = await supabase
      .from('households').select('*').eq('invite_code', joinCode.trim().toUpperCase()).single()

    if (!hh) { setJoinError('Invalid code. Check and try again.'); setSaving(false); return }

    const { error } = await supabase.from('household_members').insert({
      household_id: hh.id, user_id: userId,
      display_name: displayName.trim() || userEmail.split('@')[0],
    })

    if (error && error.code === '23505') { setJoinError('You are already a member of this household.'); setSaving(false); return }
    setHousehold(hh); setShowJoin(false)
    setSaving(false)
  }

  // ── Leave household ───────────────────────────────────────────────────────
  async function leaveHousehold() {
    if (!window.confirm('Leave this family budget?')) return
    await supabase.from('household_members').delete().eq('user_id', userId).eq('household_id', household.id)
    setHousehold(null); setMembers([]); setIncome([]); setExpenses([])
  }

  // ── Add income / expense ──────────────────────────────────────────────────
  async function addIncome() {
    if (!incForm.description || !incForm.amount) return
    setSaving(true)
    const myName = members.find(m=>m.user_id===userId)?.display_name || userEmail.split('@')[0]
    await supabase.from('family_income').insert({
      household_id: household.id, description: incForm.description,
      amount: parseFloat(incForm.amount), month, year,
      added_by: userId, added_by_name: myName,
    })
    setIncForm({ description:'', amount:'' }); setShowIncome(false)
    setSaving(false); loadBudget()
  }

  async function addExpense() {
    if (!expForm.description || !expForm.amount) return
    setSaving(true)
    const myName = members.find(m=>m.user_id===userId)?.display_name || userEmail.split('@')[0]
    await supabase.from('family_expenses').insert({
      household_id: household.id, description: expForm.description,
      amount: parseFloat(expForm.amount), category: expForm.category, month, year,
      added_by: userId, added_by_name: myName,
    })
    setExpForm({ description:'', amount:'', category:'Needs' }); setShowExpense(false)
    setSaving(false); loadBudget()
  }

  async function deleteIncome(id)  { await supabase.from('family_income').delete().eq('id', id); loadBudget() }
  async function deleteExpense(id) { await supabase.from('family_expenses').delete().eq('id', id); loadBudget() }

  function copyCode() {
    navigator.clipboard?.writeText(household.invite_code).catch(()=>{})
    setCopied(true); setTimeout(()=>setCopied(false), 2000)
  }

  function memberColor(userId) {
    const idx = members.findIndex(m=>m.user_id===userId)
    return MEMBER_COLORS[idx % MEMBER_COLORS.length]
  }

  const totalIncome   = income.reduce((s,r)=>s+Number(r.amount),0)
  const totalExpenses = expenses.reduce((s,r)=>s+Number(r.amount),0)
  const surplus       = totalIncome - totalExpenses

  // ── No household yet ──────────────────────────────────────────────────────
  if (!loading && !household) {
    return (
      <div style={{ paddingBottom:100 }}>
        <div style={{ background:'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
          <div style={{ fontSize:28, marginBottom:4 }}>👨‍👩‍👧‍👦</div>
          <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>Family Budget</h2>
          <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>Budget together as a household</p>
        </div>

        <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:14 }}>
          {/* Create */}
          {!showCreate && !showJoin && (
            <>
              <button onClick={()=>setShowCreate(true)}
                style={{ padding:'18px', background:'linear-gradient(135deg,#1D9E75,#0F6E56)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>✦</span>
                <div style={{ textAlign:'left' }}>
                  <div>Create a Family Budget</div>
                  <div style={{ fontSize:11, opacity:0.85, fontWeight:400 }}>Start a household and invite your family</div>
                </div>
              </button>

              <button onClick={()=>setShowJoin(true)}
                style={{ padding:'18px', background:'linear-gradient(135deg,#185FA5,#0d3f70)', color:'white', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <span style={{ fontSize:24 }}>🔑</span>
                <div style={{ textAlign:'left' }}>
                  <div>Join a Family Budget</div>
                  <div style={{ fontSize:11, opacity:0.85, fontWeight:400 }}>Enter the invite code your family shared</div>
                </div>
              </button>
            </>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>✦ Create Family Budget</div>
              <div className="form-group" style={{ marginBottom:12 }}>
                <label>Household name</label>
                <input type="text" placeholder="e.g. The Johnson Family" value={houseName} onChange={e=>setHouseName(e.target.value)} autoFocus/>
              </div>
              <div className="form-group" style={{ marginBottom:16 }}>
                <label>Your name (visible to family)</label>
                <input type="text" placeholder={userEmail.split('@')[0]} value={displayName} onChange={e=>setDisplayName(e.target.value)}/>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowCreate(false)} style={{ flex:1,padding:'12px',background:'#f3f4f6',border:'none',borderRadius:10,fontWeight:600,cursor:'pointer',color:'#666' }}>Cancel</button>
                <button onClick={createHousehold} disabled={saving||!houseName.trim()}
                  style={{ flex:2,padding:'12px',background:'linear-gradient(135deg,#1D9E75,#0F6E56)',color:'white',border:'none',borderRadius:10,fontWeight:700,fontSize:14,cursor:'pointer',opacity:houseName.trim()?1:0.5 }}>
                  {saving?'Creating…':'✦ Create'}
                </button>
              </div>
            </div>
          )}

          {/* Join form */}
          {showJoin && (
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>🔑 Join Family Budget</div>
              <div className="form-group" style={{ marginBottom:12 }}>
                <label>6-digit invite code</label>
                <input type="text" placeholder="e.g. AB1C2D" maxLength={6}
                  value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} autoFocus
                  style={{ textTransform:'uppercase', letterSpacing:'0.2em', fontSize:18, fontWeight:700 }}/>
                {joinError && <div style={{ color:'#A32D2D', fontSize:12, marginTop:4 }}>⚠️ {joinError}</div>}
              </div>
              <div className="form-group" style={{ marginBottom:16 }}>
                <label>Your name (visible to family)</label>
                <input type="text" placeholder={userEmail.split('@')[0]} value={displayName} onChange={e=>setDisplayName(e.target.value)}/>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>{setShowJoin(false);setJoinError('')}} style={{ flex:1,padding:'12px',background:'#f3f4f6',border:'none',borderRadius:10,fontWeight:600,cursor:'pointer',color:'#666' }}>Cancel</button>
                <button onClick={joinHousehold} disabled={saving||joinCode.length<6}
                  style={{ flex:2,padding:'12px',background:'linear-gradient(135deg,#185FA5,#0d3f70)',color:'white',border:'none',borderRadius:10,fontWeight:700,fontSize:14,cursor:'pointer',opacity:joinCode.length>=6?1:0.5 }}>
                  {saving?'Joining…':'🔑 Join'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ paddingTop:40 }}><div className="spinner"/></div>

  // ── Main household view ───────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom:100 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius:'16px 16px 0 0', padding:'18px 16px 24px', marginBottom:'-14px', color:'white' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, opacity:0.75, letterSpacing:'0.08em' }}>FAMILY BUDGET</div>
            <h2 style={{ color:'white', margin:'2px 0 2px', fontSize:20, fontWeight:800 }}>{household.name}</h2>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {members.map((m,i)=>(
                <Avatar key={m.id} name={m.display_name} color={MEMBER_COLORS[i%MEMBER_COLORS.length]} size={22}/>
              ))}
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.75)', marginLeft:4 }}>{members.length} member{members.length!==1?'s':''}</span>
            </div>
          </div>
          {/* Invite code badge */}
          <button onClick={copyCode}
            style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:10, padding:'6px 12px', color:'white', cursor:'pointer', textAlign:'center' }}>
            <div style={{ fontSize:9, opacity:0.8, fontWeight:600 }}>INVITE CODE</div>
            <div style={{ fontSize:16, fontWeight:900, letterSpacing:'0.15em' }}>{household.invite_code}</div>
            <div style={{ fontSize:9, opacity:0.7 }}>{copied?'✓ Copied!':'Tap to copy'}</div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, margin:'18px 0 12px' }}>
        {[['budget','💳 Budget'],['members','👥 Members'],['settings','⚙️ Settings']].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            style={{ flex:1, padding:'9px 4px', borderRadius:10, border:'1.5px solid', fontWeight:700, fontSize:12, cursor:'pointer',
              borderColor:tab===v?'#1D9E75':'var(--border)', background:tab===v?'#1D9E75':'white', color:tab===v?'white':'var(--text-muted)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── BUDGET TAB ──────────────────────────────────────────────────────── */}
      {tab==='budget' && (
        <>
          {/* Month navigator */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, background:'white', borderRadius:12, padding:'10px 16px', border:'1px solid #e5e7eb' }}>
            <button onClick={()=>{ if(month===1){setMonth(12);setYear(y=>y-1)} else setMonth(m=>m-1) }}
              style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--green)' }}>‹</button>
            <span style={{ fontWeight:700, fontSize:15 }}>{MONTHS[month-1]} {year}</span>
            <button onClick={()=>{ if(month===12){setMonth(1);setYear(y=>y+1)} else setMonth(m=>m+1) }}
              style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--green)' }}>›</button>
          </div>

          {/* Metric cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            <div className="metric-card"><div className="metric-label">Income</div><div className="metric-value green" style={{fontSize:14}}>{currencySymbol}{fmt(totalIncome)}</div></div>
            <div className="metric-card"><div className="metric-label">Expenses</div><div className="metric-value red" style={{fontSize:14}}>{currencySymbol}{fmt(totalExpenses)}</div></div>
            <div className="metric-card"><div className="metric-label">Surplus</div><div className="metric-value" style={{fontSize:14,color:surplus>=0?'#1D9E75':'#A32D2D'}}>{surplus>=0?'+':''}{currencySymbol}{fmt(Math.abs(surplus))}</div></div>
          </div>

          {/* INCOME */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div className="section-title" style={{ margin:0 }}>💚 Income</div>
            <button onClick={()=>setShowIncome(true)}
              style={{ fontSize:12,padding:'4px 12px',background:'var(--green)',color:'white',border:'none',borderRadius:6,cursor:'pointer' }}>+ Add</button>
          </div>

          {income.length===0 && <div style={{ fontSize:13,color:'var(--text-muted)',marginBottom:12,padding:'10px',textAlign:'center' }}>No income added yet</div>}
          {income.map(row=>(
            <div key={row.id} style={{ display:'flex',alignItems:'center',gap:10,background:'white',borderRadius:10,padding:'10px 14px',marginBottom:6,border:'1px solid #e5e7eb' }}>
              <Avatar name={row.added_by_name} color={memberColor(row.added_by)} size={28}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{row.description}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{row.added_by_name}</div>
              </div>
              <div style={{ fontWeight:700, color:'#1D9E75', fontSize:14 }}>{currencySymbol}{fmt(row.amount)}</div>
              {row.added_by===userId && (
                <button onClick={()=>deleteIncome(row.id)} style={{ fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer' }}>✕</button>
              )}
            </div>
          ))}

          {/* EXPENSES */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'14px 0 8px' }}>
            <div className="section-title" style={{ margin:0 }}>🔴 Expenses</div>
            <button onClick={()=>setShowExpense(true)}
              style={{ fontSize:12,padding:'4px 12px',background:'#A32D2D',color:'white',border:'none',borderRadius:6,cursor:'pointer' }}>+ Add</button>
          </div>

          {expenses.length===0 && <div style={{ fontSize:13,color:'var(--text-muted)',marginBottom:12,padding:'10px',textAlign:'center' }}>No expenses added yet</div>}
          {expenses.map(row=>(
            <div key={row.id} style={{ display:'flex',alignItems:'center',gap:10,background:'white',borderRadius:10,padding:'10px 14px',marginBottom:6,border:'1px solid #e5e7eb' }}>
              <Avatar name={row.added_by_name} color={memberColor(row.added_by)} size={28}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{row.description}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{row.added_by_name}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:700, color:'#A32D2D', fontSize:14 }}>{currencySymbol}{fmt(row.amount)}</div>
                <div style={{ fontSize:9, padding:'1px 6px', borderRadius:8, background:CAT_COLOR[row.category]+'22', color:CAT_COLOR[row.category], fontWeight:600 }}>{row.category}</div>
              </div>
              {row.added_by===userId && (
                <button onClick={()=>deleteExpense(row.id)} style={{ fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer' }}>✕</button>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── MEMBERS TAB ─────────────────────────────────────────────────────── */}
      {tab==='members' && (
        <>
          <div style={{ background:'#E1F5EE',borderRadius:12,padding:'12px 16px',marginBottom:16,border:'1px solid #1D9E75' }}>
            <div style={{ fontSize:13,fontWeight:700,color:'#0F6E56',marginBottom:4 }}>Share this invite code with your family:</div>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ fontSize:28,fontWeight:900,color:'#1D9E75',letterSpacing:'0.2em' }}>{household.invite_code}</div>
              <button onClick={copyCode}
                style={{ padding:'6px 14px',background:'#1D9E75',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer' }}>
                {copied?'✓ Copied!':'Copy'}
              </button>
            </div>
            <div style={{ fontSize:11,color:'#0F6E56',marginTop:6 }}>They go to the app → Family Budget → Join → Enter this code</div>
          </div>

          {members.map((m,i)=>(
            <div key={m.id} style={{ display:'flex',alignItems:'center',gap:12,background:'white',borderRadius:12,padding:'12px 16px',marginBottom:8,border:'1px solid #e5e7eb' }}>
              <Avatar name={m.display_name} color={MEMBER_COLORS[i%MEMBER_COLORS.length]} size={40}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14 }}>{m.display_name}</div>
                <div style={{ fontSize:11,color:'var(--text-muted)' }}>
                  {m.user_id===household.owner_id ? '👑 Owner' : '👤 Member'} · Joined {new Date(m.joined_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── SETTINGS TAB ────────────────────────────────────────────────────── */}
      {tab==='settings' && (
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:4 }}>👨‍👩‍👧‍👦 {household.name}</div>
            <div style={{ fontSize:12,color:'var(--text-muted)' }}>Invite code: <strong>{household.invite_code}</strong></div>
            <div style={{ fontSize:12,color:'var(--text-muted)' }}>{members.length} member{members.length!==1?'s':''}</div>
          </div>
          <button onClick={leaveHousehold}
            style={{ padding:'14px',background:'#FCEBEB',color:'#A32D2D',border:'1px solid #A32D2D33',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer' }}>
            🚪 Leave Family Budget
          </button>
        </div>
      )}

      {/* ── Income modal ──────────────────────────────────────────────────────── */}
      {showIncome && (
        <div className="modal-overlay" onClick={()=>setShowIncome(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">💚 Add Income</div>
            <div className="form-group" style={{marginBottom:12}}>
              <label>Description</label>
              <input type="text" placeholder="e.g. Salary, Freelance…" autoFocus value={incForm.description} onChange={e=>setIncForm(f=>({...f,description:e.target.value}))}/>
            </div>
            <div className="form-group" style={{marginBottom:16}}>
              <label>Amount ({currencySymbol})</label>
              <input type="number" placeholder="0.00" min="0" value={incForm.amount} onChange={e=>setIncForm(f=>({...f,amount:e.target.value}))}/>
            </div>
            <div className="modal-actions">
              <button onClick={()=>setShowIncome(false)} style={{padding:'14px',fontSize:14,fontWeight:600,background:'#f3f4f6',color:'#666',border:'none',borderRadius:10,cursor:'pointer'}}>Cancel</button>
              <button onClick={addIncome} disabled={saving} style={{flex:2,padding:'14px',fontSize:16,fontWeight:700,background:'linear-gradient(135deg,#1D9E75,#0F6E56)',color:'white',border:'none',borderRadius:10,cursor:'pointer'}}>
                {saving?'Saving…':'💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expense modal ─────────────────────────────────────────────────────── */}
      {showExpense && (
        <div className="modal-overlay" onClick={()=>setShowExpense(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">🔴 Add Expense</div>
            <div className="form-group" style={{marginBottom:12}}>
              <label>Description</label>
              <input type="text" placeholder="e.g. Rent, Groceries…" autoFocus value={expForm.description} onChange={e=>setExpForm(f=>({...f,description:e.target.value}))}/>
            </div>
            <div className="form-group" style={{marginBottom:12}}>
              <label>Amount ({currencySymbol})</label>
              <input type="number" placeholder="0.00" min="0" value={expForm.amount} onChange={e=>setExpForm(f=>({...f,amount:e.target.value}))}/>
            </div>
            <div className="form-group" style={{marginBottom:16}}>
              <label>Category</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                {CATS.map(c=>(
                  <button key={c} onClick={()=>setExpForm(f=>({...f,category:c}))}
                    style={{padding:'6px 12px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:600,cursor:'pointer',
                      borderColor:expForm.category===c?CAT_COLOR[c]:'var(--border)',
                      background:expForm.category===c?CAT_COLOR[c]+'22':'var(--bg)',
                      color:expForm.category===c?CAT_COLOR[c]:'var(--text-muted)'}}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={()=>setShowExpense(false)} style={{padding:'14px',fontSize:14,fontWeight:600,background:'#f3f4f6',color:'#666',border:'none',borderRadius:10,cursor:'pointer'}}>Cancel</button>
              <button onClick={addExpense} disabled={saving} style={{flex:2,padding:'14px',fontSize:16,fontWeight:700,background:'linear-gradient(135deg,#A32D2D,#7B1C1C)',color:'white',border:'none',borderRadius:10,cursor:'pointer'}}>
                {saving?'Saving…':'💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
