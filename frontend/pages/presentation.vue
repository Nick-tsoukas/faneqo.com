<template>
  <DeckViewer :deck-slug="FLAGSHIP_DECK_SLUG" />
</template>

<script setup>
// The flagship presentation's public, shareable address. It renders the same
// Corvana viewer as /corvana/decks/<slug>; /deck redirects here.
import DeckViewer from '~/pages/corvana/decks/[id].vue'
import { FLAGSHIP_DECK_SLUG, FLAGSHIP_DECK_PATH } from '~/corvana/decks/deckIndex.js'

definePageMeta({
  layout: false,
})

const url = `https://faneqo.com${FLAGSHIP_DECK_PATH}`
const title = 'Faneqo | The Artist Platform'
const description = 'Faneqo gives artists and their teams one home for their music, shows and fans: pages and QR codes that turn every scan into a fan you can reach again, with messaging, support and analytics built in.'
const image = 'https://faneqo.com/api/og/site.png?v=20260801'
const imageAlt = 'Faneqo, the artist platform'

useHead({
  title,
  titleTemplate: '%s',
  link: [{ rel: 'canonical', href: url }],
})

useSeoMeta({
  description,
  ogType: 'website',
  ogSiteName: 'Faneqo',
  ogUrl: url,
  ogTitle: title,
  ogDescription: description,
  ogImage: image,
  ogImageSecureUrl: image,
  ogImageType: 'image/png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: imageAlt,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image,
  twitterImageAlt: imageAlt,
})
</script>
