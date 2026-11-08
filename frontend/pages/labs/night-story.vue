<template>
  <LabsShell title="Night Story" wide>
    <NightStoryLabBoard />
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'
import NightStoryLabBoard from '@/components/labs/NightStoryLabBoard.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Night Story',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>
