<template>
  <LabsShell title="Gallery Design Lab" wide>
    <GalleryLabBoard />
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'
import GalleryLabBoard from '@/components/labs/GalleryLabBoard.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Gallery',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>
