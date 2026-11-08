<template>
  <div class="memory-list">
    <FanPassportArtistChapter
      v-for="(chapter, index) in chapters"
      :key="chapter.key"
      :chapter="chapter"
      :media-origin="mediaOrigin"
      :priority="index === 0"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FanPassportArtistChapter from '~/components/passport/FanPassportArtistChapter.vue'
import { groupPassportRelationships, withSavedGalleries } from '~/utils/passport/passportPresentation'

const props = defineProps({
  memories: { type: Array, default: () => [] },
  savedGalleries: { type: Array, default: () => [] },
  mediaOrigin: { type: String, default: '' },
})

const chapters = computed(() => withSavedGalleries(
  groupPassportRelationships(props.memories),
  props.savedGalleries,
))
</script>

<style scoped>
.memory-list {
  display: grid;
  gap: clamp(2.6rem, 7vw, 4.4rem);
}
</style>
