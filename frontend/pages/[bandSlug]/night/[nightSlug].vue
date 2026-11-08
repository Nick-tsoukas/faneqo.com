<template>
  <ArtistWorldMissing
    v-if="missing"
    :artist-name="fallbackArtistName"
    :artist-path="artistPath"
    heading="This night is not available."
    :back-to="missingReturn.to"
    :back-label="missingReturn.label"
    :back-text="missingReturn.to === artistPath
      ? (artistPath === '/' ? 'Back to Faneqo' : `Back to ${fallbackArtistName}`)
      : `Back to ${missingReturn.label}`"
  />
  <PublicNightExperience
    v-else
    :payload="payload"
    :band-slug="bandSlug"
    :sharing="sharing"
    :share-status="shareStatus"
    :from="route.query.from"
    @share="shareNight"
  />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import ArtistWorldMissing from '~/components/nights/ArtistWorldMissing.vue'
import PublicNightExperience from '~/components/nights/PublicNightExperience.vue'
import { usePublicNight } from '~/composables/usePublicNight'
import { publicShareHead, publicShareHeadTags } from '~/utils/nights/publicShareHead'
import { mergePublicNightRefresh } from '~/utils/nights/publicNightHero'
import { resolveNightReturn } from '~/utils/nights/artistWorldReturn'
import { artistNameFromSlug } from '~/utils/nights/nightDisplay'
import { shareFaneqoUrl } from '~/utils/share/faneqoShare'
import { resolveFrontendOrigin } from '~/utils/site/faneqoOrigin'

definePageMeta({ layout: 'artist-world' })

const route = useRoute()
const config = useRuntimeConfig()
const token = useStrapiToken()
const { getNight } = usePublicNight()
const requestUrl = useRequestURL()

const bandSlug = computed(() => String(route.params.bandSlug || ''))
const nightSlug = computed(() => String(route.params.nightSlug || ''))
const siteOrigin = computed(() => resolveFrontendOrigin({
  configuredOrigin: config.public?.baseUrl,
  requestOrigin: requestUrl?.origin,
}))
const artistPath = computed(() => (bandSlug.value ? `/${bandSlug.value}` : '/'))
const fallbackArtistName = computed(() => artistNameFromSlug(bandSlug.value) || 'Faneqo')
const missingReturn = computed(() => resolveNightReturn({
  from: route.query.from,
  artistPath: artistPath.value,
  artistName: fallbackArtistName.value,
}))

const { data, error } = await useAsyncData(
  `public-night:${bandSlug.value}:${nightSlug.value}`,
  () => getNight({ bandSlug: bandSlug.value, nightSlug: nightSlug.value }),
)

const fatal = error.value && Number(error.value.statusCode || error.value.status || 500) !== 404
if (fatal) {
  throw createError({
    statusCode: Number(error.value.statusCode || error.value.status || 500),
    statusMessage: 'Could not load this night',
    fatal: true,
  })
}

const missing = !data.value?.night
if (missing && import.meta.server) setResponseStatus(404)

const payload = ref(data.value)
const sharing = ref(false)
const shareStatus = ref('')

async function refreshAuthed() {
  if (!token.value || missing) return
  try {
    const next = await getNight({
      bandSlug: bandSlug.value,
      nightSlug: nightSlug.value,
      authenticated: true,
    })
    if (next?.night) payload.value = mergePublicNightRefresh(payload.value, next)
  } catch {
    // Anonymous SSR payload stays the safe baseline.
  }
}

async function shareNight() {
  if (sharing.value || !payload.value?.share) return
  sharing.value = true
  shareStatus.value = ''
  try {
    const share = payload.value.share
    const result = await shareFaneqoUrl({
      title: share.title,
      text: share.description,
      canonicalPath: share.canonicalPath,
      origin: siteOrigin.value,
    })
    shareStatus.value = result.method === 'share' ? 'Share sheet opened.' : 'Link copied.'
  } catch (err) {
    if (err?.name !== 'AbortError') {
      shareStatus.value = err?.message || 'Could not share this night.'
    }
  } finally {
    sharing.value = false
  }
}

onMounted(refreshAuthed)
watch(token, refreshAuthed)

const seo = computed(() => publicShareHead({
  share: payload.value?.share,
  origin: siteOrigin.value,
}))
useHead(() => (missing ? { title: 'This night is not available.' } : publicShareHeadTags(seo.value)))
</script>

<style scoped>
</style>
