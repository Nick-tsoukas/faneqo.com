<template>
  <article
    class="njp"
    :class="[`is-${scale}`, `is-role-${role}`, { 'is-blank': blank }]"
    :style="{ '--njp-ratio': printRatio }"
  >
    <!--
      A Gallery with no photographs never gets a large empty rectangle. It gets
      a small waiting slot, and the type carries it.
    -->
    <button
      v-if="blank"
      type="button"
      class="njp__blank"
      :aria-label="`Open ${title}`"
      @click="emit('open', item, { index: 0 })"
    >
      <span>Waiting for photographs</span>
    </button>
    <FaneqoGalleryStack
      v-else
      :media="item.media || []"
      :title="title"
      :count="photoCount"
      :size="scale === 'sm' ? 'compact' : 'archive'"
      :priority="priority"
      :transition-key="item.id"
      @activate="emit('open', item, $event)"
    />
    <!--
      One caption grammar at every plate scale: state above the name, then the
      name, then the facts. The state never joins the run of facts and never
      pushes the Gallery's own title below them.
    -->
    <div class="njp__label">
      <p v-if="draft" class="njp__state">Draft</p>
      <div class="njp__line">
        <h3 class="njp__title">{{ title }}</h3>
        <p v-if="meta" class="njp__meta">{{ meta }}</p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import {
  archiveVisibilityLabel,
  galleryPhotoCount,
  galleryTitle,
  isDraftGallery,
} from '~/utils/galleries/archiveShelves'
import { mediaPreviewLabel } from '~/utils/media/faneqoMedia'
import { stackPrintRatio } from '~/utils/media/faneqoGalleryStack'
import { plateScale } from './nightJournal.js'

const props = defineProps({
  item: { type: Object, required: true },
  role: { type: String, default: 'support' },
  priority: { type: Boolean, default: false },
})

const emit = defineEmits(['open'])

const scale = computed(() => (props.role === 'general' ? 'sm' : plateScale(props.role)))
const title = computed(() => galleryTitle(props.item))
const photoCount = computed(() => galleryPhotoCount(props.item))
const blank = computed(() => photoCount.value === 0 && !(props.item?.media || []).length)
const draft = computed(() => isDraftGallery(props.item))
/* The print's own shape, read the way the Stack reads it. Drives lead scale. */
const printRatio = computed(() => String(stackPrintRatio((props.item?.media || [])[0])))
/* A count of one still deserves its numeral; the shared label drops it. */
const countLabel = computed(() => (photoCount.value === 1 ? '1 photo' : mediaPreviewLabel(photoCount.value)))
/*
 * A waiting slot has no count, so its caption would be the only one on the
 * page without a second line. Who it is for is the one fact it does have.
 */
const meta = computed(() => {
  if (blank.value) return archiveVisibilityLabel(props.item?.visibility, { quietPublic: false })
  return [countLabel.value, archiveVisibilityLabel(props.item?.visibility)].filter(Boolean).join(' · ')
})
</script>

<style scoped>
/*
 * The photograph is the object. The label is an annotation printed under it,
 * separated by one hairline — the only chrome a print gets.
 */
.njp {
  --njp-inset: 1.05rem;
  min-width: 0;
}
.njp.is-sm {
  --njp-inset: 0.55rem;
}

.njp__label {
  margin: -0.35rem 0 0;
  padding: 0.6rem var(--njp-inset) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
  transition: border-color 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.njp__line {
  min-width: 0;
}
/*
 * Unpublished is a state, not another fact. It reads before the title and
 * never sits in the same gray run as the audience.
 */
.njp__state {
  margin: 0 0 0.16rem;
  color: rgba(245, 245, 246, 0.82);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.njp__title {
  margin: 0;
  min-width: 0;
  color: #f5f5f6;
  font-weight: 560;
  letter-spacing: -0.022em;
  line-height: 1.25;
  overflow-wrap: anywhere;
  transition: color 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.njp__meta {
  margin: 0.22rem 0 0;
  color: rgba(245, 245, 246, 0.4);
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
}

/* Lead prints get the title and the count on one printed line. */
.njp.is-xl .njp__line,
.njp.is-lg .njp__line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1.1rem;
}
.njp.is-xl .njp__meta,
.njp.is-lg .njp__meta {
  flex-shrink: 0;
  margin: 0;
  text-align: right;
  white-space: nowrap;
}
.njp.is-xl .njp__title {
  font-size: clamp(1.15rem, 3.4vw, 1.45rem);
}
/* The solo plate keeps the full measure; only the photograph is capped. */
.njp.is-xl :deep(.fq-gstack) {
  max-width: 34rem;
}
/*
 * A lead print is scaled by height, not by the columns a remainder left over,
 * so it stays the largest photograph in its chapter whatever ratio the artist
 * shot. Its annotation still runs the whole measure.
 */
.njp.is-role-lead :deep(.fq-gstack) {
  max-width: min(100%, calc(var(--njp-ratio, 1) * var(--njp-hero, 200rem)));
}
/*
 * A support that had to take a full row to close it prints small — the same
 * move as the solo plate, and the reason it still reads as a support.
 */
.njp.is-role-support :deep(.fq-gstack) {
  max-width: var(--njp-cap, 100%);
}
.njp.is-lg .njp__title {
  font-size: clamp(1.02rem, 2.8vw, 1.14rem);
}
.njp.is-xl .njp__meta {
  font-size: 0.82rem;
}

/* Support prints read as a contact sheet: caption above, facts under it. */
.njp.is-sm .njp__title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 0.9rem;
}
.njp.is-sm .njp__label {
  border-top-color: rgba(255, 255, 255, 0.07);
}

/* ---- waiting slot ---- */

.njp.is-blank {
  /* The chapter reads this cap, so a waiting slot never claims a lead print. */
  --njp-max: 21rem;
  max-width: 21rem;
  padding: 0 var(--njp-inset);
}
.njp.is-blank .njp__label {
  margin-top: 0.75rem;
  padding-inline: 0;
  border-top-color: rgba(255, 255, 255, 0.07);
}
.njp__blank {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 3 / 2;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 2px;
  background: transparent;
  color: rgba(245, 245, 246, 0.36);
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: border-color 180ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.njp__blank:hover {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(245, 245, 246, 0.6);
}
.njp__blank:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
  .njp:hover .njp__label,
  .njp:focus-within .njp__label {
    border-top-color: rgba(255, 255, 255, 0.3);
  }
  .njp:hover .njp__title,
  .njp:focus-within .njp__title {
    color: #ffffff;
  }
}

@media (min-width: 1600px) {
  .njp.is-xl :deep(.fq-gstack) {
    max-width: 40rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .njp__label,
  .njp__title,
  .njp__blank {
    transition: none;
  }
}
</style>
