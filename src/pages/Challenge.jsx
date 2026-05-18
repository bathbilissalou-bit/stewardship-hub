import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

const TASKS = [
  { day:1, title:'Set your intention', task:'Write down WHY you want financial freedom. What will it feel like?', scripture:'Proverbs 21:5', prompt:'What does financial peace mean to you?' },
  { day:2, title:'Track every penny', task:'List every purchase from yesterday. You cannot manage what you do not measure.', scripture:'Luke 16:10', prompt:'Where did money disappear this week?' },
  { day:3, title:'Cancel one subscription', task:'Review subscriptions. Cancel one you do not use. Transfer that amount to savings.', scripture:'Ecclesiastes 5:10', prompt:'What subscriptions bring real value?' },
  { day:4, title:'Cook at home', task:'Cook all meals at home today. Calculate what you saved vs eating out.', scripture:'Proverbs 31:27', prompt:'How can meal planning change your finances?' },
  { day:5, title:'The giving principle', task:'Give something today — money, time, or resources. Generosity unlocks abundance.', scripture:'Luke 6:38', prompt:'How does giving change your view of money?' },
  { day:6, title:'No-spend day', task:'Spend $0 today except true necessities. Find free joy.', scripture:'Philippians 4:11', prompt:'What free things bring you the most joy?' },
  { day:7, title:'Weekly review', task:'Open your budget. Review this week. Celebrate wins. Adjust one thing.', scripture:'Proverbs 27:23', prompt:'What surprised you about your spending?' },
  { day:8, title:'Emergency fund', task:'Open a separate savings account. Transfer even $5 today. The habit matters.', scripture:'Proverbs 6:6-8', prompt:'What would a funded emergency fund mean for your peace?' },
  { day:9, title:'Know your credit', task:'Check your credit score for free at AnnualCreditReport.com.', scripture:'Romans 13:8', prompt:'What debts feel like the heaviest burden?' },
  { day:10, title:'Cut one luxury', task:'Identify your biggest want spending. Cut it in half for 30 days.', scripture:'1 Timothy 6:6', prompt:'What luxuries are habits vs things that bring real joy?' },
  { day:11, title:'Meal prep day', task:'Prep lunches for 3 days. Invest the savings.', scripture:'Proverbs 21:20', prompt:'How does planning ahead change financial choices?' },
  { day:12, title:'Learn index funds', task:'Spend 20 minutes researching S&P 500 index funds.', scripture:'Proverbs 4:7', prompt:'What has stopped you from investing before?' },
  { day:13, title:'Negotiate a bill', task:'Call your internet or phone provider. Ask for a lower rate.', scripture:'Proverbs 17:18', prompt:'What bills have you paid without questioning?' },
  { day:14, title:'Two-week check-in', task:'Add up everything saved in 14 days. You are halfway there!', scripture:'Galatians 6:9', prompt:'What has been the hardest habit to change?' },
  { day:15, title:'Declutter and sell', task:'Find 5 items to sell online. Clutter is frozen money.', scripture:'Matthew 6:19-20', prompt:'What possessions own you instead of you owning them?' },
  { day:16, title:'Automate savings', task:'Set up an automatic transfer to savings — even $1 per day.', scripture:'Proverbs 13:11', prompt:'What makes saving consistently hard?' },
  { day:17, title:'Invest $5 today', task:'Open Acorns or Robinhood. Invest $5 in an index fund. Start now.', scripture:'Ecclesiastes 11:4', prompt:'What fears do you have about investing?' },
  { day:18, title:'Gratitude audit', task:'List 10 things you own that you are grateful for. Contentment precedes wealth.', scripture:'1 Timothy 6:17', prompt:'How does gratitude change your desire to spend?' },
  { day:19, title:'Side income brainstorm', task:'List 5 skills others would pay for. Find one potential client.', scripture:'Proverbs 14:23', prompt:'What talents are you leaving underused?' },
  { day:20, title:'The 24-hour rule', task:'Before any purchase over $30, wait 24 hours.', scripture:'Proverbs 21:17', prompt:'What impulse purchases do you regret most?' },
  { day:21, title:'Three-week milestone', task:'Review your total saved. Share your progress with one person today.', scripture:'Proverbs 27:17', prompt:'Who in your life could benefit from this challenge?' },
  { day:22, title:'Debt snowball plan', task:'List all debts smallest to largest. Attack the smallest first.', scripture:'Romans 13:8', prompt:'What would debt freedom feel like?' },
  { day:23, title:'Free entertainment', task:'Spend zero on entertainment. Library, park, free museum.', scripture:'Ecclesiastes 5:12', prompt:'What free pleasures have you neglected?' },
  { day:24, title:'Read about wealth', task:'Read one chapter of a financial book today.', scripture:'Proverbs 10:14', prompt:'What financial belief from your upbringing needs updating?' },
  { day:25, title:'Giving beyond tithe', task:'Give to someone in need today — anonymously if possible.', scripture:'2 Corinthians 9:7', prompt:'How would you give if money was no object?' },
  { day:26, title:'Future self letter', task:'Write a letter to your future self 5 years from now.', scripture:'Jeremiah 29:11', prompt:'What financial future do you believe God has for you?' },
  { day:27, title:'Review insurance', task:'Review your insurance policies. Even $10/month saved helps.', scripture:'Proverbs 22:3', prompt:'Are you prepared for unexpected moments?' },
  { day:28, title:'Retirement question', task:'What would you need monthly in retirement? Start bridging the gap.', scripture:'Proverbs 13:22', prompt:'What legacy do you want to leave?' },
  { day:29, title:'Build accountability', task:'Find an accountability partner. Share your goals today.', scripture:'Ecclesiastes 4:9', prompt:'Who is doing well financially that you can learn from?' },
  { day:30, title:'Celebrate and commit', task:'You did it! Calculate total saved. Plan where to put it. Commit to the next 30 days.', scripture:'Deuteronomy 28:2', prompt:'What one habit will you keep forever?' },
]

export default function Challenge({ session }) {
  const tr = useT()
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [reflection, setReflection] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const userId = session.user.id

  async function fetchProgress() {
    setLoading(true)
    const { data } = await supabase.from('challenge_progress').select('*').eq('user_id', userId)
    const map = {}
    ;(data||[]).forEach(d => { map[d.day_number] = d })
    setProgress(map)
    setLoading(false)
  }
  useEffect(() => { fetchProgress() }, [])

  const completedDays = Object.values(progress).filter(p=>p.completed).length
  const totalSaved = Object.values(progress).reduce((s,p)=>s+Number(p.amount_saved||0),0)
  const pct = Math.round((completedDays/30)*100)
  const nextDay = TASKS.find(t=>!progress[t.day]?.completed)
  const [sharing, setSharing] = useState(false)
  const [shareMsg, setShareMsg] = useState('')

  async function shareProgress() {
    setSharing(true)
    const nextLine = nextDay ? `Next up: Day ${nextDay.day} — ${nextDay.title}` : '🏆 Challenge complete!'
    const content  = `⭐ ${completedDays}/30 days on the 30-Day Financial Challenge!\n${pct}% complete | $${totalSaved.toFixed(2)} saved\n${nextLine}\nAnyone else building better financial habits? Let's hold each other accountable! 💪`
    const { error } = await supabase.from('community_posts').insert({ user_id: userId, content, post_type: 'milestone' })
    setSharing(false)
    setShareMsg(error ? '⚠️ Could not share' : 'Shared! 🎉')
    setTimeout(() => setShareMsg(''), 3000)
  }

  function openDay(task) { setSelected(task); setReflection(progress[task.day]?.reflection||''); setAmount(progress[task.day]?.amount_saved||'') }

  async function completeDay() {
    if (!selected) return
    setSaving(true)
    const newAmount=parseFloat(amount)||0
    const newTotal=Object.values(progress).filter(p=>p.day_number!==selected.day).reduce((s,p)=>s+Number(p.amount_saved||0),0)+newAmount
    const existing=progress[selected.day]
    if(existing){await supabase.from('challenge_progress').update({completed:true,reflection,amount_saved:newAmount,total_saved:newTotal,completed_at:new Date().toISOString()}).eq('id',existing.id)}
    else{await supabase.from('challenge_progress').insert({user_id:userId,day_number:selected.day,completed:true,reflection,amount_saved:newAmount,total_saved:newTotal,completed_at:new Date().toISOString()})}
    setSaving(false); setSelected(null); fetchProgress()
  }

  if(loading) return <div className="spinner"/>

  return (
    <div>
      <div style={{ background:'linear-gradient(135deg, #BA7517, #7A4D0F)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>⭐</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.challengeTitle||"$100 Challenge"}</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.challengeSubtitle||"30 days to transform your finances"}</p>
      </div>
      <div className="card" style={{ textAlign:'center', padding:'20px 16px' }}>
        <div style={{ fontSize:48, fontWeight:700, color:'var(--green)' }}>{pct}%</div>
        <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:12 }}>{tr.challenge} {completedDays} {tr.of||'of'} 30 {tr.dayComplete||'complete'}</div>
        <div className="progress-wrap"><div className="progress-fill" style={{ width:`${pct}%` }}/></div>
        <div style={{ marginTop:12, fontSize:18, fontWeight:700, color:'var(--green)' }}>${totalSaved.toFixed(2)} {tr.saved||'saved'}</div>
        <div style={{ marginTop:12, display:'flex', justifyContent:'center', gap:8, alignItems:'center' }}>
          <button
            onClick={shareProgress} disabled={sharing || completedDays === 0}
            style={{ padding:'8px 18px', background:'var(--green)', color:'white', border:'none', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer', opacity:(sharing||completedDays===0)?0.5:1 }}
          >
            {sharing ? '…' : '📣 Share Progress'}
          </button>
          {shareMsg && <span style={{ fontSize:12, color:'var(--green)', fontWeight:600 }}>{shareMsg}</span>}
        </div>
      </div>
      {nextDay&&(
        <div className="card" onClick={()=>openDay(nextDay)} style={{ background:'var(--green)', cursor:'pointer' }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginBottom:4 }}>{tr.upNext||'Up next'} — Day {nextDay.day}</div>
          <div style={{ fontSize:16, fontWeight:700, color:'white' }}>{nextDay.title}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)', marginTop:4 }}>{nextDay.task.slice(0,80)}…</div>
          <div style={{ marginTop:10, fontSize:12, color:'rgba(255,255,255,0.7)' }}>{tr.tapToOpen||'Tap to open →'}</div>
        </div>
      )}
      {completedDays===30&&(
        <div className="card" style={{ background:'var(--gold-light)', textAlign:'center' }}>
          <div style={{ fontSize:32 }}>🏆</div>
          <div style={{ fontWeight:700, color:'var(--gold)', marginTop:8 }}>{tr.challengeComplete||'Challenge Complete!'}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>${totalSaved.toFixed(2)} {tr.savedInDays||'saved in 30 days!'}</div>
        </div>
      )}
      <div className="section-title">{tr.allDays||'All 30 days'}</div>
      <div className="day-grid">
        {TASKS.map(task=>{
          const done=progress[task.day]?.completed, isNext=nextDay?.day===task.day
          return <div key={task.day} className={`day-dot ${done?'done':isNext?'today':'locked'}`} onClick={()=>openDay(task)}>{done?'✓':task.day}</div>
        })}
      </div>
      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Day {selected.day}</div>
            <div className="modal-title">{selected.title}</div>
            <div style={{ padding:'12px 14px', background:'var(--green-light)', borderRadius:8, marginBottom:14, fontSize:14, color:'var(--green-dark)' }}>{selected.task}</div>
            <div style={{ padding:'10px 14px', background:'var(--gold-light)', borderRadius:8, marginBottom:14, fontSize:13, color:'var(--gold)' }}>✦ {selected.scripture}</div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{tr.amountSaved||'Amount saved today ($) — optional'}</label>
              <input type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} min="0" step="0.01"/>
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label>{selected.prompt}</label>
              <textarea placeholder={tr.writeThoughts||'Write your thoughts…'} value={reflection} onChange={e=>setReflection(e.target.value)} rows={3}
                style={{ padding:'12px 14px', border:'1px solid var(--border)', borderRadius:8, fontSize:14, background:'var(--bg)', color:'var(--text)', resize:'none', width:'100%', outline:'none' }}/>
            </div>
            <div className="modal-actions">
              <button onClick={()=>setSelected(null)} style={{padding:"14px", fontSize:14, fontWeight:600, background:"#f3f4f6", color:"#666", border:"none", borderRadius:10, cursor:"pointer"}}>{tr.cancel||"Cancel"}</button>
              <button onClick={completeDay} disabled={saving||progress[selected.day]?.completed} style={{flex:2, padding:"14px", fontSize:16, fontWeight:700, background:"linear-gradient(135deg, #1D9E75, #0F6E56)", color:"white", border:"none", borderRadius:10, cursor:"pointer"}}>
                {progress[selected.day]?.completed ? tr.completed||'✓ Completed' : saving ? 'Saving…' : tr.markComplete||'Mark complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
