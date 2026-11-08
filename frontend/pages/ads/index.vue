<template>
  <main class="library">
    <header class="library__brand">
      <img src="/faneqo-wordmark.svg" alt="Faneqo" />
      <NuxtLink class="library__create" to="/ads/create">New creative</NuxtLink>
    </header>

    <div class="library__body">
      <div class="library__intro">
        <p class="library__kicker">Creative Studio</p>
        <h1>{{ pageTitle }}</h1>
        <p v-if="isArchive" class="library__lede">Earlier compositions. They still open and export. They are not editable template families.</p>
      </div>

      <StudioNav :current="isArchive ? 'archive' : 'library'" :archive-count="adsCatalog.length" />

      <nav v-if="!isArchive" class="library__lanes" aria-label="New creative">
        <NuxtLink to="/ads/create?lane=posts">Posts &amp; Ads</NuxtLink>
        <NuxtLink to="/ads/create?lane=video">Video &amp; Reels</NuxtLink>
        <NuxtLink to="/ads/create?lane=carousels">Carousels</NuxtLink>
      </nav>

      <div v-if="!isArchive" class="library__tools">
        <label class="library__search">
          <span class="sr">Search creations</span>
          <input
            v-model="query"
            type="search"
            placeholder="Search titles and artists"
            autocomplete="off"
          />
        </label>
        <div class="library__cats" role="group" aria-label="Filter creations">
          <button
            v-for="cat in LIBRARY_CATEGORIES"
            :key="cat.id"
            type="button"
            :aria-pressed="filter === cat.id"
            @click="setFilter(cat.id)"
          >
            {{ cat.label }}
            <span v-if="counts[cat.id]" class="library__count">{{ counts[cat.id] }}</span>
          </button>
        </div>
        <div class="library__refine">
          <div class="library__cats" role="group" aria-label="Media">
            <button type="button" :aria-pressed="media === 'all'" @click="setMedia('all')">All media</button>
            <button type="button" :aria-pressed="media === 'image'" @click="setMedia('image')">Images</button>
            <button type="button" :aria-pressed="media === 'carousel'" @click="setMedia('carousel')">Carousels</button>
          </div>
          <label class="library__sort">
            <span class="sr">Sort</span>
            <select :value="sort" @change="setSort($event.target.value)">
              <option v-for="option in LIBRARY_SORTS" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
          </label>
        </div>
      </div>

      <p v-if="usingScale" class="library__note">Development preview of {{ savedAll.length }} creatives. Nothing here is saved.</p>
      <p v-else-if="store.error.value" class="library__note is-error" role="alert">{{ store.error.value }}</p>
      <p v-else-if="!isArchive && store.mode.value === 'local' && !store.hasToken.value && savedAll.length" class="library__note">
        No Faneqo session in this browser. Creations stay on this device until you sign in.
      </p>
      <p v-else-if="!isArchive && store.mode.value === 'local' && savedAll.length" class="library__note">
        Faneqo could not be reached. Showing creations on this device. They are not durable.
      </p>
      <p v-else-if="!isArchive && localCount" class="library__note">
        {{ localCount }} {{ localCount === 1 ? 'creation is' : 'creations are' }} on this device only. Open one and choose Save to Faneqo.
      </p>

      <template v-if="!isArchive">
        <section v-for="group in savedGroups" :key="group.id" class="library__section">
          <h2 v-if="savedGroups.length > 1" class="library__h2">{{ group.label }} <span>{{ group.items.length }}</span></h2>
          <div class="library__shelf">
            <NuxtLink
              v-for="c in group.items"
              :key="c.id"
              class="ad-card"
              :to="`/ads/c/${encodeURIComponent(c.id)}`"
            >
              <div class="ad-card__frame">
                <div class="ad-card__art" :style="artStyle(cBoard(c))">
                  <CreativeThumb
                    v-if="templateComponentFor(c.templateId)"
                    :width="cBoard(c).width"
                    :height="cBoard(c).height"
                    :component="templateComponentFor(c.templateId)"
                    :format="cBoard(c).id"
                    :content="c.content || {}"
                    :snapshot="c.snapshot"
                  />
                </div>
              </div>
              <div class="ad-card__meta">
                <h2>{{ creativeDisplayTitle(c) }}</h2>
                <p>{{ cardLine(c) }}</p>
                <p class="ad-card__facts">
                  <span class="ad-card__status" :class="`is-${c.status}`">{{ c.status === 'ready' ? 'Ready' : 'Draft' }}</span>
                  <span>{{ c.sceneCount > 1 ? 'Carousel' : 'Image' }}</span>
                  <span>{{ formatChip(c) }}</span>
                  <span v-if="c.kind === 'ad'">Paid ad</span>
                  <span v-if="c.rightsStatus !== 'clear'" class="ad-card__rights">Needs permission</span>
                  <span v-if="c.storage !== 'api'">this device only</span>
                </p>
              </div>
            </NuxtLink>
          </div>
        </section>

        <section v-if="libraryReady && !visibleSaved.length" class="library__empty">
          <template v-if="query.trim()">
            <p class="library__kicker">No matches</p>
            <h2>Nothing in the library uses that name.</h2>
            <button type="button" class="library__create library__create--inline" @click="query = ''">Clear search</button>
          </template>
          <template v-else-if="(filter === 'all' || filter === 'status') && media === 'all'">
            <p class="library__kicker">Empty library</p>
            <h2>Start with a template.</h2>
            <p>Posts, films, and carousels. A PNG when the creative is ready.</p>
            <NuxtLink class="library__create library__create--inline" to="/ads/create">New creative</NuxtLink>
          </template>
          <template v-else>
            <p class="library__kicker">{{ filterLabel }}</p>
            <h2>Nothing in this filter yet.</h2>
            <button type="button" class="library__create library__create--inline" @click="setFilter('all')">Show all creations</button>
          </template>
        </section>
        <p v-else-if="!libraryReady && !savedAll.length" class="library__note">Loading your library…</p>
        <div v-if="visibleSaved.length > shown.length" class="library__more">
          <p>Showing {{ shown.length }} of {{ visibleSaved.length }}<template v-if="store.incomplete.value"> loaded</template></p>
          <button type="button" @click="shownCount += LIBRARY_PAGE_SIZE">Show more</button>
        </div>
      </template>

      <section v-else class="library__section">
        <div class="library__shelf">
          <NuxtLink
            v-for="ad in adsCatalog"
            :key="ad.slug"
            class="ad-card"
            :to="`/ads/${ad.slug}`"
          >
            <div class="ad-card__frame">
              <div class="ad-card__art" :style="artStyle(boardFor(ad))">
                <AdStage :width="boardFor(ad).width" :height="boardFor(ad).height">
                  <component :is="adComponentFor(ad.slug)" v-bind="previewProps(ad)" />
                </AdStage>
              </div>
            </div>
            <div class="ad-card__meta">
              <p class="ad-card__archive">Legacy composition</p>
              <h2>{{ ad.title }}</h2>
              <p>{{ formatSummary(ad.formats) }} · {{ sceneLabel(ad.sceneCount) }}</p>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdStage from '@/features/ads/AdStage.vue'
import { adsCatalog } from '@/features/ads/catalog.js'
import { AD_FORMATS, formatSummary, resolveAdFormat } from '@/features/ads/formats.js'
import { adComponentFor } from '@/features/ads/registry.js'
import { LIBRARY_CATEGORIES, LIBRARY_PAGE_SIZE, LIBRARY_SORTS, compareCreatives, creativeDisplayTitle, creativeMatchesCategory, creativeMatchesMedia, creativeMatchesQuery } from '@/features/ads/studio/creativeModel.js'
import CreativeThumb from '@/features/ads/studio/CreativeThumb.vue'
import StudioNav from '@/features/ads/studio/StudioNav.vue'
import { scaleLibrary } from '@/features/ads/studio/scaleFixture.js'
import { templateComponentFor, templateFamily } from '@/features/ads/studio/templates/index.js'
import { useCreativeStore } from '@/features/ads/studio/useCreativeStore.js'

definePageMeta({
  middleware: ['auth', 'ads'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Creative Studio',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const route = useRoute()
const router = useRouter()
const store = useCreativeStore()
const query = ref('')
const shownCount = ref(LIBRARY_PAGE_SIZE)
const usingScale = computed(() => import.meta.dev && String(route.query.scale || '') === '1')

if (String(route.query.view || '') === 'templates') {
  await navigateTo('/ads/create', { replace: true })
}

const view = computed(() => String(route.query.view || 'all'))
const isArchive = computed(() => view.value === 'archive')
const filter = computed(() => (LIBRARY_CATEGORIES.some((c) => c.id === view.value) ? view.value : view.value === 'status' ? 'status' : 'all'))
const filterLabel = computed(() => LIBRARY_CATEGORIES.find((c) => c.id === filter.value)?.label || 'Creations')
const sort = computed(() => (LIBRARY_SORTS.some((item) => item.id === route.query.sort) ? String(route.query.sort) : 'updated-desc'))
const media = computed(() => (['image', 'carousel'].includes(String(route.query.media || '')) ? String(route.query.media) : 'all'))
const pageTitle = computed(() => (isArchive.value ? 'Archive' : 'My creations'))

function libraryQuery({ view: nextView = filter.value, sort: nextSort = sort.value, media: nextMedia = media.value } = {}) {
  const query = {}
  if (nextView && nextView !== 'all') query.view = nextView
  if (nextSort && nextSort !== 'updated-desc') query.sort = nextSort
  if (nextMedia && nextMedia !== 'all') query.media = nextMedia
  if (usingScale.value) query.scale = '1'
  return query
}

function setFilter(id) {
  query.value = ''
  shownCount.value = LIBRARY_PAGE_SIZE
  router.replace({ query: libraryQuery({ view: id }) })
}

function setSort(id) {
  shownCount.value = LIBRARY_PAGE_SIZE
  router.replace({ query: libraryQuery({ sort: id }) })
}

function setMedia(id) {
  shownCount.value = LIBRARY_PAGE_SIZE
  router.replace({ query: libraryQuery({ media: id }) })
}

watch([() => route.query.view, () => route.query.sort, () => route.query.media], () => {
  shownCount.value = LIBRARY_PAGE_SIZE
})

const savedAll = computed(() => (usingScale.value ? scaleLibrary(250) : store.items.value))
const localCount = computed(() => (usingScale.value ? 0 : savedAll.value.filter((c) => c.storage !== 'api').length))
const visibleSaved = computed(() => savedAll.value
  .filter((c) => creativeMatchesCategory(c, filter.value) && creativeMatchesMedia(c, media.value) && creativeMatchesQuery(c, query.value))
  .slice()
  .sort((a, b) => compareCreatives(a, b, sort.value)))
const shown = computed(() => visibleSaved.value.slice(0, shownCount.value))
const savedGroups = computed(() => {
  if (!shown.value.length) return []
  if (filter.value === 'status') {
    return [
      { id: 'ready', label: 'Ready', items: shown.value.filter((c) => c.status === 'ready') },
      { id: 'draft', label: 'Drafts', items: shown.value.filter((c) => c.status !== 'ready') },
    ].filter((g) => g.items.length)
  }
  return [{ id: filter.value, label: filterLabel.value, items: shown.value }]
})
const libraryReady = computed(() => usingScale.value || (!store.loading.value && store.mode.value != null))
const counts = computed(() => ({
  all: savedAll.value.length,
  post: savedAll.value.filter((c) => c.kind === 'post').length,
  ad: savedAll.value.filter((c) => c.kind === 'ad').length,
  draft: savedAll.value.filter((c) => c.status !== 'ready').length,
  ready: savedAll.value.filter((c) => c.status === 'ready').length,
}))

function familyName(id) {
  return templateFamily(id)?.name || ''
}

function cardLine(c) {
  const family = familyName(c.templateId)
  if (c.artistName && family) return `${c.artistName} · ${family}`
  return c.artistName || family
}

function formatChip(c) {
  return AD_FORMATS[c.primaryFormat]?.ratio || ''
}

function cBoard(c) {
  return AD_FORMATS[c.primaryFormat] || AD_FORMATS.post
}

function artStyle(board) {
  const ratio = board.width / board.height
  const fill = ratio >= 0.8 ? { width: '100%' } : { height: '100%' }
  return { aspectRatio: `${board.width} / ${board.height}`, ...fill }
}

function boardFor(ad) {
  return AD_FORMATS[resolveAdFormat('', ad.formats)]
}

function previewProps(ad) {
  const format = boardFor(ad).id
  if (ad.sceneCount > 1) return { scene: 0, still: true, format }
  return { format }
}

function sceneLabel(count) {
  return count > 1 ? `${count} scenes` : '1 scene'
}

watch(() => route.query.view, (next) => {
  if (String(next || '') === 'templates') router.replace('/ads/create')
})

onMounted(() => { store.load() })
</script>

<style scoped>
.library {
  min-height: 100vh;
  background: #050507;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.library__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 32px 0;
}

.library__brand img {
  width: 118px;
  height: auto;
}

.library__create {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #f7f9fc;
  color: #050507;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-decoration: none;
  cursor: pointer;
}

.library__create:hover,
.library__create:focus-visible {
  background: #fff;
}

.library__create:focus-visible,
.library__cats button:focus-visible,
.library__search input:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.8);
  outline-offset: 3px;
}

.library__lanes {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.library__lanes a {
  color: rgba(247, 249, 252, 0.72);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.library__lanes a:hover,
.library__lanes a:focus-visible {
  color: #f7f9fc;
}

.library__lanes a:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.7);
  outline-offset: 4px;
}

.library__body {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 32px 80px;
}

.library__intro h1 {
  margin: 0;
  font-size: clamp(2.6rem, 6vw, 4.6rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.92;
}

.library__kicker {
  margin: 0 0 10px;
  color: rgba(247, 249, 252, 0.46);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.library__lede {
  max-width: 42rem;
  margin: 14px 0 0;
  color: rgba(247, 249, 252, 0.62);
  font-size: 1.05rem;
  font-weight: 400;
  line-height: 1.45;
}

.library__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px 24px;
}

.library__search {
  flex: 1 1 220px;
  max-width: 360px;
}

.library__search input {
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-bottom: 1px solid rgba(247, 249, 252, 0.18);
  border-radius: 0;
  background: transparent;
  color: #f7f9fc;
  font: inherit;
  font-size: 15px;
}

.library__search input::placeholder {
  color: rgba(247, 249, 252, 0.38);
}

.library__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.library__cats button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.48);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
}

.library__cats button[aria-pressed="true"] {
  color: #f7f9fc;
}

.library__count {
  color: rgba(247, 249, 252, 0.38);
  font-size: 12px;
  font-weight: 600;
}

.library__cats button[aria-pressed="true"] .library__count {
  color: rgba(247, 249, 252, 0.62);
}

.library__note {
  margin: 0;
  color: rgba(247, 249, 252, 0.55);
  font-size: 14px;
}

.library__note.is-error { color: #ff8aa8; }

.library__section { display: flex; flex-direction: column; gap: 18px; }

.library__h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.5);
}

.library__h2 span {
  margin-left: 8px;
  color: rgba(247, 249, 252, 0.32);
}

.library__shelf {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 36px 22px;
}

.ad-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.ad-card__frame {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 18px;
  background: #070709;
}

.ad-card__art {
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.ad-card__art :deep(.ad-stage-host) {
  position: absolute;
  inset: 0;
  height: auto;
}

.ad-card:hover .ad-card__frame,
.ad-card:focus-visible .ad-card__frame {
  outline: 1px solid rgba(247, 249, 252, 0.28);
  outline-offset: 4px;
}

.ad-card:focus-visible { outline: none; }

.ad-card__meta h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ad-card__meta p {
  margin: 6px 0 0;
  color: rgba(247, 249, 252, 0.58);
  font-size: 0.9rem;
  line-height: 1.35;
}

.ad-card__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: rgba(247, 249, 252, 0.4) !important;
  font-size: 0.78rem !important;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.ad-card__status.is-ready { color: #f7f9fc; }
.ad-card__rights { color: #ffcf8a; }
.ad-card__archive {
  margin: 0 0 4px !important;
  color: rgba(247, 249, 252, 0.4) !important;
  font-size: 11px !important;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.library__empty {
  max-width: 28rem;
  padding: 12px 0 24px;
}

.library__empty h2 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.library__empty p:not(.library__kicker) {
  margin: 12px 0 0;
  color: rgba(247, 249, 252, 0.58);
  line-height: 1.45;
}

.library__create--inline { margin-top: 22px; }

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 720px) {
  .library__brand,
  .library__body { padding-left: 18px; padding-right: 18px; }
  .library__brand { padding-top: 18px; }
  .library__shelf { grid-template-columns: 1fr 1fr; gap: 22px 12px; }
  .ad-card__meta h2 { font-size: 0.92rem; }
  .library__search { max-width: none; }
  .library__cats button { min-height: 44px; }
}

.library__refine {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-top: 4px;
}

.library__sort select {
  min-height: 44px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.72);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.library__sort select:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.75);
  outline-offset: 3px;
}

.library__more {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
  margin-top: 8px;
}

.library__more p {
  margin: 0;
  color: rgba(247, 249, 252, 0.45);
  font-size: 13px;
  font-weight: 600;
}

.library__more button {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: transparent;
  color: #f7f9fc;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.library__more button:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.75);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .ad-card__frame { transition: none; }
}
</style>
