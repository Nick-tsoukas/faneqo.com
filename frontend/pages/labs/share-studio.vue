<template>
  <LabsPlaceholderPage
    title="Share Studio"
    body="Share Studio UI is not implemented. No snapshots or renders."
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
  title: 'Labs · Share Studio',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
