import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

const DEVOTIONALS = [
  { id:1, title:'The Parable of the Talents', theme:'Stewardship', scripture:'Matthew 25:14-30', text:'A master gave his servants talents — one received five, another two, another one. The ones who invested and grew their talents were praised. The one who buried his out of fear was rebuked. God entrusts us with resources not to hoard, but to multiply for His glory.', teaching:'Every resource you have — money, time, skills, relationships — is a trust from God. He expects us to invest them wisely, not out of greed, but out of faithful stewardship.', reflection:'What talents has God given you that you have been burying out of fear? What is one step you can take this week to invest them?', principle:'Faithful stewardship requires action, not just preservation.' },
  { id:2, title:'Contentment is great gain', theme:'Contentment', scripture:'1 Timothy 6:6-10', text:'Godliness with contentment is great gain. We brought nothing into this world, and we can take nothing out. The love of money — not money itself — is the root of all kinds of evil.', teaching:'Financial peace begins not with a higher income, but with a contented heart. Contentment does not mean passivity — it means your joy is not dependent on your net worth.', reflection:'What purchase or financial goal are you believing will finally make you happy? How might contentment change your relationship with money?', principle:'True wealth is wanting what you already have while working toward what God has for you.' },
  { id:3, title:'The ant and the sluggard', theme:'Diligence', scripture:'Proverbs 6:6-11', text:'Go to the ant, you sluggard! Consider its ways and be wise. It has no commander, yet it stores its provisions in summer and gathers its food at harvest.', teaching:'The ant does not wait to be told. It sees what is coming and prepares. Financial wisdom requires the same proactive discipline — saving in seasons of plenty for seasons of need.', reflection:'Are you preparing for your future, or living only for today? What is one thing you can automate this week to build for tomorrow?', principle:'Preparation today is provision for tomorrow.' },
  { id:4, title:'Give and it will be given', theme:'Generosity', scripture:'Luke 6:38', text:'"Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you."', teaching:'Generosity is not just a moral virtue — it is a spiritual law. Those who give freely find that their capacity to receive increases. Generosity breaks the grip of greed and positions us for abundance.', reflection:'What percentage of your income are you currently giving? What would it look like to increase your giving by just 1% this month?', principle:'You cannot out-give God. Generosity is the antidote to the scarcity mindset.' },
  { id:5, title:'Do not store up earthly treasures', theme:'Eternal perspective', scripture:'Matthew 6:19-21', text:'"Do not store up for yourselves treasures on earth, where moths and vermin destroy. But store up for yourselves treasures in heaven. For where your treasure is, there your heart will be also."', teaching:'Jesus is not against financial planning — He is against making it your ultimate goal. Invest in things that last: people, generosity, integrity, and kingdom work.', reflection:'Looking at how you spent money last month, what does it reveal about where your heart truly is? What would you change?', principle:'Money is a tool, not a treasure. Use it to build what lasts forever.' },
  { id:6, title:'The borrower is servant to the lender', theme:'Debt freedom', scripture:'Proverbs 22:7', text:'"The rich rule over the poor, and the borrower is servant to the lender." Debt is not just a financial burden — it is a limitation on your freedom and your ability to respond to God\'s call.', teaching:'Every debt payment is a dollar that cannot be given, invested, or used to pursue God\'s purposes. Getting out of debt is not just financial wisdom — it is a pursuit of freedom.', reflection:'How does your current debt load affect your freedom — to give, to serve, to take risks for God? What is your plan to eliminate it?', principle:'Financial freedom enables spiritual freedom. Debt elimination is an act of faith.' },
  { id:7, title:'Plans succeed through good counsel', theme:'Wisdom', scripture:'Proverbs 15:22', text:'"Plans fail for lack of counsel, but with many advisers they succeed." No one builds wealth alone. Every successful person has mentors, advisers, and a community that speaks wisdom into their decisions.', teaching:'Humility in financial matters means being willing to learn, to ask for help, and to submit your plans to wise counsel. Pride keeps people poor. Teachability creates wealth.', reflection:'Who are the wisest people in your life when it comes to money? Have you asked them for guidance recently?', principle:'Surround yourself with people whose financial life you want to replicate.' },
]

const PRINCIPLES = [
  { icon:'💰', title:'Earn', text:'Work diligently and with integrity. Your income is the foundation of everything.' },
  { icon:'📊', title:'Budget', text:'Tell every dollar where to go before the month begins. A budget is not a restriction — it is freedom.' },
  { icon:'🏦', title:'Save', text:'Pay yourself first. Build an emergency fund of 3–6 months of expenses before investing.' },
  { icon:'📈', title:'Invest', text:'Make your money work for you. Index funds, real estate, and businesses build generational wealth.' },
  { icon:'🎁', title:'Give', text:'Giving is the ultimate antidote to greed. Start with 10% and grow from there.' },
  { icon:'🔑', title:'Be free', text:'Eliminate all debt. Live below your means. Own your time.' },
]

export default function Faith({ session }) {
  const tr = useT()
  const [logs, setLogs] = useState({})
  const [selected, setSelected] = useState(null)
  const [reflection, setReflection] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('devotionals')
  const userId = session.user.id

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase.from('devotional_logs').select('*').eq('user_id', userId)
      const map = {}
      ;(data||[]).forEach(d => { map[d.devotional_id] = d })
      setLogs(map)
    }
    fetchLogs()
  }, [])

  function openDevotional(dev) { setSelected(dev); setReflection(logs[dev.id]?.reflection_text||'') }

  async function saveLog() {
    if (!selected) return
    setSaving(true)
    const existing = logs[selected.id]
    if(existing){await supabase.from('devotional_logs').update({reflection_text:reflection,completed:true,logged_date:new Date().toISOString().split('T')[0]}).eq('id',existing.id)}
    else{await supabase.from('devotional_logs').insert({user_id:userId,devotional_id:selected.id,reflection_text:reflection,completed:true,logged_date:new Date().toISOString().split('T')[0]})}
    const { data } = await supabase.from('devotional_logs').select('*').eq('user_id', userId)
    const map = {}
    ;(data||[]).forEach(d => { map[d.devotional_id] = d })
    setLogs(map)
    setSaving(false); setSelected(null)
  }

  const completedCount = Object.keys(logs).length

  return (
    <div>
      <div style={{ background:'linear-gradient(135deg, #0F6E56, #094D3C)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>✦</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.faithTitle||"Faith & Stewardship"}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.faithSubtitle||"Biblical wisdom for your finances"}</p>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['devotionals','principles'].map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid', borderColor:activeTab===tab?'var(--green)':'var(--border)', background:activeTab===tab?'var(--green-light)':'var(--bg)', color:activeTab===tab?'var(--green-dark)':'var(--text-muted)', fontWeight:600, fontSize:13, cursor:'pointer' }}>
            {tab==='devotionals'?(tr.devotionalsTab||'✦ Devotionals'):(tr.principlesTab||'📖 Principles')}
          </button>
        ))}
      </div>
      {activeTab==='devotionals'&&(
        <>
          <div className="devotional-card" style={{ marginBottom:16 }}>
            <div className="verse">✦ {tr.readProgress||'Your reading progress'}</div>
            <div className="text">{completedCount} {tr.of||'of'} {DEVOTIONALS.length} {tr.devCompleted||'devotionals completed'}</div>
            <div style={{ height:6, background:'rgba(255,255,255,0.3)', borderRadius:3, marginTop:10, overflow:'hidden' }}>
              <div style={{ width:`${Math.round(completedCount/DEVOTIONALS.length*100)}%`, height:'100%', background:'white', borderRadius:3 }}/>
            </div>
          </div>
          {DEVOTIONALS.map(dev=>{
            const done=logs[dev.id]?.completed
            return (
              <div key={dev.id} className="card" onClick={()=>openDevotional(dev)} style={{ cursor:'pointer', marginBottom:10, background:done?'#f0fdf4':'white' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:3 }}>✦ {dev.theme} · {dev.scripture}</div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{dev.title}</div>
                  </div>
                  <div style={{ fontSize:18, marginLeft:8 }}>{done?'✅':'○'}</div>
                </div>
                <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5, marginBottom:8 }}>{dev.text.slice(0,100)}…</div>
                <div style={{ fontSize:11, padding:'4px 10px', borderRadius:10, background:done?'#E1F5EE':'#f3f4f6', color:done?'var(--green-dark)':'var(--text-muted)', display:'inline-block' }}>
                  {done?(tr.readReflected||'✓ Read & reflected'):(tr.tapToRead||'Tap to read →')}
                </div>
              </div>
            )
          })}
        </>
      )}
      {activeTab==='principles'&&(
        <>
          <div style={{ background:'var(--green-dark)', borderRadius:12, padding:20, color:'white', marginBottom:16 }}>
            <div style={{ fontSize:13, opacity:0.85, marginBottom:6 }}>{tr.foundationScripture||'✦ Foundation scripture'}</div>
            <div style={{ fontSize:15, fontWeight:600, lineHeight:1.5 }}>"The plans of the diligent lead to profit as surely as haste leads to poverty." — Proverbs 21:5</div>
          </div>
          {PRINCIPLES.map((p,i)=>(
            <div key={i} className="card" style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{p.icon}</div>
              <div><div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{i+1}. {p.title}</div><div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5 }}>{p.text}</div></div>
            </div>
          ))}
          <div className="card" style={{ background:'var(--gold-light)' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'var(--gold)', marginBottom:8 }}>✦ {tr.stewardshipCommit||'The Stewardship Commitment'}</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>I commit to earning with integrity, spending with intention, saving with discipline, investing with wisdom, giving with generosity, and living with contentment — for the glory of God and the good of others.</div>
          </div>
        </>
      )}
      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxHeight:'85vh' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>✦ {selected.theme}</div>
            <div className="modal-title">{selected.title}</div>
            <div style={{ padding:'10px 14px', background:'var(--gold-light)', borderRadius:8, marginBottom:14, fontSize:13, color:'var(--gold)', fontWeight:600 }}>{selected.scripture}</div>
            <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.7, marginBottom:14, fontStyle:'italic' }}>"{selected.text}"</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:14 }}>{selected.teaching}</div>
            <div style={{ padding:'12px 14px', background:'var(--green-light)', borderRadius:8, marginBottom:14, fontSize:13, color:'var(--green-dark)' }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>✦ {tr.keyPrinciple||'Key principle'}</div>{selected.principle}
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label style={{ fontWeight:600 }}>{selected.reflection}</label>
              <textarea placeholder={tr.writeThoughts||'Write your thoughts…'} value={reflection} onChange={e=>setReflection(e.target.value)} rows={4}
                style={{ marginTop:8, padding:'12px 14px', border:'1px solid var(--border)', borderRadius:8, fontSize:14, background:'var(--bg)', color:'var(--text)', resize:'none', width:'100%', outline:'none', lineHeight:1.6 }}/>
            </div>
            <div className="modal-actions">
              <button onClick={()=>setSelected(null)} style={{padding:"14px", fontSize:14, fontWeight:600, background:"#f3f4f6", color:"#666", border:"none", borderRadius:10, cursor:"pointer"}}>{tr.cancel||"Cancel"}</button>
              <button onClick={saveLog} disabled={saving} style={{flex:2, padding:"14px", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #1D9E75, #0F6E56)", color:"white", border:"none", borderRadius:10, cursor:"pointer"}}>
                {saving?'Saving…':logs[selected.id]?.completed?(tr.updateReflection||'✓ Update reflection'):(tr.markAsRead||'Mark as read')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
