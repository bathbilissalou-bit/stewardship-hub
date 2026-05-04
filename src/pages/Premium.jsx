import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'

const FEATURES_FREE = [
  '✅ Budget Tracker',
  '✅ Loan Tracker',
  '✅ Investment Tracker',
  '✅ $100 Challenge',
  '✅ Faith Devotionals',
  '✅ Community',
  '✅ Basic PDF Report',
  '✅ 1 Currency',
  '✅ AI Financial Coach (basic)',
  '❌ Multi-currency tracking',
  '❌ Live exchange rates',
  '❌ Unlimited PDF exports',
  '❌ Excel export',
  '❌ Receipt scanner',
  '❌ Advanced analytics',
  '❌ Priority support',
]

const FEATURES_PREMIUM = [
  '✅ Everything in Free',
  '✅ Multi-currency tracking',
  '✅ Live exchange rates',
  '✅ Unlimited PDF exports',
  '✅ Excel export',
  '✅ Receipt scanner',
  '✅ Advanced analytics',
  '✅ Savings goals (unlimited)',
  '✅ Bill reminders (unlimited)',
  '✅ Priority support',
  '✅ Early access to new features',
]

export default function Premium({ session, isPremium }) {
  const [billing, setBilling] = useState('monthly')
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistName, setWaitlistName] = useState('')
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [waitlistError, setWaitlistError] = useState('')
  const price = billing === 'monthly' ? 7.99 : 59
  const savings = billing === 'yearly' ? 'Save $36/year' : null

  return (
    <div style={{ paddingBottom:100 }}>
      {/* Premium active banner */}
      {isPremium && (
        <div style={{ background:'linear-gradient(135deg, #BA7517, #7A4D0F)', padding:'14px 20px', textAlign:'center', color:'white', marginBottom:16, borderRadius:14 }}>
          <div style={{ fontSize:20, marginBottom:4 }}>👑</div>
          <div style={{ fontWeight:800, fontSize:16 }}>You have Premium Access!</div>
          <div style={{ fontSize:12, opacity:0.85, marginTop:4 }}>Enjoy all premium features unlocked</div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #1D9E75, #0F6E56)', padding:'32px 20px 40px', textAlign:'center', marginBottom:-16, borderRadius:'0 0 24px 24px' }}>
        <div style={{ fontSize:40, marginBottom:8 }}>👑</div>
        <h1 style={{ color:'white', fontSize:26, fontWeight:900, margin:'0 0 8px' }}>Go Premium</h1>
        <p style={{ color:'rgba(255,255,255,0.8)', fontSize:14, margin:0 }}>Unlock the full power of Stewardship Hub</p>
      </div>

      <div style={{ padding:'24px 16px 0' }}>
        {/* Billing toggle */}
        <div style={{ display:'flex', background:'#f3f4f6', borderRadius:12, padding:4, marginBottom:20 }}>
          {['monthly','yearly'].map(b => (
            <button key={b} onClick={() => setBilling(b)}
              style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:billing===b?'white':'transparent', fontWeight:600, fontSize:14, cursor:'pointer', color:billing===b?'var(--green-dark)':'var(--text-muted)', boxShadow:billing===b?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.2s', position:'relative' }}>
              {b==='monthly'?'Monthly':'Yearly'}
              {b==='yearly' && <span style={{ position:'absolute', top:-8, right:4, background:'#A32D2D', color:'white', fontSize:9, padding:'2px 5px', borderRadius:6, fontWeight:700 }}>SAVE 38%</span>}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div style={{ background:'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius:20, padding:'24px 20px', marginBottom:16, textAlign:'center', color:'white' }}>
          <div style={{ fontSize:48, fontWeight:900, letterSpacing:'-2px' }}>
            ${price}
            <span style={{ fontSize:16, fontWeight:400, opacity:0.8 }}>/{billing==='monthly'?'mo':'yr'}</span>
          </div>
          {savings && <div style={{ fontSize:13, background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'4px 12px', display:'inline-block', marginTop:4 }}>{savings}</div>}
          <div style={{ fontSize:12, opacity:0.7, marginTop:8 }}>Cancel anytime · No credit card to try</div>
          
          {/* CTA */}
          <button style={{ width:'100%', padding:'14px', background:'white', color:'#0F6E56', border:'none', borderRadius:12, fontSize:16, fontWeight:800, cursor:'pointer', marginTop:16 }}
            onClick={() => {
              if (isPremium) {
                alert('👑 You already have Premium access! Enjoy all features.')
              } else {
                alert('🚀 Premium is coming soon!\n\nWe are working hard to launch it.\n\nFor now, enjoy all free features and stay tuned for the Premium launch!')
              }
            }}>
            Start 7-day free trial →
          </button>
          <div style={{ fontSize:11, opacity:0.7, marginTop:8 }}>Then ${price}/{billing==='monthly'?'month':'year'} · Cancel anytime</div>
        </div>

        {/* Features comparison */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {/* Free */}
          <div className="card" style={{ padding:14 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:'var(--text-muted)' }}>FREE</div>
            {FEATURES_FREE.map((f,i) => (
              <div key={i} style={{ fontSize:11, marginBottom:6, color:f.startsWith('❌')?'#ccc':'var(--text)', lineHeight:1.4 }}>{f}</div>
            ))}
          </div>
          {/* Premium */}
          <div className="card" style={{ padding:14, border:'2px solid var(--green)', background:'var(--green-light)' }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10, color:'var(--green-dark)' }}>PREMIUM 👑</div>
            {FEATURES_PREMIUM.map((f,i) => (
              <div key={i} style={{ fontSize:11, marginBottom:6, color:'var(--green-dark)', lineHeight:1.4 }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="card" style={{ marginBottom:16, background:'#FAEEDA' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#BA7517', marginBottom:8 }}>⭐ Why upgrade?</div>
          {[
            { icon:'🌍', text:'Track money in USD, EUR, NGN, GHS, KES and 14+ currencies simultaneously' },
            { icon:'📊', text:'See exactly where every dollar goes with advanced analytics' },
            { icon:'📄', text:'Download unlimited PDF and Excel reports for taxes and planning' },
            { icon:'📸', text:'Scan receipts with your camera — never lose a receipt again' },
          ].map((item,i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
              <span style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>❓ FAQ</div>
          {[
            { q:'Is the free plan really free?', a:'Yes! The free plan is free forever. No credit card required.' },
            { q:'Can I cancel anytime?', a:'Yes. Cancel with one tap. No questions asked.' },
            { q:'What currencies are supported?', a:'18+ currencies including USD, EUR, GBP, NGN, KES, GHS, XOF, XAF, CAD, AUD, INR, BRL and more.' },
            { q:'Is my data safe?', a:'Yes. All data is encrypted and stored securely. We never sell your data.' },
          ].map((item,i) => (
            <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:i<3?'1px solid var(--border)':'none' }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{item.q}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>{item.a}</div>
            </div>
          ))}
        </div>

        {/* Waitlist */}
        <div className="card" style={{ background:'linear-gradient(135deg, #185FA5, #0D3D6E)', color:'white', marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>🚀 Join the Premium Waitlist</div>
          <div style={{ fontSize:13, opacity:0.85, marginBottom:16 }}>Be first to know when Premium launches and get <strong>30 days free!</strong></div>
          
          {waitlistDone ? (
            <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
              <div style={{ fontWeight:700, fontSize:15 }}>You're on the list!</div>
              <div style={{ fontSize:12, opacity:0.8, marginTop:4 }}>We'll notify you when Premium launches. You'll get 30 days free!</div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="Your name"
                value={waitlistName}
                onChange={e => setWaitlistName(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)', color:'white', fontSize:14, marginBottom:8, outline:'none', boxSizing:'border-box' }}
              />
              <input
                type="email"
                placeholder="Your email address"
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)', color:'white', fontSize:14, marginBottom:8, outline:'none', boxSizing:'border-box' }}
              />
              {waitlistError && <div style={{ fontSize:12, color:'#ffcccc', marginBottom:8 }}>{waitlistError}</div>}
              <button
                disabled={waitlistLoading}
                onClick={async () => {
                  if (!waitlistEmail) { setWaitlistError('Please enter your email'); return }
                  setWaitlistLoading(true)
                  setWaitlistError('')
                  const { error } = await supabase.from('waitlist').insert({ email:waitlistEmail, name:waitlistName, plan:'premium' })
                  if (error) {
                    if (error.code === '23505') {
                      setWaitlistError('This email is already on the waitlist!')
                    } else {
                      setWaitlistError('Something went wrong. Please try again.')
                    }
                  } else {
                    setWaitlistDone(true)
                  }
                  setWaitlistLoading(false)
                }}
                style={{ width:'100%', padding:'12px', background:'white', color:'#185FA5', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                {waitlistLoading ? 'Joining...' : '🎯 Join waitlist — get 30 days free'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
