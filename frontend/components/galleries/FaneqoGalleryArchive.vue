<template>
  <div class="fq-garch">
    <header class="fq-garch__head">
      <div class="fq-garch__intro">
        <p class="fq-garch__kicker">
          <span v-if="artistName" class="fq-garch__artist">{{ artistName }}</span>
          <span v-if="artistName" class="fq-garch__kdot" aria-hidden="true">·</span>
          <span class="fq-garch__label">Galleries</span>
        </p>
        <h1>Your Nights, in pictures.</h1>
        <p v-if="countsLine" class="fq-garch__counts">{{ countsLine }}</p>
      </div>
      <NuxtLink
        v-if="canCreate && (loading || error || items.length)"
        to="/galleries/new"
        class="fq-garch__create"
      >
        + Create gallery
      </NuxtLink>
    </header>

    <section
      v-if="showArtistPage"
      class="fq-garch__page"
      aria-labelledby="fq-artist-page-heading"
    >
      <h2 id="fq-artist-page-heading">Artist Page</h2>
      <p v-if="artistPage.kind === 'none'" class="fq-garch__page-copy">
        No gallery is currently shown on your artist page.
      </p>
      <p v-if="artistPage.kind === 'none' && items.length" class="fq-garch__page-hint">
        Choose a gallery below to feature it.
      </p>

      <div v-else-if="artistPage.gallery" class="fq-garch__page-row">
        <img
          v-if="featuredCover"
          class="fq-garch__page-thumb"
          :src="featuredCover"
          alt=""
        >
        <div class="fq-garch__page-copy">
          <p class="fq-garch__page-title">{{ featuredCopy.title }}</p>
          <p class="fq-garch__page-meta">{{ featuredCopy.count }}</p>
          <p v-if="artistPage.kind === 'featured'" class="fq-garch__page-state">Featured on artist page</p>
          <template v-else>
            <p class="fq-garch__page-state">Featured selection needs attention</p>
            <p class="fq-garch__page-hint">This gallery is no longer eligible to appear publicly. {{ artistPage.block.detail }}</p>
          </template>
        </div>
        <button
          type="button"
          class="fq-garch__page-remove"
          :disabled="featuringId != null"
          @click="onUnfeature(artistPage.gallery)"
        >
          {{ artistPage.kind === 'attention' ? 'Remove from artist page' : 'Remove' }}
        </button>
      </div>
    </section>

    <!-- One page-level announcer: per-plate regions that mount and unmount
         do not announce reliably. -->
    <p class="fq-garch__live" role="status" aria-live="polite">{{ liveMessage }}</p>

    <!-- Placeholder prints in the real ledger, so the page arrives in the shape
         it is about to take rather than as a lonely sentence. -->
    <div v-if="loading" class="fq-garch__loading" aria-busy="true">
      <span class="fq-garch__sr">Loading your galleries…</span>
      <div class="fq-garch__loadrow">
        <div class="fq-garch__loadrail">
          <span class="fq-garch__loadline is-short" />
          <span class="fq-garch__loadline is-wide" />
        </div>
        <div class="fq-garch__loadgrid">
          <FaneqoGalleryStack
            v-for="n in 4"
            :key="`skeleton-${n}`"
            :media="[]"
            :interactive="false"
            :browsable="false"
            :plate="true"
            :frame-ratio="1.1"
            loading
          />
        </div>
      </div>
    </div>
    <div v-else-if="!canCreate" class="fq-garch__state">
      <h2>Artist access required</h2>
      <p>Sign in as the band owner or an authorized team member.</p>
    </div>
    <div v-else-if="error" class="fq-garch__state" role="alert">
      <h2>Couldn’t load galleries</h2>
      <button type="button" class="fq-garch__retry" @click="emit('retry')">Try again</button>
    </div>
    <div v-else-if="!items.length" class="fq-garch__empty">
      <h2>Your photos will live here.</h2>
      <p>Create a Gallery from a Night or start something new.</p>
      <NuxtLink to="/galleries/new" class="fq-garch__create">+ Create gallery</NuxtLink>
    </div>

    <div v-else class="fq-garch__shelves">
      <Motion
        v-for="(shelf, shelfIndex) in shelves"
        :key="shelf.key"
        :initial="enter(shelfIndex, true)"
        :animate="{ opacity: 1, y: 0 }"
        :transition="enterTransition(shelfIndex)"
      >
        <FaneqoNightShelf
          :kind="shelf.kind"
          :kicker="shelf.kicker"
          :date-label="shelf.dateLabel || ''"
          :city="shelf.city || ''"
          :venue="shelf.venue"
          :blurb="shelf.blurb || ''"
          :year-label="shelf.yearLabel"
          :night-href="shelf.recapHref || ''"
          :lead="!!shelf.lead"
          :marker="shelf.lead && shelves.length > 1 ? 'Latest night' : ''"
          :plates="shelf.galleries.length"
        >
          <Motion
            v-for="(item, itemIndex) in shelf.galleries"
            :key="item.id || `${shelf.key}-${itemIndex}`"
            :initial="enter(shelfIndex + itemIndex, false)"
            :animate="{ opacity: 1, y: 0 }"
            :transition="enterTransition(shelfIndex + itemIndex)"
          >
            <FaneqoGalleryArchiveItem
              :item="item"
              :priority="shelfIndex === 0 && itemIndex < 2"
              :selected="createdId && String(item.id) === createdId"
              :status="statusFor(item)"
              :frame-ratio="shelf.frameRatio"
              :lead="!!shelf.lead"
              :feature-busy="featuringId != null"
              @open="onOpen"
              @share="onShare"
              @hide="askHide"
              @restore="onRestore"
              @feature="onFeature"
              @unfeature="onUnfeature"
            />
          </Motion>
        </FaneqoNightShelf>
      </Motion>

      <!-- Older work must never appear to have silently disappeared. -->
      <p v-if="atLimit" class="fq-garch__cap">
        Showing your {{ listLimit }} most recent galleries. Older galleries are still safe.
      </p>
    </div>

    <FaneqoGalleryConfirm
      :open="!!hideTarget"
      heading="Hide this gallery?"
      body="Hiding removes the gallery from Faneqo and Faneqo shared-gallery pages. Photos already downloaded, reposted, or directly cached elsewhere may remain available. You can restore it later."
      confirm-label="Hide gallery"
      busy-label="Hiding…"
      :busy="working"
      @cancel="hideTarget = null"
      @confirm="onHide"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import FaneqoNightShelf from '~/components/galleries/FaneqoNightShelf.vue'
import FaneqoGalleryArchiveItem from '~/components/galleries/FaneqoGalleryArchiveItem.vue'
import FaneqoGalleryConfirm from '~/components/galleries/FaneqoGalleryConfirm.vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import { galleryTitle, groupArchiveShelves, manageGalleryLocation } from '~/utils/galleries/archiveShelves'
import {
  ARCHIVE_LIST_LIMIT,
  archiveCounts,
  archiveCountsLine,
  shelfPlateFrame,
} from '~/utils/galleries/archivePlates'
import { navigateGalleryOpen } from '~/utils/galleries/stackOpenNavigation'
import { archiveScrollRestorePlan, recalledArchiveScroll, rememberArchiveScroll } from '~/utils/galleries/stackBrowseMemory'
import { galleryPath } from '~/utils/nights/publicNightPaths.js'
import {
  artistPageFeatureCopy,
  artistPageFeatureView,
  galleryCoverUrl,
} from '~/utils/galleries/artistPageFeature'
import { shareFaneqoUrl } from '~/utils/share/faneqoShare'
import { motionTokens } from '~/utils/ui/motionTokens'

const props = defineProps({
  items: { type: Array, default: () => [] },
  bandSlug: { type: String, default: '' },
  artistName: { type: String, default: '' },
  canCreate: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  createdId: { type: String, default: '' },
  openBase: { type: String, default: '' },
  openFrom: { type: String, default: '/galleries' },
})

const emit = defineEmits(['retry', 'changed', 'featured'])
const route = useRoute()
const router = useRouter()
const { hide, restore } = useArtistUpdates()
const { featureGalleryOnProfile, unfeatureGalleryOnProfile } = useGalleryDrafts()
const hideTarget = ref(null)
const working = ref(false)
const featuringId = ref(null)
const liveMessage = ref('')
const listLimit = ARCHIVE_LIST_LIMIT
const reducedMotion = usePreferredReducedMotion()
const reduced = computed(() => reducedMotion.value === 'reduce')
const shareStatus = reactive({})

/* One frame ratio per row so plate baselines and captions align across it. */
const shelves = computed(() => groupArchiveShelves(props.items).map((shelf) => ({
  ...shelf,
  frameRatio: shelfPlateFrame(shelf.galleries, { lead: shelf.lead }),
})))
const counts = computed(() => archiveCounts(props.items))
const countsLine = computed(() => (props.loading ? '' : archiveCountsLine(props.items)))
const atLimit = computed(() => counts.value.atLimit)
const showArtistPage = computed(() => props.canCreate && !props.loading && !props.error)
const artistPage = computed(() => artistPageFeatureView(props.items))
const featuredCopy = computed(() => artistPageFeatureCopy(artistPage.value.gallery))
const featuredCover = computed(() => galleryCoverUrl(artistPage.value.gallery))

function enter(index, heading) {
  if (reduced.value || index > 5) return { opacity: 1, y: 0 }
  return { opacity: 0, y: heading ? 6 : 10 }
}

function enterTransition(index) {
  if (reduced.value || index > 5) return { duration: 0 }
  return {
    duration: motionTokens.standard.duration,
    ease: motionTokens.standard.ease,
    delay: Math.min(index, 4) * 0.04,
  }
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const remembered = recalledArchiveScroll(route.path)
  if (!remembered) return
  const restoreIfNeeded = () => {
    const plan = archiveScrollRestorePlan({
      currentY: window.scrollY,
      rememberedY: remembered,
    })
    if (!plan.apply) return
    window.scrollTo({ top: plan.y, left: 0, behavior: 'instant' })
  }
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(restoreIfNeeded)
  })
})

function announce(item, message) {
  if (item?.id != null) shareStatus[item.id] = message
  liveMessage.value = message
}

function onOpen(item, payload) {
  if (typeof window !== 'undefined') rememberArchiveScroll(route.path, window.scrollY)
  const location = manageGalleryLocation(item, props.bandSlug, {
    index: payload?.index,
    from: props.openFrom,
    base: props.openBase,
  })
  if (payload?.printName) location.state = { ...location.state, fqGalleryPrint: payload.printName }
  navigateGalleryOpen(router, location, { reduced: reduced.value })
}

async function onShare(item) {
  const path = galleryPath(props.bandSlug, item?.slug)
  if (!path) {
    announce(item, 'Link is unavailable')
    return
  }
  try {
    const result = await shareFaneqoUrl({
      title: item.title || 'Gallery',
      text: item.title || '',
      canonicalPath: path,
    })
    const opened = result.method === 'share' ? 'Share sheet opened.' : 'Link copied.'
    announce(item, item?.visibility === 'public'
      ? `${opened} Anyone with this shared link can view this gallery.`
      : opened)
  } catch (err) {
    if (err?.name === 'AbortError') return
    announce(item, err?.message || 'Could not share this gallery.')
  }
}

function askHide(item) {
  hideTarget.value = item || null
}

async function onHide() {
  const item = hideTarget.value
  if (!item?.id || working.value) return
  working.value = true
  try {
    await hide(item.id)
    hideTarget.value = null
    announce(item, 'Gallery hidden.')
    emit('changed')
  } catch {
    announce(item, 'Could not hide this gallery. Try again.')
  } finally {
    working.value = false
  }
}

async function onRestore(item) {
  if (!item?.id || working.value) return
  working.value = true
  try {
    await restore(item.id)
    announce(item, 'Gallery restored.')
    emit('changed')
  } catch {
    announce(item, 'Could not restore this gallery. Try again.')
  } finally {
    working.value = false
  }
}

function statusFor(item) {
  return shareStatus[item?.id] || ''
}

function featureFailure(err) {
  return err?.data?.error?.message || err?.data?.message || 'Could not update your artist page.'
}

async function onFeature(item) {
  if (!item?.id || featuringId.value) return
  featuringId.value = item.id
  try {
    const result = await featureGalleryOnProfile(item.id)
    const on = result?.data?.featuredOnProfile === true
    emit('featured', { id: result?.data?.id || item.id, featuredOnProfile: on })
    const title = galleryTitle(item)
    announce(item, on ? `${title} is now featured on your artist page.` : 'Could not feature this gallery.')
  } catch (err) {
    announce(item, featureFailure(err))
  } finally {
    featuringId.value = null
  }
}

async function onUnfeature(item) {
  if (!item?.id || featuringId.value) return
  featuringId.value = item.id
  try {
    const result = await unfeatureGalleryOnProfile(item.id)
    emit('featured', {
      id: result?.data?.id || item.id,
      featuredOnProfile: result?.data?.featuredOnProfile === true,
    })
    announce(item, 'Gallery removed from your artist page.')
  } catch (err) {
    announce(item, featureFailure(err))
  } finally {
    featuringId.value = null
  }
}
</script>

<style scoped>
.fq-garch {
  max-width: 90rem;
  margin: 0 auto;
  padding: calc(var(--header-height, 70px) + 1.15rem) 1.1rem 5rem;
  color: #f5f5f6;
}

/* ---- header ---- */
.fq-garch__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
  padding-bottom: 1.6rem;
  margin: 0 0 1.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
}
.fq-garch__kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
/* The active artist is named first and in near-white: never a mystery whose
   archive this is, and never the wrong band. */
.fq-garch__artist {
  color: rgba(245, 245, 246, 0.92);
}
.fq-garch__kdot,
.fq-garch__label {
  color: rgba(245, 245, 246, 0.55);
}
.fq-garch h1 {
  margin: 0.5rem 0 0;
  max-width: 16ch;
  font-size: clamp(1.95rem, 6vw, 2.9rem);
  font-weight: 620;
  letter-spacing: -0.045em;
  line-height: 1.03;
}
.fq-garch__counts {
  margin: 0.7rem 0 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
}
.fq-garch__create {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.65rem 1rem;
  border-radius: 0.7rem;
  background: #f5f5f6;
  color: #08090a;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
}
.fq-garch__create:hover {
  background: #ffffff;
}
.fq-garch__create:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}

.fq-garch__page {
  display: grid;
  justify-items: start;
  gap: 0.35rem;
  margin: -0.4rem 0 1.8rem;
}
.fq-garch__page h2 {
  margin: 0;
  color: rgba(245, 245, 246, 0.55);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.fq-garch__page-copy,
.fq-garch__page-hint,
.fq-garch__page-meta,
.fq-garch__page-state {
  margin: 0;
}
.fq-garch__page-copy,
.fq-garch__page-hint,
.fq-garch__page-meta {
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.92rem;
  line-height: 1.4;
}
.fq-garch__page-hint {
  font-size: 0.84rem;
}
.fq-garch__page-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  width: min(100%, 36rem);
  margin-top: 0.35rem;
}
.fq-garch__page-row .fq-garch__page-copy {
  min-width: 0;
  flex: 1 1 12rem;
}
.fq-garch__page-thumb {
  width: 3rem;
  height: 3rem;
  flex: 0 0 auto;
  border-radius: 0.45rem;
  object-fit: cover;
}
.fq-garch__page-title {
  margin: 0;
  color: #f5f5f6;
  font-size: 0.98rem;
  font-weight: 620;
  letter-spacing: -0.02em;
  line-height: 1.25;
}
.fq-garch__page-state {
  color: rgba(245, 245, 246, 0.92);
  font-size: 0.84rem;
  font-weight: 620;
}
.fq-garch__page-remove {
  margin-left: auto;
  min-height: 44px;
  padding: 0 0.2rem;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.fq-garch__page-remove:hover {
  color: #f5f5f6;
}
.fq-garch__page-remove:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 2px;
}
.fq-garch__page-remove:disabled {
  opacity: 0.45;
  cursor: default;
}

/* ---- the sheet ---- */
.fq-garch__shelves {
  display: grid;
  gap: 2.9rem;
}
.fq-garch__cap {
  margin: 0;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.84rem;
  line-height: 1.45;
}

/* ---- transitional states ---- */
.fq-garch__loadrow {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.15rem;
}
.fq-garch__loadrail {
  display: grid;
  justify-items: start;
  gap: 0.6rem;
  align-content: start;
}
.fq-garch__loadline {
  display: block;
  height: 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
}
.fq-garch__loadline.is-short {
  width: 6rem;
}
.fq-garch__loadline.is-wide {
  width: 9.5rem;
  height: 1.15rem;
}
.fq-garch__loadgrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.9rem 1.05rem;
}
.fq-garch__live,
.fq-garch__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.fq-garch__state,
.fq-garch__empty {
  display: grid;
  justify-items: start;
  gap: 0.55rem;
  max-width: 28rem;
  min-height: 16rem;
  padding: 1.6rem 0 0;
}
.fq-garch__state h2,
.fq-garch__empty h2 {
  margin: 0.15rem 0 0;
  font-size: clamp(1.6rem, 5vw, 2.15rem);
  font-weight: 620;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.fq-garch__state p,
.fq-garch__empty p:not(.fq-garch__kicker) {
  margin: 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.95rem;
  line-height: 1.45;
}
.fq-garch__retry {
  margin-top: 0.4rem;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f6;
  font-size: 0.88rem;
  font-weight: 650;
  cursor: pointer;
}
.fq-garch__retry:focus-visible,
.fq-garch__empty .fq-garch__create:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}
.fq-garch__empty .fq-garch__create {
  margin-top: 0.55rem;
}

@media (min-width: 600px) {
  .fq-garch__loadgrid {
    grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  }
}

@media (min-width: 1080px) {
  .fq-garch {
    padding-left: 2rem;
    padding-right: 2rem;
  }
  .fq-garch__shelves {
    gap: 3.4rem;
  }
  .fq-garch__loadrow {
    grid-template-columns: minmax(11.5rem, 15rem) minmax(0, 1fr);
    gap: 2.4rem;
  }
  .fq-garch__loadgrid {
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: 2.1rem 1.35rem;
  }
}

/* A wider sheet on a large display, without letting a print become a poster. */
@media (min-width: 1700px) {
  .fq-garch {
    max-width: 96rem;
  }
  .fq-garch__loadrow {
    grid-template-columns: minmax(13rem, 17rem) minmax(0, 1fr);
    gap: 3rem;
  }
  .fq-garch__loadgrid {
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  }
}

@media (max-width: 759px) {
  .fq-garch {
    padding-left: 0.95rem;
    padding-right: 0.95rem;
  }
  .fq-garch__head {
    display: grid;
    align-items: start;
    gap: 1.15rem;
    padding-bottom: 1.35rem;
    margin-bottom: 1.6rem;
  }
  .fq-garch h1 {
    max-width: 13ch;
  }
  .fq-garch__create {
    width: max-content;
  }
  .fq-garch__shelves {
    gap: 2.5rem;
  }
}

@media (max-width: 360px) {
  .fq-garch {
    padding-left: 0.8rem;
    padding-right: 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fq-garch__create {
    transition: none;
  }
}
</style>
