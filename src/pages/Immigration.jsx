import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

const VISA_TYPES = ['Student Visa','Work Visa','Family Visa','Spouse Visa','Permanent Residence','Citizenship','Tourist Visa','Asylum','Other']
const STATUSES = ['Preparing','Submitted','In Review','Approved','Denied','Expired']
const STATUS_COLORS = { Preparing:'#BA7517', Submitted:'#185FA5', 'In Review':'#7F77DD', Approved:'#1D9E75', Denied:'#A32D2D', Expired:'#5F5E5A' }
const DOC_STATUSES = ['Not Started','In Progress','Submitted','Approved','Expired']
const CELL = { padding:'8px 10px', borderRight:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', fontSize:12, background:'white', color:'#1a1a1a' }
const HEAD = { ...CELL, background:'#f3f4f6', fontWeight:600, fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24))
}

export default function Immigration({ session }) {
  const tr = useT()
  const [cases, setCases] = useState([])
  const [docs, setDocs] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [editCase, setEditCase] = useState(null)
  const [activeCase, setActiveCase] = useState(null)
  const [saving, setSaving] = useState(false)
  const [caseForm, setCaseForm] = useState({ case_name:'', visa_type:'Work Visa', case_number:'', country_origin:'', country_destination:'', status:'Preparing', application_date:'', deadline:'', notes:'' })
  const [docForm, setDocForm] = useState({ document_name:'', status:'Not Started', expiry_date:'', notes:'' })
  const userId = session.user.id

  async function fetchCases() {
    setLoading(true)
    const { data } = await supabase.from('immigration_cases').select('*').eq('user_id', userId).order('created_at', { ascending:false })
    setCases(data || [])
    setLoading(false)
  }

  async function fetchDocs(caseId) {
    const { data } = await supabase.from('immigration_documents').select('*').eq('case_id', caseId).order('created_at', { ascending:true })
    setDocs(d => ({ ...d, [caseId]: data || [] }))
  }

  useEffect(() => { fetchCases() }, [])

  function openAddCase() { setEditCase(null); setCaseForm({ case_name:'', visa_type:'Work Visa', case_number:'', country_origin:'', country_destination:'', status:'Preparing', application_date:'', deadline:'', notes:'' }); setShowCaseModal(true) }
  function openEditCase(c) { setEditCase(c); setCaseForm({ case_name:c.case_name, visa_type:c.visa_type, case_number:c.case_number||'', country_origin:c.country_origin||'', country_destination:c.country_destination||'', status:c.status, application_date:c.application_date||'', deadline:c.deadline||'', notes:c.notes||'' }); setShowCaseModal(true) }

  async function saveCase() {
    if (!caseForm.case_name) return
    setSaving(true)
    const payload = { user_id:userId, ...caseForm }
    if (editCase) { await supabase.from('immigration_cases').update(payload).eq('id', editCase.id) }
    else { await supabase.from('immigration_cases').insert(payload) }
    setSaving(false); setShowCaseModal(false); fetchCases()
  }

  async function deleteCase(id) { await supabase.from('immigration_cases').delete().eq('id', id); fetchCases() }

  async function saveDoc() {
    if (!docForm.document_name || !activeCase) return
    setSaving(true)
    await supabase.from('immigration_documents').insert({ case_id:activeCase, ...docForm })
    setSaving(false); setShowDocModal(false)
    setDocForm({ document_name:'', status:'Not Started', expiry_date:'', notes:'' })
    fetchDocs(activeCase)
  }

  async function updateDocStatus(docId, caseId, newStatus) {
    await supabase.from('immigration_documents').update({ status:newStatus }).eq('id', docId)
    fetchDocs(caseId)
  }

  async function deleteDoc(docId, caseId) {
    await supabase.from('immigration_documents').delete().eq('id', docId)
    fetchDocs(caseId)
  }

  function toggleCase(id) {
    setExpandedId(expandedId === id ? null : id)
    if (!docs[id]) fetchDocs(id)
  }

  const urgentCases = cases.filter(c => { const d = daysUntil(c.deadline); return d !== null && d <= 30 && d >= 0 })

  return (
    <div>
      <div className="page-header" style={{ paddingTop:20 }}>
        <h2>{tr.immigrationTitle||'Immigration Tracker'}</h2>
        <p>{tr.immigrationSubtitle||'Track visas, documents and deadlines'}</p>
      </div>

      {urgentCases.map(c => {
        const d = daysUntil(c.deadline)
        return (
          <div key={c.id} style={{ background: d<=7 ? '#FCEBEB':'#FAEEDA', borderRadius:10, padding:'12px 16px', marginBottom:10, border:`1px solid ${d<=7?'#A32D2D':'#BA7517'}33` }}>
            <div style={{ fontSize:12, fontWeight:700, color: d<=7?'#A32D2D':'#BA7517' }}>{tr.deadlineIn||'Deadline in'} {d} {tr.daysLabel||'days'}</div>
            <div style={{ fontSize:13 }}>{c.case_name} — {c.visa_type}</div>
          </div>
        )
      })}

      {cases.length > 0 && (
        <div className="metric-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:16 }}>
          <div className="metric-card"><div className="metric-label">{tr.totalCases||'Total cases'}</div><div className="metric-value" style={{ fontSize:20 }}>{cases.length}</div></div>
          <div className="metric-card"><div className="metric-label">{tr.approvedLabel||'Approved'}</div><div className="metric-value green" style={{ fontSize:20 }}>{cases.filter(c=>c.status==='Approved').length}</div></div>
          <div className="metric-card"><div className="metric-label">{tr.inProgressLabel||'In progress'}</div><div className="metric-value" style={{ fontSize:20, color:'#BA7517' }}>{cases.filter(c=>['Preparing','Submitted','In Review'].includes(c.status)).length}</div></div>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && cases.length === 0 && (
        <div className="empty-state"><div className="icon">✈️</div><p>{tr.noCasesYet||'No immigration cases yet.'}</p><p style={{ marginTop:8 }}>{tr.tapAddCase||'Tap + to add your first visa case.'}</p></div>
      )}

      {!loading && cases.map(c => {
        const isExpanded = expandedId === c.id
        const caseDocs = docs[c.id] || []
        const deadline = daysUntil(c.deadline)
        const statusColor = STATUS_COLORS[c.status] || '#6b7280'
        const docsDone = caseDocs.filter(d => d.status==='Approved').length
        return (
          <div key={c.id} className="card" style={{ marginBottom:10, padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{c.case_name}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    <span style={{ fontSize:11, padding:'3px 8px', borderRadius:10, background:statusColor+'22', color:statusColor, fontWeight:600 }}>{c.status}</span>
                    <span style={{ fontSize:11, padding:'3px 8px', borderRadius:10, background:'#f3f4f6', color:'#6b7280' }}>{c.visa_type}</span>
                    {c.country_origin && <span style={{ fontSize:11, padding:'3px 8px', borderRadius:10, background:'#f3f4f6', color:'#6b7280' }}>{c.country_origin} → {c.country_destination}</span>}
                  </div>
                </div>
                <button onClick={() => openEditCase(c)} style={{ fontSize:11, padding:'4px 10px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:6, cursor:'pointer' }}>{tr.editCaseLabel||'Edit'}</button>
              </div>
              {c.deadline && (
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>Deadline: {new Date(c.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                  {deadline !== null && <span style={{ fontSize:11, fontWeight:600, color: deadline<=7?'#A32D2D':deadline<=30?'#BA7517':'#1D9E75' }}>{deadline<0?'Overdue':deadline===0?'Today!':`${deadline} days left`}</span>}
                </div>
              )}
              {caseDocs.length > 0 && (
                <div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Documents: {docsDone}/{caseDocs.length} approved</div>
                  <div className="progress-wrap" style={{ marginBottom:8 }}><div className="progress-fill" style={{ width:`${caseDocs.length>0?(docsDone/caseDocs.length*100):0}%` }} /></div>
                </div>
              )}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => toggleCase(c.id)} style={{ fontSize:12, padding:'6px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', color:'var(--text-muted)' }}>
                  {isExpanded ? (tr.hideDocsLabel||'▲ Hide docs') : (tr.viewDocsLabel||'▼ View docs')}
                </button>
                <button onClick={() => { setActiveCase(c.id); setShowDocModal(true) }} style={{ fontSize:12, padding:'6px 12px', background:'var(--green-light)', border:'1px solid var(--green)', borderRadius:8, cursor:'pointer', color:'var(--green-dark)' }}>
                  {tr.addDocBtn||'+ Add document'}
                </button>
              </div>
            </div>
            {isExpanded && (
              <div style={{ borderTop:'1px solid #f3f4f6' }}>
                {caseDocs.length === 0 ? (
                  <div style={{ padding:16, textAlign:'center', fontSize:13, color:'var(--text-muted)' }}>{tr.noDocsYet||'No documents added yet'}</div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', borderLeft:'1px solid #e5e7eb' }}>
                      <thead><tr><th style={HEAD}>Document</th><th style={HEAD}>Status</th><th style={HEAD}>Expires</th><th style={HEAD}></th></tr></thead>
                      <tbody>
                        {caseDocs.map((doc,i) => {
                          const docColor = { 'Not Started':'#9ca3af','In Progress':'#BA7517','Submitted':'#185FA5','Approved':'#1D9E75','Expired':'#A32D2D' }[doc.status]||'#9ca3af'
                          return (
                            <tr key={i} style={{ background:i%2===0?'white':'#fafafa' }}>
                              <td style={{ ...CELL, fontWeight:500 }}>{doc.document_name}</td>
                              <td style={CELL}>
                                <select value={doc.status} onChange={e => updateDocStatus(doc.id,c.id,e.target.value)}
                                  style={{ fontSize:11, padding:'3px 6px', borderRadius:8, border:`1px solid ${docColor}44`, background:docColor+'22', color:docColor, appearance:'none', cursor:'pointer', fontWeight:600 }}>
                                  {DOC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                              <td style={{ ...CELL, fontSize:11, color:'var(--text-muted)' }}>{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</td>
                              <td style={{ ...CELL, textAlign:'center', cursor:'pointer', color:'#ef4444' }} onClick={() => deleteDoc(doc.id,c.id)}>✕</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <button className="fab" onClick={openAddCase}>+</button>

      {showCaseModal && (
        <div className="modal-overlay" onClick={() => setShowCaseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editCase ? (tr.editCaseLabel||'Edit case') : (tr.addImmigCase||'Add immigration case')}</div>
            {[
              { label: tr.caseNameLabel||'Case name', key:'case_name', placeholder:'e.g. UK Work Visa 2025', type:'text' },
              { label: tr.caseNumberOpt||'Case number (optional)', key:'case_number', placeholder:'e.g. GWF123456789', type:'text' },
              { label: tr.countryOriginLabel||'Country of origin', key:'country_origin', placeholder:'e.g. Nigeria', type:'text' },
              { label: tr.countryDestLabel||'Destination country', key:'country_destination', placeholder:'e.g. United Kingdom', type:'text' },
              { label: tr.appDateLabel||'Application date', key:'application_date', placeholder:'', type:'date' },
              { label: tr.deadlineLabel||'Deadline', key:'deadline', placeholder:'', type:'date' },
            ].map(f => (
              <div key={f.key} className="form-group" style={{ marginBottom:10 }}>
                <label>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={caseForm[f.key]} onChange={e => setCaseForm(cf => ({...cf,[f.key]:e.target.value}))} />
              </div>
            ))}
            <div className="form-group" style={{ marginBottom:10 }}>
              <label>{tr.visaTypeLabel||'Visa type'}</label>
              <select value={caseForm.visa_type} onChange={e => setCaseForm(cf => ({...cf,visa_type:e.target.value}))}>
                {VISA_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:10 }}>
              <label>{tr.status||'Status'}</label>
              <select value={caseForm.status} onChange={e => setCaseForm(cf => ({...cf,status:e.target.value}))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:10 }}>
              <label>{tr.notesLabel||'Notes'}</label>
              <textarea value={caseForm.notes} onChange={e => setCaseForm(cf => ({...cf,notes:e.target.value}))} rows={2}
                style={{ padding:'10px 14px', border:'1px solid var(--border)', borderRadius:8, fontSize:14, background:'var(--bg)', color:'var(--text)', resize:'none', width:'100%', outline:'none' }} />
            </div>
            <div className="modal-actions">
              {editCase && <button className="btn-danger" onClick={() => { deleteCase(editCase.id); setShowCaseModal(false) }}>{tr.deleteCaseLabel||'Delete'}</button>}
              <button className="btn-secondary" onClick={() => setShowCaseModal(false)}>{tr.cancel||'Cancel'}</button>
              <button className="btn-primary" style={{ flex:2 }} onClick={saveCase} disabled={saving}>{saving?(tr.saving||'Saving…'):(tr.saveCaseLabel||'Save case')}</button>
            </div>
          </div>
        </div>
      )}

      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{tr.addDocLabel||'Add document'}</div>
            <div className="form-group" style={{ marginBottom:10 }}>
              <label>{tr.docNameLabel||'Document name'}</label>
              <input type="text" placeholder="e.g. Passport, Bank Statement, Birth Certificate" value={docForm.document_name} onChange={e => setDocForm(f => ({...f,document_name:e.target.value}))} />
            </div>
            <div className="form-group" style={{ marginBottom:10 }}>
              <label>{tr.status||'Status'}</label>
              <select value={docForm.status} onChange={e => setDocForm(f => ({...f,status:e.target.value}))}>
                {DOC_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:10 }}>
              <label>{tr.expiryDateOpt||'Expiry date (optional)'}</label>
              <input type="date" value={docForm.expiry_date} onChange={e => setDocForm(f => ({...f,expiry_date:e.target.value}))} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDocModal(false)}>{tr.cancel||'Cancel'}</button>
              <button className="btn-primary" style={{ flex:2 }} onClick={saveDoc} disabled={saving}>{saving?(tr.saving||'Saving…'):(tr.addDocBtn||'+ Add document')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
