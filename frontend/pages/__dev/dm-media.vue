<template>
  <div class="dev-dm">
    <p class="dev-dm__rail">Design lab · local only · 05B.6 DM media</p>
    <DmMediaLabBoard />
  </div>
</template>

<script setup>
import DmMediaLabBoard from '@/components/labs/DmMediaLabBoard.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'DM media lab · Faneqo',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
  ],
})
</script>

<style scoped>
.dev-dm {
  min-height: 100vh;
  background: #050608;
  color: #f7f9fc;
  padding: 1.25rem 1.1rem 3rem;
}
.dev-dm__rail {
  margin: 0 0 1.25rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
</style>
