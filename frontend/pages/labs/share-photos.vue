<template>
  <div class="share-photos">
    <p class="share-photos__labs">Labs</p>
    <div v-if="loading" class="share-photos__boot">Opening tonight…</div>
    <div v-else-if="denied" class="share-photos__boot" role="alert">
      <p>{{ denied }}</p>
      <NuxtLink :to="backTo" class="share-photos__back">Back</NuxtLink>
    </div>
    <ArtistUpdateComposer
      v-else-if="!published && recap"
      mode="show-photos"
      :band-id="bandId"
      :band-name="bandName"
      :event-id="recapEventId"
      :show-recap-id="recap.id"
      :city="recap.city || ''"
      :venue="recap.venue || ''"
      :show-date="recap.showStartedAt || recap.recapGeneratedAt || ''"
      :time-zone="recap.timezone || ''"
      :show-label="recap.showTitle || recap.city || ''"
      :back-to="backTo"
      @published="onPublished"
    />
    <div v-else-if="published" class="share-photos__done">
      <ShowNightStory
        v-bind="storyProps"
        :update-id="published.id"
        allow-share
        :sharing="sharing"
        :action-status="actionStatus"
        @share="sharePublished"
      />
      <p class="share-photos__quiet">People from tonight can see this memory.</p>
      <NuxtLink :to="backTo" class="share-photos__return">Back to Show Recap</NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ArtistUpdateComposer from '~/components/updates/ArtistUpdateComposer.vue'
import ShowNightStory from '~/components/updates/ShowNightStory.vue'
import { useShowRecaps } from '~/composables/useShowRecaps'
import { nightStoryPropsFromUpdate } from '~/utils/updates/nightStoryPropsFromUpdate'
import { sharePassportGallery } from '~/utils/passport/fanPassport'
import { recapIdFrom, safeSharePhotosReturnPath } from '~/utils/updates/sharePhotosFromRecap'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({ title: 'Share photos from tonight' })

const route = useRoute()
const { getRecapDetail } = useShowRecaps()
const loading = ref(true)
const denied = ref('')
const recap = ref(null)
const published = ref(null)
const bandName = ref('')
const sharing = ref(false)
const actionStatus = ref('')

const recapId = computed(() => recapIdFrom({ id: route.query.recapId }))
const backTo = computed(() => safeSharePhotosReturnPath(route.query.from, recapId.value || recap.value?.id))
const bandId = computed(() => recap.value?.band?.id || recap.value?.band || null)
const recapEventId = computed(() => {
  const id = parseInt(recap.value?.eventId, 10)
  return Number.isFinite(id) && id > 0 ? id : null
})
const storyProps = computed(() => nightStoryPropsFromUpdate(published.value, { artistName: bandName.value }))

onMounted(async () => {
  if (!recapId.value) {
    denied.value = 'Open this from a Show Recap.'
    loading.value = false
    return
  }
  try {
    const row = await getRecapDetail(recapId.value)
    if (!row?.id) {
      denied.value = 'This recap isn’t available for this artist.'
      return
    }
    recap.value = row
    bandName.value = row.band?.name || ''
  } catch {
    denied.value = 'This recap isn’t available for this artist.'
  } finally {
    loading.value = false
  }
})

function onPublished(row) {
  published.value = row
  if (row?.band?.name) bandName.value = row.band.name
}

async function sharePublished() {
  if (!published.value?.id || sharing.value) return
  sharing.value = true
  actionStatus.value = ''
  try {
    const result = await sharePassportGallery({
      artistUpdateId: published.value.id,
      artistName: published.value.band?.name || bandName.value,
      city: published.value.show?.city,
      bandSlug: published.value.band?.slug,
      slug: published.value.slug,
    })
    actionStatus.value = result.method === 'share' ? 'Share sheet opened.' : 'Link copied.'
  } catch (error) {
    if (error?.name !== 'AbortError') actionStatus.value = error?.message || 'Could not share this memory.'
  } finally {
    sharing.value = false
  }
}
</script>

<style scoped>
.share-photos {
  min-height: 100dvh;
  padding: calc(var(--header-height, 70px) + 0.35rem) 0 2.5rem;
  background: #050608;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.share-photos__labs {
  max-width: 36rem;
  margin: 0 auto;
  padding: 0 1rem;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.38);
}
.share-photos__boot {
  max-width: 36rem;
  margin: 0 auto;
  padding: 3rem 1rem;
  text-align: center;
  color: rgba(247, 249, 252, 0.55);
}
.share-photos__back,
.share-photos__return {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  margin-top: 1rem;
  color: rgba(247, 249, 252, 0.7);
  text-decoration: none;
}
.share-photos__done {
  max-width: 54rem;
  margin: 0 auto;
  padding: 0.5rem 1.15rem 2rem;
}
.share-photos__quiet {
  margin: 1.15rem 0 0;
  font-size: 0.92rem;
  color: rgba(247, 249, 252, 0.55);
}
.share-photos__return {
  margin-top: 1.15rem;
}
</style>
