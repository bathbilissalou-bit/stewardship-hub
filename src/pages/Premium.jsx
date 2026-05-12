import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useT, interpolate } from '../lib/i18n'

const FREE_COUNT = 16
const PLUS_COUNT = 11

export default function Premium({ session, isPremium }) {
  const tr = useT()
  const [billing, setBilling] = useState('monthly')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistName, setWaitlistName] = useState('')
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistError, setWaitlistError] = useState('')
  const price = billing === 'monthly' ? 7.99 : 59
  const savings = billing === 'yearly' ? tr.premium_save_yearly : null

  const periodWord = billing === 'monthly' ? tr.premium_period_month : tr.premium_period_year

  return (
    <div style={{ paddingBottom: 100 }}>
      {isPremium && (
        <div style={{ background: 'linear-gradient(135deg, #BA7517, #7A4D0F)', padding: '14px 20px', textAlign: 'center', color: 'white', marginBottom: 16, borderRadius: 14 }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>👑</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{tr.premium_banner_title}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{tr.premium_banner_sub}</div>
        </div>
      )}

      <div style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', padding: '32px 20px 40px', textAlign: 'center', marginBottom: -16, borderRadius: '0 0 24px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>👑</div>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 8px' }}>{tr.premium_header_title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>{tr.premium_header_sub}</p>
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {['monthly', 'yearly'].map(b => (
            <button key={b} type="button" onClick={() => setBilling(b)}
              style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: billing === b ? 'white' : 'transparent', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: billing === b ? 'var(--green-dark)' : 'var(--text-muted)', boxShadow: billing === b ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', position: 'relative' }}>
              {b === 'monthly' ? tr.premium_billing_monthly : tr.premium_billing_yearly}
              {b === 'yearly' && <span style={{ position: 'absolute', top: -8, right: 4, background: '#A32D2D', color: 'white', fontSize: 9, padding: '2px 5px', borderRadius: 6, fontWeight: 700 }}>{tr.premium_save_pct}</span>}
            </button>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius: 20, padding: '24px 20px', marginBottom: 16, textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px' }}>
            ${price}
            <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.8 }}>{billing === 'monthly' ? tr.premium_price_suffix_mo : tr.premium_price_suffix_yr}</span>
          </div>
          {savings && <div style={{ fontSize: 13, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', display: 'inline-block', marginTop: 4 }}>{savings}</div>}
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>{tr.premium_cancel_note}</div>

          <button type="button" style={{ width: '100%', padding: '14px', background: 'white', color: '#0F6E56', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 16 }}
            onClick={() => {
              if (isPremium) {
                alert(tr.premium_alert_has)
              } else {
                alert(tr.premium_alert_soon)
              }
            }}>
            {tr.premium_cta_trial}
          </button>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
            {interpolate(tr.premium_then_price, { price, period: periodWord })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text-muted)' }}>{tr.premium_tier_free}</div>
            {Array.from({ length: FREE_COUNT }, (_, i) => tr[`premium_free_${i}`]).map((f, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 6, color: f?.startsWith?.('❌') ? '#ccc' : 'var(--text)', lineHeight: 1.4 }}>{f}</div>
            ))}
          </div>
          <div className="card" style={{ padding: 14, border: '2px solid var(--green)', background: 'var(--green-light)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--green-dark)' }}>{tr.premium_tier_plus}</div>
            {Array.from({ length: PLUS_COUNT }, (_, i) => tr[`premium_plus_${i}`]).map((f, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 6, color: 'var(--green-dark)', lineHeight: 1.4 }}>{f}</div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16, background: '#FAEEDA' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#BA7517', marginBottom: 8 }}>{tr.premium_why_title}</div>
          {[
            { icon: '🌍', text: tr.premium_why_1 },
            { icon: '📊', text: tr.premium_why_2 },
            { icon: '📄', text: tr.premium_why_3 },
            { icon: '📸', text: tr.premium_why_4 },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{tr.premium_faq_title}</div>
          {[
            { q: tr.premium_faq_q1, a: tr.premium_faq_a1 },
            { q: tr.premium_faq_q2, a: tr.premium_faq_a2 },
            { q: tr.premium_faq_q3, a: tr.premium_faq_a3 },
            { q: tr.premium_faq_q4, a: tr.premium_faq_a4 },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.q}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.a}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #185FA5, #0D3D6E)', color: 'white', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{tr.premium_waitlist_title}</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 16 }}>{tr.premium_waitlist_sub}</div>

          {waitlistDone ? (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{tr.premium_waitlist_done_title}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{tr.premium_waitlist_done_sub}</div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder={tr.premium_waitlist_name_ph}
                value={waitlistName}
                onChange={e => setWaitlistName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                type="email"
                placeholder={tr.premium_waitlist_email_ph}
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
              />
              {waitlistError && <div style={{ fontSize: 12, color: '#ffcccc', marginBottom: 8 }}>{waitlistError}</div>}
              <button
                type="button"
                disabled={waitlistLoading}
                onClick={async () => {
                  if (!waitlistEmail) { setWaitlistError(tr.premium_waitlist_err_email); return }
                  setWaitlistLoading(true)
                  setWaitlistError('')
                  const { error } = await supabase.from('waitlist').insert({ email: waitlistEmail, name: waitlistName, plan: 'premium' })
                  if (error) {
                    if (error.code === '23505') {
                      setWaitlistError(tr.premium_waitlist_err_dup)
                    } else {
                      setWaitlistError(tr.premium_waitlist_err_generic)
                    }
                  } else {
                    setWaitlistDone(true)
                  }
                  setWaitlistLoading(false)
                }}
                style={{ width: '100%', padding: '12px', background: 'white', color: '#185FA5', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {waitlistLoading ? tr.premium_waitlist_btn_loading : tr.premium_waitlist_btn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
