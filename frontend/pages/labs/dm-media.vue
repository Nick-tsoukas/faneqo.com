<template>
  <LabsShell title="DM Media" wide>
    <DmMediaLabBoard />
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'
import DmMediaLabBoard from '@/components/labs/DmMediaLabBoard.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · DM Media',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>
