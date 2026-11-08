<template>
  <CanonicalGalleryLab :state="state" :hidden="hidden" />
</template>

<script setup>
import CanonicalGalleryLab from '~/features/gallery-experience/canonical/lab/CanonicalGalleryLab.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const state = computed(() => String(route.query.state || '12'))
/** `?bare=1` removes the harness so a capture shows only the product. */
const hidden = computed(() => route.query.bare === '1')

useHead({
  title: 'Canonical gallery · Faneqo',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
  ],
})
</script>
