import { computed, ref } from 'vue'
import {
  GoogleAIBackend,
  getAI,
  getGenerativeModel
} from 'firebase/ai'
import { getToken as getAppCheckToken } from 'firebase/app-check'
import { app, appCheck } from '../config/firebase'
import {
  QUIRU_APPOINTMENT_TOOLS,
  QUIRU_TEXT_MODEL,
  buildQuiruAppointmentInstruction
} from '../config/voiceAssistant'
import { registro as patients } from './paciente'
import { registro as appointments, guardarCita } from './citas'
import { item as doctor } from './usuario'
import { miUsuario, usuario } from './sesion'
import { activarVoz, detenerVoz, isSpeech, speak } from './odontograma'
import {
  buildVoiceAppointmentDraft,
  countAppointmentOverlaps,
  patientFullName,
  searchAuthorizedPatients
} from '../services/voiceAppointmentTools'

export const voicePanelOpen = ref(false)
export const voiceAppointmentState = ref('idle')
export const voiceAppointmentError = ref('')
export const voiceAppointmentDraft = ref(null)
export const voicePatientMatches = ref([])

export const voiceAppointmentBusy = computed(() => [
  'requesting_permission', 'connecting', 'processing', 'creating'
].includes(voiceAppointmentState.value))

let chatSession = null
let speechRecognition = null
let conversationActive = false
let wasOdontogramListening = false
let creationPromise = null
let createdAppointmentId = null

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Lima'

function currentUserId() {
  return miUsuario()?.uid || usuario.value?.uid || ''
}

function functionResponse(call, response) {
  return {
    functionResponse: {
      name: call.name,
      response
    }
  }
}

function safeErrorMessage(error) {
  const code = String(error?.code || '')
  const name = String(error?.name || '')
  const message = String(error?.message || '')
  const details = `${code} ${name} ${message}`.toLowerCase()
  const status = Number(error?.customData?.status || error?.customErrorData?.status || 0)
  if (name === 'NotAllowedError') return 'El permiso del micrófono fue denegado.'
  if (name === 'NotFoundError') return 'No se encontró un micrófono disponible.'
  if (details.includes('app-check') || details.includes('appcheck')) {
    return 'Firebase App Check no autorizó este navegador. Registra el token de desarrollo o configura reCAPTCHA Enterprise.'
  }
  if (status === 429 || details.includes('prepayment credits') || details.includes('quota')) {
    return 'Gemini no tiene cuota disponible. Revisa los créditos y la facturación del proyecto quiru-prod en Google AI Studio.'
  }
  if (details.includes('not-allowed')) return 'El permiso del micrófono fue denegado.'
  if (details.includes('no-speech')) return 'No pude escuchar tu voz. Presiona Reintentar y vuelve a hablar.'
  if (details.includes('audio-capture')) return 'No se encontró un micrófono disponible.'
  if (code.includes('api-not-enabled')) return 'Firebase AI Logic aún no está habilitado para el proyecto de datos.'
  if (code.includes('unsupported')) return 'Este navegador no admite la conversación de voz en tiempo real.'
  if (code.includes('fetch-error')) return 'No se pudo conectar con QUIRU. Revisa tu conexión e inténtalo nuevamente.'
  return 'No se pudo iniciar el asistente de citas. Inténtalo nuevamente.'
}

function spokenText(value = '') {
  return String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_`#>~|]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function getAuthorizedPatient(patientId) {
  const uid = currentUserId()
  return patients.value.find(patient => (
    patient.id === patientId && patient.estado !== false && patient.idOdontologo === uid
  ))
}

function prepareAppointment(args) {
  const patient = getAuthorizedPatient(args?.pacienteId)
  const draft = buildVoiceAppointmentDraft(args, patient, doctor.value, timeZone())
  const overlaps = countAppointmentOverlaps(appointments.value, draft)
  voiceAppointmentDraft.value = { ...draft, overlaps }
  createdAppointmentId = null
  voiceAppointmentState.value = 'awaiting_confirmation'
  return {
    success: true,
    requiereConfirmacion: true,
    resumen: {
      paciente: draft.patientName,
      fecha: draft.dateLabel,
      horaInicio: draft.startTime,
      horaFin: draft.endTime,
      duracionMinutos: draft.duration,
      motivo: draft.reason
    },
    advertenciaSuperposicion: overlaps > 0
      ? `Se detectaron ${overlaps} citas superpuestas. Esto es solo una advertencia, no una validación definitiva de disponibilidad.`
      : null
  }
}

async function persistPreparedAppointment() {
  if (createdAppointmentId) {
    return { success: true, citaId: createdAppointmentId, duplicadoEvitado: true }
  }
  if (voiceAppointmentState.value !== 'awaiting_confirmation' || !voiceAppointmentDraft.value) {
    return { success: false, error: 'La cita todavía no tiene un resumen pendiente de confirmación.' }
  }
  if (creationPromise) return creationPromise

  const draft = voiceAppointmentDraft.value
  const patient = getAuthorizedPatient(draft.patientId)
  if (!patient || patientFullName(patient) !== draft.patientName) {
    return { success: false, error: 'El paciente ya no está disponible o sus datos cambiaron.' }
  }

  voiceAppointmentState.value = 'creating'
  creationPromise = guardarCita(draft.payload)
    .then(citaId => {
      createdAppointmentId = citaId
      voiceAppointmentState.value = 'success'
      return {
        success: true,
        citaId,
        paciente: draft.patientName,
        fecha: draft.dateLabel,
        horaInicio: draft.startTime,
        horaFin: draft.endTime
      }
    })
    .catch(() => {
      voiceAppointmentState.value = 'error'
      voiceAppointmentError.value = 'No pude registrar la cita. Podemos intentarlo nuevamente.'
      return { success: false, error: voiceAppointmentError.value }
    })
    .finally(() => {
      creationPromise = null
    })

  return creationPromise
}

async function handleFunctionCalls(functionCalls) {
  const call = functionCalls?.[0]
  if (!call) return { text: 'No se recibió una herramienta válida.' }
  voiceAppointmentState.value = 'processing'

  try {
    if (functionCalls.length > 1) {
      voiceAppointmentState.value = voiceAppointmentDraft.value ? 'awaiting_confirmation' : 'listening'
      return functionResponse(call, {
        success: false,
        error: 'QUIRU solo permite ejecutar una herramienta por turno.'
      })
    }

    if (call.name === 'buscar_paciente') {
      const found = searchAuthorizedPatients(patients.value, call.args?.consulta, currentUserId())
      voicePatientMatches.value = found
      voiceAppointmentState.value = 'listening'
      return functionResponse(call, { encontrados: found })
    }

    if (call.name === 'preparar_cita') {
      return functionResponse(call, prepareAppointment(call.args))
    }

    if (call.name === 'confirmar_cita') {
      return functionResponse(call, await persistPreparedAppointment())
    }

    if (call.name === 'cancelar_cita') {
      voiceAppointmentDraft.value = null
      voiceAppointmentState.value = 'cancelled'
      return functionResponse(call, { success: true, cancelada: true })
    }

    voiceAppointmentState.value = 'listening'
    return functionResponse(call, { success: false, error: 'Herramienta no permitida.' })
  } catch (error) {
    voiceAppointmentState.value = voiceAppointmentDraft.value ? 'awaiting_confirmation' : 'listening'
    return functionResponse(call, {
      success: false,
      error: error?.message || 'No se pudieron validar los datos de la cita.'
    })
  }
}

export function openVoiceAppointmentPanel() {
  if (['success', 'cancelled'].includes(voiceAppointmentState.value)) {
    voiceAppointmentDraft.value = null
    voicePatientMatches.value = []
    createdAppointmentId = null
    voiceAppointmentError.value = ''
    voiceAppointmentState.value = 'idle'
  }
  voicePanelOpen.value = true
}

function recognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition
}

function createRecognition() {
  const SpeechRecognition = recognitionConstructor()
  if (!SpeechRecognition) return null
  const recognition = new SpeechRecognition()
  recognition.lang = 'es-PE'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim()
    if (transcript) processVoiceTurn(transcript)
  }
  recognition.onend = () => {
    if (!conversationActive || voiceAppointmentState.value === 'processing') return
    if (['listening', 'awaiting_confirmation'].includes(voiceAppointmentState.value)) {
      setTimeout(() => startListening(), 250)
    }
  }
  recognition.onerror = event => {
    if (!conversationActive || event.error === 'aborted') return
    voiceAppointmentError.value = safeErrorMessage({ code: event.error, name: event.error })
    voiceAppointmentState.value = 'error'
  }
  return recognition
}

function startListening() {
  if (!conversationActive || !speechRecognition) return
  if (!voiceAppointmentDraft.value) voiceAppointmentState.value = 'listening'
  try {
    speechRecognition.start()
  } catch (error) {
    if (!String(error?.message || '').includes('already started')) throw error
  }
}

async function speakAndContinue(text) {
  const conciseText = spokenText(text)
  if (conciseText) await speak(conciseText, { manageRecognition: false, rate: 1.12 })
  if (!conversationActive || ['success', 'cancelled', 'error'].includes(voiceAppointmentState.value)) return
  startListening()
}

async function sendFunctionResult(call, responsePart) {
  let result = await chatSession.sendMessage([responsePart])
  let response = result.response
  for (let turn = 0; turn < 3; turn += 1) {
    const calls = response.functionCalls?.() || []
    if (!calls.length) return response
    const nextPart = await handleFunctionCalls(calls)
    result = await chatSession.sendMessage([nextPart])
    response = result.response
  }
  throw new Error('Se excedió el límite de acciones consecutivas del asistente.')
}

async function processVoiceTurn(transcript) {
  if (!conversationActive || !chatSession) return
  voiceAppointmentError.value = ''
  voiceAppointmentState.value = 'processing'
  try {
    let result = await chatSession.sendMessage(transcript)
    let response = result.response
    const calls = response.functionCalls?.() || []
    if (calls.length) {
      const responsePart = await handleFunctionCalls(calls)
      response = await sendFunctionResult(calls[0], responsePart)
    }
    const answer = response.text?.() || 'Continúa, por favor.'
    if (voiceAppointmentState.value === 'processing') {
      voiceAppointmentState.value = voiceAppointmentDraft.value ? 'awaiting_confirmation' : 'listening'
    }
    await speakAndContinue(answer)
  } catch (error) {
    console.error('[QUIRU] Error procesando la conversación de citas:', error)
    voiceAppointmentError.value = safeErrorMessage(error)
    voiceAppointmentState.value = 'error'
  }
}

export async function startVoiceAppointmentConversation() {
  if (!currentUserId()) {
    voiceAppointmentError.value = 'Debes iniciar sesión para agendar una cita.'
    voiceAppointmentState.value = 'error'
    return
  }
  if (!recognitionConstructor() || !window.speechSynthesis || !navigator.mediaDevices?.getUserMedia) {
    voiceAppointmentError.value = 'Este navegador no admite la conversación de voz en tiempo real.'
    voiceAppointmentState.value = 'error'
    return
  }

  await stopVoiceAppointmentConversation(false)
  voiceAppointmentError.value = ''
  voiceAppointmentDraft.value = null
  voicePatientMatches.value = []
  createdAppointmentId = null
  wasOdontogramListening = isSpeech.value
  if (wasOdontogramListening) detenerVoz()

  try {
    voiceAppointmentState.value = 'connecting'
    if (!appCheck) {
      const error = new Error('Firebase App Check no está configurado para este entorno.')
      error.code = 'app-check/not-configured'
      throw error
    }
    await getAppCheckToken(appCheck)
    const ai = getAI(app, { backend: new GoogleAIBackend() })
    const model = getGenerativeModel(ai, {
      model: QUIRU_TEXT_MODEL,
      systemInstruction: buildQuiruAppointmentInstruction(timeZone()),
      tools: QUIRU_APPOINTMENT_TOOLS,
      generationConfig: {
        maxOutputTokens: 220
      }
    })
    chatSession = model.startChat()
    speechRecognition = createRecognition()
    conversationActive = true
    voiceAppointmentState.value = 'requesting_permission'
    await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      stream.getTracks().forEach(track => track.stop())
    })
    await speakAndContinue('Hola, soy QUIRU. Dime para quién deseas registrar la cita.')
  } catch (error) {
    console.error('[QUIRU] No se pudo iniciar el asistente de citas:', error)
    voiceAppointmentError.value = safeErrorMessage(error)
    voiceAppointmentState.value = 'error'
    await stopVoiceAppointmentConversation(false)
  }
}

export function modifyVoiceAppointment() {
  if (!voiceAppointmentDraft.value) return
  voiceAppointmentState.value = 'listening'
}

export async function confirmVoiceAppointmentFromUI() {
  const result = await persistPreparedAppointment()
  if (result.success) {
    const message = `Listo. La cita de ${result.paciente} quedó registrada para ${result.fecha}, de ${result.horaInicio} a ${result.horaFin}.`
    await stopVoiceAppointmentConversation(false)
    speak(message, { manageRecognition: false })
  }
  return result
}

export async function cancelVoiceAppointment() {
  voiceAppointmentDraft.value = null
  voiceAppointmentState.value = 'cancelled'
  await stopVoiceAppointmentConversation(false)
}

export async function stopVoiceAppointmentConversation(restoreOdontogram = true) {
  conversationActive = false
  if (speechRecognition) {
    try { speechRecognition.abort() } catch (error) {}
  }
  speechRecognition = null
  chatSession = null
  window.speechSynthesis?.cancel()
  if (restoreOdontogram && wasOdontogramListening) activarVoz()
  wasOdontogramListening = false
}

export async function closeVoiceAppointmentPanel() {
  await stopVoiceAppointmentConversation()
  voicePanelOpen.value = false
  if (!createdAppointmentId) {
    voiceAppointmentDraft.value = null
    voiceAppointmentState.value = 'idle'
  }
}
