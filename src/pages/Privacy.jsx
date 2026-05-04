import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'24px 20px 80px', color:'var(--text)' }}>
      <Link to="/login" style={{ fontSize:13, color:'var(--green)', textDecoration:'none', display:'block', marginBottom:20 }}>← Back</Link>
      <h1 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>Privacy Policy</h1>
      <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:24 }}>Last updated: April 2026</p>
      {[
        { title:'1. Information We Collect', content:'We collect information you provide when creating an account (name, email) and information you enter into the app (budget entries, loans, investments, savings goals, giving records). We do not collect payment information.' },
        { title:'2. How We Use Your Information', content:'Your financial data is used solely to provide the Stewardship Hub service to you. We do not sell, share, or rent your personal information to third parties.' },
        { title:'3. Data Storage', content:'Your data is stored securely using Supabase. All data is encrypted in transit and at rest. We use Row Level Security to ensure you can only access your own data.' },
        { title:'4. Community Features', content:'Posts you share in the Community section are visible to other users. You can delete your posts at any time.' },
        { title:'5. Data Deletion', content:'You can delete your account and all associated data at any time from Settings → Account → Delete Account.' },
        { title:'6. Cookies', content:'We use localStorage to remember your language preference. We do not use advertising or tracking cookies.' },
        { title:'7. Third-Party Services', content:'We use Supabase for database and Vercel for hosting. We do not use any advertising networks.' },
        { title:'8. Contact', content:'If you have questions about this privacy policy, please contact us through the Community section.' },
      ].map((section, i) => (
        <div key={i} style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:700, marginBottom:8, color:'#0F6E56' }}>{section.title}</h2>
          <p style={{ fontSize:14, lineHeight:1.7, color:'var(--text-muted)', margin:0 }}>{section.content}</p>
        </div>
      ))}
      <div style={{ padding:'16px', background:'#E1F5EE', borderRadius:10, marginTop:24 }}>
        <div style={{ fontSize:13, color:'#0F6E56', fontStyle:'italic', lineHeight:1.6 }}>
          "The plans of the diligent lead to profit." — Proverbs 21:5
        </div>
      </div>
    </div>
  )
}
