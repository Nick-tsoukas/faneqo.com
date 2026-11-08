<template>
  <PublicGalleryExperience
    v-if="payload"
    :payload="payload"
    band-slug="therockers"
    :from="from"
    :return-to="returnTo"
  />
</template>

<script setup>
import { computed } from 'vue'
import PublicGalleryExperience from '~/components/nights/PublicGalleryExperience.vue'
import { galleryArchiveFixtureBySlug } from '~/config/galleryArchiveLab.js'

definePageMeta({
  layout: 'artist-world',
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const item = galleryArchiveFixtureBySlug(route.params.gallerySlug)
if (!item) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const from = computed(() => route.query.from || '/__dev/galleries-archive')
const returnTo = computed(() => route.fullPath)

const payload = {
  gallery: {
    title: item.title,
    caption: '',
    photoCount: Array.isArray(item.media) ? item.media.length : 0,
    visibility: item.visibility,
    locked: false,
    media: item.media || [],
  },
  night: item.show
    ? {
      nightSlug: 'lab-night',
      venue: item.show.venue,
      city: item.show.city,
      date: item.show.date,
    }
    : null,
  artist: {
    name: 'The Rockers',
    slug: 'therockers',
  },
  viewer: {},
  share: {
    canonicalPath: `/therockers/gallery/${item.slug}`,
  },
}

useHead({
  title: `${item.title} · Faneqo`,
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})
</script>
