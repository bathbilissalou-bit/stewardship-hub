export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.VITE_ANTHROPIC_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'VITE_ANTHROPIC_KEY not configured in Vercel environment variables.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  const { messages, context, mode } = await req.json()

  const systemPrompt = buildSystemPrompt(context, mode)

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: messages,
      max_tokens: mode === 'simulate' ? 1400 : 700,
    })
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text()
    return new Response(JSON.stringify({ error: err }), {
      status: anthropicRes.status, headers: { 'Content-Type': 'application/json' }
    })
  }

  const data = await anthropicRes.json()
  return new Response(JSON.stringify({ reply: data.content[0].text }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

function buildSystemPrompt(ctx, mode) {
  const sym = ctx?.currencySymbol || '$'
  const financial = ctx ? `
User's live financial data:
- Monthly income: ${sym}${(ctx.income || 0).toLocaleString()}
- Monthly expenses: ${sym}${(ctx.expenses || 0).toLocaleString()}
- Monthly surplus: ${sym}${(ctx.surplus || 0).toLocaleString()}
- Saving rate: ${ctx.savingRate || 0}%
- Total debt: ${sym}${(ctx.totalDebt || 0).toLocaleString()}
- Total investments: ${sym}${(ctx.investments || 0).toLocaleString()}
- Active loans: ${ctx.loansCount || 0}
- Savings goals: ${ctx.goalsCount || 0}` : ''

  if (mode === 'simulate') {
    return `You are a financial simulation engine. Given the user's real financial data and a "what-if" scenario, generate a precise month-by-month simulation report.
${financial}

Structure your response EXACTLY like this (use markdown-style headers):
**SCENARIO** — One sentence restating the scenario being simulated.
**MONTH 3** — Specific numbers: balances, savings, debt remaining, key milestone.
**MONTH 6** — Specific numbers and milestone.
**YEAR 1 (Month 12)** — Major achievement unlocked at 12 months.
**YEAR 2 (Month 24)** — Long-term projection.
**KEY INSIGHT** — The single most important finding from this simulation.
**✦ FAITH PERSPECTIVE** — One relevant biblical principle with scripture reference.

Use ${sym} for all amounts. Base all projections on the user's actual numbers above. Be specific, realistic, and encouraging.`
  }

  return `You are a warm, faith-based AI financial coach for Stewardship Hub — a financial management app used by faith communities worldwide.
${financial}

Your style:
- Encouraging, practical, and specific (always use the user's real numbers)
- Weave in biblical wisdom naturally when relevant
- Give concrete next steps, not vague advice
- Use ${sym} for all currency amounts
- Keep responses under 250 words
- If the user has no data yet, kindly ask them to add entries in the Budget tab first`
}
