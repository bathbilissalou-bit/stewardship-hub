import { useState, useEffect } from 'react'
import { useT } from '../lib/i18n'

// ── Local storage helpers (no extra DB tables needed) ────────────────────────
const LS_DEST = uid => `sh_travel_dest_${uid}`
const LS_DOCS = uid => `sh_travel_docs_${uid}`
const uid4 = () => Math.random().toString(36).slice(2, 10)

function load(key) { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)) }

// ── Constants ────────────────────────────────────────────────────────────────
const DEST_STATUS = [
  { value:'wishlist', label:'Wishlist',  icon:'⭐', color:'#BA7517', bg:'#FEF3CD' },
  { value:'planned',  label:'Planned',   icon:'📅', color:'#185FA5', bg:'#E6F1FB' },
  { value:'visited',  label:'Visited',   icon:'✅', color:'#1D9E75', bg:'#E1F5EE' },
]

const DOC_TYPES = [
  { value:'passport',   label:'Passport',           icon:'📗' },
  { value:'national_id',label:'National ID',        icon:'🪪' },
  { value:'visa',       label:'Visa',               icon:'🔖' },
  { value:'drivers',    label:"Driver's License",   icon:'🚗' },
  { value:'residence',  label:'Residence Permit',   icon:'🏠' },
  { value:'other',      label:'Other',              icon:'📄' },
]

const POPULAR_COUNTRIES = [
  '🇺🇸 USA','🇨🇦 Canada','🇫🇷 France','🇬🇧 UK','🇯🇵 Japan','🇧🇷 Brazil',
  '🇳🇬 Nigeria','🇬🇭 Ghana','🇰🇪 Kenya','🇿🇦 South Africa','🇮🇳 India',
  '🇦🇪 UAE','🇪🇸 Spain','🇮🇹 Italy','🇩🇪 Germany','🇲🇽 Mexico',
  '🇹🇭 Thailand','🇵🇹 Portugal','🇳🇿 New Zealand','🇸🇬 Singapore',
]

// ── Expiry helpers ────────────────────────────────────────────────────────────
function daysUntilExpiry(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24))
}

function expiryStatus(days) {
  if (days === null) return null
  if (days < 0)   return { label:'Expired',        color:'#A32D2D', bg:'#FCEBEB', icon:'❌' }
  if (days < 90)  return { label:'Expires soon!',  color:'#A32D2D', bg:'#FCEBEB', icon:'🔴' }
  if (days < 180) return { label:'Expiring',       color:'#BA7517', bg:'#FAEEDA', icon:'🟠' }
  if (days < 365) return { label:'Valid',          color:'#BA7517', bg:'#FFF3CD', icon:'🟡' }
  return                  { label:'Valid',          color:'#1D9E75', bg:'#E1F5EE', icon:'🟢' }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
}

// ── Modals ────────────────────────────────────────────────────────────────────
function DestModal({ onSave, onClose }) {
  const [form, setForm] = useState({ country:'', city:'', status:'wishlist', notes:'', planned_date:'' })
  const [custom, setCustom] = useState(false)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">🌍 Add Destination</div>

        <div className="form-group" style={{marginBottom:12}}>
          <label>Country</label>
          {!custom ? (
            <>
              <select value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}>
                <option value="">— Select country —</option>
                {POPULAR_COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={()=>setCustom(true)} style={{marginTop:5,fontSize:11,color:'#185FA5',background:'none',border:'none',cursor:'pointer',padding:0}}>
                + Type a different country
              </button>
            </>
          ) : (
            <input type="text" placeholder="e.g. Morocco, Ethiopia, Cuba…"
              value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} autoFocus/>
          )}
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label>City — optional</label>
          <input type="text" placeholder="e.g. Paris, Nairobi, Tokyo…"
            value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/>
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label>Status</label>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            {DEST_STATUS.map(s=>(
              <button key={s.value} onClick={()=>setForm(f=>({...f,status:s.value}))}
                style={{flex:1,padding:'8px 4px',borderRadius:10,border:'1.5px solid',cursor:'pointer',fontSize:11,fontWeight:700,
                  borderColor:form.status===s.value?s.color:'var(--border)',
                  background:form.status===s.value?s.bg:'var(--bg)',
                  color:form.status===s.value?s.color:'var(--text-muted)'}}>
                {s.icon}<br/>{s.label}
              </button>
            ))}
          </div>
        </div>

        {form.status==='planned' && (
          <div className="form-group" style={{marginBottom:12}}>
            <label>📅 Planned travel date</label>
            <input type="date" value={form.planned_date} onChange={e=>setForm(f=>({...f,planned_date:e.target.value}))}/>
          </div>
        )}

        <div className="form-group" style={{marginBottom:16}}>
          <label>Notes — optional</label>
          <input type="text" placeholder="e.g. Honeymoon, solo trip, family vacation…"
            value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} style={{padding:'14px',fontSize:14,fontWeight:600,background:'#f3f4f6',color:'#666',border:'none',borderRadius:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={()=>form.country && onSave({...form,id:uid4(),created_at:new Date().toISOString()})}
            disabled={!form.country}
            style={{flex:2,padding:'14px',fontSize:16,fontWeight:700,background:'linear-gradient(135deg,#1D9E75,#0F6E56)',color:'white',border:'none',borderRadius:10,cursor:'pointer',opacity:form.country?1:0.5}}>
            💾 Save Destination
          </button>
        </div>
      </div>
    </div>
  )
}

function DocModal({ onSave, onClose }) {
  const [form, setForm] = useState({ type:'passport', name:'', country:'', number:'', issue_date:'', expiry_date:'', notes:'' })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">📄 Add Travel Document</div>

        <div className="form-group" style={{marginBottom:12}}>
          <label>Document type</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:6}}>
            {DOC_TYPES.map(t=>(
              <button key={t.value} onClick={()=>setForm(f=>({...f,type:t.value}))}
                style={{padding:'8px',borderRadius:10,border:'1.5px solid',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:6,
                  borderColor:form.type===t.value?'#185FA5':'var(--border)',
                  background:form.type===t.value?'#E6F1FB':'var(--bg)',
                  color:form.type===t.value?'#185FA5':'var(--text-muted)'}}>
                <span style={{fontSize:16}}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label>Name on document</label>
          <input type="text" placeholder="e.g. John Doe" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label>Issuing country</label>
          <input type="text" placeholder="e.g. Nigeria, Canada, France…" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}/>
        </div>

        <div className="form-group" style={{marginBottom:12}}>
          <label>Document number — optional</label>
          <input type="text" placeholder="e.g. A12345678" value={form.number} onChange={e=>setForm(f=>({...f,number:e.target.value}))}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <div className="form-group">
            <label>Issue date</label>
            <input type="date" value={form.issue_date} onChange={e=>setForm(f=>({...f,issue_date:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label>Expiry date ⚠️</label>
            <input type="date" value={form.expiry_date} onChange={e=>setForm(f=>({...f,expiry_date:e.target.value}))}/>
          </div>
        </div>

        {/* Live expiry preview */}
        {form.expiry_date && (() => {
          const days = daysUntilExpiry(form.expiry_date)
          const status = expiryStatus(days)
          return (
            <div style={{background:status.bg,borderRadius:10,padding:'8px 12px',marginBottom:12,fontSize:12,color:status.color,fontWeight:600}}>
              {status.icon} {days < 0 ? 'Already expired!' : `Expires in ${days} days (${formatDate(form.expiry_date)})`}
            </div>
          )
        })()}

        <div className="form-group" style={{marginBottom:16}}>
          <label>Notes — optional</label>
          <input type="text" placeholder="e.g. Renewal in progress…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} style={{padding:'14px',fontSize:14,fontWeight:600,background:'#f3f4f6',color:'#666',border:'none',borderRadius:10,cursor:'pointer'}}>Cancel</button>
          <button onClick={()=>(form.name||form.country) && onSave({...form,id:uid4(),created_at:new Date().toISOString()})}
            disabled={!form.name && !form.country}
            style={{flex:2,padding:'14px',fontSize:16,fontWeight:700,background:'linear-gradient(135deg,#185FA5,#0d3f70)',color:'white',border:'none',borderRadius:10,cursor:'pointer',opacity:(form.name||form.country)?1:0.5}}>
            💾 Save Document
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Travel({ session }) {
  const tr = useT()
  const userId = session?.user?.id || 'guest'
  const [tab,       setTab]       = useState('destinations')
  const [dest,      setDest]      = useState(() => load(LS_DEST(userId)))
  const [docs,      setDocs]      = useState(() => load(LS_DOCS(userId)))
  const [showDest,  setShowDest]  = useState(false)
  const [showDoc,   setShowDoc]   = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  function saveDests(next) { setDest(next); save(LS_DEST(userId), next) }
  function saveDocs(next)  { setDocs(next);  save(LS_DOCS(userId),  next) }

  function addDest(d)  { saveDests([d, ...dest]); setShowDest(false) }
  function addDoc(d)   { saveDocs([d,  ...docs]);  setShowDoc(false)  }
  function delDest(id) { saveDests(dest.filter(d=>d.id!==id)) }
  function delDoc(id)  { saveDocs(docs.filter(d=>d.id!==id))  }
  function cycleDest(id) {
    const order = ['wishlist','planned','visited']
    saveDests(dest.map(d => d.id===id ? {...d, status: order[(order.indexOf(d.status)+1)%3]} : d))
  }

  // Expiry alerts
  const expiringSoon = docs.filter(d => {
    const days = daysUntilExpiry(d.expiry_date)
    return days !== null && days < 180
  })

  const visited   = dest.filter(d=>d.status==='visited').length
  const planned   = dest.filter(d=>d.status==='planned').length
  const wishlist  = dest.filter(d=>d.status==='wishlist').length
  const filteredDest = filterStatus==='all' ? dest : dest.filter(d=>d.status===filterStatus)

  return (
    <div style={{paddingBottom:100}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#534AB7,#185FA5)',borderRadius:'16px 16px 0 0',padding:'18px 16px 28px',marginBottom:'-14px',color:'white'}}>
        <div style={{fontSize:28,marginBottom:4}}>✈️</div>
        <h2 style={{color:'white',margin:'0 0 4px',fontSize:22,fontWeight:800}}>Travel Planner</h2>
        <p style={{color:'rgba(255,255,255,0.8)',margin:0,fontSize:13}}>Plan trips & track travel documents</p>
      </div>

      {/* Expiry alerts */}
      {expiringSoon.length > 0 && (
        <div style={{marginTop:16}}>
          {expiringSoon.map(d=>{
            const days = daysUntilExpiry(d.expiry_date)
            const st   = expiryStatus(days)
            return (
              <div key={d.id} style={{background:st.bg,borderRadius:10,padding:'10px 14px',marginBottom:8,border:`1px solid ${st.color}44`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:st.color}}>{st.icon} {DOC_TYPES.find(t=>t.value===d.type)?.label||d.type} — {d.name||d.country}</div>
                  <div style={{fontSize:11,color:st.color,opacity:0.8}}>{days<0?'Expired!': `Expires in ${days} days — ${formatDate(d.expiry_date)}`}</div>
                </div>
                <span style={{fontSize:20}}>{DOC_TYPES.find(t=>t.value===d.type)?.icon}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:8,margin:'16px 0 12px'}}>
        {[['destinations','🌍 Destinations'],['documents','📄 Documents']].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            style={{flex:1,padding:'10px',borderRadius:10,border:'1.5px solid',fontWeight:700,fontSize:13,cursor:'pointer',
              borderColor:tab===v?'#534AB7':'var(--border)',
              background:tab===v?'#534AB7':'white',
              color:tab===v?'white':'var(--text-muted)'}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── DESTINATIONS TAB ─────────────────────────────────────────────── */}
      {tab==='destinations' && (
        <>
          {/* Stats */}
          {dest.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
              {[['✅','Visited',visited,'#1D9E75'],['📅','Planned',planned,'#185FA5'],['⭐','Wishlist',wishlist,'#BA7517']].map(([ic,l,n,c])=>(
                <div key={l} className="metric-card" style={{textAlign:'center'}}>
                  <div style={{fontSize:18}}>{ic}</div>
                  <div style={{fontSize:18,fontWeight:800,color:c}}>{n}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)',fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filter pills */}
          {dest.length > 0 && (
            <div style={{display:'flex',gap:6,marginBottom:12,overflowX:'auto',scrollbarWidth:'none'}}>
              <button onClick={()=>setFilterStatus('all')}
                style={{padding:'5px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:600,cursor:'pointer',flexShrink:0,
                  borderColor:filterStatus==='all'?'#534AB7':'var(--border)',background:filterStatus==='all'?'#534AB7':'white',color:filterStatus==='all'?'white':'var(--text-muted)'}}>
                All ({dest.length})
              </button>
              {DEST_STATUS.map(s=>(
                <button key={s.value} onClick={()=>setFilterStatus(s.value)}
                  style={{padding:'5px 14px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:600,cursor:'pointer',flexShrink:0,
                    borderColor:filterStatus===s.value?s.color:'var(--border)',background:filterStatus===s.value?s.bg:'white',color:filterStatus===s.value?s.color:'var(--text-muted)'}}>
                  {s.icon} {s.label} ({dest.filter(d=>d.status===s.value).length})
                </button>
              ))}
            </div>
          )}

          {filteredDest.length===0 && (
            <div className="empty-state">
              <div className="icon">🌍</div>
              <p>No destinations yet</p>
              <p style={{fontSize:13,marginTop:6}}>Tap + to add your first dream destination!</p>
            </div>
          )}

          {filteredDest.map(d=>{
            const st = DEST_STATUS.find(s=>s.value===d.status)
            const daysTo = d.planned_date ? Math.ceil((new Date(d.planned_date)-new Date())/(1000*60*60*24)) : null
            return (
              <div key={d.id} className="card" style={{marginBottom:10,padding:'14px 16px'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:46,height:46,borderRadius:13,background:st.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
                    {st.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:15}}>{d.country}</div>
                    {d.city && <div style={{fontSize:12,color:'var(--text-muted)'}}>{d.city}</div>}
                    {d.notes && <div style={{fontSize:11,color:'#9ca3af',marginTop:2,fontStyle:'italic'}}>{d.notes}</div>}
                    {daysTo !== null && (
                      <div style={{fontSize:11,color:'#185FA5',fontWeight:600,marginTop:3}}>
                        📅 {daysTo>0?`${daysTo} days until your trip`:'Trip date has passed'} — {formatDate(d.planned_date)}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                    <button onClick={()=>delDest(d.id)} style={{fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer'}}>✕</button>
                    <button onClick={()=>cycleDest(d.id)}
                      style={{padding:'3px 10px',borderRadius:12,border:`1.5px solid ${st.color}`,background:st.bg,color:st.color,fontSize:10,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
                      {st.icon} {st.label}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          <button className="fab" onClick={()=>setShowDest(true)}>+</button>
          {showDest && <DestModal onSave={addDest} onClose={()=>setShowDest(false)}/>}
        </>
      )}

      {/* ── DOCUMENTS TAB ────────────────────────────────────────────────── */}
      {tab==='documents' && (
        <>
          {docs.length===0 && (
            <div className="empty-state">
              <div className="icon">📄</div>
              <p>No documents tracked yet</p>
              <p style={{fontSize:13,marginTop:6}}>Add your passport, ID, or visa to get expiry alerts.</p>
            </div>
          )}

          {docs.map(d=>{
            const days   = daysUntilExpiry(d.expiry_date)
            const status = expiryStatus(days)
            const docType = DOC_TYPES.find(t=>t.value===d.type)
            return (
              <div key={d.id} className="card" style={{marginBottom:10,padding:'14px 16px',borderLeft:`4px solid ${status?.color||'#e5e7eb'}`}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:46,height:46,borderRadius:13,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>
                    {docType?.icon||'📄'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                      <span style={{fontWeight:700,fontSize:14}}>{docType?.label}</span>
                      {status && <span style={{fontSize:10,fontWeight:700,color:status.color,background:status.bg,padding:'2px 7px',borderRadius:10}}>{status.icon} {status.label}</span>}
                    </div>
                    <div style={{fontWeight:600,fontSize:13}}>{d.name}</div>
                    {d.country && <div style={{fontSize:11,color:'var(--text-muted)'}}>Issued by: {d.country}</div>}
                    {d.number  && <div style={{fontSize:11,color:'var(--text-muted)'}}>No: {d.number}</div>}
                    <div style={{display:'flex',gap:12,marginTop:4,fontSize:11,color:'var(--text-muted)'}}>
                      {d.issue_date  && <span>Issued: {formatDate(d.issue_date)}</span>}
                      {d.expiry_date && (
                        <span style={{fontWeight:600,color:status?.color}}>
                          Expires: {formatDate(d.expiry_date)} {days!==null && `(${days<0?'expired':days+' days'})`}
                        </span>
                      )}
                    </div>
                    {d.notes && <div style={{fontSize:11,color:'#9ca3af',marginTop:2,fontStyle:'italic'}}>{d.notes}</div>}
                  </div>
                  <button onClick={()=>delDoc(d.id)} style={{fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer',flexShrink:0}}>✕</button>
                </div>
              </div>
            )
          })}

          <button className="fab" style={{background:'linear-gradient(135deg,#185FA5,#0d3f70)'}} onClick={()=>setShowDoc(true)}>+</button>
          {showDoc && <DocModal onSave={addDoc} onClose={()=>setShowDoc(false)}/>}
        </>
      )}
    </div>
  )
}
