<template>
  <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
  <section v-if="false" class="aus" aria-labelledby="aus-title">
    <p class="aus__kicker">From the band</p>
    <h2 id="aus-title">Latest</h2>
    <article v-for="item in items" :key="item.id" class="aus__card">
      <div class="aus__meta">
        <h3>{{ item.title || item.show?.city || 'Photos' }}</h3>
        <p>{{ metaLine(item) }}</p>
        <p v-if="item.youWereThere" class="aus__there">✓ You were there</p>
      </div>
      <div v-if="item.locked" class="aus__lock">
        <p class="aus__lock-kicker">{{ lockTitle(item) }}</p>
        <p>{{ lockCopy(item) }}</p>
        <NuxtLink to="/fan" class="aus__link">Verify / create your free account</NuxtLink>
      </div>
      <template v-else>
        <FaneqoMediaGrid
          :items="previewMedia(item)"
          variant="gallery"
          @open="({ index }) => openItem(item, index)"
        />
        <NuxtLink :to="`/${bandSlug}/gallery/${item.slug}`" class="aus__link">View Gallery →</NuxtLink>
      </template>
    </article>
        <FaneqoMediaLightbox
      :open="!!lightbox"
      :items="lightbox?.items || []"
      :start-index="lightbox?.index || 0"
      :title="bandName"
      zoomable
      @close="lightbox = null"
    />
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import FaneqoMediaGrid from '~/components/media/FaneqoMediaGrid.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import { useArtistUpdates } from '~/composables/useArtistUpdates'
import { artistUpdateUiLog } from '~/utils/media/mediaUiLog'

const props = defineProps({
  bandId: { type: [String, Number], default: null },
  bandSlug: { type: String, required: true },
  bandName: { type: String, default: '' },
})

const { listForBand } = useArtistUpdates()
const token = useStrapiToken()
const items = ref([])
const lightbox = ref(null)

async function load() {
  try {
    const result = await listForBand({ bandId: props.bandId, bandSlug: props.bandSlug })
    items.value = result?.data?.updates || []
    if (items.value.length) artistUpdateUiLog('gallery:view', { bandId: props.bandId, count: items.value.length })
  } catch {
    items.value = []
  }
}

onMounted(load)
watch(token, load)

function previewMedia(item) {
  return item.media || []
}

function metaLine(item) {
  const date = item.publishedAt || item.show?.date
  const when = date
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date))
    : ''
  const count = item.photoCount ? `${item.photoCount} photos` : ''
  return [item.show?.city, when, count].filter(Boolean).join(' · ')
}

function lockTitle(item) {
  if (item.visibility === 'show_attendees') return item.show?.city ? `${item.show.city}` : 'Show Gallery'
  return 'Fan List Exclusive'
}

function lockCopy(item) {
  if (item.lockReason === 'account_required') {
    return 'Photos from this show are waiting. Verify / create your free Faneqo account to view them.'
  }
  if (item.visibility === 'show_attendees') {
    return 'Photos from this show are available to fans who were there.'
  }
  return 'Join / verify to view.'
}

function openItem(item, index) {
  artistUpdateUiLog('gallery:image_open', { updateId: item.id })
  lightbox.value = { items: item.media || [], index }
}
</script>

<style scoped>
.aus { margin: 2.5rem 0 1rem; color: #fff; }
.aus__kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(57, 255, 20, 0.8);
}
.aus h2 { margin: 0.2rem 0 1.15rem; font-size: 1.45rem; font-weight: 750; letter-spacing: -0.03em; }
.aus__card {
  margin-bottom: 1.6rem;
  padding: 0 0 0.25rem;
  border-radius: 0;
  border: 0;
  background: transparent;
}
.aus__meta h3 { margin: 0; font-size: 1.05rem; }
.aus__meta p { margin: 0.25rem 0 0; color: rgba(255,255,255,0.5); font-size: 0.82rem; }
.aus__there { color: #39ff14 !important; font-weight: 700; }
.aus__lock { margin-top: 0.75rem; color: rgba(255,255,255,0.62); }
.aus__lock-kicker { font-weight: 750; color: #fff; }
.aus__link { display: inline-block; margin-top: 0.7rem; color: #39ff14; text-decoration: none; font-weight: 650; }
</style>
