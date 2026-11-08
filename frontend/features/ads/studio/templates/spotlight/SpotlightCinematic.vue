<template>
  <article
    class="board"
    :class="{ 'is-top': stackOnTop }"
    :data-format="formatId"
    :data-treatment="treatment"
    :style="vars"
    :aria-label="`${c.headlineTop} ${c.headlineAccent}. ${artistName}.`"
  >
    <!-- The photograph is the whole frame. -->
    <PhotoField class="photo" :media="photo" :focal="focal" fade="none" />
    <!-- Grade: a soft vignette, one long ramp where the words live, and a faint light behind the title. -->
    <div class="grade" aria-hidden="true" />
    <div class="light" aria-hidden="true" />
    <div class="grain" aria-hidden="true" />

    <!-- One-sheet logic: everything centred on the vertical axis. The stack sits where the face is not. -->
    <div class="stack">
      <p class="label">
        <span>{{ c.headlineTop }}</span>
        <span v-if="labelAccent">{{ labelAccent }}</span>
      </p>
      <h1 ref="nameEl" class="name" :style="nameStyle">
        <span v-for="(line, i) in nameLines" :key="i" class="name__line">{{ line }}</span>
      </h1>
      <p v-if="c.description" class="line">{{ c.description }}</p>

      <!-- Billing block: a centred rule, then the record and its credit in one line. -->
      <div v-if="c.songTitle || genre" class="billing">
        <span class="billing__rule" aria-hidden="true" />
        <div v-if="c.songTitle" class="now">
          <img v-if="songArtSrc" class="now__art" :src="songArtSrc" alt="" />
          <div v-else class="now__art now__art--empty" aria-hidden="true"><span>{{ songInitial }}</span></div>
          <span class="now__k">Featured song</span>
          <span class="now__t">{{ c.songTitle }}</span>
        </div>
        <p v-if="credits" class="credits">{{ credits }}</p>
      </div>
    </div>

    <footer class="sig">
      <img class="sig__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
      <div class="sig__act">
        <span class="sig__cta">{{ c.cta }} <i>→</i></span>
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
 * Artist Spotlight — Cinematic Immersion. One photograph fills the frame; a
 * graded ramp, a faint light and a film grain hold a centred one-sheet stack:
 * label, name, tagline, billing block (record + credits).
 *
 * Face safety: the photograph's focal point lands at about the same relative
 * height in the frame, so when the focal point is in the lower half the stack
 * and its ramp move to the top of the frame instead of covering the subject.
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

/* Name cap, stack anchor (bottom or top), signature, wordmark, where the ramp begins, artwork tile. */
const LAYOUTS = {
  post: { name: 172, 'stack-bottom': 236, 'stack-top': 120, 'sig-bottom': 72, mark: 176, 'ramp-from': '44%', art: 72 },
  feed: { name: 172, 'stack-bottom': 228, 'stack-top': 112, 'sig-bottom': 64, mark: 176, 'ramp-from': '42%', art: 72 },
  story: { name: 180, 'stack-bottom': 520, 'stack-top': 300, 'sig-bottom': 336, mark: 184, 'ramp-from': '46%', art: 80 },
  square: { name: 126, 'stack-bottom': 188, 'stack-top': 88, 'sig-bottom': 56, mark: 150, 'ramp-from': '34%', art: 60 },
}

const TREATMENTS = ['natural', 'balanced', 'deep']
/* Focal y (percent of frame) at or beyond which the subject would sit under a bottom stack. */
const LOW_SUBJECT = 46

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))
const c = computed(() => props.content || {})
const treatment = computed(() => (TREATMENTS.includes(c.value.treatment) ? c.value.treatment : 'balanced'))
const vars = computed(() => boardVars(formatId.value, LAYOUTS))
const artistName = computed(() => c.value.artistName || props.snapshot?.name || 'Artist')
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
const labelAccent = computed(() => (norm(c.value.headlineAccent) === norm(artistName.value) ? '' : c.value.headlineAccent))
const genre = computed(() => String(props.snapshot?.genre || '').split(',')[0].trim())
/* Credits line: genre and badge, the way a one-sheet bills its studio and rating. */
const credits = computed(() => [genre.value, c.value.badgeText].filter(Boolean).join('  ·  '))
const photo = computed(() => c.value.photo || props.snapshot?.hero || null)
const focal = computed(() => c.value.focal || photo.value?.focal || null)
const stackOnTop = computed(() => Number(focal.value?.y) >= LOW_SUBJECT)
const songArt = computed(() => (c.value.songArt === null ? null : c.value.songArt || props.snapshot?.song?.art || null))
const songArtSrc = computed(() => studioImageUrl(songArt.value?.url))
const songInitial = computed(() => String(c.value.songTitle || '').trim().charAt(0).toUpperCase())

const nameLines = computed(() => splitNameLines(artistName.value))
const nameEl = ref(null)
const nameStyle = useFitLine(nameEl, { cssVar: 'name', max: () => (nameLines.value.length > 1 ? 0.66 : 1) }, [artistName, formatId])
</script>

<style scoped>
.board {
  position: relative;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1350px);
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.photo { position: absolute; inset: 0; }

/* The photograph is lifted slightly in contrast so the grade has something to bite into. */
.photo :deep(.photo__img) { filter: contrast(1.06) saturate(1.04); }

.grade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, rgba(5, 5, 6, 0.34) 0%, rgba(5, 5, 6, 0) 22%),
    radial-gradient(120% 90% at 50% 42%, rgba(5, 5, 6, 0) 58%, rgba(5, 5, 6, 0.36) 100%),
    linear-gradient(to bottom, rgba(5, 5, 6, 0) var(--ramp-from), rgba(5, 5, 6, 0.5) calc(var(--ramp-from) + 14%), rgba(5, 5, 6, 0.86) calc(var(--ramp-from) + 30%), rgba(5, 5, 6, 0.94) 100%);
}

/* A faint stage light behind the title, in the brand's violet. */
.light {
  position: absolute;
  right: 0;
  bottom: calc(var(--stack-bottom) - 120px);
  left: 0;
  height: 560px;
  background: radial-gradient(78% 56% at 50% 62%, rgba(192, 132, 252, 0.16) 0%, rgba(255, 74, 216, 0.05) 46%, rgba(5, 5, 6, 0) 74%);
  mix-blend-mode: screen;
}

/* Film grain, barely there. */
.grain {
  position: absolute;
  inset: 0;
  opacity: 0.07;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>");
  background-size: 240px 240px;
  mix-blend-mode: soft-light;
}

/* Subject low in the frame: the ramp, the light and the stack come from the top; the signature keeps its own small shade. */
.is-top .grade {
  background:
    radial-gradient(120% 90% at 50% 58%, rgba(5, 5, 6, 0) 58%, rgba(5, 5, 6, 0.36) 100%),
    linear-gradient(to top, rgba(5, 5, 6, 0) 70%, rgba(5, 5, 6, 0.55) 78%, rgba(5, 5, 6, 0.9) 92%, rgba(5, 5, 6, 0.96) 100%),
    linear-gradient(to bottom, rgba(5, 5, 6, 0) 78%, rgba(5, 5, 6, 0.72) 100%);
}

.is-top .light { top: calc(var(--stack-top) - 160px); bottom: auto; background: radial-gradient(78% 56% at 50% 42%, rgba(192, 132, 252, 0.16) 0%, rgba(255, 74, 216, 0.05) 46%, rgba(5, 5, 6, 0) 74%); }

.stack {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--stack-bottom);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.is-top .stack { top: var(--stack-top); bottom: auto; }

.label {
  display: flex;
  gap: 0.7em;
  margin: 0 0 2px;
  color: rgba(247, 249, 252, 0.78);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  text-transform: uppercase;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.5);
}

.name {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 0.92;
  text-transform: uppercase;
  white-space: nowrap;
  text-shadow: 0 6px 48px rgba(0, 0, 0, 0.55), 0 1px 2px rgba(0, 0, 0, 0.25);
}

.name__line { display: block; }

.line {
  max-width: 32ch;
  margin: 4px 0 0;
  color: rgba(247, 249, 252, 0.86);
  font-size: 30px;
  font-weight: 400;
  letter-spacing: 0.01em;
  line-height: 1.3;
  text-wrap: balance;
  text-shadow: 0 1px 14px rgba(0, 0, 0, 0.5);
}

.billing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  margin-top: 22px;
}

.billing__rule {
  display: block;
  width: 420px;
  height: 1px;
  background: linear-gradient(90deg, rgba(247, 249, 252, 0) 0%, rgba(247, 249, 252, 0.55) 30%, rgba(247, 249, 252, 0.55) 70%, rgba(247, 249, 252, 0) 100%);
}

.now {
  display: flex;
  align-items: center;
  gap: 18px;
  text-align: left;
}

.now__art {
  width: var(--art);
  height: var(--art);
  border-radius: 3px;
  object-fit: cover;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(247, 249, 252, 0.12);
}

/* No artwork: a quiet monogram tile, so the row never shows a hole. */
.now__art--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1c1d24, #0d0e12);
  color: rgba(247, 249, 252, 0.7);
  font-size: calc(var(--art) * 0.42);
  font-weight: 800;
}

.now__k {
  color: rgba(247, 249, 252, 0.56);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.now__t { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }

.credits {
  margin: -6px 0 0;
  color: rgba(247, 249, 252, 0.6);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  text-transform: uppercase;
  white-space: pre;
}

.sig {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--sig-bottom);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.sig__mark { width: var(--mark); height: auto; }

.sig__act { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }

.sig__cta { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; text-shadow: 0 2px 18px rgba(0, 0, 0, 0.5); }
.sig__cta i { font-style: normal; margin-left: 6px; }

.sig__site {
  color: rgba(247, 249, 252, 0.52);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

/* Treatment: how much of the photograph the ramp claims. */
.board[data-treatment="natural"] .grade {
  background:
    linear-gradient(to bottom, rgba(5, 5, 6, 0.22) 0%, rgba(5, 5, 6, 0) 18%),
    linear-gradient(to bottom, rgba(5, 5, 6, 0) calc(var(--ramp-from) + 8%), rgba(5, 5, 6, 0.5) calc(var(--ramp-from) + 22%), rgba(5, 5, 6, 0.84) calc(var(--ramp-from) + 36%), rgba(5, 5, 6, 0.9) 100%);
}

.board[data-treatment="deep"] .grade {
  background:
    linear-gradient(to bottom, rgba(5, 5, 6, 0.4) 0%, rgba(5, 5, 6, 0) 26%),
    radial-gradient(120% 90% at 50% 42%, rgba(5, 5, 6, 0) 48%, rgba(5, 5, 6, 0.5) 100%),
    linear-gradient(to bottom, rgba(5, 5, 6, 0.08) 0%, rgba(5, 5, 6, 0.1) calc(var(--ramp-from) - 10%), rgba(5, 5, 6, 0.68) calc(var(--ramp-from) + 12%), rgba(5, 5, 6, 0.92) calc(var(--ramp-from) + 28%), rgba(5, 5, 6, 0.97) 100%);
}

.board[data-treatment="deep"] .photo :deep(.photo__img) { filter: brightness(0.86) contrast(1.08) saturate(1.02); }

.board.is-top[data-treatment="natural"] .grade {
  background:
    linear-gradient(to top, rgba(5, 5, 6, 0) 72%, rgba(5, 5, 6, 0.5) 82%, rgba(5, 5, 6, 0.86) 94%, rgba(5, 5, 6, 0.92) 100%),
    linear-gradient(to bottom, rgba(5, 5, 6, 0) 80%, rgba(5, 5, 6, 0.66) 100%);
}

.board.is-top[data-treatment="deep"] .grade {
  background:
    radial-gradient(120% 90% at 50% 58%, rgba(5, 5, 6, 0) 48%, rgba(5, 5, 6, 0.5) 100%),
    linear-gradient(to top, rgba(5, 5, 6, 0.1) 62%, rgba(5, 5, 6, 0.7) 76%, rgba(5, 5, 6, 0.94) 92%, rgba(5, 5, 6, 0.98) 100%),
    linear-gradient(to bottom, rgba(5, 5, 6, 0) 76%, rgba(5, 5, 6, 0.8) 100%);
}

/* Square: tighter type and a shorter billing block. */
.board[data-format="square"] .stack { gap: 12px; }
.board[data-format="square"] .label { font-size: 17px; }
.board[data-format="square"] .line { font-size: 26px; max-width: 34ch; }
.board[data-format="square"] .billing { gap: 16px; margin-top: 14px; }
.board[data-format="square"] .billing__rule { width: 340px; }
.board[data-format="square"] .now__t { font-size: 26px; }
.board[data-format="square"] .now__k { font-size: 14px; }
.board[data-format="square"] .credits { display: none; }
.board[data-format="square"] .light { height: 400px; bottom: calc(var(--stack-bottom) - 100px); }
.board[data-format="square"] .sig__cta { font-size: 28px; }

/* Story: more air in the stack. */
.board[data-format="story"] .stack { gap: 20px; }
.board[data-format="story"] .label { font-size: 20px; }
.board[data-format="story"] .line { font-size: 32px; }
.board[data-format="story"] .billing { gap: 26px; margin-top: 30px; }
.board[data-format="story"] .now__t { font-size: 32px; }
.board[data-format="story"] .light { height: 640px; bottom: calc(var(--stack-bottom) - 160px); }
.board[data-format="story"] .sig__cta { font-size: 34px; }
</style>
