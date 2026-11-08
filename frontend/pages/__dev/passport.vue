<template>
  <main class="dev">
    <p class="dev__note">Local fixture. Production Passport is /fan/passport.</p>
    <nav class="dev__nav" aria-label="Passport fixtures">
      <NuxtLink
        v-for="item in PASSPORT_LAB_STATES"
        :key="item"
        :to="{ path: '/__dev/passport', query: { state: item } }"
        :class="{ 'is-current': state === item }"
      >
        {{ item }}
      </NuxtLink>
    </nav>
    <section v-if="detail" class="dev__legacy">
      <p class="dev__kicker">Fixture only</p>
      <h2>Night detail is Public Night now.</h2>
      <p>Passport is the relationship index. Open the canonical Night from a memory on the real route.</p>
      <NuxtLink v-if="detailHref" :to="detailHref">Open canonical Night</NuxtLink>
      <NuxtLink to="/fan/passport">Real Passport</NuxtLink>
    </section>
    <FanPassportHome
      v-else
      embedded
      :fixture="home"
    />
  </main>
</template>

<script setup>
import { computed } from 'vue'
import FanPassportHome from '~/components/passport/FanPassportHome.vue'
import {
  isPassportLabDetail,
  PASSPORT_LAB_STATES,
  passportLabDetailFixture,
  passportLabHomeFixture,
} from '~/config/passportLab'
import { passportMemoryHref } from '~/utils/passport/passportPresentation'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const state = computed(() => {
  const raw = String(route.query.state || 'three').trim()
  return PASSPORT_LAB_STATES.includes(raw) ? raw : 'three'
})
const detail = computed(() => (
  isPassportLabDetail(state.value) ? passportLabDetailFixture(state.value) : null
))
const detailHref = computed(() => (
  detail.value?.memory ? passportMemoryHref(detail.value.memory) : ''
))
const home = computed(() => passportLabHomeFixture(state.value))
</script>

<style scoped>
.dev {
  min-height: 100dvh;
  padding: 1.2rem clamp(1rem, 4vw, 3rem) 4rem;
  background: #050608;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.dev__note {
  margin: 0 0 0.8rem;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.75rem;
}
.dev__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.85rem;
  margin-bottom: 1.6rem;
}
.dev__nav a {
  color: rgba(247, 249, 252, 0.46);
  font-size: 0.75rem;
  text-decoration: none;
}
.dev__nav a.is-current { color: #f7f9fc; }
.dev__legacy { max-width: 36rem; padding: 2rem 0; }
.dev__kicker {
  margin: 0 0 0.7rem;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.dev__legacy h2 {
  margin: 0;
  font-size: clamp(1.7rem, 5vw, 2.6rem);
  letter-spacing: -0.045em;
}
.dev__legacy p {
  margin: 0.9rem 0 1.4rem;
  color: rgba(247, 249, 252, 0.55);
  line-height: 1.55;
}
.dev__legacy a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-right: 1.2rem;
  color: #f7f9fc;
  text-decoration: none;
}
</style>
