<template>
  <div class="chrome" :class="{ 'is-on': visible }">
    <!-- top-left: who and which Night. Orientation, not metadata. -->
    <div class="chrome__id hit">
      <GalleryIdentityBlock :identity="identity" variant="viewer" />
    </div>

    <!-- top-right: the only two actions a photograph needs. -->
    <div class="chrome__acts">
      <button
        v-if="canShare"
        type="button"
        class="chrome__btn hit"
        :aria-label="shareLabel"
        @click="$emit('share')"
      >
        <component :is="shareGlyph" :size="20" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="chrome__btn hit"
        data-gallery-close
        aria-label="Close photograph"
        @click="$emit('close')"
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!--
      Side step controls, from tablet width up. Absent at each end of the
      Night so a dead arrow never implies a photograph that is not there. On a
      phone the same step sits beside the counter instead (see the foot), so
      the print keeps its full width and a thumb still has a target.
    -->
    <button
      v-if="canPrev"
      type="button"
      class="chrome__step chrome__step--prev hit"
      aria-label="Previous photograph"
      @pointerdown.stop
      @click.stop="$emit('prev')"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
    <button
      v-if="canNext"
      type="button"
      class="chrome__step chrome__step--next hit"
      aria-label="Next photograph"
      @pointerdown.stop
      @click.stop="$emit('next')"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- bottom: the words, and where you are. -->
    <div class="chrome__foot">
      <p v-if="caption" class="chrome__caption">{{ caption }}</p>
      <p v-else class="chrome__caption chrome__caption--empty" />
      <div class="chrome__nav">
        <button
          v-if="count > 1"
          type="button"
          class="chrome__footstep hit"
          :disabled="!canPrev"
          aria-label="Previous photograph"
          @pointerdown.stop
          @click.stop="$emit('prev')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          class="chrome__count hit"
          :aria-label="`Photograph ${index + 1} of ${count}. Show all photographs`"
          :aria-expanded="sheetOpen"
          @click="$emit('sheet')"
        >
          <b>{{ pad(index + 1) }}</b><span class="chrome__of" aria-hidden="true">/</span>{{ pad(count) }}
        </button>
        <button
          v-if="count > 1"
          type="button"
          class="chrome__footstep hit"
          :disabled="!canNext"
          aria-label="Next photograph"
          @pointerdown.stop
          @click.stop="$emit('next')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- where you are in the Night. A hairline, not a scrollbar. -->
    <div class="chrome__rule" aria-hidden="true">
      <span :style="{ transform: `scaleX(${count ? (index + 1) / count : 0})` }" />
    </div>
  </div>
</template>

<script setup>
/**
 * The viewer chrome.
 *
 * Artist identity, share, close, the caption, `current / total`, a one-pixel
 * position rule, and a previous/next step. No adjacent-image previews, no
 * permanently visible thumbnails, no floating panels, no decorative controls
 * over the print.
 *
 * The chrome is present by default. It does not time out: a close that has
 * disappeared is a close the fan has to go looking for, and the first thing
 * a photograph on a black stage must say is how to leave it. A deliberate
 * tap on the photograph clears the screen down to the print; a second tap,
 * or a moving mouse, brings the words back.
 *
 * WHERE THE STEP LIVES
 * --------------------
 * From tablet width up, the step is a pair of side arrows — the only
 * navigation a pointer can discover without already knowing about drag,
 * wheel or arrow keys. Each side arrow is removed, not disabled, at its end
 * of the Night, so a dead target never implies a photograph that is not
 * there. On a phone the arrows move into the foot beside the counter, where
 * a thumb reaches them and the print keeps its full width; the swipe is
 * still the primary gesture.
 *
 * READABILITY
 * -----------
 * Each control sits on a small translucent disc — enough contrast to read
 * over a blown-out sky, small enough that it is a button and not a panel.
 * There is still no gradient or scrim across the photograph. The caption
 * and counter sit in the stage's reserved foot, off the print, and carry a
 * tight `drop-shadow` only.
 *
 * Touch targets are 44x44 or larger, and the whole layer respects safe-area
 * insets so nothing lands under a notch or a home indicator.
 */
import { computed } from 'vue'
import GalleryIdentityBlock from './GalleryIdentityBlock.vue'
import { faneqoIcon } from '~/utils/messages/faneqoIcons'

const props = defineProps({
  identity: { type: Object, required: true },
  caption: { type: String, default: '' },
  index: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  visible: { type: Boolean, default: false },
  canShare: { type: Boolean, default: false },
  sheetOpen: { type: Boolean, default: false },
  shareKind: { type: String, default: 'photo' },
  canPrev: { type: Boolean, default: false },
  canNext: { type: Boolean, default: false },
})

defineEmits(['close', 'share', 'sheet', 'prev', 'next'])

/** The established Faneqo share glyph (Lucide Share2, stroke 1.75). */
const shareGlyph = computed(() => faneqoIcon('share'))

const shareLabel = computed(() => (
  props.shareKind === 'gallery' ? 'Share this gallery' : 'Share this photograph'
))

function pad(n) {
  return n < 10 ? `0${n}` : String(n)
}
</script>

<style scoped>
.chrome {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms linear;
  z-index: 2;
}

.chrome.is-on {
  opacity: 1;
}

.chrome.is-on .hit {
  pointer-events: auto;
}

.hit {
  pointer-events: none;
}

/* ---------------- top ---------------- */

.chrome__id {
  position: absolute;
  top: max(14px, calc(env(safe-area-inset-top) + 8px));
  left: max(14px, calc(env(safe-area-inset-left) + 10px));
  /* Never let identity run under the actions on a narrow phone. */
  max-width: calc(100% - 132px);
}

.chrome__acts {
  position: absolute;
  top: max(10px, calc(env(safe-area-inset-top) + 6px));
  right: max(10px, calc(env(safe-area-inset-right) + 6px));
  display: flex;
  align-items: center;
  gap: 8px;
}

/* One disc for every control: legible over any photograph, never a panel. */
.chrome__btn,
.chrome__step,
.chrome__footstep {
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(8, 10, 14, 0.58);
  color: rgba(247, 249, 252, 0.96);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: background-color 140ms linear, border-color 140ms linear, opacity 160ms linear;
}

.chrome__btn:hover,
.chrome__step:hover,
.chrome__footstep:hover:not(:disabled) {
  background: rgba(20, 23, 30, 0.82);
  border-color: rgba(255, 255, 255, 0.26);
}

.chrome__btn:focus-visible,
.chrome__step:focus-visible,
.chrome__footstep:focus-visible,
.chrome__count:focus-visible {
  outline: 2px solid rgba(247, 249, 252, 0.92);
  outline-offset: 2px;
}

.chrome__btn {
  /* 44x44 minimum, regardless of the glyph inside it. */
  width: 44px;
  height: 44px;
}

/* ---------------- side step ---------------- */

/*
 * Hidden on a phone, where the foot carries the step. The media query below
 * is the only thing that turns the side arrows on.
 */
.chrome__step {
  display: none;
}

@media (min-width: 640px) {
  .chrome__step {
    position: absolute;
    top: 50%;
    display: grid;
    width: 48px;
    height: 48px;
    margin-top: -24px;
  }

  .chrome__step--prev {
    left: max(12px, calc(env(safe-area-inset-left) + 8px));
  }

  .chrome__step--next {
    right: max(12px, calc(env(safe-area-inset-right) + 8px));
  }
}

@media (min-width: 1024px) and (hover: hover) {
  .chrome__step {
    /* Comfortably past 44x44 for a pointer that has to travel to it. */
    width: 56px;
    height: 56px;
    margin-top: -28px;
    opacity: 0.78;
  }

  .chrome__step:hover,
  .chrome__step:focus-visible {
    opacity: 1;
  }

  .chrome__step--prev {
    left: max(18px, calc(env(safe-area-inset-left) + 10px));
  }

  .chrome__step--next {
    right: max(18px, calc(env(safe-area-inset-right) + 10px));
  }
}

/* ---------------- bottom ---------------- */

.chrome__foot {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding:
    0
    calc(15px + env(safe-area-inset-right))
    calc(17px + env(safe-area-inset-bottom))
    calc(15px + env(safe-area-inset-left));
}

@media (min-width: 1024px) {
  .chrome__foot {
    padding-right: 26px;
    padding-bottom: 26px;
    padding-left: 26px;
  }
}

.chrome__caption {
  margin: 0;
  max-width: 44ch;
  font-size: 14px;
  line-height: 1.35;
  letter-spacing: -0.006em;
  color: rgba(247, 249, 252, 0.84);
  filter: drop-shadow(0 1px 12px rgba(0, 0, 0, 0.95));
}

/* A photograph with no caption leaves the space, not a placeholder. */
.chrome__caption--empty {
  min-height: 1px;
}

@media (min-width: 1024px) {
  .chrome__caption { font-size: 15.5px; }
}

.chrome__nav {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.chrome__count {
  flex: none;
  /* One line: a grid would stack the numeral and its denominator. */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  /* Reads as a numeral, answers like a 44px control. */
  min-width: 64px;
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.7);
  font: inherit;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
  filter: drop-shadow(0 1px 10px rgba(0, 0, 0, 0.95));
  cursor: pointer;
}

.chrome__count b {
  font-weight: 500;
  color: rgba(247, 249, 252, 0.97);
}

/* The counter is a flex row, which trims text spaces; the slash spaces itself. */
.chrome__of {
  margin: 0 0.45em;
  color: rgba(247, 249, 252, 0.4);
}

/*
 * The phone step. Disabled rather than removed at the ends so the counter
 * does not jump sideways between the first and last photograph.
 */
.chrome__footstep {
  width: 44px;
  height: 44px;
}

.chrome__footstep:disabled {
  opacity: 0.28;
  cursor: default;
}

@media (min-width: 640px) {
  .chrome__footstep {
    display: none;
  }
}

/* ---------------- position rule ---------------- */

.chrome__rule {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.09);
}

.chrome__rule span {
  display: block;
  height: 100%;
  background: rgba(247, 249, 252, 0.82);
  transform-origin: left center;
  transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .chrome,
  .chrome__rule span,
  .chrome__btn,
  .chrome__step,
  .chrome__footstep {
    transition: none;
  }
}
</style>
