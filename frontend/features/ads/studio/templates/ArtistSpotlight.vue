<template>
  <component :is="Style" :format="format" :content="content" :snapshot="snapshot" :scene="scene" />
</template>

<script setup>
import { computed } from 'vue'
import { spotlightStyleComponent } from './spotlight/index.js'

/**
 * Artist Spotlight. One family, four design styles chosen by `content.style`:
 * editorial (default for new creatives), cinematic, culture, and legacy — the
 * original rendering, used by every creative saved before styles existed.
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

const Style = computed(() => spotlightStyleComponent(props.content))
</script>
