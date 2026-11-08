<template>
  <div class="bg-black text-white min-h-screen pt-[var(--header-height)] px-4">
    <div class="max-w-4xl mx-auto py-12">
      <h1 class="text-4xl md:text-5xl font-extrabold mb-10 text-gradient">
        Discover Articles
      </h1>

      <div v-if="pages.length === 0">
        <p>No articles found.</p>
      </div>

      <ul class="space-y-6">
        <li
          v-for="page in pages"
          :key="page.id"
          class="p-6 border border-white rounded-lg hover:border-pink-500 transition"
        >
          <NuxtLink
            :to="`/article/${page.attributes.slug}`"
            class="text-2xl font-bold text-white hover:underline"
          >
            {{ page.attributes.title }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const { data } = await useFetch(
  `${config.public.strapiUrl}/api/seo-pages?sort=createdAt:desc`,
  { key: "seo-pages" }
);

const pages = computed(() => data.value?.data || []);

useHead({
  title: "Discover QR Code Tips, Music Marketing, and More | Faneqo",
  meta: [
    { name: "description", content: "Browse our growing collection of marketing guides, QR code strategies, and music promotion tips made for artists and bands." },
    { property: "og:title", content: "Discover QR Code Tips for Bands | Faneqo" },
    { property: "og:description", content: "Marketing guides, QR strategies, and promotion tips made for musicians." },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://faneqo.com/discover" },
    { property: "og:image", content: "https://faneqo.com/og-default.png" }, // replace with your actual OG image
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Discover Music QR Code Tips | Faneqo" },
    { name: "twitter:description", content: "Marketing strategies & QR code tools for musicians." },
    { name: "twitter:image", content: "https://faneqo.com/og-default.png" },
  ],
  link: [
    { rel: "canonical", href: "https://faneqo.com/discover" }
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Discover Articles | Faneqo",
        "description": "Browse tips for using QR codes to grow your band or event.",
        "url": "https://faneqo.com/discover"
      })
    }
  ]
})

</script>
