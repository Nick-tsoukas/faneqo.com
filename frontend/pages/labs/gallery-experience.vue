<template>
  <GalleryExperienceLab back-to="/labs" />
</template>

<script setup>
import GalleryExperienceLab from '~/features/gallery-experience/lab/GalleryExperienceLab.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Gallery experience',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
  ],
})
</script>
