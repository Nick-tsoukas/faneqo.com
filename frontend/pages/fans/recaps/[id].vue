<template>
  <div class="ar-page">
    <nav class="ar-page__chrome" aria-label="Night">
      <NuxtLink
        :to="backTo.path"
        class="ar-page__icon"
        :aria-label="`Back to ${backTo.label}`"
      >
        <ArrowLeft :size="20" :stroke-width="1.75" />
      </NuxtLink>
      <button
        v-if="canShare"
        type="button"
        class="ar-page__icon"
        aria-label="Share Night"
        @click="content?.openShare()"
      >
        <Share2 :size="18" :stroke-width="1.75" />
      </button>
    </nav>

    <div v-if="loading" class="ar-page__state">Loading this night…</div>
    <div v-else-if="!recap" class="ar-page__state">
      <h1>{{ error || 'This night is not available.' }}</h1>
      <NuxtLink :to="backTo.path">{{ backTo.label }}</NuxtLink>
    </div>
    <ShowRecapDetailContent
      v-else
      ref="content"
      v-model:recap="recap"
      :auto-open-message="autoOpenMessage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Share2 } from '@lucide/vue'
import ShowRecapDetailContent from '~/components/dashboard/fans/ShowRecapDetailContent.vue'
import { nightPathFromRecap } from '~/utils/nights/publicNightPaths'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const { getRecapDetail } = useShowRecaps()

const loading = ref(true)
const error = ref('')
const recap = ref(null)
const content = ref(null)
const autoOpenMessage = computed(() => route.query.message === '1')
const canShare = computed(() => !!nightPathFromRecap(recap.value))

const backTo = computed(() => {
  if (route.query.from === 'dashboard') return { path: '/dashboard', label: 'Dashboard' }
  if (route.query.from === 'fans') return { path: '/fans', label: 'Fan Analytics' }
  return { path: '/fans/recaps', label: 'Nights' }
})

onMounted(async () => {
  try {
    recap.value = await getRecapDetail(route.params.id)
    if (!recap.value) error.value = 'We could not find that night.'
  } catch (err) {
    const status = Number(err?.status || err?.statusCode)
    error.value = status === 401
      ? 'Please sign in again to view this night.'
      : 'Something went wrong loading this night.'
  } finally {
    loading.value = false
  }
})

useHead(() => ({
  title: recap.value?.venue || recap.value?.showTitle || 'Night',
  meta: [{ name: 'robots', content: 'noindex' }],
}))
</script>

<style scoped>
.ar-page {
  position: relative;
  min-height: 100dvh;
  padding-top: 0;
  overflow-x: clip;
  background: #050506;
  color: #f5f5f6;
}
@media (max-width: 1023px) {
  .ar-page {
    padding-bottom: calc(1.15rem + env(safe-area-inset-bottom, 0px));
  }
}
.ar-page__chrome {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 8;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: calc(0.7rem + env(safe-area-inset-top, 0px)) 0.85rem 0.7rem;
  pointer-events: none;
}
.ar-page__chrome::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4.25rem;
  background: linear-gradient(180deg, rgba(5, 5, 6, 0.28) 0%, transparent 100%);
  pointer-events: none;
}
.ar-page__icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  pointer-events: auto;
  border: 0;
  border-radius: 999px;
  background: rgba(5, 5, 6, 0.52);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  color: rgba(245, 245, 246, 0.92);
  text-decoration: none;
  cursor: pointer;
}
.ar-page__icon:hover,
.ar-page__icon:focus-visible {
  color: #fff;
  background: rgba(5, 5, 6, 0.62);
}
.ar-page__state {
  max-width: 40rem;
  margin: 0 auto;
  padding: 4.5rem 1.25rem 3rem;
}
.ar-page__state h1 {
  margin: 0 0 1rem;
  font-size: clamp(1.8rem, 7vw, 2.6rem);
  letter-spacing: -0.04em;
}
.ar-page__icon:focus-visible,
.ar-page__state a:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 1024px) {
  .ar-page { padding-top: var(--header-height, 70px); }
  .ar-page__chrome { top: var(--header-height, 70px); }
}
</style>
