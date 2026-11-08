<template>
  <article v-if="memory" class="pnd">
    <p class="pnd__artist">{{ artistName }}</p>
    <p v-if="ordinalLine" class="pnd__ordinal">{{ ordinalLine }}</p>
    <h1 class="pnd__title">{{ title }}</h1>
    <p v-if="venue" class="pnd__venue">{{ venue }}</p>
    <p v-if="placeLine" class="pnd__place">{{ placeLine }}</p>
    <p v-if="dateLine" class="pnd__date">{{ dateLine }}</p>
    <p class="pnd__there">
      <span aria-hidden="true">✓</span>
      You were there
    </p>

    <div v-if="heroUrl" class="pnd__hero">
      <img :src="heroUrl" :alt="title" fetchpriority="high">
    </div>

    <section v-if="story" class="pnd__section">
      <h2>The story</h2>
      <p class="pnd__story">{{ story }}</p>
    </section>

    <section v-if="lineup.length" class="pnd__section">
      <h2>On stage</h2>
      <ul class="pnd__lineup">
        <li
          v-for="(row, index) in lineup"
          :key="row.bandId || row.name || index"
          :class="`is-${lineupBillingTier(row.role)}`"
        >
          <span class="pnd__act">{{ row.name }}</span>
          <span v-if="row.role" class="pnd__role">{{ lineupRoleLabel(row.role) }}</span>
        </li>
      </ul>
    </section>

    <aside v-if="posterUrl" class="pnd__poster">
      <button type="button" class="pnd__poster-btn" aria-label="View Night poster" @click="openPoster">
        <img :src="posterUrl" :alt="`${title} night poster`">
      </button>
      <div>
        <p class="pnd__poster-label">Night poster</p>
        <button type="button" class="pnd__text" @click="openPoster">View poster</button>
      </div>
    </aside>

    <section v-if="galleries.length" class="pnd__from">
      <h2>From the night</h2>
      <ul class="pnd__chapters">
        <li v-for="gallery in galleries" :key="gallery.slug || gallery.id || gallery.title">
          <div v-if="chapterCanStack(gallery)" class="pnd__chapter is-stack">
            <FaneqoGalleryStack
              :media="gallery.media"
              :title="gallery.title || 'Photos'"
              :count="gallery.photoCount"
              size="archive"
              :priority="gallery === galleries[0]"
              :active-index="stackIndexFor(gallery)"
              @update:active-index="onStackIndex(gallery, $event)"
              @activate="openGallery(gallery, $event)"
            />
            <button type="button" class="pnd__chapter-copy" @click="openGallery(gallery)">
              <span class="pnd__chapter-title">{{ gallery.title || 'Photos' }}</span>
              <span v-if="galleryCount(gallery)" class="pnd__chapter-count">{{ galleryCount(gallery) }}</span>
            </button>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="historyLine" class="pnd__history">
      <h2>Part of your history</h2>
      <p>{{ historyLine }}</p>
    </section>

    <nav class="pnd__continue" aria-label="Continue">
      <NuxtLink v-if="artistHref" :to="artistHref" class="pnd__primary">
        View {{ artistName }}
      </NuxtLink>
      <NuxtLink v-if="publicHref" :to="publicHref" class="pnd__quiet">
        View public Night →
      </NuxtLink>
      <button
        v-if="canShare"
        type="button"
        class="pnd__quiet"
        :disabled="sharing"
        @click="$emit('share')"
      >
        {{ sharing ? 'Opening…' : 'Share Night' }}
      </button>
    </nav>
    <p v-if="shareStatus" class="pnd__status" role="status">{{ shareStatus }}</p>

    <FaneqoMediaLightbox
      :open="lightboxOpen"
      :items="lightboxItems"
      :start-index="0"
      :title="lightboxTitle"
      zoomable
      @close="lightboxOpen = false"
    />
    <NightGalleryViewer
      :open="!!activeGallery"
      :gallery="activeGallery"
      :share-path="activeGalleryPath"
      public-experience
      :artist-name="artistName"
      :artist-path="artistHref"
      :artist-image="artistImage"
      :place-line="placeLine"
      :night-date="dateLine"
      :you-were-there="true"
      :start-index="activeGalleryStartIndex"
      :auto-open-lightbox="activeGalleryAutoOpen"
      @close="closeGallery"
    />
  </article>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import NightGalleryViewer from '~/components/nights/NightGalleryViewer.vue'
import { lineupBillingTier, lineupRoleLabel } from '~/utils/nights/artistRecap'
import { galleryPath } from '~/utils/nights/publicNightPaths'
import { uniqueNightGalleries } from '~/utils/nights/nightDisplay'
import { nightStoryCountLine } from '~/utils/updates/nightStoryCopy'
import { rememberStackIndex, recalledStackIndex } from '~/utils/galleries/stackBrowseMemory'
import { authorizedStackIndex, resolveNightGalleryOpen } from '~/utils/galleries/stackOpenNavigation'
import { absolutePublicMediaUrl } from '~/utils/passport/fanPassport'
import {
  artistPathFromMemory,
  publicNightPathFromMemory,
  passportNightDate,
  passportNightPlace,
  passportNightTitle,
  passportNightVenue,
  relationshipHistoryLine,
  yourNightOrdinalCopy,
} from '~/utils/passport/passportPresentation'

const props = defineProps({
  memory: { type: Object, required: true },
  publicNight: { type: Object, default: null },
  galleries: { type: Array, default: () => [] },
  mediaOrigin: { type: String, default: '' },
  sharing: { type: Boolean, default: false },
  shareStatus: { type: String, default: '' },
})

defineEmits(['share'])

const lightboxOpen = ref(false)
const lightboxItems = ref([])
const lightboxTitle = ref('')
const activeGallerySlug = ref('')
const activeGalleryStartIndex = ref(0)
const activeGalleryAutoOpen = ref(false)
const stackIndexes = reactive({})

const artistName = computed(() => String(props.memory?.artist?.name || props.publicNight?.artist?.name || 'Artist').trim())
const title = computed(() => {
  const fromPublic = String(props.publicNight?.night?.title || '').trim()
  return fromPublic || passportNightTitle(props.memory)
})
const venue = computed(() => {
  const fromPublic = String(props.publicNight?.night?.venue || '').trim()
  if (fromPublic && fromPublic !== title.value) return fromPublic
  return passportNightVenue(props.memory)
})
const placeLine = computed(() => {
  const city = String(props.publicNight?.night?.city || '').trim()
  return city || passportNightPlace(props.memory)
})
const dateLine = computed(() =>
  passportNightDate({
    show: {
      date: props.publicNight?.night?.date || props.memory?.show?.date,
    },
    checkedInAt: props.memory?.checkedInAt,
  })
)
const ordinalLine = computed(() => yourNightOrdinalCopy({
  showOrdinal: props.memory?.showOrdinal
    ?? props.memory?.relationship?.showOrdinal
    ?? props.publicNight?.viewer?.showOrdinal,
  artistName: artistName.value,
}))
const historyLine = computed(() => relationshipHistoryLine({
  showOrdinal: props.memory?.showOrdinal
    ?? props.memory?.relationship?.showOrdinal
    ?? props.publicNight?.viewer?.showOrdinal,
  artistName: artistName.value,
}) || 'You were there.')
const story = computed(() =>
  String(props.publicNight?.night?.publicStory || props.memory?.night?.publicStory || '').trim()
)
const lineup = computed(() => {
  const rows = props.publicNight?.night?.lineup || props.memory?.night?.lineup || []
  return Array.isArray(rows) ? rows.filter((row) => String(row?.name || '').trim()) : []
})
const heroUrl = computed(() => {
  const raw = props.publicNight?.night?.hero?.url
    || props.memory?.night?.heroUrl
    || (props.memory?.artwork?.source === 'night_hero' ? props.memory?.artwork?.url : '')
  return absolutePublicMediaUrl(raw, props.mediaOrigin)
})
const posterUrl = computed(() => {
  const raw = props.publicNight?.night?.cover?.url
    || props.memory?.night?.posterUrl
    || (props.memory?.artwork?.source === 'night_poster' ? props.memory?.artwork?.url : '')
  if (!raw || raw === heroUrl.value) return ''
  return absolutePublicMediaUrl(raw, props.mediaOrigin)
})
const galleries = computed(() => {
  if (Array.isArray(props.publicNight?.galleries) && props.publicNight.galleries.length) {
    return uniqueNightGalleries(props.publicNight.galleries)
  }
  return uniqueNightGalleries(props.galleries)
})
const artistHref = computed(() => artistPathFromMemory(props.memory) || (props.publicNight?.artist?.slug ? `/${props.publicNight.artist.slug}` : ''))
const publicHref = computed(() => publicNightPathFromMemory(props.memory))
const artistImage = computed(() =>
  absolutePublicMediaUrl(
    props.memory?.artist?.imageUrl || props.publicNight?.artist?.image?.url,
    props.mediaOrigin,
  )
)
const canShare = computed(() => !!publicHref.value)
const activeGallery = computed(() =>
  galleries.value.find((row) => (row.slug || String(row.id)) === activeGallerySlug.value) || null
)
const activeGalleryPath = computed(() => {
  if (!activeGallery.value) return ''
  return activeGallery.value.canonicalPath
    || galleryPath(props.memory?.artist?.slug, activeGallery.value.slug)
    || ''
})

function galleryCount(gallery) {
  return nightStoryCountLine(gallery?.photoCount)
}

function chapterCanStack(gallery) {
  return !gallery?.locked && Array.isArray(gallery?.media) && gallery.media.some((item) => item?.url)
}

function galleryKey(gallery) {
  return String(gallery?.slug || gallery?.id || '')
}

function stackIndexFor(gallery) {
  const key = galleryKey(gallery)
  if (key && Object.prototype.hasOwnProperty.call(stackIndexes, key)) return stackIndexes[key]
  return recalledStackIndex(key)
}

function onStackIndex(gallery, index) {
  const key = galleryKey(gallery)
  const next = authorizedStackIndex(index, gallery?.media)
  if (!key || next == null) return
  stackIndexes[key] = next
  rememberStackIndex(key, next)
}

function openGallery(gallery, payload) {
  const key = galleryKey(gallery)
  if (!key) return
  const plan = resolveNightGalleryOpen({
    gallery,
    payload,
    rememberedIndex: stackIndexFor(gallery),
  })
  if (plan.index != null) {
    stackIndexes[key] = plan.index
    rememberStackIndex(key, plan.index)
  }
  activeGalleryStartIndex.value = plan.index ?? 0
  activeGalleryAutoOpen.value = !!payload
  activeGallerySlug.value = gallery.slug || String(gallery.id)
}

function closeGallery() {
  activeGallerySlug.value = ''
  activeGalleryAutoOpen.value = false
}

function openPoster() {
  if (!posterUrl.value) return
  lightboxItems.value = [{ url: posterUrl.value, alt: `${title.value} night poster` }]
  lightboxTitle.value = 'Night poster'
  lightboxOpen.value = true
}

void props.publicNight?.recordings
</script>

<style scoped>
.pnd {
  min-width: 0;
}
.pnd__artist {
  margin: 0;
  color: #7ee7ff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.pnd__ordinal {
  margin: 0.7rem 0 0;
  color: #f7f9fc;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.pnd__title {
  margin: 0.45rem 0 0;
  font-size: clamp(2rem, 7vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 0.96;
}
.pnd__venue,
.pnd__place,
.pnd__date {
  margin: 0.5rem 0 0;
  color: rgba(247, 249, 252, 0.58);
  font-size: 1rem;
}
.pnd__there {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.95rem 0 0;
  color: #7ee7ff;
  font-size: 0.82rem;
  font-weight: 700;
}
.pnd__hero {
  margin: 1.8rem 0 0;
  width: min(100%, 36rem);
}
.pnd__hero img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 28rem;
  object-fit: contain;
  background: #050608;
}
.pnd__section,
.pnd__from,
.pnd__history,
.pnd__poster {
  margin-top: 2.4rem;
}
.pnd__section h2,
.pnd__from h2,
.pnd__history h2 {
  margin: 0 0 0.85rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.42);
}
.pnd__story {
  margin: 0;
  max-width: 38rem;
  font-size: 1.05rem;
  line-height: 1.65;
  white-space: pre-wrap;
}
.pnd__lineup {
  list-style: none;
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
}
.pnd__lineup li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.7rem;
  align-items: baseline;
}
.pnd__act { font-weight: 700; }
.pnd__role {
  color: rgba(247, 249, 252, 0.45);
  font-size: 0.85rem;
}
.pnd__lineup li.is-top .pnd__act { font-size: 1.05rem; }
.pnd__poster {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.pnd__poster-btn {
  width: 5.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.pnd__poster-btn img {
  display: block;
  width: 100%;
  height: auto;
}
.pnd__poster-label {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.42);
}
.pnd__text,
.pnd__quiet,
.pnd__primary {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.62);
  font: inherit;
  font-size: 0.88rem;
  text-decoration: none;
  cursor: pointer;
}
.pnd__text:focus-visible,
.pnd__quiet:focus-visible,
.pnd__primary:focus-visible,
.pnd__poster-btn:focus-visible,
.pnd__chapter-copy:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
.pnd__chapters {
  list-style: none;
  display: grid;
  gap: 2rem;
  margin: 0;
  padding: 0;
}
.pnd__chapter.is-stack { width: min(100%, 22rem); }
.pnd__chapter-copy {
  display: grid;
  gap: 0.2rem;
  margin-top: 0.7rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.pnd__chapter-title { font-weight: 700; }
.pnd__chapter-count {
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.78rem;
}
.pnd__history p {
  margin: 0;
  max-width: 32rem;
  font-size: 1.05rem;
  line-height: 1.55;
}
.pnd__continue {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.2rem;
  margin-top: 2.8rem;
  align-items: center;
}
.pnd__primary {
  padding: 0 1.05rem;
  border-radius: 999px;
  background: #f7f9fc;
  color: #050608;
  font-weight: 700;
}
.pnd__status {
  margin: 0.7rem 0 0;
  color: rgba(247, 249, 252, 0.48);
  font-size: 0.82rem;
}
</style>
