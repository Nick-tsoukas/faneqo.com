<template>
  <main class="lab">
    <nav class="lab__rail" aria-label="Direction A fixture states">
      <span class="lab__brand">Direction A · Night Journal</span>
      <NuxtLink
        v-for="option in states"
        :key="option.key"
        class="lab__state"
        :class="{ 'is-on': option.key === state }"
        :to="{ path: '/__dev/gallery-archive-v3', query: { state: option.key } }"
      >{{ option.label }}</NuxtLink>
    </nav>

    <NightJournalArchive
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
import NightJournalArchive from '~/features/gallery-archive/direction-a/NightJournalArchive.vue'
import { DIRECTION_A_STATES, directionAFixtures } from '~/features/gallery-archive/direction-a/fixtures.js'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Gallery archive · Direction A · Faneqo',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})

const route = useRoute()
const states = DIRECTION_A_STATES
const state = computed(() => String(route.query.state || 'full'))
const items = computed(() => directionAFixtures(state.value))

onMounted(() => {
  document.documentElement.classList.add('fq-journal-lab')
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('fq-journal-lab')
})
</script>

<style>
html.fq-journal-lab,
html.fq-journal-lab body {
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
  padding: 0.55rem clamp(1.05rem, 4.2vw, 5rem);
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
