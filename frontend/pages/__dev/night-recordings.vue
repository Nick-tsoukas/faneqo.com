<template>
  <div class="dev">
    <p class="dev__rail">Design lab · local only · Night Recordings</p>
    <NightRecordingsLabBoard />
  </div>
</template>

<script setup>
import NightRecordingsLabBoard from '@/components/labs/NightRecordingsLabBoard.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Night Recordings lab · Faneqo',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>

<style scoped>
.dev {
  min-height: 100vh;
  background: #050506;
  color: #f5f5f6;
}
.dev__rail {
  margin: 0;
  padding: 0.75rem 1.25rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}
</style>
