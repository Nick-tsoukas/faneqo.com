<template>
  <!-- Existing icon (image asset) - render exactly as before -->
  <img 
    v-if="existingIcon" 
    :src="existingIcon" 
    :alt="alt" 
    :class="className"
  />
  <!-- Iconify icon for new platforms -->
  <Icon 
    v-else-if="iconify" 
    :icon="iconify" 
    :class="className"
    :style="iconStyle"
  />
  <!-- Fallback: globe icon -->
  <svg 
    v-else 
    :class="className" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  existingIcon: {
    type: String,
    default: null
  },
  iconify: {
    type: String,
    default: null
  },
  alt: {
    type: String,
    default: ''
  },
  className: {
    type: String,
    default: 'w-6 h-6'
  },
  color: {
    type: String,
    default: null
  }
})

const iconStyle = computed(() => ({
  color: props.color || '#FFFFFF'
}))
</script>
