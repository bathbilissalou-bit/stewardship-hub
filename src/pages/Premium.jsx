import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

// Strip leading ✅/❌ so we can render our own indicators
function stripMark(str) {
  return (str || '').replace(/^[✅❌]\s*/, '')
}

function GreenCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="9" fill="#1D9E75" fillOpacity="0.14"/>
      <path d="M5.5 9.5l2.5 2.5 5-5" stroke="#1D9E75" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GrayCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="9" fill="#9CA3AF" fillOpacity="0.12"/>
      <path d="M5.5 9.5l2.5 2.5 5-5" stroke="#9CA3AF" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Dash() {
  return (
    <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ width: 10, height: 2, background: '#D1D5DB', borderRadius: 1 }} />
    </div>
  )
}

// Smooth accordion using CSS grid trick — no need to know content height
function Accordion({ question, answer, isOpen, onToggle }) {
  return (
    <div className="prem-faq-item">
      <button type="button" onClick={onToggle} className="prem-faq-btn"
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '17px 18px',
          background: 'var(--white)', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: 12,
        }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.45, flex: 1 }}>
          {question}
        </span>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: isOpen ? 'var(--green-light)' : 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.2s',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>
            <path d="M2 4l4 4 4-4" stroke={isOpen ? 'var(--green-dark)' : 'var(--text-muted)'}
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {/* Grid trick: gridTemplateRows 0fr→1fr gives smooth height animation */}
      <div style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.28s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '0 18px 17px',
            fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
            background: 'var(--surface)',
          }}>
            {answer}
          </div>
        </div>
      </div>
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

  const isYearly   = billing === 'yearly'
  const perMonth   = isYearly ? (59 / 12).toFixed(2) : '7.99'
  const displayPrice = isYearly ? perMonth : '7.99'

  const FEATURES = [
    { label: stripMark(tr.premium_free_0)  || 'Budget, loans & investments', free: true,      plus: true },
    { label: stripMark(tr.premium_free_3)  || '$100 Challenge + devotionals', free: true,      plus: true },
    { label: stripMark(tr.premium_free_5)  || 'Community & faith tools',      free: true,      plus: true },
    { label: stripMark(tr.premium_free_8)  || 'AI Financial Coach',           free: 'Basic',   plus: 'Full' },
    { label: stripMark(tr.premium_free_6)  || 'PDF reports',                  free: 'Basic',   plus: 'Unlimited' },
    { label: stripMark(tr.premium_free_12) || 'Excel export',                 free: false,     plus: true },
    { label: stripMark(tr.premium_free_9)  || 'Multi-currency (18+)',          free: false,     plus: true },
    { label: stripMark(tr.premium_free_10) || 'Live exchange rates',           free: false,     plus: true },
    { label: stripMark(tr.premium_free_13) || 'Receipt scanner',               free: false,     plus: true },
    { label: stripMark(tr.premium_free_15) || 'Priority support',              free: false,     plus: true },
  ]

  const WHY = [
    { icon: '🌍', title: 'Multi-Currency',    desc: '18+ currencies with live rates — manage money anywhere on Earth.' },
    { icon: '📊', title: 'Deep Analytics',    desc: 'Understand exactly where every dollar goes with visual spending insights.' },
    { icon: '📄', title: 'Unlimited Exports', desc: 'Download PDF & Excel reports for taxes, planning, and sharing.' },
    { icon: '📸', title: 'Receipt Scanner',   desc: 'Photograph receipts — they\'re logged instantly and never lost.' },
  ]

  const FAQS = [
    { q: tr.premium_faq_q1 || 'Is the free plan really free?',   a: tr.premium_faq_a1 || 'Yes. The free plan is free forever with no credit card required. You only upgrade if you want more.' },
    { q: tr.premium_faq_q2 || 'Can I cancel anytime?',           a: tr.premium_faq_a2 || 'Absolutely. Cancel with one tap in Settings. No questions, no penalties, no fine print.' },
    { q: tr.premium_faq_q3 || 'What currencies are supported?',  a: tr.premium_faq_a3 || '18+ currencies: USD, EUR, GBP, NGN, KES, GHS, XOF, XAF, CAD, AUD, INR, BRL, MXN and more — with live exchange rates.' },
    { q: tr.premium_faq_q4 || 'Is my data safe?',                a: tr.premium_faq_a4 || 'All data is encrypted in transit and at rest. We never sell your data, never show you ads, and you can export or delete everything at any time.' },
  ]

  const TRUST = [
    { icon: '🔒', label: 'Secure payments' },
    { icon: '↩️',  label: 'Cancel anytime'  },
    { icon: '🚫', label: 'No ads ever'      },
    { icon: '🛡️', label: 'Privacy-first'   },
    { icon: '📵', label: 'Data never sold'  },
  ]

  async function joinWaitlist() {
    if (!waitlistEmail) { setError('Please enter your email'); return }
    setLoading(true); setError('')
    const { error } = await supabase.from('waitlist').insert({ email: waitlistEmail, plan: 'premium' })
    if (error) {
      setError(error.code === '23505' ? 'You\'re already on the list!' : 'Something went wrong. Please try again.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <>
      {/* ── Component-scoped styles ─────────────────────────────────────── */}
      <style>{`
        @keyframes premFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prem-in { animation: premFadeUp 0.45s ease both; }
        .prem-in-1 { animation-delay: 0.04s; }
        .prem-in-2 { animation-delay: 0.09s; }
        .prem-in-3 { animation-delay: 0.14s; }
        .prem-in-4 { animation-delay: 0.19s; }
        .prem-in-5 { animation-delay: 0.24s; }

        .prem-cta-btn:active { transform: scale(0.97) !important; }

        .prem-why-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .prem-why-card:hover { box-shadow: 0 6px 24px rgba(29,158,117,0.14) !important; transform: translateY(-2px); }

        .prem-faq-btn:hover { background: var(--surface) !important; }

        .prem-faq-item:not(:last-child) { border-bottom: 1px solid var(--border); }

        .prem-trust::-webkit-scrollbar { display: none; }

        .prem-feature-row:hover { background: var(--surface) !important; }

        .prem-billing-btn { transition: background 0.18s, color 0.18s, box-shadow 0.18s; }

        @media (prefers-reduced-motion: reduce) {
          .prem-in, .prem-why-card, .prem-cta-btn { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div style={{ paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>

        {/* ── Already premium ───────────────────────────────────────────── */}
        {isPremium && (
          <div style={{
            background: 'linear-gradient(135deg, #C28A35, #7A4D0F)',
            padding: '16px 20px', textAlign: 'center', color: 'white',
            marginBottom: 16, borderRadius: 18,
            boxShadow: '0 4px 20px rgba(194,138,53,0.3)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>👑</div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.2px' }}>
              {tr.premium_banner_title || 'You have Premium Access!'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.82, marginTop: 4 }}>
              {tr.premium_banner_sub || 'All premium features are unlocked'}
            </div>
          </div>
        )}

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(165deg, #1FAA7E 0%, #0C6044 100%)',
          padding: '44px 24px 56px',
          textAlign: 'center',
          marginBottom: -28,
          borderRadius: '0 0 32px 32px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255,255,255,0.09) 0%, transparent 100%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-30, left:'50%', transform:'translateX(-50%)', width:'140%', height:60, background:'rgba(0,0,0,0.08)', borderRadius:'50%', filter:'blur(20px)', pointerEvents:'none' }} />

          <div style={{ fontSize: 38, marginBottom: 14, position: 'relative',
            animation: 'premFadeUp 0.5s ease both',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
          }}>👑</div>

          <h1 style={{
            color: 'white', fontSize: 30, fontWeight: 900, margin: '0 0 10px',
            letterSpacing: '-0.8px', lineHeight: 1.1, position: 'relative',
          }}>
            {tr.premium_header_title || 'StewardHub Premium'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, margin: 0, lineHeight: 1.55, position: 'relative', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
            Everything you need to steward your finances with wisdom and clarity.
          </p>
        </div>

        <div style={{ padding: '0 16px' }}>

          {/* ── Billing toggle ──────────────────────────────────────────── */}
          <div className="prem-in" style={{ position: 'relative', zIndex: 1, marginTop: 40, marginBottom: 16 }}>
            <div style={{ display: 'flex', background: 'var(--gray-light)', borderRadius: 14, padding: 4, gap: 4 }}>
              {['monthly', 'yearly'].map(b => (
                <button key={b} type="button" className="prem-billing-btn"
                  onClick={() => setBilling(b)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 11, border: 'none',
                    background: billing === b ? 'white' : 'transparent',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    color: billing === b ? '#0C5035' : 'var(--text-muted)',
                    boxShadow: billing === b ? '0 1px 8px rgba(0,0,0,0.1)' : 'none',
                    position: 'relative',
                  }}>
                  {b === 'monthly' ? (tr.premium_billing_monthly || 'Monthly') : (tr.premium_billing_yearly || 'Yearly')}
                  {b === 'yearly' && (
                    <span style={{
                      position: 'absolute', top: -10, right: 4,
                      background: '#0C5035', color: 'white',
                      fontSize: 9, padding: '2px 7px', borderRadius: 6,
                      fontWeight: 800, letterSpacing: '0.04em',
                    }}>
                      {tr.premium_save_pct || 'SAVE 38%'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Pricing card ─────────────────────────────────────────────── */}
          <div className="prem-in prem-in-1" style={{
            background: 'linear-gradient(155deg, #1FAA7E 0%, #0A5538 100%)',
            borderRadius: 26, padding: '30px 24px 26px',
            marginBottom: 20, textAlign: 'center', color: 'white',
            boxShadow: '0 0 0 1px rgba(29,158,117,0.4), 0 16px 56px rgba(29,158,117,0.32), 0 4px 12px rgba(0,0,0,0.12)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Top-edge inner highlight */}
            <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'rgba(255,255,255,0.25)', borderRadius:1, pointerEvents:'none' }} />
            {/* Radial glow top-right */}
            <div style={{ position:'absolute', top:-80, right:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%)', pointerEvents:'none' }} />

            {isYearly && (
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.18)', borderRadius: 20,
                  padding: '5px 16px', fontSize: 13, fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                }}>
                  {tr.premium_save_yearly || 'Save $36/year'} 🎉
                </span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 1, marginBottom: 2 }}>
              <span style={{ fontSize: 24, fontWeight: 800, marginTop: 10, opacity: 0.85, letterSpacing: '-0.5px' }}>$</span>
              <span style={{ fontSize: 68, fontWeight: 900, letterSpacing: '-4px', lineHeight: 1 }}>
                {displayPrice}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', paddingBottom: 6, gap: 0, marginLeft: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600, opacity: 0.75, lineHeight: 1.2 }}>/month</span>
              </div>
            </div>

            {isYearly && (
              <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>billed as $59/year</div>
            )}

            {/* Free trial pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.16)', borderRadius: 20,
              padding: '6px 16px', fontSize: 12, fontWeight: 700,
              marginTop: 10, marginBottom: 22,
              letterSpacing: '0.01em',
            }}>
              <span style={{ fontSize: 10 }}>✦</span>
              <span>7 days free  ·  Cancel anytime</span>
            </div>

            {/* CTA button */}
            <button type="button" className="prem-cta-btn"
              onClick={() => alert(isPremium
                ? (tr.premium_alert_has   || "You already have Premium — enjoy all features!")
                : (tr.premium_alert_soon  || "Coming soon! Join the waitlist below for 30 days free."))}
              style={{
                width: '100%', padding: '17px', background: 'white',
                color: '#084D32', border: 'none', borderRadius: 16,
                fontSize: 17, fontWeight: 800, cursor: 'pointer',
                letterSpacing: '-0.3px', lineHeight: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                transition: 'transform 0.12s ease',
              }}>
              Try Premium Free →
            </button>

            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 12, lineHeight: 1.5 }}>
              Then ${isYearly ? '59/year' : '7.99/month'} · Cancel anytime
            </div>
          </div>

          {/* ── Trust strip ────────────────────────────────────────────── */}
          <div className="prem-in prem-in-2 prem-trust" style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            paddingBottom: 2, marginBottom: 32,
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          }}>
            {TRUST.map(t => (
              <div key={t.label} style={{
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                background: 'var(--green-light)', borderRadius: 20,
                padding: '7px 13px', fontSize: 12, fontWeight: 600,
                color: 'var(--green-dark)', border: '1px solid rgba(29,158,117,0.12)',
              }}>
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>

          {/* ── Feature comparison ──────────────────────────────────────── */}
          <div className="prem-in prem-in-2" style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 16, color: 'var(--text)', letterSpacing: '-0.4px' }}>
              What's included
            </h2>

            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 88px' }}>
                <div style={{ padding: '12px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} />
                <div style={{
                  padding: '12px 8px', background: 'var(--surface)',
                  textAlign: 'center', fontSize: 11, fontWeight: 700,
                  color: 'var(--text-muted)', letterSpacing: '0.06em',
                  borderBottom: '1px solid var(--border)',
                }}>
                  FREE
                </div>
                <div style={{
                  padding: '12px 8px',
                  background: 'rgba(29,158,117,0.08)',
                  textAlign: 'center', fontSize: 11, fontWeight: 800,
                  color: 'var(--green-dark)', letterSpacing: '0.06em',
                  borderBottom: '2px solid var(--green)',
                  borderLeft: '1px solid rgba(29,158,117,0.15)',
                }}>
                  PREMIUM 👑
                </div>
              </div>

              {FEATURES.map((f, i) => (
                <div key={i} className="prem-feature-row" style={{
                  display: 'grid', gridTemplateColumns: '1fr 72px 88px',
                  alignItems: 'center',
                  background: i % 2 === 0 ? 'var(--white)' : 'var(--surface)',
                  borderBottom: i < FEATURES.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.12s',
                }}>
                  <div style={{
                    padding: '14px 14px', fontSize: 13, color: 'var(--text)',
                    fontWeight: 500, lineHeight: 1.4,
                  }}>{f.label}</div>

                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px 0' }}>
                    {f.free === true    ? <GrayCheck />
                    : f.free === false  ? <Dash />
                    : <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textAlign: 'center' }}>{f.free}</span>}
                  </div>

                  <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '14px 0',
                    background: 'rgba(29,158,117,0.05)',
                    borderLeft: '1px solid rgba(29,158,117,0.1)',
                  }}>
                    {f.plus === true    ? <GreenCheck />
                    : f.plus === false  ? <Dash />
                    : <span style={{ fontSize: 11, color: 'var(--green-dark)', fontWeight: 800, textAlign: 'center' }}>{f.plus}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Why upgrade — mini cards ──────────────────────────────── */}
          <div className="prem-in prem-in-3" style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 16, color: 'var(--text)', letterSpacing: '-0.4px' }}>
              Why upgrade?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {WHY.map((w, i) => (
                <div key={i} className="prem-why-card" style={{
                  background: 'var(--white)', borderRadius: 18,
                  padding: '20px 16px', border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  borderTop: '3px solid var(--green-light)',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 10, lineHeight: 1 }}>{w.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.2px', lineHeight: 1.2 }}>{w.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{w.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Social proof ──────────────────────────────────────────── */}
          <div className="prem-in prem-in-3" style={{
            background: 'linear-gradient(135deg, rgba(29,158,117,0.06) 0%, rgba(29,158,117,0.02) 100%)',
            borderRadius: 20, padding: '22px 20px', marginBottom: 36,
            border: '1px solid rgba(29,158,117,0.14)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--green-dark)', marginBottom: 16, letterSpacing: '-0.2px' }}>
              Built for real people
            </div>
            {[
              { icon: '🌍', text: 'Trusted by early users across 20+ countries' },
              { icon: '✝️',  text: 'Designed for faith-based financial stewardship' },
              { icon: '👨‍👩‍👧', text: 'For families, students, entrepreneurs & ministries' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                marginBottom: i < 2 ? 12 : 0,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* ── FAQ ───────────────────────────────────────────────────── */}
          <div className="prem-in prem-in-4" style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 16, color: 'var(--text)', letterSpacing: '-0.4px' }}>
              Common questions
            </h2>
            <div style={{
              borderRadius: 18, overflow: 'hidden',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              {FAQS.map((faq, i) => (
                <Accordion
                  key={i}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* ── Notify me ─────────────────────────────────────────────── */}
          <div className="prem-in prem-in-5" style={{
            borderRadius: 22, padding: '26px 22px', marginBottom: 28,
            background: 'var(--white)', border: '1px solid var(--border)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          }}>
            {waitlistDone ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.3px' }}>
                  {tr.premium_waitlist_done_title || "You're on the list!"}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                  {tr.premium_waitlist_done_sub || "We'll notify you when Premium launches. You'll get 30 days free!"}
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.3px' }}>
                  Be first to know
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.6 }}>
                  Premium is launching soon. Join now and get{' '}
                  <strong style={{ color: 'var(--green-dark)' }}>30 days free</strong>{' '}
                  when it's ready.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && joinWaitlist()}
                    style={{
                      flex: 1, padding: '13px 15px', borderRadius: 13,
                      border: '1.5px solid var(--border-mid)',
                      background: 'var(--surface)', color: 'var(--text)',
                      fontSize: 15, outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--green)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
                  />
                  <button type="button" disabled={waitlistLoading} onClick={joinWaitlist}
                    style={{
                      padding: '13px 18px', background: 'var(--green)', color: 'white',
                      border: 'none', borderRadius: 13, fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      opacity: waitlistLoading ? 0.65 : 1, transition: 'opacity 0.15s',
                    }}>
                    {waitlistLoading ? '…' : 'Notify me'}
                  </button>
                </div>
                {waitlistError && (
                  <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 9, lineHeight: 1.4 }}>
                    {waitlistError}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <p style={{
            fontSize: 11, color: 'var(--text-faint)', textAlign: 'center',
            lineHeight: 1.65, margin: '0 0 8px',
          }}>
            By subscribing you agree to our terms of service.
            Your data is encrypted and never sold.
            Cancel anytime from Settings — no questions asked.
          </p>

        </div>
      </div>
    </>
  )
}
