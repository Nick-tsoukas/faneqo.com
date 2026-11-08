<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="close"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="p-6 pb-0">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">Delete {{ itemTypeLabel }}</h2>
                <p class="text-white/60 text-sm mt-0.5">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <!-- Item Preview -->
            <div class="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
              <div class="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                <img 
                  v-if="itemImage" 
                  :src="itemImage" 
                  :alt="itemName"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white font-semibold truncate">{{ itemName }}</p>
                <p class="text-white/50 text-sm">{{ itemTypeLabel }}</p>
              </div>
            </div>

            <!-- Warning -->
            <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <p class="text-red-300 text-sm">
                <strong>Warning:</strong> Deleting this {{ itemTypeLabel.toLowerCase() }} will permanently remove all associated data including analytics and settings.
              </p>
            </div>

            <!-- Confirmation Input -->
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                Type <span class="text-red-400 font-mono bg-red-500/10 px-1.5 py-0.5 rounded">DELETE</span> to confirm
              </label>
              <input
                v-model="confirmText"
                type="text"
                class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition font-mono"
                placeholder="Type DELETE here"
                @keydown.enter="handleDelete"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="p-6 pt-0 flex gap-3">
            <button
              @click="close"
              class="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              @click="handleDelete"
              :disabled="!canDelete || deleting"
              class="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-500 disabled:hover:bg-red-600"
            >
              <span v-if="deleting" class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </span>
              <span v-else>Delete {{ itemTypeLabel }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  itemId: { type: [String, Number], default: null },
  itemName: { type: String, default: 'Untitled' },
  itemType: { type: String, default: 'item' }, // 'qr', 'band', 'event'
  itemImage: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const confirmText = ref('')
const deleting = ref(false)

const itemTypeLabel = computed(() => {
  const labels = {
    qr: 'QR Code',
    band: 'Artist Page',
    event: 'Event',
  }
  return labels[props.itemType] || 'Item'
})

const canDelete = computed(() => {
  return confirmText.value.toUpperCase() === 'DELETE'
})

function close() {
  if (deleting.value) return
  confirmText.value = ''
  emit('update:modelValue', false)
}

async function handleDelete() {
  if (!canDelete.value || deleting.value) return
  
  deleting.value = true
  emit('confirm', {
    id: props.itemId,
    type: props.itemType,
  })
}

// Reset state when modal opens
watch(() => props.modelValue, (open) => {
  if (open) {
    confirmText.value = ''
    deleting.value = false
  }
})

// Expose method to reset deleting state from parent
defineExpose({
  resetDeleting: () => {
    deleting.value = false
  }
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active > div:last-child,
.modal-fade-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from > div:last-child,
.modal-fade-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
