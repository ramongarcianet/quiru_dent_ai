import test from 'node:test'
import assert from 'node:assert/strict'
import { groundClinicalToolCall } from '../src/services/voiceFindingGrounding.js'

test('convierte una falsa corrección en un hallazgo adicional', () => {
  const result = groundClinicalToolCall({
    name: 'correct_pending_finding',
    args: { tooth: 26, surface: 'OCCLUSAL' }
  }, '26 caries oclusal')

  assert.equal(result.name, 'preview_finding')
  assert.deepEqual(result.args.findings, [{
    tooth: 26,
    surface: 'OCCLUSAL',
    finding: 'CARIES',
    rawText: '26 caries oclusal'
  }])
})

test('la transcripción prevalece sobre un tipo pegado por el modelo', () => {
  const result = groundClinicalToolCall({
    name: 'preview_finding',
    args: { findings: [{ tooth: 34, finding: 'MACRODONTIA', surface: 'OCCLUSAL' }] }
  }, '26 caries oclusal')

  assert.equal(result.args.findings[0].finding, 'CARIES')
  assert.equal(result.args.findings[0].tooth, 26)
})

test('conserva la corrección cuando el odontólogo la pide explícitamente', () => {
  const result = groundClinicalToolCall({
    name: 'correct_pending_finding',
    args: { tooth: 26 }
  }, 'corrige el último, no era macrodoncia, cambia a caries en 26')

  assert.equal(result.name, 'correct_pending_finding')
  assert.equal(result.args.finding, 'CARIES')
  assert.equal(result.args.tooth, 26)
})

test('reconoce macrodoncia y la pieza dictada', () => {
  const result = groundClinicalToolCall({
    name: 'preview_finding',
    args: { findings: [{ finding: 'CARIES' }] }
  }, '34 macrodoncia')

  assert.equal(result.args.findings[0].finding, 'MACRODONTIA')
  assert.equal(result.args.findings[0].tooth, 34)
})
