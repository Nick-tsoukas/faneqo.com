<template>
  <FaneqoMediaGrid
    :items="items"
    variant="gallery"
    @open="$emit('open', $event)"
  />
</template>

<script setup>
/**
 * Lab alias for the production gallery. Layout lives on FaneqoMediaGrid.
 */
import FaneqoMediaGrid from '~/components/media/FaneqoMediaGrid.vue'

defineProps({
  items: { type: Array, default: () => [] },
})
defineEmits(['open'])
</script>
