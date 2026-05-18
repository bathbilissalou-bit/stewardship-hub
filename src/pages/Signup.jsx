import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const tr = useT()

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) {
      setError(error.message)
    } else {
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .upsert({ id: data.user.id, email, full_name: fullName, currency: 'USD', onboarding_done: false }, { onConflict: 'id' })
        if (insertError) {
          setError(tr.signup_err_profile || 'Account created but profile setup failed. Please try signing in.')
          setLoading(false)
          return
        }
      }
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ textAlign:'center', maxWidth:380 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'white', marginBottom:8 }}>{tr.signup_success_title || "You're in!"}</h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', marginBottom:32, lineHeight:1.6 }}>{tr.signup_success_body || 'Check your email for a confirmation link, then come back and sign in to start your stewardship journey.'}</p>
          <Link to="/login">
            <button style={{ padding:'14px 32px', background:'linear-gradient(135deg, #1D9E75, #0F6E56)', color:'white', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer' }}>
              {tr.signup_success_cta || 'Go to Sign In →'}
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative', overflow:'hidden' }}>

      <div style={{ position:'absolute', top:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg, #1D9E75, #0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:28 }}>✦</div>
        <h1 style={{ fontSize:26, fontWeight:800, color:'white', margin:'0 0 4px' }}>{tr.signup_title || 'Create your account'}</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>{tr.signup_tagline || 'Start your stewardship journey today'}</p>
      </div>

      {/* Benefits */}
      <div style={{ width:'100%', maxWidth:420, marginBottom:24 }}>
        {[
          tr.signup_benefit1 || 'Track income, expenses & investments',
          tr.signup_benefit2 || 'Follow the 30-day $100 Challenge',
          tr.signup_benefit3 || 'Join a faith-based community',
        ].map((b, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(29,158,117,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#1D9E75', flexShrink:0 }}>✓</div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{b}</span>
          </div>
        ))}
      </div>

      {/* Signup card */}
      <div style={{ width:'100%', maxWidth:420, background:'rgba(255,255,255,0.05)', borderRadius:20, padding:'32px 28px', border:'1px solid rgba(255,255,255,0.1)' }}>
        {error && (
          <div style={{ background:'rgba(163,45,45,0.2)', border:'1px solid rgba(163,45,45,0.3)', borderRadius:10, padding:'12px 16px', marginBottom:16, fontSize:14, color:'#ff8a8a' }}>{error}</div>
        )}

        <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, display:'block', marginBottom:6, letterSpacing:'0.05em' }}>{(tr.fullName || 'Full name').toUpperCase()}</label>
            <input type="text" placeholder="Sarah Johnson" value={fullName} onChange={e => setFullName(e.target.value)} required
              style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:16, color:'white', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, display:'block', marginBottom:6, letterSpacing:'0.05em' }}>{(tr.email || 'Email').toUpperCase()}</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:16, color:'white', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontWeight:500, display:'block', marginBottom:6, letterSpacing:'0.05em' }}>{(tr.password || 'Password').toUpperCase()}</label>
            <input type="password" placeholder={tr.signup_ph_pw || 'At least 6 characters'} value={password} onChange={e => setPassword(e.target.value)} minLength={6} required
              style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:16, color:'white', outline:'none', boxSizing:'border-box' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'15px', background: loading ? '#0F6E56' : 'linear-gradient(135deg, #1D9E75, #0F6E56)', color:'white', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor: loading ? 'not-allowed':'pointer', marginTop:4 }}>
            {loading ? (tr.signup_creating || '✦ Creating account…') : (tr.createAccount || 'Create free account →')}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:20, fontSize:14, color:'rgba(255,255,255,0.4)' }}>
          {tr.alreadyHave || 'Already have an account?'}{' '}
          <Link to="/login" style={{ color:'#1D9E75', textDecoration:'none', fontWeight:600 }}>{tr.signIn || 'Sign in'}</Link>
        </div>
      </div>

      <p style={{ marginTop:24, fontSize:11, color:'rgba(255,255,255,0.2)', textAlign:'center' }}>{tr.signup_free_note || 'Free forever · No credit card required'}</p>
    </div>
  )
}
