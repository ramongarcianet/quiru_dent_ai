import { NTS188_SYMBOLS } from '../domain/nts188/NTS188SymbolCatalog.js'
import { VALID_FDI_TEETH } from '../domain/nts188/NTS188RulesEngine.js'

function normalizedSpeech(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const findingAliases = [
  ['TEMPORARY_RESTORATION', 'restauracion temporal'],
  ['DEFINITIVE_RESTORATION', 'restauracion definitiva'],
  ['TEMPORARY_CROWN', 'corona temporal'],
  ['ROOT_CANAL', 'tratamiento de conducto'],
  ['ROOT_REMNANT', 'remanente radicular'],
  ['PATHOLOGICAL_MOBILITY', 'movilidad patologica'],
  ['TOOTH_ABSENT', 'pieza ausente'],
  ['TOOTH_ABSENT', 'diente ausente'],
  ['DENTAL_FRACTURE', 'fractura'],
  ['DENTAL_IMPLANT', 'implante'],
  ['PULPOTOMY', 'pulpotomia'],
  ['SEALANT', 'sellante'],
  ['DIASTEMA', 'diastema'],
  ['CARIES', 'lesion cariosa'],
  ['CARIES', 'caries'],
  ['CROWN', 'corona'],
  ...NTS188_SYMBOLS.map(item => [item.key, normalizedSpeech(item.label)])
].sort((left, right) => right[1].length - left[1].length)

function explicitFindingFrom(text, preferLast = false) {
  const value = normalizedSpeech(text)
  const occupied = []
  const matches = []
  findingAliases.forEach(([key, alias]) => {
    const index = value.indexOf(alias)
    if (index < 0) return
    const end = index + alias.length
    if (occupied.some(range => index >= range.start && end <= range.end)) return
    occupied.push({ start: index, end })
    matches.push({ key, index })
  })
  const keys = [...new Set(matches.map(match => match.key))]
  if (preferLast && matches.length) return matches.sort((left, right) => right.index - left.index)[0].key
  return keys.length === 1 ? keys[0] : null
}

function spokenTeeth(text) {
  const values = normalizedSpeech(text).match(/\b[1-8][1-8]\b/g) || []
  return [...new Set(values.map(Number).filter(value => VALID_FDI_TEETH.includes(value)))]
}

function hasExplicitCorrectionIntent(text) {
  const value = normalizedSpeech(text)
  return /\b(corrige|corregir|corrijo|correccion|cambia|cambiar|cambio|rectifica|rectificar|modifica|modificar|no era|quise decir)\b/.test(value)
}

function groundFinding(item, transcript, explicitFinding, teeth) {
  const grounded = { ...item, finding: explicitFinding, rawText: transcript }
  if (teeth.length) grounded.tooth = teeth[0]
  else delete grounded.tooth
  if (teeth.length > 1) grounded.secondTooth = teeth[1]
  else delete grounded.secondTooth
  return grounded
}

export function groundClinicalToolCall(call, transcript) {
  if (!['preview_finding', 'correct_pending_finding'].includes(call?.name)) return call

  const explicitCorrection = hasExplicitCorrectionIntent(transcript)
  const explicitFinding = explicitFindingFrom(transcript, explicitCorrection)
  if (!explicitFinding) return call

  const teeth = spokenTeeth(transcript)
  if (call.name === 'correct_pending_finding' && !explicitCorrection) {
    return {
      name: 'preview_finding',
      args: {
        findings: [groundFinding(call.args || {}, transcript, explicitFinding, teeth)]
      }
    }
  }

  if (call.name === 'correct_pending_finding') {
    return {
      ...call,
      args: groundFinding(call.args || {}, transcript, explicitFinding, teeth)
    }
  }

  return {
    ...call,
    args: {
      ...call.args,
      findings: (call.args?.findings || []).map(item => groundFinding(item, transcript, explicitFinding, teeth))
    }
  }
}

