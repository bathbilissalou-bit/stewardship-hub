import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT, interpolate } from '../lib/i18n'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const tr = useT()

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://stewardship-hub-tau.vercel.app/reset-password'
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ textAlign:'center', maxWidth:380 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>📧</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'white', marginBottom:8 }}>{tr.forgot_sent_title || 'Check your email'}</h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', marginBottom:32, lineHeight:1.6 }}>
            {tr.forgot_sent_body
              ? interpolate(tr.forgot_sent_body, { email })
              : <>We sent a password reset link to <strong style={{color:'white'}}>{email}</strong>. Click the link to reset your password.</>}
          </p>
          <Link to="/login">
            <button style={{ padding:'14px 32px', background:'linear-gradient(135deg, #1D9E75, #0F6E56)', color:'white', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer' }}>
              {tr.forgot_back || 'Back to Sign In'}
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg, #1D9E75, #0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:28 }}>✦</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'white', margin:'0 0 4px' }}>{tr.forgot_title || 'Reset password'}</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>{tr.forgot_subtitle || "We'll send you a reset link"}</p>
        </div>
        {error && <div style={{ background:'rgba(163,45,45,0.2)', border:'1px solid rgba(163,45,45,0.3)', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:14, color:'#ff8a8a' }}>{error}</div>}
        <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:20, padding:'32px 28px', border:'1px solid rgba(255,255,255,0.1)' }}>
          <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, display:'block', marginBottom:6, letterSpacing:'0.05em' }}>{(tr.email || 'Email').toUpperCase()}</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:15, color:'white', outline:'none', boxSizing:'border-box' }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg, #1D9E75, #0F6E56)', color:'white', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer' }}>
              {loading ? (tr.forgot_sending || 'Sending…') : (tr.forgot_cta || 'Send reset link →')}
            </button>
          </form>
          <div style={{ textAlign:'center', marginTop:20, fontSize:14, color:'rgba(255,255,255,0.4)' }}>
            {tr.forgot_remember || 'Remember it?'}{' '}
            <Link to="/login" style={{ color:'#1D9E75', textDecoration:'none', fontWeight:600 }}>{tr.signIn || 'Sign in'}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
