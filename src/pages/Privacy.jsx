import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'

export default function Privacy() {
  const tr = useT()
  const sections = [
    { title: tr.privacy_s1_title, content: tr.privacy_s1_body },
    { title: tr.privacy_s2_title, content: tr.privacy_s2_body },
    { title: tr.privacy_s3_title, content: tr.privacy_s3_body },
    { title: tr.privacy_s4_title, content: tr.privacy_s4_body },
    { title: tr.privacy_s5_title, content: tr.privacy_s5_body },
    { title: tr.privacy_s6_title, content: tr.privacy_s6_body },
    { title: tr.privacy_s7_title, content: tr.privacy_s7_body },
    { title: tr.privacy_s8_title, content: tr.privacy_s8_body },
  ]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 80px', color: 'var(--text)' }}>
      <Link to="/login" style={{ fontSize: 13, color: 'var(--green)', textDecoration: 'none', display: 'block', marginBottom: 20 }}>{tr.privacy_back}</Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{tr.privacy_title}</h1>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>{tr.privacy_updated}</p>
      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#0F6E56' }}>{section.title}</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)', margin: 0 }}>{section.content}</p>
        </div>
      ))}
      <div style={{ padding: '16px', background: '#E1F5EE', borderRadius: 10, marginTop: 24 }}>
        <div style={{ fontSize: 13, color: '#0F6E56', fontStyle: 'italic', lineHeight: 1.6 }}>
          {tr.privacy_quote}
        </div>
      </div>
    </div>
  )
}
