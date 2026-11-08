<template>
  <LabsPlaceholderPage
    title="Signals"
    body="Signals backend begins Phase 08."
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
  title: 'Labs · Signals',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
