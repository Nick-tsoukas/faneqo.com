<template>
  <main class="nights">
    <header class="nights__head">
      <NuxtLink to="/dashboard" class="nights__back">Dashboard</NuxtLink>
      <h1>Nights</h1>
      <p>Your shows, remembered.</p>
    </header>

    <div v-if="loading && !recaps.length" class="nights__state" role="status">Loading your Nights…</div>

    <div v-else-if="loadError && !recaps.length" class="nights__state" role="alert">
      <h2>We couldn't load your Nights.</h2>
      <p>Check your connection and try again.</p>
      <button type="button" class="nights__btn" @click="loadMore(true)">Try again</button>
    </div>

    <div v-else-if="!recaps.length" class="nights__empty">
      <h2>No Nights yet.</h2>
      <p>When you use Show Mode, your Nights will live here.</p>
      <NuxtLink to="/dashboard#dashboard-show-mode" class="nights__btn">Set up tonight</NuxtLink>
    </div>

    <template v-else>
      <section v-for="group in groups" :key="group.year || 'all'" class="nights__group">
        <h2 v-if="group.year" class="nights__year">{{ group.year }}</h2>
        <div class="nights__list">
          <NightHistoryRow
            v-for="(recap, index) in group.items"
            :key="recap.id"
            :recap="recap"
            :band-slug="bandSlug"
            :lazy="index > 1"
          />
        </div>
      </section>

      <div v-if="hasMore" class="nights__more">
        <p v-if="loadError">We couldn't load more Nights. Try again.</p>
        <button type="button" class="nights__ghost" :disabled="loading" @click="loadMore()">
          <span v-if="loading">Loading…</span>
          <span v-else>Load more</span>
        </button>
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import NightHistoryRow from '~/components/nights/NightHistoryRow.vue'
import { useWorkspaceBand } from '~/composables/useWorkspaceBand'
import { groupNightsByYear } from '~/utils/nights/nightHistory'

definePageMeta({
  middleware: 'auth',
  alias: ['/nights'],
})

const PAGE_SIZE = 10
const { getRecaps } = useShowRecaps()
const { requireActiveBand } = useWorkspaceBand()

const recaps = ref([])
const loading = ref(true)
const inFlight = ref(false)
const loadError = ref(false)
const page = ref(0)
const pageCount = ref(0)
const bandSlug = ref('')
const activeBandId = ref(null)

const hasMore = computed(() => page.value < pageCount.value)
const groups = computed(() => groupNightsByYear(recaps.value))

async function loadWorkspace() {
  try {
    // Nights belong to one artist; a multi-band user picks before reading them.
    const band = await requireActiveBand()
    activeBandId.value = band?.bandId ?? null
    bandSlug.value = band?.slug || ''
  } catch {
    activeBandId.value = null
    bandSlug.value = ''
  }
}

async function loadMore(reset = false) {
  if (inFlight.value) return

  if (reset) {
    recaps.value = []
    page.value = 0
  }

  inFlight.value = true
  loading.value = true
  loadError.value = false

  const nextPage = page.value + 1

  try {
    const result = await getRecaps({
      page: nextPage,
      pageSize: PAGE_SIZE,
      bandId: activeBandId.value,
    })
    const seen = new Set(recaps.value.map((item) => item.id))
    recaps.value = [...recaps.value, ...result.data.filter((item) => !seen.has(item.id))]
    page.value = nextPage
    pageCount.value = result.meta?.pagination?.pageCount ?? 0
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
    inFlight.value = false
  }
}

// Sequenced: the band must be resolved before Nights are requested, or the
// first page would be fetched without a bandId and fall back to Band A.
onMounted(async () => {
  await loadWorkspace()
  await loadMore()
})

useHead({
  title: 'Nights',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<style scoped>
.nights {
  min-width: 0;
  max-width: 56rem;
  margin: 0 auto;
  padding: calc(var(--header-height, 70px) + 1.25rem) 1.15rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
  overflow-x: clip;
  color: #f5f5f6;
}

.nights__head {
  margin-bottom: 1.5rem;
}

.nights__back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgba(245, 245, 246, 0.5);
  font-size: 0.9375rem;
  text-decoration: none;
}

.nights__head h1 {
  margin: 0.15rem 0 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.nights__head p {
  margin: 0.35rem 0 0;
  font-size: 1rem;
  color: rgba(245, 245, 246, 0.5);
}

.nights__year {
  margin: 1.5rem 0 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}

.nights__list {
  min-width: 0;
}

.nights__state,
.nights__empty {
  padding: 3rem 0 2rem;
}

.nights__state h2,
.nights__empty h2 {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: -0.03em;
}

.nights__state p,
.nights__empty p {
  margin: 0.45rem 0 0;
  font-size: 0.975rem;
  line-height: 1.45;
  color: rgba(245, 245, 246, 0.55);
}

.nights__btn,
.nights__ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 1.15rem;
  padding: 0 1.2rem;
  border-radius: 12px;
  font-size: 0.975rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
}

.nights__btn {
  border: 0;
  background: #f3f3f4;
  color: #08090a;
}

.nights__ghost {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #f5f5f6;
}

.nights__more {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 0.5rem;
}

.nights__more p {
  margin: 0;
  color: #f8a4a4;
  font-size: 0.875rem;
}

.nights__back:focus-visible,
.nights__btn:focus-visible,
.nights__ghost:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.7);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .nights {
    padding-bottom: 4rem;
  }

  .nights__head h1 {
    font-size: 2.35rem;
  }
}
</style>
