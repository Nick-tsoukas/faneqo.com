<template>
  <LabsShell title="Share Photos" wide>
    <SharePhotosLabBoard />
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'
import SharePhotosLabBoard from '@/components/labs/SharePhotosLabBoard.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Share Photos',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>
