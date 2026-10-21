<script setup>
import { useRoute, useRouter } from 'vue-router'
import Formulario from './Formulario.vue'

const route = useRoute()
const router = useRouter()
const patientId = String(route.params.idPaciente || '')

function volverAlPaciente() {
  if (patientId) {
    router.push({ name: 'pacienteVer', params: { idPaciente: patientId } })
    return
  }
  router.push({ name: 'pacientes' })
}
</script>

<template lang="pug">
.admission-page
  .clinical-header-copy
    span.eyebrow Historia clínica
    h1 Admisión del paciente
    p.mb-0 Registra antecedentes, signos vitales y datos de la consulta.
  .clinical-header-actions
    button.btn.btn-outline-secondary(type='button' @click='volverAlPaciente')
      i.bi.bi-arrow-left.me-2
      | Paciente
  .admission-content
    Formulario

</template>

<style scoped>
.admission-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  padding: 1rem 0 2rem;
}

.clinical-header-copy,
.clinical-header-actions {
  border: 1px solid var(--color-border);
  background: #fff;
}

.clinical-header-copy {
  padding: 1rem 1.25rem;
  border-radius: 18px 0 0 18px;
}

.clinical-header-copy h1 {
  margin: .15rem 0;
  color: var(--brand-navy);
  font-size: 1.55rem;
  font-weight: 800;
}

.clinical-header-copy p {
  color: var(--text-secondary);
}

.eyebrow {
  color: var(--color-primary);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.clinical-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .6rem;
  padding: 1rem 1.25rem;
  border-left: 0;
  border-radius: 0 18px 18px 0;
}

.admission-content {
  min-width: 0;
  grid-column: 1 / -1;
}

.modal-content {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 18px;
}

.modal-header {
  border-color: var(--color-border);
  background: #f8faff;
}

.modal-header h2 {
  margin: 0;
  color: var(--brand-navy);
  font-size: 1.2rem;
  font-weight: 800;
}

.modal-body .row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .65rem;
  margin: 0;
}

.modal-body a {
  display: flex;
  min-height: 46px;
  align-items: center;
  padding: .7rem .85rem;
  border: 1px solid #dce6f3;
  border-radius: 12px;
  color: var(--brand-navy);
  background: #f9fbff;
  font-weight: 650;
  text-decoration: none;
}

.modal-body a:hover,
.modal-body a:focus-visible {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (max-width: 850px) {
  .admission-page {
    grid-template-columns: 1fr;
  }

  .clinical-header-copy,
  .clinical-header-actions {
    border: 1px solid var(--color-border);
    border-radius: 18px;
  }

  .clinical-header-actions,
  .clinical-header-actions .btn {
    width: 100%;
  }

  .clinical-header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .modal-body .row {
    grid-template-columns: 1fr;
  }
}
</style>
