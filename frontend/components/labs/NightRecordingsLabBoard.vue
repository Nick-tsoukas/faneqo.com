<template>
  <div class="nrlb">
    <nav class="nrlb__nav" aria-label="Recording states">
      <NuxtLink
        v-for="row in states"
        :key="row.id"
        :to="{ query: { state: row.id } }"
      >
        {{ row.label }}
      </NuxtLink>
    </nav>

    <section class="nrlb__block">
      <p class="nrlb__kicker">Public Night</p>
      <PublicNightExperience :payload="night" band-slug="badflower" />
    </section>

    <section class="nrlb__block">
      <p class="nrlb__kicker">Show Recap manager</p>
      <div class="nrlb__recap">
        <NightRecordingManager
          :recap-id="88"
          artist-name="Badflower"
          local-only
          :initial-recordings="managerRows"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PublicNightExperience from '~/components/nights/PublicNightExperience.vue'
import NightRecordingManager from '~/components/nights/NightRecordingManager.vue'
import { nightRecordingLabNight, nightRecordingLabStates } from '~/config/nightRecordingsLab'

const route = useRoute()
const states = [
  { id: 'mixed', label: 'Mixed' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'spotify', label: 'Spotify' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
  { id: 'many', label: 'Many' },
  { id: 'empty', label: 'Empty' },
  { id: 'locked', label: 'Locked' },
  { id: 'long', label: 'Long title' },
]

const state = computed(() => String(route.query.state || 'mixed'))
const night = computed(() => nightRecordingLabNight(state.value))
const managerRows = computed(() => (
  state.value === 'empty' ? [] : (nightRecordingLabStates[state.value] || nightRecordingLabStates.mixed)
))
</script>

<style scoped>
.nrlb__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.85rem;
  margin: 0 0 1.25rem;
}
.nrlb__nav a {
  color: rgba(245, 245, 246, 0.62);
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.nrlb__nav a.router-link-active { color: #f5f5f6; }
.nrlb__kicker {
  margin: 0 0 0.85rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}
.nrlb__block + .nrlb__block { margin-top: 2.5rem; }
.nrlb__recap {
  max-width: 36rem;
  padding: 0 1.25rem 2rem;
}
</style>
