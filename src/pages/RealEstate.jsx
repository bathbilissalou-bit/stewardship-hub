import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

const PHASES = [
  { id:'financial_prep', label:'Financial Prep', color:'#185FA5', steps:[
    'Check and improve your credit score (aim for 680+)',
    'Calculate how much house you can afford (28% rule)',
    'Save for down payment (3.5%–20% of home price)',
    'Build 3–6 month emergency fund',
    'Pay down existing debts to lower DTI ratio',
    'Get pre-qualification letter from a lender',
    'Research first-time homebuyer grants and programs',
  ]},
  { id:'mortgage_prep', label:'Mortgage Ready', color:'#1D9E75', steps:[
    'Compare mortgage lenders (at least 3 quotes)',
    'Choose loan type (FHA, conventional, VA, USDA)',
    'Get pre-approval letter (stronger than pre-qual)',
    'Understand all closing costs (2%–5% of loan)',
    'Lock in your interest rate when ready',
    'Gather documents: tax returns, pay stubs, bank statements',
  ]},
  { id:'house_search', label:'House Search', color:'#BA7517', steps:[
    'Define must-haves vs nice-to-haves list',
    'Research neighborhoods (schools, safety, commute)',
    'Find a trusted real estate agent',
    'Attend open houses and schedule viewings',
    'Research comparable sales (comps) in target area',
    'Consider future resale value',
    'Check HOA fees if applicable',
  ]},
  { id:'offer_closing', label:'Offer & Closing', color:'#7F77DD', steps:[
    'Make a competitive offer based on comps',
    'Negotiate terms (price, repairs, closing date)',
    'Pay earnest money deposit (1%–3%)',
    'Schedule professional home inspection',
    'Review inspection report and negotiate repairs',
    'Get home appraisal (lender requires this)',
    'Final walkthrough before closing',
    'Sign closing documents and get your keys!',
  ]},
  { id:'post_purchase', label:'After Purchase', color:'#3B6D11', steps:[
    'Set up home maintenance fund (1% of value/year)',
    'Change all locks immediately',
    'Update address on all accounts and documents',
    'Meet your neighbors',
    'Review and understand your mortgage statement',
    'File for homestead exemption if available',
    'Start building home equity intentionally',
  ]},
]

const HOME_TYPES = [
  { type:'Brick', cost:'$150–250/sqft', maintenance:'Low', durability:'50–100+ years', energy:'Good insulation', pros:['Very durable','Low maintenance','Fire resistant','Good resale value'], cons:['Higher upfront cost','Harder to modify','Heavy — needs strong foundation'] },
  { type:'Wood Frame', cost:'$100–180/sqft', maintenance:'Medium', durability:'30–80 years', energy:'Moderate insulation', pros:['Lower cost','Easy to modify','Widely available','Faster to build'], cons:['Needs regular maintenance','Vulnerable to termites','Less fire resistant'] },
  { type:'Condo', cost:'$200–400/sqft', maintenance:'Low (exterior shared)', durability:'Varies', energy:'Shared walls = efficient', pros:['Lower entry price','Amenities included','Less maintenance','Good for first buyers'], cons:['HOA fees','Less privacy','Limited control','Rules and restrictions'] },
  { type:'Duplex', cost:'$120–220/sqft', maintenance:'Medium', durability:'40–80 years', energy:'Shared wall saves energy', pros:['Rental income potential','Live in one unit','Builds equity faster','Tax advantages'], cons:['Being a landlord','Shared wall noise','More complex financing'] },
  { type:'Modular/Mobile', cost:'$60–120/sqft', maintenance:'Medium-High', durability:'20–50 years', energy:'Varies widely', pros:['Most affordable option','Quick to build','Improving quality','Good starter home'], cons:['May depreciate','Land not included','Financing harder','Stigma in some areas'] },
]

const STATUS_COLORS = { 'Not Started':'#9ca3af', 'In Progress':'#BA7517', 'Done':'#1D9E75' }

const CELL = { padding:'8px 10px', borderRight:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', fontSize:12, background:'white', color:'#1a1a1a' }
const HEAD = { ...CELL, background:'#f3f4f6', fontWeight:600, fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }

export default function RealEstate({
  session }) {
  const tr = useT()
  const [checklist, setChecklist] = useState({})
  const [notes, setNotes] = useState({})
  const [dates, setDates] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('checklist')
  const [expandedPhase, setExpandedPhase] = useState('financial_prep')
  const userId = session.user.id

  useEffect(() => {
    async function fetchChecklist() {
      const { data } = await supabase.from('real_estate_checklist').select('*').eq('user_id', userId)
      const cl = {}, nt = {}, dt = {}
      ;(data||[]).forEach(row => {
        cl[row.item_label] = row.status
        nt[row.item_label] = row.notes || ''
        dt[row.item_label] = row.target_date || ''
      })
      setChecklist(cl); setNotes(nt); setDates(dt)
      setLoading(false)
    }
    fetchChecklist()
  }, [])

  async function updateItem(phase, item, status) {
    const newCl = { ...checklist, [item]: status }
    setChecklist(newCl)
    const existing = await supabase.from('real_estate_checklist').select('id').eq('user_id', userId).eq('item_label', item).single()
    if (existing.data) {
      await supabase.from('real_estate_checklist').update({ status, notes: notes[item]||'', target_date: dates[item]||null }).eq('id', existing.data.id)
    } else {
      await supabase.from('real_estate_checklist').insert({ user_id: userId, phase, item_label: item, status, notes: notes[item]||'' })
    }
  }

  const totalSteps = PHASES.reduce((s, p) => s + p.steps.length, 0)
  const doneSteps = Object.values(checklist).filter(s => s === 'Done').length
  const pct = Math.round((doneSteps / totalSteps) * 100)

  const statusCycle = { undefined:'In Progress', 'Not Started':'In Progress', 'In Progress':'Done', 'Done':'Not Started' }

  return (
    <div>
      <div style={{ background:'linear-gradient(135deg, #8B5E3C, #5C3D26)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>🏠</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.realEstateTitle||"Real Estate"}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.realEstateSubtitle||"Your path to owning a home"}</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['checklist','comparison'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid', borderColor: activeTab===tab ? 'var(--green)' : 'var(--border)', background: activeTab===tab ? 'var(--green-light)' : 'var(--bg)', color: activeTab===tab ? 'var(--green-dark)' : 'var(--text-muted)', fontWeight:600, fontSize:13, cursor:'pointer', textTransform:'capitalize' }}>
            {tab === 'checklist' ? (tr.buyerChecklist||'✅ Buyer Checklist') : (tr.homeTypesTab||'🏠 Home Types')}
          </button>
        ))}
      </div>

      {activeTab === 'checklist' && (
        <>
          {/* Progress */}
          <div className="card" style={{ marginBottom:16, textAlign:'center' }}>
            <div style={{ fontSize:36, fontWeight:700, color:'var(--green)' }}>{pct}%</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:10 }}>{doneSteps} of {totalSteps} {tr.stepsComplete||'steps complete'}</div>
            <div className="progress-wrap"><div className="progress-fill" style={{ width:`${pct}%` }} /></div>
          </div>

          {/* Phase accordions */}
          {PHASES.map(phase => {
            const phaseDone = phase.steps.filter(s => checklist[s] === 'Done').length
            const isOpen = expandedPhase === phase.id
            return (
              <div key={phase.id} className="card" style={{ marginBottom:10, padding:0, overflow:'hidden' }}>
                <div onClick={() => setExpandedPhase(isOpen ? null : phase.id)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', cursor:'pointer', background: phaseDone === phase.steps.length ? '#f0fdf4' : 'white' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:10, height:10, borderRadius:50, background:phase.color, flexShrink:0 }} />
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{phase.label}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{phaseDone}/{phase.steps.length} done</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:60, height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ width:`${phase.steps.length > 0 ? (phaseDone/phase.steps.length*100):0}%`, height:'100%', background:phase.color, borderRadius:3 }} />
                    </div>
                    <span style={{ color:'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop:'1px solid #e5e7eb' }}>
                    {phase.steps.map((step, i) => {
                      const status = checklist[step] || 'Not Started'
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom: i < phase.steps.length-1 ? '1px solid #f3f4f6' : 'none', background: status==='Done' ? '#f0fdf4' : 'white' }}>
                          <div onClick={() => updateItem(phase.id, step, statusCycle[checklist[step]])} style={{ width:24, height:24, borderRadius:6, border:`2px solid ${STATUS_COLORS[status]||'#9ca3af'}`, background: status==='Done' ? '#1D9E75' : status==='In Progress' ? '#FAEEDA' : 'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, fontSize:12 }}>
                            {status==='Done' ? '✓' : status==='In Progress' ? '…' : ''}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, color: status==='Done' ? 'var(--text-muted)' : 'var(--text)', textDecoration: status==='Done' ? 'line-through' : 'none' }}>{step}</div>
                          </div>
                          <div onClick={() => updateItem(phase.id, step, statusCycle[checklist[step]])} style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background: status==='Done' ? '#E1F5EE' : status==='In Progress' ? '#FAEEDA' : '#f3f4f6', color: STATUS_COLORS[status]||'#9ca3af', cursor:'pointer', fontWeight:500, whiteSpace:'nowrap' }}>
                            {status}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {activeTab === 'comparison' && (
        <div style={{ marginBottom:80 }}>
          <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #e5e7eb', marginBottom:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', borderTop:'1px solid #e5e7eb', borderLeft:'1px solid #e5e7eb' }}>
              <thead>
                <tr>
                  <th style={HEAD}>Type</th>
                  <th style={HEAD}>Cost/sqft</th>
                  <th style={HEAD}>Maintenance</th>
                  <th style={HEAD}>Lifespan</th>
                </tr>
              </thead>
              <tbody>
                {HOME_TYPES.map((h,i) => (
                  <tr key={i} style={{ background: i%2===0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...CELL, fontWeight:600 }}>{h.type}</td>
                    <td style={CELL}>{h.cost}</td>
                    <td style={{ ...CELL, color: h.maintenance==='Low' ? '#1D9E75' : h.maintenance.includes('High') ? '#A32D2D' : '#BA7517' }}>{h.maintenance}</td>
                    <td style={CELL}>{h.durability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {HOME_TYPES.map((h,i) => (
            <div key={i} className="card" style={{ marginBottom:10 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>{h.type}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                <div style={{ background:'#f0fdf4', borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600 }}>PROS</div>
                  {h.pros.map((p,j) => <div key={j} style={{ fontSize:12, color:'var(--green-dark)', marginBottom:2 }}>✓ {p}</div>)}
                </div>
                <div style={{ background:'#fff7f7', borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontWeight:600 }}>CONS</div>
                  {h.cons.map((c,j) => <div key={j} style={{ fontSize:12, color:'#A32D2D', marginBottom:2 }}>✗ {c}</div>)}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, padding:'3px 8px', borderRadius:10, background:'#E6F1FB', color:'#185FA5' }}>Energy: {h.energy}</span>
                <span style={{ fontSize:11, padding:'3px 8px', borderRadius:10, background:'#f3f4f6', color:'#6b7280' }}>{h.cost}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
