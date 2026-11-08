<script setup>
import { useAsyncData, useRuntimeConfig, useHead } from '#imports'

const config = useRuntimeConfig()



const { data: seoPages, error } = await useAsyncData('all-seo-pages', () =>
  $fetch(`${config.public.strapiUrl}/api/seo-pages`, {
    params: {
      populate: '*',
      sort: 'publishedAt:desc', // string is fine here
      'pagination[page]': 1,
      'pagination[pageSize]': 200, // or 1000 if your maxLimit allows it
    }
  })
)
if (error.value) {
  console.error('❌ Error fetching SEO pages:', error.value)
}

// Extract unique categories
const categories = computed(() => {
  const all = seoPages.value?.data || []
  const unique = [...new Set(all.map(p => p.attributes.category))]
  return unique.filter(Boolean)
})

useHead({
  title: 'Articles for Musicians',
  meta: [
    {
      name: 'description',
      content: 'Browse powerful articles on QR code marketing, music promotion, fan engagement and more.',
    },
    { property: 'og:title', content: 'Articles for Musicians | Faneqo' },
    {
      property: 'og:description',
      content: 'Browse powerful articles on QR code marketing, music promotion, fan engagement and more.',
    },
    { property: 'og:url', content: 'https://faneqo.com/article' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ],
  link: [{ rel: 'canonical', href: 'https://faneqo.com/article' }]
})


</script>

<template>
  <div class="bg-black text-white py-16 px-6 max-w-5xl mx-auto">
    <!-- Main page title (H1) -->
    <h1 class="text-4xl font-extrabold mb-4 text-gradient">
      Faneqo Knowledge Center
    </h1>

    <!-- Intro copy -->
    <p class="text-gray-300 mb-4 max-w-3xl leading-relaxed">
      Welcome to the Faneqo Knowledge Center — a growing, always-evolving library of 
      elite music marketing strategy. This is where artists, managers, and indie teams come to
      learn how to build real fan relationships, promote music with intention, and use modern
      tools like 
      <NuxtLink to="/article/smart-links" class="text-pink-400 underline">
        smart links
      </NuxtLink> 
      and 
      <NuxtLink to="/article/qr-code-strategy" class="text-pink-400 underline">
        dynamic QR codes
      </NuxtLink> 
      to actually grow.
    </p>

    <p class="text-gray-300 mb-4 max-w-3xl leading-relaxed">
      Every category below leads to a full pillar guide — a deep, long-form breakdown that 
      explains the strategy, psychology, and real-world use cases behind that part of your 
      music career. Under each pillar, you'll find supporting articles that go deeper, showing 
      you how to apply each tactic in the wild: on tour, at live shows, during releases, and 
      across every social platform.
    </p>

    <p class="text-gray-300 mb-4 max-w-3xl leading-relaxed">
      Not sure where to start? It depends on your goals. If you're releasing new music and 
      need a fan-first digital presence, begin with the 
      <NuxtLink to="/article/smart-links" class="text-pink-400 underline">
        Smart Links Pillar
      </NuxtLink>.  
      If you're pushing live shows or trying to turn concerts into sales, explore the 
      <NuxtLink to="/article/qr-code-strategy" class="text-pink-400 underline">
        QR Code Strategy Pillar
      </NuxtLink>.  
      And if you're focused on touring, festival prep, or building a stronger live presence, you'll want the 
      <NuxtLink to="/article/touring-events" class="text-pink-400 underline">
        Touring &amp; Events Pillar
      </NuxtLink>.
    </p>

    <p class="text-gray-300 mb-10 max-w-3xl leading-relaxed">
      Each guide reflects the same philosophy behind Faneqo itself:  
      <span class="text-pink-400 font-semibold">
        music promotion should be simple, powerful, and built for real artists — not influencers or marketers.
      </span>  
      Dive in, explore, and use these strategies to get your sound in front of more people who’ll actually care.
    </p>

    <!-- Section heading for the grid -->
    <h2 class="text-2xl font-bold mb-6">
      Explore Articles by Category
    </h2>

    <div v-if="categories.length" class="grid gap-6 md:grid-cols-2">
      <NuxtLink
        v-for="cat in categories"
        :key="cat"
        :to="`/article/${cat}`"
        class="block p-6 rounded-lg shadow bg-gray-900 hover:bg-gray-800 transition"
      >
        <h3 class="text-xl font-bold capitalize mb-2 text-pink-400">
          {{ cat.replace(/-/g, ' ') }}
        </h3>
        <p class="text-gray-300">
          Articles about {{ cat.replace(/-/g, ' ') }} to help you grow your music career.
        </p>
      </NuxtLink>
    </div>

    <div v-else class="text-gray-400 italic">
      No categories found.
    </div>
  </div>
</template>

<style scoped>
.text-gradient {
  background: linear-gradient(to right, #ec4899, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
