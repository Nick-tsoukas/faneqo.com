<template>
  <main class="night-page">
    <div class="night-page__inner">
      <NuxtLink to="/fan/passport" class="night-page__back">← Passport</NuxtLink>

      <div v-if="!user" class="night-page__state">
        <h1>Sign in to open your Passport.</h1>
        <p>This address is a memory index. The Night itself lives on the public Night.</p>
        <NuxtLink :to="loginTo" class="night-page__button">Sign in</NuxtLink>
      </div>

      <div v-else-if="loading || redirecting" class="night-page__state" role="status">Opening this night…</div>

      <div v-else-if="loadError || !memory" class="night-page__state" role="alert">
        <h1>This memory isn’t available to this account.</h1>
        <p>Passport only shows nights you attended.</p>
        <button type="button" class="night-page__button" @click="resolve">Try again</button>
      </div>

      <div v-else class="night-page__state">
        <p class="night-page__legacy">Legacy memory</p>
        <h1>This Night isn’t published yet.</h1>
        <p>It’s still in your Passport. The public Night will open here once the artist publishes it.</p>
        <NuxtLink to="/fan/passport" class="night-page__button">Back to Passport</NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { fanLoginLocation } from '~/utils/fan/safeFanReturnTo'
import { withSafeFrom } from '~/utils/nights/artistWorldReturn'
import { PASSPORT_HOME_PATH, publicNightPathFromMemory } from '~/utils/passport/passportPresentation'
import { positivePassportId } from '~/utils/passport/fanPassport'

definePageMeta({
  layout: 'default',
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Show memory · Passport',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})

const route = useRoute()
const user = useStrapiUser()
const token = useStrapiToken()
const passport = useFanPassport()
const memory = ref(null)
const loading = ref(true)
const redirecting = ref(false)
const loadError = ref(false)
const attendanceId = computed(() => positivePassportId(route.params.id))
const loginTo = computed(() => fanLoginLocation(PASSPORT_HOME_PATH))

async function resolve() {
  if (!user.value || !token.value) {
    loading.value = false
    return
  }
  if (!attendanceId.value) {
    loadError.value = true
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = false
  try {
    const next = await passport.getMemory(attendanceId.value)
    if (!next) throw new Error('Memory unavailable')
    memory.value = next
    const publicPath = publicNightPathFromMemory(next)
    if (publicPath) {
      redirecting.value = true
      await navigateTo(withSafeFrom(publicPath, PASSPORT_HOME_PATH), { replace: true })
      return
    }
  } catch {
    memory.value = null
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(resolve)
watch([token, attendanceId], ([nextToken, nextId], [previousToken, previousId]) => {
  if (nextToken && (nextToken !== previousToken || nextId !== previousId || !memory.value)) resolve()
  if (!nextToken) {
    memory.value = null
    loading.value = false
  }
})
</script>

<style scoped>
.night-page {
  min-height: 100dvh;
  padding: calc(var(--header-height, 70px) + 1.15rem) clamp(1.1rem, 4vw, 3rem) 8rem;
  background: #050608;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  overflow-x: hidden;
}
.night-page__inner { width: min(100%, 52rem); margin: 0 auto; }
.night-page__back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: 1.4rem;
  color: rgba(247, 249, 252, 0.5);
  font-size: 0.82rem;
  text-decoration: none;
}
.night-page__back:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
.night-page__state { min-height: 22rem; display: grid; place-content: center; justify-items: start; max-width: 36rem; }
.night-page__legacy {
  margin: 0 0 0.65rem;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.night-page__state h1 { margin: 0; font-size: clamp(1.7rem, 6vw, 3rem); letter-spacing: -0.05em; line-height: 1.02; }
.night-page__state p { margin: 0.9rem 0 0; color: rgba(247, 249, 252, 0.55); line-height: 1.55; }
.night-page__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 1.2rem;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 999px;
  background: #f7f9fc;
  color: #050608;
  font: inherit;
  font-weight: 750;
  text-decoration: none;
  cursor: pointer;
}
.night-page__button:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
</style>
