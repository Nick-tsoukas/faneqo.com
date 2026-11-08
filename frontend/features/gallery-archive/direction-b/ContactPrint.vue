<template>
  <figure class="cp" :class="{ 'is-lead': lead, 'is-blank': blank }" :style="{ '--cp-ratio': ratio }">
    <!--
      A Gallery with no photographs still prints. It gets a plate the size of a
      frame so the strip stays a strip, and the type says what it is.
    -->
    <button
      v-if="blank"
      type="button"
      class="cp__plate"
      :aria-label="`Open ${title}`"
      @click="emit('open', item, { index: 0 })"
    >
      <span>No frames yet</span>
    </button>
    <FaneqoGalleryStack
      v-else
      :media="item.media || []"
      :title="title"
      :count="frames"
      size="compact"
      :priority="priority"
      :transition-key="item.id"
      @activate="emit('open', item, $event)"
    />
    <figcaption class="cp__caption">
      <p v-if="draft" class="cp__state">Draft</p>
      <p class="cp__line">
        <span class="cp__no" aria-hidden="true">{{ number }}</span>
        <span class="cp__title">{{ title }}</span>
      </p>
      <p class="cp__meta">{{ meta }}</p>
    </figcaption>
  </figure>
</template>

<script setup>
import { computed } from 'vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import {
  archiveVisibilityLabel,
  galleryTitle,
  isDraftGallery,
} from '~/utils/galleries/archiveShelves'
import { frameCount, frameLabel, frameNumber, frameRatio } from './contactSheet.js'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, default: 0 },
  lead: { type: Boolean, default: false },
  priority: { type: Boolean, default: false },
})

const emit = defineEmits(['open'])

const title = computed(() => galleryTitle(props.item))
const frames = computed(() => frameCount(props.item))
const blank = computed(() => frames.value === 0 && !(props.item?.media || []).length)
const draft = computed(() => isDraftGallery(props.item))
const ratio = computed(() => String(frameRatio(props.item)))
const number = computed(() => frameNumber(props.index))
const meta = computed(() => [
  frameLabel(frames.value),
  archiveVisibilityLabel(props.item?.visibility),
].filter(Boolean).join(' · '))
</script>

<style scoped>
/*
 * A print on a proof sheet: the photograph, then a stamped caption pressed
 * right up under it. Width comes from the frame's own shape — `--cp-ratio`
 * both grows the flex item and matches the ratio the Stack prints at — so
 * every frame in a strip shares a height and none of them is squared off.
 */
.cp {
  --cp-pad: 1.1rem;
  flex: var(--cp-ratio, 1) 1 calc(var(--cp-ratio, 1) * var(--cp-h, 8rem) + var(--cp-pad));
  min-width: 0;
  max-width: calc(var(--cp-ratio, 1) * var(--cp-cap, 30rem) + var(--cp-pad));
  margin: 0;
}

/* A gallery with nothing in it never prints larger than a frame that has. */
.cp.is-blank {
  max-width: calc(var(--cp-ratio, 1) * var(--cp-h, 8rem) * 1.1 + var(--cp-pad));
}

.cp__caption {
  padding: 0.34rem 0.55rem 0;
}
.cp.is-blank .cp__caption {
  padding-inline: 0;
}

/* Unpublished is a state, not another fact, and it reads before the name. */
.cp__state {
  margin: 0 0 0.12rem;
  color: rgba(245, 245, 246, 0.8);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.cp__line {
  display: flex;
  align-items: baseline;
  gap: 0.42rem;
  margin: 0;
  min-width: 0;
}
.cp__no {
  flex-shrink: 0;
  color: rgba(245, 245, 246, 0.3);
  font-size: 0.62rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}
.cp__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  color: #f5f5f6;
  font-size: 0.8rem;
  font-weight: 560;
  letter-spacing: -0.014em;
  line-height: 1.22;
  overflow-wrap: anywhere;
  transition: color 160ms cubic-bezier(0.22, 1, 0.36, 1);
}
.cp.is-lead .cp__title {
  font-size: 0.96rem;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.cp__meta {
  margin: 0.14rem 0 0 1.42rem;
  color: rgba(245, 245, 246, 0.36);
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
}
.cp.is-lead .cp__meta {
  margin-left: 0;
  font-size: 0.72rem;
}

/* ---- a Gallery with nothing in it yet ---- */

.cp__plate {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: var(--cp-ratio, 1.4);
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: transparent;
  color: rgba(245, 245, 246, 0.34);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: border-color 160ms cubic-bezier(0.22, 1, 0.36, 1), color 160ms cubic-bezier(0.22, 1, 0.36, 1);
}
.cp__plate:hover {
  border-color: rgba(255, 255, 255, 0.24);
  color: rgba(245, 245, 246, 0.6);
}
.cp__plate:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
  .cp:hover .cp__title,
  .cp:focus-within .cp__title {
    color: #ffffff;
  }
}

@media (min-width: 1080px) {
  .cp__title {
    font-size: 0.83rem;
  }
  .cp.is-lead .cp__title {
    font-size: 1.08rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cp__title,
  .cp__plate {
    transition: none;
  }
}
</style>
