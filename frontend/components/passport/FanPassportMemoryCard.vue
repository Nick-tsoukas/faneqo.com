<template>
  <FanPassportNightMemory :memory="memory" :media-origin="mediaOrigin" />
</template>

<script setup>
import FanPassportNightMemory from '~/components/passport/FanPassportNightMemory.vue'

defineProps({
  memory: { type: Object, required: true },
  mediaOrigin: { type: String, default: '' },
})
</script>
