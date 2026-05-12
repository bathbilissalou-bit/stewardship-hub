import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'
import VideoCard from '../components/VideoCard'

// ─────────────────────────────────────────────────────────────────────────────
// RECENT-PAGE TRACKING
// ─────────────────────────────────────────────────────────────────────────────
const RECENT_KEY = 'sh_explore_recent'
const DEFAULT_RECENT = ['/budget', '/savings', '/bills', '/coach']

function getRecent() {
  try {
    const s = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return s.length >= 2 ? s.slice(0, 5) : DEFAULT_RECENT
  } catch { return DEFAULT_RECENT }
}
function saveRecent(to) {
  try {
    const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(p => p !== to)
    localStorage.setItem(RECENT_KEY, JSON.stringify([to, ...prev].slice(0, 5)))
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// GREETING
// ─────────────────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE REGISTRY  ·  5 palette families
// Forest Green  #1D8C6A · Warm Teal #1A6878 · Warm Gold #C28A35
// Terra Cotta   #8C4040 · Dusty Rose #8B4A5A
// ─────────────────────────────────────────────────────────────────────────────
const F = {
  '/budget':        { icon:'💳', label:'Budget',              short:'Budget',     desc:'Monthly budget tracker',            c:'#1D8C6A', bg:'rgba(29,140,106,0.1)'  },
  '/savings':       { icon:'💰', label:'Savings Goals',       short:'Savings',    desc:'Set & track your goals',            c:'#1D8C6A', bg:'rgba(29,140,106,0.1)'  },
  '/bills':         { icon:'🔔', label:'Bill Reminders',      short:'Bills',      desc:'Never miss a payment',              c:'#C28A35', bg:'rgba(194,138,53,0.1)'  },
  '/family':        { icon:'🏠', label:'Family Budget',       short:'Family',     desc:'Budget as a household',             c:'#8B4A5A', bg:'rgba(139,74,90,0.1)'   },
  '/giving':        { icon:'🎁', label:'Giving & Tithe',      short:'Giving',     desc:'Track generosity & offerings',      c:'#8B4A5A', bg:'rgba(139,74,90,0.1)'   },
  '/nutrition':     { icon:'🥗', label:'Food & Nutrition',    short:'Nutrition',  desc:'Recipes, weight & wellness',        c:'#1D8C6A', bg:'rgba(29,140,106,0.1)'  },
  '/challenge':     { icon:'⭐', label:'$100 Challenge',      short:'Challenge',  desc:'30-day financial reset',            c:'#C28A35', bg:'rgba(194,138,53,0.1)'  },
  '/networth':      { icon:'📊', label:'Net Worth',           short:'Net Worth',  desc:'Assets minus liabilities',          c:'#1A6878', bg:'rgba(26,104,120,0.1)'  },
  '/debtplanner':   { icon:'📉', label:'Debt Planner',        short:'Debt',       desc:'Snowball & Avalanche methods',      c:'#8C4040', bg:'rgba(140,64,64,0.1)'   },
  '/subscriptions': { icon:'🔄', label:'Subscriptions',       short:'Subs',       desc:'Track recurring charges',           c:'#C28A35', bg:'rgba(194,138,53,0.1)'  },
  '/travel':        { icon:'🧳', label:'Travel Planner',      short:'Travel',     desc:'Trips & document expiry',           c:'#1A6878', bg:'rgba(26,104,120,0.1)'  },
  '/faith':         { icon:'✦',  label:'Faith & Stewardship', short:'Faith',      desc:'Biblical wisdom for your finances', c:'#1D8C6A', bg:'rgba(29,140,106,0.1)'  },
  '/community':     { icon:'👥', label:'Community',           short:'Community',  desc:'Grow together',                    c:'#8B4A5A', bg:'rgba(139,74,90,0.1)'   },
  '/birthdays':     { icon:'🎂', label:'Birthdays',           short:'Birthdays',  desc:'Never miss a celebration',         c:'#8B4A5A', bg:'rgba(139,74,90,0.1)'   },
  '/currency':      { icon:'💱', label:'Currency',            short:'Currency',   desc:'Live exchange rates',               c:'#1A6878', bg:'rgba(26,104,120,0.1)'  },
  '/receipts':      { icon:'📸', label:'Receipts',            short:'Receipts',   desc:'Scan & organise',                  c:'#1A6878', bg:'rgba(26,104,120,0.1)'  },
  '/report':        { icon:'📄', label:'Budget Report',       short:'Report',     desc:'Download PDF report',              c:'#1D8C6A', bg:'rgba(29,140,106,0.1)'  },
  '/search':        { icon:'🔍', label:'Search',              short:'Search',     desc:'Find anything instantly',          c:'#1A6878', bg:'rgba(26,104,120,0.1)'  },
  '/howtouse':      { icon:'📖', label:'App Guide',           short:'Guide',      desc:'Learn every feature',              c:'#706B65', bg:'rgba(112,107,101,0.1)' },
  '/premium':       { icon:'👑', label:'Go Premium',          short:'Premium',    desc:'Unlock all features',              c:'#C28A35', bg:'rgba(194,138,53,0.1)'  },
  '/coach':         { icon:'🤖', label:'AI Coach',            short:'Coach',      desc:'Personalised financial advice',    c:'#1A6878', bg:'rgba(26,104,120,0.1)'  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const shadow = {
  xs:  '0 1px 2px rgba(43,40,37,0.06)',
  sm:  '0 1px 4px rgba(43,40,37,0.07), 0 1px 2px rgba(43,40,37,0.05)',
  md:  '0 3px 10px rgba(43,40,37,0.09)',
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD COMPONENTS  ·  4-level visual hierarchy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LEVEL 1 — FlagshipCard
 * Used once: AI Coach. Dark gradient, maximum presence.
 */
function FlagshipCard({ to, eyebrow, title, desc, iconSize = 56 }) {
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'block' }}>
      <div style={{
        background:'linear-gradient(135deg, #0d3028 0%, #081e16 100%)',
        borderRadius:20, padding:'22px 20px',
        display:'flex', alignItems:'center', gap:16,
        boxShadow:'0 6px 24px rgba(8,30,22,0.45)',
      }}>
        <div style={{
          width:iconSize, height:iconSize, borderRadius:18,
          background:'rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:Math.round(iconSize * 0.5), flexShrink:0,
        }}>
          🤖
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          {eyebrow && (
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>
              {eyebrow}
            </div>
          )}
          <div style={{ fontSize:16, fontWeight:800, color:'#fff', letterSpacing:'-0.2px', marginBottom:4 }}>{title}</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', lineHeight:1.55 }}>{desc}</div>
        </div>
        <div style={{ fontSize:22, color:'rgba(255,255,255,0.3)', flexShrink:0 }}>›</div>
      </div>
    </Link>
  )
}

/**
 * LEVEL 2 — FeaturedCard
 * Full-width tinted card for the most important feature in a section.
 * Noticeably larger and more colourful than a regular card.
 */
function FeaturedCard({ to, cta }) {
  const f = F[to] || {}
  // Derive a very light wash from the feature color
  const washBg = f.bg?.replace('0.1)', '0.07)') || 'rgba(29,140,106,0.07)'
  const borderCol = f.bg?.replace('0.1)', '0.18)') || 'rgba(29,140,106,0.18)'
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'block' }}>
      <div style={{
        background:washBg,
        borderRadius:18, padding:'20px 20px',
        border:`1px solid ${borderCol}`,
        display:'flex', alignItems:'center', gap:18,
      }}>
        <div style={{
          width:54, height:54, borderRadius:16,
          background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:26, flexShrink:0,
        }}>
          {f.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:f.c, letterSpacing:'-0.2px', marginBottom:4 }}>{f.label}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.55 }}>{f.desc}</div>
          {cta && (
            <div style={{ fontSize:11, fontWeight:700, color:f.c, marginTop:8, opacity:0.8 }}>{cta} →</div>
          )}
        </div>
        <div style={{ fontSize:20, color:f.bg?.replace('0.1)', '0.4)'), flexShrink:0 }}>›</div>
      </div>
    </Link>
  )
}

/**
 * LEVEL 3 — GridCard
 * Half-width vertical card. The standard workhorse.
 * Icon top, label + desc below.
 */
function GridCard({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'flex', flex:1 }}>
      <div style={{
        flex:1, background:'var(--white)', borderRadius:16, padding:'16px 14px',
        border:'1px solid var(--border)', boxShadow:shadow.sm,
        display:'flex', flexDirection:'column', gap:12,
      }}>
        <div style={{
          width:44, height:44, borderRadius:13, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
        }}>
          {f.icon}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1.3, marginBottom:4 }}>{f.label}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>{f.desc}</div>
        </div>
      </div>
    </Link>
  )
}

/**
 * LEVEL 4 — ToolCard
 * Compact 3-col card for utility tools.
 * Smaller icon, label only, no description.
 */
function ToolCard({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none' }}>
      <div style={{
        background:'var(--white)', borderRadius:14, padding:'14px 10px',
        border:'1px solid var(--border)', boxShadow:shadow.xs,
        display:'flex', flexDirection:'column', alignItems:'center', gap:8,
      }}>
        <div style={{
          width:38, height:38, borderRadius:11, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:19,
        }}>
          {f.icon}
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--text)', textAlign:'center', lineHeight:1.3 }}>{f.short}</div>
      </div>
    </Link>
  )
}

/**
 * RecentChip — horizontal-scroll pill in "Continue" strip
 */
function RecentChip({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', flexShrink:0 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        background:'var(--white)', borderRadius:40,
        paddingLeft:9, paddingRight:13, paddingTop:7, paddingBottom:7,
        border:'1px solid var(--border)', boxShadow:shadow.xs,
      }}>
        <div style={{ width:26, height:26, borderRadius:8, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
          {f.icon}
        </div>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap' }}>{f.short}</span>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

/** Section header with coloured accent bar */
function SectionHeader({ title, sub, accent = '#1D8C6A' }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:3 }}>
        <div style={{ width:3, height:20, borderRadius:2, background:accent, flexShrink:0 }} />
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', letterSpacing:'-0.3px' }}>{title}</div>
      </div>
      {sub && <div style={{ fontSize:12, color:'var(--text-muted)', paddingLeft:12 }}>{sub}</div>}
    </div>
  )
}

/** Full-bleed tinted section wrapper — subtle background to break up the page */
function TintedSection({ children, tint = 'rgba(29,140,106,0.04)', borderColor = 'rgba(29,140,106,0.1)' }) {
  return (
    <div style={{
      background:tint,
      margin:'0 -16px',
      padding:'24px 16px',
      borderTop:`1px solid ${borderColor}`,
      borderBottom:`1px solid ${borderColor}`,
    }}>
      {children}
    </div>
  )
}

function Gap({ h = 10 }) {
  return <div style={{ height:h }} />
}
function Divider() {
  return <div style={{ height:1, background:'var(--border)', margin:'24px 0', opacity:0.7 }} />
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Explore() {
  const tr = useT()
  const [recent, setRecent] = useState([])
  const [greeting] = useState(getGreeting)

  useEffect(() => { setRecent(getRecent()) }, [])

  return (
    <div style={{ paddingBottom:110 }}>

      {/* ══════════════════════════════════════════════════════════════════
          TOP AREA  ·  Greeting + quick actions
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        padding:'22px 16px 18px',
        borderBottom:'1px solid var(--border)',
        marginBottom:22,
      }}>
        {/* Greeting */}
        <div style={{ fontSize:11, fontWeight:700, color:'var(--green)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>
          Stewardship Hub
        </div>
        <div style={{ fontSize:24, fontWeight:900, color:'var(--text)', letterSpacing:'-0.5px', lineHeight:1.15, marginBottom:3 }}>
          {greeting}, Steward
        </div>
        <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5, marginBottom:18 }}>
          Your financial life, organised.
        </div>

        {/* Quick-action pills */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:1, scrollbarWidth:'none' }}>
          {['/budget', '/savings', '/bills', '/coach'].map(to => {
            const f = F[to] || {}
            return (
              <Link key={to} to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', flexShrink:0 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:'var(--white)', borderRadius:40,
                  padding:'8px 13px', border:'1px solid var(--border)', boxShadow:shadow.xs,
                }}>
                  <span style={{ fontSize:14 }}>{f.icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap' }}>{f.short}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* ── Continue where you left off ──────────────────────────────── */}
        {recent.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:10 }}>
              Continue where you left off
            </div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
              {recent.map(to => <RecentChip key={to} to={to} />)}
            </div>
          </div>
        )}

        {/* ── AI Coach — Level 1 Flagship ──────────────────────────────── */}
        <FlagshipCard
          to="/coach"
          eyebrow="Powered by Claude AI"
          title="AI Financial Coach"
          desc="Personalised advice on budgeting, debt, investing & intentional living"
        />

        <Divider />

        {/* ══════════════════════════════════════════════════════════════════
            YOUR FINANCES  ·  Core daily tools
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader
          title="Your Finances"
          sub="Daily tools for managing money with intention"
          accent="#1D8C6A"
        />

        {/* Savings Goals — Featured (Level 2) */}
        <FeaturedCard to="/savings" cta="Track your progress" />
        <Gap />

        {/* Bill Reminders + Family Budget — 2-col (Level 3) */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/bills" />
          <GridCard to="/family" />
        </div>
        <Gap />

        {/* Giving & Tithe + Food & Nutrition — 2-col (Level 3) */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/giving" />
          <GridCard to="/nutrition" />
        </div>

        <Divider />

        {/* ══════════════════════════════════════════════════════════════════
            DISCIPLINE & GROWTH  ·  Build wealth, break habits
        ══════════════════════════════════════════════════════════════════ */}
      </div>

      {/* Tinted section for visual separation */}
      <TintedSection tint="rgba(194,138,53,0.04)" borderColor="rgba(194,138,53,0.12)">
        <SectionHeader
          title="Discipline & Growth"
          sub="Build wealth and create lasting financial habits"
          accent="#C28A35"
        />

        {/* $100 Challenge — Featured gold (Level 2) */}
        <FeaturedCard to="/challenge" cta="Start your 30-day journey" />
        <Gap />

        {/* Net Worth + Debt Planner — 2-col */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/networth" />
          <GridCard to="/debtplanner" />
        </div>
        <Gap />

        {/* Subscriptions + Travel — 2-col */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/subscriptions" />
          <GridCard to="/travel" />
        </div>
      </TintedSection>

      <div style={{ padding:'0 16px' }}>
        <Divider />

        {/* ══════════════════════════════════════════════════════════════════
            FAITH & COMMUNITY  ·  Wisdom and connection
        ══════════════════════════════════════════════════════════════════ */}
      </div>

      <TintedSection tint="rgba(29,140,106,0.05)" borderColor="rgba(29,140,106,0.12)">
        <SectionHeader
          title="Faith & Community"
          sub="Grow in wisdom, generosity and purpose"
          accent="#1D8C6A"
        />

        {/* Faith & Stewardship — Featured (Level 2) */}
        <FeaturedCard to="/faith" cta="Explore biblical wisdom" />
        <Gap />

        {/* Community + Birthdays — 2-col */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/community" />
          <GridCard to="/birthdays" />
        </div>
      </TintedSection>

      <div style={{ padding:'0 16px' }}>
        <Divider />

        {/* ══════════════════════════════════════════════════════════════════
            UTILITY TOOLS  ·  Quick helpers (secondary / compact)
        ══════════════════════════════════════════════════════════════════ */}
        <SectionHeader
          title="Tools"
          sub="Quick helpers — always within reach"
          accent="#706B65"
        />

        {/* 3-column grid — all visible at once, no horizontal scroll */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
          {['/currency', '/receipts', '/report', '/search', '/howtouse', '/premium'].map(to => (
            <ToolCard key={to} to={to} />
          ))}
        </div>

        <Divider />

        {/* ── Settings ─────────────────────────────────────────────────── */}
        <Link to="/settings" onClick={() => saveRecent('/settings')} style={{ textDecoration:'none', display:'block', marginBottom:20 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:14,
            background:'var(--white)', borderRadius:16, padding:'16px 18px',
            border:'1px solid var(--border)', boxShadow:shadow.sm,
          }}>
            <div style={{ width:44, height:44, borderRadius:13, background:'rgba(112,107,101,0.09)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              ⚙️
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{tr.settings || 'Settings'}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{tr.settingsSubtitle || 'Profile, currency, language & more'}</div>
            </div>
            <span style={{ color:'var(--border-mid)', fontSize:20 }}>›</span>
          </div>
        </Link>

        {/* ── App Tour — subdued, at the very bottom ───────────────────── */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:10 }}>
            Watch App Tour
          </div>
          <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid var(--border)' }}>
            <VideoCard
              title="See Stewardship Hub in Action"
              subtitle="A quick walkthrough of every feature"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
