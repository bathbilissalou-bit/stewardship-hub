import { Link } from 'react-router-dom'
import { getLang } from '../lib/i18n'
import { getDailyVerse } from '../lib/verses'

export default function Welcome() {
  const verse = getDailyVerse(getLang())
  const features = [
    { icon:'💳', title:'Budget Tracker', desc:'Track every dollar' },
    { icon:'📈', title:'Investments', desc:'Grow your wealth' },
    { icon:'🏦', title:'Loan Tracker', desc:'Get debt-free faster' },
    { icon:'💰', title:'Savings Goals', desc:'Save with purpose' },
    { icon:'🎁', title:'Giving & Tithe', desc:'Track generosity' },
    { icon:'🔔', title:'Bill Reminders', desc:'Never miss payments' },
    { icon:'⭐', title:'$100 Challenge', desc:'30-day program' },
    { icon:'🤖', title:'AI Coach', desc:'Personal guidance' },
    { icon:'✦', title:'Faith & Wisdom', desc:'Biblical principles' },
    { icon:'👥', title:'Community', desc:'Grow together' },
    { icon:'🏠', title:'Real Estate', desc:'Path to homeownership' },
    { icon:'📄', title:'PDF Reports', desc:'Print your budget' },
  ]
  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', color:'white', paddingBottom:40 }}>
      <div style={{ background:'linear-gradient(135deg, #0F6E56 0%, #1D9E75 50%, #0a0a0a 100%)', padding:'60px 24px 80px', textAlign:'center' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✦</div>
        <h1 style={{ fontSize:36, fontWeight:900, margin:'0 0 8px', letterSpacing:'-1px' }}>Stewardship Hub</h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.7)', margin:'0 0 24px' }}>Faith-based financial freedom</p>
        <div style={{ padding:'14px 16px', background:'rgba(255,255,255,0.1)', borderRadius:12, marginBottom:32 }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginBottom:4 }}>✦ TODAY'S VERSE</div>
          <div style={{ fontSize:13, fontStyle:'italic', lineHeight:1.6 }}>{verse.text}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:4 }}>— {verse.ref}</div>
        </div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/signup" style={{ textDecoration:'none' }}>
            <button style={{ padding:'14px 32px', background:'white', color:'#0F6E56', border:'none', borderRadius:12, fontSize:16, fontWeight:800, cursor:'pointer' }}>Get started free →</button>
          </Link>
          <Link to="/login" style={{ textDecoration:'none' }}>
            <button style={{ padding:'14px 32px', background:'transparent', color:'white', border:'2px solid rgba(255,255,255,0.4)', borderRadius:12, fontSize:16, fontWeight:600, cursor:'pointer' }}>Sign in</button>
          </Link>
        </div>
      </div>
      <div style={{ padding:'40px 24px 0' }}>
        <h2 style={{ textAlign:'center', fontSize:22, fontWeight:700, marginBottom:8 }}>Everything you need</h2>
        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:24 }}>12 powerful tools · Free · 15 languages</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {features.map((f,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:14, border:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{f.icon}</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{f.title}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:32, padding:'20px', background:'rgba(29,158,117,0.1)', borderRadius:16, border:'1px solid rgba(29,158,117,0.2)' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#1D9E75', marginBottom:8 }}>✦ Our Mission</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.7 }}>Stewardship Hub equips faith communities with practical tools to manage money with wisdom, generosity, and purpose.</div>
        </div>
        <div style={{ marginTop:24, textAlign:'center' }}>
          <Link to="/signup" style={{ textDecoration:'none' }}>
            <button style={{ width:'100%', padding:'16px', background:'linear-gradient(135deg, #1D9E75, #0F6E56)', color:'white', border:'none', borderRadius:14, fontSize:17, fontWeight:800, cursor:'pointer' }}>Join free today →</button>
          </Link>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:12 }}>No credit card · No ads · Free forever</p>
        </div>
      </div>
    </div>
  )
}
