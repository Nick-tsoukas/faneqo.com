<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const bandSlug = computed(() => route.params.bandSlug as string)

// Fetch band data on server for OG tags
const { data: bandData } = await useAsyncData(
  `share-band-${bandSlug.value}`,
  async () => {
    const strapiUrl = config.public.strapiUrl || 'http://localhost:1337'
    try {
      const res = await fetch(
        `${strapiUrl}/api/bands?filters[slug][$eq]=${bandSlug.value}&populate=bandImg`
      )
      const json = await res.json()
      return json.data?.[0] || null
    } catch (err) {
      console.error('[share/band] Failed to fetch band:', err)
      return null
    }
  }
)

const bandName = computed(() => bandData.value?.name || bandData.value?.attributes?.name || bandSlug.value)
const bandDescription = computed(() => bandData.value?.description || bandData.value?.attributes?.description || 'Scan • Listen • Follow')
const bandImageUrl = computed(() => bandData.value?.bandImg?.url || bandData.value?.attributes?.bandImg?.data?.attributes?.url || null)
const updatedAt = computed(() => bandData.value?.updatedAt || bandData.value?.attributes?.updatedAt || '')
// Stable version (last update); never the request time, so previews cache.
const cacheVersion = computed(() => updatedAt.value ? new Date(updatedAt.value).getTime() : null)

const siteUrl = 'https://faneqo.com'
const ogImageUrl = computed(() => `${siteUrl}/api/og/band/${bandSlug.value}.png${cacheVersion.value ? `?v=${cacheVersion.value}` : ''}`)
const canonicalUrl = computed(() => `${siteUrl}/share/band/${bandSlug.value}`)

// Set OG meta tags (SSR) - use functions for reactivity
useHead(() => ({
  title: bandName.value,
  meta: [
    { name: 'description', content: bandDescription.value },
    { property: 'og:title', content: bandName.value },
    { property: 'og:description', content: bandDescription.value },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonicalUrl.value },
    { property: 'og:image', content: ogImageUrl.value },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: bandName.value },
    { name: 'twitter:description', content: bandDescription.value },
    { name: 'twitter:image', content: ogImageUrl.value },
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))

// Redirect humans to the actual band page (client-side only)
onMounted(() => {
  setTimeout(() => {
    router.replace(`/${bandSlug.value}`)
  }, 200)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#0f0f0f] to-[#0a1a1a] flex items-center justify-center">
    <div class="text-center text-white">
      <h1 class="text-3xl font-bold mb-4">{{ bandName }}</h1>
      <p class="text-zinc-400">Opening...</p>
    </div>
  </div>
</template>
