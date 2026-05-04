import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'

const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦', KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA', INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' }

const SUGGESTED_QUESTIONS = [
  "How do I create a budget that actually works?",
  "What's the best way to pay off my debt?",
  "How much should I save for emergencies?",
  "How do I start investing with little money?",
  "What does the Bible say about money?",
  "How can I stop overspending?",
  "How do I save for a house down payment?",
  "Should I tithe even when I'm in debt?",
]

const SCENARIOS = [
  { id:'save_more', label:'Save more monthly', icon:'💰', prompt:'What if I saved an extra {amount}/month for 2 years?' },
  { id:'pay_debt', label:'Aggressively pay debt', icon:'🏦', prompt:'What if I put an extra {amount}/month toward paying off my debt?' },
  { id:'invest', label:'Start investing', icon:'📈', prompt:'What if I invested {amount}/month consistently for 3 years?' },
  { id:'cut_expenses', label:'Cut expenses 20%', icon:'✂️', prompt:'What if I reduced my monthly expenses by 20%?' },
  { id:'side_income', label:'Add side income', icon:'💼', prompt:'What if I earned an extra {amount}/month from a side hustle?' },
  { id:'emergency_fund', label:'Build emergency fund', icon:'🛡️', prompt:'How long would it take me to build a 3-month emergency fund?' },
]

function formatSimReport(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      const content = line.slice(2, -2)
      return <div key={i} style={{ fontWeight:700, color:'var(--green-dark)', marginTop:14, marginBottom:4, fontSize:13, textTransform:'uppercase', letterSpacing:'0.04em' }}>{content}</div>
    }
    if (line.startsWith('**') && line.includes('**')) {
      const boldEnd = line.indexOf('**', 2)
      const boldPart = line.slice(2, boldEnd)
      const rest = line.slice(boldEnd + 2)
      return <div key={i} style={{ marginBottom:4, fontSize:14, lineHeight:1.6 }}><strong style={{ color:'var(--green-dark)' }}>{boldPart}</strong>{rest}</div>
    }
    if (line.trim() === '') return <div key={i} style={{ height:6 }} />
    return <div key={i} style={{ fontSize:14, lineHeight:1.6, marginBottom:2 }}>{line}</div>
  })
}

function renderLine(line) {
  const parts = []
  const regex = /\*\*(.+?)\*\*/g
  let last = 0, match
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) parts.push(line.slice(last, match.index))
    parts.push(<strong key={match.index}>{match[1]}</strong>)
    last = match.index + match[0].length
  }
  if (last < line.length) parts.push(line.slice(last))
  return parts
}

function formatChat(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <span key={i}>{renderLine(line)}{i < lines.length - 1 && <br />}</span>
  ))
}

export default function AICoach({ session }) {
  const tr = useT()
  const [tab, setTab] = useState('chat')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    setMessages([{ role:'assistant', content: tr.coachWelcome || "Peace be upon you! I'm your AI Financial Coach, powered by real AI and your live financial data.\n\nI can answer questions about budgeting, debt, investing, saving, or biblical stewardship — using your actual numbers.\n\nWhat's on your financial heart today? 🙏" }])
  }, [tr.coachWelcome])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState(null)
  const [apiError, setApiError] = useState(null)
  const messagesEndRef = useRef(null)

  // Simulator state
  const [scenario, setScenario] = useState(null)
  const [simAmount, setSimAmount] = useState('')
  const [simCustom, setSimCustom] = useState('')
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState(null)

  const userId = session.user.id

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  useEffect(() => {
    async function loadContext() {
      const now = new Date()
      const monthYear = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
      const [{ data: entries }, { data: loans }, { data: goals }, { data: investments }, { data: user }] = await Promise.all([
        supabase.from('budget_entries').select('*').eq('user_id', userId).eq('month_year', monthYear),
        supabase.from('loans').select('*').eq('user_id', userId).eq('status', 'active'),
        supabase.from('savings_goals').select('*').eq('user_id', userId),
        supabase.from('investments').select('*').eq('user_id', userId),
        supabase.from('users').select('currency').eq('id', userId).single(),
      ])
      const currencySymbol = SYMBOLS[user?.currency] || user?.currency || '$'
      const income = (entries||[]).filter(e=>e.type==='income').reduce((s,e)=>s+Number(e.amount),0)
      const expenses = (entries||[]).filter(e=>e.type==='expense').reduce((s,e)=>s+Number(e.amount),0)
      const totalDebt = (loans||[]).reduce((s,l)=>s+Number(l.remaining_balance||l.principal),0)
      const totalInvestments = (investments||[]).reduce((s,i)=>s+Number(i.current_value||i.amount_invested||0),0)
      const surplus = income - expenses
      const savingRate = income > 0 ? Math.round((surplus/income)*100) : 0
      setContext({ income, expenses, surplus, totalDebt, savingRate, investments:totalInvestments, currencySymbol, loansCount:(loans||[]).length, goalsCount:(goals||[]).length })
    }
    loadContext()
  }, [userId])

  async function callAPI(msgs, mode = 'chat') {
    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgs, context, mode })
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to reach AI coach.')
    }
    const data = await res.json()
    return data.reply
  }

  async function sendMessage(text) {
    const userMsg = text || input.trim()
    if (!userMsg || loading) return
    setInput('')
    setApiError(null)
    setLoading(true)
    const newMessages = [...messages, { role:'user', content:userMsg }]
    setMessages(newMessages)
    try {
      const reply = await callAPI(newMessages.map(m => ({ role:m.role, content:m.content })))
      setMessages(prev => [...prev, { role:'assistant', content:reply }])
    } catch(e) {
      setApiError(e.message)
      setMessages(prev => [...prev, { role:'assistant', content:"I'm having trouble connecting right now. Please try again in a moment. 🙏" }])
    }
    setLoading(false)
  }

  async function runSimulation() {
    if (!scenario) return
    setSimResult(null)
    setSimError(null)
    setSimLoading(true)
    const sym = context?.currencySymbol || '$'
    const amount = simAmount || Math.round((context?.surplus || 200) * 0.3).toString()
    let prompt = scenario.prompt.replace('{amount}', `${sym}${amount}`)
    if (simCustom.trim()) prompt = simCustom.trim()
    try {
      const reply = await callAPI([{ role:'user', content:prompt }], 'simulate')
      setSimResult(reply)
    } catch(e) {
      setSimError(e.message)
    }
    setSimLoading(false)
  }

  const sym = context?.currencySymbol || '$'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 130px)', paddingTop:16 }}>

      {/* Header */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg, #1D9E75, #0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🤖</div>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>AI Financial Coach</h2>
            <div style={{ fontSize:12, color:'var(--green)', fontWeight:500 }}>● {tr.poweredByClaude||'Powered by Claude'} · {tr.yourLiveData||'Your live data'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          {[['chat',`💬 ${tr.chatTab||'Chat'}`], ['simulate',`🔮 ${tr.simulatorTab||'Simulator'}`]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding:'6px 16px', borderRadius:20, border:`1.5px solid ${tab===id?'var(--green)':'var(--border)'}`, background:tab===id?'var(--green-light)':'transparent', color:tab===id?'var(--green-dark)':'var(--text-muted)', fontWeight:tab===id?700:500, fontSize:13, cursor:'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Financial snapshot pills */}
        {context && context.income > 0 && (
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
            {[
              { label: tr.income||'Income', value:`${sym}${context.income.toLocaleString()}`, color:'#1D9E75' },
              { label: tr.expenses||'Exp', value:`${sym}${context.expenses.toLocaleString()}`, color:'#A32D2D' },
              { label: tr.surplus||'Surplus', value:`${context.surplus>=0?'+':''}${sym}${Math.abs(context.surplus).toLocaleString()}`, color:context.surplus>=0?'#1D9E75':'#A32D2D' },
              { label: tr.totalDebt||'Debt', value:`${sym}${context.totalDebt.toLocaleString()}`, color:'#BA7517' },
            ].map((s,i) => (
              <div key={i} style={{ padding:'4px 10px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>
                <span style={{ fontSize:10, color:'var(--text-muted)' }}>{s.label} </span>
                <span style={{ fontSize:11, fontWeight:700, color:s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {apiError && (
        <div style={{ padding:'10px 14px', background:'#FFF3CD', border:'1px solid #FFC107', borderRadius:10, marginBottom:10, fontSize:13, color:'#856404' }}>
          ⚠️ {apiError.includes('ANTHROPIC_API_KEY') ? 'Add your ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables, then redeploy.' : apiError}
        </div>
      )}

      {/* ── CHAT TAB ── */}
      {tab === 'chat' && (
        <>
          <div style={{ flex:1, overflowY:'auto', paddingRight:4 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start', marginBottom:12 }}>
                {msg.role==='assistant' && (
                  <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg, #1D9E75, #0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginRight:8, flexShrink:0, alignSelf:'flex-end' }}>🤖</div>
                )}
                <div style={{
                  maxWidth:'80%', padding:'10px 14px',
                  borderRadius: msg.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',
                  background: msg.role==='user'?'linear-gradient(135deg, #1D9E75, #0F6E56)':'var(--bg)',
                  color: msg.role==='user'?'white':'var(--text)',
                  border: msg.role==='assistant'?'1px solid var(--border)':'none',
                  fontSize:14, lineHeight:1.6
                }}>
                  {formatChat(msg.content)}
                </div>
                {msg.role==='user' && (
                  <div style={{ width:32, height:32, borderRadius:10, background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginLeft:8, flexShrink:0, alignSelf:'flex-end' }}>👤</div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg, #1D9E75, #0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
                <div style={{ padding:'12px 16px', borderRadius:'16px 16px 16px 4px', background:'var(--bg)', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', animation:`bounce 1s infinite ${i*0.2}s` }}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {messages.length <= 1 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, fontWeight:600, letterSpacing:'0.06em' }}>{tr.suggestedQuestions||'SUGGESTED QUESTIONS'}</div>
              <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
                {[tr.sq1||"How do I create a budget?", tr.sq2||"Best way to pay off debt?", tr.sq3||"How much to save for emergencies?", tr.sq4||"How to start investing?", tr.sq5||"What does the Bible say about money?", tr.sq6||"How to stop overspending?", tr.sq7||"How to save for a house?", tr.sq8||"Should I tithe even in debt?"].map((q,i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    style={{ padding:'6px 12px', background:'var(--green-light)', border:'1px solid var(--green)', borderRadius:20, fontSize:12, color:'var(--green-dark)', cursor:'pointer', whiteSpace:'nowrap', fontWeight:500, flexShrink:0 }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8, alignItems:'flex-end', paddingBottom:8 }}>
            <div style={{ flex:1, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:16, padding:'8px 14px' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={tr.typeMessage||'Ask about budgeting, debt, investing…'}
                rows={1}
                style={{ width:'100%', border:'none', outline:'none', fontSize:14, background:'transparent', color:'var(--text)', resize:'none', lineHeight:1.5, maxHeight:80, overflowY:'auto' }}
              />
            </div>
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{ width:44, height:44, borderRadius:14, background:input.trim()?'linear-gradient(135deg, #1D9E75, #0F6E56)':'#e5e7eb', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:input.trim()?'pointer':'not-allowed', fontSize:18, flexShrink:0 }}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>
        </>
      )}

      {/* ── SIMULATOR TAB ── */}
      {tab === 'simulate' && (
        <div style={{ flex:1, overflowY:'auto', paddingBottom:20 }}>
          <div style={{ padding:'12px 16px', background:'var(--green-light)', borderRadius:12, border:'1px solid var(--green)', marginBottom:16, fontSize:13, color:'var(--green-dark)' }}>
            🔮 <strong>{tr.simulatorTab||'What-If Simulator'}</strong> — {tr.simDesc||'Pick a scenario and the AI will simulate your financial future month by month using your real data.'}
          </div>

          {/* Scenario picker */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:8, letterSpacing:'0.05em' }}>{tr.pickScenario||'PICK A SCENARIO'}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { id:'save_more', label:tr.scSaveMore||'Save more monthly', icon:'💰', prompt:`What if I saved an extra {amount}/month for 2 years?` },
                { id:'pay_debt', label:tr.scPayDebt||'Aggressively pay debt', icon:'🏦', prompt:`What if I put an extra {amount}/month toward paying off my debt?` },
                { id:'invest', label:tr.scInvest||'Start investing', icon:'📈', prompt:`What if I invested {amount}/month consistently for 3 years?` },
                { id:'cut_expenses', label:tr.scCutExp||'Cut expenses 20%', icon:'✂️', prompt:`What if I reduced my monthly expenses by 20%?` },
                { id:'side_income', label:tr.scSideIncome||'Add side income', icon:'💼', prompt:`What if I earned an extra {amount}/month from a side hustle?` },
                { id:'emergency_fund', label:tr.scEmergency||'Build emergency fund', icon:'🛡️', prompt:`How long would it take me to build a 3-month emergency fund?` },
              ].map(s => (
                <button key={s.id} onClick={() => { setScenario(s); setSimResult(null); setSimError(null) }}
                  style={{ padding:'10px 12px', borderRadius:12, border:`2px solid ${scenario?.id===s.id?'var(--green)':'var(--border)'}`, background:scenario?.id===s.id?'var(--green-light)':'white', textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:18 }}>{s.icon}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:scenario?.id===s.id?'var(--green-dark)':'var(--text)' }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {scenario && ['save_more','pay_debt','invest','side_income'].includes(scenario.id) && (
            <div className="form-group" style={{ marginBottom:12 }}>
              <label style={{ fontSize:13 }}>{tr.monthly||'Monthly amount'} ({sym})</label>
              <input type="number" value={simAmount} onChange={e => setSimAmount(e.target.value)}
                placeholder={`${Math.max(50, Math.round((context?.surplus||200)*0.3))}`}
                style={{ fontSize:15 }}
              />
            </div>
          )}

          {/* Custom scenario override */}
          <div className="form-group" style={{ marginBottom:14 }}>
            <label style={{ fontSize:13 }}>{tr.orDescribe||'Or describe your own scenario (optional)'}</label>
            <textarea value={simCustom} onChange={e => setSimCustom(e.target.value)}
              placeholder={tr.simPlaceholder||'e.g. What if I sold my car, paid off my credit card, and invested the monthly savings?'}
              rows={2}
              style={{ width:'100%', padding:'10px 14px', border:'1px solid var(--border)', borderRadius:10, fontSize:14, resize:'none', color:'var(--text)', background:'var(--bg)', boxSizing:'border-box' }}
            />
          </div>

          <button onClick={runSimulation} disabled={simLoading || (!scenario && !simCustom.trim())}
            style={{ width:'100%', padding:'14px', borderRadius:12, background: (scenario||simCustom.trim()) && !simLoading ? 'linear-gradient(135deg, #1D9E75, #0F6E56)' : '#e5e7eb', color: (scenario||simCustom.trim()) && !simLoading ? 'white' : '#9ca3af', border:'none', fontSize:16, fontWeight:700, cursor:(scenario||simCustom.trim())&&!simLoading?'pointer':'not-allowed', marginBottom:16 }}>
            {simLoading ? `⏳ ${tr.simRunning||'Running simulation…'}` : `🔮 ${tr.runSim||'Run Simulation'}`}
          </button>

          {simError && (
            <div style={{ padding:'12px 14px', background:'#FFF3CD', border:'1px solid #FFC107', borderRadius:10, fontSize:13, color:'#856404', marginBottom:12 }}>
              ⚠️ {simError.includes('ANTHROPIC_API_KEY') ? 'Add ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables.' : simError}
            </div>
          )}

          {simResult && (
            <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:16, padding:'18px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:22 }}>📊</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{tr.simReport||'Simulation Report'}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{tr.simBasedOn||'Based on your live financial data'}</div>
                </div>
              </div>
              {formatSimReport(simResult)}
              <button onClick={() => { setSimResult(null); setScenario(null); setSimCustom(''); setSimAmount('') }}
                style={{ marginTop:16, width:'100%', padding:'10px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, fontSize:13, color:'var(--text-muted)', cursor:'pointer', fontWeight:600 }}>
                ↩ Run another simulation
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
