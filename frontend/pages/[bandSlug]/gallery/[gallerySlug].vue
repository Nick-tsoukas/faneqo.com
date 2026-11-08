<template>
  <ArtistWorldMissing
    v-if="missing"
    :artist-name="fallbackArtistName"
    :artist-path="artistPath"
    :heading="unavailable ? 'This gallery is no longer available.' : 'This gallery is not available.'"
    :body="unavailable ? `${artistName} removed this gallery, so it is no longer available on Faneqo or Faneqo shared-gallery pages. Photos already downloaded, reposted, or directly cached elsewhere may remain available.` : ''"
    :back-to="missingReturn.to"
    :back-label="missingReturn.label"
    :back-text="missingReturn.to === artistPath
      ? (artistPath === '/' ? 'Back to Faneqo' : `Back to ${fallbackArtistName}`)
      : `Back to ${missingReturn.label}`"
  />
  <PublicGalleryExperience
    v-else
    :payload="payload"
    :band-slug="bandSlug"
    :return-to="route.fullPath"
    :from="route.query.from"
  />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import ArtistWorldMissing from '~/components/nights/ArtistWorldMissing.vue'
import PublicGalleryExperience from '~/components/nights/PublicGalleryExperience.vue'
import { usePublicNight } from '~/composables/usePublicNight'
import { publicShareHead, publicShareHeadTags } from '~/utils/nights/publicShareHead'
import { resolveGalleryReturn } from '~/utils/nights/artistWorldReturn'
import { artistNameFromSlug } from '~/utils/nights/nightDisplay'
import { resolveFrontendOrigin } from '~/utils/site/faneqoOrigin'

definePageMeta({ layout: 'artist-world' })

const route = useRoute()
const config = useRuntimeConfig()
const token = useStrapiToken()
const { getGallery } = usePublicNight()
const requestUrl = useRequestURL()

const bandSlug = computed(() => String(route.params.bandSlug || ''))
const gallerySlug = computed(() => String(route.params.gallerySlug || ''))
const siteOrigin = computed(() => resolveFrontendOrigin({
  configuredOrigin: config.public?.baseUrl,
  requestOrigin: requestUrl?.origin,
}))
const artistPath = computed(() => (bandSlug.value ? `/${bandSlug.value}` : '/'))
const fallbackArtistName = computed(() => artistNameFromSlug(bandSlug.value) || 'Faneqo')
const missingReturn = computed(() => resolveGalleryReturn({
  from: route.query.from,
  artistPath: artistPath.value,
  artistName: fallbackArtistName.value,
}))

const { data, error } = await useAsyncData(
  `public-gallery:${bandSlug.value}:${gallerySlug.value}`,
  () => getGallery({ bandSlug: bandSlug.value, gallerySlug: gallerySlug.value }),
)

const fatal = error.value && Number(error.value.statusCode || error.value.status || 500) !== 404
if (fatal) {
  throw createError({
    statusCode: Number(error.value.statusCode || error.value.status || 500),
    statusMessage: 'Could not load this gallery',
    fatal: true,
  })
}

// The artist took this gallery down. A designed answer, not a broken link.
const unavailable = data.value?.unavailable === true
const missing = !data.value?.gallery
const artistName = computed(() => data.value?.artist?.name || fallbackArtistName.value)
if (missing && import.meta.server) setResponseStatus(unavailable ? 410 : 404)

const payload = ref(data.value)

async function refreshAuthed() {
  if (!token.value || missing) return
  try {
    const next = await getGallery({
      bandSlug: bandSlug.value,
      gallerySlug: gallerySlug.value,
      authenticated: true,
    })
    if (next?.gallery) payload.value = next
  } catch {
    // Anonymous SSR payload stays the safe baseline.
  }
}

onMounted(refreshAuthed)
watch(token, refreshAuthed)

const seo = computed(() => publicShareHead({
  share: payload.value?.share,
  origin: siteOrigin.value,
}))
useHead(() => {
  if (unavailable) {
    return {
      title: 'This gallery is no longer available.',
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    }
  }
  if (missing) return { title: 'This gallery is not available.' }
  return publicShareHeadTags(seo.value)
})
</script>

<style scoped>
</style>
