<template>
  <div class="dev-night">
    <p class="dev-night__rail">Design lab · local only · 05B.4 Night Story</p>
    <NightStoryLabBoard />
  </div>
</template>

<script setup>
import NightStoryLabBoard from '@/components/labs/NightStoryLabBoard.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Night Story lab · Faneqo',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
  ],
})
</script>

<style scoped>
.dev-night {
  min-height: 100vh;
  background: #050608;
  color: #f7f9fc;
  padding: 1.25rem 1.1rem 3rem;
}
.dev-night__rail {
  margin: 0 0 1.25rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
</style>
