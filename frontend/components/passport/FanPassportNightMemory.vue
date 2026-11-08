<template>
  <article class="night-mem" :class="[`is-${visualKind}`]">
    <p v-if="yearMarker" class="night-mem__year">{{ yearMarker }}</p>

    <div class="night-mem__body">
      <NuxtLink :to="href" class="night-mem__identity">
        <p v-if="kicker" class="night-mem__kicker">{{ kicker }}</p>
        <h3 class="night-mem__title">{{ title }}</h3>
        <p v-if="venue" class="night-mem__venue">{{ venue }}</p>
        <p v-if="ordinalLine" class="night-mem__ordinal">{{ ordinalLine }}</p>
        <p v-else-if="dateLine" class="night-mem__date">{{ dateLine }}</p>
        <p v-if="moment" class="night-mem__moment">{{ moment }}</p>
      </NuxtLink>

      <div v-if="visualKind === 'gallery' && primaryGallery" class="night-mem__visual is-stack">
        <FaneqoGalleryStack
          :media="primaryGallery.media"
          :title="primaryGallery.title || title"
          :count="primaryGallery.photoCount"
          size="archive"
          :priority="priority"
          @activate="openStack"
        />
        <p v-if="chapterLine" class="night-mem__chapter">{{ chapterLine }}</p>
      </div>

      <NuxtLink
        v-else-if="visualKind === 'poster' && mediaUrl"
        :to="href"
        class="night-mem__visual is-poster"
      >
        <img :src="mediaUrl" :alt="`${title} night poster`" loading="lazy">
        <p class="night-mem__artifact">Night poster</p>
      </NuxtLink>

      <NuxtLink
        v-else-if="(visualKind === 'hero' || visualKind === 'event') && mediaUrl"
        :to="href"
        class="night-mem__visual"
        :class="`is-${visualKind}`"
      >
        <img
          :src="mediaUrl"
          :alt="title"
          :loading="priority ? 'eager' : 'lazy'"
          :fetchpriority="priority ? 'high' : undefined"
        >
      </NuxtLink>

      <NuxtLink
        v-else
        :to="href"
        class="night-mem__visual is-type"
        tabindex="-1"
        aria-hidden="true"
      >
        <span v-if="keepsake.day" class="night-mem__stub-day">{{ keepsake.day }}</span>
        <span v-if="keepsake.year" class="night-mem__stub-year">{{ keepsake.year }}</span>
        <span class="night-mem__stub-place">
          <span>{{ venue || title }}</span>
          <span v-if="keepsake.place">{{ keepsake.place }}</span>
        </span>
      </NuxtLink>
    </div>

    <FaneqoMediaLightbox
      :open="lightboxOpen"
      :items="lightboxItems"
      :start-index="lightboxStart"
      :title="primaryGallery?.title || title"
      zoomable
      @close="lightboxOpen = false"
    />
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import { absolutePublicMediaUrl } from '~/utils/passport/fanPassport'
import {
  galleryChapterLine,
  passportMemoryHref,
  passportNightDate,
  passportNightKicker,
  passportNightPlace,
  passportNightTitle,
  passportNightVenue,
  passportNightVisualKind,
  primaryPassportGallery,
  yourNightOrdinalCopy,
} from '~/utils/passport/passportPresentation'

const props = defineProps({
  memory: { type: Object, required: true },
  mediaOrigin: { type: String, default: '' },
  yearMarker: { type: String, default: '' },
  moment: { type: String, default: '' },
  priority: { type: Boolean, default: false },
})

const href = computed(() => passportMemoryHref(props.memory))
const title = computed(() => passportNightTitle(props.memory))
const venue = computed(() => passportNightVenue(props.memory))
const kicker = computed(() => passportNightKicker(props.memory))
const dateLine = computed(() => passportNightDate(props.memory))
const ordinalLine = computed(() => yourNightOrdinalCopy({
  showOrdinal: props.memory?.showOrdinal ?? props.memory?.relationship?.showOrdinal,
  artistName: props.memory?.artist?.name,
}))
const visualKind = computed(() => passportNightVisualKind(props.memory))
const primaryGallery = computed(() => primaryPassportGallery(props.memory))
const chapterLine = computed(() => galleryChapterLine({
  galleryCount: props.memory?.galleryCount,
  photoCount: props.memory?.photoCount || primaryGallery.value?.photoCount,
}))
const mediaUrl = computed(() => {
  if (visualKind.value === 'gallery' || visualKind.value === 'type') return ''
  return absolutePublicMediaUrl(props.memory?.artwork?.url, props.mediaOrigin)
})
// A Night with no photographs still gets an object: its own date and room.
const keepsake = computed(() => {
  const raw = String(props.memory?.show?.date || props.memory?.checkedInAt || '')
  const day = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const parsed = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : null
  const valid = parsed && !Number.isNaN(parsed.getTime())
  return {
    day: valid ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed) : '',
    year: valid ? String(parsed.getFullYear()) : '',
    place: passportNightPlace(props.memory),
  }
})
const lightboxOpen = ref(false)
const lightboxStart = ref(0)
const lightboxItems = computed(() => primaryGallery.value?.media || [])

function openStack(payload) {
  lightboxStart.value = Number(payload?.index) || 0
  lightboxOpen.value = true
}
</script>

<style scoped>
.night-mem {
  min-width: 0;
}
.night-mem__year {
  margin: 0 0 1.1rem;
  color: rgba(247, 249, 252, 0.38);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.16em;
}
.night-mem__body {
  display: grid;
  gap: 1.15rem;
}
.night-mem__identity {
  display: grid;
  gap: 0.35rem;
  min-height: 44px;
  padding-block: 0.15rem;
  color: inherit;
  text-decoration: none;
}
.night-mem__identity:focus-visible,
.night-mem__visual:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 4px;
}
.night-mem__kicker,
.night-mem__type-kicker {
  margin: 0;
  color: rgba(247, 249, 252, 0.48);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.14em;
}
.night-mem__title {
  margin: 0;
  font-size: clamp(1.55rem, 6vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.98;
}
.night-mem__venue,
.night-mem__date {
  margin: 0;
  color: rgba(247, 249, 252, 0.55);
  font-size: 0.95rem;
  line-height: 1.4;
}
.night-mem__ordinal,
.night-mem__type-ordinal {
  margin: 0.2rem 0 0;
  color: #7ee7ff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.night-mem__moment {
  margin: 0.1rem 0 0;
  color: rgba(247, 249, 252, 0.62);
  font-size: 0.86rem;
  font-weight: 500;
}
.night-mem__visual {
  display: block;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}
.night-mem__visual.is-stack {
  width: min(100%, 22rem);
}
.night-mem__visual.is-hero img,
.night-mem__visual.is-event img {
  display: block;
  width: min(100%, 22rem);
  height: auto;
  max-height: 28rem;
  object-fit: contain;
  background: #050608;
}
.night-mem__visual.is-poster {
  width: min(100%, 14rem);
}
.night-mem__visual.is-poster img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  background: #0b0e14;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}
.night-mem__artifact,
.night-mem__chapter {
  margin: 0.65rem 0 0;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.72rem;
  font-weight: 600;
}
.night-mem.is-type .night-mem__title {
  font-size: clamp(1.9rem, 7vw, 3rem);
}
.night-mem__visual.is-type {
  display: none;
}
@media (min-width: 1024px) {
  .night-mem__visual.is-type {
    display: grid;
    grid-template-rows: auto auto 1fr;
    width: min(100%, 17rem);
    aspect-ratio: 4 / 5;
    padding: 1.4rem 1.4rem 1.25rem;
    border: 1px solid rgba(247, 249, 252, 0.14);
    background:
      radial-gradient(120% 80% at 0% 0%, rgba(126, 231, 255, 0.07), transparent 60%),
      #080a0f;
  }
  .night-mem__stub-day {
    color: #f7f9fc;
    font-size: 3.1rem;
    font-weight: 800;
    letter-spacing: -0.06em;
    line-height: 0.95;
  }
  .night-mem__stub-year {
    margin-top: 0.35rem;
    color: rgba(247, 249, 252, 0.42);
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .night-mem__stub-place {
    align-self: end;
    display: grid;
    gap: 0.2rem;
    padding-top: 0.9rem;
    border-top: 1px dashed rgba(247, 249, 252, 0.18);
    color: rgba(247, 249, 252, 0.72);
    font-size: 0.86rem;
    line-height: 1.35;
  }
  .night-mem__stub-place span + span { color: rgba(247, 249, 252, 0.45); }
  .night-mem__body {
    grid-template-columns: minmax(16rem, 1fr) minmax(16rem, 22rem);
    gap: 2rem 3rem;
    align-items: start;
  }
  .night-mem__visual {
    order: 2;
  }
}
</style>
