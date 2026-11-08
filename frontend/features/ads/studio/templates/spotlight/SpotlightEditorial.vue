<template>
  <article class="board" :data-format="formatId" :data-treatment="treatment" :style="vars" :aria-label="`${c.headlineTop} ${c.headlineAccent}. ${artistName}.`">
    <!-- The photograph owns the top two-thirds and bleeds on three sides. -->
    <PhotoField class="photo" :media="photo" :focal="focal" fade="none" />
    <div class="photo__crown" aria-hidden="true" />
    <div class="photo__seat" aria-hidden="true" />

    <!-- Cover header: the series on the left, the genre on the right, like a cover's dateline. -->
    <header class="head">
      <p class="head__series">
        <i class="head__dash" aria-hidden="true" />
        <span>{{ c.headlineTop }}</span>
        <span v-if="labelAccent">{{ labelAccent }}</span>
      </p>
      <p v-if="genre" class="head__genre">{{ genre }}</p>
    </header>

    <div class="lower">
      <!-- Masthead: the name straddles the photograph's edge like a magazine cover line. -->
      <h1 ref="nameEl" class="name" :class="{ 'name--two': nameLines.length > 1 }" :style="nameStyle">
        <span v-for="(line, i) in nameLines" :key="i" class="name__line">{{ line }}</span>
      </h1>

      <!-- Deck: one brand hairline, then two columns — the standfirst and the record. -->
      <div class="deck" :class="{ 'deck--solo': !c.description || !c.songTitle }">
        <span class="deck__rule" aria-hidden="true" />
        <p v-if="c.description" class="deck__desc">{{ c.description }}</p>
        <figure v-if="c.songTitle" class="song">
          <img v-if="songArtSrc" class="song__art" :src="songArtSrc" alt="" />
          <div v-else class="song__art song__art--empty" aria-hidden="true"><span>{{ songInitial }}</span></div>
          <figcaption>
            <span class="song__k">Featured song</span>
            <span class="song__t">{{ c.songTitle }}</span>
          </figcaption>
        </figure>
      </div>
    </div>

    <!-- Colophon: a rule, the wordmark, one line of action, the destination. -->
    <footer class="sig">
      <span class="sig__rule" aria-hidden="true" />
      <div class="sig__row">
        <img class="sig__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
        <div class="sig__act">
          <span class="sig__cta">{{ c.cta }} <i>→</i></span>
          <span class="sig__site">{{ c.site }}</span>
        </div>
      </div>
    </footer>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import PhotoField from '@/features/ads/studio/primitives/PhotoField.vue'
import { boardVars } from '@/features/ads/studio/board.js'
import { studioImageUrl } from '@/features/ads/studio/mediaUrl.js'
import { isAdFormat } from '@/features/ads/formats.js'
import { splitNameLines, useFitLine } from './useFitLine.js'

/**
 * Artist Spotlight — Editorial Icon. Magazine-cover logic: a dateline header,
 * a photograph that bleeds, a masthead-scale name that straddles its lower
 * edge, a two-column deck (standfirst + record) on a hairline grid, and a
 * colophon for the signature.
 *
 * Vertical budget per format: the lower block starts at `name-top` (crossing
 * the photo edge) and must end above the colophon rule. Worst case is a
 * two-line name + two-line standfirst: ≈ 420px in 4:5.
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

/* Header line, photo bottom edge, where the masthead starts (it crosses the edge), name cap, artwork, signature. */
const LAYOUTS = {
  post: { 'head-top': 64, 'photo-h': 1010, 'name-top': 884, name: 184, art: 128, 'sig-bottom': 72, mark: 176 },
  feed: { 'head-top': 60, 'photo-h': 940, 'name-top': 816, name: 184, art: 128, 'sig-bottom': 64, mark: 176 },
  /* Story: the IG chrome owns the top 250px and faces sit just under it, so the dateline moves down onto the seat, above the name. */
  story: { 'head-top': 1026, 'photo-h': 1220, 'name-top': 1094, name: 192, art: 136, 'sig-bottom': 340, mark: 184 },
  square: { 'head-top': 48, 'photo-h': 712, 'name-top': 616, name: 132, art: 100, 'sig-bottom': 56, mark: 150 },
}

const TREATMENTS = ['natural', 'balanced', 'deep']

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))
const c = computed(() => props.content || {})
const treatment = computed(() => (TREATMENTS.includes(c.value.treatment) ? c.value.treatment : 'balanced'))
const vars = computed(() => boardVars(formatId.value, LAYOUTS))
const artistName = computed(() => c.value.artistName || props.snapshot?.name || 'Artist')
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
const labelAccent = computed(() => (norm(c.value.headlineAccent) === norm(artistName.value) ? '' : c.value.headlineAccent))
const genre = computed(() => String(props.snapshot?.genre || '').split(',')[0].trim())
const photo = computed(() => c.value.photo || props.snapshot?.hero || null)
const focal = computed(() => c.value.focal || photo.value?.focal || null)
const songArt = computed(() => (c.value.songArt === null ? null : c.value.songArt || props.snapshot?.song?.art || null))
const songArtSrc = computed(() => studioImageUrl(songArt.value?.url))
const songInitial = computed(() => String(c.value.songTitle || '').trim().charAt(0).toUpperCase())

/*
 * Masthead fitting. Short names run as one line; longer multi-word names break
 * at the most balanced word boundary into two lines. The rendered block is then
 * measured and scaled so the longest line fits the safe width exactly.
 */
const nameLines = computed(() => splitNameLines(artistName.value))
const nameEl = ref(null)
/* Two-line names run smaller so the block stays about the height of one full-size line. */
const nameStyle = useFitLine(nameEl, { cssVar: 'name', max: () => (nameLines.value.length > 1 ? 0.58 : 1) }, [artistName, formatId])
</script>

<style scoped>
.board {
  position: relative;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1350px);
  overflow: hidden;
  background: #070709;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.photo {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: var(--photo-h);
}

/* A whisper of shade under the header so the dateline reads on any sky. */
.photo__crown {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 260px;
  background: linear-gradient(to bottom, rgba(7, 7, 9, 0.42) 0%, rgba(7, 7, 9, 0.18) 55%, rgba(7, 7, 9, 0) 100%);
}

/* The seat: lands the photograph on the page where the masthead crosses. */
.photo__seat {
  position: absolute;
  top: calc(var(--photo-h) - 320px);
  right: 0;
  left: 0;
  height: 320px;
  background: linear-gradient(to bottom, rgba(7, 7, 9, 0) 0%, rgba(7, 7, 9, 0.46) 56%, rgba(7, 7, 9, 0.88) 86%, #070709 100%);
}

.head {
  position: absolute;
  top: var(--head-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(247, 249, 252, 0.92);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3em;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 1px 14px rgba(0, 0, 0, 0.5);
}

.head p { margin: 0; }
.head__series { display: flex; align-items: center; gap: 0 0.7em; }
.head__dash { display: block; width: 36px; height: 2px; margin-right: 0.3em; background: linear-gradient(90deg, #ff4ad8, #c084fc 55%, #67e8f9); }
.head__genre { color: rgba(247, 249, 252, 0.72); }

.lower {
  position: absolute;
  top: var(--name-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.name {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 0.84;
  text-transform: uppercase;
  white-space: nowrap;
  text-shadow: 0 6px 40px rgba(0, 0, 0, 0.35);
}

.name__line { display: block; margin-left: -0.04em; }

/* Deck grid: standfirst left, record right, one brand hairline across. */
.deck {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0 48px;
  align-items: center;
  margin-top: 40px;
  padding-top: 30px;
  position: relative;
}

.deck--solo { grid-template-columns: minmax(0, 1fr); }

.deck__rule {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 34%, #67e8f9 58%, rgba(103, 232, 249, 0) 100%);
}

.deck__desc {
  display: -webkit-box;
  max-width: 17ch;
  margin: 0;
  overflow: hidden;
  color: rgba(247, 249, 252, 0.9);
  font-size: 38px;
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.16;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.song {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 22px;
  margin: 0;
}

.song__art {
  flex: none;
  width: var(--art);
  height: var(--art);
  object-fit: cover;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
}

/* No artwork: a quiet monogram tile, so the caption never shows a hole. */
.song__art--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1c1d24, #0d0e12);
  color: rgba(247, 249, 252, 0.7);
  font-size: calc(var(--art) * 0.42);
  font-weight: 800;
}

.song figcaption { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; max-width: 300px; text-align: right; }

.song__k {
  color: rgba(247, 249, 252, 0.52);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.song__t {
  display: -webkit-box;
  overflow: hidden;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.sig {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--sig-bottom);
  left: var(--safe-x);
  z-index: 2;
}

.sig__rule { display: block; width: 100%; height: 1px; margin-bottom: 30px; background: rgba(247, 249, 252, 0.18); }

.sig__row { display: flex; align-items: flex-end; justify-content: space-between; }

.sig__mark { width: var(--mark); height: auto; }

.sig__act { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; }

.sig__cta {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

.sig__cta i { font-style: normal; margin-left: 6px; }

.sig__site {
  color: rgba(247, 249, 252, 0.5);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

/* Treatment: how far up the photograph the seat reaches, and how dark. */
.board[data-treatment="natural"] .photo__crown { background: linear-gradient(to bottom, rgba(7, 7, 9, 0.3) 0%, rgba(7, 7, 9, 0) 100%); }

.board[data-treatment="natural"] .photo__seat {
  top: calc(var(--photo-h) - 240px);
  height: 240px;
  background: linear-gradient(to bottom, rgba(7, 7, 9, 0) 0%, rgba(7, 7, 9, 0.4) 60%, rgba(7, 7, 9, 0.86) 88%, #070709 100%);
}

.board[data-treatment="deep"] .photo__seat {
  top: calc(var(--photo-h) - 440px);
  height: 440px;
  background: linear-gradient(to bottom, rgba(7, 7, 9, 0) 0%, rgba(7, 7, 9, 0.45) 45%, rgba(7, 7, 9, 0.8) 72%, rgba(7, 7, 9, 0.95) 90%, #070709 100%);
}

.board[data-treatment="deep"] .photo :deep(.photo__img) { filter: brightness(0.88) contrast(1.04); }

/* Square: tighter rhythm, one-line standfirst, smaller caption. */
.board[data-format="square"] .head { font-size: 16px; }
.board[data-format="square"] .photo__crown { height: 200px; }
.board[data-format="square"] .deck { gap: 0 36px; margin-top: 30px; padding-top: 24px; }
.board[data-format="square"] .deck__desc { max-width: 19ch; font-size: 30px; -webkit-line-clamp: 2; }
.board[data-format="square"] .song { gap: 18px; }
.board[data-format="square"] .song figcaption { max-width: 240px; }
.board[data-format="square"] .song__t { font-size: 26px; }
.board[data-format="square"] .sig__rule { margin-bottom: 24px; }
.board[data-format="square"] .sig__cta { font-size: 28px; }

/* Story: the photograph is taller, the type a touch larger, more air before the colophon. */
.board[data-format="story"] .photo__crown { display: none; }
.board[data-format="story"] .head { font-size: 17px; }
.board[data-format="story"] .deck { margin-top: 48px; padding-top: 34px; }
.board[data-format="story"] .deck__desc { font-size: 40px; }
.board[data-format="story"] .song__t { font-size: 32px; }
.board[data-format="story"] .sig__rule { margin-bottom: 34px; }
.board[data-format="story"] .sig__cta { font-size: 34px; }
</style>
