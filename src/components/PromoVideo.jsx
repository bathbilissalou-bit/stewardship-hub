import { useState, useEffect, useRef } from 'react'
import { useT } from '../lib/i18n'

const SLIDE_DURATION = 4500 // ms per slide

function buildSlides(tr) {
  return [
  {
    bg: 'linear-gradient(135deg, #0F6E56 0%, #1D9E75 60%, #185FA5 100%)',
    icon: '✦',
    iconSize: 64,
    tag: tr.promo0_tag,
    title: tr.promo0_title,
    desc: tr.promo0_desc,
    visual: <IntroVisual tr={tr} />,
  },
  {
    bg: 'linear-gradient(135deg, #185FA5, #0d3f70)',
    icon: '💳',
    tag: tr.promo1_tag,
    title: tr.promo1_title,
    desc: tr.promo1_desc,
    visual: <BudgetVisual tr={tr} />,
  },
  {
    bg: 'linear-gradient(135deg, #3B6D11, #1D9E75)',
    icon: '📈',
    tag: tr.promo2_tag,
    title: tr.promo2_title,
    desc: tr.promo2_desc,
    visual: <InvestVisual tr={tr} />,
  },
  {
    bg: 'linear-gradient(135deg, #A32D2D, #7B1C1C)',
    icon: '🏦',
    tag: tr.promo3_tag,
    title: tr.promo3_title,
    desc: tr.promo3_desc,
    visual: <LoanVisual tr={tr} />,
  },
  {
    bg: 'linear-gradient(135deg, #BA7517, #7A4D0F)',
    icon: '⭐',
    tag: tr.promo4_tag,
    title: tr.promo4_title,
    desc: tr.promo4_desc,
    visual: <ChallengeVisual tr={tr} />,
  },
  {
    bg: 'linear-gradient(135deg, #E64A19, #BF360C)',
    icon: '🔔',
    tag: tr.promo5_tag,
    title: tr.promo5_title,
    desc: tr.promo5_desc,
    visual: <BillVisual tr={tr} />,
  },
  {
    bg: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
    icon: '💰',
    tag: tr.promo6_tag,
    title: tr.promo6_title,
    desc: tr.promo6_desc,
    visual: <SavingsVisual tr={tr} />,
  },
  {
    bg: 'linear-gradient(135deg, #185FA5, #534AB7)',
    icon: '🤖',
    tag: tr.promo7_tag,
    title: tr.promo7_title,
    desc: tr.promo7_desc,
    visual: <CoachVisual tr={tr} />,
  },
  {
    bg: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
    icon: '✦',
    tag: tr.promo8_tag,
    title: tr.promo8_title,
    desc: tr.promo8_desc,
    visual: <CtaVisual tr={tr} />,
  },
  ]
}

// ── Slide visuals ─────────────────────────────────────────────────────────────
function IntroVisual({ tr }) {
  const pills = [tr.budget, tr.invest, tr.loans, tr.giving, tr.community, tr.faith]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
      {pills.map((f, i) => (
        <div key={i} style={{ padding:'5px 18px', background:'rgba(255,255,255,0.15)', borderRadius:20, fontSize:12, color:'white', fontWeight:600, animation:`fadeSlideUp 0.4s ${i*0.1+0.3}s both` }}>{f}</div>
      ))}
    </div>
  )
}

function BudgetVisual({ tr }) {
  const rows = [
    [tr.promo_vis_budget_salary, '$3,000'],
    [tr.promo_vis_budget_rent, '-$1,200'],
    [tr.promo_vis_budget_food, '-$400'],
    [tr.promo_vis_budget_savings_line, '-$600'],
  ]
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {rows.map(([l,v],i) => (
        <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', fontSize:11, color:'white', animation:`fadeSlideUp 0.3s ${i*0.1+0.2}s both` }}>
          <span>{l}</span><span style={{ fontWeight:700, color: v.startsWith('-') ? '#ff8a8a' : '#7fffcf' }}>{v}</span>
        </div>
      ))}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:12, color:'white', fontWeight:800 }}>
        <span>{tr.promo_vis_budget_surplus}</span><span style={{ color:'#7fffcf' }}>+$800</span>
      </div>
    </div>
  )
}

function InvestVisual({ tr }) {
  const demo = [
    [tr.promo_vis_demo_sp500, '$10,000', '+12%'],
    [tr.promo_vis_demo_bitcoin, '$2,000', '+34%'],
    [tr.promo_vis_demo_apple, '$5,000', '+8%'],
  ]
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {demo.map(([n,a,r],i) => (
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
      <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', marginTop:3 }}>{tr.promo_vis_demo_roi}</div>
    </div>
  )
}

function LoanVisual({ tr }) {
  const bars = [
    [tr.promo_vis_demo_car_loan, '$18,500', '38%'],
    [tr.promo_vis_demo_student, '$24,000', '22%'],
  ]
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {bars.map(([n,a,p],i) => (
        <div key={n} style={{ marginBottom:8, animation:`fadeSlideUp 0.3s ${i*0.2+0.2}s both` }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'white', fontWeight:600, marginBottom:3 }}>
            <span>{n}</span><span style={{ color:'#ff8a8a' }}>{a}</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.15)', borderRadius:3 }}>
            <div style={{ width:p, height:'100%', background:'#ff8a8a', borderRadius:3 }} />
          </div>
        </div>
      ))}
      <div style={{ fontSize:10, color:'#7fffcf', fontWeight:700, marginTop:4 }}>{tr.promo_vis_demo_debt_free}</div>
    </div>
  )
}

function ChallengeVisual({ tr }) {
  const days = Array.from({length:30},(_,i)=>i+1)
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:8, width:160 }}>
      <div style={{ fontSize:11, color:'white', fontWeight:700, marginBottom:6, textAlign:'center' }}>{tr.promo_vis_challenge_head}</div>
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

function BillVisual({ tr }) {
  const rows = [
    { ic: '🏠', n: tr.promo_vis_bill_rent, d: tr.promo_vis_bill_d1, s: tr.promo_vis_bill_st_paid, tone: 'paid' },
    { ic: '💡', n: tr.promo_vis_bill_electric, d: tr.promo_vis_bill_d2, s: tr.promo_vis_bill_st_days, tone: 'urgent' },
    { ic: '📱', n: tr.promo_vis_bill_netflix, d: tr.promo_vis_bill_d3, s: tr.promo_vis_bill_st_ok, tone: 'muted' },
  ]
  const toneColor = (tone) => {
    if (tone === 'paid') return '#7fffcf'
    if (tone === 'urgent') return '#ff8a8a'
    return 'rgba(255,255,255,0.5)'
  }
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {rows.map(({ ic, n, d, s, tone }, i) => (
        <div key={n} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', animation:`fadeSlideUp 0.3s ${i*0.12+0.2}s both` }}>
          <span style={{ fontSize:14 }}>{ic}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'white', fontWeight:600 }}>{n}</div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.6)' }}>{d}</div>
          </div>
          <span style={{ fontSize:9, fontWeight:700, color: toneColor(tone) }}>{s}</span>
        </div>
      ))}
    </div>
  )
}

function SavingsVisual({ tr }) {
  const rows = [
    [tr.promo_vis_sav_emergency, '$3,200', '$5,000', '64%'],
    [tr.promo_vis_sav_vacation, '$800', '$2,000', '40%'],
    [tr.promo_vis_sav_car, '$500', '$10,000', '5%'],
  ]
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {rows.map(([n,s,t,p],i) => (
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

function CoachVisual({ tr }) {
  const msgs = [
    { text: tr.promo_vis_coach_q1, me:true },
    { text: tr.promo_vis_coach_a1, me:false },
    { text: tr.promo_vis_coach_q2, me:true },
    { text: tr.promo_vis_coach_a2, me:false },
  ]
  return (
    <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:10, width:160 }}>
      {msgs.map((m,i) => (
        <div key={i} style={{ display:'flex', justifyContent: m.me ? 'flex-end' : 'flex-start', marginBottom:5, animation:`fadeSlideUp 0.3s ${i*0.18+0.2}s both` }}>
          <div style={{ maxWidth:'80%', padding:'4px 8px', borderRadius: m.me ? '10px 10px 2px 10px' : '10px 10px 10px 2px', background: m.me ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', fontSize:8, color: m.me ? '#185FA5' : 'white', fontWeight: m.me ? 600 : 400, lineHeight:1.4 }}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  )
}

function CtaVisual({ tr }) {
  const rows = [
    [tr.promo_vis_cta_free, '✓'],
    [tr.promo_vis_cta_langs, '🌍'],
    [tr.promo_vis_cta_faith, '✦'],
    [tr.promo_vis_cta_ai, '🤖'],
    [tr.promo_vis_cta_markets, '📈'],
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
      {rows.map(([l,ic],i) => (
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
  const tr = useT()
  const SLIDES = buildSlides(tr)
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
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{tr.promo_brand}</span>
        </div>
        <button type="button" onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:20, color:'white', fontSize:12, padding:'4px 12px', cursor:'pointer', fontWeight:600 }}>
          {tr.promo_skip}
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
          {paused ? tr.promo_resume : tr.promo_pause}
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
