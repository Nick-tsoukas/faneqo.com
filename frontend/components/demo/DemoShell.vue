<template>
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Sticky Header Container (2 rows) -->
    <div class="sticky top-0 z-50">
      <!-- Row 1: Global Header -->
      <header class="shrink-0 h-14 bg-black/90 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
        <!-- Left: Logo + Title -->
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="shrink-0">
            <img src="@/assets/musicbizlogo.png" alt="MBQ" class="h-6" />
          </NuxtLink>
          <span class="text-white/60 text-sm">Demo</span>
        </div>

        <!-- Right: Global Controls -->
        <div class="flex items-center gap-2">
          <!-- Header Extra Slot (for Showtime button) -->
          <slot name="header-extra" />

          <!-- Mode Toggle -->
          <div class="flex items-center bg-black/40 border border-white/10 rounded-full p-0.5">
            <button
              type="button"
              :class="[
                'px-3 py-1 text-xs rounded-full transition',
                mode === 'story' ? 'bg-purple-500/30 text-purple-200' : 'text-white/60 hover:text-white',
              ]"
              @click="setMode('story')"
            >
              Story
            </button>
            <button
              type="button"
              :class="[
                'px-3 py-1 text-xs rounded-full transition',
                mode === 'explore' ? 'bg-purple-500/30 text-purple-200' : 'text-white/60 hover:text-white',
              ]"
              @click="setMode('explore')"
            >
              Explore
            </button>
          </div>

          <!-- Autoplay Toggle -->
          <button
            type="button"
            :class="[
              'p-2 rounded-lg border transition hidden sm:flex items-center justify-center',
              autoplay ? 'border-purple-400/50 bg-purple-500/20 text-purple-200' : 'border-white/10 text-white/60 hover:text-white hover:bg-white/5',
            ]"
            title="Toggle autoplay"
            @click="toggleAutoplay"
          >
            <svg v-if="autoplay" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          <!-- Restart -->
          <button
            type="button"
            class="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition hidden sm:flex items-center justify-center"
            title="Restart demo"
            @click="restart"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>

          <!-- Copy Link -->
          <button
            type="button"
            class="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition hidden sm:flex items-center justify-center"
            title="Copy demo link"
            @click="copyDemoLink"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Divider -->
      <div class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <!-- Row 2: Demo Steps Navigation -->
      <nav class="shrink-0 h-12 bg-black/80 backdrop-blur-sm flex items-center px-4 lg:px-6 border-b border-white/5">
        <!-- Steps (scrollable on mobile) -->
        <div class="flex-1 overflow-x-auto scrollbar-hide">
          <div class="flex justify-center min-w-max">
            <DemoStepIndicator
              :scenes="SCENES"
              :current-index="sceneIndex"
              @go="goToScene"
            />
          </div>
        </div>

        <!-- Next Button (always visible, right aligned) -->
        <div class="shrink-0 ml-4 hidden sm:flex items-center gap-2">
          <button
            type="button"
            :disabled="isLastScene"
            :class="[
              'px-4 py-1.5 rounded-lg border text-sm font-medium transition',
              isLastScene
                ? 'border-white/10 text-white/30 cursor-not-allowed'
                : 'border-purple-400/50 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30',
            ]"
            @click="nextScene"
          >
            {{ isLastScene ? 'Done' : 'Next →' }}
          </button>
        </div>
      </nav>
    </div>

    <!-- Explore Mode: Side Nav -->
    <div v-if="mode === 'explore'" class="hidden lg:block fixed left-0 top-[6.5rem] bottom-16 w-48 border-r border-white/10 bg-black/60 backdrop-blur-sm z-40 p-4">
      <div class="text-white/40 text-xs uppercase tracking-wider mb-3">Scenes</div>
      <nav class="space-y-1">
        <button
          v-for="(scene, idx) in SCENES"
          :key="scene.key"
          type="button"
          :class="[
            'w-full text-left px-3 py-2 rounded-lg text-sm transition',
            idx === sceneIndex
              ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
              : 'text-white/70 hover:bg-white/5 hover:text-white',
          ]"
          @click="goToScene(scene.key)"
        >
          {{ scene.label }}
        </button>
      </nav>
    </div>

    <!-- Main Canvas -->
    <main
      :class="[
        'flex-1 overflow-y-auto overflow-x-hidden',
        mode === 'explore' ? 'lg:ml-48' : '',
      ]"
    >
      <div class="min-h-full flex items-start justify-center py-6 px-4 lg:px-8">
        <div class="w-full max-w-6xl">
          <Transition name="scene" mode="out-in">
            <slot :scene-key="currentSceneKey" />
          </Transition>
        </div>
      </div>
    </main>

    <!-- Bottom Bar -->
    <footer class="shrink-0 h-16 border-t border-white/10 bg-black/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 z-50">
      <!-- Left: Caption -->
      <div class="text-white/60 text-sm truncate max-w-[50%]">
        {{ currentScene?.caption }}
      </div>

      <!-- Right: Navigation -->
      <div class="flex items-center gap-3">
        <span class="text-white/40 text-xs hidden sm:inline">← → / Space</span>
        <button
          type="button"
          :disabled="isFirstScene"
          :class="[
            'px-4 py-2 rounded-lg border text-sm font-medium transition',
            isFirstScene
              ? 'border-white/10 text-white/30 cursor-not-allowed'
              : 'border-white/20 text-white hover:bg-white/5',
          ]"
          @click="prevScene"
        >
          Prev
        </button>
        <button
          type="button"
          :disabled="isLastScene"
          :class="[
            'px-4 py-2 rounded-lg border text-sm font-medium transition',
            isLastScene
              ? 'border-white/10 text-white/30 cursor-not-allowed'
              : 'border-purple-400/50 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30',
          ]"
          @click="nextScene"
        >
          {{ isLastScene ? 'Done' : 'Next' }}
        </button>
      </div>
    </footer>

    <!-- Toasts -->
    <DemoToast :toasts="toasts" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useDemoShow } from '@/composables/useDemoShow'

const {
  mode,
  sceneIndex,
  autoplay,
  toasts,
  currentScene,
  currentSceneKey,
  isFirstScene,
  isLastScene,
  SCENES,
  nextScene,
  prevScene,
  goToScene,
  restart,
  setMode,
  toggleAutoplay,
  copyDemoLink,
} = useDemoShow()

// Keyboard shortcuts (story mode only)
function handleKeydown(e) {
  if (mode.value !== 'story') return
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

  switch (e.key) {
    case 'ArrowRight':
    case ' ':
      e.preventDefault()
      nextScene()
      break
    case 'ArrowLeft':
      e.preventDefault()
      prevScene()
      break
    case 'r':
    case 'R':
      restart()
      break
    case 'e':
    case 'E':
      setMode(mode.value === 'story' ? 'explore' : 'story')
      break
    case 'f':
    case 'F':
      toggleFullscreen()
      break
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.scene-enter-active,
.scene-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.scene-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.scene-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
