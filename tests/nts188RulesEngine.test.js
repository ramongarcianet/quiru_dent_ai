import test from 'node:test'
import assert from 'node:assert/strict'
import { validateNTS188Finding } from '../src/domain/nts188/NTS188RulesEngine.js'
import { parseConversationalInput } from '../src/services/conversationalFindingParser.js'

test('normaliza caries en dentina oclusal según NTS 6.1.16', () => {
  const result = validateNTS188Finding({ tooth: 16, finding: 'CARIES', cariesType: 'DENTIN', surface: 'OCCLUSAL' })
  assert.equal(result.valid, true)
  assert.equal(result.normalized.ntsCode, 'CD')
  assert.equal(result.normalized.color, 'RED')
  assert.equal(result.normalized.surfaceCode, 'O')
  assert.equal(result.normalized.normativeRuleId, 'NTS188-6.1.16')
})

test('no hereda una superficie omitida en "17 también"', () => {
  const parsed = parseConversationalInput('En la 17 también', {
    previousFinding: 'CARIES', previousCariesType: 'DENTIN'
  })
  const result = validateNTS188Finding(parsed.findings[0])
  assert.equal(result.valid, false)
  assert.equal(result.errors[0].field, 'surface')
})

test('exige motivo normativo para una pieza ausente', () => {
  const result = validateNTS188Finding({ tooth: 18, finding: 'TOOTH_ABSENT' })
  assert.equal(result.valid, false)
  assert.equal(result.errors[0].field, 'absenceReason')
})

test('normaliza DEX solo cuando la extracción se atribuye a experiencia de caries', () => {
  const parsed = parseConversationalInput('La 18 fue extraída por caries')
  const result = validateNTS188Finding(parsed.findings[0])
  assert.equal(result.valid, true)
  assert.equal(result.normalized.ntsCode, 'DEX')
  assert.equal(result.normalized.color, 'BLUE')
})

test('rechaza una pieza fuera del sistema FDI admitido', () => {
  const result = validateNTS188Finding({ tooth: 19, finding: 'CARIES', cariesType: 'ENAMEL', surface: 'MESIAL' })
  assert.equal(result.valid, false)
  assert.equal(result.errors[0].code, 'INVALID_FDI_TOOTH')
})

test('marca nomenclaturas no implementadas para validación odontológica', () => {
  const result = validateNTS188Finding({ tooth: 16, finding: 'FRACTURE' })
  assert.equal(result.valid, false)
  assert.equal(result.status, 'REQUIERE_VALIDACION_ODONTOLOGICA')
})

test('normaliza una corona con sigla y estado normativos', () => {
  const result = validateNTS188Finding({ tooth: 16, finding: 'CROWN', ntsCode: 'CMC', condition: 'GOOD' })
  assert.equal(result.valid, true)
  assert.equal(result.normalized.normativeRuleId, 'NTS188-6.1.3')
  assert.equal(result.normalized.renderer, 'CROWN_OUTLINE')
  assert.equal(result.normalized.color, 'BLUE')
})

test('exige segunda pieza para hallazgos gráficos de extensión', () => {
  const invalid = validateNTS188Finding({ tooth: 11, finding: 'DIASTEMA' })
  assert.equal(invalid.valid, false)
  assert.equal(invalid.errors.some(error => error.field === 'secondTooth'), true)

  const valid = validateNTS188Finding({ tooth: 11, secondTooth: 21, finding: 'DIASTEMA' })
  assert.equal(valid.valid, true)
  assert.deepEqual(valid.normalized.teeth, [11, 21])
})

test('exige superficie para restauraciones y desgaste', () => {
  const result = validateNTS188Finding({ tooth: 36, finding: 'DEFINITIVE_RESTORATION', ntsCode: 'R', condition: 'GOOD' })
  assert.equal(result.valid, false)
  assert.equal(result.errors.some(error => error.field === 'surface'), true)
})

test('interpreta corrección de superficie', () => {
  const parsed = parseConversationalInput('Era mesial')
  assert.equal(parsed.intent, 'CORRECT_PENDING')
  assert.equal(parsed.surface, 'MESIAL')
})

test('interpreta varios hallazgos en un solo turno', () => {
  const parsed = parseConversationalInput('16 caries dentina oclusal, 17 caries esmalte mesial y 18 ausente')
  assert.equal(parsed.intent, 'REGISTER_FINDINGS')
  assert.equal(parsed.findings.length, 3)
  assert.equal(parsed.findings[0].tooth, 16)
  assert.equal(parsed.findings[1].cariesType, 'ENAMEL')
  assert.equal(parsed.findings[2].finding, 'TOOTH_ABSENT')
})

test('interpreta cambio de pieza sin modificar un registro consolidado', () => {
  const parsed = parseConversationalInput('No, pieza 27')
  assert.equal(parsed.intent, 'CORRECT_PENDING')
  assert.equal(parsed.tooth, 27)
})

test('trata el silencio como ausencia de entrada', () => {
  assert.equal(parseConversationalInput('   ').intent, 'NO_INPUT')
})

test('interpreta comandos de sesión', () => {
  assert.equal(parseConversationalInput('Deshaz lo último').intent, 'UNDO_PENDING')
  assert.equal(parseConversationalInput('¿Qué llevamos?').intent, 'GET_SESSION_FINDINGS')
  assert.equal(parseConversationalInput('Terminamos').intent, 'FINISH_SESSION')
})

test('acepta confirmaciones naturales sin exigir repetir una palabra exacta', () => {
  for (const reply of ['Sí', 'Está bien', 'ok', 'dale', 'confirmado', 'guárdalo']) {
    assert.equal(parseConversationalInput(reply).intent, 'CONFIRM_FINDINGS', reply)
  }
})

test('interpreta buen o mal estado cuando esa aclaración está pendiente', () => {
  assert.deepEqual(
    parseConversationalInput('buen estado', { pendingField: 'condition' }),
    { intent: 'ANSWER_CLARIFICATION', condition: 'GOOD' }
  )
  assert.deepEqual(
    parseConversationalInput('está mal', { pendingField: 'condition' }),
    { intent: 'ANSWER_CLARIFICATION', condition: 'BAD' }
  )
})
