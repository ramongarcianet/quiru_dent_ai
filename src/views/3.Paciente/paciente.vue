<script setup>
import { onMounted, onUnmounted, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { item, guardar, actualizar, limpiar, leer, revisarDNI, registro, obtenerTodos } from "../../store/paciente";
import { esLetra, esNumero } from '../../config/libreria'
const maxDocumento = ref(8);
const detenerPacientes = obtenerTodos();
const guardarOActualizar = () => {
  var alerta = document.getElementById("alerta");
  alerta.style.display = "none"
  const index = registro.value?.findIndex(i => i.numeroDocumento == item.value.numeroDocumento)
  if (index < 0) {
    return guardar(item.value)
  }
  else {
    if (item.value.id) {
      return actualizar(item.value)
    }
    else {
      alerta.innerHTML = "El N° de DNI ya existe para otro paciente";
      alerta.style.display = "block"
    }
  }
}
const route = useRoute()
const { back, push } = useRouter()
if (!route.params.idPaciente) {
  limpiar()
}
onUnmounted(() => {
  if (typeof detenerPacientes === 'function') detenerPacientes();
})
onMounted(async () => {
  if (route.params.idPaciente) await leer(route.params.idPaciente)
  incompleto();
})
function definirMaxLimit(tipoDocumento) {
  item.value.numeroDocumento = '';
  if (tipoDocumento == 'DNI') {
    maxDocumento.value = 8;
  } else {
    maxDocumento.value = 9;
  }
}
watch(
  () => item.value,
  () => {
    incompleto();
  }
);
function incompleto() {
  var conErrores = '';
  conErrores = conErrores + ((item.value.numeroDocumento?.length < 8) ? ' Número de documento incompleto,' : '');
  conErrores = conErrores + ((item.value.telefono?.length < 9) ? ' el número telefónico debe ser de al menos 9 dígitos,' : '');
  var alerta = document.getElementById("alerta");
  if (alerta != null) {
    if (conErrores.length > 0) {
      alerta.innerHTML = "Te falta completar datos de: " + conErrores + "";
      alerta.style.display = "block"
      btguardar.disabled = true;
    }
    else {
      alerta.innerHTML = "";
      alerta.style.display = "none"
      btguardar.disabled = false;
    }
  }
  return conErrores;
}

</script>

<template lang="pug">
header.patient-form-header
  div
    span.eyebrow Pacientes
    h1 {{ route.params.idPaciente ? 'Editar paciente' : 'Nuevo paciente' }}
    p.mb-0 {{ route.params.idPaciente ? 'Actualiza la información personal y médica registrada.' : 'Registra la información general y médica del paciente.' }}
  button.btn.btn-outline-secondary(
    type='button'
    @click="route.params.idPaciente ? push({ name: 'pacienteVer', params: { idPaciente: route.params.idPaciente } }) : push({ name: 'pacientes' })"
  )
    i.bi.bi-arrow-left.me-2
    | {{ route.params.idPaciente ? 'Paciente' : 'Pacientes' }}
Form.patient-form-card(:onPromise='() => guardarOActualizar()' :onSuccess='() => back()' :onError='incompleto()')
  .row
    .col-md-6 
      label.form-label Nombres y Apellidos*     
      .input-group.mb-12
        input.form-control(placeholder="Nombre" v-model.trim="item.nombre" @keypress="esLetra($event)" required maxlength="30")
        input.form-control(placeholder="Apellido paterno" v-model.trim="item.apellidoPaterno" type="text" required maxlength="30")
        input.form-control(placeholder="Apellido materno" v-model.trim="item.apellidoMaterno" type="text" required maxlength="30")

      label.form-label Documento de identidad*
      .input-group.mb-12        
        select.form-select( v-model="item.tipoDocumento" v-on:change="definirMaxLimit(item.tipoDocumento)")
          option(value="DNI") DNI
          option(value="CE") CARNET DE EXTRANJERIA
        input.form-control(v-if='item.id' readonly v-model="item.numeroDocumento" required :maxlength="maxDocumento" :minlength="maxDocumento")
        input.form-control(v-if='!item.id' placeholder="Número documento" v-model="item.numeroDocumento" @keypress="esNumero($event)" required :maxlength="maxDocumento" :minlength="maxDocumento")
      .row.mb-12
        .col.mb-6
          label.form-label Fecha de nacimiento
          input.form-control(type="date" v-model="item.fechaNacimiento" max="3000-01-01" onfocus="this.max=new Date().toISOString().split('T')[0]")
        .col.mb-6
          label.form-label Sexo
          select.form-select(v-model="item.sexo")
            option(value="") SELECCIONE
            option(value="M") MASCULINO
            option(value="F") FEMENINO
    .col-md-6
      .col.mb-12
        label.form-label Correo
        .input-group.mb-12
          input.form-control(placeholder="Correo Electrónico" v-model="item.email" type="email" maxlength="100")
      .col.mb-12
        label.form-label Celular
        .input-group.mb-12
          input.form-control(type="tel" placeholder="Num. celular" v-model="item.telefono" @keypress="esNumero($event)" minlength="9" maxlength="12")
      .col.mb-12
        label.form-label Consentimiento informado
        .input-group.mb-12
          select.form-select( v-model="item.constancia")
            option(value="S") SI
            option(value="N") NO
  .col.md-12
    label.form-label Dirección
    .input-group
      input.form-control(placeholder="Departamento" v-model="item.departamento" type="text" maxlength="30")
      input.form-control(placeholder="Dirección" v-model="item.Direccion" maxlength="40")
  .col.md-12
    label.form-label Comentarios
    .input-group
      textarea#floatingTextarea.form-control(placeholder='Deja un comentario aquí')
  .col-12.mt-3
    #accordionExample.accordion
    .accordion-item.border.border-dark.rounded-0
      h2#headingOne.accordion-header
        button.accordion-button.collapsed(type='button' data-bs-toggle='collapse' data-bs-target='#HCGeneral')
          | Historia médica general
      #HCGeneral.accordion-collapse.collapse(data-bs-parent='#accordionExample')
        .accordion-body
          .row
            .col-12.col-md-6
              label.form-label Centro laboral
              .input-group.mb-2
                input.form-control(placeholder="Centro laboral", v-model="item.centroLaboral" maxlength="250")
            .col-12.col-md-6
              label.form-label Ocupación
              .input-group.mb-2
                input.form-control( placeholder="Ocupación", v-model="item.ocupacion" maxlength="25")
            .col-6
              label.form-label.col-12 1. ¿Está en la actualidad bajo tratamiento médico?
              .form-check.form-check-inline
                input#inlineRadio11.form-check-input(type='radio' name='inlineRadioOptions' v-model="item.askHCG1" value='Si')
                label.form-check-label(for='inlineRadio11') Si
              .form-check.form-check-inline
                input#inlineRadio12.form-check-input(type='radio' name='inlineRadioOptions' v-model="item.askHCG1" value='No')
                label.form-check-label(for='inlineRadio12') No
            .col-6
              label.form-label.col-12 2. ¿Tiene reacciones alérgicas o es alérgico a algún farmaco o medicamento?
              .form-check.form-check-inline
                input#inlineRadio21.form-check-input(type='radio' name='inlineRadioOptions2' v-model="item.askHCG2" value='Si')
                label.form-check-label(for='inlineRadio21') Si
              .form-check.form-check-inline
                input#inlineRadio22.form-check-input(type='radio' name='inlineRadioOptions2' v-model="item.askHCG2" value='No')
                label.form-check-label(for='inlineRadio22') No
            .col-6
              label.form-label.col-12 3. ¿Ha presentado alguna vez una reacción a la anestesia dental o general?
              .form-check.form-check-inline
                input#inlineRadio31.form-check-input(type='radio' name='inlineRadioOptions3' v-model="item.askHCG3" value='Si')
                label.form-check-label(for='inlineRadio31') Si
              .form-check.form-check-inline
                input#inlineRadio32.form-check-input(type='radio' name='inlineRadioOptions3' v-model="item.askHCG3" value='No')
                label.form-check-label(for='inlineRadio32') No
            .col-6
              label.form-label.col-12 4. ¿Se le ha intervenido alguna vez?
              .form-check.form-check-inline
                input#inlineRadio41.form-check-input(type='radio' name='inlineRadioOptions4' v-model="item.askHCG4" value='Si')
                label.form-check-label(for='inlineRadio41') Si
              .form-check.form-check-inline
                input#inlineRadio42.form-check-input(type='radio' name='inlineRadioOptions4' v-model="item.askHCG4" value='No')
                label.form-check-label(for='inlineRadio42') No
            .col-6
              label.form-label.col-12 5. ¿Ha estado alguna vez hospitalizado?
              .form-check.form-check-inline
                input#inlineRadio51.form-check-input(type='radio' name='inlineRadioOptions5' v-model="item.askHCG5" value='Si')
                label.form-check-label(for='inlineRadio51') Si
              .form-check.form-check-inline
                input#inlineRadio52.form-check-input(type='radio' name='inlineRadioOptions5' v-model="item.askHCG5" value='No')
                label.form-check-label(for='inlineRadio52') No
            .col-6
              label.form-label.col-12 6. Cuando sube las escaleras o pases ¿ha tenido que pararse por dolor torácico o cansancio?
              .form-check.form-check-inline
                input#inlineRadio61.form-check-input(type='radio' name='inlineRadioOptions6' v-model="item.askHCG6" value='Si')
                label.form-check-label(for='inlineRadio61') Si
              .form-check.form-check-inline
                input#inlineRadio62.form-check-input(type='radio' name='inlineRadioOptions6' v-model="item.askHCG6" value='No')
                label.form-check-label(for='inlineRadio62') No
            .col-6
              label.form-label.col-12 7. ¿Ha perdido o ganado involuntariamente más de 4.5Kg en el último año?
              .form-check.form-check-inline
                input#inlineRadio71.form-check-input(type='radio' name='inlineRadioOptions7' v-model="item.askHCG7" value='Si')
                label.form-check-label(for='inlineRadio71') Si
              .form-check.form-check-inline
                input#inlineRadio72.form-check-input(type='radio' name='inlineRadioOptions7' v-model="item.askHCG7" value='No')
                label.form-check-label(for='inlineRadio72') No
            .col-6
              label.form-label.col-12 8. ¿Esta siguiendo alguna dieta especial?
              .form-check.form-check-inline
                input#inlineRadio81.form-check-input(type='radio' name='inlineRadioOptions8' v-model="item.askHCG8" value='Si')
                label.form-check-label(for='inlineRadio81') Si
              .form-check.form-check-inline
                input#inlineRadio82.form-check-input(type='radio' name='inlineRadioOptions8' v-model="item.askHCG8" value='No')
                label.form-check-label(for='inlineRadio82') No
            .col-6
              label.form-label.col-12 9. ¿Tiene contacto, por su trabajo, con sangre, derivados sanguíneos o agujas?
              .form-check.form-check-inline
                input#inlineRadio91.form-check-input(type='radio' name='inlineRadioOptions9' v-model="item.askHCG9" value='Si')
                label.form-check-label(for='inlineRadio91') Si
              .form-check.form-check-inline
                input#inlineRadio92.form-check-input(type='radio' name='inlineRadioOptions9' v-model="item.askHCG9" value='No')
                label.form-check-label(for='inlineRadio92') No
            .col-6(v-if="item.sexo === 'F'")
              label.form-label.col-12 10. ¿Está embarazada?
              .form-check.form-check-inline
                input#inlineRadio01.form-check-input(type='radio' name='inlineRadioOptions0' v-model="item.askHCG0" value='Si')
                label.form-check-label(for='inlineRadio01') Si
              .form-check.form-check-inline
                input#inlineRadio02.form-check-input(type='radio' name='inlineRadioOptions0' v-model="item.askHCG0" value='No')
                label.form-check-label(for='inlineRadio02') No
          .row
            .col-6
              label.form-label Peso (Kg)  
              input.form-control(placeholder="Peso kg.", v-model="item.peso" @keypress="esNumero($event)" maxlength="4")
            .col-6
              label.form-label Estatura (cm.)
              input.form-control(placeholder="Altura cm.", v-model="item.estatura" @keypress="esNumero($event)" maxlength="5")

  .col-12.col-md-4.mx-auto.mt-3.mb-5
    button#btguardar.save-patient.btn.btn-primary(type='submit' disabled)
      span
        strong(v-if="!item.id") Guardar paciente
        strong(v-if="item.id") Actualizar paciente
        small Revisa los datos antes de continuar
      i.bi.bi-floppy
  .row.mb-5
    #alerta.alert.alert-danger.alert-dismissible(style='display:none')   
      strong Cuidado! te falta completar campos
</template>

<style scoped>
.patient-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: #fff;
}

.patient-form-header h1 {
  margin: .15rem 0;
  color: var(--brand-navy);
  font-size: 1.55rem;
  font-weight: 800;
}

.patient-form-header p {
  color: var(--text-secondary);
}

.eyebrow {
  color: var(--color-primary);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.patient-form-card {
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: #fff;
}

.patient-form-card > .row:first-child {
  row-gap: 1rem;
}

.patient-form-card .form-label {
  margin: .85rem 0 .35rem;
  color: #526179;
  font-size: .78rem;
  font-weight: 750;
}

.patient-form-card .form-control,
.patient-form-card .form-select {
  min-height: 42px;
  border-color: #d7e0ec;
  border-radius: 10px;
}

.patient-form-card textarea.form-control {
  min-height: 96px;
}

.patient-form-card .form-control:focus,
.patient-form-card .form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 .2rem rgba(0, 102, 255, .1);
}

.patient-form-card .accordion-item {
  overflow: hidden;
  border: 1px solid var(--color-border) !important;
  border-radius: 14px !important;
}

.patient-form-card .accordion-button {
  color: var(--brand-navy);
  background: #f8faff;
  font-weight: 800;
}

.patient-form-card .accordion-button:not(.collapsed) {
  color: var(--color-primary);
  background: #f1f6ff;
  box-shadow: inset 0 -1px 0 var(--color-border);
}

.patient-form-card .accordion-body {
  padding: 1.1rem;
}

.patient-form-card .accordion-body .col-6 {
  margin-bottom: .7rem;
}

.save-patient {
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

.save-patient span {
  display: grid;
  gap: .05rem;
}

.save-patient small {
  color: rgba(255, 255, 255, .8);
}

.save-patient i {
  color: #fff;
  font-size: 1.3rem;
}

#alerta {
  margin-top: 1rem;
  border-radius: 12px;
}

@media (max-width: 767px) {
  .patient-form-header {
    align-items: stretch;
    flex-direction: column;
  }

  .patient-form-header .btn {
    width: 100%;
  }

  .patient-form-card {
    padding: 1rem;
  }

  .patient-form-card .input-group {
    gap: .5rem;
  }

  .patient-form-card .input-group > .form-control,
  .patient-form-card .input-group > .form-select {
    width: 100%;
    flex: 1 1 100%;
    border-radius: 10px !important;
  }

  .patient-form-card .accordion-body .col-6 {
    width: 100%;
  }
}
</style>


