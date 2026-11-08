<template>
  <main class="dev-archive" :class="{ 'is-scroll-proof': scrollProof }">
    <p class="dev-archive__rail">Design lab · local only · gallery archive</p>
    <FaneqoGalleryArchive
      :items="items"
      band-slug="therockers"
      artist-name="The Rockers"
      :can-create="variant !== 'auth'"
      :loading="variant === 'loading'"
      :error="variant === 'error'"
      created-id=""
      open-base="/__dev/gallery-open"
      open-from="/__dev/galleries-archive"
    />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import FaneqoGalleryArchive from '~/components/galleries/FaneqoGalleryArchive.vue'
import { galleryArchiveFixtures } from '~/config/galleryArchiveLab.js'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Gallery archive lab · Faneqo',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})

const route = useRoute()
const variant = computed(() => String(route.query.state || 'full'))
const scrollProof = computed(() => String(route.query.scroll || '') === '1')
const items = computed(() => {
  if (variant.value === 'loading' || variant.value === 'error' || variant.value === 'auth') return []
  return galleryArchiveFixtures(variant.value)
})

onMounted(() => {
  document.documentElement.classList.add('fq-archive-lab')
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('fq-archive-lab')
})
</script>

<style>
html.fq-archive-lab,
html.fq-archive-lab body {
  height: auto !important;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto !important;
}
</style>

<style scoped>
.dev-archive {
  min-height: 100dvh;
  background: #050506;
  color: #f5f5f6;
}
.dev-archive.is-scroll-proof {
  min-height: 2400px;
  padding-bottom: 80vh;
}
.dev-archive__rail {
  margin: 0;
  padding: 0.7rem 1.1rem 0;
  color: rgba(245, 245, 246, 0.34);
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.dev-archive :deep(.fq-garch) {
  padding-top: 1.15rem;
}
</style>
