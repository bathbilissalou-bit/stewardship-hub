import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'
import VideoCard from '../components/VideoCard'

// ── Recent-page tracking ──────────────────────────────────────────────────────
const RECENT_KEY = 'sh_explore_recent'
const FALLBACK_RECENT = ['/budget', '/savings', '/bills', '/coach']

function getRecent() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return stored.length >= 2 ? stored.slice(0, 5) : FALLBACK_RECENT
  } catch { return FALLBACK_RECENT }
}
function saveRecent(to) {
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(p => p !== to)
    localStorage.setItem(RECENT_KEY, JSON.stringify([to, ...prev].slice(0, 5)))
  } catch {}
}

// ── Feature registry — single source of truth ────────────────────────────────
const F = {
  '/budget':        { icon:'💳', label:'Budget',              shortLabel:'Budget',      desc:'Monthly budget tracker',           color:'#1D9E75', bg:'rgba(29,158,117,0.1)'  },
  '/savings':       { icon:'💰', label:'Savings Goals',       shortLabel:'Savings',     desc:'Set & track your goals',           color:'#1D9E75', bg:'rgba(29,158,117,0.1)'  },
  '/bills':         { icon:'🔔', label:'Bill Reminders',      shortLabel:'Bills',       desc:'Never miss a payment',             color:'#D97706', bg:'rgba(217,119,6,0.1)'   },
  '/family':        { icon:'🏠', label:'Family Budget',       shortLabel:'Family',      desc:'Budget as a household',            color:'#0F6E56', bg:'rgba(15,110,86,0.1)'   },
  '/giving':        { icon:'🎁', label:'Giving & Tithe',      shortLabel:'Giving',      desc:'Track generosity & offerings',     color:'#BE185D', bg:'rgba(190,24,93,0.1)'   },
  '/nutrition':     { icon:'🥗', label:'Food & Nutrition',    shortLabel:'Nutrition',   desc:'Recipes, weight & wellness',       color:'#059669', bg:'rgba(5,150,105,0.1)'   },
  '/challenge':     { icon:'⭐', label:'$100 Challenge',      shortLabel:'Challenge',   desc:'30-day financial reset',           color:'#92400E', bg:'rgba(146,64,14,0.1)'   },
  '/networth':      { icon:'📊', label:'Net Worth',           shortLabel:'Net Worth',   desc:'Assets minus liabilities',         color:'#1D4ED8', bg:'rgba(29,78,216,0.1)'   },
  '/debtplanner':   { icon:'📉', label:'Debt Planner',        shortLabel:'Debt',        desc:'Snowball & Avalanche methods',     color:'#991B1B', bg:'rgba(153,27,27,0.1)'   },
  '/subscriptions': { icon:'🔄', label:'Subscriptions',       shortLabel:'Subs',        desc:'Track recurring charges',          color:'#6D28D9', bg:'rgba(109,40,217,0.1)'  },
  '/travel':        { icon:'🧳', label:'Travel Planner',      shortLabel:'Travel',      desc:'Trips & document expiry',          color:'#0369A1', bg:'rgba(3,105,161,0.1)'   },
  '/faith':         { icon:'✦',  label:'Faith & Stewardship', shortLabel:'Faith',       desc:'Biblical wisdom for your finances', color:'#064E3B', bg:'rgba(6,78,59,0.1)'    },
  '/community':     { icon:'👥', label:'Community',           shortLabel:'Community',   desc:'Grow together',                    color:'#4338CA', bg:'rgba(67,56,202,0.1)'   },
  '/birthdays':     { icon:'🎂', label:'Birthdays',           shortLabel:'Birthdays',   desc:'Never miss a celebration',         color:'#9D174D', bg:'rgba(157,23,77,0.1)'   },
  '/currency':      { icon:'💱', label:'Currency',            shortLabel:'Currency',    desc:'Live exchange rates',              color:'#1E40AF', bg:'rgba(30,64,175,0.1)'   },
  '/receipts':      { icon:'📸', label:'Receipts',            shortLabel:'Receipts',    desc:'Scan & organise',                  color:'#5B21B6', bg:'rgba(91,33,182,0.1)'   },
  '/report':        { icon:'📄', label:'Budget Report',       shortLabel:'Report',      desc:'Download PDF report',              color:'#166534', bg:'rgba(22,101,52,0.1)'   },
  '/search':        { icon:'🔍', label:'Search',              shortLabel:'Search',      desc:'Find anything instantly',          color:'#0284C7', bg:'rgba(2,132,199,0.1)'   },
  '/howtouse':      { icon:'📖', label:'App Guide',           shortLabel:'Guide',       desc:'Learn every feature',              color:'#374151', bg:'rgba(55,65,81,0.1)'    },
  '/premium':       { icon:'👑', label:'Go Premium',          shortLabel:'Premium',     desc:'Unlock all features',              color:'#B45309', bg:'rgba(180,83,9,0.1)'    },
  '/coach':         { icon:'🤖', label:'AI Coach',            shortLabel:'Coach',       desc:'Personalised financial advice',    color:'#1E40AF', bg:'rgba(30,64,175,0.1)'   },
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const R = { sm:12, md:16, lg:20 }   // border-radius
const S = {                          // shadows
  soft:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  card:  '0 2px 8px rgba(0,0,0,0.07)',
  none:  'none',
}

// ── Reusable card components ──────────────────────────────────────────────────

/** Standard 2-col grid card — icon + title + desc, vertical layout */
function GridCard({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'flex', flex:1 }}>
      <div style={{
        flex:1, background:'var(--white)', borderRadius:R.lg, padding:'16px 14px',
        border:'1px solid var(--border)', boxShadow:S.soft,
        display:'flex', flexDirection:'column', gap:12,
        transition:'transform 0.1s',
      }}>
        <div style={{
          width:44, height:44, borderRadius:R.md, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0,
        }}>
          {f.icon}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1.3, marginBottom:4 }}>{f.label}</div>
          <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.5 }}>{f.desc}</div>
        </div>
      </div>
    </Link>
  )
}

/** Full-width horizontal row card — icon left, title + desc right */
function RowCard({ to, iconSize = 48, showArrow = true }) {
  const f = F[to] || {}
  const iSize = iconSize
  const fontSize = iSize >= 48 ? 24 : 20
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'block' }}>
      <div style={{
        background:'var(--white)', borderRadius:R.lg, padding:'16px 18px',
        border:'1px solid var(--border)', boxShadow:S.soft,
        display:'flex', alignItems:'center', gap:16,
      }}>
        <div style={{
          width:iSize, height:iSize, borderRadius:R.md, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize, flexShrink:0,
        }}>
          {f.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{f.label}</div>
          <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.5 }}>{f.desc}</div>
        </div>
        {showArrow && <div style={{ fontSize:20, color:'#d1d5db', flexShrink:0 }}>›</div>}
      </div>
    </Link>
  )
}

/** Tool chip — compact vertical card for the tools strip */
function ToolChip({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', flexShrink:0 }}>
      <div style={{
        width:80, background:'var(--white)', borderRadius:R.md, padding:'12px 8px',
        border:'1px solid var(--border)',
        display:'flex', flexDirection:'column', alignItems:'center', gap:7,
      }}>
        <div style={{
          width:40, height:40, borderRadius:R.sm, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
        }}>
          {f.icon}
        </div>
        <div style={{ fontSize:10, fontWeight:600, color:'var(--text)', textAlign:'center', lineHeight:1.3 }}>{f.shortLabel}</div>
      </div>
    </Link>
  )
}

/** Recent-access chip — small pill with icon + label */
function RecentChip({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', flexShrink:0 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        background:'var(--white)', borderRadius:40, paddingLeft:10, paddingRight:14, paddingTop:8, paddingBottom:8,
        border:'1px solid var(--border)', boxShadow:S.soft,
      }}>
        <div style={{ width:28, height:28, borderRadius:8, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{f.icon}</div>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap' }}>{f.shortLabel}</span>
      </div>
    </Link>
  )
}

/** Section label with optional right link */
function SectionLabel({ title, sub }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', letterSpacing:'-0.3px' }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:'#9ca3af', marginTop:3, fontWeight:400 }}>{sub}</div>}
    </div>
  )
}

/** Thin section divider */
function Divider() {
  return <div style={{ height:1, background:'var(--border)', margin:'28px 0', opacity:0.6 }} />
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Explore() {
  const tr = useT()
  const [recent, setRecent] = useState([])

  useEffect(() => {
    setRecent(getRecent())
  }, [])

  return (
    <div style={{ paddingBottom:110 }}>

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div style={{
        padding:'24px 16px 20px',
        background:'linear-gradient(160deg, rgba(29,158,117,0.07) 0%, rgba(15,110,86,0.03) 100%)',
        borderBottom:'1px solid var(--border)',
        marginBottom:20,
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#1D9E75', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>
          Stewardship Hub
        </div>
        <h2 style={{ margin:'0 0 4px', fontSize:26, fontWeight:900, color:'var(--text)', letterSpacing:'-0.5px', lineHeight:1.1 }}>
          {tr.exploreTitle || 'Explore'}
        </h2>
        <p style={{ margin:'0 0 18px', fontSize:13, color:'#6b7280', lineHeight:1.5 }}>
          {tr.exploreSub || 'Everything Stewardship Hub has for you'}
        </p>

        {/* Quick action pills */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
          {['/budget', '/savings', '/bills', '/coach'].map(to => {
            const f = F[to] || {}
            return (
              <Link key={to} to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', flexShrink:0 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:'var(--white)', borderRadius:40,
                  paddingLeft:12, paddingRight:14, paddingTop:9, paddingBottom:9,
                  border:'1px solid var(--border)', boxShadow:S.soft,
                }}>
                  <span style={{ fontSize:15 }}>{f.icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap' }}>{f.shortLabel}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* ── Recently visited ─────────────────────────────────────────── */}
        {recent.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>
              Recently Used
            </div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
              {recent.map(to => <RecentChip key={to} to={to} />)}
            </div>
          </div>
        )}

        {/* ── AI Coach — flagship card ─────────────────────────────────── */}
        <div style={{ marginBottom:28 }}>
          <Link to="/coach" onClick={() => saveRecent('/coach')} style={{ textDecoration:'none', display:'block' }}>
            <div style={{
              background:'linear-gradient(135deg, #1a3a6c 0%, #0d3f70 50%, #0a2d52 100%)',
              borderRadius:R.lg + 2, padding:'20px 20px',
              display:'flex', alignItems:'center', gap:16,
              boxShadow:'0 4px 20px rgba(13,63,112,0.3)',
            }}>
              <div style={{
                width:56, height:56, borderRadius:18, background:'rgba(255,255,255,0.12)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0,
              }}>
                🤖
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>
                  Powered by Claude AI
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:'white', marginBottom:4, letterSpacing:'-0.2px' }}>
                  AI Financial Coach
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>
                  Personalised advice on budgeting, investing & debt
                </div>
              </div>
              <div style={{ fontSize:22, color:'rgba(255,255,255,0.4)', flexShrink:0 }}>›</div>
            </div>
          </Link>
        </div>

        <Divider />

        {/* ── Core Features ────────────────────────────────────────────── */}
        <SectionLabel title="Core Features" sub="The most important tools for your financial life" />

        {/* Row 1: Savings + Bills */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <GridCard to="/savings" />
          <GridCard to="/bills" />
        </div>

        {/* Row 2: Family + Giving */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <GridCard to="/family" />
          <GridCard to="/giving" />
        </div>

        {/* Row 3: Nutrition full-width */}
        <div style={{ marginBottom:10 }}>
          <RowCard to="/nutrition" />
        </div>

        {/* Row 4: Challenge full-width */}
        <div style={{ marginBottom:0 }}>
          <RowCard to="/challenge" />
        </div>

        <Divider />

        {/* ── Wealth & Growth ──────────────────────────────────────────── */}
        <SectionLabel title="Wealth & Growth" sub="Build, track and protect your financial future" />

        {/* Row 1: Net Worth + Debt Planner */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <GridCard to="/networth" />
          <GridCard to="/debtplanner" />
        </div>

        {/* Row 2: Subscriptions + Travel */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:0 }}>
          <GridCard to="/subscriptions" />
          <GridCard to="/travel" />
        </div>

        <Divider />

        {/* ── Faith & Community — warm section ─────────────────────────── */}
        <div style={{
          background:'linear-gradient(160deg, rgba(6,78,59,0.05) 0%, rgba(67,56,202,0.03) 100%)',
          borderRadius:R.lg, padding:'20px 16px', margin:'0 -16px',
          borderTop:'1px solid rgba(6,78,59,0.1)', borderBottom:'1px solid rgba(6,78,59,0.08)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span style={{ fontSize:16 }}>✦</span>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', letterSpacing:'-0.3px' }}>Faith & Community</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Grow in wisdom, purpose & generosity</div>
            </div>
          </div>

          {/* Faith — featured card */}
          <Link to="/faith" onClick={() => saveRecent('/faith')} style={{ textDecoration:'none', display:'block', marginBottom:10 }}>
            <div style={{
              background:'linear-gradient(135deg, rgba(6,78,59,0.08) 0%, rgba(6,78,59,0.04) 100%)',
              borderRadius:R.lg, padding:'18px 18px',
              border:'1px solid rgba(6,78,59,0.15)',
              display:'flex', alignItems:'center', gap:16,
            }}>
              <div style={{
                width:52, height:52, borderRadius:16, background:'rgba(6,78,59,0.12)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0,
              }}>
                ✦
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#064E3B', marginBottom:4 }}>Faith & Stewardship</div>
                <div style={{ fontSize:12, color:'#374151', lineHeight:1.55, opacity:0.8 }}>
                  Biblical wisdom and principles for managing your finances with purpose
                </div>
              </div>
              <div style={{ fontSize:20, color:'rgba(6,78,59,0.4)', flexShrink:0 }}>›</div>
            </div>
          </Link>

          {/* Community + Birthdays */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {['/community', '/birthdays'].map(to => {
              const f = F[to] || {}
              return (
                <Link key={to} to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none' }}>
                  <div style={{
                    background:'var(--white)', borderRadius:R.md, padding:'14px 14px',
                    border:'1px solid var(--border)', boxShadow:S.soft,
                    display:'flex', flexDirection:'column', gap:10,
                  }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                      {f.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{f.label}</div>
                      <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.45 }}>{f.desc}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <Divider />

        {/* ── Tools & Utilities ─────────────────────────────────────────── */}
        <SectionLabel title="Tools & Utilities" sub="Quick access to helper tools" />

        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, scrollbarWidth:'none', marginBottom:0 }}>
          {['/currency', '/receipts', '/report', '/search', '/howtouse', '/premium'].map(to => (
            <ToolChip key={to} to={to} />
          ))}
        </div>

        <Divider />

        {/* ── App Tour — subdued ────────────────────────────────────────── */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#9ca3af', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>
            App Tour
          </div>
          <div style={{ borderRadius:R.lg, overflow:'hidden', border:'1px solid var(--border)' }}>
            <VideoCard
              title="See Stewardship Hub in Action"
              subtitle="A quick walkthrough of the key features"
            />
          </div>
        </div>

        {/* ── Settings ─────────────────────────────────────────────────── */}
        <Link to="/settings" style={{ textDecoration:'none', display:'block' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:14,
            background:'var(--white)', borderRadius:R.lg, padding:'16px 18px',
            border:'1px solid var(--border)', boxShadow:S.soft,
          }}>
            <div style={{ width:44, height:44, borderRadius:R.md, background:'rgba(55,65,81,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              ⚙️
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{tr.settings || 'Settings'}</div>
              <div style={{ fontSize:11, color:'#6b7280' }}>{tr.settingsSubtitle || 'Profile, currency, language & more'}</div>
            </div>
            <span style={{ color:'#d1d5db', fontSize:20 }}>›</span>
          </div>
        </Link>

      </div>
    </div>
  )
}
