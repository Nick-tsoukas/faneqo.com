<template>
  <LabsShell title="Moments">
    <p class="moments-note">
      Durable Moments are a sparse history index, not a public product yet.
      Prove artist × fan progression at
      <NuxtLink to="/labs/relationship">/labs/relationship</NuxtLink>.
      This is not Passport.
    </p>
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Moments',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<style scoped>
.moments-note {
  max-width: 36rem;
  color: #9aa6b5;
  line-height: 1.55;
}
.moments-note a {
  color: #f7f9fc;
}
</style>
