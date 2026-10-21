<script setup>
import { computed } from 'vue'
import { NTS188_SYMBOLS } from '../../domain/nts188/NTS188SymbolCatalog'
import Nts188Tooth from './Nts188Tooth.vue'

const props = defineProps({
  findings: { type: Array, default: () => [] },
  selectedTooth: { type: Number, default: null }
})

const emit = defineEmits(['select-tooth'])

const arches = Object.freeze([
  { id: 'permanent-upper', label: 'Dentición permanente superior', upper: true, teeth: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28] },
  { id: 'deciduous-upper', label: 'Dentición decidua superior', upper: true, teeth: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65] },
  { id: 'deciduous-lower', label: 'Dentición decidua inferior', upper: false, teeth: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75] },
  { id: 'permanent-lower', label: 'Dentición permanente inferior', upper: false, teeth: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38] }
])

const byTooth = computed(() => props.findings.reduce((result, finding) => {
  const teeth = Array.isArray(finding.teeth) ? finding.teeth : [finding.tooth]
  teeth.filter(Boolean).forEach(tooth => (result[tooth] ||= []).push(finding))
  return result
}, {}))

const representedRules = computed(() => new Set(props.findings
  .map(item => Number(String(item.normativeRuleId || '').split('.').pop()))
  .filter(Boolean)))
</script>

<template>
  <section class="nts-odontogram" aria-label="Odontograma según NTS 188-MINSA/DGIESP-2022">
    <header class="normative-header">
      <div>
        <span class="standard">NTS N.° 188-MINSA/DGIESP-2022</span>
        <strong>Gráfico del odontograma</strong>
      </div>
      <div class="color-key" aria-label="Convención de colores">
        <span><i class="blue" /> Buen estado o condición no patológica</span>
        <span><i class="red" /> Mal estado o condición patológica</span>
        <span><i class="violet" /> Pendiente de confirmación</span>
      </div>
    </header>

    <div class="chart-scroll">
      <div class="chart-sheet">
        <div
          v-for="(arch, archIndex) in arches"
          :key="arch.id"
          class="arch-block"
          :class="{ 'dentition-separator': archIndex === 2, deciduous: arch.teeth.length === 10 }"
        >
          <span class="arch-label">{{ arch.label }}</span>
          <div class="arch-row" :style="{ '--tooth-count': arch.teeth.length }">
            <Nts188Tooth
              v-for="(tooth, index) in arch.teeth"
              :key="tooth"
              :class="{ 'quadrant-start': index === arch.teeth.length / 2 }"
              :tooth="tooth"
              :upper="arch.upper"
              :findings="byTooth[tooth] || []"
              :selected="selectedTooth === tooth"
              @select="emit('select-tooth', $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <details class="symbol-catalog">
      <summary>
        <span>Simbología normativa completa</span>
        <small>38 convenciones gráficas</small>
      </summary>
      <ol>
        <li
          v-for="symbol in NTS188_SYMBOLS"
          :key="symbol.number"
          :class="{ represented: representedRules.has(symbol.number) }"
        >
          <span class="rule-number">6.1.{{ symbol.number }}</span>
          <span>{{ symbol.label }}</span>
          <small v-if="symbol.codes?.length">{{ symbol.codes.join(' · ') }}</small>
        </li>
      </ol>
    </details>
  </section>
</template>

<style lang="sass" scoped>
.nts-odontogram
  overflow: hidden
  border: 1px solid #cbd7e6
  border-radius: 18px
  background: #fff
  box-shadow: 0 12px 30px rgba(34, 61, 92, .06)
.normative-header
  display: flex
  align-items: center
  justify-content: space-between
  gap: 1rem
  padding: .9rem 1.1rem
  border-bottom: 1px solid #dbe5f0
  background: linear-gradient(135deg, #f7fbff, #eef5fb)
  > div:first-child
    display: grid
    gap: .12rem
  strong
    color: #17365f
    font-size: 1rem
    text-transform: uppercase
.standard
  color: #19768e
  font-size: .67rem
  font-weight: 800
  letter-spacing: .08em
.color-key
  display: flex
  flex-wrap: wrap
  justify-content: flex-end
  gap: .75rem
  color: #53657b
  font-size: .69rem
  span
    display: inline-flex
    align-items: center
    gap: .28rem
  i
    width: 9px
    height: 9px
    border-radius: 50%
  .blue
    background: #1756a9
  .red
    background: #d8262f
  .violet
    background: #7c3aed
.chart-scroll
  max-width: 100%
  overflow-x: hidden
  padding: 1.25rem .9rem
.chart-sheet
  width: 100%
  min-width: 0
.arch-block
  display: grid
  width: 100%
  min-width: 0
  justify-content: center
  margin: 0 auto .85rem
  &.deciduous
    margin-bottom: .45rem
  &.dentition-separator
    margin-top: .9rem
    padding-top: .9rem
    border-top: 2px solid #d5e0eb
.arch-label
  margin-bottom: .25rem
  color: #65758a
  font-size: .62rem
  font-weight: 700
  letter-spacing: .04em
  text-align: center
  text-transform: uppercase
.arch-row
  display: grid
  grid-template-columns: repeat(var(--tooth-count), minmax(0, 64px))
  justify-content: center
  width: 100%
  min-width: 0
  gap: 1px
  :deep(.quadrant-start)
    position: relative
    &::before
      position: absolute
      top: 0
      bottom: 0
      left: -1px
      width: 1px
      background: #9dabb9
      content: ''
.symbol-catalog
  border-top: 1px solid #dbe5f0
  summary
    display: flex
    align-items: center
    justify-content: space-between
    padding: .8rem 1.1rem
    color: #274767
    cursor: pointer
    font-weight: 700
    small
      color: #74859a
      font-weight: 500
  ol
    display: grid
    grid-template-columns: repeat(3, minmax(0, 1fr))
    gap: 0
    max-height: 360px
    margin: 0
    padding: 0 1rem 1rem
    overflow: auto
    list-style: none
  li
    display: grid
    grid-template-columns: auto 1fr
    gap: .1rem .45rem
    padding: .55rem
    border: 1px solid #e1e8f0
    color: #40546c
    font-size: .72rem
    &.represented
      border-color: #aac5e9
      background: #f0f6ff
    small
      grid-column: 2
      color: #65758a
.rule-number
  color: #1756a9
  font-weight: 800
@media (max-width: 980px)
  .normative-header
    align-items: flex-start
    flex-direction: column
  .color-key
    justify-content: flex-start
  .symbol-catalog ol
    grid-template-columns: repeat(2, minmax(0, 1fr))
@media (max-width: 600px)
  .chart-scroll
    padding: .8rem .25rem
  .arch-row
    gap: 0
  .symbol-catalog ol
    grid-template-columns: 1fr
</style>
