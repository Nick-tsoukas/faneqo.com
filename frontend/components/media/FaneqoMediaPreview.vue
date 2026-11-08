<template>
  <ul class="fq-media-prev" :class="{ 'is-composer': !compact, 'is-compact': compact }">
    <li v-for="(item, index) in items" :key="itemKey(item, index)" class="fq-media-prev__item">
      <div class="fq-media-prev__frame" :class="[`is-${stateOf(item)}`, { 'is-cover': isCover(item, index) && !compact }]">
        <!-- Derivatives only. A 60-photo management grid never loads originals. -->
        <img
          v-if="thumbSrc(item)"
          :src="thumbSrc(item)"
          alt=""
          class="fq-media-prev__img"
          loading="lazy"
          decoding="async"
        />
        <span v-if="isCover(item, index) && !compact" class="fq-media-prev__cover">
          <span class="fq-media-prev__cover-dot" aria-hidden="true">★</span>Cover
        </span>
        <span
          v-if="compact && (stateOf(item) === 'uploading' || stateOf(item) === 'preparing')"
          class="fq-media-prev__spin"
          aria-label="Uploading"
        />
        <button
          v-if="compact && stateOf(item) === 'failed'"
          type="button"
          class="fq-media-prev__retry is-overlay"
          aria-label="Retry upload"
          @click="$emit('retry', item.localId)"
        >
          Retry
        </button>
        <span v-else-if="compact && stateOf(item) === 'ready'" class="sr-only">Ready</span>
        <p
          v-if="!compact"
          class="fq-media-prev__state"
          :class="`is-${stateOf(item)}`"
        >
          <span
            v-if="stateOf(item) === 'uploading'"
            class="fq-media-prev__spin"
            aria-hidden="true"
          />
          <template v-if="stateOf(item) === 'preparing'">Preparing</template>
          <template v-else-if="stateOf(item) === 'uploading'">Uploading</template>
          <template v-else-if="stateOf(item) === 'ready'">Ready</template>
          <template v-else>
            <span class="fq-media-prev__warn" aria-hidden="true">!</span>
            {{ item.error || 'Failed' }}
            <button
              type="button"
              class="fq-media-prev__retry"
              :aria-label="`Retry upload for photo ${index + 1}`"
              @click="$emit('retry', item.localId)"
            >
              Retry
            </button>
          </template>
        </p>
        <button
          type="button"
          class="fq-media-prev__remove"
          :aria-label="`Remove photo ${index + 1}`"
          @click="$emit('remove', item.localId)"
        >
          <span class="fq-media-prev__x" aria-hidden="true">×</span>
        </button>
      </div>
      <div v-if="!compact" class="fq-media-prev__move">
        <button
          type="button"
          class="fq-media-prev__shift"
          :disabled="index === 0"
          :aria-label="`Move photo ${index + 1} earlier`"
          @click="$emit('move', { localId: item.localId, delta: -1 })"
        >
          <span aria-hidden="true">←</span>
          <span class="sr-only">Move earlier</span>
        </button>
        <button
          v-if="cover"
          type="button"
          class="fq-media-prev__shift is-cover-action"
          :disabled="isCover(item, index) || stateOf(item) !== 'ready'"
          :aria-label="`Make photo ${index + 1} the cover`"
          @click="$emit('cover', { localId: item.localId, mediaId: item.mediaId })"
        >
          <span aria-hidden="true">★</span>
          <span class="sr-only">Make cover</span>
        </button>
        <button
          type="button"
          class="fq-media-prev__shift"
          :disabled="index === items.length - 1"
          :aria-label="`Move photo ${index + 1} later`"
          @click="$emit('move', { localId: item.localId, delta: 1 })"
        >
          <span aria-hidden="true">→</span>
          <span class="sr-only">Move later</span>
        </button>
      </div>
      <label v-if="captions && !compact && item.mediaId" class="fq-media-prev__caption">
        <span class="sr-only">{{ `Caption for photo ${index + 1}` }}</span>
        <input
          type="text"
          :maxlength="captionMax"
          :value="captionFor(item)"
          :placeholder="captionPlaceholder"
          @input="$emit('caption', { mediaId: item.mediaId, caption: $event.target.value })"
        />
      </label>
    </li>
  </ul>
</template>

<script setup>
import { FANEQO_PHOTO_CAPTION_MAX } from '~/utils/media/faneqoMedia'

const props = defineProps({
  items: { type: Array, default: () => [] },
  compact: { type: Boolean, default: true },
  /** Show the Make cover action and honour an explicit cover choice. */
  cover: { type: Boolean, default: false },
  coverMediaId: { type: [String, Number], default: null },
  /** `{ [mediaId]: caption }`. Omit to hide the per-photo caption inputs. */
  captions: { type: Object, default: null },
  captionMax: { type: Number, default: FANEQO_PHOTO_CAPTION_MAX },
  captionPlaceholder: { type: String, default: 'Caption (optional)' },
})
defineEmits(['remove', 'retry', 'move', 'cover', 'caption'])

function stateOf(item) {
  return item?.state || 'ready'
}

function itemKey(item, index) {
  if (item?.localId) return item.localId
  if (item?.mediaId != null && item.mediaId !== '') return `media:${item.mediaId}`
  return `idx:${index}`
}

/**
 * Prefer the server derivative once it exists. The local blob is the original
 * file, so keeping it on screen for 60 photos is what makes a phone stall.
 */
function thumbSrc(item) {
  return item?.thumbUrl || item?.thumbnailUrl || item?.previewUrl || null
}

function isCover(item, index) {
  const chosen = props.coverMediaId
  if (chosen != null && chosen !== '') return String(item?.mediaId ?? '') === String(chosen)
  return index === 0
}

function captionFor(item) {
  if (!props.captions || item?.mediaId == null) return ''
  return String(props.captions[String(item.mediaId)] ?? props.captions[item.mediaId] ?? '')
}
</script>

<style scoped>
.fq-media-prev {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin: 0 0 0.4rem;
  padding: 0;
  list-style: none;
}
.fq-media-prev__item {
  position: relative;
  width: 4.5rem;
}
.fq-media-prev.is-compact .fq-media-prev__item {
  width: 4.5rem;
}
.fq-media-prev__frame {
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 0.55rem;
  overflow: hidden;
  background: #0b0e14;
}
.fq-media-prev__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.fq-media-prev__cover {
  position: absolute;
  top: 0.38rem;
  left: 0.38rem;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  margin: 0;
  padding: 0.2rem 0.45rem;
  border-radius: 0.32rem;
  background: #39d5ff;
  color: #04140f;
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.04em;
  line-height: 1.2;
}
.fq-media-prev__cover-dot { font-size: 0.66rem; line-height: 1; }
/* The cover is the gallery's face. It should be unmistakable at a glance. */
.fq-media-prev__frame.is-cover {
  box-shadow: 0 0 0 2px #39d5ff;
}
.fq-media-prev__warn {
  display: grid;
  place-items: center;
  width: 0.85rem;
  height: 0.85rem;
  flex: none;
  border-radius: 999px;
  background: #fca5a5;
  color: #1b0606;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
}
.fq-media-prev__caption {
  display: block;
  margin-top: 0.3rem;
}
.fq-media-prev__caption input {
  width: 100%;
  min-height: 36px;
  padding: 0.3rem 0.45rem;
  border: 1px solid rgba(247, 249, 252, 0.12);
  border-radius: 0.45rem;
  background: #0b0e14;
  color: #f7f9fc;
  font: inherit;
  font-size: 0.74rem;
}
.fq-media-prev__caption input:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 1px;
}
.fq-media-prev__frame.is-uploading .fq-media-prev__img,
.fq-media-prev__frame.is-preparing .fq-media-prev__img {
  opacity: 0.72;
}
.fq-media-prev__frame.is-failed .fq-media-prev__img {
  opacity: 0.78;
}
.fq-media-prev__spin {
  width: 0.7rem;
  height: 0.7rem;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 99px;
  flex: none;
}
.fq-media-prev.is-compact .fq-media-prev__spin {
  position: absolute;
  right: 0.28rem;
  bottom: 0.28rem;
}
.fq-media-prev__state {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  height: 1.45rem;
  margin: 0;
  padding: 0 0.35rem;
  background: linear-gradient(180deg, transparent, rgba(5, 6, 8, 0.78));
  font-size: 0.62rem;
  font-weight: 600;
  color: rgba(247, 249, 252, 0.62);
  line-height: 1;
  white-space: nowrap;
}
.fq-media-prev__state.is-ready { color: #39d5ff; }
.fq-media-prev__state.is-failed {
  height: 2.75rem;
  color: #fca5a5;
  background: rgba(5, 6, 8, 0.72);
}
.fq-media-prev__retry {
  min-height: 2.75rem;
  min-width: 2.75rem;
  border: 0;
  background: none;
  color: #7bf1ca;
  font-weight: 650;
  cursor: pointer;
  padding: 0;
  font-size: 0.72rem;
}
.fq-media-prev__state .fq-media-prev__retry {
  min-height: 2.75rem;
  min-width: 2.75rem;
  padding: 0 0.2rem;
  font-size: 0.72rem;
}
.fq-media-prev__retry.is-overlay {
  position: absolute;
  inset: 0;
  min-width: 0;
  min-height: 0;
  background: rgba(8, 8, 10, 0.55);
  color: #f7f9fc;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.fq-media-prev__retry:focus-visible,
.fq-media-prev__shift:focus-visible,
.fq-media-prev__remove:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}
.fq-media-prev__remove {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}
.fq-media-prev__x {
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 99px;
  background: rgba(5, 6, 8, 0.78);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  font-size: 0.82rem;
  line-height: 1;
}
.fq-media-prev__move {
  display: flex;
  align-items: stretch;
  height: 2.75rem;
  margin-top: 0.1rem;
}
.fq-media-prev__shift {
  flex: 1;
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.58);
  cursor: pointer;
  font-size: 0.95rem;
}
.fq-media-prev__shift:disabled {
  opacity: 0.28;
  cursor: default;
}
.fq-media-prev__shift.is-cover-action:not(:disabled) {
  color: #39d5ff;
}
.fq-media-prev.is-composer {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  gap: 0.65rem;
}
.fq-media-prev.is-composer .fq-media-prev__item {
  display: flex;
  flex-direction: column;
  width: auto;
  min-width: 0;
}
.fq-media-prev.is-composer .fq-media-prev__frame {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 0.65rem;
}
.sr-only {
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
@media (max-width: 640px) {
  .fq-media-prev.is-composer {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fq-media-prev__spin {
    border-top-color: rgba(255, 255, 255, 0.7);
  }
}
@media (prefers-reduced-motion: no-preference) {
  .fq-media-prev__spin {
    animation: fq-media-spin 0.7s linear infinite;
  }
}
@keyframes fq-media-spin {
  to { transform: rotate(360deg); }
}
</style>
