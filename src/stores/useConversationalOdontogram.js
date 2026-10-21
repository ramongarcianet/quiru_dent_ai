import { computed, ref } from 'vue'
import { findingSummary, validateNTS188Finding } from '../domain/nts188/NTS188RulesEngine'
import { parseConversationalInput } from '../services/conversationalFindingParser'
import {
  closeAiClinicalSession,
  createAiClinicalSession,
  loadAiClinicalSessions,
  persistConfirmedFindings,
  updateAiClinicalSession,
  writeAnonymousAiTelemetry
} from '../services/odontogramAiPersistence'
import { estimateAiSessionCost } from '../services/aiCostEstimator'
import { deleteStorageFile, progressFile, setFile } from '../store/storage'

function id() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useConversationalOdontogram({ patientId, userId }) {
  const findings = ref([])
  const highlightedTooth = ref(null)
  const assistantMessage = ref('Puedes registrar hallazgos utilizando voz o interactuando directamente con el odontograma.')
  const error = ref('')
  const busy = ref(false)
  const startedAt = Date.now()
  const sessionId = ref(null)
  const diagnoses = ref([])
  const selectedDiagnosisId = ref(null)
  const finished = ref(false)
  const metrics = ref({ clicks: 0, voiceTurns: 0, aiRequests: 0, toolCalls: 0, corrections: 0, interpretationErrors: 0, liveSeconds: 0 })
  const memory = ref({ currentTooth: null, previousFinding: null, previousCariesType: null, previousAbsenceReason: null })
  const clarification = ref(null)

  const pendingFindings = computed(() => findings.value.filter(item => item.status === 'PENDING'))
  const persistedFindings = computed(() => findings.value.filter(item => item.status === 'PERSISTED'))
  const currentPersistedFindings = computed(() => persistedFindings.value)
  const selectedDiagnosis = computed(() => diagnoses.value.find(item => item.id === selectedDiagnosisId.value) || null)
  const isDiagnosisReadOnly = computed(() => selectedDiagnosis.value?.status === 'COMPLETED')

  function rejectFinalizedDiagnosis() {
    assistantMessage.value = 'Este diagnóstico está finalizado y es de solo lectura. Usa “Generar nuevo diagnóstico” para registrar nuevos hallazgos.'
    return assistantMessage.value
  }

  function hydrateDiagnosis(savedSession) {
    sessionId.value = savedSession?.id || null
    selectedDiagnosisId.value = savedSession?.id || null
    findings.value = (savedSession?.findings || []).map(saved => ({
      ...saved,
      id: saved.id || id(),
      status: 'PERSISTED',
      sourceSessionId: savedSession.id
    }))
    memory.value = { currentTooth: null, previousFinding: null, previousCariesType: null, previousAbsenceReason: null }
    clarification.value = null
    const latest = findings.value[findings.value.length - 1]
    if (latest) updateMemory(latest)
    assistantMessage.value = savedSession?.status === 'COMPLETED'
      ? `Diagnóstico finalizado: ${findings.value.length} hallazgo(s). Este registro es de solo lectura.`
      : findings.value.length
      ? `${findings.value.length} hallazgo(s) cargados del diagnóstico seleccionado.`
      : 'El diagnóstico seleccionado aún no tiene hallazgos.'
  }

  async function loadPersistedSession(preferredId = null) {
    busy.value = true
    error.value = ''
    try {
      diagnoses.value = await loadAiClinicalSessions({ patientId, userId })
      const savedSession = diagnoses.value.find(item => item.id === preferredId) || diagnoses.value[0]
      if (!savedSession) {
        hydrateDiagnosis(null)
        assistantMessage.value = 'Puedes registrar hallazgos utilizando voz o interactuando directamente con el odontograma.'
        return { success: true, found: false }
      }
      hydrateDiagnosis(savedSession)
      return { success: true, found: true, count: findings.value.length, status: savedSession.status }
    } catch (cause) {
      error.value = 'No se pudieron cargar los hallazgos anteriores. Puedes reintentar entrando nuevamente.'
      return { success: false, error: error.value, cause }
    } finally {
      busy.value = false
    }
  }

  function selectDiagnosis(diagnosisId) {
    if (pendingFindings.value.length) {
      assistantMessage.value = 'Confirma o descarta los hallazgos pendientes antes de cambiar de diagnóstico.'
      return { success: false, error: assistantMessage.value }
    }
    const diagnosis = diagnoses.value.find(item => item.id === diagnosisId)
    if (!diagnosis) return { success: false, error: 'No se encontró el diagnóstico seleccionado.' }
    hydrateDiagnosis(diagnosis)
    finished.value = false
    return { success: true, count: findings.value.length }
  }

  function beginNewDiagnosis() {
    if (pendingFindings.value.length) {
      assistantMessage.value = 'Confirma o descarta los hallazgos pendientes antes de generar un nuevo diagnóstico.'
      return { success: false, error: assistantMessage.value }
    }
    sessionId.value = null
    selectedDiagnosisId.value = null
    findings.value = []
    highlightedTooth.value = null
    memory.value = { currentTooth: null, previousFinding: null, previousCariesType: null, previousAbsenceReason: null }
    clarification.value = null
    finished.value = false
    assistantMessage.value = 'Nuevo diagnóstico preparado. El registro se creará al confirmar el primer hallazgo.'
    return { success: true }
  }

  function record(kind) {
    if (kind === 'click') metrics.value.clicks += 1
    if (kind === 'voice') metrics.value.voiceTurns += 1
    if (kind === 'ai') metrics.value.aiRequests += 1
    if (kind === 'tool') metrics.value.toolCalls += 1
  }

  function updateMemory(normalized) {
    memory.value = {
      currentTooth: normalized.tooth,
      previousFinding: normalized.finding,
      previousCariesType: normalized.cariesType || null,
      previousAbsenceReason: normalized.absenceReason || null
    }
  }

  function previewFinding(structured, source = 'MANUAL') {
    error.value = ''
    if (isDiagnosisReadOnly.value) {
      const message = rejectFinalizedDiagnosis()
      return { valid: false, immutable: true, errors: [{ question: message }] }
    }
    if (structured?.tooth) highlightedTooth.value = Number(structured.tooth)
    const result = validateNTS188Finding(structured)
    if (!result.valid) {
      metrics.value.interpretationErrors += 1
      clarification.value = result.errors?.[0]?.field
        ? { field: result.errors[0].field, draft: { ...structured } }
        : null
      assistantMessage.value = result.errors?.[0]?.question || 'Necesito una aclaración.'
      return result
    }
    clarification.value = null
    const preview = { ...result.normalized, id: id(), status: 'PENDING', source, createdAt: new Date() }
    findings.value.push(preview)
    highlightedTooth.value = preview.tooth
    updateMemory(preview)
    assistantMessage.value = `${findingSummary(preview)}. ¿Confirmas?`
    return { valid: true, preview }
  }

  function correctPending(changes = {}) {
    if (isDiagnosisReadOnly.value) return { success: false, immutable: true, error: rejectFinalizedDiagnosis() }
    const target = [...pendingFindings.value].pop()
    if (!target) {
      assistantMessage.value = 'No hay un hallazgo pendiente para corregir.'
      return { success: false, error: assistantMessage.value }
    }
    const allowedFields = ['tooth', 'finding', 'secondTooth', 'surface', 'ntsCode', 'condition', 'cariesType', 'absenceReason']
    const correction = Object.fromEntries(allowedFields
      .filter(field => changes[field] !== undefined && changes[field] !== null && changes[field] !== '')
      .map(field => [field, changes[field]]))
    const candidate = { ...target, ...correction }
    const result = validateNTS188Finding(candidate)
    if (!result.valid) {
      clarification.value = result.errors?.[0]?.field
        ? { field: result.errors[0].field, draft: { ...candidate } }
        : null
      assistantMessage.value = result.errors[0].question
      return result
    }
    clarification.value = null
    Object.assign(target, result.normalized)
    highlightedTooth.value = target.tooth
    metrics.value.corrections += 1
    assistantMessage.value = `${findingSummary(target)}. ¿Confirmas?`
    return { success: true, preview: target }
  }

  function undoPending() {
    if (isDiagnosisReadOnly.value) return { success: false, immutable: true, error: rejectFinalizedDiagnosis() }
    const index = findings.value.map(item => item.status).lastIndexOf('PENDING')
    if (index < 0) {
      assistantMessage.value = 'No hay cambios pendientes para deshacer.'
      return { success: false, error: assistantMessage.value }
    }
    findings.value.splice(index, 1)
    assistantMessage.value = 'Cambio pendiente descartado.'
    return { success: true }
  }

  async function ensureSession() {
    if (!sessionId.value) {
      sessionId.value = await createAiClinicalSession({ patientId, userId })
      selectedDiagnosisId.value = sessionId.value
      diagnoses.value.unshift({ id: sessionId.value, status: 'ACTIVE', findings: [], createdAt: new Date(), updatedAt: new Date() })
    }
    return sessionId.value
  }

  async function confirmPending() {
    if (isDiagnosisReadOnly.value) return { success: false, immutable: true, error: rejectFinalizedDiagnosis() }
    if (!pendingFindings.value.length) {
      assistantMessage.value = 'No hay hallazgos pendientes por confirmar.'
      return { success: false, error: assistantMessage.value }
    }
    busy.value = true
    error.value = ''
    const batch = pendingFindings.value.map(item => ({ ...item, status: 'CONFIRMED' }))
    pendingFindings.value.forEach(item => { item.status = 'CONFIRMED' })
    try {
      const currentSessionId = await ensureSession()
      const persisted = await persistConfirmedFindings(currentSessionId, batch)
      persisted.forEach(saved => {
        const local = findings.value.find(item => item.id === saved.id)
        if (local) Object.assign(local, saved)
      })
      const diagnosis = diagnoses.value.find(item => item.id === currentSessionId)
      if (diagnosis) {
        diagnosis.status = 'ACTIVE'
        diagnosis.updatedAt = new Date()
        diagnosis.findings = currentPersistedFindings.value.map(item => ({ ...item }))
      }
      assistantMessage.value = batch.length === 1 ? 'Hallazgo registrado.' : `${batch.length} hallazgos registrados.`
      return { success: true, count: batch.length }
    } catch (cause) {
      batch.forEach(saved => {
        const local = findings.value.find(item => item.id === saved.id)
        if (local) local.status = 'PENDING'
      })
      error.value = cause?.code === 'diagnosis-completed'
        ? 'Este diagnóstico ya fue finalizado y no admite modificaciones. Genera un diagnóstico nuevo para continuar.'
        : 'No se pudo guardar. El hallazgo sigue pendiente y puedes continuar manualmente.'
      assistantMessage.value = error.value
      return { success: false, error: error.value, cause }
    } finally {
      busy.value = false
    }
  }

  async function saveClinicalDetails(clinicalData) {
    if (isDiagnosisReadOnly.value) return { success: false, immutable: true, error: rejectFinalizedDiagnosis() }
    busy.value = true
    error.value = ''
    const uploadedFiles = []
    try {
      const currentSessionId = await ensureSession()
      const payload = { ...clinicalData }
      const pendingFiles = Array.isArray(payload.files) ? payload.files : []
      const requestedRemovals = Array.isArray(payload.removedFiles) ? payload.removedFiles : []
      delete payload.files
      delete payload.removedFiles

      let removedFiles = []
      if (payload.additionalData) {
        const currentDiagnosis = diagnoses.value.find(item => item.id === currentSessionId)
        const currentAdditionalData = currentDiagnosis?.additionalData || {}
        const existingFiles = Array.isArray(currentAdditionalData.archivos) ? currentAdditionalData.archivos : []
        removedFiles = requestedRemovals.filter(file => existingFiles.includes(file))
        const remainingFiles = existingFiles.filter(file => !removedFiles.includes(file))

        for (const file of pendingFiles) {
          uploadedFiles.push(await setFile(file, currentSessionId, true))
        }

        payload.additionalData = {
          ...payload.additionalData,
          archivos: [...remainingFiles, ...uploadedFiles]
        }
      }

      progressFile.value = 0
      await updateAiClinicalSession(currentSessionId, payload)
      const diagnosis = diagnoses.value.find(item => item.id === currentSessionId)
      if (diagnosis) Object.assign(diagnosis, payload, { updatedAt: new Date() })

      const deletionResults = await Promise.allSettled(removedFiles.map(deleteStorageFile))
      const failedDeletions = deletionResults.filter(result => result.status === 'rejected')
      return {
        success: true,
        sessionId: currentSessionId,
        additionalData: payload.additionalData,
        warning: failedDeletions.length
          ? 'Datos guardados, pero no se pudieron eliminar uno o más archivos del almacenamiento.'
          : ''
      }
    } catch (cause) {
      progressFile.value = 0
      const cleanupResults = await Promise.allSettled(uploadedFiles.map(deleteStorageFile))
      cleanupResults.forEach(result => {
        if (result.status === 'rejected') console.error('No se pudo limpiar un archivo clínico cargado parcialmente:', result.reason)
      })
      error.value = typeof cause === 'string'
        ? cause
        : cause?.message || 'No se pudieron guardar los datos clínicos adicionales.'
      return { success: false, error: error.value, cause }
    } finally {
      busy.value = false
    }
  }

  function sessionSummary() {
    return {
      persisted: currentPersistedFindings.value.length,
      pending: pendingFindings.value.length,
      corrections: metrics.value.corrections
    }
  }

  async function finishSession() {
    if (isDiagnosisReadOnly.value) return { success: false, immutable: true, error: rejectFinalizedDiagnosis() }
    if (pendingFindings.value.length) {
      assistantMessage.value = `Hay ${pendingFindings.value.length} hallazgo(s) sin confirmar.`
      return { success: false, requiresConfirmation: true, ...sessionSummary() }
    }
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000)
    const summary = sessionSummary()
    try {
      if (sessionId.value) {
        await closeAiClinicalSession(sessionId.value, summary)
        const diagnosis = diagnoses.value.find(item => item.id === sessionId.value)
        if (diagnosis) diagnosis.status = 'COMPLETED'
      }
      await writeAnonymousAiTelemetry({
        sessionType: 'AI', durationSeconds, ...metrics.value,
        findingsCreated: currentPersistedFindings.value.length,
        estimatedCost: estimateAiSessionCost(metrics.value),
        abandoned: false
      })
    } catch (cause) {
      error.value = 'La atención clínica fue guardada, pero no se pudo completar la telemetría.'
    }
    finished.value = true
    assistantMessage.value = 'Atención guardada.'
    return { success: true, durationSeconds, ...summary }
  }

  async function abandonSession() {
    if (finished.value) return
    const durationSeconds = Math.round((Date.now() - startedAt) / 1000)
    try {
      await writeAnonymousAiTelemetry({
        sessionType: 'AI', durationSeconds, ...metrics.value,
        findingsCreated: currentPersistedFindings.value.length,
        estimatedCost: estimateAiSessionCost(metrics.value),
        abandoned: true
      })
    } catch (error) {}
  }

  async function handleIntent(parsed, source = 'VOICE') {
    if (parsed.intent === 'ANSWER_CLARIFICATION') {
      if (!clarification.value?.draft) return { success: false, error: 'No hay una pregunta pendiente.' }
      return previewFinding({ ...clarification.value.draft, condition: parsed.condition }, source)
    }
    if (parsed.intent === 'REGISTER_FINDINGS') {
      const results = parsed.findings.map(item => previewFinding(item, source))
      return { success: results.every(item => item.valid), results }
    }
    if (parsed.intent === 'CORRECT_PENDING') return correctPending(parsed)
    if (parsed.intent === 'UNDO_PENDING') return undoPending()
    if (parsed.intent === 'CONFIRM_FINDINGS') return confirmPending()
    if (parsed.intent === 'GET_SESSION_FINDINGS') return { success: true, ...sessionSummary() }
    if (parsed.intent === 'FINISH_SESSION') return finishSession()
    return { success: false, error: 'Intención no reconocida.' }
  }

  function processText(text, source = 'VOICE') {
    if (source === 'VOICE') record('voice')
    return handleIntent(parseConversationalInput(text, {
      ...memory.value,
      pendingField: clarification.value?.field || null
    }), source)
  }

  return {
    findings, pendingFindings, persistedFindings, diagnoses, selectedDiagnosisId, selectedDiagnosis, isDiagnosisReadOnly, highlightedTooth, assistantMessage, error, busy, clarification,
    finished, metrics, memory, record, loadPersistedSession, selectDiagnosis, beginNewDiagnosis, previewFinding, correctPending, undoPending, confirmPending,
    finishSession, abandonSession, saveClinicalDetails, processText, handleIntent, sessionSummary
  }
}
