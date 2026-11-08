<template>
  <LabsPlaceholderPage
    title="External Intelligence"
    body="External provider ingestion not implemented. Feature key only."
  />
</template>

<script setup>
import LabsPlaceholderPage from '@/components/labs/LabsPlaceholderPage.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · External',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
