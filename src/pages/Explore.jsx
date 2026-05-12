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
// CONTEXTUAL DATA  ·  Greeting · Date · Verse · Suggestion
// ─────────────────────────────────────────────────────────────────────────────
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getDateStr() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function getTimeContext() {
  const h = new Date().getHours()
  if (h < 12) return {
    greeting:   'Good morning',
    tagline:    'Start your day with clarity and intention.',
    suggestion: { to: '/budget',   reason: 'Review this month\'s budget to stay on track' },
  }
  if (h < 17) return {
    greeting:   'Good afternoon',
    tagline:    'Every decision today shapes tomorrow\'s freedom.',
    suggestion: { to: '/receipts', reason: 'Log recent purchases while they\'re still fresh' },
  }
  if (h < 21) return {
    greeting:   'Good evening',
    tagline:    'A moment to reflect — you\'re building something lasting.',
    suggestion: { to: '/savings',  reason: 'Check your progress toward your goals' },
  }
  return {
    greeting:   'Good night',
    tagline:    'Rest well. Faithful stewardship pays off over time.',
    suggestion: { to: '/giving',   reason: 'Reflect on today\'s generosity' },
  }
}

// One verse per day of the week (0 = Sunday)
const DAILY_VERSES = [
  { ref: 'Proverbs 3:9',     text: 'Honour the Lord with your wealth and with the firstfruits of all your produce.' },
  { ref: 'Luke 16:10',       text: 'Whoever is faithful in very little is also faithful in much.' },
  { ref: 'Matthew 6:21',     text: 'For where your treasure is, there your heart will be also.' },
  { ref: 'Proverbs 22:7',    text: 'The borrower is servant to the lender.' },
  { ref: 'Deuteronomy 8:18', text: 'Remember the Lord your God, for it is he who gives you the ability to produce wealth.' },
  { ref: '1 Timothy 6:6',    text: 'Godliness with contentment is great gain.' },
  { ref: 'Malachi 3:10',     text: 'Bring the whole tithe into the storehouse, that there may be food in my house.' },
]
const getDailyVerse = () => DAILY_VERSES[new Date().getDay()]

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE REGISTRY  ·  5-family palette
// ─────────────────────────────────────────────────────────────────────────────
const F = {
  '/budget':        { icon:'💳', label:'Budget',              short:'Budget',     desc:'Monthly budget tracker',            c:'#1D8C6A', bg:'rgba(29,140,106,0.10)' },
  '/savings':       { icon:'💰', label:'Savings Goals',       short:'Savings',    desc:'Set & track your goals',            c:'#1D8C6A', bg:'rgba(29,140,106,0.10)' },
  '/bills':         { icon:'🔔', label:'Bill Reminders',      short:'Bills',      desc:'Never miss a payment',              c:'#C28A35', bg:'rgba(194,138,53,0.10)' },
  '/family':        { icon:'🏠', label:'Family Budget',       short:'Family',     desc:'Budget as a household',             c:'#8B4A5A', bg:'rgba(139,74,90,0.10)'  },
  '/giving':        { icon:'🎁', label:'Giving & Tithe',      short:'Giving',     desc:'Track generosity & offerings',      c:'#8B4A5A', bg:'rgba(139,74,90,0.10)'  },
  '/nutrition':     { icon:'🥗', label:'Food & Nutrition',    short:'Nutrition',  desc:'Recipes, weight & wellness',        c:'#1D8C6A', bg:'rgba(29,140,106,0.10)' },
  '/challenge':     { icon:'⭐', label:'$100 Challenge',      short:'Challenge',  desc:'30-day financial reset',            c:'#C28A35', bg:'rgba(194,138,53,0.10)' },
  '/networth':      { icon:'📊', label:'Net Worth',           short:'Net Worth',  desc:'Assets minus liabilities',          c:'#1A6878', bg:'rgba(26,104,120,0.10)' },
  '/debtplanner':   { icon:'📉', label:'Debt Planner',        short:'Debt',       desc:'Snowball & Avalanche methods',      c:'#8C4040', bg:'rgba(140,64,64,0.10)'  },
  '/subscriptions': { icon:'🔄', label:'Subscriptions',       short:'Subs',       desc:'Track recurring charges',           c:'#C28A35', bg:'rgba(194,138,53,0.10)' },
  '/travel':        { icon:'🧳', label:'Travel Planner',      short:'Travel',     desc:'Trips & document expiry',           c:'#1A6878', bg:'rgba(26,104,120,0.10)' },
  '/faith':         { icon:'✦',  label:'Faith & Stewardship', short:'Faith',      desc:'Biblical wisdom for your finances', c:'#1D8C6A', bg:'rgba(29,140,106,0.10)' },
  '/community':     { icon:'👥', label:'Community',           short:'Community',  desc:'Grow together',                     c:'#8B4A5A', bg:'rgba(139,74,90,0.10)'  },
  '/birthdays':     { icon:'🎂', label:'Birthdays',           short:'Birthdays',  desc:'Never miss a celebration',          c:'#8B4A5A', bg:'rgba(139,74,90,0.10)'  },
  '/currency':      { icon:'💱', label:'Currency',            short:'Currency',   desc:'Live exchange rates',               c:'#1A6878', bg:'rgba(26,104,120,0.10)' },
  '/receipts':      { icon:'📸', label:'Receipts',            short:'Receipts',   desc:'Scan & organise',                   c:'#1A6878', bg:'rgba(26,104,120,0.10)' },
  '/report':        { icon:'📄', label:'Budget Report',       short:'Report',     desc:'Download PDF report',               c:'#1D8C6A', bg:'rgba(29,140,106,0.10)' },
  '/search':        { icon:'🔍', label:'Search',              short:'Search',     desc:'Find anything instantly',           c:'#1A6878', bg:'rgba(26,104,120,0.10)' },
  '/howtouse':      { icon:'📖', label:'App Guide',           short:'Guide',      desc:'Learn every feature',               c:'#706B65', bg:'rgba(112,107,101,0.10)'},
  '/premium':       { icon:'👑', label:'Go Premium',          short:'Premium',    desc:'Unlock all features',               c:'#C28A35', bg:'rgba(194,138,53,0.10)' },
  '/coach':         { icon:'🤖', label:'AI Coach',            short:'Coach',      desc:'Personalised financial advice',     c:'#1A6878', bg:'rgba(26,104,120,0.10)' },
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const sh = {
  shadow: {
    xs: '0 1px 2px rgba(43,40,37,0.06)',
    sm: '0 1px 4px rgba(43,40,37,0.07), 0 1px 2px rgba(43,40,37,0.05)',
    md: '0 3px 12px rgba(43,40,37,0.09)',
    lg: '0 8px 28px rgba(43,40,37,0.13)',
  },
  radius: { sm:10, md:14, lg:18, xl:20, pill:40 },
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD COMPONENTS  ·  4-level visual hierarchy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LEVEL 1 — FlagshipCard
 * Used once: AI Coach. Dark gradient, maximum presence, no competition.
 */
function FlagshipCard({ to, eyebrow, title, desc }) {
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'block' }}>
      <div className="sh-tappable" style={{
        background:'linear-gradient(145deg, #091f17 0%, #0d2d1f 45%, #143d2e 75%, #1a5040 100%)',
        borderRadius:sh.radius.xl, padding:'22px 20px',
        display:'flex', alignItems:'center', gap:18,
        boxShadow:'0 10px 36px rgba(6,20,14,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        border:'1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Icon container with subtle ring */}
        <div style={{
          width:62, height:62, borderRadius:20,
          background:'rgba(255,255,255,0.09)',
          border:'1px solid rgba(255,255,255,0.12)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:30, flexShrink:0,
        }}>
          🤖
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          {eyebrow && (
            <div style={{
              fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.38)',
              letterSpacing:'0.13em', textTransform:'uppercase', marginBottom:6,
            }}>
              {eyebrow}
            </div>
          )}
          <div style={{ fontSize:17, fontWeight:800, color:'#fff', letterSpacing:'-0.35px', marginBottom:5, lineHeight:1.2 }}>
            {title}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.65 }}>
            {desc}
          </div>
        </div>

        <div style={{
          width:34, height:34, borderRadius:11,
          background:'rgba(255,255,255,0.08)',
          border:'1px solid rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:17, color:'rgba(255,255,255,0.55)', flexShrink:0,
        }}>›</div>
      </div>
    </Link>
  )
}

/**
 * LEVEL 2 — FeaturedCard
 * Most important feature per section. Full-width, tinted, with mood label + CTA.
 */
function FeaturedCard({ to, cta, mood }) {
  const f = F[to] || {}
  const washBg     = f.bg?.replace('0.10)', '0.06)') || 'rgba(29,140,106,0.06)'
  const borderCol  = f.bg?.replace('0.10)', '0.15)') || 'rgba(29,140,106,0.15)'
  const iconBg     = f.bg?.replace('0.10)', '0.14)') || 'rgba(29,140,106,0.14)'
  const chevronBg  = f.bg?.replace('0.10)', '0.18)') || 'rgba(29,140,106,0.18)'

  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'block' }}>
      <div className="sh-tappable" style={{
        background:washBg, borderRadius:sh.radius.lg, padding:'20px',
        border:`1px solid ${borderCol}`,
        display:'flex', alignItems:'center', gap:18,
      }}>
        <div style={{
          width:58, height:58, borderRadius:18, background:iconBg,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:28, flexShrink:0,
        }}>
          {f.icon}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          {mood && (
            <div style={{
              fontSize:9, fontWeight:800, color:f.c, opacity:0.7,
              letterSpacing:'0.11em', textTransform:'uppercase', marginBottom:5,
            }}>
              {mood}
            </div>
          )}
          <div style={{ fontSize:15, fontWeight:800, color:f.c, letterSpacing:'-0.25px', marginBottom:4, lineHeight:1.25 }}>
            {f.label}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>
            {f.desc}
          </div>
          {cta && (
            <div style={{ fontSize:11, fontWeight:700, color:f.c, marginTop:9, opacity:0.85 }}>
              {cta} →
            </div>
          )}
        </div>

        <div style={{
          width:30, height:30, borderRadius:10,
          background:chevronBg,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:16, color:f.c, flexShrink:0,
        }}>›</div>
      </div>
    </Link>
  )
}

/**
 * LEVEL 3 — GridCard
 * Half-width vertical card. Standard workhorse for most features.
 */
function GridCard({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'flex', flex:1 }}>
      <div className="sh-tappable" style={{
        flex:1, background:'var(--white)', borderRadius:sh.radius.md+2, padding:'16px 14px',
        border:'1px solid var(--border)', boxShadow:sh.shadow.sm,
        display:'flex', flexDirection:'column', gap:11,
      }}>
        <div style={{
          width:44, height:44, borderRadius:13, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
        }}>
          {f.icon}
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1.3, marginBottom:3 }}>
            {f.label}
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.55 }}>
            {f.desc}
          </div>
        </div>
      </div>
    </Link>
  )
}

/**
 * LEVEL 4 — ToolCard
 * Compact 3-col. Icon + short label, no description. Utility zone only.
 */
function ToolCard({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none' }}>
      <div className="sh-tappable" style={{
        background:'var(--white)', borderRadius:sh.radius.md, padding:'14px 10px',
        border:'1px solid var(--border)', boxShadow:sh.shadow.xs,
        display:'flex', flexDirection:'column', alignItems:'center', gap:8,
      }}>
        <div style={{
          width:40, height:40, borderRadius:12, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
        }}>
          {f.icon}
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--text)', textAlign:'center', lineHeight:1.35 }}>
          {f.short}
        </div>
      </div>
    </Link>
  )
}

/**
 * SuggestedCard — single guided action, changes by time of day.
 */
function SuggestedCard({ to, reason }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', display:'block' }}>
      <div className="sh-tappable" style={{
        background:'var(--white)', borderRadius:sh.radius.md+2, padding:'15px 18px',
        border:'1px solid var(--border)', boxShadow:sh.shadow.sm,
        display:'flex', alignItems:'center', gap:14,
      }}>
        <div style={{
          width:44, height:44, borderRadius:13, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0,
        }}>
          {f.icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{
            fontSize:9, fontWeight:800, color:'var(--text-faint)',
            letterSpacing:'0.11em', textTransform:'uppercase', marginBottom:4,
          }}>
            Suggested for you
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>
            {f.label}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>
            {reason}
          </div>
        </div>
        <div style={{ fontSize:20, color:'var(--text-faint)', flexShrink:0 }}>›</div>
      </div>
    </Link>
  )
}

/**
 * DailyVerseCard — rotates by day of week. Gentle, not preachy.
 */
function DailyVerseCard({ verse }) {
  return (
    <div style={{
      background:'rgba(29,140,106,0.046)',
      borderRadius:sh.radius.md, padding:'15px 17px',
      border:'1px solid rgba(29,140,106,0.11)',
      display:'flex', gap:13, alignItems:'flex-start',
    }}>
      <div style={{ fontSize:15, color:'#1D8C6A', opacity:0.65, flexShrink:0, marginTop:2, lineHeight:1 }}>
        ✦
      </div>
      <div>
        <div style={{ fontSize:12, color:'var(--text)', lineHeight:1.7, fontStyle:'italic', marginBottom:6 }}>
          "{verse.text}"
        </div>
        <div style={{
          fontSize:9, fontWeight:800, color:'var(--green)',
          letterSpacing:'0.1em', textTransform:'uppercase',
        }}>
          — {verse.ref}
        </div>
      </div>
    </div>
  )
}

/**
 * RecentChip — compact pill in the continue-where-you-left-off strip.
 */
function RecentChip({ to }) {
  const f = F[to] || {}
  return (
    <Link to={to} onClick={() => saveRecent(to)} style={{ textDecoration:'none', flexShrink:0 }}>
      <div className="sh-tappable" style={{
        display:'flex', alignItems:'center', gap:7,
        background:'var(--white)', borderRadius:sh.radius.pill,
        paddingLeft:9, paddingRight:13, paddingTop:7, paddingBottom:7,
        border:'1px solid var(--border)', boxShadow:sh.shadow.xs,
      }}>
        <div style={{
          width:26, height:26, borderRadius:8, background:f.bg,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
        }}>
          {f.icon}
        </div>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap' }}>
          {f.short}
        </span>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

/** Left-accent section header */
function SectionHeader({ title, sub, accent = '#1D8C6A' }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:4 }}>
        <div style={{ width:3, height:21, borderRadius:2, background:accent, flexShrink:0 }} />
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', letterSpacing:'-0.35px' }}>
          {title}
        </div>
      </div>
      {sub && (
        <div style={{ fontSize:12, color:'var(--text-muted)', paddingLeft:12, lineHeight:1.55 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

/** Full-bleed tinted section — visual breathing room between themes */
function TintedSection({ children, tint, border }) {
  return (
    <div style={{
      background: tint,
      margin:'0 -16px',
      padding:'26px 16px',
      borderTop:`1px solid ${border}`,
      borderBottom:`1px solid ${border}`,
    }}>
      {children}
    </div>
  )
}

function Gap({ h = 10 }) { return <div style={{ height:h }} /> }
function Divider() {
  return <div style={{ height:1, background:'var(--border)', margin:'26px 0', opacity:0.55 }} />
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Explore() {
  const tr    = useT()
  const [recent,  setRecent]  = useState([])
  const [ctx]     = useState(getTimeContext)
  const [dateStr] = useState(getDateStr)
  const [verse]   = useState(getDailyVerse)

  useEffect(() => { setRecent(getRecent()) }, [])

  return (
    <div style={{ paddingBottom:110 }}>

      {/* ══════════════════════════════════════════════════════════════════
          HERO HEADER  ·  Full-bleed gradient, greeting, quick-action pills
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        background:'linear-gradient(158deg, #091f17 0%, #0e2d1f 40%, #155538 80%, #1D8C6A 100%)',
        margin:'-16px -16px 0',
        padding:'30px 20px 28px',
      }}>
        {/* Date */}
        <div style={{
          fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.38)',
          letterSpacing:'0.09em', marginBottom:10,
        }}>
          {dateStr}
        </div>

        {/* Greeting */}
        <div style={{
          fontSize:28, fontWeight:900, color:'#fff',
          letterSpacing:'-0.6px', lineHeight:1.15, marginBottom:7,
        }}>
          {ctx.greeting},<br />Steward
        </div>

        {/* Tagline */}
        <div style={{
          fontSize:13, color:'rgba(255,255,255,0.56)',
          lineHeight:1.65, marginBottom:24,
        }}>
          {ctx.tagline}
        </div>

        {/* Quick-action pills — frosted glass on dark */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:1, scrollbarWidth:'none' }}>
          {['/budget', '/savings', '/bills', '/coach'].map(to => {
            const f = F[to] || {}
            return (
              <Link
                key={to} to={to}
                onClick={() => saveRecent(to)}
                style={{ textDecoration:'none', flexShrink:0 }}
              >
                <div className="sh-tappable" style={{
                  display:'flex', alignItems:'center', gap:7,
                  background:'rgba(255,255,255,0.11)',
                  backdropFilter:'blur(10px)',
                  borderRadius:sh.radius.pill,
                  padding:'8px 14px',
                  border:'1px solid rgba(255,255,255,0.14)',
                }}>
                  <span style={{ fontSize:15 }}>{f.icon}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.88)', whiteSpace:'nowrap' }}>
                    {f.short}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BODY  ·  Everything below the hero
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding:'0 16px' }}>

        <Gap h={22} />

        {/* ── Daily Verse ──────────────────────────────────────────────── */}
        <div className="sh-animate sh-animate-1">
          <DailyVerseCard verse={verse} />
        </div>

        <Gap h={20} />

        {/* ── Continue where you left off ──────────────────────────────── */}
        {recent.length > 0 && (
          <div className="sh-animate sh-animate-2" style={{ marginBottom:20 }}>
            <div style={{
              fontSize:10, fontWeight:800, color:'var(--text-faint)',
              letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:11,
            }}>
              Continue where you left off
            </div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
              {recent.map(to => <RecentChip key={to} to={to} />)}
            </div>
          </div>
        )}

        {/* ── Suggested for you ────────────────────────────────────────── */}
        <div className="sh-animate sh-animate-3" style={{ marginBottom:18 }}>
          <SuggestedCard to={ctx.suggestion.to} reason={ctx.suggestion.reason} />
        </div>

        {/* ── AI Coach — Flagship (Level 1) ────────────────────────────── */}
        <div className="sh-animate sh-animate-4">
          <FlagshipCard
            to="/coach"
            eyebrow="Powered by Claude AI"
            title="AI Financial Coach"
            desc="Personalised advice on budgeting, debt, investing & intentional living"
          />
        </div>

        <Divider />

        {/* ══════════════════════════════════════════════════════════════
            YOUR FINANCES  ·  Daily tools. Empowering, not overwhelming.
        ══════════════════════════════════════════════════════════════ */}
        <SectionHeader
          title="Your Finances"
          sub="Empowering tools for managing money with intention"
          accent="#1D8C6A"
        />

        {/* Savings Goals — Featured (Level 2) */}
        <FeaturedCard to="/savings" mood="Goals & Growth" cta="See your progress" />
        <Gap />

        {/* 2-col: Bills + Family Budget */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/bills" />
          <GridCard to="/family" />
        </div>
        <Gap />

        {/* 2-col: Giving + Nutrition */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/giving" />
          <GridCard to="/nutrition" />
        </div>

        <Divider />

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DISCIPLINE & GROWTH  ·  Gold tint. Intentional habits. Focus.
      ══════════════════════════════════════════════════════════════════ */}
      <TintedSection tint="rgba(194,138,53,0.045)" border="rgba(194,138,53,0.12)">
        <SectionHeader
          title="Discipline & Growth"
          sub="Build lasting habits. Create the wealth that matters."
          accent="#C28A35"
        />

        {/* $100 Challenge — Featured (Level 2) */}
        <FeaturedCard to="/challenge" mood="30-Day Journey" cta="Begin your reset" />
        <Gap />

        {/* 2-col: Net Worth + Debt Planner */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/networth" />
          <GridCard to="/debtplanner" />
        </div>
        <Gap />

        {/* 2-col: Subscriptions + Travel */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/subscriptions" />
          <GridCard to="/travel" />
        </div>
      </TintedSection>

      <div style={{ padding:'0 16px' }}>
        <Divider />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FAITH & COMMUNITY  ·  Sage tint. Warm. Reflective. Purposeful.
      ══════════════════════════════════════════════════════════════════ */}
      <TintedSection tint="rgba(29,140,106,0.044)" border="rgba(29,140,106,0.12)">
        <SectionHeader
          title="Faith & Community"
          sub="Grounded in wisdom. Growing in generosity and purpose."
          accent="#1D8C6A"
        />

        {/* Faith & Stewardship — Featured (Level 2) */}
        <FeaturedCard to="/faith" mood="Wisdom & Purpose" cta="Explore biblical wisdom" />
        <Gap />

        {/* 2-col: Community + Birthdays */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <GridCard to="/community" />
          <GridCard to="/birthdays" />
        </div>
      </TintedSection>

      {/* ══════════════════════════════════════════════════════════════════
          UTILITY TOOLS  ·  Compact 3-col. Secondary. Always accessible.
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding:'0 16px' }}>
        <Divider />

        <SectionHeader
          title="Quick Tools"
          sub="Helpful utilities — always within reach"
          accent="#ABA79F"
        />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }}>
          {['/currency', '/receipts', '/report', '/search', '/howtouse', '/premium'].map(to => (
            <ToolCard key={to} to={to} />
          ))}
        </div>

        <Divider />

        {/* ── Settings row ─────────────────────────────────────────────── */}
        <Link to="/settings" onClick={() => saveRecent('/settings')} style={{ textDecoration:'none', display:'block', marginBottom:22 }}>
          <div className="sh-tappable" style={{
            display:'flex', alignItems:'center', gap:14,
            background:'var(--white)', borderRadius:sh.radius.md+2, padding:'16px 18px',
            border:'1px solid var(--border)', boxShadow:sh.shadow.sm,
          }}>
            <div style={{
              width:44, height:44, borderRadius:13,
              background:'rgba(112,107,101,0.09)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, flexShrink:0,
            }}>
              ⚙️
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>
                {tr.settings || 'Settings'}
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                {tr.settingsSubtitle || 'Profile, currency, language & more'}
              </div>
            </div>
            <span style={{ fontSize:20, color:'var(--text-faint)' }}>›</span>
          </div>
        </Link>

        {/* ── App Tour — subdued, very bottom ──────────────────────────── */}
        <div style={{ marginBottom:8 }}>
          <div style={{
            fontSize:10, fontWeight:700, color:'var(--text-faint)',
            letterSpacing:'0.09em', textTransform:'uppercase', marginBottom:11,
          }}>
            Watch App Tour
          </div>
          <div style={{ borderRadius:sh.radius.md+2, overflow:'hidden', border:'1px solid var(--border)' }}>
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
