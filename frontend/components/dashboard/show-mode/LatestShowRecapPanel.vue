<template>
  <section class="recent">
    <p class="recent__kicker">Last show</p>
    <p class="recent__title">{{ line.title }}</p>
    <p v-if="line.meta" class="recent__meta">{{ line.meta }}</p>
    <NuxtLink :to="`${recapPath}?from=dashboard`" class="recent__link">
      View recap
      <span aria-hidden="true">→</span>
    </NuxtLink>
    <NuxtLink to="/nights" class="recent__archive">
      View all Nights
      <span aria-hidden="true">→</span>
    </NuxtLink>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { recentShowLine } from '~/utils/show-mode/showModeTiming'

const props = defineProps({
  recap: { type: Object, required: true },
})

const recapPath = computed(() => `/fans/recaps/${props.recap.id}`)
const line = computed(() => recentShowLine(props.recap))
</script>

<style scoped>
.recent {
  min-width: 0;
}

.recent__kicker {
  font-size: 0.875rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.62);
}

.recent__title {
  margin: 0.35rem 0 0;
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: #f5f5f6;
  overflow-wrap: anywhere;
}

.recent__meta {
  margin: 0.15rem 0 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: rgba(245, 245, 246, 0.62);
  overflow-wrap: anywhere;
}

.recent__link,
.recent__archive {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  font-size: 0.9375rem;
  font-weight: 550;
  text-decoration: none;
}

.recent__link {
  color: #f5f5f6;
}

.recent__archive {
  display: flex;
  color: rgba(245, 245, 246, 0.5);
}

.recent__archive:hover,
.recent__link:hover,
.recent__archive:focus-visible,
.recent__link:focus-visible {
  color: #f5f5f6;
}

.recent__archive:focus-visible,
.recent__link:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.7);
  outline-offset: 2px;
}
</style>
