<script setup>
/**
 * Temporary alias. Production homepage is now `/`.
 */
definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

await navigateTo('/', { redirectCode: 301, replace: true })
</script>
