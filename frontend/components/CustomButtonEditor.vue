<template>
  <div class="custom-button-editor">
    <!-- Existing Buttons List -->
    <div v-if="modelValue.length > 0" class="space-y-3 mb-6">
      <TransitionGroup name="button-list">
        <div
          v-for="(button, index) in modelValue"
          :key="button.id || index"
          class="group relative"
        >
          <div
            class="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.06] hover:border-white/20 hover:from-white/[0.05] hover:to-white/[0.08] transition-all duration-300"
            :class="{ 'ring-2 ring-purple-500/50 border-purple-500/50': editingIndex === index }"
          >
            <!-- Drag Handle -->
            <div 
              class="cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60 transition touch-none"
              draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragend="onDragEnd"
              @dragover.prevent
              @drop="onDrop($event, index)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>

            <!-- Icon/Image Preview -->
            <div class="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <img 
                v-if="button.customIcon?.url" 
                :src="button.customIcon.url" 
                :alt="button.title"
                class="w-full h-full object-cover"
              />
              <Icon 
                v-else 
                :icon="getButtonIcon(button)" 
                class="w-6 h-6 text-purple-300"
              />
            </div>

            <!-- Button Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-white font-semibold truncate">{{ button.title }}</span>
                <span 
                  v-if="button.iconName && button.iconName !== 'link'" 
                  class="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-[10px] font-medium uppercase tracking-wide"
                >
                  {{ getPlatformLabel(button.iconName) }}
                </span>
              </div>
              <p v-if="button.subtitle" class="text-white/40 text-sm truncate mt-0.5">{{ button.subtitle }}</p>
              <p class="text-white/30 text-xs truncate mt-1">{{ button.url }}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                @click="startEdit(index)"
                class="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
                title="Edit"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                @click="removeButton(index)"
                class="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition"
                title="Delete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Empty State -->
    <div 
      v-else 
      class="text-center py-12 px-6 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]"
    >
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <h4 class="text-white font-semibold mb-1">No custom links yet</h4>
      <p class="text-white/50 text-sm">Add links to anything — merch, tickets, playlists, or your own website.</p>
    </div>

    <!-- Add/Edit Form - Elite Design -->
    <div 
      v-if="showForm" 
      class="mt-6 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-[#1a1a2e] via-[#16162a] to-[#0f0f1a] shadow-2xl shadow-purple-900/20 overflow-hidden"
    >
      <!-- Form Header -->
      <div class="px-8 py-6 bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-b border-white/5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h4 class="text-white font-bold text-xl">
                {{ editingIndex !== null ? 'Edit Custom Link' : 'Create Custom Link' }}
              </h4>
              <p class="text-white/50 text-sm mt-0.5">Add a button that links anywhere you want</p>
            </div>
          </div>
          <button
            type="button"
            @click="cancelForm"
            class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all duration-200"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Form Body -->
      <div class="p-8 space-y-8">
        <!-- URL Field - Primary Input -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-white font-semibold text-sm flex items-center gap-2">
              <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Destination URL
              <span class="text-pink-400">*</span>
            </label>
            <span class="text-white/30 text-xs">Required</span>
          </div>
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            <input
              v-model="formData.url"
              type="url"
              class="relative w-full px-5 py-4 rounded-2xl bg-black/40 border-2 border-white/10 text-white text-base placeholder-white/30 focus:border-purple-500/50 focus:bg-black/60 focus:outline-none transition-all duration-200"
              placeholder="Paste any URL here..."
              @input="onUrlChange"
              @paste="onUrlPaste"
            />
            <div 
              v-if="detectedPlatform && detectedPlatform.platformKey !== 'link'" 
              class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
            >
              <div class="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center gap-2">
                <Icon :icon="detectedPlatform.iconify" class="w-4 h-4 text-purple-300" />
                <span class="text-purple-300 text-xs font-semibold">{{ detectedPlatform.label }}</span>
              </div>
            </div>
          </div>
          <p class="text-white/40 text-xs flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            We'll auto-detect the platform and show the right icon
          </p>
        </div>

        <!-- Two Column Layout for Title & Subtitle -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Title Field -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-white font-semibold text-sm flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Button Label
                <span class="text-pink-400">*</span>
              </label>
              <span class="text-white/30 text-xs">{{ formData.title?.length || 0 }}/50</span>
            </div>
            <input
              v-model="formData.title"
              type="text"
              class="w-full px-5 py-4 rounded-2xl bg-black/40 border-2 border-white/10 text-white text-base placeholder-white/30 focus:border-purple-500/50 focus:bg-black/60 focus:outline-none transition-all duration-200"
              placeholder="e.g., Buy Tickets"
              maxlength="50"
            />
          </div>

          <!-- Subtitle Field -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-white font-semibold text-sm flex items-center gap-2">
                <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Subtitle
                <span class="text-white/30 text-xs font-normal">(optional)</span>
              </label>
            </div>
            <input
              v-model="formData.subtitle"
              type="text"
              class="w-full px-5 py-4 rounded-2xl bg-black/40 border-2 border-white/10 text-white text-base placeholder-white/30 focus:border-purple-500/50 focus:bg-black/60 focus:outline-none transition-all duration-200"
              placeholder="e.g., Limited time offer"
              maxlength="80"
            />
          </div>
        </div>

        <!-- Custom Icon Section -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <div class="flex items-start gap-5">
            <!-- Icon Preview -->
            <div class="relative group">
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-purple-500/50">
                <img 
                  v-if="formData.customIconPreview || formData.customIcon?.url" 
                  :src="formData.customIconPreview || formData.customIcon?.url" 
                  alt="Custom icon"
                  class="w-full h-full object-cover"
                />
                <Icon 
                  v-else-if="detectedPlatform && detectedPlatform.platformKey !== 'link'" 
                  :icon="detectedPlatform.iconify" 
                  class="w-10 h-10 text-white/30"
                />
                <svg v-else class="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div v-if="formData.customIconPreview || formData.customIcon?.url" class="absolute -top-2 -right-2">
                <button
                  type="button"
                  @click="removeCustomIcon"
                  class="w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-110"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Upload Info -->
            <div class="flex-1 space-y-3">
              <div>
                <h5 class="text-white font-semibold text-sm">Custom Icon</h5>
                <p class="text-white/40 text-xs mt-1">Upload your own image to replace the auto-detected icon</p>
              </div>
              <label 
                class="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 hover:from-purple-600/30 hover:to-pink-600/30 hover:text-purple-200 cursor-pointer transition-all duration-200 text-sm font-semibold group"
              >
                <svg class="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{{ formData.customIconPreview || formData.customIcon?.url ? 'Replace Image' : 'Upload Image' }}</span>
                <input
                  type="file"
                  class="hidden"
                  accept="image/*"
                  @change="handleIconUpload"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Footer -->
      <div class="px-8 py-6 bg-black/20 border-t border-white/5 flex items-center justify-between">
        <p class="text-white/30 text-xs">
          <span class="text-pink-400">*</span> Required fields
        </p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="cancelForm"
            class="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveButton"
            :disabled="!isFormValid"
            class="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0"
          >
            {{ editingIndex !== null ? 'Save Changes' : 'Add Link' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Button -->
    <button
      v-if="!showForm"
      type="button"
      @click="showAddForm"
      class="mt-4 w-full py-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-purple-500/50 bg-white/[0.02] hover:bg-purple-500/5 text-white/60 hover:text-purple-300 font-medium transition-all duration-300 flex items-center justify-center gap-2 group"
    >
      <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span>Add Custom Link</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { detectPlatform } from '~/utils/detectPlatform'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'icon-upload'])

const showForm = ref(false)
const editingIndex = ref(null)
const dragIndex = ref(null)

const formData = ref({
  title: '',
  subtitle: '',
  url: '',
  iconName: '',
  customIcon: null,
  customIconPreview: null,
  customIconFile: null
})

const detectedPlatform = computed(() => {
  if (!formData.value.url) return null
  return detectPlatform(formData.value.url)
})

const isFormValid = computed(() => {
  return formData.value.title?.trim() && formData.value.url?.trim()
})

function getButtonIcon(button) {
  if (button.iconName) {
    const platform = detectPlatform(`https://${button.iconName}.com`)
    return platform.iconify
  }
  return detectPlatform(button.url)?.iconify || 'mdi:link-variant'
}

function getPlatformLabel(iconName) {
  const platform = detectPlatform(`https://${iconName}.com`)
  return platform.label
}

function showAddForm() {
  resetForm()
  showForm.value = true
  editingIndex.value = null
}

function startEdit(index) {
  const button = props.modelValue[index]
  formData.value = {
    title: button.title || '',
    subtitle: button.subtitle || '',
    url: button.url || '',
    iconName: button.iconName || '',
    customIcon: button.customIcon || null,
    customIconPreview: null,
    customIconFile: null
  }
  editingIndex.value = index
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingIndex.value = null
  resetForm()
}

function resetForm() {
  formData.value = {
    title: '',
    subtitle: '',
    url: '',
    iconName: '',
    customIcon: null,
    customIconPreview: null,
    customIconFile: null
  }
}

function onUrlChange() {
  if (detectedPlatform.value) {
    formData.value.iconName = detectedPlatform.value.platformKey
  }
}

function onUrlPaste(event) {
  setTimeout(() => {
    onUrlChange()
  }, 10)
}

function handleIconUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  formData.value.customIconFile = file
  formData.value.customIconPreview = URL.createObjectURL(file)
}

function removeCustomIcon() {
  formData.value.customIcon = null
  formData.value.customIconPreview = null
  formData.value.customIconFile = null
}

function saveButton() {
  if (!isFormValid.value) return

  const buttonData = {
    title: formData.value.title.trim(),
    subtitle: formData.value.subtitle?.trim() || '',
    url: formData.value.url.trim(),
    iconName: formData.value.iconName || detectedPlatform.value?.platformKey || 'link',
    customIcon: formData.value.customIcon,
    _customIconFile: formData.value.customIconFile
  }

  const newButtons = [...props.modelValue]

  if (editingIndex.value !== null) {
    newButtons[editingIndex.value] = { ...newButtons[editingIndex.value], ...buttonData }
  } else {
    newButtons.push(buttonData)
  }

  emit('update:modelValue', newButtons)
  
  if (formData.value.customIconFile) {
    emit('icon-upload', {
      index: editingIndex.value !== null ? editingIndex.value : newButtons.length - 1,
      file: formData.value.customIconFile
    })
  }

  cancelForm()
}

function removeButton(index) {
  const newButtons = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', newButtons)
}

function onDragStart(event, index) {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  dragIndex.value = null
}

function onDrop(event, toIndex) {
  if (dragIndex.value === null || dragIndex.value === toIndex) return

  const newButtons = [...props.modelValue]
  const [removed] = newButtons.splice(dragIndex.value, 1)
  newButtons.splice(toIndex, 0, removed)
  
  emit('update:modelValue', newButtons)
  dragIndex.value = null
}
</script>

<style scoped>
.button-list-move {
  transition: transform 0.3s ease;
}

.button-list-enter-active,
.button-list-leave-active {
  transition: all 0.3s ease;
}

.button-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.button-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
