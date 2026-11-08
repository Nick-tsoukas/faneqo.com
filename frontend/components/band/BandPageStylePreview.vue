<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close" />
        
        <!-- Modal -->
        <div class="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950 shadow-2xl">
          <!-- Header -->
          <div class="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gray-950/95 backdrop-blur">
            <div>
              <h3 class="text-lg font-bold text-white">{{ styleLabel }} Preview</h3>
              <p class="text-white/50 text-sm">Neon Avenue demo</p>
            </div>
            <button 
              @click="close"
              class="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Preview Content -->
          <div class="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
            <!-- Classic Style Preview (white borders, simple layout) -->
            <div v-if="previewStyle === 'default'" class="band-preview-classic">
              <BandPageStyleClassic />
            </div>

            <!-- Cybered Style Preview (modern cards, Live Surface features) -->
            <div v-else-if="previewStyle === 'smartlink'" class="band-preview-cybered">
              <BandPageStyleDefault />
            </div>

            <!-- Compact Style Preview -->
            <div v-else-if="previewStyle === 'compact'" class="band-preview-compact">
              <BandPageStyleCompact />
            </div>

            <!-- Bold Style Preview -->
            <div v-else-if="previewStyle === 'bold'" class="band-preview-bold">
              <BandPageStyleBold />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import BandPageStyleClassic from './BandPageStyleClassic.vue'
import BandPageStyleDefault from './BandPageStyleDefault.vue'
import BandPageStyleCompact from './BandPageStyleCompact.vue'
import BandPageStyleBold from './BandPageStyleBold.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  previewStyle: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'smartlink', 'compact', 'bold'].includes(v)
  }
})

const emit = defineEmits(['close'])

const styleLabel = computed(() => {
  if (props.previewStyle === 'default') return 'Classic'
  if (props.previewStyle === 'smartlink') return 'Cybered'
  if (props.previewStyle === 'compact') return 'Compact'
  if (props.previewStyle === 'bold') return 'Bold'
  return 'Preview'
})

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .relative,
.modal-fade-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
