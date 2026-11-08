<template>
  <section
    v-if="showSection"
    class="v2-proof"
    aria-label="Real Faneqo artists"
  >
    <div class="v2-proof__sheet">
      <NuxtLink
        v-for="(artist, index) in faces"
        :key="artist.slug || index"
        :to="artist.slug ? `/${artist.slug}` : '/home-v2'"
        class="v2-proof__face"
        :class="`is-${index}`"
      >
        <img
          v-if="artist.image"
          :src="artist.image"
          :alt="artist.name"
          :style="{ objectPosition: artist.pos || '50% 30%' }"
          loading="lazy"
        >
        <span>{{ artist.name }}</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useHomepageShowcaseArtists } from '~/composables/useHomepageDemoArtist'
import { HOME_V2_STORY_DEMO } from '~/utils/home-v2/relationshipStoryData.js'

const PROOF_SLUGS = ['moondough', 'emerge', 'andydarling', 'shannontehya', 'ashesfall']

const { showcaseArtists } = useHomepageShowcaseArtists(PROOF_SLUGS)

const memoryPhotos = HOME_V2_STORY_DEMO.remember.photos

const faces = computed(() => {
  const live = (showcaseArtists.value || [])
    .map((artist, index) => ({
      slug: artist.slug,
      name: artist.name,
      image: artist.heroImage || memoryPhotos[index % memoryPhotos.length]?.src,
      pos: artist.heroObjectPosition || memoryPhotos[index % memoryPhotos.length]?.pos,
    }))
    .filter((artist) => artist.image)
  if (live.length) return live.slice(0, 6)
  return memoryPhotos.map((photo) => ({
    slug: '',
    name: '',
    image: photo.src,
    pos: photo.pos,
  }))
})

const showSection = computed(() => faces.value.length > 0)
</script>

<style scoped>
.v2-proof {
  position: relative;
  z-index: 10;
  padding: 0.25rem 0 2.8rem;
  background: #050506;
}

.v2-proof__sheet {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 0.16rem;
}

.v2-proof__face {
  position: relative;
  display: block;
  overflow: hidden;
  min-height: 9rem;
  background: #111217;
  color: #fff;
}

.v2-proof__face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v2-proof__face::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 42%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72), transparent);
  pointer-events: none;
}

.v2-proof__face span {
  position: absolute;
  right: 0.65rem;
  bottom: 0.5rem;
  left: 0.65rem;
  z-index: 1;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.v2-proof__face.is-0 {
  grid-column: 1 / -1;
  min-height: 15.5rem;
  aspect-ratio: 16 / 10;
}

.v2-proof__face.is-0 span {
  font-size: 0.95rem;
}

.v2-proof__face.is-1,
.v2-proof__face.is-2 {
  min-height: 11.5rem;
  aspect-ratio: 4 / 5;
}

.v2-proof__face.is-3 {
  grid-column: 1 / -1;
  min-height: 8.5rem;
  aspect-ratio: 2.2 / 1;
}

.v2-proof__face.is-4 {
  grid-column: 1 / -1;
  min-height: 10rem;
  aspect-ratio: 16 / 9;
}

.v2-proof__face.is-5 {
  display: none;
}

@media (min-width: 1024px) {
  .v2-proof {
    padding: 0.35rem 1.5rem 3.2rem;
  }

  .v2-proof__sheet {
    width: min(100%, 1180px);
    margin-inline: auto;
    grid-template-columns: 1.45fr 0.85fr 1fr;
    gap: 0.18rem;
  }

  .v2-proof__face.is-0 {
    grid-column: 1 / 3;
    grid-row: 1 / 3;
    min-height: 28rem;
    aspect-ratio: auto;
  }

  .v2-proof__face.is-1 {
    grid-column: 3;
    grid-row: 1;
    min-height: 13.5rem;
  }

  .v2-proof__face.is-2 {
    grid-column: 3;
    grid-row: 2;
    min-height: 14rem;
  }

  .v2-proof__face.is-3 {
    grid-column: 1;
    grid-row: 3;
    min-height: 12rem;
    aspect-ratio: auto;
  }

  .v2-proof__face.is-4 {
    grid-column: 2 / 4;
    grid-row: 3;
    min-height: 12rem;
  }

  .v2-proof__face.is-5 {
    display: none;
  }
}
</style>
