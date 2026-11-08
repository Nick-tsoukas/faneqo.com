<script setup lang="ts">
import { useRoute, useRuntimeConfig, useHead } from '#imports'
import { useStrapi } from '#imports'

const route = useRoute()
const { find } = useStrapi()
const config = useRuntimeConfig()

/** Build absolute URL for Strapi media */
function ABS(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = config.public?.strapiURL || ''
  return `${base}${path}`
}

/** Extract 11-char YouTube ID from ID or URL */
function extractYouTubeId(input?: string): string | null {
  if (!input) return null
  const s = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  const beforeAmp = s.split('&')[0]
  if (/^[a-zA-Z0-9_-]{11}$/.test(beforeAmp)) return beforeAmp
  try {
    const url = s.includes('://') ? new URL(s) : new URL(`https://y.t/${s}`)
    const v = url.searchParams.get('v')
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
    const pathId = url.pathname.split('/').filter(Boolean).pop()
    if (pathId && /^[a-zA-Z0-9_-]{11}$/.test(pathId)) return pathId
  } catch {}
  return null
}

type VM = {
  slug: string
  id: string | null
  title: string
  thumb: string
  description: string
  createdAt?: string
  publishedAt?: string
}

/** Fetch single video (server-side) */
const { data: video } = await useAsyncData<VM>('howto-detail', async () => {
  const slug = String(route.params.slug || '')
  const resp: any = await find('howtovideos', {
    filters: { slug: { $eq: slug } },
    populate: { Thumbnail: true },              // exact case
    fields: ['slug','YouTubeID','Title','Description','createdAt','publishedAt'],
    publicationState: 'live',
  })
  const row = resp?.data?.[0]; const a = row?.attributes
  if (!a) return null

  return {
    slug: a.slug,
    id: extractYouTubeId(a.YouTubeID),
    title: a.Title,
    thumb: ABS(a.Thumbnail?.data?.attributes?.url),
    description: a.Description || '',
    createdAt: a.createdAt,
    publishedAt: a.publishedAt,
  }
})

/** ── SEO: title/meta/OG/Twitter/canonical + JSON-LD ─────────────────────── */
const siteUrl = config.public?.siteUrl || 'https://faneqo.com'
const pageUrl = `${siteUrl}/videos/${route.params.slug}`

const seoTitle = video.value?.title
  ? `${video.value.title} – Faneqo`
  : 'Video – Faneqo'

const seoDescription =
  video.value?.description?.slice(0, 160) ||
  'Tutorial for musicians: QR codes, smart links, and growth tactics with Faneqo.'

// Prefer the video thumb for social; fallback to a site OG image
const ogImage = video.value?.thumb || `${siteUrl}/og/musicbizqr-videos.jpg`

// Push standard SEO tags
useHead(() => {
  if (!video.value) {
    return {
      title: 'Video – Faneqo',
      meta: [
        { name: 'robots', content: 'noindex,follow' },
        { name: 'description', content: 'Video not found.' },
      ],
      link: [{ rel: 'canonical', href: `${siteUrl}/videos` }],
    }
  }

  return {
    title: seoTitle,
    meta: [
      { name: 'description', content: seoDescription },

      // Open Graph
      { property: 'og:type', content: 'video.other' },
      { property: 'og:title', content: seoTitle },
      { property: 'og:description', content: seoDescription },
      { property: 'og:url', content: pageUrl },
      { property: 'og:site_name', content: 'Faneqo' },
      { property: 'og:image', content: ogImage },

      // Optional OG video hints
      video.value.id ? { property: 'og:video', content: `https://www.youtube.com/watch?v=${video.value.id}` } : {},
      video.value.id ? { property: 'og:video:secure_url', content: `https://www.youtube.com/watch?v=${video.value.id}` } : {},

      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seoTitle },
      { name: 'twitter:description', content: seoDescription },
      { name: 'twitter:image', content: ogImage },

      // Indexing
      { name: 'robots', content: 'index,follow,max-image-preview:large' },
      { property: 'og:locale', content: 'en_US' },
    ].filter(Boolean) as any,
    link: [{ rel: 'canonical', href: pageUrl }],
    script: [
      // BreadcrumbList
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Videos', item: `${siteUrl}/videos` },
            { '@type': 'ListItem', position: 3, name: video.value.title, item: pageUrl },
          ],
        }),
      },
      // VideoObject
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: video.value.title,
          description: video.value.description || 'Faneqo tutorial video for musicians.',
          thumbnailUrl: video.value.thumb ? [video.value.thumb] : undefined,
          uploadDate: video.value.publishedAt || video.value.createdAt || undefined,
          url: pageUrl,
          embedUrl: video.value.id ? `https://www.youtube.com/watch?v=${video.value.id}` : undefined,
          publisher: {
            '@type': 'Organization',
            name: 'Faneqo',
            url: siteUrl,
            logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
          },
          // Optional extras if you add fields later:
          // duration: 'PT5M12S',                 // ISO 8601
          // genre: ['Music Marketing','QR Codes'],
          // keywords: 'qr codes, smart links, music marketing',
          // interactionStatistic: {
          //   '@type': 'InteractionCounter',
          //   interactionType: 'https://schema.org/WatchAction',
          //   userInteractionCount: 1234
          // }
        }),
      },
    ],
  }
})
</script>

<template>
  <section class="bg-black min-h-screen pt-[var(--header-height)] py-10 text-white">
    <div class="container mx-auto px-6 text-center">
      <NuxtLink to="/videos" class="text-white/70 hover:text-white block mb-6 text-left">
        ← Back to videos
      </NuxtLink>

      <div class="max-w-3xl mx-auto">
        <!-- <h1 class="text-3xl font-extrabold mb-4">
          {{ video?.title || 'Video not found' }}
        </h1> -->

        <!-- Player -->
        <VideoCard
          v-if="video && video.id"
          :video-id="video.id"
          :hideDescription="true"
          :title="video.title"
          :thumb="video.thumb"
          :autoplay="false"
          aspect="aspect-[5/4] md:aspect-[4/3] lg:aspect-[16/9]"
          class="mx-auto"
        />
        <p v-else class="text-red-400 mt-4 text-sm">
          Missing or invalid YouTube ID. Check the “YouTubeID” field in Strapi and republish.
        </p>

        <!-- <p v-if="video?.description" class="mt-6 text-white/80 whitespace-pre-line text-left">
          {{ video.description }}
        </p> -->
      </div>
    </div>
  </section>
</template>

