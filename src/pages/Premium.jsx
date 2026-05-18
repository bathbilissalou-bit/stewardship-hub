import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useT, interpolate } from '../lib/i18n'

// Strip leading ✅/❌ emoji so we can render our own indicators
function stripMark(str) {
  return (str || '').replace(/^[✅❌]\s*/, '')
}

function Check({ color = '#1D9E75' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="8" fill={color} fillOpacity="0.12"/>
      <path d="M5 8.5l2 2 4-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Dash() {
  return (
    <div style={{
      width: 16, height: 16, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <div style={{ width: 8, height: 2, background: '#d1d5db', borderRadius: 1 }} />
    </div>
  )
}

export default function Premium({ session, isPremium }) {
  const tr = useT()
  const [billing, setBilling]       = useState('monthly')
  const [openFaq, setOpenFaq]       = useState(null)
  const [waitlistEmail, setEmail]   = useState('')
  const [waitlistDone, setDone]     = useState(false)
  const [waitlistLoading, setLoading] = useState(false)
  const [waitlistError, setError]   = useState('')

  const price    = billing === 'monthly' ? 7.99 : 59
  const perMonth = billing === 'yearly'  ? (59 / 12).toFixed(2) : '7.99'

  // ── Feature comparison rows ───────────────────────────────────────────────
  // Values: true = included, false = not included, string = label
  const FEATURES = [
    { label: stripMark(tr.premium_free_0)  || 'Budget, loans & investments', free: true,    plus: true },
    { label: stripMark(tr.premium_free_3)  || '$100 Challenge + devotionals', free: true,    plus: true },
    { label: stripMark(tr.premium_free_5)  || 'Community & faith tools',      free: true,    plus: true },
    { label: stripMark(tr.premium_free_8)  || 'AI Financial Coach',           free: 'Basic', plus: tr.premium_why_2 ? 'Full' : 'Full' },
    { label: stripMark(tr.premium_free_6)  || 'PDF reports',                  free: 'Basic', plus: 'Unlimited' },
    { label: stripMark(tr.premium_free_12) || 'Excel export',                 free: false,   plus: true },
    { label: stripMark(tr.premium_free_9)  || 'Multi-currency (18+)',          free: false,   plus: true },
    { label: stripMark(tr.premium_free_10) || 'Live exchange rates',           free: false,   plus: true },
    { label: stripMark(tr.premium_free_13) || 'Receipt scanner',               free: false,   plus: true },
    { label: stripMark(tr.premium_free_15) || 'Priority support',              free: false,   plus: true },
  ]

  const WHY = [
    { icon: '🌍', title: 'Multi-Currency', desc: tr.premium_why_1 || '18+ currencies with live exchange rates — manage money globally.' },
    { icon: '📊', title: 'Deep Analytics', desc: tr.premium_why_2 || 'See exactly where every dollar goes with advanced spending insights.' },
    { icon: '📄', title: 'Unlimited Exports', desc: tr.premium_why_3 || 'Download PDF and Excel reports for taxes, planning, and sharing.' },
    { icon: '📸', title: 'Receipt Scanner', desc: tr.premium_why_4 || 'Snap receipts with your camera — logged instantly, never lost.' },
  ]

  const FAQS = [
    { q: tr.premium_faq_q1 || 'Is the free plan really free?',    a: tr.premium_faq_a1 || 'Yes! The free plan is free forever. No credit card required.' },
    { q: tr.premium_faq_q2 || 'Can I cancel anytime?',            a: tr.premium_faq_a2 || 'Yes. Cancel with one tap in Settings. No questions asked.' },
    { q: tr.premium_faq_q3 || 'What currencies are supported?',   a: tr.premium_faq_a3 || '18+ currencies including USD, EUR, GBP, NGN, KES, GHS, XOF, XAF, INR, BRL and more.' },
    { q: tr.premium_faq_q4 || 'Is my data safe?',                 a: tr.premium_faq_a4 || 'Yes. All data is encrypted and stored securely. We never sell your data.' },
  ]

  const TRUST = [
    { icon: '🔒', label: 'Secure payments' },
    { icon: '↩️',  label: 'Cancel anytime' },
    { icon: '🚫', label: 'No ads ever' },
    { icon: '🛡️', label: 'Privacy-first' },
    { icon: '📵', label: 'Data never sold' },
  ]

  async function joinWaitlist() {
    if (!waitlistEmail) { setError(tr.premium_waitlist_err_email || 'Please enter your email'); return }
    setLoading(true); setError('')
    const { error } = await supabase.from('waitlist').insert({ email: waitlistEmail, plan: 'premium' })
    if (error) {
      setError(error.code === '23505'
        ? (tr.premium_waitlist_err_dup || 'Already on the list!')
        : (tr.premium_waitlist_err_generic || 'Something went wrong. Try again.'))
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <div style={{ paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>

      {/* ── Already premium banner ─────────────────────────────────────── */}
      {isPremium && (
        <div style={{
          background: 'linear-gradient(135deg, #BA7517, #7A4D0F)',
          padding: '14px 20px', textAlign: 'center', color: 'white',
          marginBottom: 16, borderRadius: 16,
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>👑</div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{tr.premium_banner_title || 'You have Premium!'}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 3 }}>{tr.premium_banner_sub || 'All premium features are unlocked'}</div>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #1D9E75 0%, #0B5C40 100%)',
        padding: '40px 24px 52px',
        textAlign: 'center',
        marginBottom: -24,
        borderRadius: '0 0 28px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* subtle radial glow */}
        <div style={{ position:'absolute', top:-40, left:'50%', transform:'translateX(-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ fontSize: 36, marginBottom: 12, position: 'relative' }}>👑</div>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.5px', position: 'relative' }}>
          {tr.premium_header_title || 'Go Premium'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, margin: 0, lineHeight: 1.5, position: 'relative' }}>
          Unlock the full power of your financial journey
        </p>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── Billing toggle ──────────────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 36, marginBottom: 20 }}>
          <div style={{ display: 'flex', background: '#f0f2f0', borderRadius: 14, padding: 4 }}>
            {['monthly', 'yearly'].map(b => (
              <button key={b} type="button" onClick={() => setBilling(b)} style={{
                flex: 1, padding: '11px 8px', borderRadius: 11, border: 'none',
                background: billing === b ? 'white' : 'transparent',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                color: billing === b ? '#0F5E42' : '#706B65',
                boxShadow: billing === b ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.18s', position: 'relative',
              }}>
                {b === 'monthly' ? (tr.premium_billing_monthly || 'Monthly') : (tr.premium_billing_yearly || 'Yearly')}
                {b === 'yearly' && (
                  <span style={{
                    position: 'absolute', top: -9, right: 6,
                    background: '#0B5C40', color: 'white',
                    fontSize: 9, padding: '2px 6px', borderRadius: 6, fontWeight: 800, letterSpacing: '0.05em',
                  }}>
                    {tr.premium_save_pct || 'SAVE 38%'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Pricing card ────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(155deg, #1D9E75 0%, #0B5C40 100%)',
          borderRadius: 24, padding: '28px 24px 24px',
          marginBottom: 28, textAlign: 'center', color: 'white',
          boxShadow: '0 0 0 1px rgba(29,158,117,0.35), 0 12px 48px rgba(29,158,117,0.28), 0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* glow orb */}
          <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', pointerEvents:'none' }} />

          {billing === 'yearly' && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>
                {tr.premium_save_yearly || 'Save $36/year'}
              </span>
            </div>
          )}

          {/* Price hero */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 2, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, marginTop: 10, opacity: 0.8 }}>$</span>
            <span style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-3px', lineHeight: 1 }}>
              {billing === 'yearly' ? perMonth : '7.99'}
            </span>
            <span style={{ fontSize: 16, fontWeight: 500, marginTop: 14, opacity: 0.75 }}>/month</span>
          </div>
          {billing === 'yearly' && (
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>billed as $59/year</div>
          )}

          {/* Trial note */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.15)', borderRadius: 20,
            padding: '5px 14px', fontSize: 12, fontWeight: 600, marginBottom: 20, marginTop: 8,
          }}>
            <span>✦</span>
            <span>7 days free · Cancel anytime</span>
          </div>

          {/* CTA */}
          <button type="button"
            onClick={() => alert(isPremium ? (tr.premium_alert_has || "You're already on Premium!") : (tr.premium_alert_soon || 'Coming soon — join the waitlist below!'))}
            style={{
              width: '100%', padding: '16px', background: 'white',
              color: '#0B5C40', border: 'none', borderRadius: 14,
              fontSize: 17, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '-0.2px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Try Premium Free →
          </button>

          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
            {interpolate(tr.premium_then_price || 'Then ${price}/month · Cancel anytime', { price: billing === 'yearly' ? '59/yr' : '7.99', period: 'month' })}
          </div>
        </div>

        {/* ── Trust strip ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
          marginBottom: 28, scrollbarWidth: 'none',
        }}>
          {TRUST.map(t => (
            <div key={t.label} style={{
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              background: 'var(--green-light)', borderRadius: 20,
              padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--green-dark)',
            }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        {/* ── Feature comparison ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            What's included
          </h2>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 0, marginBottom: 4 }}>
            <div />
            <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>FREE</div>
            <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--green-dark)', letterSpacing: '0.06em' }}>PREMIUM 👑</div>
          </div>

          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                alignItems: 'center',
                padding: '13px 14px',
                background: i % 2 === 0 ? 'var(--white)' : 'var(--surface)',
                borderBottom: i < FEATURES.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, paddingRight: 8, lineHeight: 1.35 }}>{f.label}</div>

                {/* Free cell */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {f.free === true  ? <Check color="#9CA3AF" />
                  : f.free === false ? <Dash />
                  : <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textAlign: 'center' }}>{f.free}</span>}
                </div>

                {/* Premium cell */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {f.plus === true  ? <Check color="#1D9E75" />
                  : f.plus === false ? <Dash />
                  : <span style={{ fontSize: 11, color: 'var(--green-dark)', fontWeight: 700, textAlign: 'center' }}>{f.plus}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why upgrade — mini cards ─────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Why upgrade?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {WHY.map((w, i) => (
              <div key={i} style={{
                background: 'var(--white)', borderRadius: 16,
                padding: '18px 14px', border: '1px solid var(--border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{w.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 5, letterSpacing: '-0.1px' }}>{w.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Social proof ────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--green-light)', borderRadius: 20,
          padding: '20px 20px', marginBottom: 32,
          border: '1px solid rgba(29,158,117,0.15)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--green-dark)', marginBottom: 14 }}>
            Built for real people
          </div>
          {[
            '🌍  Used by early members across 20+ countries',
            '✝️  Designed for faith-based financial stewardship',
            '👨‍👩‍👧  For families, students, entrepreneurs & ministries',
          ].map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, marginBottom: i < 2 ? 10 : 0 }}>{line}</div>
          ))}
        </div>

        {/* ── FAQ accordions ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Common questions
          </h2>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '16px 16px',
                      background: 'var(--white)', border: 'none', cursor: 'pointer',
                      textAlign: 'left', gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, flex: 1 }}>
                      {faq.q}
                    </span>
                    <span style={{
                      fontSize: 18, color: 'var(--text-muted)', flexShrink: 0,
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block', lineHeight: 1,
                    }}>+</span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 16px 16px',
                      background: 'var(--surface)',
                      fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65,
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Notify me / waitlist ────────────────────────────────────────── */}
        <div style={{
          borderRadius: 20, padding: '24px 20px',
          marginBottom: 24,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          {waitlistDone ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>
                {tr.premium_waitlist_done_title || "You're on the list!"}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {tr.premium_waitlist_done_sub || "We'll notify you when Premium launches. You'll get 30 days free!"}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                Be first to know
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.55 }}>
                Premium is launching soon. Join the waitlist and get <strong>30 days free</strong> when it's ready.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinWaitlist()}
                  style={{
                    flex: 1, padding: '12px 14px', borderRadius: 12,
                    border: '1px solid var(--border-mid)', background: 'var(--surface)',
                    color: 'var(--text)', fontSize: 15, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  disabled={waitlistLoading}
                  onClick={joinWaitlist}
                  style={{
                    padding: '12px 18px', background: 'var(--green)',
                    color: 'white', border: 'none', borderRadius: 12,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    opacity: waitlistLoading ? 0.7 : 1,
                  }}>
                  {waitlistLoading ? '...' : 'Notify me'}
                </button>
              </div>
              {waitlistError && (
                <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{waitlistError}</div>
              )}
            </>
          )}
        </div>

        {/* ── Footer note ─────────────────────────────────────────────────── */}
        <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
          By subscribing you agree to our terms. Your data is encrypted and never sold.
          Cancel from Settings at any time, no questions asked.
        </p>

      </div>
    </div>
  )
}
