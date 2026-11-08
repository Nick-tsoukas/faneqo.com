<template>
  <div class="deck-renderer" style="min-height: 100vh; background: linear-gradient(135deg, #000 0%, #1a1a2e 50%, #0f0f1e 100%);">
    <!-- Narrative Slide -->
    <div v-if="currentSlide.type === 'narrative'" class="narrative-slide" style="width: 100%; padding: 4rem 2rem;">
      <div class="narrative-content" style="max-width: 800px; margin: 0 auto; text-align: center;">
        <h1 style="font-size: 4rem; font-weight: 700; color: #fff; margin-bottom: 1.5rem;">{{ currentSlide.content.headline }}</h1>
        <h2 style="font-size: 1.8rem; font-weight: 500; color: #a0a0a0; margin-bottom: 2rem;">{{ currentSlide.content.subhead }}</h2>
        <p style="font-size: 1.2rem; color: #808080; line-height: 1.6;">{{ currentSlide.content.body }}</p>
      </div>
    </div>

    <!-- Mobile View Slide -->
    <div v-else-if="currentSlide.type === 'mobile_view'" class="mobile-view-slide">
      <MobileViewport>
        <Suspense>
          <template #default>
            <component 
              :is="resolvedComponent"
              v-bind="componentProps"
              @select="handleShareableSelect"
            />
          </template>
          <template #fallback>
            <div class="loading-slide">Loading...</div>
          </template>
        </Suspense>
      </MobileViewport>
    </div>

    <!-- Dashboard View Slide -->
    <div v-else-if="currentSlide.type === 'dashboard_view'" class="dashboard-view-slide">
      <div class="dashboard-container">
        <Suspense>
          <template #default>
            <component 
              :is="resolvedComponent"
              v-bind="componentProps"
            />
          </template>
          <template #fallback>
            <div class="loading-slide">Loading...</div>
          </template>
        </Suspense>
      </div>
    </div>

    <!-- Fallback for unknown slide types -->
    <div v-else class="narrative-slide">
      <div class="narrative-content">
        <h1 class="headline">Unknown Slide Type</h1>
        <p class="body">Slide type "{{ currentSlide.type }}" is not supported.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { resolveComponent } from '~/corvana/decks/componentRegistry.js'
import MobileViewport from './MobileViewport.vue'

const props = defineProps({
  currentSlide: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['shareable-selected'])

// Debug logging
watch(() => props.currentSlide, (slide) => {
  console.log('Current slide:', slide)
}, { immediate: true })

// Resolve component for mobile view and dashboard view slides
const resolvedComponent = computed(() => {
  try {
    if (props.currentSlide.type === 'mobile_view' || props.currentSlide.type === 'dashboard_view') {
      const registry = resolveComponent(props.currentSlide.content.componentKey)
      console.log('Resolved component:', props.currentSlide.content.componentKey)
      return registry.component
    }
  } catch (e) {
    console.error('Error resolving component:', e)
  }
  return null
})

// Build props for component
const componentProps = computed(() => {
  try {
    if (props.currentSlide.type === 'mobile_view' || props.currentSlide.type === 'dashboard_view') {
      const registry = resolveComponent(props.currentSlide.content.componentKey)
      const demoDataKey = props.currentSlide.content.demoDataKey
      const builtProps = demoDataKey ? registry.buildProps(demoDataKey) : registry.buildProps()
      console.log('Built props:', builtProps)
      return builtProps
    }
  } catch (e) {
    console.error('Error building props:', e)
  }
  return {}
})

// Handle shareable selection
function handleShareableSelect(item) {
  emit('shareable-selected', item)
}
</script>

<style scoped>
.deck-renderer {
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #000 0%, #1a1a2e 50%, #0f0f1e 100%);
  position: relative;
  overflow: hidden;
}

.narrative-slide {
  width: 100%;
  max-width: 1200px;
  padding: 2rem;
  text-align: center;
}

.narrative-content {
  max-width: 800px;
  margin: 0 auto;
}

.headline {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subhead {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 500;
  color: #a0a0a0;
  line-height: 1.3;
  margin-bottom: 2rem;
}

.body {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  color: #808080;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.mobile-view-slide {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-view-slide {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.dashboard-container {
  width: 100%;
  max-width: 1200px;
  max-height: 100%;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.dashboard-container::-webkit-scrollbar {
  width: 6px;
}

.dashboard-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dashboard-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.loading-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #808080;
  font-size: 1.2rem;
  padding: 2rem;
}
</style>
