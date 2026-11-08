<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStrapi } from '#imports'

// ── Data ───────────────────────────────────────────────────────────────────────
const { find } = useStrapi()
const q = ref('')
const loading = ref(true)
const items = ref<{
  slug: string
  id: string
  title: string
  thumb: string
  description?: string
  createdAt?: string
  publishedAt?: string
}[]>([])

const ABS = (path?: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = useRuntimeConfig().public?.strapiURL || process.env.STRAPI_URL || ''
  return `${base}${path}`
}

async function fetchVideosFromStrapi() {
  try {
    const resp: any = await find('howtovideos', {
      populate: { Thumbnail: true },          // 👈 Capital T (your schema)
      sort: 'createdAt:desc',
      pagination: { pageSize: 24 },
      publicationState: 'live',
      fields: ['slug','YouTubeID','Title','Description','createdAt','publishedAt'],
    })

    items.value = (resp?.data || []).map((v: any) => ({
      slug: v.attributes.slug,
      id: v.attributes.YouTubeID,
      title: v.attributes.Title,
      thumb: ABS(v.attributes.Thumbnail?.data?.attributes?.url),
      description: v.attributes.Description || '',
      createdAt: v.attributes.createdAt,
      publishedAt: v.attributes.publishedAt,
    }))
  } finally {
    loading.value = false
  }
}

onMounted(fetchVideosFromStrapi)

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return items.value
  return items.value.filter(v =>
    (v.title || '').toLowerCase().includes(term) ||
    (v.slug || '').toLowerCase().includes(term)
  )
})

// ── SEO: head, social cards, canonicals, JSON-LD ──────────────────────────────
const siteUrl = useRuntimeConfig().public?.siteUrl || 'https://faneqo.com'
const pagePath = '/videos'
const pageUrl = `${siteUrl}${pagePath}`

// Dynamic, keyword-rich bits
const seoTitle = computed(() =>
  q.value
    ? `Tutorial Videos for Musicians: ${q.value} – Faneqo`
    : `Tutorial Videos for Musicians – QR Codes, Smart Links, Analytics | Faneqo`
)

const seoDescription = computed(() =>
  q.value
    ? `Watch Faneqo tutorials about “${q.value}”: learn QR codes, smart links, and fan-growth tactics for artists.`
    : `Learn QR codes, smart links, and growth tactics for musicians. Watch Faneqo’s tutorial videos to build fan journeys and track analytics.`
)

// Choose a safe fallback social image (your logo/brand image)
const socialImage = `${siteUrl}/og/musicbizqr-videos.jpg`

useHead({
  title: seoTitle.value,
  meta: [
    { name: 'description', content: seoDescription.value },

    // Canonical + robots
    { name: 'robots', content: 'index,follow,max-image-preview:large' },
    { property: 'og:locale', content: 'en_US' },

    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: seoTitle.value },
    { property: 'og:description', content: seoDescription.value },
    { property: 'og:url', content: pageUrl },
    { property: 'og:site_name', content: 'Faneqo' },
    { property: 'og:image', content: socialImage },

    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seoTitle.value },
    { name: 'twitter:description', content: seoDescription.value },
    { name: 'twitter:image', content: socialImage },
  ],
  link: [{ rel: 'canonical', href: pageUrl }],
})

// JSON-LD: BreadcrumbList, ItemList of VideoObjects, WebSite SearchAction
const itemListSchema = computed(() => {
  const list = filtered.value.map((v, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    url: `${siteUrl}/videos/${v.slug}`,
    name: v.title,
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: list,
  }
})

const videoObjectsSchema = computed(() => {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Faneqo Tutorial Videos',
    url: pageUrl,
    about: 'Tutorials for musicians on QR codes, smart links, and analytics.',
    hasPart: filtered.value
      .filter(v => !!v.id)
      .map(v => ({
        '@type': 'VideoObject',
        name: v.title,
        description: v.description || 'Faneqo tutorial video for musicians.',
        thumbnailUrl: v.thumb ? [v.thumb] : undefined,
        uploadDate: v.publishedAt || v.createdAt || undefined,
        url: `${siteUrl}/videos/${v.slug}`,
        embedUrl: `https://www.youtube.com/watch?v=${v.id}`,
        publisher: {
          '@type': 'Organization',
          name: 'Faneqo',
          url: siteUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/logo.png`,
          },
        },
      })),
  }
})

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'Videos', item: pageUrl },
  ],
}

const searchActionSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/videos?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

// Push JSON-LD to head (reactive to the filter/search)
useHead(() => ({
  script: [
    { type: 'application/ld+json', children: JSON.stringify(breadcrumbSchema) },
    { type: 'application/ld+json', children: JSON.stringify(itemListSchema.value) },
    { type: 'application/ld+json', children: JSON.stringify(videoObjectsSchema.value) },
    { type: 'application/ld+json', children: JSON.stringify(searchActionSchema) },
  ],
}))
</script>


<template>
  <section class="bg-black min-h-screen pt-[var(--header-height)] py-10">
    <div class="container max-w-7xl mx-auto px-6">
      <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-10">
        <div>
          <h1 class="text-3xl md:text-4xl font-extrabold text-white">🎥 Tutorials</h1>
          <p class="text-white/70 mt-1">Learn QR codes, smart links, and growth tactics with Faneqo.</p>
        </div>
        <div class="w-full md:w-80">
          <input
            v-model="q"
            type="search"
            placeholder="Search videos…"
            class="w-full rounded-lg bg-neutral-900 border border-white/10 px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </header>

      <div v-if="loading" class="text-white/70">Loading…</div>

      <div v-else>
        <div v-if="!filtered.length" class="text-white/70">No videos found.</div>

        <!-- Balanced grid with generous vertical rhythm -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12"
        >
          <NuxtLink
  v-for="v in filtered"
  :key="v.slug"
  :to="`/videos/${v.slug}`"
  class="block group"
  :title="`Watch: ${v.title}`"
  :aria-label="`Open video: ${v.title}`"
>
            <!-- Card wrapper adds separation & polish -->
            <div
              class="h-full rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4
                     transition-transform hover:scale-[1.01] hover:bg-white/10"
            >
              <VideoCard
                v-if="v.id"
                :video-id="v.id"
                :title="v.title"
                :thumb="v.thumb"
                :autoplay="false"
                aspect="aspect-[16/9]"
                class="rounded-xl overflow-hidden"
              />
              <div v-else class="text-red-400 text-sm mt-2">No YouTubeID set</div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

