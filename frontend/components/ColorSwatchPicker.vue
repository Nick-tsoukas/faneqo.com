<template>
  <div class="relative inline-block">
    <!-- 1) The swatch button -->
    <button
      ref="buttonRef"
      type="button"
      @click="open = !open"
      :style="{ backgroundColor: modelValue }"
      class="w-8 h-8 rounded border-2 border-gray-300 shadow-sm"
    ></button>

    <!-- 2) Pop-over panel -->
    <div
      v-if="open"
      ref="panelRef"
      class="absolute z-10 mt-2 p-3 bg-white rounded-md shadow-lg w-64"
    >
      <!-- 3) Preset swatches -->
      <div class="grid grid-cols-5 gap-2 mb-4">
        <div
          v-for="c in presets"
          :key="c"
          :style="{ backgroundColor: c }"
          @click="select(c)"
          class="w-6 h-6 rounded cursor-pointer border-2 border-gray-200 hover:border-gray-500"
        ></div>
      </div>

      <!-- 4) Full picker -->
      <Chrome
        :model-value="modelValue"
        @update:model-value="onChromeUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Chrome } from '@ckpack/vue-color'

const props = defineProps<{ modelValue: string }>()
const emit  = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const presets = [
  '#ffffff','#000000','#f44336','#e91e63','#9c27b0',
  '#673ab7','#3f51b5','#2196f3','#03a9f4','#00bcd4',
  '#009688','#4caf50','#8bc34a','#cddc39','#ffeb3b',
  '#ffc107','#ff9800','#ff5722','#795548','#607d8b'
]

const open = ref(false)
const panelRef = ref<HTMLElement|null>(null)
const buttonRef = ref<HTMLElement|null>(null)

function select(color: string | { hex?: string; hex8?: string }, closePanel = true) {
  // Chrome picker returns an object with hex property, preset swatches return strings
  const hexValue = typeof color === 'string' ? color : (color.hex || color.hex8 || '#000000')
  emit('update:modelValue', hexValue)
  if (closePanel) {
    open.value = false
  }
}

function onChromeUpdate(color: { hex?: string; hex8?: string }) {
  // Don't close panel when using Chrome picker - let user continue adjusting
  select(color, false)
}

function onClickOutside(event: MouseEvent) {
  const panel = panelRef.value
  const btn   = buttonRef.value
  if (!open.value || !panel) return

  const target = event.target as Node
  if (
    panel.contains(target) ||
    (btn && btn.contains(target))
  ) {
    // click INSIDE panel or button → do nothing
    return
  }
  // click outside → close
  open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style scoped>
/* (reuse your existing styles) */
</style>
