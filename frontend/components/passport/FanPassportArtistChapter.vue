<template>
  <section class="chapter" :aria-labelledby="headingId">
    <header class="chapter__head">
      <h2 :id="headingId" class="chapter__sr">{{ artistName }}</h2>
      <ArtistWorldIdentity
        :name="artistName"
        :to="artistPath || undefined"
        :image="artistImage"
        size="page"
      >
        <p v-if="relationshipLine" class="chapter__together">{{ relationshipLine }}</p>
        <p v-else-if="chapter.savedOnly" class="chapter__together">Galleries you kept</p>
        <p v-if="chapter.cityLine" class="chapter__cities">{{ chapter.cityLine }}</p>
      </ArtistWorldIdentity>
      <NuxtLink v-if="artistPath" :to="artistPath" class="chapter__artist">
        View {{ artistName }} →
      </NuxtLink>
    </header>

    <ol v-if="entries.length" class="chapter__nights">
      <li v-for="entry in entries" :key="entry.memory.id || entry.memory.path">
        <FanPassportNightMemory
          :memory="entry.memory"
          :media-origin="mediaOrigin"
          :year-marker="entry.yearMarker"
          :moment="momentFor(entry.memory)"
          :priority="priority && entry === entries[0]"
        />
      </li>
    </ol>

    <section
      v-if="savedGalleries.length"
      class="chapter__saved"
      :class="{ 'is-only': !entries.length }"
      :aria-labelledby="`${headingId}-saved`"
    >
      <h3 :id="`${headingId}-saved`" class="chapter__saved-head">
        {{ entries.length ? 'Also saved' : 'Saved galleries' }}
      </h3>
      <ul class="chapter__saved-list">
        <li v-for="gallery in savedGalleries" :key="gallery.id">
          <FanPassportSavedGallery :entry="gallery" />
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ArtistWorldIdentity from '~/components/nights/ArtistWorldIdentity.vue'
import FanPassportNightMemory from '~/components/passport/FanPassportNightMemory.vue'
import FanPassportSavedGallery from '~/components/passport/FanPassportSavedGallery.vue'
import { absolutePublicMediaUrl } from '~/utils/passport/fanPassport'
import { memoryKey, withYearMarkers } from '~/utils/passport/passportPresentation'

const props = defineProps({
  chapter: { type: Object, required: true },
  mediaOrigin: { type: String, default: '' },
  priority: { type: Boolean, default: false },
})

const artistName = computed(() => String(props.chapter?.artist?.name || 'Artist').trim())
const artistPath = computed(() => String(props.chapter?.artistPath || '').trim())
const artistImage = computed(() =>
  absolutePublicMediaUrl(props.chapter?.artist?.imageUrl, props.mediaOrigin)
)
const headingId = computed(() => `passport-artist-${props.chapter?.key || 'unknown'}`.replace(/[^a-zA-Z0-9_-]/g, '-'))
const entries = computed(() => withYearMarkers(props.chapter?.memories, props.chapter?.showYearMarkers))
const savedGalleries = computed(() => props.chapter?.savedGalleries || [])
const relationshipLine = computed(() => (
  [props.chapter?.togetherLine, props.chapter?.sinceLine].filter(Boolean).join(' · ')
))

function momentFor(memory) {
  const moments = props.chapter?.moments
  return moments instanceof Map ? moments.get(memoryKey(memory)) || '' : ''
}
</script>

<style scoped>
.chapter {
  position: relative;
  min-width: 0;
  padding-top: clamp(2.2rem, 6vw, 3.6rem);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.chapter__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.85rem 1.6rem;
  margin-bottom: clamp(1.5rem, 4vw, 2.4rem);
}
.chapter__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.chapter__together {
  margin: 0.35rem 0 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 0.92rem;
}
.chapter__cities {
  margin: 0.2rem 0 0;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.82rem;
}
.chapter__artist {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgba(247, 249, 252, 0.5);
  font-size: 0.82rem;
  text-decoration: none;
}
.chapter__artist:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
.chapter__nights {
  list-style: none;
  display: grid;
  gap: clamp(2.4rem, 7vw, 4rem);
  margin: 0;
  padding: 0;
}
.chapter__saved {
  margin-top: clamp(2.4rem, 7vw, 3.6rem);
}
.chapter__saved.is-only { margin-top: 0; }
.chapter__saved.is-only .chapter__saved-head {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.chapter__saved-head {
  margin: 0 0 1rem;
  color: rgba(247, 249, 252, 0.48);
  font-size: 0.82rem;
  font-weight: 600;
}
.chapter__saved-list {
  list-style: none;
  display: grid;
  gap: 1.1rem 2rem;
  margin: 0;
  padding: 0;
}
@media (min-width: 720px) {
  .chapter__saved-list { grid-template-columns: repeat(2, minmax(0, 22rem)); }
}
</style>
