import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'

// ── Persistence ────────────────────────────────────────────────────────────────
const KEY = uid => `sh_travel_v2_${uid}`
function loadAll(uid) { try { return JSON.parse(localStorage.getItem(KEY(uid)) || 'null') } catch { return null } }
function saveAll(uid, data) { try { localStorage.setItem(KEY(uid), JSON.stringify(data)) } catch {} }
const uid4 = () => Math.random().toString(36).slice(2, 10)

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysUntil(d) {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / (1000*60*60*24))
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })
}
function expiryBadge(days) {
  if (days === null) return null
  if (days < 0)   return { label:'Expired',      color:'#A32D2D', bg:'#FCEBEB', icon:'❌' }
  if (days < 90)  return { label:'Expires soon', color:'#A32D2D', bg:'#FCEBEB', icon:'🔴' }
  if (days < 180) return { label:'Expiring',     color:'#BA7517', bg:'#FAEEDA', icon:'🟠' }
  return               { label:'Valid',           color:'#1D9E75', bg:'#E1F5EE', icon:'🟢' }
}
function fmt(n) { return n ? `$${parseFloat(n).toLocaleString()}` : '—' }

// ── Constants ──────────────────────────────────────────────────────────────────
const DOC_TYPES = [
  { id:'passport',  label:'Passport',              icon:'📗', hasExpiry:true  },
  { id:'visa',      label:'Visa',                  icon:'🔖', hasExpiry:true  },
  { id:'ticket',    label:'Ticket / Boarding Pass', icon:'✈️', hasExpiry:false },
  { id:'hotel',     label:'Hotel Confirmation',     icon:'🏨', hasExpiry:false },
  { id:'insurance', label:'Travel Insurance',       icon:'🛡️', hasExpiry:true  },
]

const PACKING_CATS = [
  { id:'clothes',     label:'👕 Clothes'     },
  { id:'toiletries',  label:'🧴 Toiletries'  },
  { id:'electronics', label:'💻 Electronics' },
  { id:'medication',  label:'💊 Medication'  },
  { id:'important',   label:'⭐ Important'   },
]
const PACKING_DEFAULTS = {
  clothes:     ['T-shirts','Pants / Jeans','Underwear','Socks','Pajamas','Jacket / Sweater','Shoes','Sandals / Flip-flops','Formal outfit','Belt'],
  toiletries:  ['Toothbrush & toothpaste','Shampoo & conditioner','Soap / body wash','Deodorant','Razor','Face wash & moisturizer','Sunscreen','Hairbrush / comb','Lip balm'],
  electronics: ['Phone + charger','Laptop / tablet','Power bank','Universal adapter','Earphones / AirPods','Camera','USB cables'],
  medication:  ['Prescription meds (full supply)','Pain reliever','Antidiarrheal','Antihistamine','Antacid','Band-aids & first aid','Hand sanitizer','Face masks','Vitamins'],
  important:   ['Passport (copy)','Travel insurance card','Emergency cash','Credit / debit cards','Pen (for customs forms)','Travel pillow','Luggage lock','Reusable water bottle'],
}

const ITIN_TYPES = [
  { id:'flight',      icon:'✈️', label:'Flight / Bus / Train' },
  { id:'hotel',       icon:'🏨', label:'Hotel Check-in / out' },
  { id:'activity',    icon:'🗺️', label:'Daily Activity'       },
  { id:'appointment', icon:'📌', label:'Important Appointment' },
]

const PURPOSES = [
  'Tourism / Vacation','Business','Family Visit','Medical','Education',
  'Religious / Pilgrimage','Work / Assignment','Other',
]

// ── Default state ──────────────────────────────────────────────────────────────
function defaultPacking() {
  const out = {}
  Object.entries(PACKING_DEFAULTS).forEach(([cat, items]) => {
    out[cat] = items.map(name => ({ id:uid4(), name, checked:false }))
  })
  return out
}

function defaultState() {
  return {
    destination:'', date_from:'', date_to:'', purpose:'', travelers:'1',
    docs: DOC_TYPES.map(t => ({ id:t.id, ready:false, number:'', expiry:'', notes:'' })),
    total_budget:'', transportation:'', lodging:'', food:'', emergency_money:'',
    itinerary:[],
    packing: defaultPacking(),
    emerg_contacts:[], emerg_embassy:'', emerg_hospital:'', emerg_local:'',
    addr:'', reminders:'', personal_notes:'',
  }
}

// ── Reusable Field ─────────────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>{hint}</div>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type='text', style={} }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width:'100%', padding:'11px 12px', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14,
        background:'var(--white)', color:'var(--text)', outline:'none', boxSizing:'border-box', ...style }} />
  )
}

function Textarea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width:'100%', padding:'11px 12px', border:'1.5px solid var(--border)', borderRadius:10, fontSize:14,
        background:'var(--white)', color:'var(--text)', outline:'none', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' }} />
  )
}

function SectionCard({ title, icon, children, style={} }) {
  return (
    <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginBottom:14, ...style }}>
      {title && <div style={{ fontSize:14, fontWeight:800, color:'var(--text)', marginBottom:12, display:'flex', alignItems:'center', gap:7 }}>
        <span>{icon}</span>{title}
      </div>}
      {children}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Travel({ session }) {
  const tr = useT()
  const TABS = [
    { id:'details',   short: tr.travel_tab_details   || 'Trip Details' },
    { id:'documents', short: tr.travel_tab_documents  || 'Documents'   },
    { id:'budget',    short: tr.travel_tab_budget     || 'Budget'      },
    { id:'itinerary', short: tr.travel_tab_itinerary  || 'Itinerary'   },
    { id:'packing',   short: tr.travel_tab_packing    || 'Packing'     },
    { id:'emergency', short: tr.travel_tab_emergency  || 'Emergency'   },
    { id:'notes',     short: tr.travel_tab_notes      || 'Notes'       },
  ]
  const userId = session?.user?.id || 'guest'

  const [tab, setTab] = useState('details')

  const [trip, setTripRaw] = useState(() => {
    const saved = loadAll(userId)
    if (!saved) return defaultState()
    const def = defaultState()
    return {
      ...def, ...saved,
      docs: saved.docs?.length === DOC_TYPES.length ? saved.docs : def.docs,
      packing: saved.packing || def.packing,
      itinerary: saved.itinerary || [],
      emerg_contacts: saved.emerg_contacts || [],
    }
  })

  const update = useCallback((patch) => {
    setTripRaw(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      saveAll(userId, next)
      return next
    })
  }, [userId])

  // ── UI-only state ──────────────────────────────────────────────────────────
  const [packCat, setPackCat]       = useState('clothes')
  const [newItem, setNewItem]       = useState('')
  const [showItinForm, setShowItinForm] = useState(false)
  const [itinForm, setItinForm]     = useState({ type:'flight', date:'', time:'', title:'', desc:'' })
  const [showEmergForm, setShowEmergForm] = useState(false)
  const [emergForm, setEmergForm]   = useState({ name:'', phone:'', relation:'' })
  const [expandedDocs, setExpandedDocs] = useState({})

  // ── Helpers ────────────────────────────────────────────────────────────────
  function updateDoc(id, patch) {
    update(t => ({ ...t, docs: t.docs.map(d => d.id===id ? { ...d, ...patch } : d) }))
  }
  function togglePack(cat, itemId) {
    update(t => ({
      ...t,
      packing: { ...t.packing, [cat]: t.packing[cat].map(i => i.id===itemId ? { ...i, checked:!i.checked } : i) }
    }))
  }
  function addPackItem() {
    if (!newItem.trim()) return
    update(t => ({
      ...t,
      packing: { ...t.packing, [packCat]: [...t.packing[packCat], { id:uid4(), name:newItem.trim(), checked:false }] }
    }))
    setNewItem('')
  }
  function delPackItem(cat, id) {
    update(t => ({ ...t, packing: { ...t.packing, [cat]: t.packing[cat].filter(i=>i.id!==id) } }))
  }
  function addItin() {
    if (!itinForm.title.trim()) return
    update(t => ({
      ...t,
      itinerary: [...t.itinerary, { ...itinForm, id:uid4() }]
        .sort((a,b) => (a.date||'').localeCompare(b.date||''))
    }))
    setItinForm({ type:'flight', date:'', time:'', title:'', desc:'' })
    setShowItinForm(false)
  }
  function delItin(id) {
    update(t => ({ ...t, itinerary: t.itinerary.filter(e=>e.id!==id) }))
  }
  function addContact() {
    if (!emergForm.name.trim()) return
    update(t => ({ ...t, emerg_contacts: [...t.emerg_contacts, { ...emergForm, id:uid4() }] }))
    setEmergForm({ name:'', phone:'', relation:'' })
    setShowEmergForm(false)
  }
  function delContact(id) {
    update(t => ({ ...t, emerg_contacts: t.emerg_contacts.filter(c=>c.id!==id) }))
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const spent = ['transportation','lodging','food','emergency_money'].reduce((s,k)=>s+(parseFloat(trip[k])||0),0)
  const budgetLeft = (parseFloat(trip.total_budget)||0) - spent
  const budgetPct  = trip.total_budget ? Math.min(100, (spent/(parseFloat(trip.total_budget)))*100) : 0
  const docsReady  = trip.docs.filter(d=>d.ready).length
  const packItems  = Object.values(trip.packing).flat()
  const packDone   = packItems.filter(i=>i.checked).length
  const tripDays   = trip.date_from && trip.date_to
    ? Math.ceil((new Date(trip.date_to)-new Date(trip.date_from))/(1000*60*60*24)) : null

  // expiring docs alert
  const expiringDocs = trip.docs.filter(d => {
    if (!d.expiry) return false
    const days = daysUntil(d.expiry)
    return days !== null && days < 180
  })

  const inputStyle = { width:'100%', padding:'11px 12px', border:'1.5px solid var(--border)', borderRadius:10,
    fontSize:14, background:'var(--white)', color:'var(--text)', outline:'none', boxSizing:'border-box' }

  return (
    <div style={{ paddingBottom:100 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#534AB7,#185FA5)', borderRadius:'16px 16px 0 0',
        padding:'18px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>✈️</div>
        <h2 style={{ color:'white', margin:'0 0 2px', fontSize:22, fontWeight:800 }}>{tr.travel_title || 'Travel Planner'}</h2>
        {trip.destination
          ? <p style={{ color:'rgba(255,255,255,0.9)', margin:0, fontSize:13, fontWeight:600 }}>
              📍 {trip.destination}{tripDays ? ` · ${tripDays > 1 ? (tr.travel_days_trip_p || '{n} days trip').replace('{n}', tripDays) : (tr.travel_days_trip_s || '{n} day trip').replace('{n}', tripDays)}` : ''}
            </p>
          : <p style={{ color:'rgba(255,255,255,0.7)', margin:0, fontSize:13 }}>{tr.travel_subtitle || 'Plan every detail of your trip'}</p>
        }
      </div>

      {/* ── Expiry alerts ────────────────────────────────────────────────── */}
      {expiringDocs.length > 0 && (
        <div style={{ marginTop:20 }}>
          {expiringDocs.map(d => {
            const days = daysUntil(d.expiry)
            const badge = expiryBadge(days)
            const type = DOC_TYPES.find(t=>t.id===d.id)
            return (
              <div key={d.id} style={{ background:badge.bg, border:`1px solid ${badge.color}44`, borderRadius:10,
                padding:'10px 14px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:badge.color }}>{badge.icon} {type?.label}</div>
                  <div style={{ fontSize:11, color:badge.color, opacity:0.8 }}>
                    {days < 0 ? 'Expired!' : `Expires in ${days} days — ${fmtDate(d.expiry)}`}
                  </div>
                </div>
                <span style={{ fontSize:20 }}>{type?.icon}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div style={{ overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch', margin:'18px 0 16px' }}>
        <div style={{ display:'flex', gap:6, minWidth:'max-content', paddingBottom:2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding:'8px 14px', borderRadius:20, border:'1.5px solid', fontWeight:700, fontSize:12,
                cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                borderColor: tab===t.id ? '#534AB7' : 'var(--border)',
                background:  tab===t.id ? '#534AB7' : 'var(--white)',
                color:       tab===t.id ? 'white'   : 'var(--text-muted)' }}>
              {t.short}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1 — TRIP DETAILS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'details' && (
        <div>
          {/* Progress summary */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
            {[
              { label: tr.travel_stat_docs    || 'Documents', value:`${docsReady}/${trip.docs.length}`, icon:'📄', color:'#185FA5' },
              { label: tr.travel_stat_packing || 'Packing',   value:`${packDone}/${packItems.length}`, icon:'🎒', color:'#1D9E75' },
              { label: tr.travel_stat_budget  || 'Budget',    value:trip.total_budget ? fmt(trip.total_budget) : '—', icon:'💰', color:'#BA7517' },
            ].map(s => (
              <div key={s.label} style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:12,
                padding:'12px 8px', textAlign:'center' }}>
                <div style={{ fontSize:18 }}>{s.icon}</div>
                <div style={{ fontSize:15, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <SectionCard title={tr.travel_sect_dest || 'Destination'} icon="📍">
            <Field label={tr.travel_where || 'Where are you going?'}>
              <Input value={trip.destination} placeholder={tr.travel_where_ph || 'e.g. Paris, France · Lagos, Nigeria · New York, USA'}
                onChange={e => update({ destination:e.target.value })} />
            </Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label={tr.travel_depart || 'Departure date'}>
                <input type="date" value={trip.date_from} onChange={e=>update({date_from:e.target.value})} style={inputStyle}/>
              </Field>
              <Field label={tr.travel_return_date || 'Return date'}>
                <input type="date" value={trip.date_to} onChange={e=>update({date_to:e.target.value})} style={inputStyle}/>
              </Field>
            </div>
            {tripDays !== null && (
              <div style={{ fontSize:12, color:'#534AB7', fontWeight:700, marginTop:-6, marginBottom:10 }}>
                🗓 {tripDays} day{tripDays!==1?'s':''} trip · {fmtDate(trip.date_from)} → {fmtDate(trip.date_to)}
              </div>
            )}
            <Field label={tr.travel_purpose || 'Purpose of trip'}>
              <select value={trip.purpose} onChange={e=>update({purpose:e.target.value})} style={inputStyle}>
                <option value="">{tr.travel_select_purpose || '— Select purpose —'}</option>
                {PURPOSES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label={tr.travel_num_travelers || 'Number of travelers'}>
              <Input value={trip.travelers} type="number" placeholder={tr.travel_num_ph || 'e.g. 2'}
                onChange={e=>update({travelers:e.target.value})} />
            </Field>
          </SectionCard>

          {/* Quick links to other tabs */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { tab:'documents', icon:'📄', label:'Documents',  color:'#185FA5', bg:'#EBF4FB', sub:`${docsReady}/${trip.docs.length} ready` },
              { tab:'budget',    icon:'💰', label:'Budget',     color:'#BA7517', bg:'#FEF3CD', sub:trip.total_budget?fmt(trip.total_budget):(tr.travel_quick_setbudget||'Set budget') },
              { tab:'itinerary', icon:'📅', label:'Itinerary',  color:'#534AB7', bg:'#EEEDFE', sub:`${trip.itinerary.length} entr${trip.itinerary.length===1?'y':'ies'}` },
              { tab:'packing',   icon:'🎒', label:'Packing',    color:'#1D9E75', bg:'#E1F5EE', sub:`${packDone}/${packItems.length} packed` },
              { tab:'emergency', icon:'🆘', label:'Emergency',  color:'#A32D2D', bg:'#FCEBEB', sub:`${trip.emerg_contacts.length} contact${trip.emerg_contacts.length===1?'':'s'}` },
              { tab:'notes',     icon:'📝', label:'Notes',      color:'#374151', bg:'#f3f4f6', sub:(tr.travel_quick_addr||'Addresses & reminders') },
            ].map(item => (
              <button key={item.tab} onClick={()=>setTab(item.tab)}
                style={{ background:'var(--white)', border:`1px solid ${item.color}33`, borderRadius:12, padding:'12px',
                  cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:item.color }}>{item.label}</div>
                  <div style={{ fontSize:10, color:'#9ca3af' }}>{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2 — DOCUMENTS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'documents' && (
        <div>
          <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>
            {(tr.travel_doc_header || '{ready}/{total} documents ready · Tap to expand').replace('{ready}', docsReady).replace('{total}', trip.docs.length)}
          </div>
          {DOC_TYPES.map(type => {
            const doc = trip.docs.find(d=>d.id===type.id)
            const expanded = expandedDocs[type.id]
            const days = daysUntil(doc?.expiry)
            const badge = type.hasExpiry && doc?.expiry ? expiryBadge(days) : null
            return (
              <div key={type.id} style={{ background:'var(--white)', border:`1.5px solid ${doc?.ready?'#1D9E75':'var(--border)'}`,
                borderRadius:14, marginBottom:10, overflow:'hidden' }}>

                {/* Header row */}
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}
                  onClick={() => setExpandedDocs(prev => ({ ...prev, [type.id]:!prev[type.id] }))}>
                  <div style={{ width:42, height:42, borderRadius:12, background:doc?.ready?'#E1F5EE':'#f3f4f6',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {type.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{type.label}</div>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>
                      {doc?.number ? `No. ${doc.number}` : (tr.travel_tap_details || 'Tap to add details')}
                      {badge && <span style={{ marginLeft:8, color:badge.color }}>{badge.icon} {badge.label}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {/* Ready toggle */}
                    <button onClick={e => { e.stopPropagation(); updateDoc(type.id, { ready:!doc?.ready }) }}
                      style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${doc?.ready?'#1D9E75':'var(--border)'}`,
                        background:doc?.ready?'#E1F5EE':'var(--bg)', color:doc?.ready?'#1D9E75':'#9ca3af',
                        fontSize:11, fontWeight:700, cursor:'pointer' }}>
                      {doc?.ready ? (tr.travel_marked_ready || '✓ Ready') : (tr.travel_mark_ready || 'Mark Ready')}
                    </button>
                    <span style={{ color:'#9ca3af', fontSize:14 }}>{expanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded fields */}
                {expanded && (
                  <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--border)' }}>
                    <div style={{ paddingTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:4 }}>
                          {type.id==='ticket' ? (tr.travel_booking_ref || 'Booking Reference') : type.id==='hotel' ? (tr.travel_confirm_num || 'Confirmation Number') : (tr.travel_doc_number || 'Document Number')}
                        </div>
                        <input value={doc?.number||''} onChange={e=>updateDoc(type.id,{number:e.target.value})}
                          placeholder={type.id==='ticket'?'e.g. ABC123':type.id==='hotel'?'e.g. HBC99012':'e.g. A12345678'}
                          style={{...inputStyle}} />
                      </div>
                      {type.hasExpiry && (
                        <div>
                          <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:4 }}>
                            {type.id==='ticket' ? (tr.travel_travel_date || 'Travel Date') : (tr.travel_expiry_date || 'Expiry Date')}
                          </div>
                          <input type="date" value={doc?.expiry||''} onChange={e=>updateDoc(type.id,{expiry:e.target.value})} style={inputStyle}/>
                          {doc?.expiry && badge && (
                            <div style={{ marginTop:6, padding:'6px 10px', background:badge.bg, borderRadius:8, fontSize:11, color:badge.color, fontWeight:600 }}>
                              {badge.icon} {days < 0 ? (tr.travel_expired || 'Expired!') : (tr.travel_days_expiry || '{n} days until expiry · {date}').replace('{n}', days).replace('{date}', fmtDate(doc.expiry))}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:4 }}>{tr.travel_notes_opt || 'Notes (optional)'}</div>
                        <input value={doc?.notes||''} onChange={e=>updateDoc(type.id,{notes:e.target.value})}
                          placeholder="e.g. Renewal in progress, kept in folder…" style={inputStyle}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3 — BUDGET
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'budget' && (
        <div>
          <SectionCard title={tr.travel_budget_sect || 'Total Trip Budget'} icon="💰">
            <Field label={tr.travel_budget_amount || 'Total budget amount'}>
              <div style={{ display:'flex', alignItems:'center', gap:8, border:'2px solid #1D9E75', borderRadius:12, padding:'0 12px', background:'var(--white)' }}>
                <span style={{ fontSize:18, color:'#1D9E75', fontWeight:700 }}>$</span>
                <input type="number" value={trip.total_budget} placeholder="e.g. 3000"
                  onChange={e=>update({total_budget:e.target.value})}
                  style={{ flex:1, border:'none', outline:'none', fontSize:22, fontWeight:700, color:'#1D9E75', padding:'12px 0', background:'transparent' }}/>
              </div>
            </Field>

            {/* Spending bar */}
            {trip.total_budget && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                  <span style={{ color:'#374151', fontWeight:600 }}>{(tr.travel_allocated || 'Allocated: {n}').replace('{n}', fmt(spent))}</span>
                  <span style={{ color: budgetLeft>=0 ? '#1D9E75' : '#A32D2D', fontWeight:700 }}>
                    {budgetLeft>=0 ? (tr.travel_remaining || '{n} remaining').replace('{n}', fmt(budgetLeft)) : (tr.travel_over_budget || '{n} over budget').replace('{n}', fmt(Math.abs(budgetLeft)))}
                  </span>
                </div>
                <div style={{ height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${budgetPct}%`, borderRadius:4,
                    background: budgetPct>90 ? '#A32D2D' : budgetPct>70 ? '#BA7517' : '#1D9E75',
                    transition:'width 0.4s' }}/>
                </div>
                <div style={{ fontSize:10, color:'#9ca3af', textAlign:'right', marginTop:2 }}>{(tr.travel_pct_allocated || '{n}% allocated').replace('{n}', Math.round(budgetPct))}</div>
              </div>
            )}
          </SectionCard>

          <SectionCard title={tr.travel_breakdown || 'Budget Breakdown'} icon="📊">
            {[
              { key:'transportation', label:'✈️ Transportation', placeholder:'Flights, trains, bus, taxi…' },
              { key:'lodging',        label:'🏨 Lodging',        placeholder:'Hotel, Airbnb, hostel…' },
              { key:'food',           label:'🍽 Food',           placeholder:'Meals, restaurants, groceries…' },
              { key:'emergency_money',label:'🆘 Emergency Money',placeholder:'Safety buffer amount…' },
            ].map(row => (
              <Field key={row.key} label={row.label}>
                <div style={{ display:'flex', alignItems:'center', gap:8, border:'1.5px solid var(--border)', borderRadius:10, padding:'0 12px', background:'var(--white)' }}>
                  <span style={{ color:'#9ca3af', fontSize:14 }}>$</span>
                  <input type="number" value={trip[row.key]} placeholder={row.placeholder}
                    onChange={e=>update({[row.key]:e.target.value})}
                    style={{ flex:1, border:'none', outline:'none', fontSize:14, padding:'11px 0', background:'transparent', color:'var(--text)' }}/>
                </div>
              </Field>
            ))}
          </SectionCard>

          {/* Breakdown summary */}
          {spent > 0 && (
            <SectionCard>
              {[
                { key:'transportation', label:'Transportation', icon:'✈️', color:'#534AB7' },
                { key:'lodging',        label:'Lodging',        icon:'🏨', color:'#185FA5' },
                { key:'food',           label:'Food',           icon:'🍽', color:'#1D9E75' },
                { key:'emergency_money',label:'Emergency',      icon:'🆘', color:'#A32D2D' },
              ].filter(r=>parseFloat(trip[r.key])>0).map(row => {
                const pct = trip.total_budget ? Math.min(100,(parseFloat(trip[row.key]||0)/parseFloat(trip.total_budget))*100) : 0
                return (
                  <div key={row.key} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                      <span style={{ fontWeight:600, color:'var(--text)' }}>{row.icon} {row.label}</span>
                      <span style={{ fontWeight:700, color:row.color }}>{fmt(trip[row.key])}</span>
                    </div>
                    <div style={{ height:5, background:'#f3f4f6', borderRadius:3 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:row.color, borderRadius:3 }}/>
                    </div>
                  </div>
                )
              })}
            </SectionCard>
          )}

          {/* Currency converter link */}
          <Link to="/currency" style={{ textDecoration:'none' }}>
            <div style={{ background:'linear-gradient(135deg,#185FA5,#0d3f70)', borderRadius:14, padding:'16px 18px',
              display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:13, background:'rgba(255,255,255,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>💱</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:800, color:'white', marginBottom:2 }}>{tr.travel_currency_btn || 'Currency Converter'}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)' }}>{tr.travel_currency_sub || 'Check live exchange rates for your destination'}</div>
              </div>
              <div style={{ fontSize:20, color:'rgba(255,255,255,0.7)' }}>›</div>
            </div>
          </Link>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 4 — ITINERARY
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'itinerary' && (
        <div>
          {trip.itinerary.length === 0 && !showItinForm && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#9ca3af' }}>
              <div style={{ fontSize:48, marginBottom:8 }}>📅</div>
              <div style={{ fontWeight:700, marginBottom:4 }}>{tr.travel_no_itinerary || 'No itinerary yet'}</div>
              <div style={{ fontSize:13 }}>{tr.travel_add_itin_hint || 'Add your flight, hotel, activities & appointments'}</div>
            </div>
          )}

          {/* Entries grouped by date */}
          {trip.itinerary.map((entry, i) => {
            const type = ITIN_TYPES.find(t=>t.id===entry.type)
            const prevDate = i > 0 ? trip.itinerary[i-1].date : null
            const showDate = entry.date && entry.date !== prevDate
            return (
              <div key={entry.id}>
                {showDate && (
                  <div style={{ fontSize:12, fontWeight:700, color:'#534AB7', marginBottom:6, marginTop:i>0?10:0, paddingLeft:4 }}>
                    📆 {fmtDate(entry.date)}
                  </div>
                )}
                <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:12,
                  padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {type?.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{entry.title}</div>
                    <div style={{ fontSize:11, color:'#534AB7', fontWeight:600, marginBottom:2 }}>{type?.label}{entry.time ? ` · ${entry.time}` : ''}</div>
                    {entry.desc && <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.5 }}>{entry.desc}</div>}
                  </div>
                  <button onClick={()=>delItin(entry.id)} style={{ fontSize:12, color:'#ef4444', background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>✕</button>
                </div>
              </div>
            )
          })}

          {/* Add entry form */}
          {showItinForm ? (
            <div style={{ background:'var(--white)', border:'1.5px solid #534AB7', borderRadius:14, padding:16, marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#534AB7', marginBottom:12 }}>{tr.travel_add_itin_form || '➕ Add Itinerary Entry'}</div>

              {/* Type selector */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
                {ITIN_TYPES.map(t=>(
                  <button key={t.id} onClick={()=>setItinForm(f=>({...f,type:t.id}))}
                    style={{ padding:'8px', borderRadius:10, border:`1.5px solid ${itinForm.type===t.id?'#534AB7':'var(--border)'}`,
                      background:itinForm.type===t.id?'#EEEDFE':'var(--bg)', color:itinForm.type===t.id?'#534AB7':'var(--text-muted)',
                      fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{fontSize:16}}>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:4 }}>{tr.travel_date || 'Date'}</div>
                  <input type="date" value={itinForm.date} onChange={e=>setItinForm(f=>({...f,date:e.target.value}))} style={inputStyle}/>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:4 }}>{tr.travel_time_opt || 'Time (optional)'}</div>
                  <input type="time" value={itinForm.time} onChange={e=>setItinForm(f=>({...f,time:e.target.value}))} style={inputStyle}/>
                </div>
              </div>

              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:4 }}>{tr.travel_itin_title || 'Title *'}</div>
                <input value={itinForm.title} onChange={e=>setItinForm(f=>({...f,title:e.target.value}))}
                  placeholder={itinForm.type==='flight'?'e.g. Air France AF123 YYZ → CDG':itinForm.type==='hotel'?'e.g. Check-in — Marriott Paris':'e.g. Eiffel Tower visit'}
                  style={inputStyle}/>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:4 }}>{tr.travel_details_opt || 'Details (optional)'}</div>
                <textarea value={itinForm.desc} onChange={e=>setItinForm(f=>({...f,desc:e.target.value}))}
                  placeholder="Terminal, confirmation #, address, notes…" rows={2}
                  style={{...inputStyle, resize:'vertical', fontFamily:'inherit'}}/>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setShowItinForm(false)}
                  style={{ flex:1, padding:'12px', background:'#f3f4f6', color:'#666', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  {tr.travel_cancel || 'Cancel'}
                </button>
                <button onClick={addItin} disabled={!itinForm.title.trim()}
                  style={{ flex:2, padding:'12px', background:itinForm.title.trim()?'#534AB7':'#e5e7eb', color:itinForm.title.trim()?'white':'#9ca3af',
                    border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:itinForm.title.trim()?'pointer':'default' }}>
                  {tr.travel_add_entry || '➕ Add Entry'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowItinForm(true)}
              style={{ width:'100%', padding:'14px', background:'#EEEDFE', color:'#534AB7', border:'1.5px dashed #534AB7',
                borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:4 }}>
              {tr.travel_add_itin_btn || '+ Add Flight / Hotel / Activity / Appointment'}
            </button>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 5 — PACKING LIST
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'packing' && (
        <div>
          {/* Progress */}
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 16px', marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
              <span style={{ fontWeight:700 }}>{tr.travel_pack_progress || '🎒 Packing Progress'}</span>
              <span style={{ fontWeight:800, color:'#1D9E75' }}>{packDone}/{packItems.length}</span>
            </div>
            <div style={{ height:8, background:'#f3f4f6', borderRadius:4 }}>
              <div style={{ height:'100%', width:`${packItems.length?Math.round((packDone/packItems.length)*100):0}%`,
                background:'#1D9E75', borderRadius:4, transition:'width 0.3s' }}/>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ overflowX:'auto', scrollbarWidth:'none', marginBottom:12 }}>
            <div style={{ display:'flex', gap:6, minWidth:'max-content' }}>
              {PACKING_CATS.map(cat => {
                const items = trip.packing[cat.id] || []
                const done = items.filter(i=>i.checked).length
                return (
                  <button key={cat.id} onClick={()=>setPackCat(cat.id)}
                    style={{ padding:'7px 14px', borderRadius:20, border:'1.5px solid', fontSize:12, fontWeight:700,
                      cursor:'pointer', whiteSpace:'nowrap',
                      borderColor: packCat===cat.id ? '#1D9E75' : 'var(--border)',
                      background:  packCat===cat.id ? '#1D9E75' : 'var(--white)',
                      color:       packCat===cat.id ? 'white'   : 'var(--text-muted)' }}>
                    {cat.label} <span style={{ opacity:0.7, fontSize:10 }}>({done}/{items.length})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Item list */}
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', marginBottom:12 }}>
            {(trip.packing[packCat]||[]).map((item,i,arr) => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
                borderBottom: i<arr.length-1?'1px solid var(--border)':'none',
                background: item.checked ? '#f9fafb' : 'var(--white)' }}>
                <button onClick={()=>togglePack(packCat,item.id)}
                  style={{ width:24, height:24, borderRadius:7, border:`2px solid ${item.checked?'#1D9E75':'#d1d5db'}`,
                    background: item.checked?'#1D9E75':'transparent', display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', flexShrink:0 }}>
                  {item.checked && <span style={{ color:'white', fontSize:13, fontWeight:700 }}>✓</span>}
                </button>
                <span style={{ flex:1, fontSize:14, color: item.checked?'#9ca3af':'var(--text)',
                  textDecoration: item.checked?'line-through':'none' }}>{item.name}</span>
                <button onClick={()=>delPackItem(packCat,item.id)}
                  style={{ fontSize:11, color:'#d1d5db', background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>✕</button>
              </div>
            ))}
          </div>

          {/* Add custom item */}
          <div style={{ display:'flex', gap:8 }}>
            <input value={newItem} onChange={e=>setNewItem(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addPackItem()}
              placeholder={`Add item to ${PACKING_CATS.find(c=>c.id===packCat)?.label}…`}
              style={{...inputStyle, flex:1}}/>
            <button onClick={addPackItem} disabled={!newItem.trim()}
              style={{ padding:'11px 18px', background:newItem.trim()?'#1D9E75':'#e5e7eb', color:newItem.trim()?'white':'#9ca3af',
                border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:newItem.trim()?'pointer':'default' }}>
              {tr.travel_add_btn || 'Add'}
            </button>
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:6 }}>{tr.travel_pack_hint || 'Press Enter or tap Add · Items auto-save'}</div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 6 — EMERGENCY INFO
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'emergency' && (
        <div>
          {/* Emergency contacts */}
          <SectionCard title={tr.travel_emerg_contacts || 'Emergency Contacts'} icon="📞">
            {trip.emerg_contacts.length === 0 && (
              <div style={{ textAlign:'center', padding:'12px 0', color:'#9ca3af', fontSize:13 }}>
                {tr.travel_no_emerg || 'No emergency contacts added yet'}
              </div>
            )}
            {trip.emerg_contacts.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0',
                borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'#FCEBEB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>👤</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>{c.relation} {c.phone && `· ${c.phone}`}</div>
                </div>
                <a href={`tel:${c.phone}`} style={{ fontSize:18, textDecoration:'none' }}>📱</a>
                <button onClick={()=>delContact(c.id)} style={{ fontSize:11, color:'#ef4444', background:'none', border:'none', cursor:'pointer' }}>✕</button>
              </div>
            ))}

            {showEmergForm ? (
              <div style={{ marginTop:12, padding:'12px', background:'#f9fafb', borderRadius:10 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
                  <input value={emergForm.name} onChange={e=>setEmergForm(f=>({...f,name:e.target.value}))}
                    placeholder={tr.travel_full_name || 'Full name *'} style={inputStyle}/>
                  <input value={emergForm.phone} onChange={e=>setEmergForm(f=>({...f,phone:e.target.value}))}
                    type="tel" placeholder={tr.travel_phone || 'Phone number'} style={inputStyle}/>
                  <input value={emergForm.relation} onChange={e=>setEmergForm(f=>({...f,relation:e.target.value}))}
                    placeholder={tr.travel_relation || 'Relationship (e.g. Spouse, Parent, Friend)'} style={inputStyle}/>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>setShowEmergForm(false)}
                    style={{ flex:1, padding:'10px', background:'#f3f4f6', color:'#666', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>{tr.travel_cancel || 'Cancel'}</button>
                  <button onClick={addContact} disabled={!emergForm.name.trim()}
                    style={{ flex:2, padding:'10px', background:emergForm.name.trim()?'#A32D2D':'#e5e7eb', color:emergForm.name.trim()?'white':'#9ca3af',
                      border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:emergForm.name.trim()?'pointer':'default' }}>
                    {tr.travel_save_contact || '➕ Save Contact'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setShowEmergForm(true)}
                style={{ width:'100%', marginTop:10, padding:'10px', background:'#FCEBEB', color:'#A32D2D',
                  border:'1.5px dashed #A32D2D', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {tr.travel_add_contact_btn || '+ Add Emergency Contact'}
              </button>
            )}
          </SectionCard>

          <SectionCard title={tr.travel_embassy_sect || 'Embassy / Consulate'} icon="🏛️">
            <Field label={tr.travel_embassy_label || 'Embassy or consulate address / phone'}>
              <Textarea value={trip.emerg_embassy} onChange={e=>update({emerg_embassy:e.target.value})}
                placeholder={`e.g. Nigerian Embassy in France\n12 Avenue Foch, Paris\n+33 1 42 12 34 56`} rows={3}/>
            </Field>
          </SectionCard>

          <SectionCard title={tr.travel_hospital_sect || 'Hospital / Pharmacy'} icon="🏥">
            <Field label={tr.travel_hospital_label || 'Nearest hospital or pharmacy at destination'}>
              <Textarea value={trip.emerg_hospital} onChange={e=>update({emerg_hospital:e.target.value})}
                placeholder={`e.g. Hôpital Lariboisière, Paris\n2 Rue Ambroise Paré\n+33 1 49 95 65 65`} rows={3}/>
            </Field>
          </SectionCard>

          <SectionCard title={tr.travel_local_sect || 'Local Emergency Number'} icon="🆘">
            <Field label={tr.travel_local_label || 'Emergency number at your destination'} hint="e.g. 911 (USA), 999 (UK), 15/17/18 (France), 999 (Nigeria)">
              <Input value={trip.emerg_local} placeholder="e.g. 112 (international) · 911 (USA) · 999 (Nigeria)"
                onChange={e=>update({emerg_local:e.target.value})}/>
            </Field>
            {trip.emerg_local && (
              <a href={`tel:${trip.emerg_local.split(' ')[0]}`}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px',
                  background:'#A32D2D', color:'white', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:700, marginTop:-4 }}>
                {(tr.travel_call || '📞 Call {n}').replace('{n}', trip.emerg_local)}
              </a>
            )}
          </SectionCard>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 7 — NOTES
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'notes' && (
        <div>
          <SectionCard title={tr.travel_notes_addr_sect || 'Addresses'} icon="📍">
            <Field label={tr.travel_notes_addr_label || 'Important addresses at your destination'}
              hint="Hotel address, venue, family home, airport pickup point…">
              <Textarea value={trip.addr} onChange={e=>update({addr:e.target.value})}
                placeholder={`Hotel: 12 Rue de Rivoli, Paris 75001\nAirport: CDG Terminal 2E\nFamily: 5 Baker Street, London`} rows={5}/>
            </Field>
          </SectionCard>

          <SectionCard title={tr.travel_notes_rem_sect || 'Reminders'} icon="⏰">
            <Field label={tr.travel_notes_rem_label || 'Things to remember before and during your trip'}
              hint="Pre-departure tasks, deadlines, important to-dos…">
              <Textarea value={trip.reminders} onChange={e=>update({reminders:e.target.value})}
                placeholder={`- Print boarding pass\n- Notify bank of travel dates\n- Download offline maps\n- Pack phone charger & adapter`} rows={5}/>
            </Field>
          </SectionCard>

          <SectionCard title={tr.travel_notes_pers_sect || 'Personal Travel Notes'} icon="✍️">
            <Field label={tr.travel_notes_pers_label || 'Free space for anything else'}
              hint="Visa tips, cultural notes, recommendations from friends…">
              <Textarea value={trip.personal_notes} onChange={e=>update({personal_notes:e.target.value})}
                placeholder="Write anything you want to remember about this trip…" rows={7}/>
            </Field>
          </SectionCard>

          <div style={{ textAlign:'center', fontSize:11, color:'#9ca3af', padding:'8px 0' }}>
            {tr.travel_autosave || '✅ All notes auto-save as you type'}
          </div>
        </div>
      )}
    </div>
  )
}
