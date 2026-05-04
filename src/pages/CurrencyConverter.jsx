import { useState, useEffect } from 'react'
import { useT } from '../lib/i18n'

const CURRENCIES = [
  { code:'USD', symbol:'$', name:'US Dollar', flag:'🇺🇸' },
  { code:'EUR', symbol:'€', name:'Euro', flag:'🇪🇺' },
  { code:'GBP', symbol:'£', name:'British Pound', flag:'🇬🇧' },
  { code:'CAD', symbol:'C$', name:'Canadian Dollar', flag:'🇨🇦' },
  { code:'AUD', symbol:'A$', name:'Australian Dollar', flag:'🇦🇺' },
  { code:'NGN', symbol:'₦', name:'Nigerian Naira', flag:'🇳🇬' },
  { code:'KES', symbol:'KSh', name:'Kenyan Shilling', flag:'🇰🇪' },
  { code:'GHS', symbol:'₵', name:'Ghanaian Cedi', flag:'🇬🇭' },
  { code:'ZAR', symbol:'R', name:'South African Rand', flag:'🇿🇦' },
  { code:'XOF', symbol:'CFA', name:'West African CFA', flag:'🌍' },
  { code:'XAF', symbol:'FCFA', name:'Central African CFA', flag:'🌍' },
  { code:'INR', symbol:'₹', name:'Indian Rupee', flag:'🇮🇳' },
  { code:'BRL', symbol:'R$', name:'Brazilian Real', flag:'🇧🇷' },
  { code:'MXN', symbol:'MX$', name:'Mexican Peso', flag:'🇲🇽' },
  { code:'CNY', symbol:'¥', name:'Chinese Yuan', flag:'🇨🇳' },
  { code:'JPY', symbol:'¥', name:'Japanese Yen', flag:'🇯🇵' },
  { code:'KRW', symbol:'₩', name:'Korean Won', flag:'🇰🇷' },
  { code:'RUB', symbol:'₽', name:'Russian Ruble', flag:'🇷🇺' },
  { code:'SAR', symbol:'﷼', name:'Saudi Riyal', flag:'🇸🇦' },
  { code:'AED', symbol:'د.إ', name:'UAE Dirham', flag:'🇦🇪' },
]

export default function CurrencyConverter() {
  const tr = useT()
  const [rates, setRates] = useState({})
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('100')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('NGN')
  const [lastUpdated, setLastUpdated] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        const data = await res.json()
        if (data.result === 'success') {
          setRates(data.rates)
          setLastUpdated(new Date(data.time_last_update_utc).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }))
        }
      } catch(e) { setError(true) }
      setLoading(false)
    }
    fetchRates()
  }, [])

  function convert(amt, from, to) {
    if (!rates[from] || !rates[to]) return 0
    const inUSD = parseFloat(amt) / rates[from]
    return (inUSD * rates[to]).toFixed(2)
  }

  function swap() {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const result = convert(amount, fromCurrency, toCurrency)
  const fromCur = CURRENCIES.find(c => c.code === fromCurrency)
  const toCur = CURRENCIES.find(c => c.code === toCurrency)

  // Popular pairs for immigrants
  const popularPairs = [
    { from:'USD', to:'NGN', label:'USD → NGN' },
    { from:'USD', to:'KES', label:'USD → KES' },
    { from:'USD', to:'GHS', label:'USD → GHS' },
    { from:'EUR', to:'XOF', label:'EUR → CFA' },
    { from:'GBP', to:'NGN', label:'GBP → NGN' },
    { from:'USD', to:'INR', label:'USD → INR' },
    { from:'USD', to:'BRL', label:'USD → BRL' },
    { from:'CAD', to:'NGN', label:'CAD → NGN' },
  ]

  return (
    <div style={{ paddingBottom:100 }}>
      <div style={{ background:'linear-gradient(135deg, #185FA5, #0D3D6E)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ fontSize:28, marginBottom:4 }}>💱</div>
        <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>Currency Converter</h2>
        <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>Live exchange rates · Updated daily</p>
      </div>

      <div style={{ padding:'24px 0 0' }}>
        {loading && <div className="spinner"/>}
        {error && <div style={{ padding:16, background:'#FCEBEB', borderRadius:10, marginBottom:16, fontSize:13, color:'#A32D2D' }}>⚠️ Could not load rates. Check your connection.</div>}

        {!loading && !error && (
          <>
            {/* Converter card */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:12, textAlign:'right' }}>
                🕐 Updated: {lastUpdated}
              </div>

              {/* Amount input */}
              <div className="form-group" style={{ marginBottom:12 }}>
                <label>Amount</label>
                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="100" min="0"
                  style={{ fontSize:24, fontWeight:700, color:'var(--green)' }}/>
              </div>

              {/* From currency */}
              <div className="form-group" style={{ marginBottom:8 }}>
                <label>From</label>
                <select value={fromCurrency} onChange={e=>setFromCurrency(e.target.value)}
                  style={{ fontSize:15, fontWeight:600 }}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                </select>
              </div>

              {/* Swap button */}
              <div style={{ textAlign:'center', margin:'4px 0' }}>
                <button onClick={swap} style={{ background:'var(--green-light)', border:'1px solid var(--green)', borderRadius:20, padding:'6px 16px', cursor:'pointer', fontSize:16, color:'var(--green)' }}>⇅ Swap</button>
              </div>

              {/* To currency */}
              <div className="form-group" style={{ marginBottom:16 }}>
                <label>To</label>
                <select value={toCurrency} onChange={e=>setToCurrency(e.target.value)}
                  style={{ fontSize:15, fontWeight:600 }}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                </select>
              </div>

              {/* Result */}
              <div style={{ background:'linear-gradient(135deg, #1D9E75, #0F6E56)', borderRadius:14, padding:'16px 20px', textAlign:'center', color:'white' }}>
                <div style={{ fontSize:13, opacity:0.8, marginBottom:4 }}>{amount} {fromCurrency} =</div>
                <div style={{ fontSize:36, fontWeight:900, letterSpacing:'-1px' }}>{toCur?.symbol}{Number(result).toLocaleString()}</div>
                <div style={{ fontSize:14, opacity:0.8, marginTop:4 }}>{toCur?.name}</div>
                <div style={{ fontSize:11, opacity:0.6, marginTop:8 }}>
                  1 {fromCurrency} = {toCur?.symbol}{convert(1, fromCurrency, toCurrency)} {toCurrency}
                </div>
              </div>
            </div>

            {/* Popular pairs */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🌍 Popular for immigrants</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {popularPairs.map((pair,i) => {
                  const rate = convert(1, pair.from, pair.to)
                  const toCurr = CURRENCIES.find(c=>c.code===pair.to)
                  return (
                    <button key={i} onClick={()=>{setFromCurrency(pair.from);setToCurrency(pair.to)}}
                      style={{ padding:'10px 12px', background:fromCurrency===pair.from&&toCurrency===pair.to?'var(--green-light)':'var(--bg)', border:`1px solid ${fromCurrency===pair.from&&toCurrency===pair.to?'var(--green)':'var(--border)'}`, borderRadius:10, cursor:'pointer', textAlign:'left' }}>
                      <div style={{ fontSize:12, fontWeight:600, color:fromCurrency===pair.from&&toCurrency===pair.to?'var(--green-dark)':'var(--text)' }}>{pair.label}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>1 {pair.from} = {toCurr?.symbol}{rate}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* All rates table */}
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📊 All rates vs {fromCurrency}</div>
              {CURRENCIES.filter(c=>c.code!==fromCurrency).map((cur,i) => {
                const rate = convert(1, fromCurrency, cur.code)
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i<CURRENCIES.length-2?'1px solid var(--border)':'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18 }}>{cur.flag}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{cur.code}</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)' }}>{cur.name}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--green)' }}>{cur.symbol}{rate}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>per 1 {fromCurrency}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Premium upsell */}
            <div className="card" style={{ background:'linear-gradient(135deg, #534AB7, #342D8A)', color:'white' }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>👑 Premium: Multi-currency budget</div>
              <div style={{ fontSize:12, opacity:0.85, marginBottom:12 }}>Track your budget in multiple currencies simultaneously. Perfect for immigrants managing money across countries.</div>
              <button style={{ padding:'8px 16px', background:'white', color:'#342D8A', border:'none', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}
                onClick={()=>window.location.href='/premium'}>
                Upgrade to Premium →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
