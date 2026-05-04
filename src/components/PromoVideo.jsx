import { useState, useEffect, useRef } from 'react'

const SLIDE_DURATION = 4500 // ms per slide

const SLIDES = [
  {
    bg: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 60%, #185FA5 100%)',
    icon: '✦',
    iconSize: 64,
    tag: 'WELCOME',
    title: 'Stewardship Hub',
    desc: 'Manage your money with faith-based principles — in 15 languages, for families worldwide.',
    visual: <IntroVisual />,
  },
  {
    bg: 'linear-gradient(135deg, #185FA5, #0d3f70)',
    icon: '💳',
    tag: 'BUDGET TRACKER',
    title: 'Know Where Every Dollar Goes',
    desc: 'Track income and expenses by category. See your net surplus instantly — and never overspend again.',
    visual: <BudgetVisual />,
  },
  {
    bg: 'linear-gradient(135deg, #3B6D11, #1D9E75)',
    icon: '📈',
    tag: 'INVESTMENT TRACKER',
    title: 'Watch Your Wealth Grow',
    desc: 'Track stocks, crypto, real estate & more — with live market prices updated in real time.',
    visual: <InvestVisual />,
  },
  {
    bg: 'linear-gradient(135deg, #A32D2D, #7B1C1C)',
    icon: '🏦',
    tag: 'LOAN TRACKER',
    title: 'Crush Your Debt Faster',
    desc: 'See your full amortization schedule. Know exactly when you\'ll be debt-free.',
    visual: <LoanVisual />,
  },
  {
    bg: 'linear-gradient(135deg, #BA7517, #7A4D0F)',
    icon: '⭐',
    tag: '$100 CHALLENGE',
    title: '30 Days to New Habits',
    desc: 'Build financial discipline one day at a time. Save $100 in 30 days with daily tasks.',
    visual: <ChallengeVisual />,
  },
  {
    bg: 'linear-gradient(135deg, #E64A19, #BF360C)',
    icon: '🔔',
    tag: 'BILL REMINDERS',
    title: 'Never Miss a Payment',
    desc: 'Set monthly or one-time bill reminders with push notifications — and track what\'s paid.',
    visual: <BillVisual />,
  },
  {
    bg: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
    icon: '💰',
    tag: 'SAVINGS GOALS',
    title: 'Save With Purpose',
    desc: 'Set goals for emergencies, vacations, homes. Watch the progress bar fill up month by month.',
    visual: <SavingsVisual />,
  },
  {
    bg: 'linear-gradient(135deg, #185FA5, #534AB7)',
    icon: '🤖',
    tag: 'AI FINANCIAL COACH',
    title: 'Your Personal Coach',
    desc: 'Chat with Claude — a powerful AI — for personalized advice on budgeting, investing, and debt.',
    visual: <CoachVisual />,
  },
  {
    bg: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
    icon: '✦',
    tag: 'GET STARTED',
    title: 'Start Your Journey Today',
    desc: 'Free to use. Faith-based. Built for families everywhere. Join Stewardship Hub now.',
    visual: <CtaVisual />,
  },
]

// ── Slide visuals ─────────────────────────────────────────────────────────────
function IntroVisual() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
      {['Budget','Invest','Loans','Giving','Community','Faith'].map((f,i) => (
        <div key={f} style={{ padding:'5px 18px', background:'rgba(255,255,255,0.15)', borderRadius:20, fontSize:12, color:'white', fontWeight:600, animation:`fadeSlideUp 0.4s ${i*0.1+0.3}s both` }}>{f}</div>
      ))}
    </div>
  )
}

function BudgetVisual() {
  const rows = [['Salary','$3,000'],['Rent','-$1,200'],['Food','-$400'],['Savings','-$600']]
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {rows.map(([l,v],i) => (
        <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', fontSize:11, color:'white', animation:`fadeSlideUp 0.3s ${i*0.1+0.2}s both` }}>
          <span>{l}</span><span style={{ fontWeight:700, color: v.startsWith('-') ? '#ff8a8a' : '#7fffcf' }}>{v}</span>
        </div>
      ))}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:12, color:'white', fontWeight:800 }}>
        <span>Surplus</span><span style={{ color:'#7fffcf' }}>+$800</span>
      </div>
    </div>
  )
}

function InvestVisual() {
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {[['S&P 500','$10,000','+12%'],['Bitcoin','$2,000','+34%'],['Apple','$5,000','+8%']].map(([n,a,r],i) => (
        <div key={n} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', animation:`fadeSlideUp 0.3s ${i*0.12+0.2}s both` }}>
          <span style={{ fontSize:10, color:'white', fontWeight:600 }}>{n}</span>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.7)' }}>{a}</span>
          <span style={{ fontSize:10, color:'#7fffcf', fontWeight:700 }}>{r}</span>
        </div>
      ))}
      <div style={{ marginTop:6, height:6, background:'rgba(255,255,255,0.15)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ display:'flex', height:'100%' }}>
          {[['59%','#7fffcf'],['12%','#aaa7ff'],['29%','#ffc87f']].map(([w,c]) => <div key={c} style={{ width:w, background:c }} />)}
        </div>
      </div>
      <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', marginTop:3 }}>Portfolio ROI: +15.4%</div>
    </div>
  )
}

function LoanVisual() {
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {[['Car Loan','$18,500','38%'],['Student','$24,000','22%']].map(([n,a,p],i) => (
        <div key={n} style={{ marginBottom:8, animation:`fadeSlideUp 0.3s ${i*0.2+0.2}s both` }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'white', fontWeight:600, marginBottom:3 }}>
            <span>{n}</span><span style={{ color:'#ff8a8a' }}>{a}</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.15)', borderRadius:3 }}>
            <div style={{ width:p, height:'100%', background:'#ff8a8a', borderRadius:3 }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize:10, color:'#7fffcf', fontWeight:700, marginTop:4 }}>🎯 Debt-free in 4.5 years</div>
    </div>
  )
}

function ChallengeVisual() {
  const days = Array.from({length:30},(_,i)=>i+1)
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:8, width:160 }}>
      <div style={{ fontSize:11, color:'white', fontWeight:700, marginBottom:6, textAlign:'center' }}>Day 14 · $47 saved</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:2 }}>
        {days.map(d => (
          <div key={d} style={{ height:14, borderRadius:3, background: d<=14 ? 'rgba(255,255,255,0.8)' : d===15 ? 'transparent' : 'rgba(255,255,255,0.15)', border: d===15 ? '1.5px solid rgba(255,255,255,0.6)' : 'none', display:'flex', alignItems:'center', justifyContent:'center', fontSize:6, color: d<=14 ? '#7A4D0F' : 'rgba(255,255,255,0.4)', fontWeight:700 }}>
            {d<=14 ? '✓' : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function BillVisual() {
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {[['🏠','Rent','May 1','paid'],['💡','Electric','Apr 30','3 days!'],['📱','Netflix','May 5','ok']].map(([ic,n,d,s],i) => (
        <div key={n} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', animation:`fadeSlideUp 0.3s ${i*0.12+0.2}s both` }}>
          <span style={{ fontSize:14 }}>{ic}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'white', fontWeight:600 }}>{n}</div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.6)' }}>{d}</div>
          </div>
          <span style={{ fontSize:9, fontWeight:700, color: s==='paid' ? '#7fffcf' : s.includes('day') ? '#ff8a8a' : 'rgba(255,255,255,0.5)' }}>{s}</span>
        </div>
      ))}
    </div>
  )
}

function SavingsVisual() {
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {[['Emergency Fund','$3,200','$5,000','64%'],['Vacation','$800','$2,000','40%'],['New Car','$500','$10,000','5%']].map(([n,s,t,p],i) => (
        <div key={n} style={{ marginBottom:7, animation:`fadeSlideUp 0.3s ${i*0.15+0.2}s both` }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'white', marginBottom:2 }}>
            <span style={{ fontWeight:600 }}>{n}</span><span style={{ color:'rgba(255,255,255,0.7)' }}>{s} / {t}</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.15)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ width:p, height:'100%', background:'#7fffcf', borderRadius:3 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CoachVisual() {
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {[
        { text:'How do I pay off debt faster?', me:true },
        { text:'Use the debt snowball! Pay the smallest loan first, then roll that payment to the next.', me:false },
        { text:'Which index fund is best?', me:true },
        { text:'For beginners, VOO or VTI are excellent — low cost, broad market exposure.', me:false },
      ].map((m,i) => (
        <div key={i} style={{ display:'flex', justifyContent: m.me ? 'flex-end' : 'flex-start', marginBottom:5, animation:`fadeSlideUp 0.3s ${i*0.18+0.2}s both` }}>
          <div style={{ maxWidth:'80%', padding:'4px 8px', borderRadius: m.me ? '10px 10px 2px 10px' : '10px 10px 10px 2px', background: m.me ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', fontSize:8, color: m.me ? '#185FA5' : 'white', fontWeight: m.me ? 600 : 400, lineHeight:1.4 }}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  )
}

function CtaVisual() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
      {[['Free to use','✓'],['15 Languages','🌍'],['Faith-based','✦'],['AI Coach','🤖'],['Live Markets','📈']].map(([l,ic],i) => (
        <div key={l} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 16px', background:'rgba(255,255,255,0.15)', borderRadius:20, animation:`fadeSlideUp 0.4s ${i*0.1+0.2}s both` }}>
          <span style={{ fontSize:13 }}>{ic}</span>
          <span style={{ fontSize:11, color:'white', fontWeight:600 }}>{l}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main PromoVideo component ─────────────────────────────────────────────────
export default function PromoVideo({ onClose }) {
  const [current, setCurrent]   = useState(0)
  const [paused, setPaused]     = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef  = useRef(null)
  const startRef  = useRef(null)
  const elapsed   = useRef(0)

  function startTimer() {
    startRef.current = Date.now() - elapsed.current
    timerRef.current = setInterval(() => {
      const pct = (Date.now() - startRef.current) / SLIDE_DURATION * 100
      if (pct >= 100) {
        elapsed.current = 0
        setCurrent(c => {
          const next = c + 1
          if (next >= SLIDES.length) { clearInterval(timerRef.current); onClose?.(); return c }
          return next
        })
        setProgress(0)
      } else {
        setProgress(pct)
      }
    }, 30)
  }

  function stopTimer() {
    clearInterval(timerRef.current)
    elapsed.current = (Date.now() - startRef.current)
  }

  useEffect(() => {
    elapsed.current = 0
    setProgress(0)
    if (!paused) startTimer()
    return () => clearInterval(timerRef.current)
  }, [current, paused])

  function togglePause() {
    if (paused) { setPaused(false) }
    else { stopTimer(); setPaused(true) }
  }

  function goTo(i) {
    clearInterval(timerRef.current)
    elapsed.current = 0
    setProgress(0)
    setCurrent(i)
    setPaused(false)
  }

  function prev() { if (current > 0) goTo(current - 1) }
  function next() { if (current < SLIDES.length - 1) goTo(current + 1) }

  const slide = SLIDES[current]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:slide.bg, display:'flex', flexDirection:'column', transition:'background 0.6s ease' }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
      `}</style>

      {/* Progress bars */}
      <div style={{ display:'flex', gap:3, padding:'14px 14px 8px' }}>
        {SLIDES.map((_, i) => (
          <div key={i} onClick={() => goTo(i)} style={{ flex:1, height:3, background:'rgba(255,255,255,0.3)', borderRadius:2, cursor:'pointer', overflow:'hidden' }}>
            <div style={{ height:'100%', background:'white', borderRadius:2, width: i < current ? '100%' : i === current ? `${progress}%` : '0%', transition: i === current ? 'none' : 'none' }} />
          </div>
        ))}
      </div>

      {/* Top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 14px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:14, color:'white', fontWeight:800 }}>✦</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>Stewardship Hub</span>
        </div>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:20, color:'white', fontSize:12, padding:'4px 12px', cursor:'pointer', fontWeight:600 }}>
          ✕ Skip
        </button>
      </div>

      {/* Slide content */}
      <div key={current} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px 20px', gap:20, animation:'fadeIn 0.4s ease' }}>
        {/* Tag */}
        <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.7)', letterSpacing:'0.15em', background:'rgba(255,255,255,0.15)', padding:'4px 12px', borderRadius:20 }}>
          {slide.tag}
        </div>

        {/* Visual */}
        <div style={{ animation:'fadeSlideUp 0.5s 0.1s both' }}>
          {slide.visual}
        </div>

        {/* Text */}
        <div style={{ textAlign:'center', maxWidth:320 }}>
          <div style={{ fontSize:24, fontWeight:900, color:'white', lineHeight:1.2, marginBottom:10, animation:'fadeSlideUp 0.5s 0.2s both' }}>
            {slide.title}
          </div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.85)', lineHeight:1.6, animation:'fadeSlideUp 0.5s 0.3s both' }}>
            {slide.desc}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding:'0 20px 40px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={prev} disabled={current===0}
          style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'white', fontSize:18, cursor: current===0 ? 'not-allowed' : 'pointer', opacity: current===0 ? 0.4 : 1 }}>
          ‹
        </button>
        <button onClick={togglePause}
          style={{ flex:1, height:44, borderRadius:22, background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)', color:'white', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {paused ? '▶  Resume' : '⏸  Pause'}
        </button>
        <button onClick={next} disabled={current===SLIDES.length-1}
          style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.15)', border:'none', color:'white', fontSize:18, cursor: current===SLIDES.length-1 ? 'not-allowed' : 'pointer', opacity: current===SLIDES.length-1 ? 0.4 : 1 }}>
          ›
        </button>
      </div>

      {/* Slide counter */}
      <div style={{ position:'absolute', bottom:14, right:20, fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
        {current + 1} / {SLIDES.length}
      </div>
    </div>
  )
}
