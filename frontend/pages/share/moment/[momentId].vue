<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const momentId = computed(() => route.params.momentId as string)

// Fetch moment data on server for OG tags
const { data: momentData } = await useAsyncData(
  `share-moment-${momentId.value}`,
  async () => {
    const strapiUrl = config.public.strapiUrl || 'http://localhost:1337'
    try {
      const res = await fetch(
        `${strapiUrl}/api/fan-moments/${momentId.value}?populate=band.bandImg`
      )
      const json = await res.json()
      return json.data || null
    } catch (err) {
      console.error('[share/moment] Failed to fetch moment:', err)
      return null
    }
  }
)

const shareTitle = computed(() => momentData.value?.shareTitle || momentData.value?.attributes?.shareTitle || 'Fan Moment')
const shareText = computed(() => {
  const text = momentData.value?.shareText || momentData.value?.attributes?.shareText || ''
  return text.length > 150 ? text.substring(0, 147) + '...' : text
})
const band = computed(() => momentData.value?.band || momentData.value?.attributes?.band?.data || null)
const bandSlug = computed(() => band.value?.slug || band.value?.attributes?.slug || '')
const bandName = computed(() => band.value?.name || band.value?.attributes?.name || 'Artist')
const updatedAt = computed(() => momentData.value?.updatedAt || momentData.value?.attributes?.updatedAt || '')
const cacheVersion = computed(() => updatedAt.value ? new Date(updatedAt.value).getTime() : Date.now())

const siteUrl = 'https://musicbizqr.com'
const ogImageUrl = computed(() => `${siteUrl}/api/og/moment/${momentId.value}.png?v=${cacheVersion.value}`)
const canonicalUrl = computed(() => `${siteUrl}/share/moment/${momentId.value}`)

// Set OG meta tags (SSR) - use functions for reactivity
useHead(() => ({
  title: shareTitle.value,
  meta: [
    { name: 'description', content: shareText.value || `${bandName.value} via Faneqo` },
    { property: 'og:title', content: shareTitle.value },
    { property: 'og:description', content: shareText.value || `${bandName.value} via Faneqo` },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonicalUrl.value },
    { property: 'og:image', content: ogImageUrl.value },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: shareTitle.value },
    { name: 'twitter:description', content: shareText.value || `${bandName.value} via Faneqo` },
    { name: 'twitter:image', content: ogImageUrl.value },
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
}))

// Redirect humans to the band page (client-side only)
onMounted(() => {
  setTimeout(() => {
    if (bandSlug.value) {
      router.replace(`/${bandSlug.value}`)
    } else {
      router.replace('/')
    }
  }, 200)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#0f0f0f] to-[#0a1a1a] flex items-center justify-center">
    <div class="text-center text-white">
      <h1 class="text-3xl font-bold mb-4">{{ shareTitle }}</h1>
      <p class="text-zinc-400">Opening...</p>
    </div>
  </div>
</template>
