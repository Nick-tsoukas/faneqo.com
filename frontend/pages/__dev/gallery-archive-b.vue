<template>
  <main class="lab">
    <nav class="lab__rail" aria-label="Direction B fixture states">
      <span class="lab__brand">Direction B · Tour Contact Sheet</span>
      <NuxtLink
        v-for="option in states"
        :key="option.key"
        class="lab__state"
        :class="{ 'is-on': option.key === state }"
        :to="{ path: '/__dev/gallery-archive-b', query: { state: option.key } }"
      >{{ option.label }}</NuxtLink>
    </nav>

    <TourContactSheet
      :items="items"
      artist-name="The Rockers"
      :can-create="state !== 'auth'"
      :loading="state === 'loading'"
      :error="state === 'error'"
    />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import TourContactSheet from '~/features/gallery-archive/direction-b/TourContactSheet.vue'
import { DIRECTION_B_STATES, directionBFixtures } from '~/features/gallery-archive/direction-b/fixtures.js'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Gallery archive · Direction B · Faneqo',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})

const route = useRoute()
const states = DIRECTION_B_STATES
const state = computed(() => String(route.query.state || 'tour'))
const items = computed(() => directionBFixtures(state.value))

onMounted(() => {
  document.documentElement.classList.add('fq-sheet-lab')
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('fq-sheet-lab')
})
</script>

<style>
html.fq-sheet-lab,
html.fq-sheet-lab body {
  height: auto !important;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto !important;
}
</style>

<style scoped>
.lab {
  min-height: 100dvh;
  background: #050506;
}
.lab__rail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.7rem;
  padding: 0.55rem clamp(1rem, 3vw, 3.5rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.lab__brand {
  margin-right: 0.4rem;
  color: rgba(245, 245, 246, 0.34);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.lab__state {
  color: rgba(245, 245, 246, 0.36);
  font-size: 0.68rem;
  letter-spacing: 0.02em;
  text-decoration: none;
}
.lab__state:hover {
  color: rgba(245, 245, 246, 0.7);
}
.lab__state.is-on {
  color: #f5f5f6;
}
</style>
