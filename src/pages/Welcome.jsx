import { Link } from 'react-router-dom'
import { useT, getLang } from '../lib/i18n'
import { getDailyVerse } from '../lib/verses'

const G = '#1D9E75'
const GD = '#0F6E56'

export default function Welcome() {
  const tr = useT()
  const verse = getDailyVerse(getLang())

  const features = [
    { icon: '💳', title: tr.budgetTrackerTitle,  desc: tr.budgetSubtitle },
    { icon: '📈', title: tr.investTitle,          desc: tr.investSubtitle },
    { icon: '🏦', title: tr.loanTitle,            desc: tr.loanSubtitle },
    { icon: '💰', title: tr.savingsGoalsTitle,    desc: tr.savingsSubtitle },
    { icon: '🎁', title: tr.givingTithe,          desc: tr.givingSubtitle },
    { icon: '🔔', title: tr.billReminders,        desc: tr.billsSubtitle },
    { icon: '⭐', title: tr.challengeTitle,        desc: tr.challengeSubtitle },
    { icon: '🤖', title: tr.aiCoachHeroTitle,     desc: tr.featCoachDesc },
    { icon: '✦',  title: tr.faithTitle,           desc: tr.faithSubtitle },
    { icon: '👥', title: tr.communityTitle2,      desc: tr.communitySubtitle },
    { icon: '🏠', title: tr.realEstateTitle,      desc: tr.realEstateSubtitle },
    { icon: '📄', title: tr.welcome_pdf_title,    desc: tr.welcome_pdf_desc },
  ]

  const trust = [
    { icon: '🔒', label: 'Secure & Private' },
    { icon: '✦',  label: 'Faith-Based' },
    { icon: '🌍', label: '14 Languages' },
    { icon: '🎉', label: 'Free to Start' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F0D', color: 'white', overflowX: 'hidden' }}>

      {/* ── Top nav ────────────────────────────────────────────────────────── */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 18, color: G, lineHeight: 1 }}>✦</span>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>StewardHub</span>
        </div>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <button type="button" style={{ padding: '7px 18px', background: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {tr.welcome_sign_in || 'Sign In'}
          </button>
        </Link>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px 48px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(29,158,117,0.10) 0%, transparent 100%)' }}>

        {/* Eyebrow pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(29,158,117,0.14)', border: '1px solid rgba(29,158,117,0.28)', borderRadius: 20, padding: '5px 14px', fontSize: 11, color: G, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 22, textTransform: 'uppercase' }}>
          ✦ {tr.tagline || 'Faith-based financial freedom'}
        </div>

        <h1 style={{ fontSize: 'clamp(30px, 9vw, 44px)', fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1.1, margin: '0 0 16px' }}>
          {tr.welcome_hero_line1 || 'Master your money.'}<br />
          <span style={{ color: G }}>{tr.welcome_hero_line2 || 'Honor your values.'}</span>
        </h1>

        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.58)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
          {tr.welcome_hero_sub || 'Budget, invest, save, and give — all in one app built for families who believe money is a tool for good.'}
        </p>

        {/* Trust badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginBottom: 28 }}>
          {trust.map((b, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ fontSize: 12 }}>{b.icon}</span>{b.label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <button type="button" style={{ padding: '14px 30px', background: `linear-gradient(135deg, ${G}, ${GD})`, color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(29,158,117,0.38)', letterSpacing: '-0.1px' }}>
              {tr.welcome_get_started || 'Get Started — Free'}
            </button>
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button type="button" style={{ padding: '14px 22px', background: 'transparent', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {tr.welcome_sign_in || 'Sign In'}
            </button>
          </Link>
        </div>
      </section>

      {/* ── Daily verse ────────────────────────────────────────────────────── */}
      <div style={{ margin: '0 20px 36px', padding: '16px 18px', background: 'rgba(29,158,117,0.07)', border: '1px solid rgba(29,158,117,0.16)', borderRadius: 14 }}>
        <div style={{ fontSize: 10, color: G, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>✦ {tr.todayVerse || "Today's Verse"}</div>
        <div style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.75, color: 'rgba(255,255,255,0.80)' }}>{verse.text}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 6 }}>— {verse.ref}</div>
      </div>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: G, marginBottom: 8 }}>
            {tr.welcome_everything_sub || 'Everything you need'}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.25, color: 'white' }}>
            {tr.welcome_everything_title || 'All in one place'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 12px' }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 3, color: 'rgba(255,255,255,0.92)' }}>{f.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ────────────────────────────────────────────────────────── */}
      <div style={{ margin: '28px 20px', padding: '20px 18px', background: 'rgba(29,158,117,0.07)', border: '1px solid rgba(29,158,117,0.14)', borderRadius: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: G, marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {tr.ourMissionTitle || '📖 Our Mission'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.75 }}>
          {tr.welcome_mission_body}
        </div>
      </div>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 20px 52px' }}>
        <Link to="/signup" style={{ textDecoration: 'none', display: 'block' }}>
          <button type="button" style={{ width: '100%', padding: '17px', background: `linear-gradient(135deg, ${G}, ${GD})`, color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 24px rgba(29,158,117,0.38)', letterSpacing: '-0.1px' }}>
            {tr.welcome_join_cta || 'Start Your Journey →'}
          </button>
        </Link>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 12, textAlign: 'center', lineHeight: 1.6 }}>
          {tr.welcome_footer || 'Free to use · No credit card required'} · <span style={{ color: 'rgba(29,158,117,0.7)' }}>getstewardflow.com</span>
        </p>
      </div>

    </div>
  )
}
