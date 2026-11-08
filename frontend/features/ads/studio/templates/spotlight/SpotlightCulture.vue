<template>
  <article class="board" :data-format="formatId" :data-treatment="treatment" :style="vars" :aria-label="`${c.headlineTop} ${c.headlineAccent}. ${artistName}.`">
    <!-- Rail: the series runs up the left edge, the way a sleeve spine does. -->
    <aside class="rail" aria-hidden="true">
      <span class="rail__rule" />
      <p class="rail__text">
        <span>{{ c.headlineTop }}</span>
        <span v-if="labelAccent" class="rail__accent">{{ labelAccent }}</span>
        <template v-if="c.badgeText">
          <span class="rail__sep">·</span>
          <span>{{ c.badgeText }}</span>
        </template>
      </p>
    </aside>

    <!-- The photograph as a placed print: offset from the rail, bleeding off the right. -->
    <PhotoField class="print" :media="photo" :focal="focal" fade="none" />

    <div class="block">
      <!-- Name, then its echo: the last line repeated hollow. The brand idea made visible once. -->
      <h1 ref="nameEl" class="name" :style="nameStyle">
        <span v-for="(line, i) in nameLines" :key="i" class="name__solid">{{ line }}</span>
        <span class="name__echo" aria-hidden="true">{{ nameLines[nameLines.length - 1] }}</span>
      </h1>
      <p v-if="c.description" class="line">{{ c.description }}</p>
    </div>

    <!-- The record, placed by hand. Without artwork the sleeve carries the title in type. -->
    <figure v-if="c.songTitle" class="song">
      <div class="song__sleeve">
        <img v-if="songArtSrc" class="song__art" :src="songArtSrc" alt="" />
        <div v-else class="song__art song__art--type" aria-hidden="true">
          <span class="song__artTitle">{{ c.songTitle }}</span>
          <span class="song__artBy">{{ artistName }}</span>
        </div>
      </div>
      <figcaption>
        <span class="song__t">{{ c.songTitle }}</span>
        <span class="song__k">Featured song</span>
      </figcaption>
    </figure>

    <footer class="sig">
      <span class="sig__cta">
        <span class="sig__ctaText"><span>{{ c.cta }}</span><i>↗</i></span>
        <i class="sig__bar" aria-hidden="true" />
      </span>
      <div class="sig__brand">
        <img class="sig__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
        <span class="sig__site">{{ c.site }}</span>
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
 * Artist Spotlight — Contemporary Music Culture. Poster logic: a spine rail,
 * a placed photographic print, a name with a hollow echo beneath it, the
 * record set by hand, one loud line of action.
 *
 * The name block is measured to fit; its cap keeps one line + echo (or two
 * lines + echo at 0.66) inside the same height, so the row below never moves.
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

/* Print block, where the name starts (it overlaps the print's lower edge), the row under it, signature. */
const LAYOUTS = {
  post: { 'print-top': 96, 'print-left': 148, 'print-h': 820, 'name-top': 830, name: 150, 'row-top': 1130, 'sig-bottom': 72, art: 140, rail: 26 },
  feed: { 'print-top': 88, 'print-left': 148, 'print-h': 760, 'name-top': 770, name: 150, 'row-top': 1070, 'sig-bottom': 64, art: 140, rail: 26 },
  story: { 'print-top': 270, 'print-left': 148, 'print-h': 900, 'name-top': 1030, name: 160, 'row-top': 1340, 'sig-bottom': 336, art: 150, rail: 26 },
  square: { 'print-top': 64, 'print-left': 136, 'print-h': 580, 'name-top': 580, name: 104, 'row-top': 806, 'sig-bottom': 52, art: 112, rail: 22 },
}

const TREATMENTS = ['natural', 'balanced', 'deep']

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))
const c = computed(() => props.content || {})
const treatment = computed(() => (TREATMENTS.includes(c.value.treatment) ? c.value.treatment : 'balanced'))
const vars = computed(() => boardVars(formatId.value, LAYOUTS))
const artistName = computed(() => c.value.artistName || props.snapshot?.name || 'Artist')
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
const labelAccent = computed(() => (norm(c.value.headlineAccent) === norm(artistName.value) ? '' : c.value.headlineAccent))
const photo = computed(() => c.value.photo || props.snapshot?.hero || null)
const focal = computed(() => c.value.focal || photo.value?.focal || null)
const songArt = computed(() => (c.value.songArt === null ? null : c.value.songArt || props.snapshot?.song?.art || null))
const songArtSrc = computed(() => studioImageUrl(songArt.value?.url))

const nameLines = computed(() => splitNameLines(artistName.value))
const nameEl = ref(null)
/* Two solid lines + echo run at 0.66 so three lines take the height of one line + echo. */
const nameStyle = useFitLine(nameEl, { cssVar: 'name', max: () => (nameLines.value.length > 1 ? 0.66 : 1) }, [artistName, formatId])
</script>

<style scoped>
.board {
  position: relative;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1350px);
  overflow: hidden;
  background: #09090b;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.rail {
  position: absolute;
  top: var(--print-top);
  left: var(--safe-x);
  z-index: 3;
  display: flex;
  gap: 22px;
  height: calc(var(--print-h) + 80px);
}

.rail__rule {
  display: block;
  width: 3px;
  height: 100%;
  background: linear-gradient(to bottom, #ff4ad8 0%, #c084fc 55%, #67e8f9 100%);
}

.rail__text {
  display: flex;
  gap: 0.8em;
  margin: 0;
  color: rgba(247, 249, 252, 0.8);
  font-size: var(--rail);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  white-space: nowrap;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.rail__accent { color: #f7f9fc; }
.rail__sep { color: rgba(247, 249, 252, 0.3); }

.print {
  position: absolute;
  top: var(--print-top);
  right: 0;
  left: var(--print-left);
  z-index: 1;
  height: var(--print-h);
}

.board[data-treatment="deep"] .print :deep(.photo__img) { filter: brightness(0.86) contrast(1.05); }
.board[data-treatment="natural"] .print :deep(.photo__img) { filter: none; }

.block {
  position: absolute;
  top: var(--name-top);
  right: var(--safe-x);
  left: calc(var(--safe-x) + 104px);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.name {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.86;
  text-transform: uppercase;
  white-space: nowrap;
}

.name__solid { display: block; color: #f7f9fc; text-shadow: 0 6px 40px rgba(0, 0, 0, 0.55); }

.name__echo {
  display: block;
  color: transparent;
  -webkit-text-stroke: 2px rgba(247, 249, 252, 0.46);
}

.line {
  display: -webkit-box;
  max-width: 340px;
  margin: 0;
  overflow: hidden;
  color: rgba(247, 249, 252, 0.88);
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.song {
  position: absolute;
  top: calc(var(--row-top) - 56px);
  right: var(--safe-x);
  z-index: 3;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 22px;
  margin: 0;
}

.song__sleeve {
  padding: 8px;
  background: #f7f9fc;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.6);
  transform: rotate(-4deg);
}

.song__art { display: block; width: var(--art); height: var(--art); object-fit: cover; }

/* Type-only sleeve when the song has no artwork: title and artist set small on the white card. */
.song__art--type {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  padding: 10px;
  background: #0d0e12;
  color: #f7f9fc;
  text-align: left;
}

.song__artTitle {
  display: -webkit-box;
  overflow: hidden;
  font-size: calc(var(--art) * 0.14);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  text-transform: uppercase;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.song__artBy {
  overflow: hidden;
  color: rgba(247, 249, 252, 0.55);
  font-size: calc(var(--art) * 0.08);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.song figcaption { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; max-width: 240px; text-align: right; }

.song__t { font-size: 30px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }

.song__k {
  color: rgba(247, 249, 252, 0.5);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.sig {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--sig-bottom);
  left: var(--safe-x);
  z-index: 3;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.sig__cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  text-transform: uppercase;
}

.sig__ctaText { display: inline-flex; align-items: baseline; gap: 12px; }
.sig__ctaText i { font-style: normal; font-size: 26px; }

/* The rail's gradient, once more, underlining the one line of action. */
.sig__bar { display: block; width: 72px; height: 3px; background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 55%, #67e8f9 100%); }

.sig__brand { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.sig__mark { width: 176px; height: auto; }

.sig__site {
  color: rgba(247, 249, 252, 0.5);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

/* Square: everything a size down; the description yields to one line so the row stays clear. */
.board[data-format="square"] .rail { gap: 18px; }
.board[data-format="square"] .block { left: calc(var(--safe-x) + 88px); gap: 18px; }
.board[data-format="square"] .line { max-width: 360px; font-size: 24px; -webkit-line-clamp: 1; }
.board[data-format="square"] .song { top: calc(var(--row-top) - 44px); gap: 18px; }
.board[data-format="square"] .song__t { font-size: 26px; }
.board[data-format="square"] .song figcaption { max-width: 220px; }
.board[data-format="square"] .sig__cta { font-size: 26px; }
.board[data-format="square"] .sig__mark { width: 150px; }

/* Story: more room, larger record. */
.board[data-format="story"] .line { font-size: 32px; max-width: 440px; }
.board[data-format="story"] .song__t { font-size: 32px; }
</style>
