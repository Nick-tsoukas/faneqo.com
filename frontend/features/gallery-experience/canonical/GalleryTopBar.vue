<template>
  <header class="gtb" :class="{ 'is-away': away }">
    <div class="gtb__row">
      <button
        type="button"
        class="gtb__back"
        :aria-label="backAria"
        @click="onBack"
      >
        <component :is="backGlyph" :size="22" :stroke-width="1.75" aria-hidden="true" />
      </button>

      <button
        v-if="allowShare"
        type="button"
        class="gtb__share"
        :disabled="sharing"
        @click="$emit('share')"
      >
        <component :is="shareGlyph" :size="17" :stroke-width="1.75" aria-hidden="true" />
        <span>{{ sharing ? 'Opening…' : 'Share' }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
/**
 * The gallery's top bar: Back and Share, and nothing else.
 *
 * It is sticky, but it is not permanent. While a fan scrolls down into the
 * photographs it slides away, so the sequence has the whole viewport; the
 * first scroll back up returns it. That is the native photo-app contract,
 * and it means the only chrome a fan sees while looking at a print is the
 * print.
 *
 * Back honours whatever the page resolved (`resolveGalleryReturn`): the
 * Night, the archive, or the artist. Share opens the page's canonical share
 * sheet. The bar renders no artist name — the identity block directly
 * beneath it already says who this is, and saying it twice at the top of
 * the page is noise.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { faneqoIcon } from '~/utils/messages/faneqoIcons'
import { onPageScroll, pageScrollTop } from '~/utils/ui/pageScroll.js'

const props = defineProps({
  artistName: { type: String, default: 'Artist' },
  artistPath: { type: String, default: '/' },
  backTo: { type: String, default: '' },
  backLabel: { type: String, default: '' },
  allowShare: { type: Boolean, default: false },
  sharing: { type: Boolean, default: false },
})

defineEmits(['share'])

const router = useRouter()
const backGlyph = computed(() => faneqoIcon('back'))
const shareGlyph = computed(() => faneqoIcon('share'))

const backAria = computed(() => {
  if (!props.backLabel) return `Back to ${props.artistName}`
  return String(props.backLabel).startsWith('Back') ? props.backLabel : `Back to ${props.backLabel}`
})

function onBack() {
  if (props.backTo) {
    navigateTo(props.backTo)
    return
  }
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  navigateTo(props.artistPath)
}

/* ---- away while reading down, back on the first scroll up ---- */

const away = ref(false)
let lastY = 0
let stopScroll = () => {}

/** How far into the page before the bar is allowed to leave. */
const AWAY_AFTER = 160
/** Scroll noise below this does not count as a direction. */
const DIRECTION_SLACK = 6

function onScroll() {
  const y = pageScrollTop()
  const delta = y - lastY
  if (y <= AWAY_AFTER) {
    away.value = false
  } else if (delta > DIRECTION_SLACK) {
    away.value = true
  } else if (delta < -DIRECTION_SLACK) {
    away.value = false
  }
  if (Math.abs(delta) > DIRECTION_SLACK) lastY = y
}

onMounted(() => {
  lastY = pageScrollTop()
  stopScroll = onPageScroll(onScroll)
})

onBeforeUnmount(() => {
  stopScroll()
})
</script>

<style scoped>
.gtb {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(5, 6, 8, 0.82);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  transform: translateY(0);
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.gtb.is-away {
  transform: translateY(-100%);
}

.gtb__row {
  --gtb-x: max(8px, env(safe-area-inset-left, 0px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  max-width: calc(1600px + 2 * max(20px, env(safe-area-inset-left, 0px)));
  min-height: calc(52px + env(safe-area-inset-top, 0px));
  margin: 0 auto;
  padding: env(safe-area-inset-top, 0px) var(--gtb-x) 0;
}

@media (min-width: 640px) {
  .gtb__row { --gtb-x: max(20px, env(safe-area-inset-left, 0px)); max-width: calc(1600px + 2 * 32px); }
}

@media (min-width: 1024px) {
  .gtb__row { --gtb-x: max(44px, env(safe-area-inset-left, 0px)); max-width: calc(1600px + 2 * 56px); }
}

@media (min-width: 1440px) {
  .gtb__row { --gtb-x: max(60px, env(safe-area-inset-left, 0px)); max-width: calc(1600px + 2 * 72px); }
}

.gtb__back,
.gtb__share {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.9);
  font: inherit;
  cursor: pointer;
  transition: color 160ms linear, background-color 160ms linear;
}

.gtb__back:hover,
.gtb__share:hover:not(:disabled) {
  color: #f7f9fc;
  background: rgba(255, 255, 255, 0.06);
}

.gtb__back:focus-visible,
.gtb__share:focus-visible {
  outline: 2px solid rgba(247, 249, 252, 0.92);
  outline-offset: 2px;
}

.gtb__share {
  gap: 7px;
  padding: 0 12px;
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.gtb__share:disabled {
  opacity: 0.55;
  cursor: wait;
}

@media (prefers-reduced-motion: reduce) {
  .gtb,
  .gtb__back,
  .gtb__share {
    transition: none;
  }
}
</style>
