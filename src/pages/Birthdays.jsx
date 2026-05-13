import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

function daysUntil(monthDay) {
  const today = new Date()
  const thisYear = today.getFullYear()
  const [month, day] = monthDay.split('-').map(Number)
  let next = new Date(thisYear, month - 1, day)
  if (next < today) next = new Date(thisYear + 1, month - 1, day)
  const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
  return diff === 365 ? 0 : diff
}

function formatDate(monthDay) {
  const [month, day] = monthDay.split('-').map(Number)
  return new Date(2000, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export default function Birthdays({ session }) {
  const tr = useT()
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [month, setMonth] = useState('01')
  const [day, setDay] = useState('01')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('birthdays')
      .select('*')
      .eq('user_id', session.user.id)
      .order('month_day')
    setPeople(data || [])
    setLoading(false)
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const monthDay = `${month}-${day.padStart(2,'0')}`
    const payload = { user_id: session.user.id, name: name.trim(), month_day: monthDay, note: note.trim() }
    if (editId) {
      await supabase.from('birthdays').update(payload).eq('id', editId).catch(() => {})
    } else {
      await supabase.from('birthdays').insert(payload).catch(() => {})
    }
    setSaving(false)
    resetForm()
    load()
  }

  async function remove(id) {
    await supabase.from('birthdays').delete().eq('id', id).catch(() => {})
    load()
  }

  function openEdit(p) {
    const [m, d] = p.month_day.split('-')
    setEditId(p.id)
    setName(p.name)
    setMonth(m)
    setDay(d)
    setNote(p.note || '')
    setShowAdd(true)
  }

  function resetForm() {
    setShowAdd(false)
    setEditId(null)
    setName('')
    setMonth('01')
    setDay('01')
    setNote('')
  }

  const sorted = [...people].sort((a, b) => daysUntil(a.month_day) - daysUntil(b.month_day))
  const upcoming = sorted.filter(p => daysUntil(p.month_day) <= 30)
  const rest = sorted.filter(p => daysUntil(p.month_day) > 30)

  function BirthdayCard({ p }) {
    const days = daysUntil(p.month_day)
    const isToday = days === 0
    const isSoon = days <= 7
    return (
      <div style={{
        background: isToday ? 'linear-gradient(135deg,#FCE4EC,#F8BBD0)' : 'var(--white)',
        borderRadius: 14,
        padding: '14px 16px',
        border: `1.5px solid ${isToday ? '#E91E63' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 10,
        boxShadow: isToday ? '0 2px 12px rgba(233,30,99,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: isToday ? '#E91E63' : isSoon ? '#FCE4EC' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {isToday ? '🎉' : '🎂'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: isToday ? '#C2185B' : 'var(--text)', marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(p.month_day)}</div>
          {p.note && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{p.note}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 700,
            color: isToday ? '#C2185B' : isSoon ? '#D97706' : '#6b7280',
            background: isToday ? 'rgba(233,30,99,0.1)' : isSoon ? '#FEF3C7' : '#f9fafb',
            borderRadius: 8, padding: '3px 8px', marginBottom: 8,
          }}>
            {isToday ? (tr.bday_today || '🎂 Today!') : days === 1 ? (tr.bday_tomorrow || 'Tomorrow') : `${days} ${tr.bday_days ? tr.bday_days.replace('{n} ', '').replace('{n}', '') : 'days'}`}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2 }}>✏️</button>
            <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 2 }}>🗑️</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)', borderRadius: '16px 16px 0 0', padding: '20px 16px 32px', marginBottom: '-16px', color: 'white' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>🎂</div>
        <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>{tr.bday_title || 'Birthday Reminders'}</h2>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 13 }}>{tr.bday_subtitle || 'Never miss a birthday — family, friends & more'}</p>
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        {/* Add button */}
        <button
          onClick={() => setShowAdd(true)}
          style={{ width: '100%', padding: '13px', background: '#E91E63', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}>
          {tr.bday_add || '+ Add Birthday'}
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>{tr.nutr_loading || 'Loading...'}</div>
        ) : people.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎂</div>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{tr.bday_empty_title || 'No birthdays yet'}</div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>{tr.bday_empty_sub || 'Add family & friends to never miss their special day'}</div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C2185B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 4, height: 16, borderRadius: 2, background: '#E91E63', display: 'inline-block' }} />
                  {tr.bday_coming_up || 'Coming up (next 30 days)'}
                </div>
                {upcoming.map(p => <BirthdayCard key={p.id} p={p} />)}
              </div>
            )}
            {rest.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 4, height: 16, borderRadius: 2, background: '#d1d5db', display: 'inline-block' }} />
                  {tr.bday_later || 'Later this year'}
                </div>
                {rest.map(p => <BirthdayCard key={p.id} p={p} />)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--white)', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editId ? (tr.bday_edit || 'Edit Birthday') : (tr.bday_modal_add || 'Add Birthday')}</h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>{tr.bday_name || 'Name'}</div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={tr.bday_ph_name || 'e.g. Mom, John, Sister...'}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>{tr.bday_birthday || 'Birthday'}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={month} onChange={e => setMonth(e.target.value)}
                  style={{ flex: 2, padding: '11px 10px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: 'white' }}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>
                  ))}
                </select>
                <select value={day} onChange={e => setDay(e.target.value)}
                  style={{ flex: 1, padding: '11px 10px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: 'white' }}>
                  {Array.from({length:31},(_,i)=>i+1).map(d => (
                    <option key={d} value={String(d).padStart(2,'0')}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>{tr.bday_note || 'Note (optional)'}</div>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={tr.bday_ph_note || 'e.g. Get a cake, Call her...'}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={save}
              disabled={saving || !name.trim()}
              style={{ width: '100%', padding: '14px', background: '#E91E63', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: (!name.trim() || saving) ? 0.6 : 1 }}>
              {saving ? (tr.bday_saving || 'Saving...') : editId ? (tr.bday_save_changes || 'Save Changes') : (tr.bday_modal_add || 'Add Birthday')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
