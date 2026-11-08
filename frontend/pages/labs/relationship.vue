<template>
  <LabsShell title="Relationship" wide>
    <LabsRelationshipBoard />
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'
import LabsRelationshipBoard from '@/components/labs/LabsRelationshipBoard.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Relationship',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>
