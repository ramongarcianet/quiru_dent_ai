<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { item, guardar, actualizar, leer }  from '../../store/admision.js'
import {progressFile, setFile, borrarFile } from '../../store/storage.js';
import InputFile from "../../components/FileInput.vue";

const route = useRoute()
const { back } = useRouter()
const idPaciente = String(route.params.idPaciente || '')
const cargando = ref(true)
const errorCarga = ref('')
const guardarOActualizar = async () => {
  mensaje.value = ''
  hayError.value = false

  try {
    const datos = { ...item.value }
    const archivosGuardados = Array.isArray(datos.archivos) ? [...datos.archivos] : []

    for (const [key, value] of Object.entries(datos)) {
      if (typeof FileList !== 'undefined' && value instanceof FileList) {
        for (const archivo of Array.from(value)) {
          archivosGuardados.push(await setFile(archivo, idPaciente))
        }
        delete datos[key]
        delete item.value[key]
      }
    }

    datos.archivos = archivosGuardados
    item.value.archivos = archivosGuardados

    const resultado = datos.id
      ? await actualizar(datos)
      : await guardar(datos, idPaciente)

    progressFile.value = 0
    return resultado
  } catch (error) {
    hayError.value = true
    mensaje.value = 'No se pudo guardar la admisión. Intenta nuevamente.'
    throw error
  }
}
const eliminarDelDocumento = (file, i) => {
  item.value.archivos.splice(i, 1)
  borrarFile(file)
  actualizar(item.value)
}
const mensaje = ref('')
const hayError = ref(false)

onMounted(async () => {
  if (!idPaciente) {
    errorCarga.value = 'No se recibió el identificador del paciente.'
    cargando.value = false
    return
  }
  try {
    await leer(idPaciente)
  } catch (error) {
    console.error('No se pudo cargar la admisión:', error)
    errorCarga.value = 'No se pudieron cargar los datos de admisión. Intenta nuevamente.'
  } finally {
    cargando.value = false
  }
})
</script>

<template lang="pug">

.admission-state(v-if='cargando')
  .spinner-border.text-primary(role='status' aria-hidden='true')
  span Cargando datos de admisión…
.admission-state.error(v-else-if='errorCarga' role='alert')
  i.bi.bi-exclamation-triangle
  span {{ errorCarga }}
template(v-else)
 Form.admission-form(:onPromise='guardarOActualizar' :onSuccess='() => back()')
  .row
    .col-md-6
      .col.mb-1
        h2.form-section-title Datos generales del paciente
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Ocupación :
        input.form-control(placeholder="", v-model="item.ocupacion")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Procedencia :
        input.form-control(placeholder="", v-model="item.procedencia")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Número de emergencia :
        input.form-control(placeholder="", v-model="item.numeroEmergencia")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Viajes de los últimos años :
        input.form-control(placeholder="", v-model="item.viajesUltimos")
      .col.mb-1
        h2.form-section-title Antecedentes
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Familiares :
        input.form-control(placeholder="", v-model="item.antecedentesFam")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Personales :
        input.form-control(placeholder="", v-model="item.antecedentesPer")
      .col.mb-1
        h2.form-section-title Signos vitales
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Temperatura :     
        input.form-control(placeholder="", v-model="item.temperatura" maxlength="2")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Pulso :
        input.form-control(placeholder="", v-model="item.pulso" maxlength="3")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") P.A :
        input.form-control(placeholder="", v-model="item.pa" maxlength="3")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") F.C :
        input.form-control(placeholder="", v-model="item.fc" maxlength="3")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") F.R :
        input.form-control(placeholder="", v-model="item.fResp" maxlength="2")
    .col-md-6
      .col.mb-1
        h2.form-section-title Datos de la consulta
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Motivo :
        input.form-control(placeholder="", v-model="item.motivoConsulta")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Enfermedad actual :
        input.form-control(placeholder="", v-model="item.enfermedadActual")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Tiempo de enfermedad :
        input.form-control(placeholder="", v-model="item.tiempoEnfermedad")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Signos y síntomas principales :
        input.form-control(placeholder="", v-model="item.signosYSintomas")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Relato cronológico :
        input.form-control(placeholder="", v-model="item.relatoCronologico")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Funciones biológicas :
        input.form-control(placeholder="", v-model="item.funcionesBio")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Examen clínico general :
        input.form-control(placeholder="", v-model="item.examClinicoGeneral")
      .col.mb-1
        span(style="padding: .01rem .01rem .01rem .6rem;") Examen odontoestomatológico
        input.form-control(placeholder="", v-model="item.examClinicoOdonto")
    .row.mt-2
      InputFile(v-model='item.files')
      .progress( v-if='progressFile')
        .progress-bar(role="progressbar" :style="`width: ${progressFile}%;`" ) {{progressFile.toFixed(0)}} %
    .row.mt-2
      #mensaje.alert.alert-dismissible( v-if='mensaje' :class='hayError? "alert-danger" : "alert-success" ' ) {{mensaje}}
    .col-12.col-md-4.mx-auto.mt-3.mb-5
      button.save-admission.btn.btn-primary(type='submit')
        span
          strong Guardar admisión
          small Conserva los datos clínicos ingresados
        i.bi.bi-floppy
 .attachments-card
  .attachments-header
    div
      h2 Archivos adjuntos
      p.mb-0 Documentos asociados a esta admisión
  .attachments-body
    table.table.table-hover
      thead(style="border-radius: 30px; background-color:var(--color-light) !important;")
        tr
          th Adjuntos
          th Tipo
          th
      tbody(style="cursor: pointer;")
        tr( v-for='file, i of item.archivos' :key='`item-${i}`')
          StorageItem( :storageRef='file')
          td.ms-3
            BotonSeguro( :onSuccess= '() => eliminarDelDocumento(file, i)' )
              i.bi.bi-trash
</template>

<style scoped>
.admission-state {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  color: var(--text-secondary);
  background: #fff;
  font-weight: 700;
}

.admission-state.error {
  color: #a13b48;
  background: #fff8f8;
}

.admission-form,
.attachments-card {
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: #fff;
}

.admission-form {
  padding: 1.25rem;
}

.admission-form > .row {
  row-gap: 1rem;
}

.admission-form > .row > .col-md-6 {
  padding: 0 1rem;
}

.form-section-title {
  margin: 1rem 0 .75rem;
  padding-bottom: .55rem;
  border-bottom: 1px solid #e5ebf4;
  color: var(--brand-navy);
  font-size: 1rem;
  font-weight: 800;
}

.form-section-title:first-child {
  margin-top: 0;
}

.admission-form .col.mb-1 > span {
  display: block;
  margin-bottom: .3rem;
  padding: 0 !important;
  color: #526179;
  font-size: .78rem;
  font-weight: 700;
}

.admission-form .form-control {
  min-height: 42px;
  border-color: #d7e0ec;
  border-radius: 10px;
}

.admission-form .form-control:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 .2rem rgba(0, 102, 255, .1);
}

.save-admission {
  display: flex;
  width: 100%;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .75rem 1rem;
  border-radius: 14px;
  text-align: left;
}

.save-admission span {
  display: grid;
  gap: .05rem;
}

.save-admission small {
  color: rgba(255, 255, 255, .8);
}

.save-admission i {
  color: #fff;
  font-size: 1.3rem;
}

.attachments-card {
  overflow: hidden;
  margin: 1rem 0 3rem;
}

.attachments-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: #f8faff;
}

.attachments-header h2 {
  margin: 0 0 .15rem;
  color: var(--brand-navy);
  font-size: 1rem;
  font-weight: 800;
}

.attachments-header p {
  color: var(--text-secondary);
  font-size: .8rem;
}

.attachments-body {
  padding: .75rem 1rem;
}

.attachments-body .table {
  margin: 0;
}

@media (max-width: 767px) {
  .admission-form {
    padding: 1rem;
  }

  .admission-form > .row > .col-md-6 {
    padding: 0;
  }
}
</style>

