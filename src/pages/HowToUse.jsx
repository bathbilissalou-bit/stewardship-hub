import { useState, useEffect, useRef } from 'react'
import { useT, getLang } from '../lib/i18n'
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

// ── Per-module screen mockups ────────────────────────────────────────────────
function MockDashboard() {
  return (
    <div style={{ padding:8, background:'#f8f9fa', height:'100%' }}>
      <div style={{ background:'linear-gradient(135deg,#1D9E75,#0F6E56)', borderRadius:10, padding:'10px 8px', color:'white', marginBottom:6 }}>
        <div style={{ fontSize:7, opacity:0.8 }}>Good morning</div>
        <div style={{ fontSize:11, fontWeight:700 }}>Stewardship Hub</div>
        <div style={{ display:'flex', gap:4, marginTop:4 }}>
          {['Budget','Invest','Loans'].map(l => <div key={l} style={{ flex:1, background:'rgba(255,255,255,0.15)', borderRadius:4, padding:3, fontSize:6, textAlign:'center' }}>{l}</div>)}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:4 }}>
        {[['Income','$3,200'],['Expenses','$2,100'],['Saved','$1,100'],['ROI','+4.2%']].map(([l,v]) => (
          <div key={l} style={{ background:'white', borderRadius:6, padding:5, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:6, color:'#9ca3af' }}>{l}</div>
            <div style={{ fontSize:9, fontWeight:700, color:'#1D9E75' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'white', borderRadius:6, padding:5 }}>
        <div style={{ fontSize:6, fontWeight:600, marginBottom:3 }}>Bottom navigation</div>
        <div style={{ display:'flex', justifyContent:'space-around' }}>
          {['🏠','💳','📈','🏦','👥'].map(i => <div key={i} style={{ fontSize:10 }}>{i}</div>)}
        </div>
      </div>
      <TapDot x="50%" y="88%" color="#1D9E75" />
    </div>
  )
}

function MockBudget({ step }) {
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#185FA5,#0d3f70)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>💳 Budget</div>
        <div style={{ fontSize:6, opacity:0.8 }}>April 2026</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, marginBottom:4 }}>
          {[['Income','$3,200','#1D9E75'],['Expenses','$2,100','#A32D2D']].map(([l,v,c]) => (
            <div key={l} style={{ background:'white', borderRadius:6, padding:4 }}>
              <div style={{ fontSize:5, color:'#9ca3af' }}>{l}</div>
              <div style={{ fontSize:8, fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'white', borderRadius:6, padding:4, marginBottom:3 }}>
          <div style={{ fontSize:6, fontWeight:600, marginBottom:2, color:'#185FA5' }}>Income</div>
          {[['Salary','$3,000'],['Freelance','$200']].map(([n,a]) => (
            <div key={n} style={{ display:'flex', justifyContent:'space-between', fontSize:5.5, padding:'1.5px 0', borderBottom:'1px solid #f3f4f6' }}>
              <span>{n}</span><span style={{ color:'#1D9E75' }}>{a}</span>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:2, marginTop:2, color:'#185FA5', fontSize:5.5, fontWeight:600 }}>
            <span>+</span><span>Add row</span>
          </div>
        </div>
      </div>
      <TapDot x="30%" y={step===1 ? '58%' : step===2 ? '72%' : '82%'} color="#185FA5" />
    </div>
  )
}

function MockInvest() {
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#3B6D11,#254508)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>📈 Investment Tracker</div>
        <div style={{ fontSize:6, opacity:0.8 }}>Watch your wealth grow</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, marginBottom:4 }}>
          {[['Invested','$21,000'],['Value','$22,500'],['Gain','+$1,500'],['ROI','+7.1%']].map(([l,v]) => (
            <div key={l} style={{ background:'white', borderRadius:5, padding:3 }}>
              <div style={{ fontSize:5, color:'#9ca3af' }}>{l}</div>
              <div style={{ fontSize:7, fontWeight:700, color:'#3B6D11' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background:'white', borderRadius:6, padding:4 }}>
          <div style={{ display:'flex', height:5, borderRadius:3, overflow:'hidden', marginBottom:2 }}>
            {[['40%','#1D9E75'],['35%','#185FA5'],['25%','#BA7517']].map(([w,c]) => <div key={c} style={{ width:w, background:c }} />)}
          </div>
          {[['S&P 500','$10k','SPY','+5.2%'],['Bitcoin','$5k','BTC','+12%'],['Apple','$6k','AAPL','+3%']].map(([n,a,t,r]) => (
            <div key={n} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:5.5, padding:'2px 0', borderBottom:'1px solid #f3f4f6' }}>
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

function MockLoans() {
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#A32D2D,#7B1C1C)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>🏦 Loan Tracker</div>
        <div style={{ fontSize:6, opacity:0.8 }}>Total debt: $42,500</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {[['Car Loan','Chase','$18,500','$342/mo'],['Student Loan','Navient','$24,000','$287/mo']].map(([n,l,a,m]) => (
          <div key={n} style={{ background:'white', borderRadius:6, padding:5, marginBottom:3 }}>
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
          <div style={{ fontSize:6, color:'#A32D2D', fontWeight:600 }}>📋 Amortization table →</div>
          <div style={{ fontSize:5, color:'#9ca3af' }}>Tap any loan to expand</div>
        </div>
      </div>
      <TapDot x="50%" y="42%" color="#A32D2D" />
    </div>
  )
}

function MockChallenge({ step }) {
  const days = Array.from({length:30},(_,i)=>i+1)
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#BA7517,#7A4D0F)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>⭐ $100 Challenge</div>
        <div style={{ fontSize:6, opacity:0.8 }}>Day 12 of 30 · $42 saved</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        <div style={{ background:'white', borderRadius:6, padding:5, marginBottom:3, textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#BA7517' }}>$42</div>
          <div style={{ fontSize:5.5, color:'#9ca3af' }}>of $100 goal</div>
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

function MockRealEstate() {
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#8B5E3C,#5C3D1E)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>🏠 Real Estate Guide</div>
        <div style={{ fontSize:6, opacity:0.8 }}>8 of 24 steps complete</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {[['Financial Prep','Done','100%','#1D9E75'],['Mortgage Ready','In Progress','40%','#BA7517'],['House Search','Locked','0%','#9ca3af'],].map(([phase,status,pct,c]) => (
          <div key={phase} style={{ background:'white', borderRadius:6, padding:5, marginBottom:3 }}>
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
          {['✅ Checklist','🏠 Home Types'].map((t,i) => (
            <div key={t} style={{ flex:1, padding:4, background: i===0 ? '#8B5E3C' : 'white', color: i===0 ? 'white' : '#6b7280', borderRadius:5, fontSize:5.5, fontWeight:600, textAlign:'center', border:'1px solid #e5e7eb' }}>{t}</div>
          ))}
        </div>
      </div>
      <TapDot x="50%" y="55%" color="#8B5E3C" />
    </div>
  )
}

function MockCommunity() {
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#185FA5,#0d3f70)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>👥 Community</div>
        <div style={{ fontSize:6, opacity:0.8 }}>48 members sharing</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {[['Maria G.','🎉','Just paid off my car loan!','2h ago','Milestone'],['James O.','❓','Best index fund for beginners?','5h ago','Question'],['Sarah K.','🙏','Prayer for my new business','1d ago','Prayer']].map(([n,ic,txt,t,type]) => (
          <div key={n} style={{ background:'white', borderRadius:6, padding:5, marginBottom:3 }}>
            <div style={{ display:'flex', alignItems:'center', gap:3, marginBottom:2 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:'#E6F1FB', fontSize:7, display:'flex', alignItems:'center', justifyContent:'center' }}>{ic}</div>
              <div>
                <div style={{ fontSize:6, fontWeight:700 }}>{n}</div>
                <div style={{ fontSize:5, color:'#9ca3af' }}>{type} · {t}</div>
              </div>
            </div>
            <div style={{ fontSize:5.5, color:'#374151', lineHeight:1.4 }}>{txt}</div>
            <div style={{ display:'flex', gap:6, marginTop:3, fontSize:5.5, color:'#9ca3af' }}>
              <span>♥ Like</span><span>💬 Comment</span>
            </div>
          </div>
        ))}
      </div>
      <TapDot x="82%" y="90%" color="#185FA5" />
    </div>
  )
}

function MockFaith() {
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#0F6E56,#06402f)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>✦ Faith & Stewardship</div>
        <div style={{ fontSize:6, opacity:0.8 }}>Devotionals · Principles</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {[['Stewardship','Luke 16:10','read'],['Contentment','Phil 4:11','read'],['Diligence','Prov 21:5','today'],['Generosity','2 Cor 9:7','locked']].map(([t,v,s]) => (
          <div key={t} style={{ background:'white', borderRadius:5, padding:4, marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:16, height:16, borderRadius:4, background: s==='read' ? '#E1F5EE' : s==='today' ? '#0F6E56' : '#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8 }}>
              {s==='read' ? '✓' : s==='today' ? '✦' : '🔒'}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:6, fontWeight:700 }}>{t}</div>
              <div style={{ fontSize:5, color:'#9ca3af' }}>{v}</div>
            </div>
            {s==='today' && <span style={{ fontSize:5, color:'#0F6E56', fontWeight:700 }}>READ →</span>}
          </div>
        ))}
        <div style={{ background:'linear-gradient(135deg,#0F6E56,#1D9E75)', borderRadius:5, padding:5, color:'white' }}>
          <div style={{ fontSize:6, fontWeight:700 }}>The 6 Principles</div>
          <div style={{ fontSize:5, opacity:0.8 }}>Earn · Save · Give · Invest · Budget · Be Free</div>
        </div>
      </div>
      <TapDot x="50%" y="52%" color="#0F6E56" />
    </div>
  )
}

function MockBills() {
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#E64A19,#BF360C)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>🔔 Bill Reminders</div>
        <div style={{ fontSize:6, opacity:0.8 }}>Never miss a payment</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        <div style={{ background:'#FCEBEB', borderRadius:5, padding:4, marginBottom:3, fontSize:5.5, color:'#A32D2D', fontWeight:600 }}>⚠️ Electricity due in 3 days!</div>
        {[['🏠','Rent','$1,500','May 1','paid'],['💡','Electricity','$130','Apr 30','due!'],['📱','Netflix','$18','May 5','ok']].map(([ic,n,a,d,s]) => (
          <div key={n} style={{ background:'white', borderRadius:5, padding:4, marginBottom:2, display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:8 }}>{ic}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:6, fontWeight:700 }}>{n}</div>
              <div style={{ fontSize:5, color:'#9ca3af' }}>Due {d}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:6.5, fontWeight:700 }}>{a}</div>
              <div style={{ fontSize:5, color: s==='paid' ? '#1D9E75' : s==='due!' ? '#A32D2D' : '#9ca3af', fontWeight:600 }}>{s}</div>
            </div>
          </div>
        ))}
      </div>
      <TapDot x="82%" y="88%" color="#E64A19" />
    </div>
  )
}

function MockSavings() {
  return (
    <div style={{ height:'100%', background:'#f8f9fa' }}>
      <div style={{ background:'linear-gradient(135deg,#1D9E75,#0F6E56)', padding:'8px 8px 14px', color:'white' }}>
        <div style={{ fontSize:8, fontWeight:700 }}>💰 Savings Goals</div>
        <div style={{ fontSize:6, opacity:0.8 }}>3 goals · $4,200 saved</div>
      </div>
      <div style={{ padding:'4px 6px', marginTop:-8 }}>
        {[['Emergency Fund','$5,000','$3,200','64%'],['Vacation','$2,000','$800','40%'],['New Car','$10,000','$200','2%']].map(([n,t,s,p]) => (
          <div key={n} style={{ background:'white', borderRadius:6, padding:5, marginBottom:3 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:6.5, fontWeight:700 }}>{n}</span>
              <span style={{ fontSize:6, color:'#1D9E75', fontWeight:700 }}>{p}</span>
            </div>
            <div style={{ fontSize:5, color:'#9ca3af', marginBottom:2 }}>{s} of {t}</div>
            <div style={{ height:4, background:'#f3f4f6', borderRadius:2 }}>
              <div style={{ width:p, height:'100%', background:'#1D9E75', borderRadius:2 }} />
            </div>
          </div>
        ))}
      </div>
      <TapDot x="82%" y="88%" color="#1D9E75" />
    </div>
  )
}

// Map module index → mockup component
const MOCKUP_COMPONENTS = [
  (step) => <MockDashboard />,
  (step) => <MockBudget step={step} />,
  (step) => <MockInvest />,
  (step) => <MockLoans />,
  (step) => <MockChallenge step={step} />,
  (step) => <MockRealEstate />,
  (step) => <MockCommunity />,
  (step) => <MockFaith />,
]

// ── Guide data (English only — translation kept lightweight) ─────────────────
const MODULES = [
  { module:'Getting Started', icon:'✦', color:'#1D9E75', bg:'#E1F5EE', link:'/', steps:[
    { title:'Welcome to Stewardship Hub', desc:'This app helps you manage finances with faith-based principles. Track budget, investments, loans, and grow with a community.', tip:'Available in 15 languages — tap the flag button at the top!' },
    { title:'Navigate with bottom tabs', desc:'The bottom bar has 6 tabs: Home, Budget, Invest, Loans, Community, and Explore. Tap any tab to switch features.', tip:'The Home tab shows your full financial summary at a glance.' },
    { title:'Settings & profile', desc:'Tap the ⚙️ gear icon at the top right to access Settings — set your currency, language, and manage your account.', tip:'Set your currency first! It affects all amounts across the app.' },
  ]},
  { module:'Budget Tracker', icon:'💳', color:'#185FA5', bg:'#E6F1FB', link:'/budget', steps:[
    { title:'Open the Budget tab', desc:'Tap "Budget" in the bottom nav. You\'ll see Income, Expenses, and Net Surplus cards for the current month.', tip:'Use the ‹ › arrows to navigate between past and future months.' },
    { title:'Add income & expenses', desc:'Tap "+ Add row" under Income or Expenses. Enter description and amount, choose a category, then tap Save.', tip:'Categories: Needs = rent/food. Wants = entertainment. Giving = tithe.' },
    { title:'Your surplus is auto-calculated', desc:'The app shows your NET SURPLUS automatically. Green means you\'re ahead. Red means you\'re overspending.', tip:'Aim to save at least 20% of your income every month.' },
  ]},
  { module:'Investment Tracker', icon:'📈', color:'#3B6D11', bg:'#EAF3DE', link:'/investments', steps:[
    { title:'Track your portfolio', desc:'Tap "Invest" in the bottom nav. See total portfolio value, invested amount, and overall ROI updated live.', tip:'ROI = Return on Investment. It shows how much your money has grown.' },
    { title:'Add investments with live prices', desc:'Tap "+ Add row". Enter name (e.g. "Bitcoin" or "S&P 500") — the type is auto-detected and live price appears instantly.', tip:'Type is auto-detected: "Bitcoin" → Crypto, "S&P 500" → Index funds.' },
    { title:'View live market prices', desc:'Tap "🌐 View Live Market Prices" to see real-time prices for stocks, ETFs, and 16+ cryptocurrencies.', tip:'Tap 🔄 Refresh to get the latest prices anytime.' },
  ]},
  { module:'Loan Tracker', icon:'🏦', color:'#A32D2D', bg:'#FCEBEB', link:'/loans', steps:[
    { title:'Track all your debt', desc:'Tap "Loans" in the bottom nav. See total debt, monthly payment, and a list of all loans.', tip:'Goal: get ALL loans to zero. Debt freedom = financial freedom.' },
    { title:'Add a loan', desc:'Tap +. Enter loan type, lender, principal amount, interest rate (%), and term in months. Monthly payment auto-calculates.', tip:'Example: Car loan, Chase Bank, $20,000, 6.5%, 60 months.' },
    { title:'View amortization table', desc:'Tap any loan to expand it. See the full month-by-month breakdown of principal vs interest payments.', tip:'Debt snowball strategy: pay off the smallest loan first, then roll payments to the next.' },
  ]},
  { module:'$100 Challenge', icon:'⭐', color:'#BA7517', bg:'#FAEEDA', link:'/challenge', steps:[
    { title:'30-day financial challenge', desc:'The $100 Challenge has 30 daily tasks. Each one builds a new financial habit. Tap "Challenge" to start.', tip:'30 days, 30 tasks, $100 saved. The habit matters more than the amount.' },
    { title:'Complete a day', desc:'Tap the current day card. Read the task, enter the amount you saved, write a reflection, then tap "Mark complete".', tip:'Even saving $1 counts. Start small and build momentum.' },
    { title:'Track your 30-day grid', desc:'The dot grid shows your progress: Green ✓ = done, green outline = today, gray = upcoming.', tip:'After the challenge, invest your $100 in an index fund!' },
  ]},
  { module:'Real Estate Guide', icon:'🏠', color:'#8B5E3C', bg:'#F5EAE0', link:'/realestate', steps:[
    { title:'Home buying checklist', desc:'The Real Estate Guide walks you through 5 phases: Financial Prep, Mortgage Ready, House Search, Offer & Closing, and After Purchase.', tip:'Don\'t skip phases! Each one prepares you for the next.' },
    { title:'Track each step', desc:'Tap a checklist item to cycle its status: Not Started → In Progress → Done. The progress bar fills as you complete steps.', tip:'Tap the status badge on the right to change status quickly.' },
    { title:'Compare home types', desc:'Tap the "Home Types" tab to compare Brick, Wood Frame, Condo, Duplex, and Modular homes side by side.', tip:'Duplexes are great — rent one unit to help pay the mortgage!' },
  ]},
  { module:'Community', icon:'👥', color:'#185FA5', bg:'#E6F1FB', link:'/community', steps:[
    { title:'Share & grow together', desc:'The Community tab shows posts from all Stewardship Hub members — testimonies, questions, prayers, and milestones.', tip:'A faith-based encouraging space. Build each other up.' },
    { title:'Post an update', desc:'Tap + to share. Choose your post type: Update, Testimony, Question, Prayer, or Milestone. Then write and tap Post.', tip:'Sharing wins like "I paid off my credit card!" inspires others!' },
    { title:'Like and comment', desc:'Tap ♥ to like any post. Tap 💬 to leave a comment. Your encouragement can change someone\'s financial journey.', tip:'Accountability increases goal achievement by 95%.' },
  ]},
  { module:'Faith & Stewardship', icon:'✦', color:'#0F6E56', bg:'#E1F5EE', link:'/faith', steps:[
    { title:'Faith-based finance', desc:'The Faith tab has 7 devotionals connecting scripture to money management. Each takes 3–5 minutes to read.', tip:'Managing money well IS an act of worship.' },
    { title:'Read & reflect', desc:'Tap any devotional card. Read the scripture and teaching, then write your personal reflection and tap "Mark as read".', tip:'Journaling your reflections helps you grow faster than just reading.' },
    { title:'The 6 Principles', desc:'Tap the "Principles" tab to study the 6 pillars: Earn, Budget, Save, Invest, Give, and Be Free. Your financial foundation.', tip:'The Stewardship Commitment at the bottom is worth memorizing.' },
  ]},
]

const PROGRESS_KEY = 'sh_guide_progress'

export default function HowToUse() {
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

  const MockComponent = MOCKUP_COMPONENTS[activeModule] || (() => <div style={{ fontSize:48, textAlign:'center', marginTop:60 }}>{mod.icon}</div>)

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
        <div style={{ fontSize:10, fontWeight:600, opacity:0.8, letterSpacing:'0.08em', marginBottom:4 }}>APP GUIDE</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:20, fontWeight:800 }}>How to Use the App</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:12 }}>Tap Next — each step shows you exactly what to do</p>
      </div>

      {/* Intro video */}
      <div style={{ marginTop:20 }}>
        <VideoCard
          title="How Stewardship Hub Works"
          subtitle="A complete walkthrough of every feature in 3 minutes"
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
          <span>Overall progress</span>
          <span style={{ fontWeight:600, color:mod.color }}>{overallStep} / {overallTotal} steps</span>
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
              <span>Try it now → {mod.module}</span>
            </div>
          </Link>

          {/* Navigation */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={prev} disabled={isFirst}
              style={{ flex:1, padding:'12px', background:'#f3f4f6', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor: isFirst ? 'not-allowed' : 'pointer', color: isFirst ? '#d1d5db' : '#374151' }}>
              ← Back
            </button>
            <button onClick={next}
              style={{ flex:2, padding:'12px', background:`linear-gradient(135deg, ${mod.color}, ${mod.color}cc)`, border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', color:'white' }}>
              {isLast ? '🎉 Start Over' : activeStep === mod.steps.length - 1 ? `Next module →` : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div style={{ textAlign:'center', fontSize:11, color:'#9ca3af', marginBottom:16 }}>
        ← Swipe left or right to navigate →
      </div>

      {/* All modules list */}
      <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:10 }}>All Modules</div>
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
              <div style={{ fontSize:11, color:'#9ca3af', marginBottom:4 }}>{m.steps.length} steps</div>
              <div style={{ height:4, background:'#f3f4f6', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${progress*100}%`, height:'100%', background:m.color, borderRadius:2, transition:'width 0.4s' }} />
              </div>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color: done ? '#1D9E75' : active ? m.color : '#9ca3af', flexShrink:0 }}>
              {done ? '✓ Done' : active ? `${activeStep+1}/${m.steps.length}` : 'Start →'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
