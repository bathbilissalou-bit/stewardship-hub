import { useState, useMemo, useRef } from 'react'
import { useT, interpolate } from '../lib/i18n'
import { Link } from 'react-router-dom'
import VideoCard from '../components/VideoCard'

// ── Pulse tap indicator ──────────────────────────────────────────────────────
function TapDot({ x='50%', y='50%', color='#1D9E75' }) {
  return (
    <div style={{ position:'absolute', left:x, top:y, transform:'translate(-50%,-50%)', zIndex:10, pointerEvents:'none' }}>
      <div style={{ width:24, height:24, borderRadius:'50%', background:color, opacity:0.9,
        animation:'tapPulse 1.4s ease-in-out infinite', boxShadow:`0 0 0 0 ${color}88` }} />
    </div>
  )
}

// ── Mini phone frame ─────────────────────────────────────────────────────────
function Phone({ children }) {
  return (
    <div style={{ width:160, height:290, background:'#111', borderRadius:26, padding:7,
      boxShadow:'0 24px 64px rgba(0,0,0,0.35), inset 0 0 0 1px #333', flexShrink:0, position:'relative' }}>
      <div style={{ width:36, height:5, background:'#222', borderRadius:3, margin:'0 auto 5px' }} />
      <div style={{ height:'calc(100% - 10px)', background:'#f8f9fa', borderRadius:20, overflow:'hidden', position:'relative' }}>
        {children}
      </div>
    </div>
  )
}

// ── Per-module screen mockups (copy via PAGE_PATCH `howto_mock_*` + core `tr`) ─
function MockDashboard({ tr }) {
  const nav = [tr.budget, tr.invest, tr.loans]
  const metrics = [
    [tr.income, '$3,200'],
    [tr.expenses, '$2,100'],
    [tr.howto_mock_saved, '$1,100'],
    [tr.inv_col_roi, '+4.2%'],
  ]
  return (
    <div style={{ padding:8, background:'#f8f9fa', height:'100%' }}>
      <div style={{ background:'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius:10, padding:'10px 8px', color:'white', marginBottom:6 }}>
        <div style={{ fontSize:7, opacity:0.8 }}>{tr.howto_mock_good_morning}</div>
        <div style={{ fontSize:11, fontWeight:700 }}>{tr.settings_brand_name}</div>
        <div style={{ display:'flex', gap:4, marginTop:4 }}>
          {nav.map(l => <div key={l} style={{ flex:1, background:'rgba(255,255,255,0.15)', borderRadius:4, padding:3, fontSize:6, textAlign:'center' }}>{l}</div>)}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:4 }}>
        {metrics.map(([l,v]) => (
          <div key={String(l)} style={{ background:'white', borderRadius:6, padding:5, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:6, color:'#9ca3af' }}>{l}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'#1D9E75' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'white', borderRadius:6, padding:5 }}>
        <div style={{ fontSize:6, fontWeight:600, marginBottom:3 }}>{tr.howto_mock_bottom_nav}</div>
        <div style={{ display:'flex', justifyContent:'space-around' }}>
          {['🏠','💳','📈','🏦','👥'].map(i => <div key={i} style={{ fontSize:10 }}>{i}</div>)}
        </div>
      </div>
      <TapDot x="50%" y="88%" color="#1D9E75" />
    </div>
  )
}

function MockBudget({ tr, step }) {
  const topCards = [
    [tr.income, '$3,200', '#1D9E75'],
    [tr.expenses, '$2,100', '#A32D2D'],
  ]
  const rows = [
    [tr.howto_mock_salary, '$3,000'],
    [tr.howto_mock_freelance, '$200'],
  ]
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#185FA5,#0d3f70)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>{tr.howto_mock_budget_title}</div>
        <div style={{ fontSize:6, opacity:0.8 }}>{tr.howto_mock_month_sample}</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, marginBottom:4 }}>
          {topCards.map(([l,v,c]) => (
            <div key={String(l)} style={{ background:'white', borderRadius:6, padding:4 }}>
              <div style={{ fontSize:5, color:'#9ca3af' }}>{l}</div>
              <div style={{ fontSize:8, fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'white', borderRadius:6, padding:4, marginBottom:3 }}>
          <div style={{ fontSize:6, fontWeight:600, marginBottom:2, color:'#185FA5' }}>{tr.income}</div>
          {rows.map(([n,a]) => (
            <div key={String(n)} style={{ display:'flex', justifyContent:'space-between', fontSize:5.5, padding:'1.5px 0', borderBottom:'1px solid #f3f4f6' }}>
              <span>{n}</span><span style={{ color:'#1D9E75' }}>{a}</span>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:2, marginTop:2, color:'#185FA5', fontSize:5.5, fontWeight:600 }}>
            <span>+</span><span>{tr.howto_mock_add_row}</span>
          </div>
        </div>
      </div>
      <TapDot x="30%" y={step===1 ? '58%' : step===2 ? '72%' : '82%'} color="#185FA5" />
    </div>
  )
}

function MockInvest({ tr }) {
  const metrics = [
    [tr.howto_mock_invested, '$21,000'],
    [tr.howto_mock_value, '$22,500'],
    [tr.howto_mock_gain, '+$1,500'],
    [tr.inv_col_roi, '+7.1%'],
  ]
  const holdings = [
    [tr.promo_vis_demo_sp500, '$10k', 'SPY', '+5.2%'],
    [tr.promo_vis_demo_bitcoin, '$5k', 'BTC', '+12%'],
    [tr.promo_vis_demo_apple, '$6k', 'AAPL', '+3%'],
  ]
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#3B6D11,#254508)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>{tr.howto_mock_invest_title}</div>
        <div style={{ fontSize:6, opacity:0.8 }}>{tr.howto_mock_invest_sub}</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, marginBottom:4 }}>
          {metrics.map(([l,v]) => (
            <div key={String(l)} style={{ background:'white', borderRadius:5, padding:3 }}>
              <div style={{ fontSize:5, color:'#9ca3af' }}>{l}</div>
              <div style={{ fontSize:7, fontWeight:700, color:'#3B6D11' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'white', borderRadius:6, padding:4 }}>
          <div style={{ display:'flex', height:5, borderRadius:3, overflow:'hidden', marginBottom:2 }}>
            {[['40%','#1D9E75'],['35%','#185FA5'],['25%','#BA7517']].map(([w,c]) => <div key={c} style={{ width:w, background:c }} />)}
          </div>
          {holdings.map(([n,a,t,r]) => (
            <div key={String(n)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:5.5, padding:'2px 0', borderBottom:'1px solid #f3f4f6' }}>
              <span style={{ fontWeight:600 }}>{n}</span>
              <span style={{ color:'#9ca3af' }}>{t}</span>
              <span style={{ color:'#1D9E75', fontWeight:600 }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
      <TapDot x="85%" y="47%" color="#3B6D11" />
    </div>
  )
}

function MockLoans({ tr }) {
  const loans = [
    [tr.howto_mock_car_loan, tr.howto_mock_loan_lender1, '$18,500', tr.howto_mock_loan_pay1],
    [tr.howto_mock_student_loan, tr.howto_mock_loan_lender2, '$24,000', tr.howto_mock_loan_pay2],
  ]
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>{tr.howto_mock_loans_title}</div>
        <div style={{ fontSize:6, opacity:0.8 }}>{tr.howto_mock_total_debt}</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {loans.map(([n,l,a,m]) => (
          <div key={String(n)} style={{ background:'white', borderRadius:6, padding:5, marginBottom:3 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:6.5, fontWeight:700 }}>{n}</span>
              <span style={{ fontSize:6, color:'#A32D2D', fontWeight:600 }}>{a}</span>
            </div>
            <div style={{ fontSize:5.5, color:'#9ca3af', marginBottom:2 }}>{l} · {m}</div>
            <div style={{ height:3, background:'#f3f4f6', borderRadius:2 }}>
              <div style={{ width:'35%', height:'100%', background:'#A32D2D', borderRadius:2 }} />
            </div>
          </div>
        ))}
        <div style={{ background:'white', borderRadius:6, padding:5, border:'1px dashed #A32D2D44' }}>
          <div style={{ fontSize:6, color:'#A32D2D', fontWeight:600 }}>{tr.howto_mock_amort_hint}</div>
          <div style={{ fontSize:5, color:'#9ca3af' }}>{tr.howto_mock_tap_loan}</div>
        </div>
      </div>
      <TapDot x="50%" y="42%" color="#A32D2D" />
    </div>
  )
}

function MockChallenge({ tr, step }) {
  const days = Array.from({length:30},(_,i)=>i+1)
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#BA7517,#7A4D0F)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>{tr.howto_mock_challenge_title}</div>
        <div style={{ fontSize:6, opacity:0.8 }}>{tr.howto_mock_day_saved}</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        <div style={{ background:'white', borderRadius:6, padding:5, marginBottom:3, textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#BA7517' }}>$42</div>
          <div style={{ fontSize:5.5, color:'#9ca3af' }}>{tr.howto_mock_of_goal}</div>
          <div style={{ height:4, background:'#f3f4f6', borderRadius:2, marginTop:3 }}>
            <div style={{ width:'42%', height:'100%', background:'#BA7517', borderRadius:2 }} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:2 }}>
          {days.map(d => (
            <div key={d} style={{ height:12, borderRadius:3, fontSize:5, display:'flex', alignItems:'center', justifyContent:'center',
              background: d<=12 ? '#1D9E75' : d===13 ? 'transparent' : '#e5e7eb',
              border: d===13 ? '1.5px solid #1D9E75' : 'none',
              color: d<=12 ? 'white' : '#9ca3af', fontWeight: d<=12 ? 700 : 400 }}>
              {d<=12 ? '✓' : d}
            </div>
          ))}
        </div>
      </div>
      <TapDot x="50%" y={step===1 ? '25%' : '62%'} color="#BA7517" />
    </div>
  )
}

function MockRealEstate({ tr }) {
  const phases = [
    [tr.howto_mock_phase_finprep, tr.howto_mock_status_done, '100%', '#1D9E75'],
    [tr.howto_mock_phase_mortgage, tr.howto_mock_status_progress, '40%', '#BA7517'],
    [tr.howto_mock_phase_search, tr.howto_mock_status_locked, '0%', '#9ca3af'],
  ]
  const tabs = [tr.howto_mock_tab_checklist, tr.howto_mock_tab_home_types]
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#8B5E3C,#5C3D1E)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>{tr.howto_mock_re_title}</div>
        <div style={{ fontSize:6, opacity:0.8 }}>{tr.howto_mock_steps_progress}</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {phases.map(([phase,status,pct,c]) => (
          <div key={String(phase)} style={{ background:'white', borderRadius:6, padding:5, marginBottom:3 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:6.5, fontWeight:600 }}>{phase}</span>
              <span style={{ fontSize:5.5, color:c, fontWeight:600 }}>{status}</span>
            </div>
            <div style={{ height:3, background:'#f3f4f6', borderRadius:2 }}>
              <div style={{ width:pct, height:'100%', background:c, borderRadius:2 }} />
            </div>
          </div>
        ))}
        <div style={{ display:'flex', gap:3 }}>
          {tabs.map((t,i) => (
            <div key={String(t)} style={{ flex:1, padding:4, background: i===0 ? '#8B5E3C' : 'white', color: i===0 ? 'white' : '#6b7280', borderRadius:5, fontSize:5.5, fontWeight:600, textAlign:'center', border:'1px solid #e5e7eb' }}>{t}</div>
          ))}
        </div>
      </div>
      <TapDot x="50%" y="55%" color="#8B5E3C" />
    </div>
  )
}

function MockCommunity({ tr }) {
  const posts = [
    ['Maria G.', '🎉', tr.howto_mock_comm_p1, tr.howto_mock_comm_time_2h, tr.howto_mock_comm_type_milestone],
    ['James O.', '❓', tr.howto_mock_comm_p2, tr.howto_mock_comm_time_5h, tr.howto_mock_comm_type_question],
    ['Sarah K.', '🙏', tr.howto_mock_comm_p3, tr.howto_mock_comm_time_1d, tr.howto_mock_comm_type_prayer],
  ]
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#185FA5,#0d3f70)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>{tr.howto_mock_comm_title}</div>
        <div style={{ fontSize:6, opacity:0.8 }}>{tr.howto_mock_comm_members}</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {posts.map(([n,ic,txt,t,type]) => (
          <div key={String(n)} style={{ background:'white', borderRadius:6, padding:5, marginBottom:3 }}>
            <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:2 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'#E6F1FB', fontSize:7, display:'flex', alignItems:'center', justifyContent:'center' }}>{ic}</div>
              <div>
                <div style={{ fontSize:6, fontWeight:700 }}>{n}</div>
                <div style={{ fontSize:5, color:'#9ca3af' }}>{type} · {t}</div>
              </div>
            </div>
            <div style={{ fontSize:5.5, color:'#374151', lineHeight:1.4 }}>{txt}</div>
            <div style={{ display:'flex', gap:6, marginTop:3, fontSize:5.5, color:'#9ca3af' }}>
              <span>{tr.howto_mock_like}</span><span>{tr.howto_mock_comment}</span>
            </div>
          </div>
        ))}
      </div>
      <TapDot x="82%" y="90%" color="#185FA5" />
    </div>
  )
}

function MockFaith({ tr }) {
  const rows = [
    [tr.howto_mock_faith_t1, tr.howto_mock_faith_v1, 'read'],
    [tr.howto_mock_faith_t2, tr.howto_mock_faith_v2, 'read'],
    [tr.howto_mock_faith_t3, tr.howto_mock_faith_v3, 'today'],
    [tr.howto_mock_faith_t4, tr.howto_mock_faith_v4, 'locked'],
  ]
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#0F6E56,#06402f)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>{tr.howto_mock_faith_title}</div>
        <div style={{ fontSize:6, opacity:0.8 }}>{tr.howto_mock_faith_sub}</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {rows.map(([t,v,s]) => (
          <div key={String(t)} style={{ background:'white', borderRadius:5, padding:4, marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:16, height:16, borderRadius:4, background: s==='read' ? '#E1F5EE' : s==='today' ? '#0F6E56' : '#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8 }}>
              {s==='read' ? '✓' : s==='today' ? '✦' : '🔒'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:6, fontWeight:700 }}>{t}</div>
              <div style={{ fontSize:5, color:'#9ca3af' }}>{v}</div>
            </div>
            {s==='today' && <span style={{ fontSize:5, color:'#0F6E56', fontWeight:700 }}>{tr.howto_mock_read_arrow}</span>}
          </div>
        ))}
        <div style={{ background:'linear-gradient(135deg,#0F6E56,#1D9E75)', borderRadius:5, padding:5, color:'white' }}>
          <div style={{ fontSize:6, fontWeight:700 }}>{tr.howto_mock_six_principles}</div>
          <div style={{ fontSize:5, opacity:0.8 }}>{tr.howto_mock_six_pillars}</div>
        </div>
      </div>
      <TapDot x="50%" y="52%" color="#0F6E56" />
    </div>
  )
}

function buildMockupComponents(tr) {
  return [
    (step) => <MockDashboard tr={tr} />,
    (step) => <MockBudget tr={tr} step={step} />,
    (step) => <MockInvest tr={tr} />,
    (step) => <MockLoans tr={tr} />,
    (step) => <MockChallenge tr={tr} step={step} />,
    (step) => <MockRealEstate tr={tr} />,
    (step) => <MockCommunity tr={tr} />,
    (step) => <MockFaith tr={tr} />,
  ]
}

// ── Guide shell (copy per module) + copy from i18n keys guide_m* ──────────────
const GUIDE_SHELL = [
  { icon: '✦', color: '#1D9E75', bg: '#E1F5EE', link: '/' },
  { icon: '💳', color: '#185FA5', bg: '#E6F1FB', link: '/budget' },
  { icon: '📈', color: '#3B6D11', bg: '#EAF3DE', link: '/investments' },
  { icon: '🏦', color: '#A32D2D', bg: '#FCEBEB', link: '/loans' },
  { icon: '⭐', color: '#BA7517', bg: '#FAEEDA', link: '/challenge' },
  { icon: '🏠', color: '#8B5E3C', bg: '#F5EAE0', link: '/realestate' },
  { icon: '👥', color: '#185FA5', bg: '#E6F1FB', link: '/community' },
  { icon: '✦', color: '#0F6E56', bg: '#E1F5EE', link: '/faith' },
]

function buildGuideModules(tr) {
  return GUIDE_SHELL.map((shell, mi) => ({
    ...shell,
    module: tr[`guide_m${mi}_name`],
    steps: [0, 1, 2].map(si => ({
      title: tr[`guide_m${mi}_s${si}_title`],
      desc: tr[`guide_m${mi}_s${si}_desc`],
      tip: tr[`guide_m${mi}_s${si}_tip`],
    })),
  }))
}

const PROGRESS_KEY = 'sh_guide_progress'

export default function HowToUse() {
  const tr = useT()
  const mockupComponents = useMemo(() => buildMockupComponents(tr), [tr])
  const MODULES = buildGuideModules(tr)
  const [activeModule, setActiveModule] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [completedModules, setCompletedModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]') } catch { return [] }
  })
  const [showConfetti, setShowConfetti] = useState(false)
  const [slideDir, setSlideDir] = useState('right')
  const [animating, setAnimating] = useState(false)
  const touchStart = useRef(null)
  const cardRef = useRef(null)

  function saveProgress(completed) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(completed))
    setCompletedModules(completed)
  }

  function go(newModule, newStep, dir = 'right') {
    if (animating) return
    setSlideDir(dir)
    setAnimating(true)
    setTimeout(() => {
      setActiveModule(newModule)
      setActiveStep(newStep)
      setAnimating(false)
    }, 220)
  }

  function next() {
    const mod = MODULES[activeModule]
    if (activeStep < mod.steps.length - 1) {
      go(activeModule, activeStep + 1, 'right')
    } else {
      // Module complete
      const newCompleted = completedModules.includes(activeModule)
        ? completedModules
        : [...completedModules, activeModule]
      saveProgress(newCompleted)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2500)
      if (activeModule < MODULES.length - 1) {
        go(activeModule + 1, 0, 'right')
      } else {
        go(0, 0, 'right')
      }
    }
  }

  function prev() {
    if (activeStep > 0) {
      go(activeModule, activeStep - 1, 'left')
    } else if (activeModule > 0) {
      go(activeModule - 1, MODULES[activeModule - 1].steps.length - 1, 'left')
    }
  }

  // Touch swipe
  function onTouchStart(e) { touchStart.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    if (dx < -50) next()
    else if (dx > 50) prev()
    touchStart.current = null
  }

  const mod = MODULES[activeModule]
  const step = mod.steps[activeStep]
  const overallStep = MODULES.slice(0, activeModule).reduce((s,m) => s + m.steps.length, 0) + activeStep + 1
  const overallTotal = MODULES.reduce((s,m) => s + m.steps.length, 0)
  const isFirst = activeModule === 0 && activeStep === 0
  const isLast = activeModule === MODULES.length - 1 && activeStep === mod.steps.length - 1

  const MockComponent = mockupComponents[activeModule] || (() => <div style={{ fontSize:48, textAlign:'center', marginTop:60 }}>{mod.icon}</div>)

  return (
    <div style={{ paddingBottom:100 }}>
      <style>{`
        @keyframes tapPulse {
          0%   { box-shadow: 0 0 0 0 currentColor; opacity:0.9; transform:scale(1); }
          70%  { box-shadow: 0 0 0 12px transparent; opacity:0.6; transform:scale(1.15); }
          100% { box-shadow: 0 0 0 0 transparent; opacity:0.9; transform:scale(1); }
        }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInLeft  { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes confettiFall { 0% { transform:translateY(-20px) rotate(0deg); opacity:1; } 100% { transform:translateY(120px) rotate(720deg); opacity:0; } }
        .slide-right { animation: slideInRight 0.25s ease; }
        .slide-left  { animation: slideInLeft 0.25s ease; }
      `}</style>

      {/* Confetti burst */}
      {showConfetti && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:999, pointerEvents:'none', display:'flex', justifyContent:'center', gap:8, padding:20 }}>
          {['🎉','⭐','✨','🎊','💚','🏆','🎯','💰'].map((e,i) => (
            <div key={i} style={{ fontSize:24, animation:`confettiFall 2s ease-out ${i*0.1}s forwards` }}>{e}</div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${mod.color}, ${mod.color}bb)`, borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:10, fontWeight:600, opacity:0.8, letterSpacing:'0.08em', marginBottom:4 }}>{tr.howto_app_guide_badge}</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:20, fontWeight:800 }}>{tr.howto_title}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:12 }}>{tr.howto_subtitle}</p>
      </div>

      {/* Intro video */}
      <div style={{ marginTop:20 }}>
        <VideoCard
          title={tr.howto_video_title}
          subtitle={tr.howto_video_subtitle}
        />
      </div>

      {/* Module pill scrollbar */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', padding:'16px 0 8px', scrollbarWidth:'none' }}>
        {MODULES.map((m, i) => {
          const done = completedModules.includes(i)
          const active = activeModule === i
          return (
            <button key={i} onClick={() => go(i, 0)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:'1.5px solid',
                borderColor: active ? m.color : done ? m.color+'66' : 'var(--border)',
                background: active ? m.color : done ? m.bg : 'var(--bg)',
                color: active ? 'white' : done ? m.color : 'var(--text-muted)',
                fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              {done && !active && <span style={{ fontSize:9 }}>✓</span>}
              {m.icon} {m.module}
            </button>
          )
        })}
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>
          <span>{tr.howto_overall_progress}</span>
          <span style={{ fontWeight:600, color:mod.color }}>{overallStep} / {overallTotal} {tr.howto_steps_word}</span>
        </div>
        <div style={{ height:5, background:'#e5e7eb', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(overallStep/overallTotal)*100}%`, background:mod.color, borderRadius:3, transition:'width 0.4s ease' }} />
        </div>
      </div>

      {/* Main card */}
      <div ref={cardRef}
        className={animating ? '' : slideDir === 'right' ? 'slide-right' : 'slide-left'}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ background:'white', borderRadius:16, border:'1px solid #e5e7eb', overflow:'hidden', marginBottom:10, boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>

        {/* Visual area: phone mockup */}
        <div style={{ background:`linear-gradient(145deg, ${mod.color}18, ${mod.color}08)`, padding:'24px 20px 20px', display:'flex', justifyContent:'center', alignItems:'center', gap:20, minHeight:180, borderBottom:'1px solid #f0f0f0' }}>
          <Phone>
            <MockComponent step={activeStep} />
          </Phone>

          {/* Step label */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxWidth:120 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:mod.color, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                {activeStep + 1}
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:mod.color, letterSpacing:'0.06em' }}>
                {mod.module.toUpperCase()}
              </div>
            </div>
            <div style={{ fontSize:14, fontWeight:800, color:'#1a1a1a', lineHeight:1.3 }}>{step.title}</div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {mod.steps.map((_,i) => (
                <div key={i} onClick={() => go(activeModule, i)}
                  style={{ width: i===activeStep ? 16 : 6, height:6, borderRadius:3, cursor:'pointer',
                    background: i===activeStep ? mod.color : i<activeStep ? mod.color+'55' : '#e5e7eb', transition:'all 0.2s' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Text content */}
        <div style={{ padding:'16px 18px 12px' }}>
          <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:'0 0 12px' }}>{step.desc}</p>
          <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'10px 12px', background:mod.bg, borderRadius:10, border:`1px solid ${mod.color}33`, marginBottom:14 }}>
            <span style={{ fontSize:15, flexShrink:0 }}>💡</span>
            <p style={{ fontSize:12, color:mod.color, margin:0, lineHeight:1.5, fontWeight:600 }}>{step.tip}</p>
          </div>

          {/* Try it now button */}
          <Link to={mod.link} style={{ textDecoration:'none', display:'block', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', background:`linear-gradient(135deg, ${mod.color}, ${mod.color}bb)`, borderRadius:10, color:'white', fontSize:13, fontWeight:700 }}>
              <span>{mod.icon}</span>
              <span>{interpolate(tr.howto_try_it, { module: mod.module })}</span>
            </div>
          </Link>

          {/* Navigation */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={prev} disabled={isFirst}
              style={{ flex:1, padding:'12px', background:'#f3f4f6', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor: isFirst ? 'not-allowed' : 'pointer', color: isFirst ? '#d1d5db' : '#374151' }}>
              {tr.howto_back}
            </button>
            <button type="button" onClick={next}
              style={{ flex:2, padding:'12px', background:`linear-gradient(135deg, ${mod.color}, ${mod.color}cc)`, border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', color:'white' }}>
              {isLast ? tr.howto_start_over : activeStep === mod.steps.length - 1 ? tr.howto_next_module : tr.howto_next}
            </button>
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div style={{ textAlign:'center', fontSize:11, color:'#9ca3af', marginBottom:16 }}>
        {tr.howto_swipe_hint}
      </div>

      {/* All modules list */}
      <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:10 }}>{tr.howto_all_modules}</div>
      {MODULES.map((m, mi) => {
        const done = completedModules.includes(mi)
        const active = activeModule === mi
        const progress = active ? (activeStep + 1) / m.steps.length : done ? 1 : 0
        return (
          <div key={mi} onClick={() => { go(mi, 0); window.scrollTo(0,0) }}
            style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:12, padding:'12px 14px', marginBottom:8, cursor:'pointer',
              border:`1.5px solid ${active ? m.color : done ? m.color+'44' : '#e5e7eb'}`,
              boxShadow: active ? `0 0 0 3px ${m.color}22` : 'none' }}>
            <div style={{ width:42, height:42, borderRadius:12, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{m.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{m.module}</div>
              <div style={{ fontSize:11, color:'#9ca3af', marginBottom:4 }}>{interpolate(tr.howto_steps_count, { n: m.steps.length })}</div>
              <div style={{ height:4, background:'#f3f4f6', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${progress*100}%`, height:'100%', background:m.color, borderRadius:2, transition:'width 0.4s' }} />
              </div>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color: done ? '#1D9E75' : active ? m.color : '#9ca3af', flexShrink:0 }}>
              {done ? tr.howto_done : active ? `${activeStep + 1}/${m.steps.length}` : tr.howto_start_arrow}
            </div>
          </div>
        )
      })}
    </div>
  )
}
