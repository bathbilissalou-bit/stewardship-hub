import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

const LOAN_TYPES = ['mortgage','car','student','personal','credit_card','other']
const TYPE_LABELS = { mortgage:'Mortgage', car:'Car loan', student:'Student loan', personal:'Personal loan', credit_card:'Credit card', other:'Other' }
const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦', KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA', INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' }
const fmt = n => Number(n||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
const fmtShort = n => Number(n||0).toLocaleString('en-US', { maximumFractionDigits:0 })
const CELL = { padding:'8px 10px', borderRight:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', fontSize:12, background:'white', color:'#1a1a1a' }
const HEAD = { ...CELL, background:'#f3f4f6', fontWeight:600, fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }

function calcPMT(p,r,n) { if(r===0) return p/n; return p*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1) }
function calcMonthsLeft(bal,annualRate,monthly) {
  if(annualRate===0) return Math.ceil(bal/monthly)
  const r=annualRate/100/12
  if(monthly<=bal*r) return Infinity
  return Math.ceil(-Math.log(1-(bal*r)/monthly)/Math.log(1+r))
}
function addMonths(n) { const d=new Date(); d.setMonth(d.getMonth()+n); return d.toLocaleDateString('en-US',{month:'short',year:'numeric'}) }

export default function Loans({ session }) {
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const tr = useT()
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editLoan, setEditLoan] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ loan_type:'personal', lender_name:'', principal:'', interest_rate:'', term_months:'' })
  const userId = session.user.id

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setCurrencySymbol(SYMBOLS[data.currency] || data.currency) })
  }, [userId])

  async function fetchLoans() {
    setLoading(true)
    const { data } = await supabase.from('loans').select('*').eq('user_id',userId).eq('status','active').order('created_at',{ascending:true})
    setLoans(data||[])
    setLoading(false)
  }
  useEffect(() => { fetchLoans() }, [])

  function openAdd() { setEditLoan(null); setForm({ loan_type:'personal', lender_name:'', principal:'', interest_rate:'', term_months:'' }); setShowModal(true) }
  function openEdit(loan) { setEditLoan(loan); setForm({ loan_type:loan.loan_type, lender_name:loan.lender_name||'', principal:loan.principal, interest_rate:Number(loan.interest_rate)*100, term_months:loan.term_months }); setShowModal(true) }

  async function saveLoan() {
    if (!form.principal||!form.interest_rate||!form.term_months) return
    setSaving(true)
    const principal=parseFloat(form.principal), rate=parseFloat(form.interest_rate), term=parseInt(form.term_months)
    const r=rate/100/12, monthly=calcPMT(principal,r,term)
    const payload={ user_id:userId, loan_type:form.loan_type, lender_name:form.lender_name, principal, interest_rate:rate/100, term_months:term, monthly_payment:monthly, remaining_balance:principal, status:'active' }
    if(editLoan){await supabase.from('loans').update(payload).eq('id',editLoan.id)}
    else{await supabase.from('loans').insert(payload)}
    setSaving(false); setShowModal(false); fetchLoans()
  }
  async function markPaidOff(id) { await supabase.from('loans').update({status:'paid_off'}).eq('id',id); fetchLoans() }

  const totalDebt=loans.reduce((s,l)=>s+Number(l.remaining_balance||l.principal),0)
  const totalMonthly=loans.reduce((s,l)=>s+Number(l.monthly_payment||0),0)

  function buildSchedule(loan) {
    const r=Number(loan.interest_rate), pmt=Number(loan.monthly_payment)
    let bal=Number(loan.principal); const rows=[]
    for(let i=1;i<=loan.term_months&&bal>0.01;i++){
      const interest=bal*r/12, princ=Math.min(pmt-interest,bal); bal=Math.max(bal-princ,0)
      const d=new Date(); d.setMonth(d.getMonth()+i)
      rows.push({month:i,date:d.toLocaleDateString('en-US',{month:'short',year:'numeric'}),payment:pmt,principal:princ,interest,balance:bal})
    }
    return rows
  }

  return (
    <div>
      <div style={{ background:'linear-gradient(135deg, #A32D2D, #6B1A1A)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>🏦</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.loanTitle||"Loan Tracker"}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.loanSubtitle||"Full amortization schedule"}</p>
      </div>
      {loans.length>0&&(
        <div className="metric-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
          <div className="metric-card"><div className="metric-label">{tr.totalDebt||'Total debt'}</div><div className="metric-value red" style={{ fontSize:17 }}>{currencySymbol}{fmtShort(totalDebt)}</div></div>
          <div className="metric-card"><div className="metric-label">{tr.monthly||'Monthly payment'}</div><div className="metric-value" style={{ fontSize:17 }}>{currencySymbol}{fmt(totalMonthly)}</div></div>
        </div>
      )}
      {loading&&<div className="spinner"/>}
      {!loading&&loans.length===0&&<div className="empty-state"><div className="icon">🏦</div><p>{tr.noLoans||'No loans added yet'}</p><p style={{marginTop:8}}>{tr.tapAddLoan||'Tap + to add a loan.'}</p></div>}
      {!loading&&loans.length>0&&(
        <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #e5e7eb', marginBottom:20 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', borderTop:'1px solid #e5e7eb', borderLeft:'1px solid #e5e7eb' }}>
            <thead><tr><th style={HEAD}>{tr.loanTracker||'Loan'}</th><th style={HEAD}>{tr.totalDebt||'Balance'}</th><th style={HEAD}>{tr.rate||'Rate'}</th><th style={HEAD}>{tr.monthly||'Monthly'}</th><th style={HEAD}>{tr.paidOff||'Paid off'}</th><th style={HEAD}></th></tr></thead>
            <tbody>
              {loans.map(loan=>{
                const rate=Number(loan.interest_rate)*100, monthly=Number(loan.monthly_payment), balance=Number(loan.remaining_balance||loan.principal)
                const monthsLeft=calcMonthsLeft(balance,rate,monthly)
                const isExpanded=expandedId===loan.id
                const schedule=isExpanded?buildSchedule(loan):[]
                return (
                  <>
                    <tr key={loan.id} style={{ background:isExpanded?'#f0fdf4':'white', cursor:'pointer' }} onClick={()=>setExpandedId(isExpanded?null:loan.id)}>
                      <td style={CELL}><div style={{fontWeight:600}}>{TYPE_LABELS[loan.loan_type]}</div>{loan.lender_name&&<div style={{fontSize:11,color:'#9ca3af'}}>{loan.lender_name}</div>}</td>
                      <td style={{ ...CELL, color:'#A32D2D', fontWeight:600 }}>{currencySymbol}{fmtShort(balance)}</td>
                      <td style={CELL}>{rate.toFixed(2)}%</td>
                      <td style={{ ...CELL, color:'#1D9E75', fontWeight:600 }}>{currencySymbol}{fmt(monthly)}</td>
                      <td style={{ ...CELL, color: monthsLeft===Infinity ? '#A32D2D' : 'inherit' }}>
                        {monthsLeft===Infinity ? '⚠️ Payment too low' : addMonths(monthsLeft)}
                      </td>
                      <td style={{ ...CELL, textAlign:'center' }}><button onClick={e=>{e.stopPropagation();openEdit(loan)}} style={{ fontSize:11, padding:'3px 8px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:4, cursor:'pointer', marginRight:4 }}>{tr.edit||'Edit'}</button><span style={{fontSize:14,color:'#9ca3af'}}>{isExpanded?'▲':'▼'}</span></td>
                    </tr>
                    {isExpanded&&(
                      <tr key={loan.id+'-s'}>
                        <td colSpan={6} style={{padding:0,borderBottom:'1px solid #e5e7eb'}}>
                          <div style={{ overflowX:'auto', maxHeight:260, overflowY:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                              <thead style={{position:'sticky',top:0}}><tr><th style={{...HEAD,fontSize:10}}>Mo.</th><th style={{...HEAD,fontSize:10}}>Date</th><th style={{...HEAD,fontSize:10}}>{tr.monthly||'Payment'}</th><th style={{...HEAD,fontSize:10}}>{tr.principalLabel||'Principal'}</th><th style={{...HEAD,fontSize:10}}>{tr.rate||'Interest'}</th><th style={{...HEAD,fontSize:10}}>{tr.totalDebt||'Balance'}</th></tr></thead>
                              <tbody>{schedule.map((row,i)=><tr key={i} style={{background:i%2===0?'white':'#fafafa'}}><td style={{...CELL,fontSize:11}}>{row.month}</td><td style={{...CELL,fontSize:11}}>{row.date}</td><td style={{...CELL,fontSize:11,fontWeight:600}}>{currencySymbol}{fmt(row.payment)}</td><td style={{...CELL,fontSize:11,color:'#1D9E75'}}>{currencySymbol}{fmt(row.principal)}</td><td style={{...CELL,fontSize:11,color:'#A32D2D'}}>{currencySymbol}{fmt(row.interest)}</td><td style={{...CELL,fontSize:11}}>{currencySymbol}{fmt(row.balance)}</td></tr>)}</tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              <tr style={{background:'#f9fafb'}}><td style={{...HEAD,borderBottom:'none'}}>{tr.totals||'Totals'}</td><td style={{...HEAD,borderBottom:'none',color:'#A32D2D'}}>{currencySymbol}{fmtShort(totalDebt)}</td><td style={{...HEAD,borderBottom:'none'}}></td><td style={{...HEAD,borderBottom:'none',color:'#1D9E75'}}>{currencySymbol}{fmt(totalMonthly)}</td><td style={{...HEAD,borderBottom:'none'}}></td><td style={{...HEAD,borderBottom:'none'}}></td></tr>
            </tbody>
          </table>
        </div>
      )}
      <button className="fab" onClick={openAdd}>+</button>
      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">{editLoan?(tr.editLoan||'Edit loan'):tr.addLoan}</div>
            <div className="form-group" style={{marginBottom:12}}><label>{tr.loanType||'Loan type'}</label><select value={form.loan_type} onChange={e=>setForm(f=>({...f,loan_type:e.target.value}))}>{LOAN_TYPES.map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}</select></div>
            <div className="form-group" style={{marginBottom:12}}><label>{tr.lenderName||'Lender name'}</label><input type="text" placeholder="e.g. Chase Bank" value={form.lender_name} onChange={e=>setForm(f=>({...f,lender_name:e.target.value}))}/></div>
            <div className="form-group" style={{marginBottom:12}}><label>{tr.principalLabel||'Principal'} ({currencySymbol})</label><input type="number" placeholder="20000" value={form.principal} onChange={e=>setForm(f=>({...f,principal:e.target.value}))} min="0" step="0.01"/></div>
            <div className="form-group" style={{marginBottom:12}}><label>{tr.annualRate||'Annual rate (%)'}</label><input type="number" placeholder="6.5" value={form.interest_rate} onChange={e=>setForm(f=>({...f,interest_rate:e.target.value}))} min="0" step="0.01"/></div>
            <div className="form-group" style={{marginBottom:12}}><label>{tr.termMonths||'Term (months)'}</label><input type="number" placeholder="60" value={form.term_months} onChange={e=>setForm(f=>({...f,term_months:e.target.value}))} min="1"/></div>
            {form.principal&&form.interest_rate&&form.term_months&&(
              <div style={{padding:'12px 14px',background:'var(--green-light)',borderRadius:8,marginBottom:12,fontSize:14,color:'var(--green-dark)',fontWeight:600}}>
                {tr.monthlyCalc||'Monthly'}: {currencySymbol}{fmt(calcPMT(parseFloat(form.principal),parseFloat(form.interest_rate)/100/12,parseInt(form.term_months)))}
              </div>
            )}
            <div className="modal-actions">
              {editLoan&&<button className="btn-danger" onClick={()=>{markPaidOff(editLoan.id);setShowModal(false)}}>{tr.markPaidOff||'Mark paid off'}</button>}
              <button onClick={()=>setShowModal(false)} style={{padding:"14px", fontSize:14, fontWeight:600, background:"#f3f4f6", color:"#666", border:"none", borderRadius:10, cursor:"pointer"}}>{tr.cancel||"Cancel"}</button>
              <button onClick={saveLoan} disabled={saving} style={{flex:2, padding:"14px", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #1D9E75, #0F6E56)", color:"white", border:"none", borderRadius:10, cursor:"pointer"}}>{saving ? `💾 ${tr.saving||'Saving…'}` : `💾 ${tr.save||'Save'}`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
