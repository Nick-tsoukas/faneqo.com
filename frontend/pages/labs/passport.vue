<template>
  <LabsShell title="Fan Passport · Relationship journal" wide>
    <nav class="passport-lab__nav" aria-label="Passport lab states">
      <NuxtLink
        v-for="item in PASSPORT_LAB_STATES"
        :key="item"
        :to="{ path: '/labs/passport', query: { state: item } }"
        :class="{ 'is-current': state === item }"
      >
        {{ item }}
      </NuxtLink>
    </nav>

    <section v-if="detail" class="passport-lab__legacy">
      <p class="passport-lab__kicker">Labs fixture</p>
      <h2>Night detail is Public Night now.</h2>
      <p>Passport is the relationship index. The canonical fan Night is <code>/:bandSlug/night/:nightSlug</code>.</p>
      <NuxtLink v-if="detailHref" :to="detailHref">Open canonical Night</NuxtLink>
      <NuxtLink to="/fan/passport">Real Passport</NuxtLink>
    </section>
    <FanPassportHome
      v-else
      embedded
      :fixture="home"
    />
  </LabsShell>
</template>

<script setup>
import { computed } from 'vue'
import FanPassportHome from '~/components/passport/FanPassportHome.vue'
import LabsShell from '~/components/labs/LabsShell.vue'
import {
  isPassportLabDetail,
  PASSPORT_LAB_STATES,
  passportLabDetailFixture,
  passportLabHomeFixture,
} from '~/config/passportLab'
import { passportMemoryHref } from '~/utils/passport/passportPresentation'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Fan Passport',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})

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
.passport-lab__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.85rem;
  margin: 0 0 1.6rem;
}
.passport-lab__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  color: rgba(247, 249, 252, 0.46);
  font-size: 0.75rem;
  text-decoration: none;
}
.passport-lab__nav a.is-current { color: #f7f9fc; }
.passport-lab__legacy {
  max-width: 36rem;
  padding: 2rem 0 4rem;
}
.passport-lab__kicker {
  margin: 0 0 0.7rem;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.passport-lab__legacy h2 {
  margin: 0;
  font-size: clamp(1.7rem, 5vw, 2.6rem);
  letter-spacing: -0.045em;
  line-height: 1.05;
}
.passport-lab__legacy p {
  margin: 0.9rem 0 1.4rem;
  color: rgba(247, 249, 252, 0.55);
  line-height: 1.55;
}
.passport-lab__legacy a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-right: 1.2rem;
  color: #f7f9fc;
  text-decoration: none;
}
</style>
