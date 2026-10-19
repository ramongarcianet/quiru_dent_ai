<script setup>
import { computed, onBeforeUnmount } from 'vue'
import {
  cancelVoiceAppointment,
  closeVoiceAppointmentPanel,
  confirmVoiceAppointmentFromUI,
  modifyVoiceAppointment,
  openVoiceAppointmentPanel,
  startVoiceAppointmentConversation,
  stopVoiceAppointmentConversation,
  voiceAppointmentBusy,
  voiceAppointmentDraft,
  voiceAppointmentError,
  voiceAppointmentState,
  voicePanelOpen
} from '../../store/citasVoz'

const stateCopy = {
  idle: 'Háblale a QUIRU',
  connecting: 'Conectando con QUIRU…',
  requesting_permission: 'Esperando permiso del micrófono…',
  listening: 'Escuchando…',
  processing: 'Entendiendo…',
  awaiting_confirmation: 'Confirma los datos de la cita',
  creating: 'Registrando la cita…',
  success: 'Cita registrada correctamente',
  error: 'No se pudo completar la conversación',
  cancelled: 'Registro cancelado'
}

const statusText = computed(() => stateCopy[voiceAppointmentState.value] || stateCopy.idle)
const isActive = computed(() => ['connecting', 'requesting_permission', 'listening', 'processing'].includes(voiceAppointmentState.value))

async function closePanel() {
  await closeVoiceAppointmentPanel()
}

onBeforeUnmount(() => stopVoiceAppointmentConversation())
</script>

<template lang="pug">
.voice-assistant-entry
  button.btn.btn-voice.voice-entry-button(type='button' @click='openVoiceAppointmentPanel')
    i.bi.bi-mic-fill
    span Agendar con QUIRU
    span.badge-beta Beta

Teleport(to='body')
  .voice-panel-backdrop(v-if='voicePanelOpen' @click='closePanel')
  section.voice-panel(v-if='voicePanelOpen' role='dialog' aria-modal='true' aria-labelledby='voiceAssistantTitle' @click.stop)
    header.voice-panel-header
      .voice-heading
        .voice-orb(:class='{ active: isActive }')
          i.bi.bi-mic-fill
        div
          span.eyebrow IA conversacional · Beta
          h2#voiceAssistantTitle Agendar con QUIRU
      button.btn-close(type='button' aria-label='Cerrar asistente' @click='closePanel')

    .voice-panel-body
      .voice-status(:data-state='voiceAppointmentState')
        .voice-waves(v-if='isActive' aria-hidden='true')
          span
          span
          span
          span
          span
        strong {{ statusText }}
        p(v-if="voiceAppointmentState === 'idle'") Presiona el micrófono y cuéntame para quién, cuándo y por qué deseas agendar.
        p(v-else-if="voiceAppointmentState === 'listening'") Puedes hablar con naturalidad. Te preguntaré cualquier dato que falte.

      .alert.alert-danger(v-if='voiceAppointmentError' role='alert') {{ voiceAppointmentError }}

      .voice-confirmation(v-if='voiceAppointmentDraft')
        h3 Resumen de la cita
        dl
          div
            dt Paciente
            dd {{ voiceAppointmentDraft.patientName }}
          div
            dt Fecha
            dd {{ voiceAppointmentDraft.dateLabel }}
          div
            dt Horario
            dd {{ voiceAppointmentDraft.startTime }} – {{ voiceAppointmentDraft.endTime }}
          div
            dt Duración
            dd {{ voiceAppointmentDraft.duration }} minutos
          div
            dt Motivo
            dd {{ voiceAppointmentDraft.reason }}
        .alert.alert-warning(v-if='voiceAppointmentDraft.overlaps > 0' role='alert')
          | Hay {{ voiceAppointmentDraft.overlaps }} cita(s) superpuesta(s). Verifica el calendario antes de confirmar.

      .voice-privacy
        i.bi.bi-shield-check
        span La conversación no se guarda. Gemini no tiene acceso directo a Firestore.

    footer.voice-panel-footer
      button.btn.btn-outline-secondary(type='button' @click='closePanel') Cerrar
      button.btn.btn-outline-primary(v-if="voiceAppointmentState === 'awaiting_confirmation'" type='button' @click='modifyVoiceAppointment') Modificar
      button.btn.btn-outline-danger(v-if='voiceAppointmentDraft && voiceAppointmentState !== "success"' type='button' @click='cancelVoiceAppointment') Cancelar
      button.btn.btn-primary(v-if="voiceAppointmentState === 'awaiting_confirmation'" type='button' :disabled='voiceAppointmentBusy' @click='confirmVoiceAppointmentFromUI')
        i.bi.bi-check2-circle.me-2
        | Confirmar
      button.btn.btn-voice(v-else-if='!isActive && voiceAppointmentState !== "success"' type='button' :disabled='voiceAppointmentBusy' @click='startVoiceAppointmentConversation')
        i.bi.bi-mic-fill.me-2
        | {{ voiceAppointmentState === 'error' ? 'Reintentar' : 'Empezar a hablar' }}
</template>

<style lang="sass" scoped>
.voice-assistant-entry
  display: inline-flex
  margin-bottom: 0

.voice-entry-button
  display: inline-flex
  align-items: center
  gap: .65rem
  min-height: 40px
  padding: .5rem .8rem
  border-radius: 12px
  font-weight: 750

.badge-beta
  padding: .2rem .45rem
  border-radius: 999px
  background: rgba(100, 59, 255, .14)
  color: var(--ai-purple)
  font-size: .68rem
  letter-spacing: .04em
  text-transform: uppercase

.voice-panel-backdrop
  position: fixed
  inset: 0
  z-index: 2000
  background: rgba(7, 27, 64, .54)
  backdrop-filter: blur(3px)

.voice-panel
  position: fixed
  top: 50%
  left: 50%
  z-index: 2001
  display: flex
  width: min(94vw, 620px)
  max-height: min(88vh, 760px)
  flex-direction: column
  overflow: hidden
  transform: translate(-50%, -50%)
  border: 1px solid var(--color-border)
  border-radius: 20px
  background: white
  box-shadow: 0 24px 70px rgba(7, 27, 64, .24)

.voice-panel-header
  display: flex
  align-items: center
  justify-content: space-between
  gap: 1rem
  padding: 1.15rem 1.25rem
  border-bottom: 1px solid var(--color-border)
  background: linear-gradient(135deg, rgba(0, 140, 255, .08), rgba(100, 59, 255, .08))
  flex-shrink: 0

.voice-heading
  display: flex
  align-items: center
  gap: .85rem
  h2
    margin: .15rem 0 0
    color: var(--brand-navy)
    font-size: 1.25rem
    font-weight: 800

.voice-orb
  display: grid
  width: 46px
  height: 46px
  place-items: center
  border-radius: 50%
  color: var(--brand-navy)
  background: var(--gradient-voice)
  box-shadow: 0 8px 24px rgba(0, 140, 255, .24)
  &.active
    animation: voice-pulse 1.6s ease-in-out infinite

.voice-panel-body
  min-height: 0
  flex: 1 1 auto
  overflow-y: auto
  padding: 1.25rem

.voice-status
  display: grid
  justify-items: center
  gap: .6rem
  padding: 1.1rem
  text-align: center
  border: 1px solid rgba(0, 102, 255, .12)
  border-radius: 16px
  background: linear-gradient(135deg, rgba(0, 102, 255, .05), rgba(100, 59, 255, .07))
  strong
    color: var(--brand-navy)
    font-size: 1.05rem
  p
    max-width: 470px
    margin: 0
    color: var(--text-secondary)

.voice-waves
  display: flex
  height: 32px
  align-items: center
  gap: 4px
  span
    width: 4px
    height: 10px
    border-radius: 4px
    background: var(--voice-cyan)
    animation: voice-wave 1s ease-in-out infinite
    &:nth-child(2), &:nth-child(4)
      animation-delay: .15s
    &:nth-child(3)
      animation-delay: .3s

.voice-confirmation
  margin-top: 1rem
  padding: 1rem
  border: 1px solid var(--color-border)
  border-radius: 16px
  h3
    margin: 0 0 .85rem
    color: var(--brand-navy)
    font-size: 1rem
    font-weight: 800
  dl
    display: grid
    gap: .65rem
    margin: 0
  dl > div
    display: grid
    grid-template-columns: 110px 1fr
    gap: .75rem
  dt
    color: var(--text-secondary)
    font-weight: 600
  dd
    margin: 0
    color: var(--brand-navy)
    font-weight: 700

.voice-privacy
  display: flex
  align-items: center
  gap: .5rem
  margin-top: 1rem
  color: var(--text-secondary)
  font-size: .8rem
  i
    color: var(--color-success)

.voice-panel-footer
  display: flex
  flex-wrap: wrap
  justify-content: flex-end
  gap: .6rem
  padding: 1rem 1.25rem
  border-top: 1px solid var(--color-border)
  background: #f8faff
  flex-shrink: 0

@keyframes voice-pulse
  0%, 100%
    box-shadow: 0 0 0 0 rgba(0, 212, 255, .25)
  50%
    box-shadow: 0 0 0 10px rgba(0, 212, 255, 0)

@keyframes voice-wave
  0%, 100%
    height: 8px
  50%
    height: 28px

@media (prefers-reduced-motion: reduce)
  .voice-orb.active, .voice-waves span
    animation: none

@media (max-width: 575px)
  .voice-panel
    top: auto
    bottom: 0
    width: 100%
    max-height: calc(100dvh - .5rem)
    transform: translateX(-50%)
    border-radius: 20px 20px 0 0
  .voice-panel-header
    padding: .85rem 1rem
  .voice-panel-body
    padding: 1rem
  .voice-panel-footer
    padding: .85rem 1rem calc(.85rem + env(safe-area-inset-bottom))
  .voice-confirmation dl > div
    grid-template-columns: 1fr
    gap: .15rem
  .voice-panel-footer .btn
    flex: 1 1 auto
</style>
