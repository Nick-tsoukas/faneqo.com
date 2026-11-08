<template>
  <main class="fan-rel-page">
    <div class="fan-rel-page__shell">
      <header class="fan-rel-page__top">
        <NuxtLink :to="backTo" class="fan-rel-page__back" aria-label="Back to messages">
          <span aria-hidden="true">←</span>
          {{ backLabel }}
        </NuxtLink>
        <p class="fan-rel-page__eyebrow">Fan relationship</p>
      </header>

      <section v-if="loading" class="fan-rel-page__state" aria-live="polite">
        <div class="fan-rel-page__pulse" aria-hidden="true"></div>
        <p>Building the story…</p>
      </section>

      <section v-else-if="error" class="fan-rel-page__state fan-rel-page__state--error">
        <p class="fan-rel-page__state-kicker">Relationship unavailable</p>
        <h1>{{ errorHeading }}</h1>
        <p>{{ errorCopy }}</p>
        <button v-if="canRetry" type="button" @click="loadRelationship">Try again</button>
        <NuxtLink v-else :to="backTo">Return to {{ backLabel.toLowerCase() }}</NuxtLink>
      </section>

      <FaneqoRelationshipStory
        v-else-if="relationship"
        :artist-name="relationship.band?.name"
        :fan-name="relationship.fan?.displayName"
        :joined-at="relationship.joinedAt"
        :shows="relationship.shows"
        :communication="relationship.communication"
        :moments="relationship.moments"
        :milestones="relationship.milestones"
      />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import FaneqoRelationshipStory from '~/components/relationship/FaneqoRelationshipStory.vue'
import { useArtistFanRelationship } from '~/composables/useArtistFanRelationship'

definePageMeta({
  middleware: 'auth',
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Fan relationship · Faneqo',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})

const route = useRoute()
const { fetchArtistFanRelationship } = useArtistFanRelationship()
const relationship = ref(null)
const loading = ref(true)
const error = ref(null)
let loadGeneration = 0

const bandId = computed(() => Number(route.query.bandId) || null)
const fanId = computed(() => Number(route.params.fanId) || null)
const fromMessages = computed(() => route.query.from === 'messages')
const backTo = computed(() => (fromMessages.value ? '/messages' : '/dashboard'))
const backLabel = computed(() => (fromMessages.value ? 'Messages' : 'Dashboard'))
const canRetry = computed(() => Number(error.value?.statusCode) !== 404)
const errorHeading = computed(() =>
  Number(error.value?.statusCode) === 404
    ? 'This relationship is not available.'
    : 'We could not load the story.'
)
const errorCopy = computed(() =>
  Number(error.value?.statusCode) === 404
    ? 'Return to your inbox and choose another fan.'
    : 'Your relationship data is safe. Check your connection and try again.'
)

async function loadRelationship() {
  const generation = ++loadGeneration
  loading.value = true
  error.value = null
  relationship.value = null
  try {
    const data = await fetchArtistFanRelationship({
      bandId: bandId.value,
      fanId: fanId.value,
    })
    if (generation === loadGeneration) relationship.value = data
  } catch (cause) {
    if (generation === loadGeneration) error.value = cause
  } finally {
    if (generation === loadGeneration) loading.value = false
  }
}

onMounted(loadRelationship)
watch([bandId, fanId], ([nextBand, nextFan], [previousBand, previousFan]) => {
  if (nextBand !== previousBand || nextFan !== previousFan) loadRelationship()
})
</script>

<style scoped>
.fan-rel-page {
  min-height: 100dvh;
  padding: calc(var(--header-height, 70px) + 1rem) 1rem 4rem;
  background:
    radial-gradient(circle at 82% 5%, rgba(130, 65, 255, 0.16), transparent 31rem),
    radial-gradient(circle at 15% 35%, rgba(57, 213, 255, 0.08), transparent 28rem),
    #050506;
  color: #f7f9fc;
}

.fan-rel-page__shell {
  width: min(100%, 58rem);
  margin: 0 auto;
}

.fan-rel-page__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: clamp(2.4rem, 7vw, 4.4rem);
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.fan-rel-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 44px;
  color: rgba(247, 249, 252, 0.72);
  font-weight: 600;
  text-decoration: none;
}

.fan-rel-page__back:hover,
.fan-rel-page__back:focus-visible {
  color: #fff;
}

.fan-rel-page__eyebrow,
.fan-rel-page__state p {
  margin: 0;
  color: rgba(247, 249, 252, 0.52);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.fan-rel-page__state {
  min-height: 52vh;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 1rem;
  text-align: center;
}

.fan-rel-page__pulse {
  width: 2.2rem;
  height: 2.2rem;
  border: 2px solid rgba(255, 255, 255, 0.16);
  border-top-color: #39d5ff;
  border-radius: 50%;
  animation: fan-rel-spin 0.8s linear infinite;
}

.fan-rel-page__state--error {
  max-width: 34rem;
  margin: 0 auto;
}

.fan-rel-page__state--error h1 {
  margin: 0;
  font-size: clamp(1.8rem, 6vw, 2.7rem);
  letter-spacing: -0.04em;
}

.fan-rel-page__state--error > p:not(.fan-rel-page__state-kicker) {
  max-width: 30rem;
  color: rgba(247, 249, 252, 0.64);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.65;
  text-transform: none;
}

.fan-rel-page__state--error button,
.fan-rel-page__state--error a {
  min-height: 44px;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(57, 213, 255, 0.38);
  border-radius: 999px;
  background: rgba(57, 213, 255, 0.08);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}

@keyframes fan-rel-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .fan-rel-page__pulse { animation: none; }
}
</style>
