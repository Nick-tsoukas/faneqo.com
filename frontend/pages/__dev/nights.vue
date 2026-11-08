<template>
  <div class="dev">
    <p class="dev__rail">Nights history · local only</p>
    <nav class="dev__nav">
      <NuxtLink v-for="row in states" :key="row.id" :to="`/__dev/nights?state=${row.id}`">
        {{ row.id }}
      </NuxtLink>
    </nav>
    <div class="dev__stage">
      <header class="nights__head">
        <p class="nights__back">Dashboard</p>
        <h1>Nights</h1>
        <p>Your shows, remembered.</p>
      </header>
      <div v-if="empty" class="nights__empty">
        <h2>No Nights yet.</h2>
        <p>When you use Show Mode, your Nights will live here.</p>
        <span class="nights__btn">Set up tonight</span>
      </div>
      <section v-else v-for="group in groups" :key="group.year || 'all'" class="nights__list">
        <h2 v-if="group.year" class="nights__year">{{ group.year }}</h2>
        <NightHistoryRow
          v-for="(recap, index) in group.items"
          :key="recap.id"
          :recap="recap"
          band-slug="the-rockers"
          :lazy="index > 1"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import NightHistoryRow from '~/components/nights/NightHistoryRow.vue'
import { groupNightsByYear } from '~/utils/nights/nightHistory'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const states = [
  { id: 'empty' },
  { id: 'one' },
  { id: 'many' },
]

const base = {
  venue: 'The Rock',
  city: 'Chicago',
  checkedInShowCount: 2,
  fansCaptured: 2,
  newFanCheckIns: 2,
  nightSlug: 'the-rock-chicago-sep-3-2026-8bcefe8f',
  coverImage: { url: '/__dev/gallery/landscape-stage.svg', formats: { medium: { url: '/__dev/gallery/landscape-stage.svg' } } },
}

const many = [
  { ...base, id: 88, showTitle: 'hello new show 3', showStartedAt: '2026-09-03T21:00:00', messagesSentCount: 1 },
  { ...base, id: 76, showTitle: 'Album release', venue: 'Basement East', city: 'Nashville', showStartedAt: '2026-08-12T20:00:00', coverImage: null },
  { ...base, id: 61, showTitle: 'Sold out Friday', venue: 'The Metro', city: 'Chicago', showStartedAt: '2026-06-20T21:30:00', checkedInShowCount: 84, fansCaptured: 19 },
  { ...base, id: 40, showTitle: 'First night back', venue: 'Empty Bottle', city: 'Chicago', showStartedAt: '2025-11-08T21:00:00' },
]

const shown = computed(() => {
  const key = String(route.query.state || 'many')
  if (key === 'one') return many.slice(0, 1)
  return many
})

const empty = computed(() => String(route.query.state || 'many') === 'empty')
const groups = computed(() => groupNightsByYear(shown.value))
</script>

<style scoped>
.dev {
  min-height: 100dvh;
  padding: 1rem 1.15rem 5rem;
  overflow-x: clip;
  background: #050506;
  color: #f5f5f6;
}

.dev__rail {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}

.dev__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.7rem;
  margin-bottom: 1.25rem;
}

.dev__nav a {
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.8125rem;
  text-decoration: none;
}

.dev__nav a.router-link-exact-active {
  color: #f5f5f6;
}

.dev__stage {
  max-width: 56rem;
}

.nights__head h1 {
  margin: 0.15rem 0 0;
  font-size: 2rem;
  letter-spacing: -0.04em;
}

.nights__head p,
.nights__back {
  margin: 0.35rem 0 0;
  color: rgba(245, 245, 246, 0.5);
}

.nights__empty {
  padding: 3rem 0;
}

.nights__empty h2 {
  margin: 0;
  font-size: 1.35rem;
}

.nights__year {
  margin: 1.5rem 0 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}

.nights__btn {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  margin-top: 1.15rem;
  padding: 0 1.2rem;
  border-radius: 12px;
  background: #f3f3f4;
  color: #08090a;
  font-weight: 650;
}
</style>
