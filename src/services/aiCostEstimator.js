function envNumber(name) {
  const value = Number(import.meta.env?.[name] || 0)
  return Number.isFinite(value) && value >= 0 ? value : 0
}

export function estimateAiSessionCost({ liveSeconds = 0, textInputTokens = 0, textOutputTokens = 0 } = {}) {
  const rates = {
    liveMinute: envNumber('VITE_QUIRU_LIVE_COST_PER_MINUTE'),
    inputMillionTokens: envNumber('VITE_QUIRU_INPUT_COST_PER_MILLION_TOKENS'),
    outputMillionTokens: envNumber('VITE_QUIRU_OUTPUT_COST_PER_MILLION_TOKENS')
  }
  const amount = (liveSeconds / 60) * rates.liveMinute
    + (textInputTokens / 1_000_000) * rates.inputMillionTokens
    + (textOutputTokens / 1_000_000) * rates.outputMillionTokens
  return {
    amount: Number(amount.toFixed(6)),
    currency: 'USD',
    configured: Object.values(rates).some(rate => rate > 0),
    ratesSource: 'ENVIRONMENT_CONFIGURATION',
    rates
  }
}

export function buildCostTestScenarios() {
  return [
    { name: 'SHORT', findings: 5, safeModeTurns: 10, fastModeTurns: 2 },
    { name: 'MEDIUM', findings: 15, safeModeTurns: 30, fastModeTurns: 6 },
    { name: 'LONG', findings: 30, safeModeTurns: 60, fastModeTurns: 12 }
  ]
}
