<template>
  <div class="ar" v-if="recap">
    <section class="ar__hero" :class="[`is-${hero.mode}`]">
      <div v-if="showArtistStage" class="ar__hero-stage">
        <template v-if="backdropSrc && heroPaintReady">
          <img
            v-if="hero.source !== 'night-hero' && artistPresentation.ambient"
            class="ar__hero-ambient"
            :src="backdropSrc"
            :style="{ objectPosition: artistPresentation.objectPosition }"
            alt=""
            aria-hidden="true"
          >
          <img
            class="ar__hero-backdrop"
            :class="{
              'is-atmosphere': hero.artistIsAtmosphere,
              'is-contain': hero.source !== 'night-hero' && artistPresentation.objectFit === 'contain',
            }"
            :src="backdropSrc"
            :alt="artistName || 'Artist'"
            :style="heroImageStyle"
          >
        </template>
        <div class="ar__hero-fade" />
        <button
          v-if="eventSrc"
          type="button"
          class="ar__poster"
          aria-label="View show artwork"
          @click="openPoster"
        >
          <img :src="eventSrc" :alt="headline.primary || 'Show artwork'">
        </button>
        <button
          v-if="backdropSrc && heroPaintReady"
          type="button"
          class="ar__adjust"
          :aria-label="hero.hasNightHero ? 'Adjust Night hero' : 'Adjust artist image'"
          @click="adjustOpen = true"
        >
          {{ hero.hasNightHero ? 'Adjust Night hero' : 'Adjust artist image' }}
        </button>
      </div>
      <div v-else-if="eventSrc" class="ar__hero-stage is-event-only">
        <button type="button" class="ar__poster" aria-label="View show artwork" @click="openPoster">
          <img :src="eventSrc" :alt="headline.primary || 'Show artwork'">
        </button>
      </div>
      <div class="ar__hero-band">
        <div class="ar__hero-copy">
          <p class="ar__kicker">Show recap</p>
          <p class="ar__artist">{{ artistName || 'Artist' }}</p>
          <h1 class="ar__title">{{ headline.primary || 'This night' }}</h1>
          <p v-if="placeOnly" class="ar__meta">{{ placeOnly }}</p>
          <p v-if="dateLine" class="ar__date">{{ dateLine }}</p>
          <div class="ar__actions">
            <button
              v-if="shareUrl"
              type="button"
              class="ar__btn"
              @click="shareOpen = true"
            >
              <Share2 :size="18" :stroke-width="1.75" aria-hidden="true" />
              Share Night
            </button>
            <NuxtLink v-if="nightPreviewHref" :to="nightPreviewHref" class="ar__btn ar__btn--ghost">
              <Eye :size="18" :stroke-width="1.75" aria-hidden="true" />
              Preview fan view
            </NuxtLink>
            <button type="button" class="ar__text-btn" @click="editing = true">
              <Pencil :size="16" :stroke-width="1.75" aria-hidden="true" />
              Edit
            </button>
          </div>
        </div>
        <aside class="ar__memory" :class="{ 'is-empty': !memorySrc }">
          <button
            v-if="memorySrc"
            type="button"
            class="ar__memory-btn"
            aria-label="View Night poster"
            @click="openMemory"
          >
            <img :src="memorySrc" :alt="headline.primary || 'Night poster'">
          </button>
          <div class="ar__memory-copy">
            <p class="ar__memory-label">Night poster</p>
            <button
              v-if="memorySrc"
              type="button"
              class="ar__action"
              @click="openMemory"
            >
              <Image :size="18" :stroke-width="1.75" aria-hidden="true" />
              View poster
            </button>
            <button type="button" class="ar__action" @click="editing = true">
              <Pencil :size="18" :stroke-width="1.75" aria-hidden="true" />
              {{ memorySrc ? 'Edit image' : 'Add image' }}
            </button>
          </div>
        </aside>
      </div>
    </section>

    <div class="ar__rail">
    <dl v-if="stats.length" class="ar__stats">
      <div v-for="stat in stats" :key="stat.label">
        <dt>{{ stat.value }}</dt>
        <dd>{{ stat.label }}</dd>
      </div>
    </dl>

    <section class="ar__copy ar__story-block">
      <h2>Story</h2>
      <p v-if="publicStory" class="ar__story">{{ publicStory }}</p>
      <div v-else class="ar__empty">
        <button type="button" class="ar__action ar__action--lead" @click="editing = true">
          <PencilLine :size="18" :stroke-width="1.75" aria-hidden="true" />
          Tell the story of this Night
        </button>
        <p>Give fans the memory behind the photos.</p>
      </div>
      <button v-if="publicStory" type="button" class="ar__action" @click="editing = true">
        <PencilLine :size="18" :stroke-width="1.75" aria-hidden="true" />
        Edit story
      </button>
    </section>

    <NightRecordingManager
      class="ar__recordings"
      :recap-id="recap.id"
      :artist-name="artistName"
      :local-only="usesLocalGalleries"
      :initial-recordings="localRecordings"
    />

    <section class="ar__from">
      <div class="ar__from-head">
        <h2>From the night</h2>
        <NuxtLink v-if="addPhotosPath" :to="addPhotosPath" class="ar__action">
          <ImagePlus :size="18" :stroke-width="1.75" aria-hidden="true" />
          Add photos
        </NuxtLink>
      </div>
      <ul v-if="galleries.length" class="ar__galleries">
        <li v-for="gallery in galleries" :key="gallery.id || gallery.slug">
          <div v-if="galleryCanStack(gallery)" class="ar__gallery is-stack">
            <FaneqoGalleryStack
              :media="gallery.media"
              :title="gallery.title || 'Photos'"
              :count="gallery.photoCount || gallery.media?.length"
              size="archive"
              :priority="gallery === galleries[0]"
              :active-index="stackIndexFor(gallery)"
              @update:active-index="onStackIndex(gallery, $event)"
              @activate="openGallery(gallery, $event)"
            />
            <button type="button" class="ar__gallery-copy" @click="openGallery(gallery)">
              <span class="ar__gallery-title">{{ gallery.title || 'Photos' }}</span>
              <span class="ar__gallery-meta">
                <span v-if="galleryCount(gallery)">{{ galleryCount(gallery) }}</span>
                <span v-if="galleryCount(gallery)"> · </span>
                <span>{{ galleryAudienceLabel(gallery.visibility) }}</span>
              </span>
            </button>
          </div>
          <button v-else type="button" class="ar__gallery" @click="openGallery(gallery)">
            <img
              v-if="galleryPreview(gallery)"
              class="ar__gallery-img"
              :src="galleryPreview(gallery)"
              :alt="gallery.title || 'Photos from the night'"
            >
            <div v-else class="ar__gallery-img" aria-hidden="true" />
            <p class="ar__gallery-title">{{ gallery.title || 'Photos' }}</p>
            <p class="ar__gallery-meta">
              <span v-if="galleryCount(gallery)">{{ galleryCount(gallery) }}</span>
              <span v-if="galleryCount(gallery)"> · </span>
              <span>{{ galleryAudienceLabel(gallery.visibility) }}</span>
            </p>
          </button>
          <div class="ar__gtools">
            <button
              type="button"
              class="ar__gmanage"
              :aria-expanded="galleryMenu === galleryKey(gallery) ? 'true' : 'false'"
              @click="toggleGalleryMenu(gallery)"
            >
              <MoreHorizontal :size="16" :stroke-width="1.8" aria-hidden="true" />
              Manage
            </button>
            <div
              v-if="galleryMenu === galleryKey(gallery)"
              class="ar__gmenu"
              role="group"
              :aria-label="`Manage ${gallery.title || 'this gallery'}`"
            >
              <button type="button" @click="chooseGalleryAction(gallery, 'open')">
                Open gallery
              </button>
              <button type="button" @click="chooseGalleryAction(gallery, 'detach')">
                Remove from recap page
              </button>
              <button type="button" @click="chooseGalleryAction(gallery, 'hide')">
                Hide gallery
              </button>
            </div>
          </div>
        </li>
      </ul>
      <p v-if="galleryStatus.message" class="ar__gstatus" role="status">{{ galleryStatus.message }}</p>
    </section>

    <section class="ar__copy ar__lineup-block">
      <PublicNightLineup v-if="lineup.length" :lineup="lineup" heading="Lineup" />
      <template v-else>
        <h2>Lineup</h2>
        <div class="ar__empty">
          <button type="button" class="ar__action ar__action--lead" @click="editing = true">
            <Users :size="18" :stroke-width="1.75" aria-hidden="true" />
            Who shared the stage?
          </button>
          <p>Add the artists who were part of this Night.</p>
          <button type="button" class="ar__action" @click="editing = true">Add lineup</button>
        </div>
      </template>
      <button v-if="lineup.length" type="button" class="ar__action" @click="editing = true">
        <Users :size="18" :stroke-width="1.75" aria-hidden="true" />
        Edit lineup
      </button>
    </section>

    <section class="ar__copy ar__after">
      <div class="ar__after-copy">
        <h2>After the show</h2>
        <p class="ar__lead">Keep the room with you.</p>
        <p>Reach the people who were there while the Night is still fresh.</p>
      </div>
      <ShowMessageComposer
        v-if="hasCheckIns && recap.id && !usesLocalGalleries"
        class="ar__msg"
        :recap-id="recap.id"
        :auto-open="autoOpenMessage"
      />
      <div v-else-if="hasCheckIns && usesLocalGalleries" class="ar__after-actions">
        <span class="ar__action ar__action--lead">
          <MessageCircle :size="18" :stroke-width="1.75" aria-hidden="true" />
          Message attendees
        </span>
        <NuxtLink to="/messages?tab=sent" class="ar__text-btn">View sent messages →</NuxtLink>
      </div>
      <div v-else class="ar__empty">
        <p class="ar__lead">No one checked in this time.</p>
        <p>Next show, place your QR at the merch table, entrance, stage screen, or flyer.</p>
      </div>
    </section>

    <button type="button" class="ar__insights" @click="insightsOpen = true">
      <span>
        <strong class="ar__utility-title">
          <BarChart3 :size="18" :stroke-width="1.75" aria-hidden="true" />
          Show insights
        </strong>
        <small>Attendance, engagement and fan activity.</small>
      </span>
      <span class="ar__utility-go">View insights →</span>
    </button>

    <section class="ar__copy ar__note">
      <h2 class="ar__utility-title">
        <Lock :size="18" :stroke-width="1.75" aria-hidden="true" />
        Private band note
      </h2>
      <p class="ar__hint">Only your team can see this.</p>
      <p v-if="privateNote" class="ar__note-body">{{ privateNote }}</p>
      <button type="button" class="ar__action" @click="editing = true">
        {{ privateNote ? 'Edit private note →' : 'Add private note →' }}
      </button>
    </section>

    </div>

    <ArtistRecapNightEditor
      v-if="editing"
      :recap="recap"
      :artist-image-url="artistCircleSrc"
      :artist-image-fit="artistPresentation.objectFit"
      :artist-focal-x="artistFraming.focalX"
      :artist-focal-y="artistFraming.focalY"
      :start-add-artist="route.query.lineup === '1'"
      :local-only="usesLocalGalleries"
      @close="editing = false"
      @updated="onUpdated"
      @saved="onSaved"
    />
    <NightShareSheet
      :open="shareOpen"
      :share-url="shareUrl"
      :artist-name="artistName"
      :show-title="headline.primary || recap.showTitle"
      :place-line="[placeOnly, dateLine].filter(Boolean).join(' · ')"
      :image-url="shareImageSrc"
      @close="closeShare"
    />
    <NightGalleryViewer
      :open="!!activeGallery"
      :gallery="activeGallery"
      :share-path="activeGalleryPath"
      :artist-name="artistName"
      :artist-path="bandSlug ? `/${bandSlug}` : ''"
      :artist-image="artistCircleSrc"
      :artist-focal-x="artistFraming.focalX"
      :artist-focal-y="artistFraming.focalY"
      :place-line="placeOnly"
      :night-date="dateLine"
      :night-href="nightHref"
      :start-index="activeGalleryStartIndex"
      :auto-open-lightbox="activeGalleryAutoOpen"
      @close="closeGallery"
    />
    <ArtistRecapInsightsSheet
      :open="insightsOpen"
      :recap="recap"
      @close="insightsOpen = false"
    />
    <ArtistImagePositionSheet
      :open="adjustOpen"
      :mode="hero.hasNightHero ? 'night-hero' : 'artist'"
      :image-url="adjustImageUrl"
      :image-width="adjustImageWidth"
      :image-height="adjustImageHeight"
      :artist-name="artistName"
      :image-fit="artistFraming.imageFit"
      :position-x="hero.hasNightHero ? hero.heroFocalX : artistFraming.focalX"
      :position-y="hero.hasNightHero ? hero.heroFocalY : artistFraming.focalY"
      :zoom="artistFraming.zoom"
      :saving="adjustSaving"
      :error="adjustError"
      @close="adjustOpen = false"
      @save="saveHeroPosition"
    />
    <FaneqoMediaLightbox
      :open="lightboxOpen"
      :items="lightboxItems"
      :start-index="0"
      :title="lightboxTitle"
      zoomable
      @close="lightboxOpen = false"
    />
    <FaneqoGalleryConfirm
      :open="!!detachTarget"
      heading="Remove this gallery from the recap page?"
      body="This removes the gallery from this recap. It may still appear in this Night’s gallery archive, and it stays available on your Galleries page and anywhere you have already shared it."
      confirm-label="Remove from recap page"
      busy-label="Removing…"
      :busy="galleryWorking"
      @cancel="detachTarget = null"
      @confirm="confirmDetach"
    />
    <FaneqoGalleryConfirm
      :open="!!hideTarget"
      heading="Hide this gallery?"
      body="Hiding removes the gallery from Faneqo and Faneqo shared-gallery pages. Photos already downloaded, reposted, or directly cached elsewhere may remain available. You can restore it later."
      confirm-label="Hide gallery"
      busy-label="Hiding…"
      :busy="galleryWorking"
      @cancel="hideTarget = null"
      @confirm="confirmHide"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  BarChart3,
  Eye,
  Image,
  ImagePlus,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  PencilLine,
  Share2,
  Users,
} from '@lucide/vue'
import ShowMessageComposer from '~/components/dashboard/fans/ShowMessageComposer.vue'
import ArtistRecapNightEditor from '~/components/nights/ArtistRecapNightEditor.vue'
import ArtistRecapInsightsSheet from '~/components/nights/ArtistRecapInsightsSheet.vue'
import ArtistImagePositionSheet from '~/components/nights/ArtistImagePositionSheet.vue'
import NightGalleryViewer from '~/components/nights/NightGalleryViewer.vue'
import NightShareSheet from '~/components/nights/NightShareSheet.vue'
import NightRecordingManager from '~/components/nights/NightRecordingManager.vue'
import PublicNightLineup from '~/components/nights/PublicNightLineup.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import FaneqoGalleryConfirm from '~/components/galleries/FaneqoGalleryConfirm.vue'
import { useArtistUpdates } from '~/composables/useArtistUpdates'
import { nightPathFromRecap, galleryPath } from '~/utils/nights/publicNightPaths'
import { withSafeFrom } from '~/utils/nights/artistWorldReturn'
import {
  formatNightDateLong,
  nightHeadline,
  nightPlaceLine,
} from '~/utils/nights/nightDisplay'
import {
  galleriesForRecap,
  galleryAudienceLabel,
  galleryPreviewUrl,
  mergeArtistNight,
  recapArtistImageUrl,
  recapHeroPlan,
  recapPlaceLine,
  recapStatStrip,
} from '~/utils/nights/artistRecap'
import { nightStoryCountLine } from '~/utils/updates/nightStoryCopy'
import { faneqoShareUrl } from '~/utils/share/faneqoShare'
import { resolveFrontendOrigin } from '~/utils/site/faneqoOrigin'
import { buildSharePhotosPath } from '~/utils/updates/sharePhotosFromRecap'
import { resolveFaneqoMediaSrc } from '~/utils/media/faneqoMedia'
import { rememberStackIndex, recalledStackIndex } from '~/utils/galleries/stackBrowseMemory'
import { authorizedStackIndex, resolveNightGalleryOpen } from '~/utils/galleries/stackOpenNavigation'
import {
  createImageFitLayoutPatch,
  getArtistFocalStyle,
  readArtistImageFraming,
  readBandArtistImageContract,
  resolveArtistImagePresentation,
} from '~/utils/media/artistImage'

const props = defineProps({
  recap: { type: Object, default: null },
  autoOpenMessage: { type: Boolean, default: false },
  artistImage: { type: String, default: '' },
  initialGalleries: { type: Array, default: null },
  startEditing: { type: Boolean, default: false },
  startShare: { type: Boolean, default: false },
  startInsights: { type: Boolean, default: false },
  startAdjust: { type: Boolean, default: false },
})

const emit = defineEmits(['update:recap'])
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { listMine, hide: hideGallery, detachFromRecap } = useArtistUpdates()
const { updateNight } = useShowRecaps()
const shareOpen = ref(Boolean(props.startShare))
const insightsOpen = ref(Boolean(props.startInsights))
const adjustOpen = ref(Boolean(props.startAdjust) || String(route.query.adjust || '') === '1')
const adjustSaving = ref(false)
const adjustError = ref('')
const editing = ref(
  Boolean(props.startEditing)
  || String(route.query.lineup || '') === '1'
  || String(route.query.edit || '') === '1',
)
const lightboxOpen = ref(false)
const lightboxItems = ref([])
const lightboxTitle = ref('')
const activeGallerySlug = ref('')
const activeGalleryStartIndex = ref(0)
const activeGalleryAutoOpen = ref(false)
const stackIndexes = reactive({})
const galleryStatus = reactive({})
const galleryMenu = ref('')
const detachTarget = ref(null)
const hideTarget = ref(null)
const galleryWorking = ref(false)
const loadedArtistImage = ref('')
const artistFraming = ref(readArtistImageFraming(props.recap?.band))
const bandRecord = ref(null)
const artistReady = ref(Array.isArray(props.initialGalleries))
const mobileHero = ref(false)
let heroMedia = null
const onHeroMedia = () => {
  mobileHero.value = Boolean(heroMedia?.matches)
}
const galleryRows = ref(Array.isArray(props.initialGalleries) ? props.initialGalleries : [])
const mediaOrigin = computed(() => String(config.public?.strapiUrl || '').replace(/\/+$/, ''))
const token = useStrapiToken()

const artistName = computed(() => String(props.recap?.band?.name || '').trim())
const bandSlug = computed(() => String(props.recap?.band?.slug || '').trim())
const headline = computed(() => nightHeadline({ title: props.recap?.showTitle, venue: props.recap?.venue }))
const placeLine = computed(() => nightPlaceLine({
  city: props.recap?.city,
  region: props.recap?.region,
  country: props.recap?.country,
}))
const dateLine = computed(() => formatNightDateLong(
  props.recap?.performanceStartsAt
    || props.recap?.showStartedAt
    || props.recap?.date
    || props.recap?.recapGeneratedAt,
  props.recap?.timezone,
))
const artistFallback = computed(() =>
  recapArtistImageUrl(props.recap, props.artistImage || loadedArtistImage.value),
)
const artistCircleSrc = computed(() =>
  resolveFaneqoMediaSrc(
    artistFraming.value?.image?.url || artistFallback.value,
    mediaOrigin.value,
  ) || artistFallback.value || '',
)
const hero = computed(() => recapHeroPlan(props.recap, artistFallback.value))
const backdropSrc = computed(() => resolveFaneqoMediaSrc(hero.value.backdropUrl, mediaOrigin.value) || '')
const eventSrc = computed(() => resolveFaneqoMediaSrc(hero.value.eventUrl, mediaOrigin.value) || '')
const memorySrc = computed(() => resolveFaneqoMediaSrc(hero.value.nightUrl, mediaOrigin.value) || '')
const shareImageSrc = computed(() => eventSrc.value || backdropSrc.value || memorySrc.value)
const artistPresentation = computed(() => resolveArtistImagePresentation({
  ...artistFraming.value,
  context: mobileHero.value ? 'hero-mobile' : 'hero-desktop',
}))
const heroPaintReady = computed(() => hero.value.hasNightHero || artistReady.value)
const heroImageStyle = computed(() => {
  if (hero.value.hasNightHero) {
    return {
      objectFit: 'cover',
      ...getArtistFocalStyle({
        positionX: hero.value.heroFocalX,
        positionY: hero.value.heroFocalY,
      }),
    }
  }
  return {
    objectFit: artistPresentation.value.objectFit,
    objectPosition: artistPresentation.value.objectPosition,
  }
})
const showArtistStage = computed(() =>
  Boolean(backdropSrc.value || (!heroPaintReady.value && (props.recap?.band?.id || props.recap?.band))),
)
const adjustImageUrl = computed(() => {
  if (hero.value.hasNightHero) return backdropSrc.value
  const raw = artistFraming.value?.image?.url || loadedArtistImage.value || backdropSrc.value
  return resolveFaneqoMediaSrc(raw, mediaOrigin.value) || raw || ''
})
const adjustImageWidth = computed(() => (
  hero.value.hasNightHero
    ? (props.recap?.heroImage?.width || props.recap?.hero?.width || null)
    : artistFraming.value?.image?.width
))
const adjustImageHeight = computed(() => (
  hero.value.hasNightHero
    ? (props.recap?.heroImage?.height || props.recap?.hero?.height || null)
    : artistFraming.value?.image?.height
))
const nightHref = computed(() => nightPathFromRecap(props.recap))
const nightPreviewHref = computed(() => {
  if (!nightHref.value || !props.recap?.id) return nightHref.value
  return withSafeFrom(nightHref.value, `/fans/recaps/${props.recap.id}`)
})
const shareUrl = computed(() => {
  if (!nightHref.value) return ''
  return faneqoShareUrl({
    canonicalPath: nightHref.value,
    origin: resolveFrontendOrigin({ configuredOrigin: config.public?.baseUrl }),
  })
})
const activeGallery = computed(() =>
  galleries.value.find((row) => row.slug === activeGallerySlug.value) || null,
)
const activeGalleryPath = computed(() => activeGallery.value ? galleryHref(activeGallery.value) : '')
const publicStory = computed(() => String(props.recap?.publicStory || '').trim())
const privateNote = computed(() => String(props.recap?.privateArtistNote || '').trim())
const lineup = computed(() =>
  Array.isArray(props.recap?.lineup)
    ? props.recap.lineup.filter((row) => String(row?.name || '').trim())
    : [],
)
const hasCheckIns = computed(() => (props.recap?.checkedInShowCount || 0) > 0)
const placeOnly = computed(() => {
  const venue = String(props.recap?.venue || '').trim()
  return recapPlaceLine({
    venue,
    city: String(props.recap?.city || '').trim() || placeLine.value,
    includeVenue: Boolean(headline.value.secondary) || headline.value.primary !== venue,
  })
})
const stats = computed(() => recapStatStrip({
  checkedIn: props.recap?.checkedInShowCount,
  newFans: props.recap?.newFanCheckIns ?? props.recap?.fansCaptured,
  interactions: props.recap?.interactionCount,
}))
const usesLocalGalleries = computed(() => Array.isArray(props.initialGalleries))
const localRecordings = computed(() =>
  usesLocalGalleries.value && Array.isArray(props.recap?.recordings)
    ? props.recap.recordings
    : null,
)
const galleries = computed(() => galleriesForRecap(galleryRows.value, props.recap))
const addPhotosPath = computed(() => buildSharePhotosPath(props.recap, {
  from: props.recap?.id ? `/fans/recaps/${props.recap.id}` : '/fans/recaps',
}))

onMounted(() => {
  if (typeof window !== 'undefined') {
    heroMedia = window.matchMedia('(max-width: 767px)')
    onHeroMedia()
    heroMedia.addEventListener('change', onHeroMedia)
  }
  syncArtistFraming()
  loadGalleries()
  loadArtistImage()
  if (route.query.gallery) activeGallerySlug.value = String(route.query.gallery)
  if (route.query.share === '1' && nightHref.value) shareOpen.value = true
  if (route.query.insights === '1') insightsOpen.value = true
})

onUnmounted(() => {
  heroMedia?.removeEventListener?.('change', onHeroMedia)
})

watch(() => props.recap, (recap) => {
  const band = recap?.band
  if (band?.cyberedImagePositionX != null || band?.layoutConfig || band?.bandImg) {
    syncArtistFraming(band)
  }
})

watch(() => route.query.gallery, (slug) => {
  activeGallerySlug.value = slug ? String(slug) : ''
})

defineExpose({ openShare: () => { if (nightHref.value) shareOpen.value = true } })

function syncArtistFraming(band = props.recap?.band, image) {
  artistFraming.value = readArtistImageFraming(band, image || band?.bandImg)
}

async function loadArtistImage() {
  const band = props.recap?.band
  syncArtistFraming(band)
  const bandId = band?.id || band
  if (!bandId || Array.isArray(props.initialGalleries)) {
    artistReady.value = true
    return
  }
  try {
    const result = await $fetch(`${config.public.strapiUrl}/api/bands/${bandId}`, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    })
    const contract = readBandArtistImageContract(result)
    const img = contract.image
    loadedArtistImage.value = img?.formats?.large?.url || img?.url || ''
    bandRecord.value = contract
    syncArtistFraming({
      id: contract.id,
      name: contract.name,
      genre: contract.genre,
      bio: contract.bio,
      layoutConfig: contract.layoutConfig,
      cyberedImagePositionX: contract.focalX,
      cyberedImagePositionY: contract.focalY,
      cyberedImageZoom: contract.zoom,
      bandImg: img,
    }, img)
  } catch {
    loadedArtistImage.value = ''
  } finally {
    artistReady.value = true
  }
}

function applyLocalFraming(next) {
  artistFraming.value = {
    ...artistFraming.value,
    imageFit: next.imageFit,
    focalX: next.positionX,
    focalY: next.positionY,
    zoom: next.zoom,
  }
  if (bandRecord.value) {
    bandRecord.value = {
      ...bandRecord.value,
      imageFit: next.imageFit,
      focalX: next.positionX,
      focalY: next.positionY,
      zoom: next.zoom,
      layoutConfig: createImageFitLayoutPatch(bandRecord.value.layoutConfig, next.imageFit)
        || bandRecord.value.layoutConfig,
    }
  }
}

async function saveNightHeroPosition(next) {
  adjustError.value = ''
  if (Array.isArray(props.initialGalleries)) {
    emit('update:recap', mergeArtistNight(props.recap, {
      hero: props.recap?.hero || props.recap?.heroImage || { url: hero.value.heroUrl },
      heroFocalX: next.positionX,
      heroFocalY: next.positionY,
    }))
    adjustOpen.value = false
    return
  }
  if (!props.recap?.id) {
    adjustError.value = 'Could not save this image position.'
    return
  }
  adjustSaving.value = true
  try {
    const night = await updateNight(props.recap.id, {
      heroFocalX: next.positionX,
      heroFocalY: next.positionY,
    })
    emit('update:recap', mergeArtistNight(props.recap, night))
    adjustOpen.value = false
  } catch {
    adjustError.value = 'Could not save this image position.'
  } finally {
    adjustSaving.value = false
  }
}

function saveHeroPosition(next) {
  if (hero.value.hasNightHero) {
    return saveNightHeroPosition(next)
  }
  return saveArtistPosition(next)
}

async function saveArtistPosition(next) {
  adjustError.value = ''
  if (Array.isArray(props.initialGalleries)) {
    applyLocalFraming(next)
    adjustOpen.value = false
    return
  }
  const bandId = bandRecord.value?.id || props.recap?.band?.id || props.recap?.band
  const name = bandRecord.value?.name || artistName.value
  const genre = bandRecord.value?.genre
  const bio = bandRecord.value?.bio
  if (!bandId || !name || !genre || !bio) {
    adjustError.value = 'Could not save this image position.'
    return
  }
  adjustSaving.value = true
  try {
    const layoutPatch = createImageFitLayoutPatch(bandRecord.value?.layoutConfig, next.imageFit)
    await $fetch(`${config.public.strapiUrl}/api/bands/${bandId}`, {
      method: 'PUT',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      body: {
        data: {
          name,
          genre,
          bio,
          cyberedImagePositionX: next.positionX,
          cyberedImagePositionY: next.positionY,
          cyberedImageZoom: next.zoom,
          ...(layoutPatch ? { layoutConfig: layoutPatch } : {}),
        },
      },
    })
    applyLocalFraming(next)
    adjustOpen.value = false
  } catch {
    adjustError.value = 'Could not save this image position.'
  } finally {
    adjustSaving.value = false
  }
}

async function loadGalleries() {
  if (Array.isArray(props.initialGalleries)) return
  const bandId = props.recap?.band?.id || props.recap?.band
  if (!bandId) return
  try {
    const result = await listMine({ bandId })
    galleryRows.value = Array.isArray(result?.data) ? result.data : []
  } catch {
    galleryRows.value = []
  }
}

function galleryHref(gallery) {
  return gallery?.canonicalPath
    || galleryPath(bandSlug.value, gallery?.slug)
    || `/fans/recaps/${props.recap.id}`
}

function galleryCount(gallery) {
  return nightStoryCountLine(gallery?.photoCount || gallery?.media?.length)
}

function galleryPreview(gallery) {
  const raw = galleryPreviewUrl(gallery)
  return resolveFaneqoMediaSrc(raw, mediaOrigin.value) || ''
}

function galleryCanStack(gallery) {
  const media = Array.isArray(gallery?.media) ? gallery.media : []
  return media.some((item) => item?.url || item?.largeUrl || item?.thumbnailUrl)
}

function galleryKey(gallery) {
  return String(gallery?.slug || gallery?.id || '')
}

function toggleGalleryMenu(gallery) {
  const key = galleryKey(gallery)
  galleryMenu.value = galleryMenu.value === key ? '' : key
}

function chooseGalleryAction(gallery, action) {
  galleryMenu.value = ''
  if (action === 'open') openGallery(gallery)
  if (action === 'detach') detachTarget.value = gallery
  if (action === 'hide') hideTarget.value = gallery
}

async function runGalleryAction(gallery, run, doneMessage, failMessage) {
  if (!gallery?.id || galleryWorking.value) return
  galleryWorking.value = true
  galleryStatus.message = ''
  try {
    await run(gallery.id)
    detachTarget.value = null
    hideTarget.value = null
    await loadGalleries()
    galleryStatus.message = doneMessage
  } catch (err) {
    galleryStatus.message = err?.data?.error?.message || failMessage
  } finally {
    galleryWorking.value = false
  }
}

function confirmDetach() {
  return runGalleryAction(
    detachTarget.value,
    detachFromRecap,
    'Removed from this recap.',
    'Could not remove this gallery from the recap. Try again.',
  )
}

function confirmHide() {
  return runGalleryAction(
    hideTarget.value,
    hideGallery,
    'Gallery hidden.',
    'Could not hide this gallery. Try again.',
  )
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

async function openGallery(gallery, payload) {
  const slug = gallery?.slug
  if (!slug) return
  const plan = resolveNightGalleryOpen({
    gallery,
    payload,
    rememberedIndex: stackIndexFor(gallery),
  })
  if (plan.index != null) {
    stackIndexes[galleryKey(gallery)] = plan.index
    rememberStackIndex(galleryKey(gallery), plan.index)
  }
  // Recap keeps ?gallery= for deep links. Set query before the overlay so
  // the shared lightbox does not close itself on the route change.
  activeGalleryStartIndex.value = plan.index ?? 0
  activeGalleryAutoOpen.value = plan.autoOpen
  const query = { ...route.query, gallery: slug }
  if (String(route.query.gallery || '') !== slug) {
    await router.push({ query })
  }
  activeGallerySlug.value = slug
}

function closeGallery() {
  activeGallerySlug.value = ''
  activeGalleryAutoOpen.value = false
  const query = { ...route.query }
  delete query.gallery
  router.replace({ query })
}

function closeShare() {
  shareOpen.value = false
  if (route.query.share) {
    const query = { ...route.query }
    delete query.share
    router.replace({ query })
  }
}

function openPoster() {
  if (!eventSrc.value) return
  lightboxItems.value = [{ url: eventSrc.value, alt: headline.value.primary || 'Show artwork' }]
  lightboxTitle.value = headline.value.primary || 'Show artwork'
  lightboxOpen.value = true
}

function openMemory() {
  if (!memorySrc.value) return
  lightboxItems.value = [{ url: memorySrc.value, alt: headline.value.primary || 'Night photo' }]
  lightboxTitle.value = 'Night poster'
  lightboxOpen.value = true
}

function onUpdated(night) {
  emit('update:recap', mergeArtistNight(props.recap, night))
}

function onSaved(night) {
  editing.value = false
  onUpdated(night)
}
</script>

<style scoped>
.ar {
  --bg-app: #050506;
  --text-primary: #f5f5f6;
  --text-secondary: rgba(245, 245, 246, 0.62);
  --text-muted: rgba(245, 245, 246, 0.4);
  --text-identity: rgba(245, 245, 246, 0.82);
  --ar-kicker-size: 0.875rem;
  --ar-kicker-tracking: 0.12em;
  --ar-kicker-color: rgba(245, 245, 246, 0.72);
  --ar-body-size: 1.125rem;
  --ar-small-size: 0.9375rem;
  overflow-x: clip;
  color: var(--text-primary);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.ar__hero { position: relative; }
.ar__hero-stage {
  position: relative;
  overflow: hidden;
  height: min(80vh, 36rem);
  background: #050506;
}
.ar__hero-backdrop {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ar__hero-backdrop.is-contain {
  object-fit: contain;
  background: transparent;
}
.ar__hero-backdrop.is-atmosphere { filter: saturate(0.86); }
.ar__hero-ambient {
  position: absolute;
  inset: -10%;
  width: 120%;
  height: 120%;
  object-fit: cover;
  object-position: 50% 50%;
  filter: blur(22px) saturate(0.7) brightness(0.34);
  pointer-events: none;
}
.ar__hero-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 6, 0.18) 0%, rgba(5, 5, 6, 0.42) 42%, #050506 100%);
  pointer-events: none;
}
.ar__poster {
  position: absolute;
  left: 1.25rem;
  bottom: 1.1rem;
  width: 108px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.ar__poster img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: contain;
  background: #0a0a0c;
  border-radius: 2px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.42);
}
.ar__adjust {
  position: absolute;
  top: calc(0.7rem + env(safe-area-inset-top, 0px));
  right: 4.35rem;
  z-index: 3;
  min-height: 44px;
  min-width: 44px;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 999px;
  background: rgba(5, 5, 6, 0.52);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  color: rgba(245, 245, 246, 0.82);
  font: inherit;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  cursor: pointer;
}
.ar__adjust:hover,
.ar__adjust:focus-visible {
  color: #f5f5f6;
  background: rgba(5, 5, 6, 0.58);
}
.ar__hero-stage.is-event-only {
  min-height: 8.5rem;
  height: auto;
  background: #050506;
}
.ar__hero-stage.is-event-only .ar__poster { position: relative; bottom: auto; }
.ar__hero-band {
  position: relative;
  max-width: 56rem;
  margin: 0 auto;
  padding: 0.9rem 1.25rem 0.4rem;
}
.ar__hero-copy { position: relative; }
.ar__hero.is-artist .ar__hero-copy {
  margin-top: -5.5rem;
}
.ar__hero.is-artist-event .ar__hero-copy {
  margin-top: -8.6rem;
  padding-left: 7.35rem;
  min-height: 8.4rem;
}
.ar__hero.is-type .ar__hero-copy {
  min-height: min(58vh, 26rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-top: 3.2rem;
  padding-bottom: 0.6rem;
}
.ar__hero.is-type .ar__title {
  font-size: clamp(2.4rem, 13vw, 4.4rem);
}
.ar__hero.is-type .ar__artist {
  font-size: clamp(0.92rem, 3vw, 1.15rem);
}
.ar__kicker {
  margin: 0 0 0.55rem;
  font-size: var(--ar-kicker-size);
  font-weight: 700;
  letter-spacing: var(--ar-kicker-tracking);
  text-transform: uppercase;
  color: var(--ar-kicker-color);
}
.ar__artist-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.ar__avatar {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 8px;
}
.ar__artist {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ar__title {
  margin: 0.55rem 0 0;
  font-size: clamp(2rem, 8vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.96;
  overflow-wrap: anywhere;
}
.ar__meta,
.ar__date {
  margin: 0.7rem 0 0;
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-identity);
  overflow-wrap: anywhere;
}
.ar__date { margin-top: 0.22rem; }
.ar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.65rem;
  margin-top: 1.25rem;
}
.ar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 48px;
  padding: 0 1.1rem;
  border: 0;
  border-radius: 14px;
  background: #f3f3f4;
  color: #08090a;
  font: inherit;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, opacity 150ms ease;
}
.ar__btn:hover { opacity: 0.92; }
.ar__btn:active { opacity: 0.82; }
.ar__btn--ghost {
  background: #111318;
  color: #f5f5f6;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.ar__btn:disabled { opacity: 0.55; }
.ar__hint {
  margin: 0.45rem 0 0;
  font-size: 1rem;
  line-height: 1.45;
  color: var(--text-secondary);
}
.ar__rail {
  max-width: 56rem;
  margin: 0 auto;
}
.ar__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem 0.6rem;
  margin: 2.1rem 0 0;
  padding: 0 1.25rem;
}
.ar__stats dt {
  margin: 0;
  font-size: clamp(1.55rem, 5.4vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--text-primary);
}
.ar__stats dd {
  margin: 0.32rem 0 0;
  font-size: var(--ar-small-size);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}
.ar__copy {
  max-width: 56rem;
  margin: 0 auto;
  padding: 0 1.25rem;
}
.ar__copy h2:not(.ar__utility-title), .ar__from-head h2 {
  margin: 0 0 1.05rem;
  font-size: var(--ar-kicker-size);
  font-weight: 700;
  letter-spacing: var(--ar-kicker-tracking);
  text-transform: uppercase;
  color: var(--ar-kicker-color);
}
.ar__story-block { margin-top: 3.1rem; }
.ar__lineup-block { margin-top: 2.7rem; }
.ar__memory { margin-top: 3rem; }
.ar__story {
  margin: 0;
  max-width: 42rem;
  font-size: var(--ar-body-size);
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
}
.ar__story + .ar__action,
.ar__lineup-block .ar__action {
  margin-top: 0.7rem;
}
.ar__lead {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 650;
  line-height: 1.35;
  color: var(--text-primary);
}
.ar__empty p { margin: 0.35rem 0 0; color: var(--text-secondary); }
.ar__empty .ar__lead,
.ar__empty .ar__action--lead { margin: 0; }
.ar__action {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 150ms ease;
}
.ar__action:hover { opacity: 0.78; }
.ar__action:active { opacity: 0.68; }
.ar__action--lead {
  font-size: 1.2rem;
  font-weight: 650;
  line-height: 1.35;
}
.ar__text-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: color 150ms ease, opacity 150ms ease;
}
.ar__text-btn:hover { color: var(--text-primary); }
.ar__from { margin-top: 3.15rem; padding: 0 1.25rem 0; }
.ar__recordings { margin-top: 3.15rem; padding: 0 1.25rem; }
.ar__from-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}
.ar__from-head h2 { margin: 0; }
.ar__memory {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 1.15rem;
}
.ar__memory-btn {
  display: block;
  flex: 0 0 4.75rem;
  width: 4.75rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: transform 150ms ease, opacity 150ms ease;
}
.ar__memory-btn img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.32);
  outline: 1px solid rgba(255, 255, 255, 0.08);
}
.ar__memory-btn:hover,
.ar__memory-btn:focus-visible {
  transform: scale(1.02);
}
.ar__memory-btn:active { transform: scale(0.98); }
.ar__memory-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.ar__memory-label {
  margin: 0;
  font-size: var(--ar-kicker-size);
  font-weight: 700;
  letter-spacing: var(--ar-kicker-tracking);
  text-transform: uppercase;
  color: var(--ar-kicker-color);
}
.ar__memory.is-empty .ar__memory-copy .ar__action:first-of-type {
  margin-top: 0.1rem;
}
.ar__galleries {
  display: flex;
  gap: 0.85rem;
  margin: 0 -1.25rem;
  padding: 0.85rem 1.25rem 1.05rem;
  padding-right: max(1.25rem, calc(100vw - min(80vw, 22rem) - 1.25rem));
  list-style: none;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 1.25rem;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.ar__galleries::-webkit-scrollbar { display: none; }
.ar__galleries li {
  flex: 0 0 min(80vw, 22rem);
  max-width: min(80vw, 22rem);
  scroll-snap-align: start;
}
.ar__gallery {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.ar__gallery.is-stack {
  padding: 0.15rem 0.55rem 0;
  cursor: default;
}
.ar__gallery-copy {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.ar__gallery-img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #111318;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  transition: transform 140ms ease, box-shadow 140ms ease;
}
.ar__gallery:hover .ar__gallery-img,
.ar__gallery:focus-visible .ar__gallery-img {
  transform: scale(1.012);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2);
}
.ar__gallery:active .ar__gallery-img {
  transform: scale(0.97);
}
.ar__gallery-title {
  display: block;
  margin: 0.78rem 0 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.35;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
.ar__gallery-meta {
  display: block;
  margin: 0.28rem 0 0;
  color: var(--text-secondary);
  font-size: var(--ar-small-size);
  line-height: 1.35;
}
.ar__gallery { transition: opacity 150ms ease; }
.ar__gallery:hover .ar__gallery-title,
.ar__gallery:focus-visible .ar__gallery-title,
.ar__gallery-copy:hover .ar__gallery-title,
.ar__gallery-copy:focus-visible .ar__gallery-title { color: #fff; }
.ar__gallery-copy:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
.ar__gtools {
  padding: 0.4rem 0.55rem 0;
}
.ar__gmanage {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--ar-small-size);
  font-weight: 600;
  cursor: pointer;
}
.ar__gmanage:hover,
.ar__gmanage[aria-expanded="true"] {
  color: #fff;
}
.ar__gmenu {
  display: grid;
  justify-items: start;
  padding: 0.2rem 0 0.35rem;
}
.ar__gmenu button {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--ar-small-size);
  font-weight: 550;
  text-align: left;
  cursor: pointer;
}
.ar__gmenu button:hover {
  color: #fff;
}
.ar__gmanage:focus-visible,
.ar__gmenu button:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
.ar__gstatus {
  margin: 0.2rem 0 0;
  color: var(--text-secondary);
  font-size: var(--ar-small-size);
}
.ar__after {
  display: grid;
  gap: 1.15rem;
  margin-top: 3.4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.ar__after-copy > p {
  margin: 0.4rem 0 0;
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--text-secondary);
}
.ar__after-copy .ar__lead {
  margin-top: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}
.ar__after-copy h2 { margin-bottom: 0.95rem; }
.ar__after-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
}
.ar__msg :deep(.show-messaging) {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
}
.ar__msg :deep(.show-messaging__head),
.ar__msg :deep(.show-messaging__reach),
.ar__msg :deep(.show-messaging__badge),
.ar__msg :deep(.show-messaging__truth),
.ar__msg :deep(.show-messaging__cooldown) { display: none; }
.ar__msg :deep(.show-messaging__actions) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.1rem;
  margin: 0;
}
.ar__msg :deep(.show-messaging__primary) {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: auto;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--text-primary);
  font-weight: 650;
  text-decoration: none;
}
.ar__msg :deep(.show-messaging__secondary) {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  text-decoration: none;
}
.ar__msg :deep(.show-messaging__state) {
  margin: 0;
  color: var(--text-secondary);
}
.ar__after .ar__empty { grid-column: 1 / -1; }
.ar__insights {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  max-width: 56rem;
  min-height: 72px;
  margin: 3rem auto 0;
  padding: 1.05rem 1.25rem;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 150ms ease;
}
.ar__utility-title {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  text-transform: none;
  color: var(--text-primary);
}
.ar__insights .ar__utility-title {
  display: flex;
}
.ar__insights small {
  display: block;
  margin-top: 0.4rem;
  color: var(--text-secondary);
  font-size: 1rem;
  letter-spacing: 0;
  text-transform: none;
  font-weight: 400;
}
.ar__utility-go {
  flex: none;
  color: var(--text-primary);
  font-weight: 650;
}
.ar__note { margin-top: 2.4rem; padding-bottom: calc(1.15rem + env(safe-area-inset-bottom, 0px)); }
.ar__note h2 {
  margin-bottom: 0.35rem;
}
.ar__note-body {
  margin: 0.7rem 0 0;
  max-width: 38rem;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
}
.ar__btn:focus-visible, .ar__text-btn:focus-visible, .ar__action:focus-visible, .ar__insights:focus-visible, .ar__gallery:focus-visible, .ar__poster:focus-visible, .ar__adjust:focus-visible, .ar__memory-btn:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 768px) {
  .ar__hero-stage { height: min(58vh, 34rem); }
  .ar__poster {
    left: max(1.5rem, calc(50% - 26.5rem));
    bottom: 1.6rem;
    width: 148px;
  }
  .ar__hero-band {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    column-gap: 2rem;
    padding-bottom: 0.85rem;
  }
  .ar__hero.is-artist .ar__hero-band { margin-top: -5.5rem; }
  .ar__hero.is-artist-event .ar__hero-band {
    margin-top: -8.6rem;
    padding-left: max(1.25rem, 11.8rem);
    padding-bottom: 1.2rem;
  }
  .ar__hero.is-artist .ar__hero-copy,
  .ar__hero.is-artist-event .ar__hero-copy {
    margin-top: 0;
    padding-left: 0;
    min-height: 0;
  }
  .ar__memory {
    flex-direction: column;
    align-items: stretch;
    width: 10.5rem;
    margin-top: 0;
  }
  .ar__memory.is-empty {
    width: auto;
    min-width: 8.5rem;
    align-self: end;
  }
  .ar__memory-btn {
    flex-basis: auto;
    width: 10.5rem;
  }
  .ar__hero.is-type .ar__title { font-size: clamp(3.2rem, 7vw, 5.2rem); }
  .ar__meta,
  .ar__date { font-size: 1.125rem; }
  .ar__story {
    max-width: 44rem;
    font-size: 1.25rem;
    line-height: 1.68;
  }
  .ar__stats dd { font-size: 0.9375rem; }
  .ar__galleries {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 0;
    padding: 0;
    overflow: visible;
    scroll-snap-type: none;
    scroll-padding-inline: 0;
  }
  .ar__galleries li { flex: none; max-width: none; }
  .ar__after {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    column-gap: 2.5rem;
  }
  .ar__after-actions { align-items: flex-start; }
  .ar__msg :deep(.show-messaging__actions) { align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .ar * { transition: none !important; }
}
</style>
