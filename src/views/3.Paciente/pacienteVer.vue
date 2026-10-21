<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { item, leer, updateEstado } from '../../store/paciente'
import { registroodonto, obtenerTodos as obtenerOdontograma } from '../../store/formodontograma'
import { printHistoriaClinicaPaciente, printHistoriaMedicaPaciente } from '../../store/historiaClinica'

const route = useRoute()
const { back, push } = useRouter()
const patientId = computed(() => String(route.params.idPaciente || ''))
const mostrarConsentimientos = ref(false)
let itemSeleccionado = {}
let detenerOdontogramas

const consentimientos = [
  ['Apicectomía corregida', 'Apicectomía-corregida.pdf'],
  ['Caninos retenidos', 'Caninos-Retenidos.pdf'],
  ['Cirugía tercera molar', 'Cirugía-3era-molar.pdf'],
  ['Cirugía apical', 'Cirugía-Apical.pdf'],
  ['Cirugía bucal menor', 'Cirugía-Bucal-Menor.pdf'],
  ['Cirugía ortognática', 'Cirugía-Ortognática.pdf'],
  ['Endodoncia', 'ENDODONCIA.pdf'],
  ['Exodoncia simple', 'Exodoncia-Simple.pdf'],
  ['Implantes', 'Implantes.pdf'],
  ['Obturaciones', 'Operatoria.pdf'],
  ['Ortodoncia', 'Ortodoncia.pdf'],
  ['Periodoncia', 'Periodoncia.pdf'],
  ['Prótesis fija', 'Prótesis-Fija.pdf'],
  ['Tercer molar', 'Tercer-Molar.pdf'],
  ['Rehabilitación oral', 'Tratamiento-General.pdf']
].map(([nombre, archivo]) => ({
  nombre,
  url: new URL(`../../assets/Concentimientos/${archivo}`, import.meta.url).href
}))

const nombreCompleto = computed(() => [
  item.value?.nombre,
  item.value?.apellidoPaterno,
  item.value?.apellidoMaterno
].filter(Boolean).join(' ') || 'Paciente sin nombre')

const documento = computed(() => {
  const tipo = item.value?.tipoDocumento || 'Documento'
  return item.value?.numeroDocumento ? `${tipo} ${item.value.numeroDocumento}` : 'No registrado'
})

const consentimiento = computed(() => {
  if (item.value?.constancia === 'S') return 'Sí'
  if (item.value?.constancia === 'N') return 'No'
  return 'No registrado'
})

onMounted(async () => {
  if (!patientId.value) return
  detenerOdontogramas = obtenerOdontograma(patientId.value)
  await leer(patientId.value)
})

onUnmounted(() => {
  if (typeof detenerOdontogramas === 'function') detenerOdontogramas()
})

function CallConfirm() {
  itemSeleccionado = { ...(item.value || {}), id: patientId.value }
  document.getElementById('id01').style.display = 'block'
}

function EliminarPaciente() {
  const alerta = document.getElementById('alerta')
  const modal = document.getElementById('id01')
  if (registroodonto.value.length > 0) {
    alerta.style.display = 'block'
    modal.style.display = 'none'
    return
  }
  alerta.style.display = 'none'
  modal.style.display = 'none'
  updateEstado(itemSeleccionado).then(() => back())
}

function Cancelar() {
  document.getElementById('alerta').style.display = 'none'
  document.getElementById('id01').style.display = 'none'
}

</script>

<template lang="pug">
Teleport(to='body')
  .consent-overlay(v-if='mostrarConsentimientos' role='presentation' @click.self='mostrarConsentimientos = false')
    section.consent-dialog(role='dialog' aria-modal='true' aria-labelledby='consent-title')
      header.consent-header
        div
          span.eyebrow Documentos clínicos
          h2#consent-title Consentimientos informados
        button.btn-close(type='button' aria-label='Cerrar' @click='mostrarConsentimientos = false')
      .consent-list
        a.consent-link(v-for='consentimientoItem of consentimientos' :key='consentimientoItem.url' :href='consentimientoItem.url' target='_blank' rel='noopener noreferrer')
          i.bi.bi-file-earmark-pdf
          span {{ consentimientoItem.nombre }}
          i.bi.bi-box-arrow-up-right

.patient-page
  #id01.modal(style='display:none')
    .modal-content.modal-sm
      .container
        p.modal-title Eliminar paciente
        p ¿Está seguro de que desea eliminar este paciente?
        .clearfix
          button.btn.btn-secondary.cancelbtn(type='button' @click='Cancelar') Cancelar
          button.btn.btn-danger.deletebtn(type='button' @click='EliminarPaciente') Aceptar

  header.page-header
    div
      span.eyebrow Pacientes
      h1 Información del paciente
      p.mb-0 Consulta sus datos generales y accede a las acciones clínicas.
    button.btn.btn-outline-secondary(type='button' @click="push({ name: 'pacientes' })")
      i.bi.bi-arrow-left.me-2
      | Pacientes

  #alerta.alert.alert-danger.alert-dismissible(style='display:none' role='alert')
    strong Cuidado.
    |  Este paciente no se puede eliminar porque tiene un diagnóstico o tratamiento registrado.
    button.btn-close(type='button' aria-label='Cerrar' @click='Cancelar')

  section.patient-card
    .patient-identity
      .patient-avatar(aria-hidden='true')
        i.bi.bi-person-fill
      div
        span.patient-label Paciente
        h2 {{ nombreCompleto }}
        span.document-badge {{ documento }}

    .details-grid
      .detail-item
        i.bi.bi-person-vcard
        div
          span Nombres y apellidos
          strong {{ nombreCompleto }}
      .detail-item
        i.bi.bi-credit-card-2-front
        div
          span Documento de identidad
          strong {{ documento }}
      .detail-item
        i.bi.bi-phone
        div
          span Celular
          strong {{ item?.telefono || 'No registrado' }}
      .detail-item
        i.bi.bi-envelope
        div
          span Correo
          strong {{ item?.email || 'No registrado' }}
      .detail-item
        i.bi.bi-file-earmark-check
        div
          span Consentimiento informado
          strong(:class="{ 'text-success': consentimiento === 'Sí', 'text-muted': consentimiento !== 'Sí' }") {{ consentimiento }}

  section.actions-card
    .section-heading
      div
        span.eyebrow Gestión del paciente
        h2 Acciones
      small Selecciona la acción que deseas realizar

    .action-grid
      button.action-button(type='button' @click="push({ name: 'Admision', params: { idPaciente: patientId } })")
        i.bi.bi-file-earmark-plus
        span Admisión
      button.action-button(type='button' @click="push({ name: 'atencion-ai', params: { idPaciente: patientId } })")
        i.bi.bi-clock-history
        span Historial de atenciones
      button.action-button(type='button' @click='printHistoriaClinicaPaciente(patientId)')
        i.bi.bi-printer
        span Imprimir historia clínica
      button.action-button(type='button' @click='printHistoriaMedicaPaciente(patientId)')
        i.bi.bi-file-medical
        span Imprimir historia médica general
      button.action-button(type='button' @click="push({ name: 'paciente', params: { idPaciente: patientId } })")
        i.bi.bi-pencil-square
        span Editar paciente
      button.action-button(type='button' @click='mostrarConsentimientos = true')
        i.bi.bi-file-earmark-pdf
        span Consentimientos informados
      button.action-button.delete-action(type='button' @click='CallConfirm')
        i.bi.bi-trash
        span Eliminar paciente

</template>
<style scoped>
.consent-overlay {
  position: fixed;
  z-index: 5000;
  inset: 0;
  display: grid;
  overflow-y: auto;
  place-items: center;
  padding: 1rem;
  background: rgba(7, 27, 64, .72);
  backdrop-filter: blur(3px);
}

.consent-dialog {
  width: min(760px, 100%);
  max-height: min(780px, calc(100vh - 2rem));
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(7, 27, 64, .3);
}

.consent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: #f8faff;
}

.consent-header h2 {
  margin: .15rem 0 0;
  color: var(--brand-navy);
  font-size: 1.25rem;
  font-weight: 800;
}

.consent-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .65rem;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  padding: 1.25rem;
}

.consent-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: .65rem;
  min-height: 52px;
  padding: .75rem .85rem;
  border: 1px solid #dce6f3;
  border-radius: 12px;
  color: var(--brand-navy);
  background: #f9fbff;
  font-weight: 700;
  text-decoration: none;
}

.consent-link:hover,
.consent-link:focus-visible {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.consent-link .bi-file-earmark-pdf {
  color: #b54755;
  font-size: 1.2rem;
}

.consent-link .bi-box-arrow-up-right {
  color: var(--text-secondary);
  font-size: .85rem;
}

.patient-page {
  display: grid;
  gap: 1rem;
  padding: 1.25rem 0 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1,
.section-heading h2,
.patient-identity h2 {
  margin: 0;
  color: var(--brand-navy);
  font-weight: 800;
}

.page-header h1 {
  font-size: clamp(1.45rem, 3vw, 2rem);
}

.page-header p,
.section-heading small {
  color: var(--text-secondary);
}

.eyebrow,
.patient-label {
  color: var(--color-primary);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.patient-card,
.actions-card {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: #fff;
}

.patient-identity {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(0, 140, 255, .07), rgba(100, 59, 255, .07));
}

.patient-avatar {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  place-items: center;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), #643bff);
  font-size: 1.55rem;
}

.patient-identity h2 {
  margin: .15rem 0 .35rem;
  font-size: 1.35rem;
}

.document-badge {
  display: inline-flex;
  padding: .25rem .65rem;
  border-radius: 999px;
  color: #32537d;
  background: #edf4ff;
  font-size: .78rem;
  font-weight: 700;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: .4rem 1.25rem 1.25rem;
}

.detail-item {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: .75rem;
  padding: 1rem .75rem;
  border-bottom: 1px solid #edf1f7;
}

.detail-item i {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.detail-item div {
  display: grid;
  min-width: 0;
  gap: .2rem;
}

.detail-item span {
  color: var(--text-secondary);
  font-size: .76rem;
  font-weight: 650;
}

.detail-item strong {
  overflow-wrap: anywhere;
  color: var(--brand-navy);
  font-size: .94rem;
}

.actions-card {
  padding: 1.25rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: .7rem;
}

.action-button {
  display: flex;
  min-height: 94px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: .7rem;
  padding: .9rem;
  border: 1px solid #d9e4f2;
  border-radius: 14px;
  color: var(--brand-navy);
  background: #f9fbff;
  font-weight: 750;
  text-align: left;
  transition: border-color .18s ease, transform .18s ease, box-shadow .18s ease;
}

.action-button:hover,
.action-button:focus-visible {
  transform: translateY(-2px);
  border-color: var(--color-primary);
  box-shadow: 0 8px 20px rgba(20, 64, 120, .1);
}

.action-button i {
  color: var(--color-primary);
  font-size: 1.35rem;
}

.action-button.delete-action {
  color: var(--brand-navy);
  background: #fff;
}

.action-button.delete-action i {
  color: #b54755;
}

.action-button.delete-action:hover,
.action-button.delete-action:focus-visible {
  border-color: #dba9af;
  background: #fffafa;
}

#id01 {
  z-index: 2050;
  background-color: rgba(7, 27, 64, .62);
}

.modal {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding-top: 50px;
  opacity: 1;
}

.modal-content {
  width: min(90%, 430px);
  margin: 5% auto 15%;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background-color: #fff;
}

.container {
  padding: 1.25rem;
  text-align: center;
}

.modal-title {
  color: var(--brand-navy);
  font-size: 1.15rem;
  font-weight: 800;
}

.cancelbtn,
.deletebtn {
  width: 50%;
}

.clearfix {
  display: flex;
  gap: .5rem;
}

@media (max-width: 991px) {
  .details-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .consent-list {
    grid-template-columns: 1fr;
  }

  .patient-page {
    padding-top: .75rem;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-header .btn {
    width: 100%;
  }

  .page-header p,
  .section-heading small {
    display: none;
  }

  .patient-identity {
    align-items: flex-start;
  }

  .details-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .details-grid {
    padding-inline: .75rem;
  }

  .action-button {
    min-height: 0;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
  }

  .actions-card {
    padding: 1rem;
  }
}
</style>
