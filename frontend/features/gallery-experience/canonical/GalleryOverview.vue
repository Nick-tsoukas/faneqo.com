<template>
  <div class="gov">
    <!-- The overview goes inert while a photograph is open. -->
    <main ref="sheetEl" class="gov__sheet" :inert="viewer.open.value || undefined">
      <GalleryIdentityBlock :identity="model.identity" variant="overview" />

      <GallerySequence
        v-if="photos.length"
        ref="sequenceEl"
        class="gov__sequence"
        :photos="photos"
        :total-count="photos.length"
        :source-index="viewer.open.value ? viewer.index.value : -1"
        @open="open"
      />

      <p v-if="!photos.length" class="gov__empty">
        {{ emptyCopy }}
      </p>

      <div v-else class="gov__close" aria-hidden="true" />

      <slot name="after" />
    </main>

    <!-- Back to the top. A glyph, and only while you are on your way out. -->
    <button
      v-if="topControl"
      type="button"
      class="gov__top"
      :class="{ 'is-on': showTop }"
      :tabindex="showTop ? 0 : -1"
      aria-label="Back to the top of this gallery"
      @click="toTop"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>

    <GalleryViewer
      v-if="photos.length"
      :viewer="viewer"
      :photos="photos"
      :identity="model.identity"
      :origin="origin"
      :reduced="reduced"
      :resolve-frame="resolveFrame"
      @shared="$emit('shared', $event)"
    />
  </div>
</template>

<script setup>
/**
 * The gallery overview — the canonical entry point for one Gallery / Night.
 *
 * "The overview says 'this was the Night.' The viewer says 'look at this.'"
 * So this page is a threshold (identity, title, the artist's words) and a
 * sequence of spreads. No card borders, no rounded corners, no shadows, no
 * captions under prints, no social-feed styling. Desktop hangs the prints
 * in two editorial columns; a phone keeps the full-width sequence.
 *
 * Layout is decided once by `planGallerySequence` and drawn by CSS, so the
 * server and every client agree and nothing here measures the viewport to
 * place a photograph.
 *
 * It takes one already-normalized model (see `galleryMediaModel.js`) and
 * knows nothing about Strapi, Event, Show Recap or Gallery schemas.
 *
 * A deep link (`#photo-<mediaId>`) opens that photograph on mount, resolved
 * only against authorized media — an unknown id opens the overview rather
 * than guessing at a photograph the fan may not be allowed to see.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GalleryIdentityBlock from './GalleryIdentityBlock.vue'
import GallerySequence from './GallerySequence.vue'
import GalleryViewer from './GalleryViewer.client.vue'
import { useGalleryViewer } from './useGalleryViewer.js'
import { onPageScroll, pageScrollTop, setPageScrollTop } from '../../../utils/ui/pageScroll.js'

const props = defineProps({
  /** Output of `normalizeGalleryModel`. The only shape this component reads. */
  model: { type: Object, required: true },
  origin: { type: String, default: '' },
  /**
   * A photograph to land on, handed over by whatever navigated here (the
   * Gallery Stack's `?photo=`/history hand-off). It reveals and focuses that
   * frame; it deliberately does NOT open the viewer. Arriving on a gallery
   * should show you the Night, with your photograph under the cursor — only a
   * real deep link (`#photo-<id>`) opens straight onto one photograph.
   */
  initialPhotoIndex: { type: Number, default: null },
  /**
   * Set false when the page already owns a control in the top-left corner
   * (a top bar, say), so two glyphs cannot stack up there.
   */
  topControl: { type: Boolean, default: true },
})

const emit = defineEmits(['shared', 'viewer'])

const sheetEl = ref(null)
const sequenceEl = ref(null)

const reduced = ref(false)
const showTop = ref(false)
let lastY = 0

const photos = computed(() => props.model.photos || [])

const emptyCopy = computed(() => (
  props.model.locked
    ? 'These photos are not available to you yet.'
    : 'No photographs from this Night yet.'
))

/** The frame a photograph flies out of and returns to. */
function resolveFrame(index) {
  return sequenceEl.value?.frameAt?.(index) || null
}

const viewer = useGalleryViewer({
  photos: () => photos.value,
  model: () => props.model,
  origin: props.origin,
  resolveFrame,
  reduced: () => reduced.value,
})

function open(index) {
  viewer.openAt(index)
}

function onScroll() {
  const y = pageScrollTop()
  // Arrives while you are returning, not while you are reading.
  showTop.value = y > 340 && y < lastY - 3
  lastY = y
}

function toTop() {
  setPageScrollTop(0, { smooth: !reduced.value })
}

/**
 * Reveal the handed-over photograph without opening it. Runs after paint so
 * the frame actually has a geometry.
 */
function revealHandedOverPhoto() {
  const at = props.initialPhotoIndex
  if (!Number.isFinite(at) || at <= 0 || at >= photos.value.length) return
  requestAnimationFrame(() => {
    const frame = resolveFrame(at)
    if (!frame) return
    frame.scrollIntoView({
      block: 'center',
      behavior: reduced.value ? 'auto' : 'smooth',
    })
    frame.focus?.({ preventScroll: true })
  })
}

let stopScroll = () => {}

onMounted(() => {
  reduced.value = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false
  lastY = pageScrollTop()
  /*
   * Not `window`: `<body>` is the scroll container on every Faneqo route, and
   * a scrolling `<body>` fires its scroll event on itself. See `pageScroll.js`.
   */
  stopScroll = onPageScroll(onScroll)
  // A shared photograph opens straight onto that photograph.
  if (!viewer.openFromHash(window.location.hash)) revealHandedOverPhoto()
})

/* The page above needs to know, so it can stand its own chrome down. */
watch(() => viewer.open.value, (isOpen) => emit('viewer', isOpen))

onBeforeUnmount(() => {
  stopScroll()
})

defineExpose({ viewer, open })
</script>

<style scoped>
.gov {
  /* The stage: obsidian, not a void. The viewer alone is pure black. */
  background: #050608;
  color: #f7f9fc;
}

.gov__sheet {
  margin: 0 auto;
}

/* The threshold's plate line is the top edge; the sequence begins a beat below it. */
.gov__sequence {
  margin-top: 22px;
}

@media (min-width: 640px) {
  .gov__sequence { margin-top: 32px; }
}

@media (min-width: 1024px) {
  .gov__sequence { margin-top: 28px; }
}

.gov__close {
  --gov-x: max(20px, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
  max-width: calc(1280px + 2 * var(--gov-x));
  margin: 36px auto 0;
  padding: 0 var(--gov-x);
}

.gov__close::after {
  content: '';
  display: block;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

@media (min-width: 640px) {
  .gov__close { --gov-x: max(32px, env(safe-area-inset-left, 0px)); margin-top: 40px; }
}

@media (min-width: 1024px) {
  .gov__close { --gov-x: max(56px, env(safe-area-inset-left, 0px)); margin-top: 48px; }
}

@media (min-width: 1440px) {
  .gov__close { --gov-x: max(72px, env(safe-area-inset-left, 0px)); }
}

.gov__empty {
  --gov-x: max(20px, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
  max-width: calc(1600px + 2 * var(--gov-x));
  margin: 28px auto 0;
  padding: 0 var(--gov-x);
  font-size: 16px;
  line-height: 1.5;
  color: rgba(247, 249, 252, 0.68);
}

@media (min-width: 640px) {
  .gov__empty { --gov-x: max(32px, env(safe-area-inset-left, 0px)); }
}

@media (min-width: 1024px) {
  .gov__empty { --gov-x: max(56px, env(safe-area-inset-left, 0px)); }
}

@media (min-width: 1440px) {
  .gov__empty { --gov-x: max(72px, env(safe-area-inset-left, 0px)); }
}

.gov__top {
  position: fixed;
  top: max(8px, env(safe-area-inset-top));
  left: max(6px, env(safe-area-inset-left));
  z-index: 20;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.94);
  filter: drop-shadow(0 1px 14px rgba(0, 0, 0, 0.95));
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: opacity 180ms linear, transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  cursor: pointer;
}

.gov__top.is-on {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.gov__top:focus-visible {
  outline: 2px solid rgba(247, 249, 252, 0.92);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .gov__top {
    transition: none;
  }
}
</style>
