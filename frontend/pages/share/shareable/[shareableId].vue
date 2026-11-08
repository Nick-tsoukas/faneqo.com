<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// Parse shareable ID and extract params from query
const shareableId = computed(() => route.params.shareableId as string)
const query = route.query

// Extract card data from query params
const bandId = computed(() => query.bandId as string || '')
const bandSlug = computed(() => query.bandSlug as string || '')
const cardType = computed(() => query.type as string || 'MILESTONE_DROP')
const hero = computed(() => decodeURIComponent(query.hero as string || ''))
const headline = computed(() => decodeURIComponent(query.headline as string || ''))
const proof = computed(() => decodeURIComponent(query.proof as string || ''))
const accent = computed(() => query.accent as string || 'violet')

// Fetch band data on server for OG tags (optional - page works without it)
const { data: bandData } = await useAsyncData(
  `share-shareable-${shareableId.value}`,
  async () => {
    if (!bandId.value) return null
    const strapiUrl = config.public.strapiUrl || 'http://localhost:1337'
    try {
      const res = await fetch(
        `${strapiUrl}/api/bands/${bandId.value}?populate=bandImg`
      )
      if (!res.ok) return null
      const json = await res.json()
      return json.data || null
    } catch (err) {
      console.error('[share/shareable] Failed to fetch band:', err)
      return null
    }
  },
  { default: () => null }
)

// Use band name from query param (bandSlug) as fallback if DB lookup fails
const bandName = computed(() => {
  if (bandData.value?.name) return bandData.value.name
  if (bandData.value?.attributes?.name) return bandData.value.attributes.name
  // Fallback: convert slug to title case
  if (bandSlug.value) {
    return bandSlug.value.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
  return 'Artist'
})

// Build OG image URL with all params
const siteUrl = 'https://musicbizqr.com'
const ogImageUrl = computed(() => {
  const params = new URLSearchParams({
    type: cardType.value,
    hero: hero.value,
    headline: headline.value,
    proof: proof.value,
    accent: accent.value,
  })
  return `${siteUrl}/api/og/shareable/${bandId.value}.png?${params.toString()}`
})

const canonicalUrl = computed(() => `${siteUrl}/share/shareable/${shareableId.value}`)
const shareTitle = computed(() => `${headline.value} - ${bandName.value}`)
const shareDescription = computed(() => `${hero.value} • ${proof.value}`)

// Set OG meta tags (SSR) - use functions for reactivity
useHead(() => ({
  title: shareTitle.value,
  meta: [
    { name: 'description', content: shareDescription.value },
    { property: 'og:title', content: shareTitle.value },
    { property: 'og:description', content: shareDescription.value },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonicalUrl.value },
    { property: 'og:image', content: ogImageUrl.value },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: shareTitle.value },
    { name: 'twitter:description', content: shareDescription.value },
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
      router.replace('/dashboard')
    }
  }, 200)
})
</script>

<template>
  <div class="min-h-screen bg-black flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-white/50 text-sm">Redirecting...</p>
    </div>
  </div>
</template>
