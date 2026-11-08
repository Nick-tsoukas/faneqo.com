<script setup>
/**
 * Internal Shareables Gallery
 * Password-protected page for reviewing all card types
 * 
 * Route: /internal/shareables
 * Password: password101
 */

// No-index meta tags
useHead({
  title: 'MBQ Internal Shareables Gallery',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
  ],
})

// Add X-Robots-Tag header via route rules
definePageMeta({
  layout: false,
})
</script>

<template>
  <InternalPasswordGate>
    <InternalShareablesGallery />
  </InternalPasswordGate>
</template>
