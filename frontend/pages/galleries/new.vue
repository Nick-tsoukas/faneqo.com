<template>
  <main class="gallery-new" :class="{ 'is-reveal': published && !returningToComposer }">
    <div v-if="loading" class="gallery-new__state" role="status">Opening gallery studio…</div>
    <div v-else-if="error" class="gallery-new__state" role="alert">
      <h1>We couldn’t open that gallery</h1>
      <p>{{ error }}</p>
      <NuxtLink :to="backTo" :replace="composerHop">Go back</NuxtLink>
    </div>
    <div v-else-if="!bandId" class="gallery-new__state">
      <h1>Artist access required</h1>
      <NuxtLink to="/dashboard">Go to Dashboard</NuxtLink>
    </div>

    <section v-else-if="!context" class="gallery-new__choose">
      <NuxtLink :to="backTo" :replace="composerHop" class="gallery-new__back">Back</NuxtLink>
      <p class="gallery-new__kicker">Create gallery</p>
      <h1>What is this gallery from?</h1>
      <p class="gallery-new__lede">The source determines what Faneqo can truthfully say and who can receive it.</p>

      <div class="gallery-new__choice-grid">
        <button type="button" class="gallery-new__choice" @click="context = 'show'">
          <strong>A show</strong>
          <span>Use verified attendance and let the people who were there save the night to Fan Passport.</span>
        </button>
        <button type="button" class="gallery-new__choice" @click="context = 'general'">
          <strong>Something else</strong>
          <span>Rehearsal, backstage, studio, release day, tour diary, or a photo shoot.</span>
        </button>
      </div>
    </section>

    <section v-else-if="context === 'show' && !selectedRecap" class="gallery-new__choose">
      <button type="button" class="gallery-new__back" @click="context = null">Back</button>
      <p class="gallery-new__kicker">Verified show gallery</p>
      <h1>Choose the night</h1>
      <p class="gallery-new__lede">Only a real Show Recap can create attendee-only access. Newest first.</p>

      <div class="gallery-new__search">
        <label class="gallery-new__search-label" for="recap-search">Search your shows</label>
        <input
          id="recap-search"
          v-model="recapSearch"
          type="search"
          class="gallery-new__search-input"
          placeholder="City, venue, or show title"
          autocomplete="off"
        />
      </div>

      <p class="gallery-new__live" aria-live="polite">{{ recapStatusLine }}</p>

      <div v-if="recapsError" class="gallery-new__empty" role="alert">
        <h2>We couldn’t load your shows</h2>
        <p>{{ recapsError }}</p>
        <button type="button" class="gallery-new__retry" @click="loadRecaps({ reset: true })">Try again</button>
      </div>
      <div v-else-if="recapsLoading && !recaps.length" class="gallery-new__state is-inline" role="status">
        Loading Show Recaps…
      </div>
      <div v-else-if="!recaps.length && recapSearchApplied" class="gallery-new__empty">
        <h2>No shows match “{{ recapSearchApplied }}”</h2>
        <p>Try a city, a venue, or part of the show title.</p>
        <button type="button" class="gallery-new__retry" @click="recapSearch = ''">Clear search</button>
      </div>
      <div v-else-if="!recaps.length" class="gallery-new__empty">
        <h2>No Show Recaps yet</h2>
        <p>After Show Mode ends, the recap will appear here.</p>
        <NuxtLink to="/dashboard">Go to Show Mode</NuxtLink>
      </div>
      <template v-else>
        <ul class="gallery-new__recaps">
          <li v-for="recapOption in recaps" :key="recapOption.id">
            <button type="button" @click="chooseRecap(recapOption)">
              <span>
                <strong>{{ recapOption.showTitle || recapOption.venue || recapOption.city || 'Live show' }}</strong>
                <small>{{ recapLine(recapOption) }}</small>
              </span>
              <span>{{ recapOption.checkedInShowCount || 0 }} checked in →</span>
            </button>
          </li>
        </ul>
        <button
          v-if="recapsHasMore"
          type="button"
          class="gallery-new__retry"
          :disabled="recapsLoading"
          @click="loadRecaps()"
        >
          {{ recapsLoading ? 'Loading…' : 'Load more shows' }}
        </button>
      </template>
    </section>

    <template v-else-if="!published && !returningToComposer">
      <section v-if="selectedRecap" class="gallery-new__picked">
        <div>
          <p class="gallery-new__kicker">Selected show</p>
          <p class="gallery-new__picked-name">{{ selectedRecap.showTitle || selectedRecap.venue || selectedRecap.city || 'Live show' }}</p>
          <p class="gallery-new__picked-line">{{ recapLine(selectedRecap) }}</p>
        </div>
        <button v-if="canChangeRecap" type="button" class="gallery-new__retry" @click="clearRecap">Change show</button>
      </section>
      <ArtistUpdateComposer
        :band-id="bandId"
        :band-name="bandName"
        :mode="selectedRecap ? 'show-photos' : 'update'"
        :event-id="selectedRecap?.eventId || null"
        :show-recap-id="selectedRecap?.id || null"
        :show-label="selectedRecap?.showTitle || ''"
        :city="selectedRecap?.city || ''"
        :venue="selectedRecap?.venue || ''"
        :show-date="selectedRecap?.showStartedAt || selectedRecap?.recapGeneratedAt || ''"
        :time-zone="selectedRecap?.timezone || ''"
        :back-to="backTo"
        :back-replace="composerHop"
        rocksnaps
        @published="onPublished"
      />
    </template>

    <section v-else-if="returningToComposer" class="gallery-new__done" role="status">
      <span class="gallery-new__done-mark">✓</span>
      <p class="gallery-new__kicker">Published</p>
      <h1>Taking you back to your message</h1>
      <p>Your new gallery is attached.</p>
    </section>

    <GalleryPublishReveal
      v-else
      :title="published.title || ''"
      :cover-src="publishedCover.src"
      :cover-alt="publishedCover.alt"
      :photo-count="Number(published.photoCount) || 0"
      :audience="audienceName(published.visibility)"
      :featured="featuredNow"
      :featuring="featuring"
      :feature-error="featureError"
      :kept-title="keptTitle"
      :can-feature="canOfferFeature"
      :artist-page-path="artistPagePath"
      :gallery-path="galleryPath || ''"
      :send-path="sendPath"
      :send-label="selectedRecap ? 'Message attendees' : 'Message all fans'"
      :return-path="returnWithGallery || ''"
      :rocksnaps="published.rocksnapsEnabled === true"
      @feature="showOnArtistPage"
    />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ArtistUpdateComposer from '~/components/updates/ArtistUpdateComposer.vue'
import GalleryPublishReveal from '~/components/galleries/GalleryPublishReveal.vue'
import { useBandTeam } from '~/composables/useBandTeam'
import { useGalleryDrafts } from '~/composables/useGalleryDrafts'
import { useShowRecaps } from '~/composables/useShowRecaps'
import { resolveComposerBand } from '~/utils/campaigns/resolveComposerBand'
import { formatShowNightDateLong } from '~/utils/shows/formatShowNightDate'
import {
  buildGalleryComposerResume,
  buildGalleryComposerReturn,
  isGalleryComposerReturn,
} from '~/utils/updates/galleryComposerReturn'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Create Gallery · Faneqo', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const { featureGalleryOnProfile } = useGalleryDrafts()
const { getMyBandAccess } = useBandTeam()
const { hint: activeBandHint, needsPicker } = useWorkspaceBand({
  permission: 'sendFanMessages',
})
const { getRecapDetail, getRecaps } = useShowRecaps()
const loading = ref(true)
const error = ref('')
const bandId = ref(null)
const bandName = ref('')
const bandSlug = ref('')
const context = ref(route.query.context === 'general' ? 'general' : route.query.recapId ? 'show' : null)
const selectedRecap = ref(null)
const recaps = ref([])
const recapsLoading = ref(false)
const recapsError = ref('')
const recapSearch = ref('')
const recapSearchApplied = ref('')
const recapPage = ref(0)
const recapsHasMore = ref(false)
const published = ref(null)
const featuredNow = ref(false)
const featureError = ref('')
const keptTitle = ref('')
const featuring = ref(false)
const returningToComposer = ref(false)

function audienceName(visibility) {
  if (visibility === 'fan_list') return 'Fans'
  if (visibility === 'show_attendees') return 'People who were there'
  return 'Everyone'
}

const publishedCover = computed(() => {
  const row = published.value
  const media = Array.isArray(row?.media) ? row.media : []
  const coverId = row?.coverMediaId
  const match = coverId == null
    ? null
    : media.find((item) => String(item?.mediaId ?? item?.id) === String(coverId))
  const photo = match || media.find((item) => item?.largeUrl || item?.url || item?.src)
  const src = photo?.largeUrl || photo?.url || photo?.src || ''
  return {
    src,
    alt: photo?.alt || row?.title || 'Gallery cover',
  }
})
const canOfferFeature = computed(() => (
  !featuredNow.value
  && published.value?.visibility === 'public'
  && Number(published.value?.photoCount) > 0
))
const artistPagePath = computed(() => (bandSlug.value ? `/${bandSlug.value}` : ''))

const RECAP_PAGE_SIZE = 20
/* Never load unbounded history: one page at a time, newest first. */
let recapSearchTimer = null
let recapRequest = 0

function safeReturn(value) {
  const raw = String(value || '')
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw
  return '/galleries'
}

const composerHop = computed(() => isGalleryComposerReturn({
  from: route.query.from,
  returnGallery: route.query.returnGallery,
}))

const backTo = computed(() => {
  const resume = buildGalleryComposerResume({
    from: route.query.from,
    returnGallery: route.query.returnGallery,
    draftKey: route.query.draftKey,
  })
  return resume || safeReturn(route.query.from)
})
const galleryPath = computed(() => {
  if (!published.value?.slug || !bandSlug.value) return null
  const path = `/${bandSlug.value}/gallery/${published.value.slug}`
  const from = backTo.value && backTo.value !== path ? backTo.value : '/galleries'
  return `${path}?from=${encodeURIComponent(from)}`
})

const sendPath = computed(() => ({
  path: '/messages/compose',
  query: selectedRecap.value
    ? {
        audienceType: 'show_attendees',
        recapId: String(selectedRecap.value.id),
        galleryId: String(published.value?.id || ''),
        from: '/galleries',
      }
    : {
        audienceType: 'all_fans',
        galleryId: String(published.value?.id || ''),
        from: '/galleries',
      },
}))

const returnWithGallery = computed(() => buildGalleryComposerReturn({
  from: route.query.from,
  returnGallery: route.query.returnGallery,
  galleryId: published.value?.id,
  draftKey: route.query.draftKey,
}))

onMounted(async () => {
  try {
    const access = await getMyBandAccess()
    const band = resolveComposerBand(access, activeBandHint.value)
    if (!band && needsPicker.value) {
      await navigateTo('/dashboard')
      return
    }
    bandId.value = band?.bandId || null
    bandName.value = band?.name || ''
    bandSlug.value = band?.slug || ''
    if (!bandId.value) return

    if (route.query.recapId) {
      selectedRecap.value = await getRecapDetail(route.query.recapId)
      if (!selectedRecap.value) error.value = 'That Show Recap is unavailable or belongs to another band.'
    } else if (context.value !== 'general') {
      await loadRecaps()
    }
  } catch (err) {
    error.value = err?.message || 'Could not open the gallery studio.'
  } finally {
    loading.value = false
  }
})

async function loadRecaps({ reset = false } = {}) {
  if (recapsLoading.value && !reset) return
  const term = String(recapSearch.value || '').trim()
  const page = reset ? 1 : recapPage.value + 1
  const ticket = (recapRequest += 1)
  recapsLoading.value = true
  recapsError.value = ''
  try {
    const result = await getRecaps({ page, pageSize: RECAP_PAGE_SIZE, search: term })
    /* A slower earlier request must never overwrite a newer search. */
    if (ticket !== recapRequest) return
    const rows = result?.data || []
    recaps.value = page === 1 ? rows : [...recaps.value, ...rows]
    recapPage.value = page
    recapSearchApplied.value = term
    const pagination = result?.meta?.pagination || {}
    const pageCount = Number(pagination.pageCount || 0)
    recapsHasMore.value = pageCount
      ? page < pageCount
      : rows.length === RECAP_PAGE_SIZE
  } catch (err) {
    if (ticket !== recapRequest) return
    recapsError.value = err?.message || 'Could not load your shows.'
  } finally {
    if (ticket === recapRequest) recapsLoading.value = false
  }
}

watch(recapSearch, () => {
  if (recapSearchTimer) clearTimeout(recapSearchTimer)
  recapSearchTimer = setTimeout(() => {
    recapSearchTimer = null
    loadRecaps({ reset: true })
  }, 300)
})

onBeforeUnmount(() => {
  if (recapSearchTimer) clearTimeout(recapSearchTimer)
})

const recapStatusLine = computed(() => {
  if (recapsError.value) return 'Could not load your shows.'
  if (recapsLoading.value) return 'Loading shows…'
  const n = recaps.value.length
  if (!n) return recapSearchApplied.value ? 'No matching shows.' : 'No shows yet.'
  const suffix = recapsHasMore.value ? ' so far' : ''
  return `${n} ${n === 1 ? 'show' : 'shows'}${suffix}`
})

/* A recap arriving by deep link is the caller's intent, not a browse choice. */
const canChangeRecap = computed(() => !route.query.recapId)

async function chooseRecap(option) {
  const detail = await getRecapDetail(option.id)
  if (!detail) {
    error.value = 'That Show Recap is unavailable.'
    return
  }
  selectedRecap.value = detail
}

async function clearRecap() {
  selectedRecap.value = null
  if (!recaps.value.length) await loadRecaps({ reset: true })
}

function recapLine(item) {
  const date = item.showStartedAt || item.recapGeneratedAt
  const when = formatShowNightDateLong(date, { timeZone: item.timezone || undefined })
  return [item.venue, item.city, when].filter(Boolean).join(' · ')
}

async function showOnArtistPage() {
  if (!published.value?.id || featuring.value || featuredNow.value) return
  featuring.value = true
  featureError.value = ''
  try {
    const result = await featureGalleryOnProfile(published.value.id)
    if (result?.data?.featuredOnProfile === true) {
      featuredNow.value = true
      keptTitle.value = ''
      return
    }
    featureError.value = 'Could not show this gallery on your artist page.'
  } catch (err) {
    featureError.value = err?.data?.error?.message || err?.message || 'Could not show this gallery on your artist page.'
  } finally {
    featuring.value = false
  }
}

async function onPublished(row) {
  published.value = row
  featuredNow.value = row?.featuredOnProfile === true
  featureError.value = row?.featuredOnProfile === true ? '' : (row?.featureError || '')
  keptTitle.value = row?.keptFeaturedTitle || ''
  /* The canonical URL comes from the publish response, never from guesswork. */
  const publishedBandSlug = row?.band?.slug || row?.bandSlug || ''
  if (publishedBandSlug) bandSlug.value = publishedBandSlug
  const dest = buildGalleryComposerReturn({
    from: route.query.from,
    returnGallery: route.query.returnGallery,
    galleryId: row?.id,
    draftKey: route.query.draftKey,
  })
  if (!dest) return
  returningToComposer.value = true
  try {
    await navigateTo(dest, { replace: true })
  } catch {
    returningToComposer.value = false
  }
}
</script>

<style scoped>
.gallery-new.is-reveal {
  padding: 0;
  background: transparent;
}
.gallery-new {
  min-height: 100dvh;
  padding: calc(var(--header-height, 70px) + 0.75rem) 1rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(760px 320px at 8% -8%, rgba(57, 213, 255, 0.08), transparent 54%),
    radial-gradient(760px 320px at 100% 0, rgba(69, 227, 174, 0.06), transparent 50%),
    #050608;
  color: #fff;
}
.gallery-new__choose,
.gallery-new__done {
  max-width: 44rem;
  margin: 0 auto;
  padding: 1rem 0;
}
.gallery-new__back {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  margin-bottom: 1rem;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.58);
  text-decoration: none;
}
.gallery-new__kicker {
  margin: 0;
  color: #39d5ff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.gallery-new h1 {
  margin: 0.2rem 0;
  font-size: clamp(1.8rem, 6vw, 2.7rem);
  letter-spacing: -0.05em;
}
.gallery-new__lede {
  max-width: 38rem;
  margin: 0.45rem 0 1.25rem;
  color: rgba(255, 255, 255, 0.52);
  line-height: 1.5;
}
.gallery-new__choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}
.gallery-new__choice {
  min-height: 10rem;
  padding: 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.025);
  color: #fff;
  text-align: left;
}
.gallery-new__choice:hover {
  border-color: rgba(57, 213, 255, 0.35);
  background: rgba(57, 213, 255, 0.05);
}
.gallery-new__choice:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}
.gallery-new__choice strong { display: block; font-size: 1.05rem; }
.gallery-new__choice span {
  display: block;
  margin-top: 0.45rem;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.8rem;
  line-height: 1.5;
}
.gallery-new__recaps {
  display: grid;
  gap: 0.55rem;
  padding: 0;
  list-style: none;
}
.gallery-new__recaps button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  min-height: 4.7rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  background: #0b0c10;
  color: #fff;
  text-align: left;
}
.gallery-new__recaps button:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}
.gallery-new__recaps button > span { display: grid; gap: 0.18rem; }
.gallery-new__recaps small,
.gallery-new__recaps button > span:last-child {
  color: rgba(255, 255, 255, 0.44);
  font-size: 0.72rem;
}
.gallery-new__search {
  margin: 0 0 0.9rem;
}
.gallery-new__search-label {
  display: block;
  margin-bottom: 0.35rem;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.78rem;
  font-weight: 600;
}
.gallery-new__search-input {
  width: 100%;
  min-height: 44px;
  padding: 0 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  background: #0b0c10;
  color: #fff;
  font: inherit;
  font-size: 0.9rem;
}
.gallery-new__search-input:focus {
  outline: none;
  border-color: #39d5ff;
  box-shadow: 0 0 0 1px #39d5ff;
}
.gallery-new__live {
  margin: 0 0 0.6rem;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}
.gallery-new__retry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 0.7rem;
  padding: 0 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.7rem;
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 650;
  cursor: pointer;
}
.gallery-new__retry:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); }
.gallery-new__retry:focus-visible { outline: 2px solid #39d5ff; outline-offset: 2px; }
.gallery-new__retry:disabled { opacity: 0.45; cursor: default; }
.gallery-new__picked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem;
  max-width: 36rem;
  margin: 0 auto;
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.025);
}
.gallery-new__picked-name {
  margin: 0.15rem 0 0;
  font-size: 0.98rem;
  font-weight: 680;
  letter-spacing: -0.02em;
}
.gallery-new__picked-line {
  margin: 0.2rem 0 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.78rem;
  line-height: 1.45;
}
.gallery-new__picked .gallery-new__retry { margin-top: 0; }
.gallery-new__state,
.gallery-new__empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.6rem;
  min-height: 18rem;
  max-width: 38rem;
  margin: 0 auto;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
}
.gallery-new__state.is-inline { min-height: 8rem; }
.gallery-new__state a,
.gallery-new__empty a { color: #39d5ff; }
.gallery-new__done { text-align: center; }
.gallery-new__done-mark {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  margin: 1rem auto;
  border-radius: 999px;
  background: rgba(69, 227, 174, 0.14);
  color: #45e3ae;
  font-size: 1.3rem;
}
.gallery-new__done > p:not(.gallery-new__kicker) { color: rgba(255, 255, 255, 0.55); }
.gallery-new__done-actions {
  display: flex;
  justify-content: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}
.gallery-new__place {
  max-width: 28rem;
  margin: 0.35rem auto 0;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.45;
}
.gallery-new__alert {
  max-width: 28rem;
  margin: 0.55rem auto 0;
  color: #fecaca;
  line-height: 1.45;
}
.gallery-new__done-actions a,
.gallery-new__done-actions button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 0.85rem;
  border: 0;
  border-radius: 0.75rem;
  text-decoration: none;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}
.gallery-new__done-actions button:disabled {
  opacity: 0.55;
  cursor: default;
}
.gallery-new__done-actions .primary {
  background: linear-gradient(90deg, #4ca6ff, #39d5ff, #45e3ae);
  color: #04140f;
}
.gallery-new__done-actions .secondary {
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
}
.gallery-new__done-actions a:focus-visible,
.gallery-new__done-actions button:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 1024px) {
  .gallery-new { padding-bottom: 3rem; }
}
@media (max-width: 620px) {
  .gallery-new { padding-left: 0.85rem; padding-right: 0.85rem; }
  .gallery-new__choice-grid { grid-template-columns: 1fr; }
  .gallery-new__recaps button {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 360px) {
  .gallery-new { padding-left: 0.75rem; padding-right: 0.75rem; }
}
</style>
