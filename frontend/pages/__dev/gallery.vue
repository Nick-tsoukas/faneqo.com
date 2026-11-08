<template>
  <div class="dev-gallery">
    <p class="dev-gallery__rail">Design lab · local only · 05B.3 gallery</p>
    <GalleryLabBoard />
  </div>
</template>

<script setup>
import GalleryLabBoard from '@/components/labs/GalleryLabBoard.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Gallery lab · Faneqo',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
  ],
})
</script>

<style scoped>
.dev-gallery {
  min-height: 100vh;
  background: #050608;
  color: #f7f9fc;
  padding: 1.25rem 1.1rem 3rem;
}
.dev-gallery__rail {
  margin: 0 0 1.25rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
</style>
