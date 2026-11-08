<template>
  <div />
</template>

<script setup>
/**
 * Legacy gallery viewer.
 * Old shared / Passport / management links keep working.
 * Canonical destination is /:bandSlug/gallery/:slug.
 */
import { galleryPath } from '~/utils/nights/publicNightPaths'
import { preserveSafeFromQuery } from '~/utils/nights/artistWorldReturn'

const route = useRoute()
const path = galleryPath(route.params.bandSlug, route.params.slug)
if (!path) {
  throw createError({ statusCode: 404, statusMessage: 'Gallery not found', fatal: true })
}

await navigateTo({ path, query: preserveSafeFromQuery(route.query) }, { redirectCode: 301, replace: true })
</script>
