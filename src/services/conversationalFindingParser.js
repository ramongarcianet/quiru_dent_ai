const SURFACE_TERMS = {
  oclusal: 'OCCLUSAL', mesial: 'MESIAL', distal: 'DISTAL', vestibular: 'VESTIBULAR',
  palatina: 'PALATAL', palatino: 'PALATAL', lingual: 'LINGUAL', cervical: 'CERVICAL', incisal: 'INCISAL'
}

function normalize(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizedReply(text = '') {
  return normalize(text).replace(/[¿?¡!.,;:]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function conditionReplyFrom(text) {
  const value = normalizedReply(text)
  if (/^(bien|bueno|buen estado|esta bien|en buen estado)$/.test(value)) return 'GOOD'
  if (/^(mal|malo|mal estado|esta mal|en mal estado)$/.test(value)) return 'BAD'
  return null
}

function isConfirmationReply(text) {
  const value = normalizedReply(text)
  return /^(si|correcto|confirmo|confirma|confirmar|confirmado|de acuerdo|esta bien|ok|okay|dale|listo|guardar|guarda|guardalo)$/.test(value)
}

function toothFrom(text) {
  const match = text.match(/(?:pieza|diente|la)?\s*([1-8][1-8])\b/)
  return match ? Number(match[1]) : null
}

function surfaceFrom(text) {
  const key = Object.keys(SURFACE_TERMS).find(term => text.includes(term))
  return key ? SURFACE_TERMS[key] : null
}

function cariesTypeFrom(text) {
  if (text.includes('mancha blanca')) return 'WHITE_SPOT'
  if (text.includes('pulpa') || text.includes('pulpar')) return 'PULP'
  if (text.includes('dentina')) return 'DENTIN'
  if (text.includes('esmalte')) return 'ENAMEL'
  return null
}

function absenceReasonFrom(text) {
  if (text.includes('no erupcion')) return 'NOT_ERUPTED'
  if ((text.includes('extraccion') || text.includes('extraida')) && text.includes('caries')) return 'EXTRACTION_CARIES'
  if (text.includes('otra razon') || text.includes('trauma') || text.includes('agenesia')) return 'OTHER'
  return null
}

function parseFindingPart(part, context = {}) {
  const tooth = toothFrom(part)
  const surface = surfaceFrom(part)
  if (part.includes('ausente') || part.includes('no erupcion') || part.includes('extraida')) {
    return { finding: 'TOOTH_ABSENT', tooth, absenceReason: absenceReasonFrom(part) }
  }
  if (part.includes('caries') || part.includes('mancha blanca') || part.includes('esmalte') || part.includes('dentina') || part.includes('pulpa')) {
    return { finding: 'CARIES', tooth, cariesType: cariesTypeFrom(part), surface }
  }
  if (part.includes('tambien') || part.includes('igual')) {
    return {
      finding: context.previousFinding,
      tooth,
      cariesType: context.previousCariesType,
      absenceReason: context.previousAbsenceReason,
      surface
    }
  }
  return { finding: 'UNKNOWN', tooth, rawText: part }
}

export function parseConversationalInput(rawText, context = {}) {
  const text = normalize(rawText).replace(/[.;]+/g, ',')
  if (!text.trim()) return { intent: 'NO_INPUT' }
  const condition = context.pendingField === 'condition' ? conditionReplyFrom(text) : null
  if (condition) return { intent: 'ANSWER_CLARIFICATION', condition }
  if (/\b(terminamos|terminar|finalizar|fin de la atencion)\b/.test(text)) return { intent: 'FINISH_SESSION' }
  if (/\b(deshaz|deshacer|borra lo ultimo|cancela lo ultimo)\b/.test(text)) return { intent: 'UNDO_PENDING' }
  if (/\b(que llevamos|que hemos registrado|resumen)\b/.test(text)) return { intent: 'GET_SESSION_FINDINGS' }
  if (isConfirmationReply(text)) return { intent: 'CONFIRM_FINDINGS' }
  if (/\b(corrige|corregir|era|no era)\b/.test(text) || /^no[,]?\s+(?:pieza|diente|la)\b/.test(text)) {
    return { intent: 'CORRECT_PENDING', tooth: toothFrom(text), surface: surfaceFrom(text) }
  }

  const parts = text.split(/,|\s+y\s+(?=(?:pieza\s+|diente\s+|la\s+)?[1-8][1-8]\b)/).map(value => value.trim()).filter(Boolean)
  return { intent: 'REGISTER_FINDINGS', findings: parts.map(part => parseFindingPart(part, context)) }
}
