<template>
  <main class="min-h-screen bg-black px-4 py-8 sm:px-6">
    <div class="mx-auto w-full max-w-xl space-y-6">
      <header class="space-y-2">
        <p class="text-xs uppercase tracking-[0.18em] text-white/40">Local preview</p>
        <h1 class="text-2xl font-semibold text-white">Artist image framing</h1>
        <p class="text-sm text-white/55">
          Fixture-only. Create and edit use this same editor. Framing is not written to Strapi from here.
        </p>
      </header>

      <BandsFaneqoArtistImageEditor
        :image-url="imageUrl"
        :image-width="imageWidth"
        :image-height="imageHeight"
        :artist-name="artistName"
        v-model:phone="phone"
        v-model:desktop="desktop"
      />

      <p class="text-xs text-white/40 tabular-nums">
        Phone {{ phone.fit }} · X {{ phone.positionX }} · Y {{ phone.positionY }} · Zoom {{ phone.zoom }}
        <br />
        Desktop {{ desktop.fit }} · X {{ desktop.positionX }} · Y {{ desktop.positionY }} · Zoom {{ desktop.zoom }}
      </p>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import {
  FANEQO_TEST_BAND_HERO_HEIGHT,
  FANEQO_TEST_BAND_HERO_URL,
  FANEQO_TEST_BAND_HERO_WIDTH,
} from '@/utils/dev/faneqoTestBand'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

const artistName = 'Faneqo Test Band'
const imageUrl = FANEQO_TEST_BAND_HERO_URL
const imageWidth = FANEQO_TEST_BAND_HERO_WIDTH
const imageHeight = FANEQO_TEST_BAND_HERO_HEIGHT
const phone = ref({ fit: 'fill', positionX: 48, positionY: 22, zoom: 1.06 })
const desktop = ref({ fit: 'fill', positionX: 50, positionY: 50, zoom: 1 })
</script>
