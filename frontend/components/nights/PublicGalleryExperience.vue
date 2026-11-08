<template>
  <div class="aw" :class="{ 'is-viewing': viewerOpen }">
    <template v-if="locked">
      <ArtistWorldChrome
        :artist-name="artistName"
        :artist-path="artistPath"
        :artist-image="artistImage"
        :back-to="navReturn.to"
        :back-label="navReturn.label"
        allow-share
        quiet
        @share="openShare"
      />
      <article class="aw__locked-page">
        <h1 class="aw__lock-title">{{ galleryTitle }}</h1>
        <div class="aw__locked">
          <img
            v-if="safeCover"
            class="aw__lock-cover"
            :src="safeCover"
            :alt="`${artistName} night`"
            @error="coverBroken = true"
          >
        </div>
        <p class="aw__lock-copy">{{ lockCopy }}</p>
        <NuxtLink :to="loginTo" class="aw__verify">{{ lockAction }}</NuxtLink>
      </article>
    </template>

    <template v-else>
      <!--
        The gallery's own bar owns Back and gallery-level Share. It slides
        away while a fan scrolls into the photographs and returns on the first
        scroll up. It goes inert with the rest of the page while a photograph
        is open.
      -->
      <GalleryTopBar
        :artist-name="artistName"
        :artist-path="artistPath"
        :back-to="navReturn.to"
        :back-label="navReturn.label"
        :inert="viewerOpen || undefined"
        allow-share
        @share="openShare"
      />

      <GalleryOverview
        :model="model"
        :origin="siteOrigin"
        :initial-photo-index="initialPhotoIndex"
        :top-control="false"
        @viewer="viewerOpen = $event"
      >
        <template #after>
          <!--
            The epilogue. After the closing rule: the fan's own relationship to
            this Night when the server says so, the way back into the Night,
            and the artist's other work — the natural next room, not a
            promotion.
          -->
          <div class="aw__after" :class="{ 'has-nav': showAppNav }">
            <div v-if="youWereThere || nightHref" class="aw__night">
              <div v-if="youWereThere" class="aw__there">
                <p class="aw__there-mark">You were there</p>
                <p v-if="ordinalLine" class="aw__ordinal">{{ ordinalLine }}</p>
              </div>
              <NuxtLink v-if="nightHref" :to="nightHref" class="aw__to-night">
                <span class="aw__to-night-kicker">Return to the Night</span>
                <span class="aw__to-night-name">{{ nightIdentity }}<span class="aw__arrow" aria-hidden="true">→</span></span>
                <span v-if="nightDate" class="aw__to-night-date">{{ nightDate }}</span>
              </NuxtLink>
            </div>

            <section v-if="moreGalleries.length" class="aw__more" aria-labelledby="aw-more-heading">
              <div class="aw__more-head">
                <h2 id="aw-more-heading" class="aw__more-heading">More from {{ artistName }}</h2>
                <NuxtLink v-if="archivePath" :to="archivePath" class="aw__more-all">
                  All galleries<span class="aw__arrow" aria-hidden="true">→</span>
                </NuxtLink>
              </div>
              <ul class="aw__more-list" :class="moreListClass">
                <li v-for="item in moreGalleries" :key="item.id || item.slug" class="aw__more-item">
                  <NuxtLink :to="item.canonicalPath" class="aw__more-link">
                    <span class="aw__more-cover">
                      <img
                        :src="item.cover.url"
                        :alt="item.cover.alt || item.title || ''"
                        :width="item.cover.width || undefined"
                        :height="item.cover.height || undefined"
                        sizes="(min-width: 1024px) 30vw, 86vw"
                        loading="lazy"
                        decoding="async"
                      >
                    </span>
                    <span class="aw__more-meta">
                      <span class="aw__more-title">{{ item.title || 'Gallery' }}</span>
                      <span class="aw__more-count">{{ photoLabel(item.photoCount) }}</span>
                    </span>
                  </NuxtLink>
                </li>
              </ul>
            </section>

            <!-- Nothing else to go to: the artist is still the way onward. -->
            <p v-else-if="!nightHref" class="aw__colophon">
              <NuxtLink :to="artistPath" class="aw__colophon-link">
                {{ artistName }}<span class="aw__arrow" aria-hidden="true">→</span>
              </NuxtLink>
            </p>
          </div>
        </template>
      </GalleryOverview>
    </template>

    <button
      v-if="showPassportNudge"
      type="button"
      class="aw-passport"
      @click="openGalleryPassport"
    >
      Keep {{ artistName }} with you
    </button>

    <!-- Signed-in fans keep the gallery itself. Needs the backend gallery id. -->
    <div v-if="showPassportSave" class="aw-passport-save" aria-live="polite">
      <NuxtLink v-if="passportSaved" to="/fan/passport" class="aw-passport">
        In your Passport
      </NuxtLink>
      <button
        v-else
        type="button"
        class="aw-passport"
        :disabled="passportSaving"
        @click="saveToPassport"
      >
        {{ passportSaving ? 'Saving…' : 'Save to Passport' }}
      </button>
      <p v-if="passportSaveError" class="aw-passport-save__error" role="alert">{{ passportSaveError }}</p>
    </div>

    <ClientOnly>
      <MobileBottomNav v-if="showAppNav && !viewerOpen" />
    </ClientOnly>

    <NightShareSheet
      :open="shareOpen"
      :share-url="shareUrl"
      :artist-name="artistName"
      :show-title="galleryTitle"
      :place-line="sharePlace"
      :image-url="shareImage"
      heading="Share this gallery"
      :note="shareReachNote"
      kind="gallery"
      format="square"
      @close="shareOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { usePublicArtistShare } from '~/composables/usePublicArtistShare'
import { publicArtistShareRecord } from '~/utils/share/dockShareTarget'
import { isFanPassportInvitesEnabled } from '~/config/fanAccountFeatureFlags'
import { useFanAccountConversion } from '~/composables/useFanAccountConversion'
import { readGalleryOpenIntent } from '~/utils/galleries/stackOpenNavigation'
import GalleryOverview from '~/features/gallery-experience/canonical/GalleryOverview.vue'
import GalleryTopBar from '~/features/gallery-experience/canonical/GalleryTopBar.vue'
import { normalizeGalleryModel } from '~/features/gallery-experience/canonical/galleryMediaModel'
import ArtistWorldChrome from '~/components/nights/ArtistWorldChrome.vue'
import NightShareSheet from '~/components/nights/NightShareSheet.vue'
import { nightPath } from '~/utils/nights/publicNightPaths'
import { morePublicGalleries, publicGalleryArchivePath, publicGalleryCountLabel } from '~/utils/galleries/publicGalleryDiscovery'
import { resolveGalleryReturn } from '~/utils/nights/artistWorldReturn'
import { fanLoginLocation } from '~/utils/fan/safeFanReturnTo'
import {
  formatNightDateLong,
  galleryLockActionLabel,
  nightVenueCityLine,
} from '~/utils/nights/nightDisplay'
import { yourShowOrdinalSentence } from '~/utils/nights/showOrdinalCopy'
import { faneqoShareUrl } from '~/utils/share/faneqoShare'
import { resolveFrontendOrigin } from '~/utils/site/faneqoOrigin'
import { nightStoryLockedCopy } from '~/utils/updates/nightStoryCopy'

const props = defineProps({
  payload: { type: Object, required: true },
  bandSlug: { type: String, default: '' },
  sharing: { type: Boolean, default: false },
  shareStatus: { type: String, default: '' },
  returnTo: { type: String, default: '' },
  from: { type: [String, Array], default: '' },
})

const emit = defineEmits(['share'])

const route = useRoute()
const config = useRuntimeConfig()
const user = useStrapiUser()
const { showAfterGallery } = useFanAccountConversion()
const requestUrl = useRequestURL()

/** True while a photograph is open, so this page can stand its chrome down. */
const viewerOpen = ref(false)
const initialPhotoIndex = ref(null)
const openedIntent = ref(false)
const coverBroken = ref(false)
const shareOpen = ref(false)

const gallery = computed(() => props.payload?.gallery || {})
const night = computed(() => props.payload?.night || null)
const artist = computed(() => props.payload?.artist || {})
const { publish: publishPublicArtist } = usePublicArtistShare()
watch(
  () => [
    route.params.bandSlug,
    artist.value?.slug || '',
    artist.value?.name || '',
    artist.value?.image?.url || '',
  ],
  () => {
    const record = publicArtistShareRecord({
      routeSlug: route.params.bandSlug,
      loaded: {
        slug: artist.value?.slug,
        name: artist.value?.name,
        profileImage: artist.value?.image?.url,
      },
    })
    if (record) publishPublicArtist(record)
  },
  { immediate: true }
)
const viewer = computed(() => props.payload?.viewer || {})
const artistName = computed(() => String(artist.value.name || '').trim() || 'Artist')
const artistPath = computed(() => (props.bandSlug ? `/${props.bandSlug}` : '/'))
const artistImage = computed(() => artist.value.image?.url || '')
const galleryTitle = computed(() => String(gallery.value.title || night.value?.venue || 'Photos').trim())
const locked = computed(() => !!gallery.value.locked)
const media = computed(() => (locked.value ? [] : (gallery.value.media || [])))
const showPassportNudge = computed(() => (
  isFanPassportInvitesEnabled()
  && !user.value
  && !locked.value
  && media.value.length > 0
  && !viewerOpen.value
))
const galleryId = computed(() => {
  const id = Number(gallery.value?.id)
  return Number.isInteger(id) && id > 0 ? id : null
})
// The band's own team doesn't save its gallery; every other signed-in
// account, artist accounts included, can keep it as a fan.
const showPassportSave = computed(() => (
  !!user.value
  && !viewer.value.isArtist
  && !!galleryId.value
  && !locked.value
  && media.value.length > 0
  && !viewerOpen.value
))
const passport = useFanPassport()
const passportSaved = ref(false)
const passportSaving = ref(false)
const passportSaveError = ref('')

async function refreshPassportSaved() {
  if (!showPassportSave.value) return
  try {
    const result = await passport.listGallerySaves()
    passportSaved.value = (result.galleries || []).some((row) => Number(row?.gallery?.id) === galleryId.value)
  } catch {
    passportSaved.value = false
  }
}

async function saveToPassport() {
  if (!galleryId.value || passportSaving.value) return
  passportSaving.value = true
  passportSaveError.value = ''
  try {
    await passport.saveGallery(galleryId.value)
    passportSaved.value = true
  } catch {
    passportSaveError.value = 'This gallery could not be saved. Try again.'
  } finally {
    passportSaving.value = false
  }
}

onMounted(refreshPassportSaved)
watch(() => [user.value?.id, galleryId.value], refreshPassportSaved)
const nightHref = computed(() => nightPath(props.bandSlug, night.value?.nightSlug))
const nightIdentity = computed(() => nightVenueCityLine({
  venue: night.value?.venue,
  city: night.value?.city,
}) || 'This night')
const nightDate = computed(() => formatNightDateLong(
  night.value?.date || night.value?.performanceStartsAt,
  night.value?.timezone,
))
const youWereThere = computed(() => !!viewer.value.youWereThere && !!nightHref.value)
const ordinalLine = computed(() => yourShowOrdinalSentence({
  showOrdinal: viewer.value.showOrdinal,
  artistName: artistName.value,
}) || '')
const navReturn = computed(() => resolveGalleryReturn({
  from: props.from,
  nightHref: nightHref.value,
  nightLabel: nightIdentity.value,
  artistPath: artistPath.value,
  artistName: artistName.value,
}))
const lockCopy = computed(() => nightStoryLockedCopy({
  lockReason: gallery.value.lockReason,
  visibility: gallery.value.visibility,
  artistName: artistName.value,
}))
const lockAction = computed(() => galleryLockActionLabel(gallery.value.lockReason, gallery.value.visibility))
const loginTo = computed(() => fanLoginLocation(props.returnTo))
const safeCover = computed(() => {
  if (!locked.value || coverBroken.value) return ''
  return night.value?.cover?.url || artist.value.image?.url || ''
})
const fromPath = computed(() => {
  const raw = Array.isArray(props.from) ? props.from[0] : props.from
  return String(raw || '').trim()
})
const showAppNav = computed(() => fromPath.value === '/galleries' || !!viewer.value.isArtist)
const siteOrigin = computed(() => resolveFrontendOrigin({
  configuredOrigin: config.public?.baseUrl,
  requestOrigin: requestUrl?.origin,
}))
/**
 * The single normalization boundary for this page. Everything downstream —
 * identity, the wall, the viewer, share intents — reads this one flat shape
 * and knows nothing about the public payload's structure.
 */
const archivePath = computed(() => (
  locked.value ? '' : publicGalleryArchivePath(props.bandSlug)
))
const { listGalleries } = usePublicNight()
const { data: publicArchive } = await useAsyncData(
  `public-galleries:${props.bandSlug}`,
  () => listGalleries({ bandSlug: props.bandSlug }).catch(() => ({ galleries: [] })),
)
const moreGalleries = computed(() => (
  locked.value
    ? []
    : morePublicGalleries(publicArchive.value?.galleries, gallery.value?.slug, 3)
))
function photoLabel(count) {
  return publicGalleryCountLabel(count)
}
const moreListClass = computed(() => {
  const n = moreGalleries.value.length
  if (n === 1) return 'is-one'
  if (n === 2) return 'is-two'
  return ''
})
const model = computed(() => {
  const base = normalizeGalleryModel(props.payload, {
    bandSlug: props.bandSlug,
    origin: siteOrigin.value,
  })
  if (!base?.identity || !archivePath.value) return base
  return {
    ...base,
    identity: { ...base.identity, archivePath: archivePath.value },
  }
})
const shareUrl = computed(() => faneqoShareUrl({
  canonicalPath: props.payload?.share?.canonicalPath,
  origin: siteOrigin.value,
}) || '')
const shareImage = computed(() => {
  const fromShare = String(props.payload?.share?.image?.url || '').trim()
  if (fromShare && !/^faneqo-protected:\/\//i.test(fromShare)) return fromShare
  return artistImage.value
})
const sharePlace = computed(() => [nightIdentity.value, nightDate.value].filter(Boolean).join(' · '))
/**
 * Audience access and link reach are different things. A public gallery's link
 * opens for anyone; a gated gallery's link still checks the viewer.
 */
const shareReachNote = computed(() => (
  gallery.value?.visibility === 'public'
    ? 'Anyone with this shared link can view this gallery.'
    : 'Only fans who can already see this gallery will be able to open this link.'
))

/**
 * The Gallery Stack hands over a photograph via `?photo=` or history state.
 * It reveals and focuses that frame in the overview; it does not open the
 * viewer. Only a real deep link (`#photo-<mediaId>`, handled inside
 * `GalleryOverview`) opens straight onto a photograph.
 */
function galleryPassportPhotos() {
  return media.value
    .slice(0, 3)
    .map((item) => ({
      src: item?.thumbnailUrl || item?.thumbUrl || item?.url || item?.src || '',
      alt: item?.alt || '',
    }))
    .filter((item) => item.src)
}

function openGalleryPassport() {
  showAfterGallery({
    bandName: artistName.value,
    returnTo: props.returnTo || route.fullPath,
    artistImage: artistImage.value,
    photos: galleryPassportPhotos(),
    bandSlug: props.bandSlug,
    bandId: artist.value.id || artist.value.bandId || null,
  })
}

function applyOpenIntent() {
  if (openedIntent.value || locked.value || !media.value.length) return
  const intent = readGalleryOpenIntent({
    state: import.meta.client ? history.state : null,
    query: route.query,
    media: media.value,
  })
  if (intent.index == null) return
  openedIntent.value = true
  initialPhotoIndex.value = intent.index
}

onMounted(applyOpenIntent)
watch(media, applyOpenIntent)
watch(locked, (isLocked, wasLocked) => {
  if (wasLocked && !isLocked) {
    openedIntent.value = false
    applyOpenIntent()
  }
})

function openShare() {
  shareOpen.value = true
  emit('share')
}
</script>

<style scoped>
.aw {
  --bg-app: #050506;
  --text-primary: #f5f5f6;
  --text-secondary: rgba(245, 245, 246, 0.62);
  --text-muted: rgba(245, 245, 246, 0.4);
  min-height: 100dvh;
  overflow-x: clip;
  /* Obsidian, not a void. Only the open photograph sits on pure black. */
  background: #050608;
  color: var(--text-primary);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
/*
 * The viewer teleports into its own full-screen surface, so the page beneath
 * it only needs to stop competing: no scroll, no lingering chrome. The
 * overview itself is made `inert` by GalleryOverview.
 */
.aw.is-viewing {
  min-height: 100dvh;
}
.aw__locked-page {
  padding: 0.85rem max(1.25rem, env(safe-area-inset-left, 0px)) calc(2.1rem + env(safe-area-inset-bottom, 0px));
}
.aw__lock-title {
  margin: 0;
  font-size: clamp(1.15rem, 4.6vw, 1.35rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.12;
  overflow-wrap: anywhere;
}
.aw__locked { margin-top: 1.05rem; }
.aw__lock-cover {
  display: block;
  width: 100%;
  max-height: min(52vh, 26rem);
  object-fit: cover;
  background: #0d0f13;
}
.aw__lock-copy {
  margin: 1.2rem 0 0;
  max-width: 28rem;
  font-size: 1.12rem;
  line-height: 1.55;
  color: rgba(245, 245, 246, 0.86);
}
.aw__verify {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 1.05rem;
  padding: 0 1.15rem;
  border-radius: 14px;
  background: #f5f5f6;
  color: #050506;
  font-weight: 700;
  text-decoration: none;
}
/*
 * The epilogue shares the sequence's column: the same side margins as the
 * threshold above, so Night, attendance and the artist's other work hang on
 * the edges the photographs just used.
 */
.aw__after {
  --aw-x: max(20px, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
  max-width: calc(1280px + 2 * var(--aw-x));
  margin: 0 auto;
  padding: 28px var(--aw-x) calc(72px + env(safe-area-inset-bottom, 0px));
}
.aw__after.has-nav {
  padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px));
}
@media (min-width: 640px) {
  .aw__after { --aw-x: max(32px, env(safe-area-inset-left, 0px)); padding-top: 32px; }
}
@media (min-width: 1024px) {
  .aw__after {
    --aw-x: max(56px, env(safe-area-inset-left, 0px));
    padding-top: 36px;
    padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  }
}
@media (min-width: 1440px) {
  .aw__after { --aw-x: max(72px, env(safe-area-inset-left, 0px)); }
}

/* ---- the Night ---- */

.aw__night {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
@media (min-width: 1024px) {
  .aw__night {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 48px;
  }
}
.aw__there { margin: 0; }
.aw__there-mark {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.085em;
  text-transform: uppercase;
  color: #39d5ff;
}
.aw__ordinal {
  margin: 6px 0 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.aw__to-night {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 44px;
  color: inherit;
  text-decoration: none;
}
.aw__to-night-kicker {
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.5);
}
.aw__to-night-name {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.024em;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
@media (min-width: 1024px) {
  .aw__to-night-name { font-size: 22px; }
}
.aw__to-night-date {
  margin-top: 4px;
  font-size: 15px;
  color: rgba(247, 249, 252, 0.62);
}
/* Inside a flex container a leading space is trimmed, so the arrow carries its own gap. */
.aw__arrow {
  display: inline-block;
  margin-left: 0.4em;
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* ---- more from the artist ---- */

.aw__more {
  margin-top: 8px;
}
.aw__night + .aw__more {
  margin-top: 40px;
}
@media (min-width: 1024px) {
  .aw__more { margin-top: 8px; }
  .aw__night + .aw__more { margin-top: 48px; }
}
.aw__more-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
@media (min-width: 1024px) {
  .aw__more-head { margin-bottom: 24px; }
}
.aw__more-heading {
  margin: 0;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.5);
}
@media (min-width: 1024px) {
  .aw__more-heading { font-size: 13px; }
}
.aw__more-all {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin: -12px 0;
  color: rgba(247, 249, 252, 0.62);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 160ms linear;
}
.aw__more-all:hover { color: #f7f9fc; }

/*
 * On a phone each cover is nearly the width of the glass — a photograph,
 * not a chip. From a laptop the three hang as stills in one row.
 */
.aw__more-list {
  display: flex;
  gap: 16px;
  margin: 0 calc(-1 * var(--aw-x));
  padding: 0 var(--aw-x);
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--aw-x);
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.aw__more-list::-webkit-scrollbar { display: none; }
.aw__more-item {
  flex: 0 0 86%;
  max-width: 520px;
  scroll-snap-align: start;
}
@media (min-width: 640px) {
  .aw__more-item { flex-basis: 56%; }
}
@media (min-width: 1024px) {
  .aw__more-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 28px;
    margin: 0;
    padding: 0;
    overflow: visible;
  }
  .aw__more-item { max-width: none; }
  .aw__more-list.is-one {
    grid-template-columns: minmax(0, 48rem);
  }
  .aw__more-list.is-two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.aw__more-link {
  display: block;
  color: inherit;
  text-decoration: none;
}
.aw__more-cover {
  display: block;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  background: #0b0c10;
}
.aw__more-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 200ms linear;
}
.aw__more-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}
.aw__more-title,
.aw__more-count {
  display: block;
}
.aw__more-title {
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: -0.018em;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.aw__more-count {
  flex: none;
  color: rgba(247, 249, 252, 0.48);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

/* ---- nothing else to go to ---- */

.aw__colophon {
  margin: 0;
}
.aw__colophon-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgba(247, 249, 252, 0.8);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
}

/* ---- states ---- */

.aw__more-link:focus-visible,
.aw__more-all:focus-visible,
.aw__colophon-link:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}
.aw__verify:focus-visible,
.aw__to-night:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (hover: hover) {
  .aw__to-night:hover .aw__arrow,
  .aw__more-all:hover .aw__arrow,
  .aw__colophon-link:hover .aw__arrow { transform: translateX(3px); }
  .aw__more-link:hover .aw__more-cover img { opacity: 0.88; }
}
@media (prefers-reduced-motion: reduce) {
  .aw { scroll-behavior: auto; }
  .aw__arrow,
  .aw__more-cover img,
  .aw__more-all { transition: none; }
}

.aw-passport {
  display: block;
  width: fit-content;
  margin: 1.5rem auto 2.5rem;
  padding: 0.35rem 0.2rem;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.72);
  font: inherit;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  cursor: pointer;
  min-height: 44px;
}

.aw-passport-save { text-align: center; }
.aw-passport-save .aw-passport { text-decoration: none; }
.aw-passport-save .aw-passport:disabled { cursor: progress; opacity: 0.6; }
.aw-passport-save__error {
  margin: -2rem 0 2.5rem;
  color: rgba(255, 196, 196, 0.85);
  font-size: 0.82rem;
}

.aw-passport:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}
</style>
