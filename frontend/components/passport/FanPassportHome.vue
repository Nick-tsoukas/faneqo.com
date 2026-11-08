<template>
  <section class="passport-home" :class="{ 'is-embedded': embedded }">
    <nav v-if="!embedded" class="passport-home__nav" aria-label="Fan account">
      <NuxtLink to="/fan">Artists</NuxtLink>
      <NuxtLink to="/fan/messages">Messages</NuxtLink>
      <NuxtLink to="/fan/passport" aria-current="page">Passport</NuxtLink>
    </nav>
    <header class="passport-home__hero">
      <p class="passport-home__eyebrow">Passport</p>
      <h1>Your nights stay with you.</h1>
      <p v-if="(user || usingFixture) && (shownMemories.length || shownSaved.length)" class="passport-home__meta">
        {{ summaryLine }}
      </p>
    </header>

    <div v-if="!user && !usingFixture" class="passport-home__state">
      <h2>Sign in to open your Passport.</h2>
      <p>Your show history follows your Faneqo account.</p>
      <NuxtLink :to="loginTo" class="passport-home__button">Sign in</NuxtLink>
    </div>

    <div v-else-if="loading" class="passport-home__state" role="status">Opening your nights…</div>

    <div v-else-if="loadError" class="passport-home__state" role="alert">
      <h2>We couldn’t open your Passport.</h2>
      <p>Your memories are still safe.</p>
      <button type="button" class="passport-home__button" @click="load">Try again</button>
    </div>

    <div v-else-if="!shownMemories.length && !shownSaved.length" class="passport-home__state is-empty">
      <h2>Your Passport starts with a Night.</h2>
      <p>Check in at a show and it will live here.</p>
      <NuxtLink to="/fan" class="passport-home__button is-quiet">Discover artists</NuxtLink>
    </div>

    <FanPassportMemoryList
      v-else
      :memories="shownMemories"
      :saved-galleries="shownSaved"
      :media-origin="mediaOrigin"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import FanPassportMemoryList from '~/components/passport/FanPassportMemoryList.vue'
import { passportSummaryLine } from '~/utils/passport/passportPresentation'

const props = defineProps({
  embedded: { type: Boolean, default: false },
  fixture: { type: Object, default: null },
})

const route = useRoute()
const config = useRuntimeConfig()
const user = useStrapiUser()
const token = useStrapiToken()
const passport = useFanPassport()
const loading = ref(true)
const loadError = ref(false)
const memories = ref([])
const savedGalleries = ref([])
const artistCount = ref(0)
const loginTo = computed(() => ({ path: '/fan/login', query: { redirect: route.fullPath } }))
const mediaOrigin = computed(() => String(config.public.strapiUrl || '').replace(/\/$/, ''))
const usingFixture = computed(() => props.fixture && typeof props.fixture === 'object')
const shownMemories = computed(() => (
  usingFixture.value ? (props.fixture.memories || []) : memories.value
))
const shownSaved = computed(() => (
  usingFixture.value ? (props.fixture.savedGalleries || []) : savedGalleries.value
))
const shownArtistCount = computed(() => (
  usingFixture.value
    ? Number(props.fixture.artistCount || 0)
    : artistCount.value
))
const summaryLine = computed(() => passportSummaryLine({
  nightCount: shownMemories.value.length,
  artistCount: shownArtistCount.value,
  savedCount: shownSaved.value.length,
}))

watch(() => props.fixture, (fixture) => {
  if (!fixture) return
  loading.value = !!fixture.loading
  loadError.value = !!fixture.error
}, { immediate: true })

async function load() {
  if (usingFixture.value) {
    loading.value = !!props.fixture.loading
    loadError.value = !!props.fixture.error
    return
  }
  if (!user.value || !token.value) {
    memories.value = []
    savedGalleries.value = []
    artistCount.value = 0
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = false
  try {
    // Saved galleries are a second, optional source: if they fail to load,
    // the Nights still open.
    const [result, saves] = await Promise.all([
      passport.listMemories(),
      passport.listGallerySaves().catch(() => ({ galleries: [] })),
    ])
    memories.value = result.memories
    savedGalleries.value = saves.galleries || []
    artistCount.value = result.artistCount
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(token, (next, previous) => {
  if (usingFixture.value) return
  if (next && next !== previous) load()
  if (!next) {
    memories.value = []
    savedGalleries.value = []
    artistCount.value = 0
    loading.value = false
  }
})
</script>

<style scoped>
.passport-home {
  width: min(100%, 76rem);
  margin: 0 auto;
  padding: calc(var(--header-height, 70px) + 0.85rem) clamp(1.1rem, 4vw, 3.25rem) 8rem;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  overflow-x: hidden;
}
.passport-home.is-embedded { margin: 0; padding: 0 0 3rem; }
.passport-home__nav { display: flex; flex-wrap: wrap; gap: 0.15rem 1.1rem; margin: 0 0 1.1rem; }
.passport-home__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgba(247, 249, 252, 0.46);
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
}
.passport-home__nav a[aria-current='page'] { color: #f7f9fc; }
.passport-home__hero { max-width: 40rem; margin-bottom: clamp(1.6rem, 5vw, 2.6rem); }
.passport-home__eyebrow {
  margin: 0;
  color: #7ee7ff;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.passport-home__hero h1 {
  margin: 0.35rem 0 0;
  font-size: clamp(1.7rem, 6vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 0.98;
}
.passport-home__lead,
.passport-home__hero > p {
  max-width: 34rem;
  margin: 0.7rem 0 0;
  color: rgba(247, 249, 252, 0.56);
  font-size: clamp(0.92rem, 2vw, 1.05rem);
  line-height: 1.55;
}
.passport-home__meta {
  color: rgba(247, 249, 252, 0.42) !important;
  font-size: 0.82rem !important;
  letter-spacing: 0.04em;
}
.passport-home__state {
  min-height: 16rem;
  display: grid;
  place-content: center;
  justify-items: start;
  max-width: 32rem;
  color: rgba(247, 249, 252, 0.58);
}
.passport-home__state h2 {
  margin: 0;
  color: #f7f9fc;
  font-size: clamp(1.35rem, 5vw, 1.9rem);
  letter-spacing: -0.035em;
}
.passport-home__state p { margin: 0.65rem 0 0; line-height: 1.55; }
.passport-home__state.is-empty { justify-items: start; }
.passport-home__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 1rem;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 999px;
  background: #f7f9fc;
  color: #050608;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
}
.passport-home__button.is-quiet {
  background: transparent;
  color: #f7f9fc;
  box-shadow: inset 0 0 0 1px rgba(247, 249, 252, 0.22);
}
.passport-home__button:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
</style>
