export const NTS188_SYMBOLS = Object.freeze([
  { number: 1, key: 'FIXED_ORTHODONTIC_APPLIANCE', label: 'Aparato ortodóntico fijo', color: 'STATE', renderer: 'ORTHO_FIXED' },
  { number: 2, key: 'REMOVABLE_ORTHODONTIC_APPLIANCE', label: 'Aparato ortodóntico removible', color: 'STATE', renderer: 'ORTHO_REMOVABLE' },
  { number: 3, key: 'CROWN', label: 'Corona', color: 'STATE', renderer: 'CROWN_OUTLINE', codes: ['CM', 'CF', 'CMC', 'CV', 'CLM'] },
  { number: 4, key: 'TEMPORARY_CROWN', label: 'Corona temporal', color: 'RED', renderer: 'CROWN_OUTLINE', codes: ['CT'] },
  { number: 5, key: 'ENAMEL_DEVELOPMENT_DEFECT', label: 'Defectos de desarrollo del esmalte', color: 'RED', renderer: 'CODE', codes: ['O', 'PE'] },
  { number: 6, key: 'DIASTEMA', label: 'Diastema', color: 'BLUE', renderer: 'INVERTED_PARENTHESES' },
  { number: 7, key: 'TOTAL_EDENTULOUS', label: 'Edéntulo total superior/inferior', color: 'BLUE', renderer: 'ARCH_LINE' },
  { number: 8, key: 'POST_AND_CORE', label: 'Espigo - muñón', color: 'STATE', renderer: 'POST_CORE' },
  { number: 9, key: 'DEEP_PITS_FISSURES', label: 'Fosas y fisuras profundas', color: 'BLUE', renderer: 'CODE', codes: ['FFP'] },
  { number: 10, key: 'DENTAL_FRACTURE', label: 'Fractura dental', color: 'RED', renderer: 'FRACTURE' },
  { number: 11, key: 'FUSION', label: 'Fusión', color: 'BLUE', renderer: 'DOUBLE_CIRCLE' },
  { number: 12, key: 'GEMINATION', label: 'Geminación', color: 'BLUE', renderer: 'CIRCLE' },
  { number: 13, key: 'GIROVERSION', label: 'Giroversión', color: 'BLUE', renderer: 'CURVED_ARROW' },
  { number: 14, key: 'IMPACTION', label: 'Impactación', color: 'BLUE', renderer: 'CODE', codes: ['I'] },
  { number: 15, key: 'DENTAL_IMPLANT', label: 'Implante dental', color: 'STATE', renderer: 'CODE', codes: ['IMP'] },
  { number: 16, key: 'CARIES', label: 'Lesión de caries dental', color: 'RED', renderer: 'SURFACE_FILL', codes: ['MB', 'CE', 'CD', 'CDP'] },
  { number: 17, key: 'MACRODONTIA', label: 'Macrodoncia', color: 'BLUE', renderer: 'CODE', codes: ['MAC'] },
  { number: 18, key: 'MICRODONTIA', label: 'Microdoncia', color: 'BLUE', renderer: 'CODE', codes: ['MIC'] },
  { number: 19, key: 'PATHOLOGICAL_MOBILITY', label: 'Movilidad patológica', color: 'RED', renderer: 'CODE', codes: ['M1', 'M2', 'M3'] },
  { number: 20, key: 'TOOTH_ABSENT', label: 'Pieza dentaria ausente', color: 'BLUE', renderer: 'ABSENT_CROSS', codes: ['DNE', 'DEX', 'DAO'] },
  { number: 21, key: 'PEG_SHAPED_TOOTH', label: 'Pieza dentaria en clavija', color: 'BLUE', renderer: 'APICAL_TRIANGLE' },
  { number: 22, key: 'ECTOPIC_TOOTH', label: 'Pieza dentaria ectópica', color: 'BLUE', renderer: 'CODE', codes: ['E'] },
  { number: 23, key: 'ERUPTING_TOOTH', label: 'Pieza dentaria en erupción', color: 'BLUE', renderer: 'ZIGZAG_ARROW' },
  { number: 24, key: 'EXTRUDED_TOOTH', label: 'Pieza dentaria extruida', color: 'BLUE', renderer: 'OUTWARD_ARROW' },
  { number: 25, key: 'INTRUDED_TOOTH', label: 'Pieza dentaria intruida', color: 'BLUE', renderer: 'INWARD_ARROW' },
  { number: 26, key: 'SUPERNUMERARY_TOOTH', label: 'Pieza dentaria supernumeraria', color: 'BLUE', renderer: 'CIRCLED_S', codes: ['S'] },
  { number: 27, key: 'PULPOTOMY', label: 'Pulpotomía', color: 'STATE', renderer: 'CORONAL_PULP', codes: ['PP'] },
  { number: 28, key: 'ABNORMAL_POSITION', label: 'Posición anormal dentaria', color: 'BLUE', renderer: 'CODE', codes: ['M', 'D', 'V', 'P', 'L'] },
  { number: 29, key: 'FIXED_PARTIAL_DENTURE', label: 'Prótesis dental parcial fija', color: 'STATE', renderer: 'BRIDGE' },
  { number: 30, key: 'COMPLETE_DENTURE', label: 'Prótesis dental completa superior/inferior', color: 'STATE', renderer: 'DOUBLE_ARCH_LINE' },
  { number: 31, key: 'REMOVABLE_PARTIAL_DENTURE', label: 'Prótesis dental parcial removible', color: 'STATE', renderer: 'DOUBLE_ARCH_LINE' },
  { number: 32, key: 'ROOT_REMNANT', label: 'Remanente radicular', color: 'RED', renderer: 'CODE', codes: ['RR'] },
  { number: 33, key: 'DEFINITIVE_RESTORATION', label: 'Restauración definitiva', color: 'STATE', renderer: 'SURFACE_FILL', codes: ['AM', 'R', 'IV', 'IM', 'IE', 'C'] },
  { number: 34, key: 'TEMPORARY_RESTORATION', label: 'Restauración temporal', color: 'RED', renderer: 'SURFACE_OUTLINE' },
  { number: 35, key: 'SEALANT', label: 'Sellantes', color: 'STATE', renderer: 'FISSURE_LINE', codes: ['S'] },
  { number: 36, key: 'WORN_SURFACE', label: 'Superficie desgastada', color: 'RED', renderer: 'WORN_SURFACE', codes: ['DES'] },
  { number: 37, key: 'ROOT_CANAL', label: 'Tratamiento de conducto', color: 'STATE', renderer: 'ROOT_LINE', codes: ['TC', 'PC'] },
  { number: 38, key: 'TRANSPOSITION', label: 'Transposición dentaria', color: 'BLUE', renderer: 'CROSSED_ARROWS' }
])

const BY_KEY = Object.freeze(Object.fromEntries(NTS188_SYMBOLS.map(symbol => [symbol.key, symbol])))

export function nts188SymbolForFinding(finding = {}) {
  const explicitNumber = Number(String(finding.normativeRuleId || '').split('.').pop())
  if (explicitNumber >= 1 && explicitNumber <= 38) return NTS188_SYMBOLS[explicitNumber - 1]
  if (finding.finding && BY_KEY[finding.finding]) return BY_KEY[finding.finding]
  if (finding.renderer === 'ABSENT_CROSS') return BY_KEY.TOOTH_ABSENT
  if (finding.renderer === 'SURFACE_FILL') return BY_KEY.CARIES
  return null
}

export function nts188FindingColor(finding = {}, symbol = nts188SymbolForFinding(finding)) {
  if (finding.status === 'PENDING' || finding.status === 'CONFIRMED') return '#7c3aed'
  if (finding.color === 'RED' || symbol?.color === 'RED') return '#d8262f'
  if (finding.color === 'BLUE' || symbol?.color === 'BLUE') return '#1756a9'
  return String(finding.condition || finding.state || '').toUpperCase() === 'BAD' ? '#d8262f' : '#1756a9'
}
