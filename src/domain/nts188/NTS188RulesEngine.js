const ADULT_TEETH = [
  ...range(11, 18), ...range(21, 28), ...range(31, 38), ...range(41, 48)
]
const PRIMARY_TEETH = [
  ...range(51, 55), ...range(61, 65), ...range(71, 75), ...range(81, 85)
]

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export const VALID_FDI_TEETH = Object.freeze([...ADULT_TEETH, ...PRIMARY_TEETH])

export const TOOTH_SURFACES = Object.freeze({
  OCCLUSAL: { code: 'O', label: 'Oclusal' },
  MESIAL: { code: 'M', label: 'Mesial' },
  DISTAL: { code: 'D', label: 'Distal' },
  VESTIBULAR: { code: 'V', label: 'Vestibular' },
  PALATAL: { code: 'P', label: 'Palatina' },
  LINGUAL: { code: 'L', label: 'Lingual' },
  CERVICAL: { code: 'C', label: 'Cervical' },
  INCISAL: { code: 'I', label: 'Incisal' }
})

export const NTS188_RULES = Object.freeze({
  CARIES: {
    id: 'NTS188-6.1.16',
    label: 'Lesión de caries dental',
    normativeReference: 'NTS 188, numeral 6.1.16, pp. 22-23',
    color: 'RED',
    renderer: 'SURFACE_FILL',
    requiredFields: ['tooth', 'cariesType', 'surface'],
    types: {
      WHITE_SPOT: { ntsCode: 'MB', label: 'Mancha blanca', legacyValue: 'manchablanca' },
      ENAMEL: { ntsCode: 'CE', label: 'Lesión de caries a nivel del esmalte', legacyValue: 'lesionesmalte' },
      DENTIN: { ntsCode: 'CD', label: 'Lesión de caries a nivel de la dentina', legacyValue: 'lesiondentina' },
      PULP: { ntsCode: 'CDP', label: 'Lesión de caries con compromiso pulpar', legacyValue: 'lesionpulpa' }
    }
  },
  TOOTH_ABSENT: {
    id: 'NTS188-6.1.20',
    label: 'Pieza dentaria ausente',
    normativeReference: 'NTS 188, numeral 6.1.20, p. 24',
    color: 'BLUE',
    renderer: 'ABSENT_CROSS',
    requiredFields: ['tooth', 'absenceReason'],
    reasons: {
      NOT_ERUPTED: { ntsCode: 'DNE', label: 'Diente no erupcionado', legacyValue: 'ausente_no_erupcionado' },
      EXTRACTION_CARIES: { ntsCode: 'DEX', label: 'Ausente por extracción debido a experiencia de caries', legacyValue: 'ausente_extraccion' },
      OTHER: { ntsCode: 'DAO', label: 'Ausente por otras razones no relacionadas con caries', legacyValue: 'ausente_otras_razones' }
    }
  },
  OBSERVATION: {
    id: 'NTS188-5.15',
    label: 'Observación',
    normativeReference: 'NTS 188, numeral 5.15, p. 15',
    color: null,
    renderer: 'OBSERVATION_ONLY',
    requiredFields: ['observation']
  }
})

function missing(field, question) {
  return { field, code: 'MISSING_REQUIRED_FIELD', question }
}

function invalid(field, code, question) {
  return { field, code, question }
}

export function validateNTS188Finding(input = {}) {
  const finding = String(input.finding || '').toUpperCase()
  const tooth = Number(input.tooth)
  const errors = []

  if (finding !== 'OBSERVATION') {
    if (!input.tooth) errors.push(missing('tooth', '¿En qué pieza?'))
    else if (!VALID_FDI_TEETH.includes(tooth)) {
      errors.push(invalid('tooth', 'INVALID_FDI_TOOTH', 'La pieza no es válida en el sistema Dígito Dos. ¿Cuál es la pieza correcta?'))
    }
  }

  if (finding === 'CARIES') {
    const rule = NTS188_RULES.CARIES
    const type = rule.types[String(input.cariesType || '').toUpperCase()]
    const surface = TOOTH_SURFACES[String(input.surface || '').toUpperCase()]
    if (!type) errors.push(missing('cariesType', '¿Es mancha blanca, lesión en esmalte, dentina o con compromiso pulpar?'))
    if (!surface) errors.push(missing('surface', `¿En qué superficie de la pieza ${tooth || ''}?`.trim()))
    if (errors.length) return { valid: false, errors, normativeReference: rule.normativeReference }
    return {
      valid: true,
      normalized: {
        tooth,
        finding,
        findingLabel: rule.label,
        cariesType: String(input.cariesType).toUpperCase(),
        ntsCode: type.ntsCode,
        description: type.label,
        surface: String(input.surface).toUpperCase(),
        surfaceCode: surface.code,
        surfaceLabel: surface.label,
        color: rule.color,
        renderer: rule.renderer,
        normativeRuleId: rule.id,
        normativeReference: rule.normativeReference,
        legacy: { hallazgo: type.legacyValue, ubicacion: surface.label, sigla: type.ntsCode }
      }
    }
  }

  if (finding === 'TOOTH_ABSENT') {
    const rule = NTS188_RULES.TOOTH_ABSENT
    const reason = rule.reasons[String(input.absenceReason || '').toUpperCase()]
    if (!reason) {
      errors.push(missing('absenceReason', '¿No erupcionó, fue extraída por caries o está ausente por otra razón?'))
    }
    if (errors.length) return { valid: false, errors, normativeReference: rule.normativeReference }
    return {
      valid: true,
      normalized: {
        tooth,
        finding,
        findingLabel: rule.label,
        absenceReason: String(input.absenceReason).toUpperCase(),
        ntsCode: reason.ntsCode,
        description: reason.label,
        surface: null,
        surfaceCode: null,
        surfaceLabel: null,
        color: rule.color,
        renderer: rule.renderer,
        normativeRuleId: rule.id,
        normativeReference: rule.normativeReference,
        legacy: { hallazgo: reason.legacyValue, ubicacion: '', sigla: reason.ntsCode }
      }
    }
  }

  const genericSymbol = nts188SymbolForFinding({ finding })
  if (genericSymbol && !['CARIES', 'TOOTH_ABSENT'].includes(finding)) {
    const condition = String(input.condition || '').toUpperCase()
    const requiresCondition = genericSymbol.color === 'STATE'
    const requiresSurface = ['SURFACE_FILL', 'SURFACE_OUTLINE', 'FISSURE_LINE', 'WORN_SURFACE'].includes(genericSymbol.renderer)
    const requiresSecondTooth = ['ORTHO_FIXED', 'ORTHO_REMOVABLE', 'INVERTED_PARENTHESES', 'DOUBLE_CIRCLE', 'BRIDGE', 'DOUBLE_ARCH_LINE', 'CROSSED_ARROWS'].includes(genericSymbol.renderer)
    const suppliedCode = String(input.ntsCode || '').toUpperCase()
    const ntsCode = suppliedCode || (genericSymbol.codes?.length === 1 ? genericSymbol.codes[0] : null)
    const surface = input.surface ? TOOTH_SURFACES[String(input.surface).toUpperCase()] : null
    const secondTooth = Number(input.secondTooth || input.teeth?.find(item => Number(item) !== tooth))

    if (requiresCondition && !['GOOD', 'BAD'].includes(condition)) errors.push(missing('condition', '¿Se encuentra en buen o mal estado?'))
    if (genericSymbol.codes?.length && !genericSymbol.codes.includes(ntsCode)) errors.push(missing('ntsCode', `Selecciona la sigla normativa para ${genericSymbol.label}.`))
    if (requiresSurface && !surface) errors.push(missing('surface', `¿En qué superficie de la pieza ${tooth || ''}?`.trim()))
    if (requiresSecondTooth && (!secondTooth || !VALID_FDI_TEETH.includes(secondTooth) || secondTooth === tooth)) {
      errors.push(missing('secondTooth', 'Selecciona una segunda pieza válida para representar la extensión del hallazgo.'))
    }
    if (errors.length) return { valid: false, errors, normativeReference: `NTS 188, numeral 6.1.${genericSymbol.number}` }

    const color = genericSymbol.color === 'STATE'
      ? (condition === 'BAD' ? 'RED' : 'BLUE')
      : genericSymbol.color
    return {
      valid: true,
      normalized: {
        tooth,
        teeth: requiresSecondTooth ? [tooth, secondTooth] : [tooth],
        secondTooth: requiresSecondTooth ? secondTooth : null,
        finding,
        findingLabel: genericSymbol.label,
        description: genericSymbol.label,
        condition: requiresCondition ? condition : null,
        ntsCode,
        surface: surface ? String(input.surface).toUpperCase() : null,
        surfaceCode: surface?.code || null,
        surfaceLabel: surface?.label || null,
        color,
        renderer: genericSymbol.renderer,
        normativeRuleId: `NTS188-6.1.${genericSymbol.number}`,
        normativeReference: `NTS 188, numeral 6.1.${genericSymbol.number}`,
        legacy: { hallazgo: finding.toLowerCase(), ubicacion: surface?.label || '', sigla: ntsCode || '' }
      }
    }
  }

  if (finding === 'OBSERVATION') {
    const observation = String(input.observation || '').trim()
    if (!observation) return { valid: false, errors: [missing('observation', '¿Qué observación deseas registrar?')] }
    return {
      valid: true,
      normalized: {
        tooth: input.tooth ? tooth : null,
        finding,
        findingLabel: 'Observación',
        description: observation,
        ntsCode: null,
        color: null,
        renderer: 'OBSERVATION_ONLY',
        normativeRuleId: 'NTS188-5.15',
        normativeReference: 'NTS 188, numeral 5.15, p. 15'
      }
    }
  }

  return {
    valid: false,
    status: 'REQUIERE_VALIDACION_ODONTOLOGICA',
    errors: [{
      field: 'finding',
      code: 'UNSUPPORTED_NOMENCLATURE',
      question: 'No encuentro una nomenclatura estructurada validada para ese hallazgo. ¿Deseas registrarlo como observación?'
    }]
  }
}

export function findingSummary(finding) {
  if (!finding) return ''
  const suffix = finding.surfaceLabel ? ` ${finding.surfaceLabel.toLowerCase()}` : ''
  return `${finding.tooth || ''}, ${finding.ntsCode || finding.findingLabel}${suffix}`.trim()
}
import { nts188SymbolForFinding } from './NTS188SymbolCatalog.js'

