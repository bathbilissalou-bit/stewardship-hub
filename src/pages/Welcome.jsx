import { Link } from 'react-router-dom'
import { useT, getLang } from '../lib/i18n'
import { getDailyVerse } from '../lib/verses'

export default function Welcome() {
  const tr = useT()
  const verse = getDailyVerse(getLang())

  const features = [
    { icon: '💳', title: tr.budgetTrackerTitle, desc: tr.budgetSubtitle },
    { icon: '📈', title: tr.investTitle, desc: tr.investSubtitle },
    { icon: '🏦', title: tr.loanTitle, desc: tr.loanSubtitle },
    { icon: '💰', title: tr.savingsGoalsTitle, desc: tr.savingsSubtitle },
    { icon: '🎁', title: tr.givingTithe, desc: tr.givingSubtitle },
    { icon: '🔔', title: tr.billReminders, desc: tr.billsSubtitle },
    { icon: '⭐', title: tr.challengeTitle, desc: tr.challengeSubtitle },
    { icon: '🤖', title: tr.aiCoachHeroTitle, desc: tr.featCoachDesc },
    { icon: '✦', title: tr.faithTitle, desc: tr.faithSubtitle },
    { icon: '👥', title: tr.communityTitle2, desc: tr.communitySubtitle },
    { icon: '🏠', title: tr.realEstateTitle, desc: tr.realEstateSubtitle },
    { icon: '📄', title: tr.welcome_pdf_title, desc: tr.welcome_pdf_desc },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 50%, #0a0a0a 100%)', padding: '60px 24px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✦</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-1px' }}>{tr.appName}</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 24px' }}>{tr.tagline}</p>
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>✦ {tr.todayVerse}</div>
          <div style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>{verse.text}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>— {verse.ref}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <button type="button" style={{ padding: '14px 32px', background: 'white', color: '#0F6E56', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>{tr.welcome_get_started}</button>
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button type="button" style={{ padding: '14px 32px', background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.4)', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>{tr.welcome_sign_in}</button>
          </Link>
        </div>
      </div>
      <div style={{ padding: '40px 24px 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{tr.welcome_everything_title}</h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>{tr.welcome_everything_sub}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32, padding: '20px', background: 'rgba(29,158,117,0.1)', borderRadius: 16, border: '1px solid rgba(29,158,117,0.2)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1D9E75', marginBottom: 8 }}>{tr.welcome_mission_title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>{tr.welcome_mission_body}</div>
        </div>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <button type="button" style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #1D9E75, #0F6E56)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 800, cursor: 'pointer' }}>{tr.welcome_join_cta}</button>
          </Link>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>{tr.welcome_footer}</p>
        </div>
      </div>
    </div>
  )
}
