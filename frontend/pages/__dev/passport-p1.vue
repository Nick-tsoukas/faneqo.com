<template>
  <main class="preview">
    <h1>Passport P1 owner preview</h1>
    <p class="preview__note">Fixture-only. Authenticated Passport never uses these rows.</p>

    <section>
      <h2>Attendance-only + show cover</h2>
      <FanPassportMemoryCard :memory="coverMemory" />
    </section>
    <section>
      <h2>Attendance-only, no cover</h2>
      <FanPassportMemoryCard :memory="artistMemory" />
    </section>
    <section>
      <h2>Gallery enrichment</h2>
      <FanPassportMemoryCard :memory="galleryMemory" />
    </section>
    <section>
      <h2>Empty state copy</h2>
      <div class="preview__empty">
        <p class="mark">✦</p>
        <h3>Your nights will live here.</h3>
        <p>Check in at a show using Faneqo and it becomes part of your Passport.</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import FanPassportMemoryCard from '~/components/passport/FanPassportMemoryCard.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

const coverMemory = {
  id: 1,
  path: '/fan/passport/nights/1',
  artist: { name: 'Badflower' },
  show: { venue: 'The Basement East', city: 'Nashville', region: 'TN', date: '2026-10-18' },
  artwork: { url: null, source: 'show_cover' },
  galleryCount: 0,
  galleries: [],
}
const artistMemory = {
  id: 2,
  path: '/fan/passport/nights/2',
  artist: { name: 'Badflower', imageUrl: 'https://picsum.photos/id/1015/1200/800' },
  show: { venue: 'The Mill & Mine', city: 'Knoxville', region: 'TN', date: '2026-10-20' },
  artwork: { url: 'https://picsum.photos/id/1015/1200/800', source: 'artist' },
  galleryCount: 0,
  galleries: [],
}
const galleryMemory = {
  id: 3,
  path: '/fan/passport/nights/3',
  artist: { name: 'Badflower' },
  show: { venue: 'The Basement East', city: 'Nashville', region: 'TN', date: '2026-10-18' },
  artwork: { url: null, source: 'show_cover' },
  galleryCount: 8,
  galleries: [{ preview: { url: null } }],
}
</script>

<style scoped>
.preview {
  min-height: 100dvh;
  max-width: 26rem;
  margin: 0 auto;
  padding: 1.5rem 1.1rem 4rem;
  background: #050608;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.preview h1 { font-size: 1.4rem; letter-spacing: -0.04em; }
.preview__note,
.preview h2 { color: rgba(247, 249, 252, 0.48); font-size: 0.8rem; }
.preview section { margin-top: 2rem; }
.preview__empty { text-align: center; padding: 2rem 1rem; }
.preview__empty .mark { color: #39d5ff; font-size: 2rem; }
.preview__empty h3 { margin: 0; font-size: 1.4rem; letter-spacing: -0.03em; }
.preview__empty p { color: rgba(247, 249, 252, 0.55); }
</style>
