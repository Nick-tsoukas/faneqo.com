<template>
  <ArtistWorldMissing
    v-if="missing"
    :artist-name="fallbackName"
    heading="These galleries are not available."
    :back-to="'/'"
    back-label="Faneqo"
    back-text="Back to Faneqo"
  />
  <PublicGalleryIndex
    v-else
    :artist="payload?.artist"
    :galleries="payload?.galleries || []"
    :band-slug="bandSlug"
  />
</template>

<script setup>
import { computed } from 'vue'
import ArtistWorldMissing from '~/components/nights/ArtistWorldMissing.vue'
import PublicGalleryIndex from '~/components/nights/PublicGalleryIndex.vue'
import { usePublicNight } from '~/composables/usePublicNight'
import { artistNameFromSlug } from '~/utils/nights/nightDisplay'

definePageMeta({ layout: 'artist-world' })

const route = useRoute()
const { listGalleries } = usePublicNight()
const bandSlug = computed(() => String(route.params.bandSlug || ''))
const fallbackName = computed(() => artistNameFromSlug(bandSlug.value) || 'Faneqo')

const { data, error } = await useAsyncData(
  `public-gallery-archive:${bandSlug.value}`,
  () => listGalleries({ bandSlug: bandSlug.value }),
)

const missing = !data.value?.artist
const payload = data.value
if (missing && import.meta.server) {
  const status = Number(error.value?.statusCode || error.value?.status || 404)
  setResponseStatus(status === 404 ? 404 : 500)
}

const titleName = computed(() => payload?.artist?.name || fallbackName.value)
useHead(() => {
  if (missing) return { title: 'Galleries are not available.' }
  const empty = !payload?.galleries?.length
  return {
    title: `${titleName.value} · Galleries`,
    meta: empty ? [{ name: 'robots', content: 'noindex' }] : [],
  }
})
</script>
