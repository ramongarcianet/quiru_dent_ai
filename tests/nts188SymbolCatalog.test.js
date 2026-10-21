import test from 'node:test'
import assert from 'node:assert/strict'
import { NTS188_SYMBOLS, nts188SymbolForFinding } from '../src/domain/nts188/NTS188SymbolCatalog.js'

test('incluye las 38 convenciones gráficas de la NTS 188 en orden', () => {
  assert.equal(NTS188_SYMBOLS.length, 38)
  assert.deepEqual(NTS188_SYMBOLS.map(item => item.number), Array.from({ length: 38 }, (_, index) => index + 1))
  assert.equal(new Set(NTS188_SYMBOLS.map(item => item.key)).size, 38)
})

test('mantiene compatibilidad gráfica con caries y pieza ausente existentes', () => {
  assert.equal(nts188SymbolForFinding({ finding: 'CARIES' })?.number, 16)
  assert.equal(nts188SymbolForFinding({ renderer: 'ABSENT_CROSS' })?.number, 20)
  assert.equal(nts188SymbolForFinding({ normativeRuleId: 'NTS188-6.1.37' })?.renderer, 'ROOT_LINE')
})
