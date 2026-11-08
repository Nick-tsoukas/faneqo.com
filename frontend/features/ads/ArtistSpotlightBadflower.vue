<template>
  <ArtistSpotlight :post="artistSpotlightBadflower" :format="format" />
</template>

<script setup>
import ArtistSpotlight from './templates/ArtistSpotlight.vue'
import { artistSpotlightBadflower } from './posts/artistSpotlightBadflower.js'

defineProps({
  format: { type: String, default: 'post' },
})
</script>
