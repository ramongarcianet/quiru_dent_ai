<script setup>
import { findingSummary } from '../../domain/nts188/NTS188RulesEngine'
defineProps({ findings: { type: Array, default: () => [] } })
</script>

<template lang="pug">
.findings-panel
  .d-flex.justify-content-between.align-items-center.mb-3
    h2.mb-0 Hallazgos de la sesión
    span.badge.bg-light.text-dark {{ findings.length }}
  .empty(v-if="!findings.length") Aún no hay hallazgos en esta sesión.
  ol.finding-list(v-else)
    li(v-for="finding in findings" :key="finding.id")
      .finding-copy
        strong {{ findingSummary(finding) }}
        small {{ finding.description }} · {{ finding.normativeRuleId }}
      span.status(:class="finding.status.toLowerCase()") {{ finding.historical ? 'REGISTRADO' : finding.status }}
</template>

<style lang="sass" scoped>
.findings-panel
  padding: 1rem 1.15rem
  border: 1px solid #dbe6f5
  border-radius: 16px
  background: white
  h2
    color: #102a56
    font-size: 1rem
.finding-list
  display: grid
  margin: 0
  padding-left: 1.25rem
  gap: .6rem
  li
    padding-left: .35rem
.finding-copy
  display: inline-flex
  flex-direction: column
  small
    color: #66758a
.status
  float: right
  padding: .15rem .5rem
  border-radius: 999px
  font-size: .65rem
  font-weight: 800
  &.pending, &.confirmed
    color: #6d28d9
    background: #f1e9ff
  &.persisted
    color: #166534
    background: #dcfce7
.empty
  color: #6b7890
</style>
