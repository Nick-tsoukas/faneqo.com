<template>
  <main class="create">
    <header class="create__bar">
      <NuxtLink class="create__back" to="/ads">My creations</NuxtLink>
      <p class="create__step">
        <span :class="{ 'is-on': step === 'gallery' }">Templates</span>
        <span aria-hidden="true">·</span>
        <span :class="{ 'is-on': step === 'detail' }">Style</span>
        <span aria-hidden="true">·</span>
        <span :class="{ 'is-on': step === 'artist' }">Artist</span>
      </p>
      <div class="create__kind" role="group" aria-label="Use">
        <button type="button" :aria-pressed="kind === 'post'" @click="setKind('post')">Social post</button>
        <button type="button" :aria-pressed="kind === 'ad'" @click="setKind('ad')">Paid ad</button>
      </div>
    </header>

    <section v-if="step === 'gallery'" class="create__body">
      <div class="create__intro">
        <p class="kicker">{{ laneMeta.label }}</p>
        <h1>{{ lane === 'video' ? 'Choose a film.' : lane === 'carousels' ? 'Choose a series.' : 'What are we making?' }}</h1>
        <p class="lede">{{ laneMeta.lede }}</p>
      </div>
      <StudioNav current="templates" />
      <div class="lanes" role="group" aria-label="Creation type">
        <button
          v-for="item in CREATION_LANES"
          :key="item.id"
          type="button"
          :aria-pressed="lane === item.id"
          @click="setLane(item.id)"
        >{{ item.label }}</button>
      </div>

      <div class="families" :class="{ films: lane === 'video' }">
        <article v-for="item in laneSubjects" :key="item.id" class="family">
          <button type="button" class="family__open" @click="openSubject(item)">
            <div class="family__frame" :class="{ 'film__frame': lane === 'video' }">
              <div class="family__art" :style="artStyle(subjectBoard(item))">
                <AdStage :width="subjectBoard(item).width" :height="subjectBoard(item).height">
                  <component :is="pieceFamily(item.pieces[0])?.component" :format="subjectBoard(item).id" :content="pieceContent(item.pieces[0])" :snapshot="demo" :scene="0" />
                </AdStage>
              </div>
            </div>
            <div class="family__meta">
              <h2>{{ item.label }}</h2>
              <p>{{ item.line }}</p>
              <p v-if="filmFacts(item)" class="family__facts">{{ filmFacts(item) }}</p>
            </div>
          </button>
        </article>
      </div>
    </section>

    <section v-else-if="step === 'pieces' && subject" class="create__body">
      <div class="detail">
        <div class="detail__copy">
          <button type="button" class="create__back create__back--btn" @click="backToGallery">All subjects</button>
          <p class="kicker">{{ subject.label }}</p>
          <h1>{{ activePieceLabel }}</h1>
          <p class="lede">{{ subject.line }}</p>
          <p v-if="readiness.message" class="detail__hint">{{ readiness.message }}</p>
        </div>
        <div class="choices" role="list" aria-label="Treatments">
          <button
            v-for="piece in subject.pieces"
            :key="pieceKey(piece)"
            type="button"
            class="choice"
            :aria-pressed="pieceKey(piece) === activePieceKey"
            @click="pickPiece(piece)"
          >
            <span class="choice__frame">
              <CreativeThumb
                :width="pieceBoard(piece).width"
                :height="pieceBoard(piece).height"
                :component="pieceFamily(piece)?.component"
                :format="pieceBoard(piece).id"
                :content="pieceContent(piece)"
                :snapshot="demo"
              />
            </span>
            <span class="choice__name">{{ piece.label || pieceFamily(piece)?.name }}</span>
          </button>
        </div>
        <div class="detail__act">
          <div class="detail__hero" :style="{ aspectRatio: `${pieceBoard(activePiece).width} / ${pieceBoard(activePiece).height}` }">
            <AdStage :width="pieceBoard(activePiece).width" :height="pieceBoard(activePiece).height">
              <component :is="pieceFamily(activePiece)?.component" :format="pieceBoard(activePiece).id" :content="pieceContent(activePiece)" :snapshot="demo" :scene="0" />
            </AdStage>
          </div>
          <button type="button" class="solid" @click="continuePiece">Continue</button>
        </div>
      </div>
    </section>

    <section v-else-if="step === 'detail' && family" class="create__body">
      <div class="detail">
        <div class="detail__copy">
          <button type="button" class="create__back create__back--btn" @click="backToGallery">All subjects</button>
          <p class="kicker">{{ subject?.label || family.name }}</p>
          <h1>{{ choiceLabelForActive || family.name }}</h1>
          <p class="lede">{{ activeHint || subject?.line || family.tagline }}</p>
          <p class="family__facts">{{ formatSummary(family.formats) }}</p>
        </div>
        <div class="choices" role="list" :aria-label="`${family.name} ${choiceKind === 'style' ? 'styles' : 'layouts'}`">
          <button
            v-for="choice in choices"
            :key="choice.id"
            type="button"
            class="choice"
            :aria-pressed="choice.id === activeChoice"
            :aria-label="choice.label"
            @click="pickChoice(choice.id)"
          >
            <span class="choice__frame">
              <CreativeThumb
                :width="board.width"
                :height="board.height"
                :component="family.component"
                :format="board.id"
                :content="previewContent(family, choice.id)"
                :snapshot="demo"
              />
            </span>
            <span class="choice__name">{{ choice.label }}</span>
          </button>
        </div>
        <div class="detail__act">
          <div class="detail__hero" :style="{ aspectRatio: `${board.width} / ${board.height}` }">
            <AdStage :width="board.width" :height="board.height">
              <component :is="family.component" :format="board.id" :content="selectedContent" :snapshot="demo" :scene="0" />
            </AdStage>
          </div>
          <button type="button" class="solid" @click="continueToArtist">Continue</button>
        </div>
      </div>
    </section>

    <section v-else-if="family" class="create__body create__body--artist">
      <div class="create__intro">
        <p class="kicker">{{ subject?.label || family.name }}<template v-if="choiceLabelForActive && choiceLabelForActive !== subject?.label"> · {{ choiceLabelForActive }}</template></p>
        <div v-if="choices.length > 1" class="create__styles" role="group" :aria-label="choiceKind === 'style' ? 'Style' : 'Layout'">
          <button
            v-for="choice in choices"
            :key="choice.id"
            type="button"
            :aria-pressed="choice.id === activeChoice"
            @click="pickChoice(choice.id)"
          >{{ choice.label }}</button>
        </div>
        <div class="create__chosen" :style="{ aspectRatio: `${board.width} / ${board.height}` }">
          <AdStage :width="board.width" :height="board.height">
            <component :is="family.component" :format="board.id" :content="selectedContent" :snapshot="demo" :scene="0" />
          </AdStage>
        </div>
        <h1>{{ family.needsArtist ? 'Which artist?' : 'Add an artist, or skip.' }}</h1>
        <p class="lede">
          <template v-if="readiness.message">{{ readiness.message }}</template>
          <template v-else-if="activeFilm">{{ activeFilm.durationLabel }} · {{ activeFilm.formatLabel }} · {{ activeFilm.width }}×{{ activeFilm.height }} · H.264 · silent. On this computer. Motion is on.</template>
          <template v-else-if="family.needsArtist">Built from the artist's page. The photograph, the song, and the shows stay as they are.</template>
          <template v-else>This one can stand without an artist. Adding one brings in their photograph.</template>
        </p>
        <p v-if="createError" class="error" role="alert">{{ createError }}</p>
        <div class="create__actions">
          <button type="button" class="ghost" @click="backFromArtist">{{ backLabel }}</button>
          <button v-if="!family.needsArtist" type="button" class="solid" :disabled="creating" @click="start(null)">
            {{ creating ? 'Creating…' : 'Continue without an artist' }}
          </button>
        </div>
      </div>
      <div class="create__picker">
        <ArtistPicker @select="start" />
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import AdStage from '@/features/ads/AdStage.vue'
import ArtistPicker from '@/features/ads/studio/ArtistPicker.vue'
import CreativeThumb from '@/features/ads/studio/CreativeThumb.vue'
import StudioNav from '@/features/ads/studio/StudioNav.vue'
import { AD_FORMATS, formatSummary } from '@/features/ads/formats.js'
import { newCreative } from '@/features/ads/studio/creativeModel.js'
import { demoBadflowerSnapshot } from '@/features/ads/studio/fixtures.js'
import { TEMPLATE_FAMILIES, templateFamily } from '@/features/ads/studio/templates/index.js'
import { CREATION_LANES, applyVideoCreation, creationLane, videoFilmByStyle, videoFilms } from '@/features/ads/studio/creationLanes.js'
import { pieceKey, pieceReadiness, subjectById, subjectsForLane } from '@/features/ads/studio/creativeCatalog.js'
import { useCreativeStore } from '@/features/ads/studio/useCreativeStore.js'

definePageMeta({
  middleware: ['auth', 'ads'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'New creative',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const route = useRoute()
const router = useRouter()
const store = useCreativeStore()

const families = TEMPLATE_FAMILIES
const films = videoFilms()
const demo = demoBadflowerSnapshot()
const creating = ref(false)
const createError = ref('')
const previewCache = new Map()

const kind = computed(() => (route.query.kind === 'ad' ? 'ad' : 'post'))
const lane = computed(() => creationLane(route.query.lane))
const laneMeta = computed(() => CREATION_LANES.find((item) => item.id === lane.value) || CREATION_LANES[0])
const laneSubjects = computed(() => subjectsForLane(lane.value))
const subject = computed(() => subjectById(String(route.query.subject || '')))
const templateId = computed(() => (templateFamily(String(route.query.template || '')) ? String(route.query.template) : ''))
const family = computed(() => families.find((item) => item.id === templateId.value) || null)

function familyChoices(fam) {
  if (!fam) return { kind: null, items: [] }
  if (Array.isArray(fam.styles) && fam.styles.length > 1) return { kind: 'style', items: fam.styles }
  if (Array.isArray(fam.variants) && fam.variants.length > 1) return { kind: 'variant', items: fam.variants }
  return { kind: null, items: [] }
}

const pinnedPiece = computed(() => {
  if (!subject.value || !family.value) return null
  const matches = subject.value.pieces.filter((piece) => piece.templateId === family.value.id)
  if (matches.length === 1 && matches[0].style) return matches[0]
  return null
})
const choicePack = computed(() => {
  if (pinnedPiece.value) {
    const film = videoFilmByStyle(pinnedPiece.value.style)
    return {
      kind: 'style',
      items: [{ id: pinnedPiece.value.style, label: film?.title || pinnedPiece.value.label || pinnedPiece.value.style, hint: film?.demonstrates || subject.value.line }],
    }
  }
  if (lane.value === 'video' && family.value?.id === 'product-showcase') {
    return { kind: 'style', items: films.map((film) => ({ id: film.style, label: film.title, hint: film.demonstrates })) }
  }
  return familyChoices(family.value)
})
const choiceKind = computed(() => choicePack.value.kind)
const choices = computed(() => choicePack.value.items)
const step = computed(() => {
  if (subject.value && subject.value.pieces.length > 1 && !family.value) return 'pieces'
  if (!family.value) return 'gallery'
  if (route.query.step === 'artist' || lane.value === 'video') return 'artist'
  if (choices.value.length > 1) return 'detail'
  return 'artist'
})

const activeChoice = computed(() => {
  const requested = String(choiceKind.value === 'style' ? route.query.style || '' : route.query.variant || '')
  if (choices.value.some((item) => item.id === requested)) return requested
  return choices.value[0]?.id || ''
})
const choiceLabelForActive = computed(() => choices.value.find((item) => item.id === activeChoice.value)?.label || '')
const activeHint = computed(() => choices.value.find((item) => item.id === activeChoice.value)?.hint || '')
const board = computed(() => {
  if (lane.value === 'video') return AD_FORMATS.story
  return family.value ? boardFor(family.value) : AD_FORMATS.post
})
const selectedContent = computed(() => (family.value ? previewContent(family.value, activeChoice.value) : null))
const activeFilm = computed(() => (lane.value === 'video' ? videoFilmByStyle(activeChoice.value || pinnedPiece.value?.style) : null))
const activePiece = computed(() => {
  if (!subject.value) return pinnedPiece.value
  const key = String(route.query.piece || '')
  return subject.value.pieces.find((piece) => pieceKey(piece) === key) || subject.value.pieces[0]
})
const activePieceKey = computed(() => pieceKey(activePiece.value))
const activePieceLabel = computed(() => activePiece.value?.label || pieceFamily(activePiece.value)?.name || '')
const readinessPiece = computed(() => {
  if (step.value === 'pieces') return activePiece.value
  if (pinnedPiece.value) return pinnedPiece.value
  if (family.value && choiceKind.value === 'style' && activeChoice.value) {
    return { templateId: family.value.id, style: activeChoice.value, video: lane.value === 'video' }
  }
  if (family.value?.id === 'show-promo') return { templateId: 'show-promo' }
  return null
})
const readiness = computed(() => pieceReadiness(readinessPiece.value, demo))
const backLabel = computed(() => {
  if (subject.value?.pieces.length > 1) return subject.value.label
  if (choices.value.length > 1) return choiceKind.value === 'style' ? 'Back to styles' : 'Back to layouts'
  return 'All subjects'
})

function choiceLabel(fam) {
  const pack = familyChoices(fam)
  if (!pack.items.length) return ''
  return pack.kind === 'style' ? `${pack.items.length} styles` : `${pack.items.length} layouts`
}

function boardFor(fam) {
  return AD_FORMATS[fam.defaultFormat] || AD_FORMATS.post
}

function artStyle(board) {
  const ratio = board.width / board.height
  const fill = ratio >= 0.8 ? { width: '100%' } : { height: '100%' }
  return { aspectRatio: `${board.width} / ${board.height}`, ...fill }
}

function previewContent(fam, choiceId = '') {
  const pack = familyChoices(fam)
  const style = pack.kind === 'style' ? (choiceId || pack.items[0]?.id || '') : ''
  const variant = pack.kind === 'variant' ? (choiceId || pack.items[0]?.id || '') : ''
  const key = `${fam.id}:${style}:${variant}`
  if (!previewCache.has(key)) {
    previewCache.set(key, newCreative(fam.id, { snapshot: demo, style: style || null, variant: variant || null }).content)
  }
  return previewCache.get(key)
}

function pieceFamily(piece) {
  return families.find((item) => item.id === piece?.templateId) || null
}

function pieceContent(piece) {
  const fam = pieceFamily(piece)
  if (!fam) return null
  return previewContent(fam, piece?.style || '')
}

function pieceBoard(piece) {
  if (piece?.video || lane.value === 'video') return AD_FORMATS.story
  const fam = pieceFamily(piece)
  return fam ? boardFor(fam) : AD_FORMATS.post
}

function subjectBoard(item) {
  return pieceBoard(item?.pieces?.[0])
}

function filmFacts(item) {
  const film = videoFilmByStyle(item?.pieces?.[0]?.style)
  if (!film || lane.value !== 'video') return ''
  return `${film.durationLabel} · 9:16 · MP4 on this computer`
}

function queryBase() {
  const query = {}
  if (kind.value === 'ad') query.kind = 'ad'
  if (lane.value !== 'posts') query.lane = lane.value
  return query
}

function setLane(id) {
  const query = {}
  if (kind.value === 'ad') query.kind = 'ad'
  if (id !== 'posts') query.lane = id
  router.push({ path: '/ads/create', query })
}

function openPiece(piece, subjectId) {
  const fam = templateFamily(piece.templateId)
  const pack = familyChoices(fam)
  const query = { ...queryBase(), subject: subjectId, template: piece.templateId }
  delete query.piece
  if (piece.style) {
    query.style = piece.style
    query.step = 'artist'
  } else if (!pack.items.length) query.step = 'artist'
  else if (pack.kind === 'style') query.style = pack.items[0].id
  else query.variant = pack.items[0].id
  if (lane.value === 'video') query.step = 'artist'
  router.push({ query })
}

function openSubject(item) {
  if (item.pieces.length > 1) {
    router.push({ query: { ...queryBase(), subject: item.id, piece: pieceKey(item.pieces[0]) } })
    return
  }
  openPiece(item.pieces[0], item.id)
}

function pickPiece(piece) {
  router.replace({ query: { ...queryBase(), subject: subject.value.id, piece: pieceKey(piece) } })
}

function continuePiece() {
  if (activePiece.value && subject.value) openPiece(activePiece.value, subject.value.id)
}

function setKind(next) {
  const query = { ...route.query }
  if (next === 'ad') query.kind = 'ad'
  else delete query.kind
  router.replace({ query })
}

function openFamily(id) {
  const fam = templateFamily(id)
  const pack = familyChoices(fam)
  const query = { ...queryBase(), template: id }
  if (!pack.items.length) query.step = 'artist'
  else if (pack.kind === 'style') query.style = pack.items[0].id
  else query.variant = pack.items[0].id
  router.push({ query })
}

function pickChoice(id) {
  const query = { ...route.query, template: templateId.value }
  if (choiceKind.value === 'style') {
    query.style = id
    delete query.variant
  } else {
    query.variant = id
    delete query.style
  }
  router.replace({ query })
}

function continueToArtist() {
  router.push({ query: { ...route.query, template: templateId.value, step: 'artist' } })
}

function backToGallery() {
  router.push({ path: '/ads/create', query: queryBase() })
}

function backFromArtist() {
  if (subject.value?.pieces.length > 1) {
    router.push({ query: { ...queryBase(), subject: subject.value.id, piece: pieceKey(activePiece.value || subject.value.pieces[0]) } })
    return
  }
  if (lane.value === 'video') return backToGallery()
  if (!family.value) return backToGallery()
  const query = { ...queryBase(), template: family.value.id }
  if (choiceKind.value === 'style' && activeChoice.value) query.style = activeChoice.value
  if (choiceKind.value === 'variant' && activeChoice.value) query.variant = activeChoice.value
  if (choices.value.length) router.push({ query })
  else backToGallery()
}

async function start(snapshot) {
  if (creating.value || !family.value) return
  creating.value = true
  createError.value = ''
  try {
    const frozen = snapshot || (templateId.value === 'product-showcase' ? demo : null)
    const creative = newCreative(templateId.value, {
      snapshot: frozen,
      kind: kind.value,
      format: lane.value === 'video' ? 'story' : null,
      style: choiceKind.value === 'style' ? activeChoice.value : null,
      variant: choiceKind.value === 'variant' ? activeChoice.value : null,
    })
    if (lane.value === 'video' && !applyVideoCreation(creative, creative.content.style)) {
      throw new Error('This style stays a still.')
    }
    const saved = await store.save(creative)
    await router.push(`/ads/c/${encodeURIComponent(saved.id)}`)
  } catch (err) {
    createError.value = err?.message || 'The creative could not be created.'
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.create {
  min-height: 100vh;
  background: #050507;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.create__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 12px 40px;
}

.create__back {
  color: rgba(247, 249, 252, 0.72);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-decoration: none;
  text-transform: uppercase;
}

.create__back--btn {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.create__back:hover,
.create__back:focus-visible { color: #f7f9fc; }

.create__step {
  display: flex;
  gap: 10px;
  margin: 0;
  color: rgba(247, 249, 252, 0.4);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.create__step .is-on { color: #f7f9fc; }

.create__kind {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.create__kind button {
  min-height: 36px;
  padding: 6px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.6);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

.create__kind button[aria-pressed="true"] {
  background: #f7f9fc;
  color: #050507;
}

.create__body {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1240px;
  margin: 0 auto;
  padding: 12px 40px 72px;
}

.create__body--artist {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.3fr);
  gap: 48px;
  align-items: start;
}

.kicker {
  margin: 0 0 10px;
  color: #7ee7ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.create__intro h1,
.detail__copy h1 {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.98;
}

.lede {
  max-width: 42rem;
  margin: 14px 0 0;
  color: rgba(247, 249, 252, 0.62);
  font-size: 1rem;
  line-height: 1.45;
}

.error {
  margin: 16px 0 0;
  color: #ff8aa8;
  font-size: 0.95rem;
}

.create__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.ghost,
.solid {
  min-height: 44px;
  padding: 10px 18px;
  border-radius: 999px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: transparent;
  color: rgba(247, 249, 252, 0.8);
}

.solid {
  border: 0;
  background: #f7f9fc;
  color: #050507;
}

.solid:disabled { opacity: 0.55; cursor: progress; }

.create__picker {
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.025);
}

.lanes {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin: 4px 0 8px;
}

.lanes button {
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.46);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  cursor: pointer;
}

.lanes button[aria-pressed="true"],
.lanes button:hover,
.lanes button:focus-visible {
  color: #f7f9fc;
}

.lanes button:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.7);
  outline-offset: 4px;
}

.films {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 340px));
  gap: 28px 24px;
  align-items: start;
}

.film__frame {
  aspect-ratio: 9 / 16;
}

.families {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 32px 20px;
  align-items: start;
}

.family { min-width: 0; }

.family__open {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.family__frame,
.create__chosen,
.choice__frame,
.detail__hero {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: #070709;
}

.family__frame {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 5;
}

.family__frame.film__frame {
  aspect-ratio: 9 / 16;
}

.family__art {
  position: relative;
  max-width: 100%;
  max-height: 100%;
}

.family__open:hover .family__frame,
.family__open:focus-visible .family__frame {
  border-color: rgba(255, 255, 255, 0.36);
}

.family__open:focus-visible,
.choice:focus-visible,
.create__styles button:focus-visible,
.create__back--btn:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.75);
  outline-offset: 3px;
}

.family__frame :deep(.ad-stage-host),
.create__chosen :deep(.ad-stage-host),
.detail__hero :deep(.ad-stage-host) {
  position: absolute;
  inset: 0;
  height: auto;
}

.family__meta h2 {
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.family__meta p,
.detail__hint {
  margin: 0;
  color: rgba(247, 249, 252, 0.58);
  font-size: 0.92rem;
  line-height: 1.4;
}

.family__facts {
  margin-top: 8px !important;
  color: rgba(247, 249, 252, 0.4) !important;
  font-size: 0.78rem !important;
  letter-spacing: 0.01em;
}

.detail {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(280px, 460px);
  grid-template-areas:
    "copy hero"
    "choices hero";
  gap: 22px 48px;
  align-items: start;
}

.detail__copy { grid-area: copy; }
.choices { grid-area: choices; }
.detail__act { grid-area: hero; }

.detail__copy { min-width: 0; }

.detail__copy .kicker { margin-top: 18px; }

.detail__hero {
  width: 100%;
  max-width: none;
  margin: 0 0 18px;
}

.detail__hint { margin-top: 12px !important; }

.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 12px;
  align-content: start;
  max-height: none;
  overflow: visible;
  padding: 2px 0 0;
}

.choice {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 108px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.choice__frame {
  display: block;
  aspect-ratio: 4 / 5;
}

.choice[aria-pressed="true"] .choice__frame {
  outline: 1px solid #f7f9fc;
  outline-offset: 3px;
}

.choice__name {
  color: rgba(247, 249, 252, 0.78);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.create__chosen {
  max-width: 420px;
  margin-top: 18px;
}

.create__styles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.create__styles button {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.7);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.create__styles button[aria-pressed="true"] {
  border-color: #f7f9fc;
  background: #f7f9fc;
  color: #050507;
}

@media (max-width: 900px) {
  .create__body--artist { grid-template-columns: 1fr; }
  .detail { display: flex; flex-direction: column; }
  .detail__act { order: 1; }
  .detail__copy { order: 2; }
  .choices { order: 3; width: 100%; }
}

@media (max-width: 760px) {
  .create__bar,
  .create__body { padding-left: 18px; padding-right: 18px; }
  .create__step { display: none; }
  .families { grid-template-columns: 1fr 1fr; gap: 22px 12px; }
  .films { grid-template-columns: 1fr; }
  .film__frame { max-height: 70vh; }
  .family__meta h2 { font-size: 1rem; }
  .detail__hero { max-width: 100%; }
  .create__kind button,
  .solid,
  .ghost { min-height: 44px; }
}

@media (prefers-reduced-motion: reduce) {
  .family__frame { transition: none; }
}
</style>
