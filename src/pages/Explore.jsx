import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'
import VideoCard from '../components/VideoCard'

const GROUPS = [
  {
    label: '💰 Budgeting & Tracking',
    color: '#1D9E75',
    features: [
      { to:'/savings',       icon:'💰', label:'Savings Goals',     desc:'Set & track goals',          color:'#1D9E75', bg:'#E1F5EE' },
      { to:'/bills',         icon:'🔔', label:'Bill Reminders',    desc:'Never miss a payment',       color:'#BA7517', bg:'#FAEEDA' },
      { to:'/giving',        icon:'🎁', label:'Giving & Tithe',    desc:'Track generosity',           color:'#C2185B', bg:'#FCE4EC' },
      { to:'/family',        icon:'👨‍👩‍👧‍👦', label:'Family Budget',    desc:'Budget as a household',      color:'#0F6E56', bg:'#D4EDDA' },
      { to:'/receipts',      icon:'📸', label:'Receipt Scanner',   desc:'Scan & store receipts',      color:'#534AB7', bg:'#EEEDFE' },
      { to:'/report',        icon:'📄', label:'Budget Report',     desc:'Download PDF report',        color:'#3B6D11', bg:'#EAF3DE' },
    ],
  },
  {
    label: '📊 Wealth & Debt',
    color: '#3B6D11',
    features: [
      { to:'/networth',      icon:'📊', label:'Net Worth',         desc:'Assets minus liabilities',   color:'#3B6D11', bg:'#EAF3DE' },
      { to:'/debtplanner',   icon:'📉', label:'Debt Planner',      desc:'Snowball vs Avalanche',      color:'#A32D2D', bg:'#FCEBEB' },
      { to:'/subscriptions', icon:'🔄', label:'Subscriptions',     desc:'Track recurring bills',      color:'#534AB7', bg:'#EEEDFE' },
      { to:'/currency',      icon:'💱', label:'Currency Converter',desc:'Live exchange rates',        color:'#185FA5', bg:'#EBF4FB' },
    ],
  },
  {
    label: '📈 Grow & Build Wealth',
    color: '#185FA5',
    features: [
      { to:'/challenge',  icon:'⭐', label:'$100 Challenge',    desc:'30-day transformation',      color:'#7A4D0F', bg:'#FFF3CD' },
      { to:'/realestate', icon:'🏠', label:'Real Estate Guide', desc:'Home buying steps',          color:'#8B5E3C', bg:'#F5EAE0' },
      { to:'/travel',     icon:'🧳', label:'Travel Planner',    desc:'Trips & document expiry',    color:'#534AB7', bg:'#EEEDFE' },
    ],
  },
  {
    label: '✦ Faith & Community',
    color: '#0F6E56',
    features: [
      { to:'/faith',       icon:'✦',  label:'Faith & Stewardship', desc:'Biblical wisdom',          color:'#0F6E56', bg:'#D4EDDA' },
      { to:'/community',   icon:'👥', label:'Community',           desc:'Grow together',            color:'#534AB7', bg:'#F0EFFE' },
      { to:'/immigration', icon:'✈️', label:'Immigration Tracker', desc:'Visas & deadlines',        color:'#534AB7', bg:'#EEEDFE' },
    ],
  },
  {
    label: '🛠️ Tools',
    color: '#5F5E5A',
    features: [
      { to:'/search',   icon:'🔍', label:'Global Search', desc:'Search all your data',        color:'#0ea5e9', bg:'#E0F2FE' },
      { to:'/howtouse', icon:'❓', label:'App Guide',     desc:'Interactive walkthrough',     color:'#5F5E5A', bg:'#F3F4F6' },
      { to:'/premium',  icon:'👑', label:'Go Premium',   desc:'Unlock all features',         color:'#BA7517', bg:'#FEF3CD' },
    ],
  },
]

function FeatureGrid({ features }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      {features.map(f => (
        <Link key={f.to} to={f.to} style={{ textDecoration:'none' }}>
          <div style={{
            background:'var(--white)', borderRadius:14, padding:'14px 12px',
            border:'1px solid var(--border)', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
            display:'flex', alignItems:'center', gap:10,
            transition:'box-shadow 0.15s',
          }}>
            <div style={{ width:38, height:38, borderRadius:11, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, flexShrink:0 }}>
              {f.icon}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:f.color, lineHeight:1.2, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.label}</div>
              <div style={{ fontSize:10, color:'#9ca3af', lineHeight:1.3 }}>{f.desc}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function Explore() {
  const tr = useT()

  return (
    <div style={{ paddingBottom:100 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius:'16px 16px 0 0', padding:'20px 16px 32px', marginBottom:'-16px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>🧭</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.exploreTitle||'Explore Features'}</h2>
        <p style={{ color:'rgba(255,255,255,0.85)', margin:0, fontSize:13 }}>{tr.exploreSub||'Everything Stewardship Hub has for you'}</p>
      </div>

      {/* AI Coach — featured solo card */}
      <Link to="/coach" style={{ textDecoration:'none', display:'block', marginTop:20, marginBottom:4 }}>
        <div style={{
          background:'linear-gradient(135deg, #185FA5, #0d3f70)',
          borderRadius:16, padding:'18px 20px',
          display:'flex', alignItems:'center', gap:16,
          boxShadow:'0 4px 16px rgba(24,95,165,0.25)',
        }}>
          <div style={{ width:56, height:56, borderRadius:16, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>🤖</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'white', marginBottom:3 }}>AI Financial Coach</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', lineHeight:1.5 }}>Chat with Claude for personalized financial advice — budgeting, investing, debt & more</div>
          </div>
          <div style={{ fontSize:22, color:'rgba(255,255,255,0.7)', flexShrink:0 }}>›</div>
        </div>
      </Link>

      {/* Promo video */}
      <div style={{ marginTop:16 }}>
        <VideoCard
          title="See Stewardship Hub in Action"
          subtitle="Watch how the app helps you budget, invest & grow"
        />
      </div>

      {/* Grouped sections */}
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {GROUPS.map(group => (
          <div key={group.label}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:4, height:18, borderRadius:2, background:group.color }} />
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{group.label}</span>
            </div>
            <FeatureGrid features={group.features} />
          </div>
        ))}
      </div>

      {/* Settings link */}
      <div style={{ marginTop:20 }}>
        <Link to="/settings" style={{ textDecoration:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, background:'white', borderRadius:14, padding:'14px 16px', border:'1px solid #e5e7eb', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>⚙️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#374151' }}>{tr.settings||'Settings'}</div>
              <div style={{ fontSize:11, color:'#6b7280' }}>{tr.settingsSubtitle||'Profile, currency, language & more'}</div>
            </div>
            <span style={{ color:'#9ca3af', fontSize:18 }}>›</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
