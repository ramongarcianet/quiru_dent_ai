<script setup>
import { alertMensaje } from "../store/helper";
import { ref, watch } from "vue";
import Nav from "../components/Nav.vue";
import Avatar from "../components/Avatar.vue";
import BrandLogo from "../components/BrandLogo.vue";

const verDialog = ref(false);

watch(
  () => alertMensaje.value,
  () => {
    verDialog.value = true;
  }
);
</script>

<template lang="pug">
Dialog(v-model='verDialog')
  template(#title) QUIRU Dent AI
  template(#body) {{ alertMensaje }}
  template(#footer)
    button.btn.btn-primary(type='button' data-bs-dismiss='modal') Aceptar

.dashboard-page
  .dashboard-glow.dashboard-glow-a
  .dashboard-glow.dashboard-glow-b
  .container.py-3.py-md-4
    .dashboard-shell
      header.dashboard-hero
        .brand-block
          BrandLogo
        .hero-side
          Avatar
      #body
        .content-card
          router-view(:key="$route.name === 'atencion-ai' ? $route.fullPath : undefined")
  Nav
</template>

<style lang="sass" scoped>
.dashboard-page
  min-height: 100vh
  position: relative
  isolation: isolate
  padding-bottom: 6.5rem
  overflow-x: hidden

.dashboard-glow
  position: fixed
  z-index: 0
  border-radius: 50%
  filter: blur(24px)
  pointer-events: none
  opacity: 0.34
  &.dashboard-glow-a
    width: 18rem
    height: 18rem
    top: -5rem
    left: -4rem
    background: rgba(var(--color-primary-rgb), 0.14)
  &.dashboard-glow-b
    width: 16rem
    height: 16rem
    top: 10rem
    right: -4rem
    background: rgba(var(--color-secondary-rgb), 0.12)

.dashboard-shell
  position: relative
  z-index: 1

.dashboard-hero
  display: flex
  align-items: center
  justify-content: space-between
  gap: 1rem
  min-height: 72px
  margin-bottom: 1rem
  padding: 0.7rem 1rem
  border-radius: var(--radius-card)
  background: rgba(255,255,255,0.96)
  border: 1px solid var(--color-border)
  box-shadow: var(--shadow-soft)

.brand-block
  display: flex
  align-items: center

.hero-side
  display: flex
  flex-direction: column
  align-items: flex-end

#body
  min-height: calc(100vh - 10.5rem)
  width: 100%
  overflow-y: auto

.content-card
  min-height: 100%
  padding: 1.25rem
  background: rgba(255,255,255,0.96)
  border: 1px solid var(--color-border)
  border-radius: var(--radius-card)
  box-shadow: var(--shadow-card)

@media (max-width: 767px)
  .dashboard-page
    padding-bottom: 7.2rem
  .dashboard-hero
    min-height: 64px
    padding: 0.6rem 0.75rem
  .hero-side
    align-items: flex-end
  .content-card
    padding: 1rem
</style>
