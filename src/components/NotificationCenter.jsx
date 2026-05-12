import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT, getActiveTranslations, interpolate, getLang } from '../lib/i18n'

const SYMBOLS = { USD:'$',EUR:'€',GBP:'£',CAD:'C$',AUD:'A$',NGN:'₦',KES:'KSh',GHS:'₵',ZAR:'R',XOF:'CFA',XAF:'FCFA',INR:'₹',BRL:'R$',MXN:'MX$',CNY:'¥',JPY:'¥',KRW:'₩',RUB:'₽' }
const fmt = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})

function daysUntil(dateVal) {
  return Math.ceil((new Date(dateVal) - new Date()) / (1000 * 60 * 60 * 24))
}

function nextBillDate(dueDay, dueMonth) {
  const today = new Date()
  const yr    = today.getFullYear()
  if (dueMonth && dueMonth > 0) {
    const thisYr = new Date(yr, dueMonth - 1, dueDay)
    const nextYr = new Date(yr + 1, dueMonth - 1, dueDay)
    return thisYr >= today ? thisYr : nextYr
  }
  const d = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (d < today) d.setMonth(d.getMonth() + 1)
  return d
}

function urgencyColor(days) {
  if (days <= 0)  return '#A32D2D'
  if (days <= 3)  return '#C2185B'
  if (days <= 7)  return '#BA7517'
  return '#1D9E75'
}

function urgencyDaysLabel(days, tr) {
  if (days < 0) return tr.urgencyOverdue
  if (days === 0) return tr.urgencyToday
  if (days === 1) return tr.urgencyTomorrow
  return interpolate(tr.urgencyInDays, { days: String(days) })
}

// ── Browser Notification helpers ─────────────────────────────────────────────
async function requestPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function fireBrowserNotification(title, body, tag) {
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon:'/favicon.ico', tag })
  } catch (_) {}
}

// ── Module-level cache — survives page navigation, resets after 5 min ────────
const CACHE_TTL = 5 * 60 * 1000   // 5 minutes
let _cachedAlerts = null
let _cachedSymbol = '$'
let _cacheUserId  = null
let _cacheTime    = 0
let _cacheLang    = null

// ── Main component ────────────────────────────────────────────────────────────
export default function NotificationCenter({ userId }) {
  const tr = useT()
  const [open,        setOpen]        = useState(false)
  const [alerts,      setAlerts]      = useState([])
  const [dismissed,   setDismissed]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('sh_dismissed_alerts') || '[]') } catch { return [] }
  })
  const [symbol,      setSymbol]      = useState('$')
  const [permGranted, setPermGranted] = useState(Notification?.permission === 'granted')

  const loadAlerts = useCallback(async (force = false) => {
    if (!userId) return
    const trn = getActiveTranslations()
    const langNow = getLang()

    // Return cached data if fresh and same user — avoids 4 DB queries on every page nav
    const now = Date.now()
    if (!force && _cacheUserId === userId && _cachedAlerts && _cacheLang === langNow && (now - _cacheTime) < CACHE_TTL) {
      setAlerts(_cachedAlerts)
      setSymbol(_cachedSymbol)
      return
    }

    let userRow, bills, subs, goals
    try {
      const [r0, r1, r2, r3] = await Promise.all([
        supabase.from('users').select('currency').eq('id', userId).single(),
        supabase.from('bills').select('id,name,amount,due_day,due_month,status,paid_month').eq('user_id', userId),
        supabase.from('subscriptions').select('id,name,amount,icon,next_billing_date').eq('user_id', userId),
        supabase.from('savings_goals').select('id,name,icon,current_amount,target_amount').eq('user_id', userId).eq('status','active'),
      ])
      userRow = r0.data; bills = r1.data; subs = r2.data; goals = r3.data
    } catch (_) { return }

    if (userRow?.currency) setSymbol(SYMBOLS[userRow.currency] || '$')

    const newAlerts = []

    // Bills due within 7 days — skip if already paid this month
    const thisMonth = new Date().toISOString().slice(0, 7)
    ;(bills || []).filter(b => !(b.status === 'paid' && b.paid_month === thisMonth)).forEach(bill => {
      const due  = nextBillDate(bill.due_day, bill.due_month)
      const days = daysUntil(due)
      if (days <= 7) {
        const amt = `${SYMBOLS[userRow?.currency] || '$'}${fmt(bill.amount)}`
        newAlerts.push({
          id:    `bill-${bill.id}`,
          type:  'bill',
          icon:  '🔔',
          title: bill.name,
          body:  interpolate(trn.billDueBody, { amount: amt }),
          days,
          link:  '/bills',
        })
      }
    })

    // Subscriptions renewing within 7 days
    ;(subs || []).forEach(sub => {
      if (!sub.next_billing_date) return
      const days = daysUntil(sub.next_billing_date)
      if (days <= 7) {
        const amt = `${SYMBOLS[userRow?.currency] || '$'}${fmt(sub.amount)}`
        newAlerts.push({
          id:    `sub-${sub.id}`,
          type:  'subscription',
          icon:  sub.icon || '🔄',
          title: sub.name,
          body:  interpolate(trn.subRenewing, { amount: amt }),
          days,
          link:  '/subscriptions',
        })
      }
    })

    // Savings goals ≥ 80% complete
    ;(goals || []).forEach(goal => {
      const pct = goal.target_amount > 0
        ? Math.round(goal.current_amount / goal.target_amount * 100)
        : 0
      if (pct >= 80) {
        newAlerts.push({
          id:    `goal-${goal.id}`,
          type:  'goal',
          icon:  goal.icon || '🎯',
          title: goal.name,
          body:  interpolate(trn.goalPctReached, { pct: String(pct) }),
          days:  null,
          link:  '/savings',
          pct,
        })
      }
    })

    // Sort: overdue first, then by days
    newAlerts.sort((a, b) => {
      if (a.days === null) return 1
      if (b.days === null) return -1
      return a.days - b.days
    })

    // Save to module-level cache
    _cachedAlerts = newAlerts
    _cachedSymbol = userRow?.currency ? (SYMBOLS[userRow.currency] || '$') : '$'
    _cacheUserId  = userId
    _cacheLang    = langNow
    _cacheTime    = Date.now()

    setAlerts(newAlerts)

    // Fire browser notifications for urgent items (due today or overdue)
    if (Notification.permission === 'granted') {
      newAlerts
        .filter(a => a.days !== null && a.days <= 1)
        .forEach(a => {
          const suf =
            a.days === 0 ? trn.browserSuffixToday
            : a.days < 0 ? trn.browserSuffixOverdue
            : trn.browserSuffixTomorrow
          fireBrowserNotification(
            `${a.icon} ${a.title}`,
            a.body + suf,
            a.id
          )
        })
    }
  }, [userId])

  useEffect(() => {
    loadAlerts()
    // Refresh every 60 seconds
    const interval = setInterval(loadAlerts, 60_000)
    return () => clearInterval(interval)
  }, [loadAlerts])

  // Persist dismissed list
  useEffect(() => {
    localStorage.setItem('sh_dismissed_alerts', JSON.stringify(dismissed))
  }, [dismissed])

  async function enableNotifications() {
    const granted = await requestPermission()
    setPermGranted(granted)
    if (granted) loadAlerts()
  }

  function dismiss(id) {
    setDismissed(prev => [...prev, id])
  }

  function clearAll() {
    setDismissed(prev => [...prev, ...visible.map(a => a.id)])
    setOpen(false)
  }

  const visible   = alerts.filter(a => !dismissed.includes(a.id))
  const badgeCount = visible.length

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:'relative', width:36, height:36, borderRadius:10,
          background: badgeCount > 0 ? '#FCEBEB' : 'var(--green-light)',
          border:'none', cursor:'pointer', display:'flex',
          alignItems:'center', justifyContent:'center', fontSize:18,
          color: badgeCount > 0 ? '#A32D2D' : 'var(--green-dark)',
        }}
        aria-label={tr.ariaNotifications}
      >
        🔔
        {badgeCount > 0 && (
          <span style={{
            position:'absolute', top:-4, right:-4,
            width:18, height:18, borderRadius:'50%',
            background:'#A32D2D', color:'white',
            fontSize:10, fontWeight:800,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:'2px solid white',
          }}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:998, background:'rgba(0,0,0,0.25)' }}
          />

          {/* Drawer */}
          <div style={{
            position:'fixed', top:0, right:0, bottom:0,
            width: Math.min(380, window.innerWidth),
            background:'white', zIndex:999,
            boxShadow:'-4px 0 24px rgba(0,0,0,0.12)',
            display:'flex', flexDirection:'column',
            animation:'slideInRight 0.22s ease',
          }}>
            {/* Header */}
            <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid #f3f4f6' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:17, fontWeight:800 }}>{tr.notificationsHeading}</div>
                <button onClick={() => setOpen(false)}
                  style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#9ca3af', lineHeight:1 }}>✕</button>
              </div>
              {badgeCount > 0 && (
                <button onClick={clearAll}
                  style={{ marginTop:8, fontSize:12, color:'#9ca3af', background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline' }}>
                  {tr.dismissAll}
                </button>
              )}
            </div>

            {/* Browser permission prompt */}
            {!permGranted && (
              <div style={{ margin:'12px 16px 0', background:'#EBF4FB', borderRadius:12, padding:'12px 14px', border:'1px solid #185FA5' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#185FA5', marginBottom:4 }}>{tr.enablePushTitle}</div>
                <div style={{ fontSize:12, color:'#374151', marginBottom:10 }}>{tr.enablePushBody}</div>
                <button onClick={enableNotifications}
                  style={{ padding:'8px 16px', background:'#185FA5', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  {tr.allowNotifications}
                </button>
              </div>
            )}

            {/* Alert list */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
              {visible.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 16px', color:'#9ca3af' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
                  <div style={{ fontWeight:700, color:'#374151', marginBottom:4 }}>{tr.allClearTitle}</div>
                  <div style={{ fontSize:13 }}>{tr.noUpcomingAlerts}</div>
                </div>
              ) : (
                visible.map(alert => {
                  const color = alert.days !== null ? urgencyColor(alert.days) : '#1D9E75'
                  return (
                    <div key={alert.id} style={{
                      display:'flex', alignItems:'flex-start', gap:12,
                      background:'white', borderRadius:14, padding:'14px',
                      marginBottom:10, border:`1.5px solid ${color}22`,
                      boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
                    }}>
                      {/* Icon */}
                      <div style={{
                        width:40, height:40, borderRadius:12,
                        background:`${color}15`, display:'flex',
                        alignItems:'center', justifyContent:'center',
                        fontSize:20, flexShrink:0,
                      }}>
                        {alert.icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:'#111' }}>{alert.title}</div>
                        <div style={{ fontSize:12, color:'#6b7280', marginTop:1 }}>{alert.body}</div>
                        {alert.days !== null && (
                          <div style={{
                            display:'inline-block', marginTop:5,
                            fontSize:11, fontWeight:700, color,
                            background:`${color}15`, padding:'2px 8px', borderRadius:8,
                          }}>
                            {urgencyDaysLabel(alert.days, tr)}
                          </div>
                        )}
                        {alert.pct !== undefined && (
                          <div style={{ marginTop:6 }}>
                            <div style={{ height:5, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${alert.pct}%`, background:'#1D9E75', borderRadius:3 }} />
                            </div>
                            <div style={{ fontSize:10, color:'#1D9E75', marginTop:2, fontWeight:600 }}>{interpolate(tr.goalPctComplete, { pct: String(alert.pct) })}</div>
                          </div>
                        )}
                        <Link to={alert.link} onClick={() => setOpen(false)}
                          style={{ fontSize:11, color:'#185FA5', textDecoration:'none', fontWeight:600, display:'inline-block', marginTop:6 }}>
                          {tr.viewAlertLink}
                        </Link>
                      </div>

                      {/* Dismiss */}
                      <button onClick={() => dismiss(alert.id)}
                        style={{ background:'none', border:'none', fontSize:14, color:'#d1d5db', cursor:'pointer', flexShrink:0, padding:'2px' }}>
                        ✕
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'14px 16px', borderTop:'1px solid #f3f4f6', fontSize:12, color:'#9ca3af', textAlign:'center' }}>
              {tr.alertsFooterNote}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity:0 }
          to   { transform: translateX(0);    opacity:1 }
        }
      `}</style>
    </>
  )
}
