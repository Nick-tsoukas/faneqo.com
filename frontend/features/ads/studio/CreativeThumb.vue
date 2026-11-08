<template>
  <div ref="host" class="thumb" :class="{ 'is-live': shown }">
    <AdStage v-if="shown" :width="width" :height="height">
      <component :is="component" :format="format" :content="content" :snapshot="snapshot" :scene="scene" />
    </AdStage>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AdStage from '@/features/ads/AdStage.vue'

defineProps({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  component: { type: [Object, Function], required: true },
  format: { type: String, required: true },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

const host = ref(null)
const shown = ref(false)
let observer = null

onMounted(() => {
  const el = host.value
  if (!el || typeof IntersectionObserver === 'undefined') {
    shown.value = true
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      shown.value = true
      observer.disconnect()
      observer = null
    }
  }, { rootMargin: '240px 0px' })
  observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.thumb {
  position: absolute;
  inset: 0;
}

.thumb :deep(.ad-stage-host) {
  position: absolute;
  inset: 0;
  height: auto;
}
</style>
