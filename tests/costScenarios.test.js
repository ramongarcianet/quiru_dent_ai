import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCostTestScenarios, estimateAiSessionCost } from '../src/services/aiCostEstimator.js'

test('define escenarios de 5, 15 y 30 hallazgos sin asumir que batching gana', () => {
  const scenarios = buildCostTestScenarios()
  assert.deepEqual(scenarios.map(item => item.findings), [5, 15, 30])
  scenarios.forEach(item => assert.ok(item.safeModeTurns > item.fastModeTurns))
})

test('no inventa precios cuando no existen tarifas configuradas', () => {
  const estimate = estimateAiSessionCost({ liveSeconds: 320 })
  assert.equal(estimate.configured, false)
  assert.equal(estimate.amount, 0)
  assert.equal(estimate.ratesSource, 'ENVIRONMENT_CONFIGURATION')
})
