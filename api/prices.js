// Serverless price proxy — avoids CORS on Yahoo Finance & CoinGecko
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')

  const { tickers = '', crypto = '' } = req.query
  const results = {}

  // ── Stock / ETF / Bond prices via Yahoo Finance ──────────────────────────
  if (tickers) {
    const list = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
    await Promise.all(list.map(async ticker => {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        )
        const json = await r.json()
        const meta = json?.chart?.result?.[0]?.meta
        if (meta) {
          results[ticker] = {
            price: meta.regularMarketPrice,
            prev:  meta.chartPreviousClose || meta.previousClose,
            name:  meta.shortName || meta.longName || ticker,
            currency: meta.currency,
          }
        }
      } catch {
        results[ticker] = null
      }
    }))
  }

  // ── Crypto prices via CoinGecko (free, no key) ───────────────────────────
  if (crypto) {
    try {
      const ids = crypto.split(',').map(c => c.trim().toLowerCase()).filter(Boolean).join(',')
      const r = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=false`
      )
      const json = await r.json()
      Object.entries(json).forEach(([id, data]) => {
        results[id] = { price: data.usd, change24h: data.usd_24h_change }
      })
    } catch { /* ignore */ }
  }

  res.status(200).json(results)
}
