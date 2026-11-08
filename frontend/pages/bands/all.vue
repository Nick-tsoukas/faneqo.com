<script setup>
import { useAsyncData, useRuntimeConfig, computed } from '#imports'
import { getArtistFocalStyle, getBestArtistImageSource, unwrapBandImage } from '@/utils/media/artistImage'

const config = useRuntimeConfig()

const { data: bandsData, error, pending } = await useAsyncData(
  'all-bands',
  async () => {
    try {
      const resp = await $fetch(`${config.public.strapiUrl}/api/bands`, {
        params: {
          'populate': '*',
          'pagination[pageSize]': 100,
          'sort': 'createdAt:desc'
        }
      })
      return resp?.data || []
    } catch (e) {
      console.error('[All Bands] Fetch error:', e)
      return []
    }
  }
)

const bands = computed(() => {
  if (!bandsData.value) return []
  return bandsData.value.map(b => {
    const attrs = b.attributes || b
    return {
      id: b.id,
      name: attrs.name || 'Unnamed Artist',
      slug: attrs.slug || '',
      genre: attrs.genre || '',
      bio: attrs.bio || '',
      bandImg: attrs.bandImg,
      cyberedImagePositionX: attrs.cyberedImagePositionX ?? 50,
      cyberedImagePositionY: attrs.cyberedImagePositionY ?? 50,
      createdAt: attrs.createdAt,
      updatedAt: attrs.updatedAt
    }
  })
})

function getBandImageUrl(band) {
  const source = getBestArtistImageSource(unwrapBandImage(band.bandImg) || band.bandImg, 'card')
  const url = source.src
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${config.public.strapiUrl}${url}`
}

function getBandImageStyle(band) {
  return getArtistFocalStyle({
    positionX: band.cyberedImagePositionX,
    positionY: band.cyberedImagePositionY,
  })
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

useHead({
  title: 'All Artists | MusicBizQR',
  meta: [
    { name: 'description', content: 'Discover all artists using MusicBizQR' },
    { name: 'robots', content: 'noindex' }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-black pt-[var(--header-height)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div class="mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
          All <span class="text-gradient">Artists</span>
        </h1>
        <p class="text-white/60 text-lg max-w-2xl">
          Discover {{ bands.length }} artists using MusicBizQR
        </p>
      </div>

      <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="i in 8" :key="i" class="band-card skeleton">
          <div class="aspect-square bg-white/5 rounded-xl animate-pulse" />
          <div class="p-4 space-y-3">
            <div class="h-5 bg-white/5 rounded w-3/4 animate-pulse" />
            <div class="h-4 bg-white/5 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </div>

      <div v-else-if="error" class="text-center py-20">
        <div class="text-red-400 text-5xl mb-4">!</div>
        <h2 class="text-xl text-white mb-2">Failed to load artists</h2>
        <p class="text-white/50">{{ error.message }}</p>
      </div>

      <div v-else-if="bands.length === 0" class="text-center py-20">
        <div class="text-white/30 text-5xl mb-4">♪</div>
        <h2 class="text-xl text-white mb-2">No artists yet</h2>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <NuxtLink
          v-for="band in bands"
          :key="band.id"
          :to="`/${band.slug}`"
          class="band-card group"
        >
          <div class="aspect-square relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40">
            <img
              v-if="getBandImageUrl(band)"
              :src="getBandImageUrl(band)"
              :alt="band.name"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              :style="getBandImageStyle(band)"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <div class="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
                {{ getInitials(band.name) }}
              </div>
            </div>
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span class="px-4 py-2 bg-white text-black font-semibold rounded-full text-sm">View Page</span>
            </div>
          </div>

          <div class="p-5">
            <h3 class="font-bold text-white text-lg mb-1 truncate group-hover:text-pink-400 transition-colors">
              {{ band.name }}
            </h3>
            <p v-if="band.genre" class="text-purple-400 text-sm mb-2">{{ band.genre }}</p>
            <p v-if="band.bio" class="text-white/50 text-sm line-clamp-2">{{ band.bio }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-gradient {
  background: linear-gradient(to right, #ec4899, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.band-card {
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgb(31, 41, 55);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
}
.band-card:hover {
  border-color: rgba(236, 72, 153, 0.5);
  box-shadow: 0 0 32px rgba(236, 72, 153, 0.15);
  transform: translateY(-4px);
}
.band-card.skeleton {
  pointer-events: none;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
