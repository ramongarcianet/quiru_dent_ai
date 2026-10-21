import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appointmentDraftSpeechSummary,
  classifyAppointmentVoiceCommand
} from '../src/services/voiceAppointmentTools.js'

test('resuelve confirmaciones de una cita localmente', () => {
  for (const reply of ['sí', 'está bien', 'ok', 'dale', 'confirmado', 'guárdalo']) {
    assert.equal(
      classifyAppointmentVoiceCommand(reply, { awaitingConfirmation: true }),
      'confirm',
      reply
    )
  }
})

test('no confirma si todavía no existe un resumen pendiente', () => {
  assert.equal(classifyAppointmentVoiceCommand('sí'), null)
})

test('resuelve cancelación y modificación sin usar Gemini', () => {
  assert.equal(classifyAppointmentVoiceCommand('cancelar'), 'cancel')
  assert.equal(
    classifyAppointmentVoiceCommand('quiero cambiar', { awaitingConfirmation: true }),
    'modify'
  )
  assert.equal(
    classifyAppointmentVoiceCommand('no', { awaitingConfirmation: true }),
    'modify'
  )
})

test('genera localmente un resumen de confirmación breve', () => {
  const summary = appointmentDraftSpeechSummary({
    patientName: 'Ana Torres',
    dateLabel: 'miércoles, 21 de octubre de 2026',
    startTime: '10:00',
    endTime: '10:30',
    reason: 'control'
  })
  assert.equal(
    summary,
    'Ana Torres, miércoles, 21 de octubre de 2026, de 10:00 a 10:30, por control. ¿Confirmas?'
  )
})
