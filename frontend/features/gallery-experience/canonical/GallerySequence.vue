<template>
  <div class="seq" :class="{ 'is-one': photos.length === 1 }">
    <div
      v-for="(spread, s) in spreads"
      :key="`spread-${s}`"
      class="seq__spread"
      :class="`is-${spread.kind}`"
      :data-kind="spread.kind"
      :style="spreadStyle(spread)"
    >
      <button
        v-for="item in spread.items"
        :key="item.photo.id"
        ref="frames"
        type="button"
        class="seq__frame"
        :class="{ 'is-source': sourceIndex === item.index }"
        :style="frameStyle(item)"
        :data-index="item.index"
        :data-narrow="item.narrow"
        :data-span="item.span"
        :aria-label="labelFor(item)"
        @click="$emit('open', item.index)"
      >
        <img
          class="seq__img"
          :src="item.photo.thumbSrc"
          :srcset="item.photo.srcset || undefined"
          :sizes="item.photo.srcset ? sequenceSizes(item, spread) : undefined"
          :width="item.photo.width || undefined"
          :height="item.photo.height || undefined"
          :loading="item.index < eager ? 'eager' : 'lazy'"
          :fetchpriority="item.index === 0 ? 'high' : 'auto'"
          alt=""
          decoding="async"
          @load="onLoad"
        >
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * The sequence — the photographs, hung.
 *
 * `planGallerySequence` decides which prints share a spread; this component
 * does not measure anything. Every spread is a flex row whose prints grow in
 * proportion to their aspect ratio, which makes their heights equal without a
 * single pixel computed in JavaScript. A spread that would stand taller than
 * the viewport allows is held back by `max-width` instead — the exact width
 * at which its height meets the cap — and centred, so the stage around it is
 * deliberate rather than leftover.
 *
 * Because the plan is independent of viewport, the server and every client
 * render the same markup. There is no re-plan on mount and no reflow after
 * hydration. On a phone the same spreads re-hang vertically: every print
 * takes the full width, except two adjacent portraits, which stay a pair.
 *
 * A print is a print: no card, no radius, no shadow, no caption beneath it.
 * `width`/`height` on the `<img>` and `aspect-ratio` on the frame reserve the
 * geometry before a byte arrives. Each frame is a real `<button>`, so the
 * sequence is keyboard-navigable and the viewer returns focus to the exact
 * print that was pressed.
 */
import { computed, onMounted, ref } from 'vue'
import {
  planGallerySequence,
  sequenceSizes,
  sequenceEagerCount,
  SEQUENCE_CAP,
} from './gallerySequence.js'

const props = defineProps({
  photos: { type: Array, default: () => [] },
  totalCount: { type: Number, default: 0 },
  /** Index currently open in the viewer — its frame empties so the flight reads true. */
  sourceIndex: { type: Number, default: -1 },
})

defineEmits(['open'])

const frames = ref([])
const eager = sequenceEagerCount()

const spreads = computed(() => planGallerySequence(props.photos))

/**
 * The width at which this spread's height reaches its cap. Below it the row
 * fills the column; above it the row stops growing and sits centred.
 */
function spreadStyle(spread) {
  const cap = spread.count === 1 ? SEQUENCE_CAP.solo : SEQUENCE_CAP.group
  const gaps = spread.count - 1
  return {
    '--spread-sum': String(Math.round(spread.ratioSum * 1000) / 1000),
    '--spread-gaps': String(gaps),
    '--spread-cap': `${Math.round(cap * 100)}dvh`,
    // A small file stops growing before it goes soft; a large one never meets this.
    '--spread-limit': spread.enlargeLimit ? `${spread.enlargeLimit}px` : '100000px',
  }
}

/*
 * Grow factors are the print's share of the spread scaled to sum to 100.
 * Raw ratios would do for a pair, but flexbox only hands out free space in
 * proportion to grow factors when they sum to at least 1 — a lone portrait
 * at `flex-grow: 0.6` would stop at sixty percent of its row.
 */
function frameStyle(item) {
  return {
    '--r': String(Math.round(item.ratio * 1000) / 1000),
    '--grow': String(Math.round(item.share * 100000) / 1000),
    '--narrow-share': String(Math.round(item.narrowShare * 1000) / 1000),
    '--frame-limit': item.frameLimit ? `${item.frameLimit}px` : '100000px',
  }
}

function labelFor(item) {
  const total = props.totalCount || props.photos.length
  const caption = item.photo.caption || item.photo.alt
  const position = `Open photograph ${item.index + 1} of ${total}`
  return caption ? `${position}. ${caption}` : position
}

function onLoad(event) {
  reveal(event.target)
}

function reveal(img) {
  if (!img) return
  img.classList.add('is-in')
  img.closest('.seq__frame')?.classList.add('is-loaded')
}

/*
 * A cached photograph can finish before hydration attaches `@load`, which
 * would leave it invisible. Sweep once on mount.
 */
onMounted(() => {
  for (const frame of frames.value) {
    const img = frame?.querySelector?.('img')
    if (img?.complete && img.naturalWidth > 0) reveal(img)
  }
})

/** The sequence owns the frames, so it owns handing one back to the viewer. */
function frameAt(index) {
  return frames.value.find((el) => Number(el?.dataset?.index) === Number(index)) || null
}

defineExpose({ frameAt })
</script>

<style scoped>
/*
 * Stage tokens. These numbers are the same ones `gallerySequence.js` exports
 * (SEQUENCE_PADDING, SEQUENCE_GAP, SEQUENCE_MAX_WIDTH) and uses to write each
 * print's `sizes`; change them together.
 */
.seq {
  --seq-pad: 0px;
  --seq-gap: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: calc(1600px + 2 * var(--seq-pad));
  margin: 0 auto;
  padding: 0 var(--seq-pad);
}

@media (min-width: 640px) {
  .seq { --seq-pad: 32px; --seq-gap: 28px; }
}

@media (min-width: 1024px) {
  .seq { --seq-pad: 56px; --seq-gap: 36px; }
}

@media (min-width: 1440px) {
  .seq { --seq-pad: 72px; }
}

/*
 * A spread. Prints grow by ratio from a zero basis, so widths are exactly
 * proportional and heights are exactly equal. `max-width` is the row width at
 * which the shared height meets the viewport cap.
 */
.seq__spread {
  display: flex;
  align-items: flex-start;
  gap: var(--seq-gap);
  width: 100%;
  max-width: min(
    calc(var(--spread-cap) * var(--spread-sum) + var(--spread-gaps) * var(--seq-gap)),
    calc(var(--spread-limit) + var(--spread-gaps) * var(--seq-gap))
  );
  margin: 0 auto var(--seq-gap);
}

.seq__spread:last-child {
  margin-bottom: 0;
}

.seq__frame {
  position: relative;
  display: block;
  flex: var(--grow) 1 0px;
  min-width: 0;
  min-height: 0;
  aspect-ratio: var(--r);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #0b0c10;
  cursor: zoom-in;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

/* Once the photograph is in, the frame's own tone must not show at its edges. */
.seq__frame.is-loaded {
  background: transparent;
}

.seq__frame:focus-visible {
  outline: 2px solid rgba(247, 249, 252, 0.92);
  outline-offset: 3px;
}

/* While a photograph is open in the viewer, its frame is empty. */
.seq__frame.is-source {
  opacity: 0;
}

.seq__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 480ms linear;
}

.seq__img.is-in {
  opacity: 1;
}

/*
 * A phone re-hangs the sequence vertically. Each print takes the full width
 * and is held under the viewport height; two adjacent portraits keep their
 * pairing at their exact proportional widths, so their heights still match.
 */
@media (max-width: 639.98px) {
  .seq__spread {
    flex-wrap: wrap;
    max-width: none;
    margin-bottom: var(--seq-gap);
  }

  .seq__spread:last-child {
    margin-bottom: 0;
  }

  .seq__frame[data-narrow="full"] {
    flex: 0 0 100%;
    max-height: 82dvh;
  }

  .seq__frame[data-narrow="half"] {
    flex: 0 0 calc((100% - var(--seq-gap)) * var(--narrow-share));
    max-height: 82dvh;
  }
}

/*
 * Between a phone and a laptop the column is too narrow for three abreast.
 * The first print of a trio takes the row; the other two hang beneath it as
 * a pair at their shared height.
 */
@media (min-width: 640px) and (max-width: 1023.98px) {
  .seq__spread.is-trio {
    flex-wrap: wrap;
    max-width: none;
  }

  .seq__spread.is-trio .seq__frame:first-child {
    flex: 0 0 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .seq__img {
    transition: none;
    opacity: 1;
  }
}

/*
 * Desktop: two editorial columns. This block must follow the flex-spread
 * rules so `display: contents` wins. Each print keeps its own ratio and
 * takes a full column — a portrait is as wide as a landscape, never a
 * centred leftover thumbnail. Spreads dissolve so the frames join one
 * grid in source order. Phone and tablet keep the flex-spread hang above.
 */
@media (min-width: 1024px) {
  .seq {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
    gap: 24px;
    max-width: calc(1280px + 2 * var(--seq-pad));
    --seq-gap: 24px;
  }

  .seq.is-one {
    grid-template-columns: minmax(0, 1fr);
    max-width: calc(880px + 2 * var(--seq-pad));
  }

  .seq .seq__spread {
    display: contents;
    max-width: none;
    margin: 0;
  }

  .seq .seq__frame {
    flex: none;
    width: 100%;
    max-width: min(100%, var(--frame-limit));
    margin: 0;
  }

  .seq .seq__frame[data-span="wide"] {
    grid-column: 1 / -1;
  }
}
</style>
