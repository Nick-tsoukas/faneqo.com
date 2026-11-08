<template>
  <main class="memory-page">
    <div class="memory-page__inner">
      <NuxtLink to="/fan/passport" class="memory-page__back">← FanPassport</NuxtLink>

      <div v-if="!user" class="memory-page__state">
        <h1>This memory belongs to the people who were there.</h1>
        <p>Sign in with your Faneqo account to check access.</p>
        <NuxtLink :to="loginTo" class="memory-page__button">Sign in to view</NuxtLink>
      </div>

      <div v-else-if="loading" class="memory-page__state" role="status">Opening this night…</div>

      <div v-else-if="removed" class="memory-page__state" role="alert">
        <h1>This gallery is no longer available.</h1>
        <p>The artist removed it from Faneqo. Your saved nights and messages stay exactly as they were.</p>
      </div>

      <div v-else-if="loadError || !gallery" class="memory-page__state" role="alert">
        <h1>This gallery isn’t available to this account.</h1>
        <p>Protected show photos remain visible only to eligible fans and the artist.</p>
      </div>

      <ShowNightStory
        v-else
        v-bind="storyProps"
        :update-id="gallery.id"
        allow-passport
        allow-share
        :saved="saved"
        :saving="saving"
        :sharing="sharing"
        :action-status="actionStatus"
        @save="save"
        @remove="remove"
        @share="share"
      />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import ShowNightStory from '~/components/updates/ShowNightStory.vue'
import { nightStoryPropsFromUpdate } from '~/utils/updates/nightStoryPropsFromUpdate'
import { positivePassportId, sharePassportGallery } from '~/utils/passport/fanPassport'

definePageMeta({
  layout: 'default',
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Show memory · FanPassport',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})

const route = useRoute()
const user = useStrapiUser()
const token = useStrapiToken()
const updates = useArtistUpdates()
const passport = useFanPassport()
const gallery = ref(null)
const saved = ref(false)
const loading = ref(true)
const loadError = ref(false)
const removed = ref(false)
const saving = ref(false)
const sharing = ref(false)
const actionStatus = ref('')
const updateId = computed(() => positivePassportId(route.params.id))
const loginTo = computed(() => ({ path: '/fan/login', query: { redirect: route.fullPath } }))
const storyProps = computed(() => nightStoryPropsFromUpdate(gallery.value, { artistName: gallery.value?.band?.name }))

async function load() {
  if (!user.value || !token.value) {
    loading.value = false
    return
  }
  if (!updateId.value) {
    loadError.value = true
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = false
  removed.value = false
  try {
    const [detail, saves] = await Promise.all([
      updates.getById(updateId.value),
      passport.listGallerySaves().catch(() => ({ galleries: [] })),
    ])
    if (!detail?.data || detail.data.locked || !detail.data.media?.length) throw new Error('Gallery unavailable')
    gallery.value = detail.data
    saved.value = saves.galleries.some((row) => Number(row.gallery?.id) === updateId.value)
  } catch (error) {
    gallery.value = null
    removed.value = error?.data?.error?.name === 'gallery_unavailable'
    loadError.value = !removed.value
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!gallery.value?.id || saving.value) return
  saving.value = true
  actionStatus.value = ''
  try {
    await passport.saveGallery(gallery.value.id)
    saved.value = true
    actionStatus.value = 'Saved to your FanPassport.'
  } catch {
    actionStatus.value = 'Could not save this memory. Try again.'
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!gallery.value?.id || saving.value) return
  saving.value = true
  actionStatus.value = ''
  try {
    await passport.removeGallery(gallery.value.id)
    saved.value = false
    actionStatus.value = 'Removed from your FanPassport.'
  } catch {
    actionStatus.value = 'Could not remove this memory. Try again.'
  } finally {
    saving.value = false
  }
}

async function share() {
  if (!gallery.value?.id || sharing.value) return
  sharing.value = true
  actionStatus.value = ''
  try {
    const result = await sharePassportGallery({
      artistUpdateId: gallery.value.id,
      artistName: gallery.value.band?.name,
      city: gallery.value.show?.city,
      bandSlug: gallery.value.band?.slug,
      slug: gallery.value.slug,
    })
    actionStatus.value = result.method === 'share' ? 'Share sheet opened.' : 'Link copied.'
  } catch (error) {
    if (error?.name !== 'AbortError') actionStatus.value = error?.message || 'Could not share this memory.'
  } finally {
    sharing.value = false
  }
}

onMounted(load)
watch([token, updateId], ([nextToken, nextId], [previousToken, previousId]) => {
  if (nextToken && (nextToken !== previousToken || nextId !== previousId || !gallery.value)) load()
  if (!nextToken) {
    gallery.value = null
    loading.value = false
  }
})
</script>

<style scoped>
.memory-page { min-height: 100dvh; padding: calc(var(--header-height, 70px) + 1.25rem) 1.15rem 8rem; background: #050608; color: #f7f9fc; font-family: Poppins, ui-sans-serif, system-ui, sans-serif; }
.memory-page__inner { width: min(100%, 56rem); margin: 0 auto; }
.memory-page__back { display: inline-flex; align-items: center; min-height: 44px; margin-bottom: 1.6rem; color: rgba(247, 249, 252, 0.5); font-size: 0.82rem; text-decoration: none; }
.memory-page__state { min-height: 22rem; display: grid; place-content: center; justify-items: start; max-width: 38rem; }
.memory-page__state h1 { margin: 0; font-size: clamp(1.8rem, 6vw, 3.4rem); letter-spacing: -0.055em; line-height: 1.02; }
.memory-page__state p { margin: 0.9rem 0 0; color: rgba(247, 249, 252, 0.55); line-height: 1.55; }
.memory-page__button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; margin-top: 1.2rem; padding: 0.65rem 1rem; border-radius: 999px; background: #45e3ae; color: #041510; font-weight: 750; text-decoration: none; }
</style>
