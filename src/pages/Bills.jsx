import { useState, useEffect } from 'react'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Housing','Utilities','Insurance','Subscriptions','Loans','Food','Transport','Health','Education','Other']
const CAT_ICONS = { Housing:'🏠', Utilities:'💡', Insurance:'🛡️', Subscriptions:'📱', Loans:'🏦', Food:'🛒', Transport:'🚗', Health:'🏥', Education:'📚', Other:'📄' }
const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦', KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA', INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' }
const fmt = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

function nextDueDate(dueDay, dueMonth) {
  const today = new Date()
  const year = today.getFullYear()

  if (dueMonth && dueMonth > 0) {
    // Specific month — find next occurrence
    const thisYear = new Date(year, dueMonth - 1, dueDay)
    const nextYear = new Date(year + 1, dueMonth - 1, dueDay)
    return thisYear >= today ? thisYear : nextYear
  }

  // Monthly recurring — find next occurrence this or next month
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (thisMonth < today) thisMonth.setMonth(thisMonth.getMonth() + 1)
  return thisMonth
}

function daysUntil(date) {
  return Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
}

function formatDueDate(dueDay, dueMonth) {
  const d = nextDueDate(dueDay, dueMonth)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  const result = await Notification.requestPermission()
  return result
}

function sendBillNotification(bill, currencySymbol, days) {
  if (Notification.permission !== 'granted') return
  new Notification(`🔔 Bill Due in ${days} Day${days !== 1 ? 's' : ''}`, {
    body: `${bill.name} — ${currencySymbol}${fmt(bill.amount)} is due on ${formatDueDate(bill.due_day, bill.due_month)}`,
    icon: '/favicon.ico',
    tag: `bill-${bill.id}`,
  })
}

export default function Bills({ session }) {
  const tr = useT()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [notifPerm, setNotifPerm] = useState(Notification?.permission || 'unsupported')
  const [form, setForm] = useState({ name:'', amount:'', due_day:'1', due_month:'0', category:'Utilities', auto_pay:false })
  const userId = session.user.id

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setCurrencySymbol(SYMBOLS[data.currency] || data.currency) })
  }, [userId])

  async function fetchBills() {
    setLoading(true)
    const { data } = await supabase.from('bills').select('*').eq('user_id', userId).order('due_day', { ascending:true })
    setBills(data || [])
    setLoading(false)
  }
  useEffect(() => { fetchBills() }, [])

  async function saveBill() {
    if (!form.name || !form.amount) return
    setSaving(true)
    const icon = CAT_ICONS[form.category] || '📄'
    await supabase.from('bills').insert({
      user_id: userId,
      name: form.name,
      amount: parseFloat(form.amount),
      due_day: parseInt(form.due_day),
      due_month: parseInt(form.due_month) || 0,
      category: form.category,
      icon,
      auto_pay: form.auto_pay,
    })
    setSaving(false); setShowModal(false)
    setForm({ name:'', amount:'', due_day:'1', due_month:'0', category:'Utilities', auto_pay:false })
    fetchBills()
  }

  async function togglePaid(bill) {
    const currentMonth = new Date().toISOString().slice(0, 7) // e.g. '2025-05'
    const isPaid = bill.status === 'paid' && bill.paid_month === currentMonth
    const newStatus = isPaid ? 'unpaid' : 'paid'
    await supabase.from('bills')
      .update({ status: newStatus, paid_month: newStatus === 'paid' ? currentMonth : null })
      .eq('id', bill.id)
    fetchBills()
  }

  async function deleteBill(id) {
    await supabase.from('bills').delete().eq('id', id)
    fetchBills()
  }

  async function handleEnableNotifications() {
    const perm = await requestNotificationPermission()
    setNotifPerm(perm)
    if (perm === 'granted') {
      const dueSoonBills = bills.filter(b => !isPaidThisMonth(b) && daysUntil(nextDueDate(b.due_day, b.due_month || 0)) <= 7)
      if (dueSoonBills.length === 0) {
        new Notification('✅ Bill Reminders Active', {
          body: 'You\'re all caught up! No bills due in the next 7 days.',
          icon: '/favicon.ico',
        })
      } else {
        dueSoonBills.forEach(b => {
          const days = daysUntil(nextDueDate(b.due_day, b.due_month || 0))
          sendBillNotification(b, currencySymbol, days)
        })
      }
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  // A bill is only "paid" if it was marked paid THIS month — auto-resets every new month
  const isPaidThisMonth = b => b.status === 'paid' && b.paid_month === currentMonth
  const totalMonthly = bills.reduce((s, b) => s + Number(b.amount), 0)
  const paidTotal = bills.filter(isPaidThisMonth).reduce((s, b) => s + Number(b.amount), 0)
  const unpaidBills = bills.filter(b => !isPaidThisMonth(b))
  const dueSoon = unpaidBills.filter(b => daysUntil(nextDueDate(b.due_day, b.due_month || 0)) <= 7)

  const notifSupported = 'Notification' in window

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg, #E64A19, #BF360C)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>🔔</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.billsTitle||'Bill Reminders'}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.billsSubtitle||'Never miss a payment again'}</p>
      </div>

      {/* Notification banner */}
      {notifSupported && notifPerm !== 'granted' && notifPerm !== 'denied' && (
        <div style={{ background:'linear-gradient(135deg, #BA7517, #7A4D0F)', borderRadius:12, padding:'12px 16px', marginBottom:12, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:24, flexShrink:0 }}>🔔</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:2 }}>{tr.enableNotifs||'Enable bill alerts'}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.8)' }}>{tr.notifDesc||'Get notified when bills are due soon'}</div>
          </div>
          <button onClick={handleEnableNotifications}
            style={{ padding:'7px 14px', background:'white', color:'#BA7517', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer', flexShrink:0 }}>
            {tr.enable||'Enable'}
          </button>
        </div>
      )}
      {notifSupported && notifPerm === 'granted' && bills.length > 0 && (
        <div style={{ background:'#E1F5EE', borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>✅</span>
          <div style={{ flex:1, fontSize:12, color:'#0F6E56', fontWeight:600 }}>{tr.notifsActive||'Bill notifications are active'}</div>
          <button onClick={handleEnableNotifications}
            style={{ padding:'5px 10px', background:'#1D9E75', color:'white', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>
            {tr.testNotif||'Test'}
          </button>
        </div>
      )}
      {notifSupported && notifPerm === 'denied' && (
        <div style={{ background:'#FFF8E1', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:12, color:'#BA7517' }}>
          ⚠️ {tr.notifDenied||'Notifications blocked. Enable them in your browser settings.'}
        </div>
      )}

      {/* Due-soon alerts */}
      {dueSoon.map(bill => {
        const days = daysUntil(nextDueDate(bill.due_day, bill.due_month || 0))
        return (
          <div key={bill.id} style={{ background:'#FCEBEB', borderRadius:10, padding:'10px 14px', marginBottom:8, border:'1px solid #A32D2D33', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#A32D2D' }}>⚠️ {tr.dueIn||'Due in'} {days} {tr.days||'days'} — {formatDueDate(bill.due_day, bill.due_month || 0)}</div>
              <div style={{ fontSize:13 }}>{bill.name} — {currencySymbol}{fmt(bill.amount)}</div>
            </div>
            <button onClick={() => togglePaid(bill)} style={{ padding:'4px 10px', background:'#A32D2D', color:'white', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer' }}>{tr.markPaid||'Mark paid'}</button>
          </div>
        )
      })}

      {/* Metric cards */}
      {bills.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div className="metric-card"><div className="metric-label">{tr.monthlyTotal||'Monthly total'}</div><div className="metric-value red" style={{ fontSize:17 }}>{currencySymbol}{fmt(totalMonthly)}</div></div>
          <div className="metric-card"><div className="metric-label">{tr.paidThisMonth||'Paid this month'}</div><div className="metric-value green" style={{ fontSize:17 }}>{currencySymbol}{fmt(paidTotal)}</div></div>
        </div>
      )}

      {/* Progress bar */}
      {bills.length > 0 && (
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
            <span style={{ fontWeight:600 }}>{tr.paymentProgress||'Payment progress'}</span>
            <span style={{ color:'var(--green)', fontWeight:700 }}>{bills.filter(isPaidThisMonth).length}/{bills.length} {tr.paid||'paid'}</span>
          </div>
          <div style={{ height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.round(bills.filter(isPaidThisMonth).length / bills.length * 100)}%`, background:'#1D9E75', borderRadius:4 }} />
          </div>
        </div>
      )}

      {loading && <div className="spinner" />}
      {!loading && bills.length === 0 && (
        <div className="empty-state"><div className="icon">🔔</div><p>{tr.noBills||'No bills added yet'}</p><p style={{ marginTop:8, fontSize:13 }}>{tr.tapAddBill||'Tap + to add your recurring bills'}</p></div>
      )}

      {/* Bill list */}
      {bills.map(bill => {
        const dueDate = nextDueDate(bill.due_day, bill.due_month || 0)
        const days = daysUntil(dueDate)
        const paid = isPaidThisMonth(bill)
        const isRecurring = !bill.due_month || bill.due_month === 0
        return (
          <div key={bill.id} className="card" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8, padding:'12px 16px', opacity:paid ? 0.6 : 1 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:paid ? '#f3f4f6' : 'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              {CAT_ICONS[bill.category] || '📄'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14, textDecoration:paid ? 'line-through' : 'none' }}>{bill.name}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                📅 {formatDueDate(bill.due_day, bill.due_month || 0)}
                {isRecurring && <span style={{ marginLeft:4, fontSize:10, color:'#9ca3af' }}>· monthly</span>}
                {bill.auto_pay && <span style={{ marginLeft:6, padding:'1px 6px', background:'var(--green-light)', color:'var(--green-dark)', borderRadius:4, fontSize:10 }}>{tr.autoPay||'Auto-pay'}</span>}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontWeight:700, fontSize:15, color:paid ? 'var(--text-muted)' : '#A32D2D' }}>{currencySymbol}{fmt(bill.amount)}</div>
              <div style={{ fontSize:10, color:days <= 7 && !paid ? '#A32D2D' : 'var(--text-muted)', marginTop:1 }}>
                {paid ? `✓ ${tr.paid||'Paid'}` : days === 0 ? '⚠️ Today!' : `${days}${tr.dLeft||'d left'}`}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <button onClick={() => togglePaid(bill)} style={{ padding:'4px 8px', background:paid ? '#f3f4f6' : 'var(--green-light)', color:paid ? 'var(--text-muted)' : 'var(--green-dark)', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                {paid ? (tr.undo||'Undo') : (tr.markPaid||'Mark paid')}
              </button>
              <button onClick={() => deleteBill(bill.id)} style={{ padding:'3px 8px', background:'none', color:'#ef4444', border:'none', fontSize:10, cursor:'pointer' }}>{tr.delete||'Delete'}</button>
            </div>
          </div>
        )
      })}

      <button className="fab" onClick={() => setShowModal(true)}>+</button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{tr.addBill||'Add bill reminder'}</div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.billName||'Bill name'}</label>
              <input type="text" placeholder="e.g. Netflix, Rent, Electric" value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} autoFocus />
            </div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.amount||'Amount'} ({currencySymbol})</label>
              <input type="number" placeholder="100" value={form.amount} onChange={e => setForm(f => ({...f, amount:e.target.value}))} min="0" />
            </div>

            {/* Day picker */}
            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.dueDayLabel||'Due day'}</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:6 }}>
                {Array.from({length:31}, (_, i) => i + 1).map(d => (
                  <button key={d} onClick={() => setForm(f => ({...f, due_day:String(d)}))}
                    style={{ width:34, height:34, borderRadius:8, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                      borderColor: parseInt(form.due_day) === d ? '#E64A19' : 'var(--border)',
                      background: parseInt(form.due_day) === d ? '#FBE9E7' : 'var(--bg)',
                      color: parseInt(form.due_day) === d ? '#E64A19' : 'var(--text)' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Month picker */}
            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.dueMonthLabel||'Month (leave empty = repeats monthly)'}</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                <button onClick={() => setForm(f => ({...f, due_month:'0'}))}
                  style={{ padding:'6px 12px', borderRadius:8, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                    borderColor: form.due_month === '0' ? '#E64A19' : 'var(--border)',
                    background: form.due_month === '0' ? '#FBE9E7' : 'var(--bg)',
                    color: form.due_month === '0' ? '#E64A19' : 'var(--text)' }}>
                  🔄 Monthly
                </button>
                {MONTHS.map((m, i) => (
                  <button key={m} onClick={() => setForm(f => ({...f, due_month:String(i + 1)}))}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer',
                      borderColor: parseInt(form.due_month) === i + 1 ? '#E64A19' : 'var(--border)',
                      background: parseInt(form.due_month) === i + 1 ? '#FBE9E7' : 'var(--bg)',
                      color: parseInt(form.due_month) === i + 1 ? '#E64A19' : 'var(--text)' }}>
                    {m}
                  </button>
                ))}
              </div>
              {form.due_month !== '0' && (
                <div style={{ marginTop:8, fontSize:12, color:'#E64A19', fontWeight:600 }}>
                  📅 Due: {MONTH_FULL[parseInt(form.due_month) - 1]} {form.due_day}
                </div>
              )}
              {form.due_month === '0' && form.due_day && (
                <div style={{ marginTop:8, fontSize:12, color:'#0F6E56', fontWeight:600 }}>
                  🔄 Every month on the {form.due_day}{['st','nd','rd'][((form.due_day % 10) - 1)] || 'th'}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.category||'Category'}</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:'10px 14px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)' }}>
              <input type="checkbox" id="autopay" checked={form.auto_pay} onChange={e => setForm(f => ({...f, auto_pay:e.target.checked}))} style={{ width:16, height:16 }} />
              <label htmlFor="autopay" style={{ fontSize:13, cursor:'pointer' }}>{tr.autoPay||'Auto-pay enabled'}</label>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} style={{ padding:"14px", fontSize:14, fontWeight:600, background:"#f3f4f6", color:"#666", border:"none", borderRadius:10, cursor:"pointer" }}>{tr.cancel||'Cancel'}</button>
              <button onClick={saveBill} disabled={saving} style={{ flex:2, padding:"14px", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #E64A19, #BF360C)", color:"white", border:"none", borderRadius:10, cursor:"pointer" }}>
                {saving ? `💾 ${tr.saving||'Saving…'}` : `💾 ${tr.save||'Save'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
