import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useT, getLang, LANG_LOCALES } from '../lib/i18n'
import { getExploreDailyVerse } from '../lib/exploreDailyVerses'
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
function getSuggestionRoute(h) {
  if (h < 12) return '/budget'
  if (h < 17) return '/receipts'
  if (h < 21) return '/savings'
  return '/giving'
}


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

// Maps route → tr key for translated feature descriptions
const FEAT_TR_KEY = {
  '/budget':        'featBudgetDesc',
  '/savings':       'featSavingsDesc',
  '/bills':         'featBillsDesc',
  '/family':        'featFamilyDesc',
  '/giving':        'featGivingDesc',
  '/nutrition':     'featNutritionDesc',
  '/challenge':     'featChallengeDesc',
  '/networth':      'featNetworthDesc',
  '/debtplanner':   'featDebtDesc',
  '/subscriptions': 'featSubsDesc',
  '/travel':        'featTravelDesc',
  '/faith':         'featFaithDesc',
  '/community':     'featCommunityDesc',
  '/birthdays':     'featBirthdaysDesc',
  '/currency':      'featCurrencyDesc',
  '/receipts':      'featReceiptsDesc',
  '/report':        'featReportDesc',
  '/search':        'featSearchDesc',
  '/howtouse':      'featGuideDesc',
  '/premium':       'featPremiumDesc',
  '/coach':         'featCoachDesc',
}

const ROUTE_TO_TITLE_KEY = {
  '/budget':        'budget',
  '/savings':       'savingsGoalsTitle',
  '/bills':         'billReminders',
  '/family':        'familyBudgetCardTitle',
  '/giving':        'givingTithe',
  '/nutrition':     'nutritionCardTitle',
  '/challenge':     'challengeTitle',
  '/networth':      'netWorthCardTitle',
  '/debtplanner':   'debtPlannerCardTitle',
  '/subscriptions': 'subscriptionsCardTitle',
  '/travel':        'travelCardTitle',
  '/faith':         'faithTitle',
  '/community':     'communityTitle2',
  '/birthdays':     'birthdaysCardTitle',
  '/currency':      'currencyCardTitle',
  '/receipts':      'receiptsCardTitle',
  '/report':        'budgetReportCardTitle',
  '/search':        'searchCardTitle',
  '/howtouse':      'appGuideCardTitle',
  '/premium':       'goPremiumCardTitle',
  '/coach':         'aiCoachHeroTitle',
}

const ROUTE_TO_SHORT_KEY = {
  '/budget':        'budget',
  '/savings':       'exploreShortSavings',
  '/bills':         'exploreShortBills',
  '/family':        'exploreShortFamily',
  '/giving':        'exploreShortGiving',
  '/nutrition':     'exploreShortNutrition',
  '/challenge':     'exploreShortChallenge',
  '/networth':      'exploreShortNetworth',
  '/debtplanner':   'exploreShortDebt',
  '/subscriptions': 'exploreShortSubs',
  '/travel':        'exploreShortTravel',
  '/faith':         'exploreShortFaith',
  '/community':     'exploreShortCommunity',
  '/birthdays':     'exploreShortBirthdays',
  '/currency':      'exploreShortCurrency',
  '/receipts':      'exploreShortReceipts',
  '/report':        'exploreShortReport',
  '/search':        'exploreShortSearch',
  '/howtouse':      'exploreShortGuide',
  '/premium':       'exploreShortPremium',
  '/coach':         'exploreShortCoach',
}

function featTitle(to, tr) {
  const k = ROUTE_TO_TITLE_KEY[to]
  const v = k ? tr[k] : null
  return v || F[to]?.label || ''
}

function featShort(to, tr) {
  const k = ROUTE_TO_SHORT_KEY[to]
  const v = k ? tr[k] : null
  return v || F[to]?.short || ''
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
  const tr = useT()
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
            {featTitle(to, tr)}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>
            {tr[FEAT_TR_KEY[to]] || f.desc}
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
  const tr = useT()
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
            {featTitle(to, tr)}
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.55 }}>
            {tr[FEAT_TR_KEY[to]] || f.desc}
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
  const tr = useT()
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
          {featShort(to, tr)}
        </div>
      </div>
    </Link>
  )
}

/**
 * SuggestedCard — single guided action, changes by time of day.
 */
function SuggestedCard({ to, reason, label }) {
  const tr = useT()
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
            {label || tr.suggestedFor}
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>
            {featTitle(to, tr)}
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
  const tr = useT()
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
          {featShort(to, tr)}
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
export default function Explore({ lang: langProp }) {
  const tr    = useT()
  const [recent,  setRecent]  = useState([])
  const lang      = langProp || getLang()
  const verse = useMemo(() => getExploreDailyVerse(lang), [lang])
  const locale    = LANG_LOCALES[lang] || 'en-US'
  const dateStr   = useMemo(
    () => new Date().toLocaleDateString(locale, { weekday:'long', month:'long', day:'numeric' }),
    [locale, lang]
  )

  // Time-of-day context — computed using tr so greetings respect the selected language
  const h              = new Date().getHours()
  const greeting       = h < 12 ? (tr.goodMorning   || 'Good morning')   :
                         h < 17 ? (tr.goodAfternoon  || 'Good afternoon') :
                         h < 21 ? (tr.goodEvening    || 'Good evening')   :
                                  (tr.goodNight      || 'Good night')
  const tagline        = h < 12 ? (tr.taglineMorning   || 'Start your day with clarity and intention.')      :
                         h < 17 ? (tr.taglineAfternoon  || "Every decision today shapes tomorrow's freedom.") :
                         h < 21 ? (tr.taglineEvening    || "A moment to reflect — you're building something lasting.") :
                                  (tr.taglineNight      || 'Rest well. Faithful stewardship pays off over time.')
  const suggestionTo     = getSuggestionRoute(h)
  const suggestionReason = h < 12 ? (tr.suggestBudget   || "Review this month's budget to stay on track")   :
                           h < 17 ? (tr.suggestReceipts  || "Log recent purchases while they're still fresh") :
                           h < 21 ? (tr.suggestSavings   || 'Check your progress toward your goals')          :
                                    (tr.suggestGiving    || "Reflect on today's generosity")

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
          {greeting},<br />{tr.stewardRoleName}
        </div>

        {/* Tagline */}
        <div style={{
          fontSize:13, color:'rgba(255,255,255,0.56)',
          lineHeight:1.65, marginBottom:24,
        }}>
          {tagline}
        </div>

        {/* Quick-action pills — frosted glass on dark */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:1, scrollbarWidth:'none' }}>
          {['/budget', '/savings', '/bills', '/coach'].map(path => {
            const f = F[path] || {}
            return (
              <Link
                key={path} to={path}
                onClick={() => saveRecent(path)}
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
                    {featShort(path, tr)}
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
              {tr.continueWhere}
            </div>
            <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
              {recent.map(to => <RecentChip key={to} to={to} />)}
            </div>
          </div>
        )}

        {/* ── Suggested for you ────────────────────────────────────────── */}
        <div className="sh-animate sh-animate-3" style={{ marginBottom:18 }}>
          <SuggestedCard to={suggestionTo} reason={suggestionReason} label={tr.suggestedFor} />
        </div>

        {/* ── AI Coach — Flagship (Level 1) ────────────────────────────── */}
        <div className="sh-animate sh-animate-4">
          <FlagshipCard
            to="/coach"
            eyebrow={tr.poweredByClaude}
            title={tr.aiCoachHeroTitle}
            desc={tr.aiCoachHeroDesc}
          />
        </div>

        <Divider />

        {/* ══════════════════════════════════════════════════════════════
            YOUR FINANCES  ·  Daily tools. Empowering, not overwhelming.
        ══════════════════════════════════════════════════════════════ */}
        <SectionHeader
          title={tr.sectionFinances}
          sub={tr.sectionFinancesSub}
          accent="#1D8C6A"
        />

        {/* Savings Goals — Featured (Level 2) */}
        <FeaturedCard to="/savings" mood={tr.moodGoals} cta={tr.ctaSeeProgress} />
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
          title={tr.sectionGrowth}
          sub={tr.sectionGrowthSub}
          accent="#C28A35"
        />

        {/* $100 Challenge — Featured (Level 2) */}
        <FeaturedCard to="/challenge" mood={tr.moodJourney} cta={tr.ctaBeginReset} />
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
          title={tr.sectionFaithComm}
          sub={tr.sectionFaithCommSub}
          accent="#1D8C6A"
        />

        {/* Faith & Stewardship — Featured (Level 2) */}
        <FeaturedCard to="/faith" mood={tr.moodWisdom} cta={tr.ctaExploreFaith} />
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
          title={tr.sectionTools}
          sub={tr.sectionToolsSub}
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
                {tr.settingsSubtitle}
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
            {tr.watchTour}
          </div>
          <div style={{ borderRadius:sh.radius.md+2, overflow:'hidden', border:'1px solid var(--border)' }}>
            <VideoCard
              title={tr.videoTourMainTitle}
              subtitle={tr.videoTourSubTitle}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
