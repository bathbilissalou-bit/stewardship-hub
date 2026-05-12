import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useT, getLang, LANG_LOCALES, interpolate } from '../lib/i18n'

const TYPES = ['stocks','index_funds','real_estate','business','crypto','bonds','other']
const SYMBOLS = { USD:'$', EUR:'€', GBP:'£', CAD:'C$', AUD:'A$', NGN:'₦', KES:'KSh', GHS:'₵', ZAR:'R', XOF:'CFA', XAF:'FCFA', INR:'₹', BRL:'R$', MXN:'MX$', CNY:'¥', JPY:'¥', KRW:'₩', RUB:'₽' }

// ── Worldwide platforms ──────────────────────────────────────────────────────
const PLATFORMS = [
  { group:'🌍 Africa',       options:['Bamboo','Chaka','Trove','Cowrywise','PiggyVest','EasyEquities','ABSA Stockbrokers','Stanbic Stockbrokers','NSE (Nigeria)','JSE (South Africa)'] },
  { group:'🇨🇦 Canada',      options:['Wealthsimple Trade','Questrade','TD Direct Investing','RBC Direct Investing','BMO InvestorLine',"CIBC Investor's Edge",'Scotia iTRADE','National Bank Direct Brokerage','Disnat','Qtrade'] },
  { group:'🇺🇸 USA',         options:['Robinhood','Fidelity','Vanguard','Charles Schwab','TD Ameritrade','E*TRADE','Interactive Brokers','Merrill Edge','Ally Invest','SoFi Invest'] },
  { group:'🌎 Latin America',options:['XP Investimentos','NuInvest','Rico','Modalmais','GBM+','Flink'] },
  { group:'🇪🇺 Europe',      options:['eToro','Trading 212','DEGIRO','Freetrade','Revolut','Saxo Bank','Scalable Capital','Flatex','Boursorama','BNP Paribas'] },
  { group:'🌏 Asia',         options:['Zerodha','Groww','Upstox','Angel One','Tiger Brokers','Futu (Moomoo)','Rakuten Securities','SBI Securities','Kakao Pay Securities','Kiwoom'] },
  { group:'🌐 Global',       options:['Interactive Brokers Global','eToro Global','Saxo Bank Global','Swissquote','Other'] },
]

// ── Ticker auto-detection ────────────────────────────────────────────────────
// Maps name keywords → Yahoo Finance ticker
const STOCK_TICKER_MAP = [
  [/s&p\s*500|spy\b|voo\b/i, 'SPY'],
  [/nasdaq|qqq\b/i, 'QQQ'],
  [/vti\b|vanguard total/i, 'VTI'],
  [/vxus\b/i, 'VXUS'],
  [/apple|aapl\b/i, 'AAPL'],
  [/microsoft|msft\b/i, 'MSFT'],
  [/google|alphabet|googl\b/i, 'GOOGL'],
  [/amazon|amzn\b/i, 'AMZN'],
  [/tesla|tsla\b/i, 'TSLA'],
  [/meta\b|facebook/i, 'META'],
  [/nvidia|nvda\b/i, 'NVDA'],
  [/berkshire/i, 'BRK-B'],
  [/ishares|agg\b/i, 'AGG'],
  [/treasury|tlt\b/i, 'TLT'],
  [/gold|gld\b/i, 'GLD'],
  [/silver|slv\b/i, 'SLV'],
  [/real estate|vnq\b|reit/i, 'VNQ'],
]

// Maps name keywords → CoinGecko ID
const CRYPTO_ID_MAP = [
  [/bitcoin|btc\b/i, 'bitcoin'],
  [/ethereum|eth\b/i, 'ethereum'],
  [/binance|bnb\b/i, 'binancecoin'],
  [/solana|sol\b/i, 'solana'],
  [/cardano|ada\b/i, 'cardano'],
  [/xrp\b|ripple/i, 'ripple'],
  [/dogecoin|doge\b/i, 'dogecoin'],
  [/polygon|matic\b/i, 'matic-network'],
  [/polkadot|dot\b/i, 'polkadot'],
  [/avalanche|avax\b/i, 'avalanche-2'],
  [/chainlink|link\b/i, 'chainlink'],
  [/litecoin|ltc\b/i, 'litecoin'],
  [/uniswap|uni\b/i, 'uniswap'],
  [/stellar|xlm\b/i, 'stellar'],
  [/tron\b|trx\b/i, 'tron'],
  [/shiba|shib\b/i, 'shiba-inu'],
  [/pepe\b/i, 'pepe'],
  [/toncoin|ton\b/i, 'the-open-network'],
]

function guessTickerFromName(name, type) {
  if (!name) return { stockTicker: null, cryptoId: null }
  if (type === 'crypto' || /crypto/i.test(type)) {
    for (const [re, id] of CRYPTO_ID_MAP) {
      if (re.test(name)) return { stockTicker: null, cryptoId: id }
    }
  }
  for (const [re, ticker] of STOCK_TICKER_MAP) {
    if (re.test(name)) return { stockTicker: ticker, cryptoId: null }
  }
  // If name itself looks like a ticker (2-5 uppercase letters), use it directly
  if (/^[A-Z]{2,5}$/.test(name.trim())) return { stockTicker: name.trim(), cryptoId: null }
  return { stockTicker: null, cryptoId: null }
}

function detectType(name) {
  const n = name.toLowerCase()
  if (/btc|bitcoin|eth|ethereum|crypto|coin|token|defi|bnb|sol|ada/.test(n)) return 'crypto'
  if (/s&p|nasdaq|index|etf|fund|vanguard|fidelity|schwab|ishares|vti|spy|qqq/.test(n)) return 'index_funds'
  if (/bond|treasury|govt|government|t-bill|tbill|fixed income|sukuk/.test(n)) return 'bonds'
  if (/real estate|property|reit|land|house|apartment|rental/.test(n)) return 'real_estate'
  if (/business|startup|venture|company|equity|llc|ltd/.test(n)) return 'business'
  if (/stock|share|aapl|tsla|amzn|googl|msft|equity/.test(n)) return 'stocks'
  return null
}

// ── Styles ───────────────────────────────────────────────────────────────────
const CELL = { padding:'8px 10px', borderRight:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', fontSize:12, background:'white', color:'#1a1a1a', verticalAlign:'middle' }
const HEAD = { ...CELL, background:'#f3f4f6', fontWeight:600, fontSize:11, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }
const INPUT_CELL = { ...CELL, padding:0 }
const DESC_CELL = { ...CELL, fontWeight:600, minWidth:120, maxWidth:160, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }

function EditableCell({ value, onChange, type='text', placeholder='' }) {
  return (
    <td style={INPUT_CELL}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'8px 10px', border:'none', outline:'none', fontSize:12, background:'transparent', color:'#1a1a1a' }} />
    </td>
  )
}

function SelectCell({ value, onChange, options, labels }) {
  return (
    <td style={INPUT_CELL}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'8px 6px', border:'none', outline:'none', fontSize:11, background:'transparent', color:'#1a1a1a', appearance:'none' }}>
        {options.map(o => <option key={o} value={o}>{labels[o]}</option>)}
      </select>
    </td>
  )
}

function PlatformCell({ value, onChange, emptyLabel }) {
  return (
    <td style={INPUT_CELL}>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'8px 6px', border:'none', outline:'none', fontSize:11, background:'transparent', color: value ? '#1a1a1a' : '#9ca3af', appearance:'none' }}>
        <option value="">{emptyLabel}</option>
        {PLATFORMS.map(g => (
          <optgroup key={g.group} label={g.group}>
            {g.options.map(p => <option key={p} value={p}>{p}</option>)}
          </optgroup>
        ))}
      </select>
    </td>
  )
}

// ── Live price chip ──────────────────────────────────────────────────────────
function PriceChip({ data, loading, liveLabel, priceLocale }) {
  const loc = priceLocale || 'en-US'
  if (loading) return <span style={{ fontSize:10, color:'#9ca3af' }}>…</span>
  if (!data) return null
  const change = data.change24h ?? (data.prev ? ((data.price - data.prev) / data.prev * 100) : null)
  const up = change >= 0
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:1 }}>
      <span style={{ fontSize:11, fontWeight:700, color:'#185FA5' }}>
        ${data.price?.toLocaleString(loc, { minimumFractionDigits:2, maximumFractionDigits: data.price < 1 ? 6 : 2 })}
      </span>
      {change != null && (
        <span style={{ fontSize:10, fontWeight:600, color: up ? '#1D9E75' : '#A32D2D' }}>
          {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </span>
      )}
      <span style={{ fontSize:9, color:'#9ca3af', letterSpacing:'0.02em' }}>{liveLabel}</span>
    </div>
  )
}

// ── Market browser panel ─────────────────────────────────────────────────────
const WATCHLIST = [
  { label:'S&P 500',  ticker:'SPY',      type:'stock' },
  { label:'NASDAQ',   ticker:'QQQ',      type:'stock' },
  { label:'Total Mkt',ticker:'VTI',      type:'stock' },
  { label:'Gold',     ticker:'GLD',      type:'stock' },
  { label:'Bonds',    ticker:'AGG',      type:'stock' },
  { label:'Bitcoin',  id:'bitcoin',      type:'crypto' },
  { label:'Ethereum', id:'ethereum',     type:'crypto' },
  { label:'BNB',      id:'binancecoin',  type:'crypto' },
  { label:'Solana',   id:'solana',       type:'crypto' },
  { label:'XRP',      id:'ripple',       type:'crypto' },
  { label:'Cardano',  id:'cardano',      type:'crypto' },
  { label:'Dogecoin', id:'dogecoin',     type:'crypto' },
  { label:'MATIC',    id:'matic-network',type:'crypto' },
  { label:'DOT',      id:'polkadot',     type:'crypto' },
  { label:'Avalanche',id:'avalanche-2',  type:'crypto' },
  { label:'Chainlink',id:'chainlink',    type:'crypto' },
]

export default function Investments({ session, lang }) {
  const tr = useT()
  const locale = LANG_LOCALES[getLang()] || 'en-US'
  const fmt = n => Number(n || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtShort = n => Number(n || 0).toLocaleString(locale, { maximumFractionDigits: 0 })
  const typeLabels = {
    stocks: tr.inv_type_stocks,
    index_funds: tr.inv_type_index_funds,
    real_estate: tr.inv_type_real_estate,
    business: tr.inv_type_business,
    crypto: tr.inv_type_crypto,
    bonds: tr.inv_type_bonds,
    other: tr.inv_type_other,
  }
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newRow, setNewRow] = useState(null)

  // Live market data
  const [livePrices, setLivePrices] = useState({})   // keyed by inv.id
  const [watchPrices, setWatchPrices] = useState({})  // keyed by ticker/id
  const [pricesLoading, setPricesLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showMarket, setShowMarket] = useState(false)

  // Ticker overrides stored locally (investmentId → ticker string)
  const [tickerMap, setTickerMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sh_tickers') || '{}') } catch { return {} }
  })

  const userId = session.user.id

  useEffect(() => {
    supabase.from('users').select('currency').eq('id', userId).single()
      .then(({ data }) => { if (data?.currency) setCurrencySymbol(SYMBOLS[data.currency] || data.currency) })
  }, [userId])

  async function fetchInvestments() {
    setLoading(true)
    const { data } = await supabase.from('investments').select('*').eq('user_id', userId).order('investment_date', { ascending:false })
    setInvestments(data || [])
    setLoading(false)
  }
  useEffect(() => { fetchInvestments() }, [])

  // ── Fetch live prices for portfolio ────────────────────────────────────────
  const fetchLivePrices = useCallback(async (invList, tMap) => {
    if (!invList.length) return
    setPricesLoading(true)

    const stockTickers = []
    const cryptoIds = []
    const invTickerMap = {} // invId → { stockTicker, cryptoId }

    invList.forEach(inv => {
      const override = tMap[inv.id]
      if (override) {
        // user-specified ticker
        if (/^[A-Z0-9.\-]{1,10}$/.test(override)) {
          stockTickers.push(override)
          invTickerMap[inv.id] = { stockTicker: override }
        } else {
          cryptoIds.push(override)
          invTickerMap[inv.id] = { cryptoId: override }
        }
      } else {
        const { stockTicker, cryptoId } = guessTickerFromName(inv.name, inv.type)
        if (stockTicker) { stockTickers.push(stockTicker); invTickerMap[inv.id] = { stockTicker } }
        else if (cryptoId) { cryptoIds.push(cryptoId); invTickerMap[inv.id] = { cryptoId } }
      }
    })

    const params = new URLSearchParams()
    if (stockTickers.length) params.set('tickers', [...new Set(stockTickers)].join(','))
    if (cryptoIds.length) params.set('crypto', [...new Set(cryptoIds)].join(','))

    if (!params.toString()) { setPricesLoading(false); return }

    try {
      const res = await fetch(`/api/prices?${params}`)
      const raw = await res.json()

      const newLive = {}
      invList.forEach(inv => {
        const map = invTickerMap[inv.id]
        if (!map) return
        const key = map.stockTicker || map.cryptoId
        if (raw[key]) newLive[inv.id] = { ...raw[key], key }
      })
      setLivePrices(newLive)
      setLastUpdated(new Date())
    } catch { /* silent */ }
    setPricesLoading(false)
  }, [])

  // ── Fetch watchlist prices ──────────────────────────────────────────────────
  const fetchWatchPrices = useCallback(async () => {
    const tickers = WATCHLIST.filter(w => w.type === 'stock').map(w => w.ticker).join(',')
    const crypto  = WATCHLIST.filter(w => w.type === 'crypto').map(w => w.id).join(',')
    try {
      const res = await fetch(`/api/prices?tickers=${tickers}&crypto=${crypto}`)
      const raw = await res.json()
      setWatchPrices(raw)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (investments.length) fetchLivePrices(investments, tickerMap)
  }, [investments])

  useEffect(() => {
    if (showMarket) fetchWatchPrices()
  }, [showMarket])

  // Save ticker override
  function saveTicker(invId, ticker) {
    const next = { ...tickerMap, [invId]: ticker.trim() }
    setTickerMap(next)
    localStorage.setItem('sh_tickers', JSON.stringify(next))
  }

  const totalInvested = investments.reduce((s,i) => s + Number(i.amount_invested||0), 0)
  // Use live price * shares if available, else stored current_value
  const totalValue = investments.reduce((s,i) => {
    const live = livePrices[i.id]
    const stored = Number(i.current_value||i.amount_invested||0)
    // We don't track shares, so live price just shows the market price info
    // but total value stays as user-entered current_value
    return s + stored
  }, 0)
  const totalGain = totalValue - totalInvested
  const totalROI = totalInvested > 0 ? (totalGain / totalInvested * 100) : 0

  async function updateInvestment(id, field, value) {
    const updates = { [field]: ['amount_invested','current_value'].includes(field) ? parseFloat(value)||0 : value }
    if (field === 'name') {
      const detected = detectType(value)
      if (detected) updates.type = detected
    }
    await supabase.from('investments').update(updates).eq('id', id)
    setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  async function deleteInvestment(id) {
    await supabase.from('investments').delete().eq('id', id)
    fetchInvestments()
  }

  async function saveNewRow() {
    if (!newRow.name || !newRow.amount_invested) return
    setSaving(true)
    await supabase.from('investments').insert({
      user_id: userId,
      name: newRow.name,
      type: newRow.type,
      platform: newRow.platform,
      amount_invested: parseFloat(newRow.amount_invested)||0,
      current_value: parseFloat(newRow.current_value)||parseFloat(newRow.amount_invested)||0,
      investment_date: newRow.investment_date || new Date().toISOString().split('T')[0],
    })
    setNewRow(null); setSaving(false); fetchInvestments()
  }

  function roiColor(v) { return v > 0 ? '#1D9E75' : v < 0 ? '#A32D2D' : '#6b7280' }

  const byType = TYPES.map(type => ({
    type, label: typeLabels[type],
    value: investments.filter(i => i.type === type).reduce((s,i) => s + Number(i.current_value||i.amount_invested||0), 0),
  })).filter(g => g.value > 0)

  const TYPE_COLORS = ['#1D9E75','#185FA5','#BA7517','#A32D2D','#7F77DD','#5F5E5A','#3B6D11']

  return (
    <div>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #3B6D11, #254508)', borderRadius:'16px 16px 0 0', padding:'18px 16px 28px', marginBottom:'-14px', color:'white' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:28, marginBottom:4 }}>📈</div>
            <h2 style={{ color:'white', margin:'0 0 4px', fontSize:22, fontWeight:800 }}>{tr.investTitle||'Investment Tracker'}</h2>
            <p style={{ color:'rgba(255,255,255,0.8)', margin:0, fontSize:13 }}>{tr.investSubtitle||'Watch your wealth grow'}</p>
          </div>
          <button onClick={() => { fetchLivePrices(investments, tickerMap); if (showMarket) fetchWatchPrices() }}
            disabled={pricesLoading}
            style={{ padding:'6px 12px', background:'rgba(255,255,255,0.15)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            {pricesLoading ? '⟳' : '🔄'} {pricesLoading ? tr.inv_updating : tr.inv_refresh}
          </button>
        </div>
        {lastUpdated && (
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:6 }}>
            {interpolate(tr.inv_live_prices_line, { time: lastUpdated.toLocaleTimeString(locale) })}
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="metric-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
        <div className="metric-card"><div className="metric-label">{tr.totalInvested||'Total invested'}</div><div className="metric-value" style={{ fontSize:16 }}>{currencySymbol}{fmtShort(totalInvested)}</div></div>
        <div className="metric-card"><div className="metric-label">{tr.currentValue||'Current value'}</div><div className="metric-value green" style={{ fontSize:16 }}>{currencySymbol}{fmtShort(totalValue)}</div></div>
      </div>
      <div className="metric-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
        <div className="metric-card"><div className="metric-label">{tr.totalGain||'Total gain/loss'}</div><div className="metric-value" style={{ fontSize:16, color:roiColor(totalGain) }}>{totalGain >= 0 ? '+' : ''}{currencySymbol}{fmt(Math.abs(totalGain))}</div></div>
        <div className="metric-card"><div className="metric-label">{tr.overallROI||'Overall ROI'}</div><div className="metric-value" style={{ fontSize:16, color:roiColor(totalROI) }}>{totalROI >= 0 ? '+' : ''}{totalROI.toFixed(2)}%</div></div>
      </div>

      {/* Allocation bar */}
      {totalValue > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', height:10, borderRadius:5, overflow:'hidden', marginBottom:6 }}>
            {byType.map((g,i) => <div key={g.type} style={{ width:`${(g.value/totalValue*100)}%`, background:TYPE_COLORS[i%TYPE_COLORS.length] }} title={g.label} />)}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 14px' }}>
            {byType.map((g,i) => (
              <div key={g.type} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6b7280' }}>
                <div style={{ width:8, height:8, borderRadius:2, background:TYPE_COLORS[i%TYPE_COLORS.length] }} />
                {g.label} ({(g.value/totalValue*100).toFixed(0)}%)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Prices toggle */}
      <button onClick={() => setShowMarket(v => !v)}
        style={{ width:'100%', marginBottom:12, padding:'10px 14px', background: showMarket ? '#EBF4FB' : 'white', border:`1px solid ${showMarket ? '#185FA5' : '#e5e7eb'}`, borderRadius:10, fontSize:13, fontWeight:600, color: showMarket ? '#185FA5' : '#374151', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span>🌐 {showMarket ? tr.inv_market_hide : tr.inv_market_view}</span>
        <span style={{ fontSize:11, color:'#9ca3af' }}>{tr.inv_market_kinds}</span>
      </button>

      {/* Market watchlist */}
      {showMarket && (
        <div style={{ marginBottom:16, background:'white', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', fontSize:11, fontWeight:700, color:'#6b7280', display:'flex', justifyContent:'space-between' }}>
            <span>{tr.inv_watch_asset}</span><span>{tr.inv_watch_price}</span>
          </div>
          {WATCHLIST.map(w => {
            const key = w.ticker || w.id
            const d = watchPrices[key]
            const change = d?.change24h ?? (d?.prev ? ((d.price - d.prev) / d.prev * 100) : null)
            const up = change >= 0
            return (
              <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{w.label}</div>
                  <div style={{ fontSize:10, color:'#9ca3af' }}>{key} · {w.type === 'crypto' ? tr.inv_kind_crypto : tr.inv_kind_stock}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  {d ? (
                    <>
                      <div style={{ fontSize:13, fontWeight:700 }}>
                        ${d.price?.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits: d.price < 1 ? 6 : 2 })}
                      </div>
                      {change != null && (
                        <div style={{ fontSize:11, fontWeight:600, color: up ? '#1D9E75' : '#A32D2D' }}>
                          {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                        </div>
                      )}
                    </>
                  ) : <span style={{ fontSize:11, color:'#9ca3af' }}>{tr.inv_loading_row}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginBottom:80 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div className="section-title" style={{ margin:0 }}>{tr.portfolio||'Portfolio'}</div>
            <button onClick={() => setNewRow({ name:'', type:'index_funds', platform:'', amount_invested:'', current_value:'', investment_date:'' })}
              style={{ fontSize:12, padding:'4px 12px', background:'var(--green)', color:'white', border:'none', borderRadius:6, cursor:'pointer' }}>
              + {tr.addRow||'Add row'}
            </button>
          </div>

          <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #e5e7eb' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', borderTop:'1px solid #e5e7eb', borderLeft:'1px solid #e5e7eb' }}>
              <thead>
                <tr>
                  <th style={HEAD}>{tr.inv_col_description}</th>
                  <th style={HEAD}>{tr.inv_col_type}</th>
                  <th style={HEAD}>{tr.inv_col_platform}</th>
                  <th style={HEAD}>{tr.inv_col_invested}</th>
                  <th style={HEAD}>{tr.inv_col_value}</th>
                  <th style={HEAD}>{tr.inv_col_live_price}</th>
                  <th style={HEAD}>{tr.inv_col_roi}</th>
                  <th style={HEAD}>{tr.inv_col_gain}</th>
                  <th style={HEAD}></th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => {
                  const invested = Number(inv.amount_invested||0)
                  const value = Number(inv.current_value||invested)
                  const gain = value - invested
                  const roi = invested > 0 ? (gain/invested*100) : 0
                  const isEditing = editingId === inv.id
                  const liveData = livePrices[inv.id]
                  const tickerOverride = tickerMap[inv.id] || ''
                  const { stockTicker, cryptoId } = guessTickerFromName(inv.name, inv.type)
                  const autoKey = stockTicker || cryptoId || ''

                  return (
                    <tr key={inv.id} style={{ background: isEditing ? '#f0fdf4' : 'white', cursor:'pointer' }} onClick={() => setEditingId(inv.id)}>
                      {isEditing ? (
                        <>
                          <EditableCell value={inv.name} onChange={v => updateInvestment(inv.id,'name',v)} placeholder={tr.inv_ph_name} />
                          <SelectCell value={inv.type} onChange={v => updateInvestment(inv.id,'type',v)} options={TYPES} labels={typeLabels} />
                          <PlatformCell value={inv.platform||''} onChange={v => updateInvestment(inv.id,'platform',v)} emptyLabel={tr.inv_select_platform} />
                          <EditableCell value={inv.amount_invested} onChange={v => updateInvestment(inv.id,'amount_invested',v)} type="number" placeholder="0.00" />
                          <EditableCell value={inv.current_value} onChange={v => updateInvestment(inv.id,'current_value',v)} type="number" placeholder="0.00" />
                          {/* Ticker override */}
                          <td style={INPUT_CELL} onClick={e => e.stopPropagation()}>
                            <input
                              value={tickerOverride}
                              onChange={e => saveTicker(inv.id, e.target.value)}
                              placeholder={autoKey || tr.inv_ph_ticker}
                              title={tr.inv_ticker_help}
                              style={{ width:'100%', padding:'8px 8px', border:'none', outline:'none', fontSize:11, background:'transparent', color:'#185FA5', fontWeight:600, textTransform:'uppercase' }}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={DESC_CELL} title={inv.name}>{inv.name}</td>
                          <td style={CELL}><span style={{ fontSize:10, padding:'2px 6px', borderRadius:10, background:'#f3f4f6', color:'#6b7280' }}>{typeLabels[inv.type]||inv.type}</span></td>
                          <td style={{ ...CELL, color:'#9ca3af', fontSize:11 }}>{inv.platform||'—'}</td>
                          <td style={CELL}>{currencySymbol}{fmt(invested)}</td>
                          <td style={{ ...CELL, fontWeight:600 }}>{currencySymbol}{fmt(value)}</td>
                          <td style={CELL}><PriceChip data={liveData} loading={pricesLoading && !liveData} liveLabel={tr.inv_live} priceLocale={locale} /></td>
                        </>
                      )}
                      <td style={{ ...CELL, fontWeight:600, color:roiColor(roi) }}>{roi >= 0 ? '+' : ''}{roi.toFixed(2)}%</td>
                      <td style={{ ...CELL, fontWeight:600, color:roiColor(gain) }}>{gain >= 0 ? '+' : ''}{currencySymbol}{fmt(Math.abs(gain))}</td>
                      <td style={{ ...CELL, textAlign:'center', cursor:'pointer', color:'#ef4444' }} onClick={e => { e.stopPropagation(); deleteInvestment(inv.id) }}>✕</td>
                    </tr>
                  )
                })}

                {newRow && (
                  <tr style={{ background:'#f0fdf4' }}>
                    <EditableCell value={newRow.name} onChange={v => { const d = detectType(v); setNewRow(r => ({...r, name:v, ...(d ? {type:d} : {})})) }} placeholder={tr.inv_ph_investment_name} />
                    <SelectCell value={newRow.type} onChange={v => setNewRow(r => ({...r,type:v}))} options={TYPES} labels={typeLabels} />
                    <PlatformCell value={newRow.platform} onChange={v => setNewRow(r => ({...r,platform:v}))} emptyLabel={tr.inv_select_platform} />
                    <EditableCell value={newRow.amount_invested} onChange={v => setNewRow(r => ({...r,amount_invested:v}))} type="number" placeholder={tr.inv_ph_amount} />
                    <EditableCell value={newRow.current_value} onChange={v => setNewRow(r => ({...r,current_value:v}))} type="number" placeholder={tr.inv_ph_current_value} />
                    <td style={CELL} />
                    <td style={CELL}>—</td>
                    <td style={CELL}>—</td>
                    <td style={{ ...CELL, textAlign:'center' }}>
                      <button onClick={saveNewRow} disabled={saving}
                        style={{ fontSize:11, padding:'3px 8px', background:'var(--green)', color:'white', border:'none', borderRadius:4, cursor:'pointer' }}>
                        {saving ? tr.inv_saving : tr.save||'Save'}
                      </button>
                    </td>
                  </tr>
                )}

                {investments.length > 0 && (
                  <tr style={{ background:'#f9fafb' }}>
                    <td style={{ ...HEAD, borderBottom:'none' }} colSpan={4}>{tr.totals||'Totals'}</td>
                    <td style={{ ...HEAD, borderBottom:'none' }}>{currencySymbol}{fmt(totalInvested)}</td>
                    <td style={{ ...HEAD, borderBottom:'none', color:'#1D9E75' }}>{currencySymbol}{fmt(totalValue)}</td>
                    <td style={{ ...HEAD, borderBottom:'none' }} />
                    <td style={{ ...HEAD, borderBottom:'none', color:roiColor(totalROI) }}>{totalROI >= 0 ? '+' : ''}{totalROI.toFixed(2)}%</td>
                    <td style={{ ...HEAD, borderBottom:'none', color:roiColor(totalGain) }}>{totalGain >= 0 ? '+' : ''}{currencySymbol}{fmt(Math.abs(totalGain))}</td>
                    <td style={{ ...HEAD, borderBottom:'none' }} />
                  </tr>
                )}

                {investments.length === 0 && !newRow && (
                  <tr><td colSpan={9} style={{ ...CELL, textAlign:'center', color:'#9ca3af', padding:'32px' }}>
                    {loading ? `⏳ ${tr.inv_loading_row}` : interpolate(tr.inv_empty_cta, { base: tr.inv_no_investments_yet })}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop:8, fontSize:11, color:'#9ca3af', textAlign:'right' }}>
            {tr.inv_footer_hint}
          </div>
        </div>
    </div>
  )
}
