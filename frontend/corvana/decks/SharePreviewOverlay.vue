<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div 
        v-if="open" 
        class="share-preview-overlay"
        @click.self="handleClose"
      >
        <div class="overlay-content">
          <!-- Header -->
          <div class="overlay-header">
            <button 
              @click="handleClose"
              class="close-button"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Preview Image -->
          <div class="preview-image">
            <img 
              :src="item.previewImageUrl" 
              :alt="item.title"
              class="preview-img"
              @error="handleImageError"
            />
            <div class="preview-overlay">
              <div class="preview-content">
                <h3 class="preview-title">{{ item.title }}</h3>
                <p class="preview-subtitle">{{ item.subtitle }}</p>
              </div>
            </div>
          </div>

          <!-- Caption Suggestions -->
          <div class="caption-section">
            <h4 class="caption-title">Caption Suggestions</h4>
            <div class="caption-list">
              <button
                v-for="(caption, index) in captionSuggestions"
                :key="index"
                @click="copyCaption(caption)"
                class="caption-item"
              >
                {{ caption }}
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="overlay-actions">
            <button 
              @click="handleClose"
              class="action-button secondary"
            >
              Close
            </button>
            <button 
              @click="handleShare"
              class="action-button primary"
            >
              {{ item.cta || 'Share' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: () => ({})
  },
  captionSuggestions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'share'])

function handleClose() {
  emit('close')
}

function handleShare() {
  emit('share', props.item)
}

function copyCaption(caption) {
  navigator.clipboard.writeText(caption).then(() => {
    // Could add a toast notification here
    console.log('Caption copied:', caption)
  }).catch(err => {
    console.error('Failed to copy caption:', err)
  })
}

function handleImageError(event) {
  // Fallback for missing images
  event.target.src = '/demo/shareables/default-preview.jpg'
}
</script>

<style scoped>
.share-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.overlay-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.overlay-header {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.preview-image {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 1.5rem 1.5rem 0 0;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 2rem;
}

.preview-content {
  color: #fff;
}

.preview-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.preview-subtitle {
  font-size: 1rem;
  color: #a0a0a0;
}

.caption-section {
  padding: 2rem;
}

.caption-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 1rem;
}

.caption-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.caption-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  color: #fff;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.caption-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.overlay-actions {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.action-button.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.action-button.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-button.primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: #fff;
}

.action-button.primary:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
}

/* Transitions */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>
