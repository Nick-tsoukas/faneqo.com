<template>
  <article class="nh">
    <div v-if="teaser" class="nh__media">
      <img :src="teaser" :alt="title" :loading="lazy ? 'lazy' : 'eager'">
    </div>
    <div class="nh__body">
      <p v-if="eyebrow" class="nh__eyebrow">{{ eyebrow }}</p>
      <h2 class="nh__title">{{ title }}</h2>
      <p v-if="venue" class="nh__venue">{{ venue }}</p>
      <p v-if="stats" class="nh__stats">{{ stats }}</p>
      <div class="nh__actions">
        <NuxtLink :to="viewHref" class="nh__primary">
          View Night
          <span aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink :to="editHref" class="nh__quiet">Edit Night</NuxtLink>
        <NuxtLink v-if="previewHref" :to="previewHref" class="nh__quiet">Preview fan view</NuxtLink>
        <details v-if="hasMore" class="nh__more">
          <summary>More</summary>
          <div class="nh__more-list">
            <NuxtLink v-if="photosHref" :to="photosHref">Share photos</NuxtLink>
            <NuxtLink v-if="messageHref" :to="messageHref">Message attendees</NuxtLink>
          </div>
        </details>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { nightPathFromRecap } from '~/utils/nights/publicNightPaths'
import {
  nightHistoryEyebrow,
  nightHistoryStatsLine,
  nightHistoryTeaserUrl,
  nightHistoryTitle,
  nightHistoryVenue,
} from '~/utils/nights/nightHistory'
import { withSafeFrom } from '~/utils/nights/artistWorldReturn'
import { buildSharePhotosPath } from '~/utils/updates/sharePhotosFromRecap'

const props = defineProps({
  recap: { type: Object, required: true },
  bandSlug: { type: String, default: '' },
  lazy: { type: Boolean, default: true },
})

const title = computed(() => nightHistoryTitle(props.recap))
const venue = computed(() => nightHistoryVenue(props.recap))
const eyebrow = computed(() => nightHistoryEyebrow(props.recap))
const stats = computed(() => nightHistoryStatsLine(props.recap))
const teaser = computed(() => nightHistoryTeaserUrl(props.recap))
const viewHref = computed(() => `/fans/recaps/${props.recap.id}`)
const editHref = computed(() => `${viewHref.value}?edit=1`)
const previewHref = computed(() => {
  const href = nightPathFromRecap(props.recap, props.bandSlug)
  return href ? withSafeFrom(href, viewHref.value) : ''
})
const photosHref = computed(() => buildSharePhotosPath(props.recap, { from: '/fans/recaps' }))
const messageHref = computed(() => (
  Number(props.recap?.checkedInShowCount) > 0
    ? `${viewHref.value}?message=1`
    : ''
))
const hasMore = computed(() => !!(photosHref.value || messageHref.value))
</script>

<style scoped>
.nh {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 1.15rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.nh__media img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  background: #111318;
}

.nh__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.45);
}

.nh__title {
  margin: 0.35rem 0 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: #f5f5f6;
  overflow-wrap: anywhere;
}

.nh__venue,
.nh__stats {
  margin: 0.3rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: rgba(245, 245, 246, 0.58);
  overflow-wrap: anywhere;
}

.nh__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 14px;
  margin-top: 0.55rem;
}

.nh__primary,
.nh__quiet,
.nh__more summary,
.nh__more a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: 0.9375rem;
  font-weight: 550;
  text-decoration: none;
  color: rgba(245, 245, 246, 0.55);
  cursor: pointer;
}

.nh__primary {
  gap: 4px;
  color: #f5f5f6;
}

.nh__more {
  position: relative;
}

.nh__more summary {
  list-style: none;
}

.nh__more summary::-webkit-details-marker {
  display: none;
}

.nh__more-list {
  position: absolute;
  left: 0;
  bottom: 100%;
  z-index: 2;
  min-width: 12rem;
  padding: 0.35rem 0.7rem;
  background: #111318;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nh__more-list a {
  display: flex;
  width: 100%;
}

.nh__primary:focus-visible,
.nh__quiet:focus-visible,
.nh__more summary:focus-visible,
.nh__more a:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.7);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .nh {
    grid-template-columns: 220px minmax(0, 1fr);
    column-gap: 28px;
    align-items: start;
    padding: 1.35rem 0;
  }

  .nh:not(:has(.nh__media)) {
    grid-template-columns: minmax(0, 1fr);
  }

  .nh__media img {
    aspect-ratio: 4 / 3;
  }

  .nh__title {
    font-size: 1.45rem;
  }

  .nh__actions {
    justify-content: flex-start;
  }
}

@media (min-width: 1280px) {
  .nh {
    grid-template-columns: 240px minmax(0, 1fr);
  }
}
</style>
