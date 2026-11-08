<template>
  <section
    v-if="bandId"
    class="perf-glance"
    aria-label="Recent performance"
  >
    <span class="perf-glance-range">{{ rangeLabel }}</span>

    <div class="perf-glance-metrics">
      <div v-for="row in rows" :key="row.key" class="perf-metric">
        <span class="perf-metric-value">{{ pending ? '—' : row.display }}</span>
        <span class="perf-metric-label">{{ row.label }}</span>
        <span
          v-if="row.trend && loaded"
          class="perf-metric-trend"
          :class="row.trend.direction === 'up' ? 'is-up' : 'is-down'"
        >
          <span aria-hidden="true">{{ row.trend.label }}</span>
          <span class="sr-only">{{ row.trend.srLabel }}</span>
        </span>
        <span v-else class="perf-metric-trend is-flat" aria-hidden="true"></span>
      </div>
    </div>

    <NuxtLink :to="`/analytics/${bandId}`" class="perf-glance-link">
      Analytics <span aria-hidden="true">→</span>
    </NuxtLink>
  </section>
</template>

<script setup>
import { computed, onMounted, toRef, watch } from 'vue'

const props = defineProps({
  bandId: {
    type: [Number, String],
    default: null,
  },
  days: {
    type: Number,
    default: 7,
  },
})

const bandId = toRef(props, 'bandId')
const { rows, rangeLabel, loading, loaded, load } = useDashboardGlance(bandId, { days: props.days })

// Placeholder only on the very first load, so a background refresh never
// blanks numbers the artist is already reading.
const pending = computed(() => loading.value && !loaded.value)

onMounted(load)
watch(bandId, (next, prev) => {
  if (next && next !== prev) load()
})
</script>

<style scoped>
/*
 * Deliberately quiet: the dashboard already carries several saturated section
 * headers. This should almost disappear until the eye lands on the numbers.
 */
.perf-glance {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'range  link'
    'metrics metrics';
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 2rem;
  padding: 0.625rem 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  border-radius: 0.875rem;
}

.perf-glance-range {
  grid-area: range;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
}

.perf-glance-link {
  grid-area: link;
  justify-self: end;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.perf-glance-link:hover,
.perf-glance-link:focus-visible {
  color: rgba(255, 255, 255, 0.92);
}

/* Mobile: three equal columns, never a horizontal scroller. */
.perf-glance-metrics {
  grid-area: metrics;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.perf-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.perf-metric-value {
  font-size: 1.1875rem;
  line-height: 1.15;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  font-variant-numeric: tabular-nums;
}

.perf-metric-label {
  max-width: 100%;
  font-size: 0.6875rem;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perf-metric-trend {
  min-height: 0.9rem;
  font-size: 0.6875rem;
  line-height: 1.3;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.perf-metric-trend.is-up {
  color: rgba(52, 211, 153, 0.9);
}

.perf-metric-trend.is-down {
  color: rgba(248, 113, 113, 0.78);
}

.perf-metric-trend.is-flat {
  color: transparent;
}

/* Desktop: collapse to a single status line. */
@media (min-width: 640px) {
  .perf-glance {
    grid-template-columns: auto 1fr auto;
    grid-template-areas: 'range metrics link';
    gap: 1.5rem;
    padding: 0.6875rem 1.125rem;
  }

  .perf-glance-metrics {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 0.5rem 2rem;
  }

  .perf-metric {
    flex-direction: row;
    align-items: baseline;
    gap: 0.375rem;
  }

  .perf-metric-value {
    font-size: 1rem;
  }

  .perf-metric-label,
  .perf-metric-trend {
    font-size: 0.75rem;
  }

  .perf-metric-trend.is-flat {
    display: none;
  }
}
</style>
