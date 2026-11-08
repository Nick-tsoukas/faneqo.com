<template>
  <LabsShell title="Night Recordings" wide>
    <NightRecordingsLabBoard />
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'
import NightRecordingsLabBoard from '@/components/labs/NightRecordingsLabBoard.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Night Recordings',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>
