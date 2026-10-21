<script setup>
import { computed } from 'vue'
import { nts188FindingColor, nts188SymbolForFinding } from '../../domain/nts188/NTS188SymbolCatalog'

const props = defineProps({
  tooth: { type: Number, required: true },
  upper: { type: Boolean, default: false },
  findings: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

const toothDigit = computed(() => props.tooth % 10)
const toothKind = computed(() => {
  if ([6, 7, 8].includes(toothDigit.value) || ([4, 5].includes(toothDigit.value) && props.tooth >= 50)) return 'molar'
  if ([4, 5].includes(toothDigit.value)) return 'premolar'
  if (toothDigit.value === 3) return 'canine'
  return 'incisor'
})

const rootPath = computed(() => {
  if (props.upper) {
    if (toothKind.value === 'molar') return 'M13 53 L10 10 L25 47 L31 7 L39 47 L53 11 L50 53 Z'
    if (toothKind.value === 'premolar') return 'M16 53 L23 10 L31 45 L40 11 L48 53 Z'
    if (toothKind.value === 'canine') return 'M18 53 L31 5 L46 53 Z'
    return 'M19 53 L28 12 L32 6 L37 13 L45 53 Z'
  }
  if (toothKind.value === 'molar') return 'M13 47 L10 90 L25 53 L31 93 L39 53 L53 89 L50 47 Z'
  if (toothKind.value === 'premolar') return 'M16 47 L23 90 L31 55 L40 89 L48 47 Z'
  if (toothKind.value === 'canine') return 'M18 47 L31 95 L46 47 Z'
  return 'M19 47 L28 88 L32 94 L37 87 L45 47 Z'
})

const crownTop = computed(() => props.upper ? 52 : 14)
const crownBottom = computed(() => props.upper ? 86 : 48)
const crownMid = computed(() => (crownTop.value + crownBottom.value) / 2)
const apicalY = computed(() => props.upper ? 17 : 83)

const codes = computed(() => [...new Set(props.findings.map(item => item.ntsCode || item.code).filter(Boolean))].join(' · '))
const hasPending = computed(() => props.findings.some(item => item.status === 'PENDING' || item.status === 'CONFIRMED'))
const hasPersisted = computed(() => props.findings.some(item => item.status === 'PERSISTED'))

function symbol(item) {
  return nts188SymbolForFinding(item)
}

function color(item) {
  return nts188FindingColor(item, symbol(item))
}

function matchingSurface(item, names) {
  const accepted = Array.isArray(names) ? names : [names]
  return accepted.includes(String(item.surface || '').toUpperCase())
}

function surfaceStyle(names) {
  const items = props.findings.filter(item => ['SURFACE_FILL', 'WORN_SURFACE'].includes(symbol(item)?.renderer) && matchingSurface(item, names))
  const latest = items[items.length - 1]
  return latest ? { fill: color(latest), fillOpacity: latest.status === 'PENDING' ? 0.55 : 0.9 } : null
}

const graphicFindings = computed(() => props.findings.filter(item => {
  const renderer = symbol(item)?.renderer
  return renderer && !['CODE', 'SURFACE_FILL'].includes(renderer)
}))
</script>

<template>
  <button
    type="button"
    class="nts-tooth"
    :class="{ selected, pending: hasPending, persisted: hasPersisted }"
    :aria-label="`Pieza ${tooth}${codes ? `, ${codes}` : ''}`"
    @click="emit('select', tooth)"
  >
    <span v-if="upper" class="specification" :class="{ pending: hasPending }">{{ codes }}</span>
    <span v-if="upper" class="number">{{ tooth }}</span>

    <svg class="tooth-svg" viewBox="0 0 64 100" role="img" aria-hidden="true">
      <path :d="rootPath" class="root-shape" />

      <g class="crown-shape" :transform="`translate(0 ${crownTop})`">
        <path d="M13 0 H51 L48 34 H16 Z" class="crown-base" />
        <path d="M15 2 H49 L40 11 H24 Z" class="surface" :style="surfaceStyle(['VESTIBULAR', 'CERVICAL'])" />
        <path d="M15 32 H49 L40 23 H24 Z" class="surface" :style="surfaceStyle(['PALATAL', 'LINGUAL'])" />
        <path d="M15 2 L24 11 V23 L15 32 Z" class="surface" :style="surfaceStyle('MESIAL')" />
        <path d="M49 2 L40 11 V23 L49 32 Z" class="surface" :style="surfaceStyle('DISTAL')" />
        <path d="M24 11 H40 V23 H24 Z" class="surface" :style="surfaceStyle(['OCCLUSAL', 'INCISAL'])" />
      </g>

      <g
        v-for="(item, index) in graphicFindings"
        :key="item.id || index"
        class="normative-mark"
        :style="{ color: color(item) }"
      >
        <template v-if="symbol(item)?.renderer === 'ORTHO_FIXED'">
          <path :d="`M3 ${apicalY} H61`" />
          <rect x="27" :y="apicalY - 5" width="10" height="10" />
          <path :d="`M29 ${apicalY - 3} L35 ${apicalY + 3} M35 ${apicalY - 3} L29 ${apicalY + 3}`" />
        </template>
        <path v-else-if="symbol(item)?.renderer === 'ORTHO_REMOVABLE'" :d="`M2 ${apicalY} l7 -5 l7 10 l7 -10 l7 10 l7 -10 l7 10 l7 -10 l7 5`" />
        <rect v-else-if="symbol(item)?.renderer === 'CROWN_OUTLINE'" x="10" :y="crownTop - 3" width="44" height="40" rx="2" />
        <path v-else-if="symbol(item)?.renderer === 'INVERTED_PARENTHESES'" :d="`M2 ${crownMid - 12} Q12 ${crownMid} 2 ${crownMid + 12} M62 ${crownMid - 12} Q52 ${crownMid} 62 ${crownMid + 12}`" />
        <path v-else-if="symbol(item)?.renderer === 'ARCH_LINE'" :d="`M1 ${crownMid} H63`" />
        <template v-else-if="symbol(item)?.renderer === 'POST_CORE'">
          <path :d="`M32 ${apicalY} V${crownMid}`" />
          <rect x="25" :y="crownMid - 7" width="14" height="14" />
        </template>
        <path v-else-if="symbol(item)?.renderer === 'FRACTURE'" d="M11 25 L25 39 L20 53 L42 68 L36 84" />
        <template v-else-if="symbol(item)?.renderer === 'DOUBLE_CIRCLE'">
          <circle cx="25" :cy="crownMid" r="14" /><circle cx="39" :cy="crownMid" r="14" />
        </template>
        <circle v-else-if="symbol(item)?.renderer === 'CIRCLE'" cx="32" :cy="crownMid" r="19" />
        <template v-else-if="symbol(item)?.renderer === 'CURVED_ARROW'">
          <path :d="`M15 ${crownMid + 5} Q32 ${crownMid - 18} 49 ${crownMid + 5}`" />
          <path :d="`M44 ${crownMid} L50 ${crownMid + 5} L43 ${crownMid + 8}`" class="filled" />
        </template>
        <path v-else-if="symbol(item)?.renderer === 'APICAL_TRIANGLE'" :d="upper ? 'M23 5 H41 L32 18 Z' : 'M23 95 H41 L32 82 Z'" />
        <template v-else-if="symbol(item)?.renderer === 'ZIGZAG_ARROW'">
          <path :d="upper ? 'M48 8 l-8 9 l8 8 l-8 9 l8 8' : 'M48 92 l-8 -9 l8 -8 l-8 -9 l8 -8'" />
          <path :d="upper ? 'M43 38 L48 43 L51 36' : 'M43 62 L48 57 L51 64'" class="filled" />
        </template>
        <template v-else-if="['OUTWARD_ARROW', 'INWARD_ARROW'].includes(symbol(item)?.renderer)">
          <path :d="upper ? 'M56 48 V8' : 'M56 52 V92'" />
          <path
            :d="symbol(item)?.renderer === 'OUTWARD_ARROW'
              ? (upper ? 'M51 13 L56 7 L61 13' : 'M51 87 L56 93 L61 87')
              : (upper ? 'M51 43 L56 49 L61 43' : 'M51 57 L56 51 L61 57')"
            class="filled"
          />
        </template>
        <template v-else-if="symbol(item)?.renderer === 'CIRCLED_S'">
          <circle cx="32" :cy="apicalY" r="10" /><text x="32" :y="apicalY + 4">S</text>
        </template>
        <path v-else-if="symbol(item)?.renderer === 'CORONAL_PULP'" :d="`M27 ${crownMid - 8} Q32 ${crownMid - 13} 37 ${crownMid - 8} V${crownMid + 8} H27 Z`" class="filled-area" />
        <template v-else-if="symbol(item)?.renderer === 'BRIDGE'">
          <path :d="`M1 ${apicalY} H63`" /><path v-if="item.isAbutment !== false" :d="`M32 ${apicalY - 8} V${apicalY + 8}`" />
        </template>
        <path v-else-if="symbol(item)?.renderer === 'DOUBLE_ARCH_LINE'" :d="`M1 ${apicalY - 3} H63 M1 ${apicalY + 3} H63`" />
        <rect v-else-if="symbol(item)?.renderer === 'SURFACE_OUTLINE'" x="23" :y="crownMid - 7" width="18" height="14" rx="4" />
        <path v-else-if="symbol(item)?.renderer === 'FISSURE_LINE'" :d="`M18 ${crownMid} Q24 ${crownMid - 7} 30 ${crownMid} T42 ${crownMid} T50 ${crownMid}`" />
        <path v-else-if="symbol(item)?.renderer === 'WORN_SURFACE'" :d="`M15 ${crownTop + 5} H49 M19 ${crownTop + 10} H45`" />
        <path v-else-if="symbol(item)?.renderer === 'ROOT_LINE'" :d="upper ? 'M32 9 V53' : 'M32 47 V91'" class="root-treatment" />
        <template v-else-if="symbol(item)?.renderer === 'CROSSED_ARROWS'">
          <path :d="`M8 ${apicalY + 7} Q32 ${apicalY - 16} 56 ${apicalY + 7}`" />
          <path :d="`M8 ${apicalY - 7} Q32 ${apicalY + 16} 56 ${apicalY - 7}`" />
        </template>
        <template v-else-if="symbol(item)?.renderer === 'ABSENT_CROSS'">
          <path d="M8 15 L56 86 M56 15 L8 86" class="absent-cross" />
        </template>
      </g>
    </svg>

    <span v-if="!upper" class="number">{{ tooth }}</span>
    <span v-if="!upper" class="specification" :class="{ pending: hasPending }">{{ codes }}</span>
  </button>
</template>

<style scoped lang="sass">
.nts-tooth
  width: 100%
  min-width: 0
  padding: 2px
  border: 1px solid transparent
  border-radius: 8px
  background: transparent
  color: #24384f
  cursor: pointer
  transition: background .15s ease, border-color .15s ease, transform .15s ease
  &:hover, &.selected
    border-color: #4776bd
    background: #eef5ff
    transform: translateY(-1px)
  &:focus-visible
    outline: 3px solid rgba(37, 99, 235, .28)
    outline-offset: 1px
.number
  display: block
  height: 18px
  color: #263c57
  font-size: .72rem
  font-weight: 800
  line-height: 18px
.specification
  display: grid
  place-items: center
  min-height: 28px
  padding: 1px
  border: 1px solid #8f9aaa
  background: #fff
  color: #1756a9
  font-size: .53rem
  font-weight: 800
  line-height: 1.05
  overflow: hidden
  &.pending
    border-style: dashed
    color: #7c3aed
.tooth-svg
  display: block
  width: 100%
  height: auto
  aspect-ratio: 64 / 100
.root-shape, .crown-base
  fill: #fff
  stroke: #3f4c5c
  stroke-width: 1.4
  stroke-linejoin: round
.surface
  fill: #fff
  stroke: #7d8997
  stroke-width: .7
  transition: fill .18s ease
.normative-mark
  fill: none
  stroke: currentColor
  stroke-width: 2.4
  stroke-linecap: round
  stroke-linejoin: round
  pointer-events: none
  .filled
    fill: currentColor
    stroke: none
  .filled-area
    fill: currentColor
    fill-opacity: .78
  .absent-cross
    stroke-width: 3.2
  .root-treatment
    stroke-width: 4
  text
    fill: currentColor
    stroke: none
    text-anchor: middle
    font-size: 12px
    font-weight: 800
.pending .tooth-svg
  filter: drop-shadow(0 0 2px rgba(124, 58, 237, .35))
@media (max-width: 760px)
  .nts-tooth
    padding: 1px
  .number
    height: 15px
    font-size: clamp(.46rem, 1.5vw, .68rem)
    line-height: 15px
  .specification
    min-height: 22px
    font-size: clamp(.34rem, 1.15vw, .5rem)
</style>
