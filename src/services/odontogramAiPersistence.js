import { addDoc, arrayUnion, collection, doc, getDocs, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { firestore } from '../config/firebase'

export async function createAiClinicalSession({ patientId, userId }) {
  const reference = await addDoc(collection(firestore, 'odontogramaAiSessions'), {
    patientId,
    userId,
    flowType: 'QUIRU_AI',
    status: 'ACTIVE',
    createdAt: serverTimestamp(),
    findings: [],
    schemaVersion: 1,
    normativeVersion: 'NTS-188-MINSA-DGIESP-2022'
  })
  return reference.id
}

function timestampValue(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis()
  const parsed = new Date(value || 0).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

export async function loadAiClinicalSessions({ patientId, userId }) {
  const reference = query(
    collection(firestore, 'odontogramaAiSessions'),
    where('patientId', '==', patientId),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(reference)
  return snapshot.docs
    .map(item => ({ id: item.id, ...item.data() }))
    .sort((left, right) => timestampValue(right.updatedAt || right.createdAt) - timestampValue(left.updatedAt || left.createdAt))
}

export async function loadLatestAiClinicalSession(criteria) {
  const sessions = await loadAiClinicalSessions(criteria)
  return sessions[0] || null
}

export async function persistConfirmedFindings(sessionId, findings) {
  const safeFindings = findings.map(finding => ({
    ...finding,
    persistedAt: new Date(),
    status: 'PERSISTED'
  }))
  const reference = doc(firestore, 'odontogramaAiSessions', sessionId)
  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(reference)
    if (!snapshot.exists()) throw new Error('El diagnóstico no existe.')
    if (snapshot.data().status === 'COMPLETED') {
      const error = new Error('El diagnóstico está finalizado y no puede modificarse.')
      error.code = 'diagnosis-completed'
      throw error
    }
    transaction.update(reference, {
      findings: arrayUnion(...safeFindings),
      updatedAt: serverTimestamp()
    })
  })
  return safeFindings
}

export function closeAiClinicalSession(sessionId, summary) {
  const reference = doc(firestore, 'odontogramaAiSessions', sessionId)
  return runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(reference)
    if (!snapshot.exists()) throw new Error('El diagnóstico no existe.')
    if (snapshot.data().status === 'COMPLETED') {
      const error = new Error('El diagnóstico ya fue finalizado.')
      error.code = 'diagnosis-completed'
      throw error
    }
    transaction.update(reference, {
      status: 'COMPLETED',
      completedAt: serverTimestamp(),
      summary
    })
  })
}

export function updateAiClinicalSession(sessionId, clinicalData) {
  return updateDoc(doc(firestore, 'odontogramaAiSessions', sessionId), {
    ...clinicalData,
    updatedAt: serverTimestamp()
  })
}

export function writeAnonymousAiTelemetry(metrics) {
  return addDoc(collection(firestore, 'odontogramaAiMetrics'), {
    ...metrics,
    createdAt: serverTimestamp(),
    schemaVersion: 1
  })
}
