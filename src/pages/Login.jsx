import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT, getLang } from '../lib/i18n'
import { getDailyVerse } from '../lib/verses'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const tr = useT()
  const verse = getDailyVerse(getLang())

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-150, left:-100, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(29,158,117,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ position:'absolute', top:20, right:20 }}>
        <LanguageSwitcher />
      </div>

      <div style={{ width:'100%', maxWidth:420, marginBottom:28, padding:'12px 16px', background:'rgba(29,158,117,0.1)', borderRadius:12, border:'1px solid rgba(29,158,117,0.2)', textAlign:'center' }}>
        <div style={{ fontSize:11, color:'#1D9E75', fontWeight:600, letterSpacing:'0.1em', marginBottom:4 }}>✦ {tr.todayVerse}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.6, fontStyle:'italic' }}>{verse.text} — {verse.ref}</div>
      </div>

      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg, #1D9E75, #0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:36 }}>✦</div>
        <h1 style={{ fontSize:32, fontWeight:800, color:'white', margin:'0 0 6px', letterSpacing:'-0.5px' }}>{tr.appName}</h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', margin:0 }}>{tr.tagline}</p>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:28, width:'100%', maxWidth:420 }}>
        {[`💰 ${tr.budget}`, `📈 ${tr.invest}`, `🏠 ${tr.homes}`, `👥 ${tr.community}`, `✦ ${tr.faith}`].map(f => (
          <span key={f} style={{ fontSize:12, padding:'6px 14px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)' }}>{f}</span>
        ))}
      </div>

      <div style={{ width:'100%', maxWidth:420, background:'rgba(255,255,255,0.05)', borderRadius:20, padding:'32px 28px', border:'1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:'white', margin:'0 0 24px', textAlign:'center' }}>{tr.welcomeBack}</h2>
        {error && <div style={{ background:'rgba(163,45,45,0.2)', border:'1px solid rgba(163,45,45,0.3)', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:14, color:'#ff8a8a' }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, display:'block', marginBottom:6, letterSpacing:'0.05em' }}>{(tr.email || 'Email').toUpperCase()}</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:16, color:'white', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, display:'block', marginBottom:6, letterSpacing:'0.05em' }}>{(tr.password || 'Password').toUpperCase()}</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:16, color:'white', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ textAlign:'right', marginTop:-8 }}>
            <Link to="/forgot-password" style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>{tr.forgotPassword||'Forgot password?'}</Link>
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'15px', background: loading ? '#0F6E56' : 'linear-gradient(135deg, #1D9E75, #0F6E56)', color:'white', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor: loading ? 'not-allowed':'pointer', letterSpacing:'0.02em' }}>
            {loading ? tr.signingIn : tr.signIn}
          </button>
        </form>
        <div style={{ textAlign:'center', marginTop:20, fontSize:14, color:'rgba(255,255,255,0.4)' }}>
          {tr.noAccount}{' '}<Link to="/signup" style={{ color:'#1D9E75', textDecoration:'none', fontWeight:600 }}>{tr.signUpFree}</Link>
        </div>
      </div>
      <div style={{ marginTop:24, textAlign:'center' }}>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', margin:0 }}>{tr.builtFor||'Built for faith communities'} · {tr.freeForever||'Free forever'}</p>
      </div>
    </div>
  )
}
