<template>
  <div class="bg-black min-h-screen">
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Head>
    <slot />
  </div>
</template>

<script setup>
import { useHead } from '#imports'

useHead({
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} | Agency Portal` : 'Agency Portal',
  meta: [
    {
      name: 'robots',
      content: 'noindex,nofollow'
    }
  ]
})
</script>
