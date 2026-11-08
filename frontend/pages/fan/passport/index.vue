<template>
  <main class="passport-page">
    <FanPassportHome />
  </main>
</template>

<script setup>
import FanPassportHome from '~/components/passport/FanPassportHome.vue'

definePageMeta({
  layout: 'default',
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Passport',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>

<style scoped>
.passport-page { min-height: 100dvh; background: #050608; }
</style>
