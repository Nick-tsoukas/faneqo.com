<template>
  <div class="showtime-stage-wrapper relative w-full">
    <!-- Director Bar -->
    <div class="director-bar absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
      <!-- Play/Pause -->
      <button 
        @click="isPlaying ? pause() : play()"
        class="p-2 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white"
        :title="isPlaying ? 'Pause' : 'Play'"
      >
        <svg v-if="!isPlaying" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
      </button>

      <!-- Restart -->
      <button 
        @click="restart"
        class="p-2 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white"
        title="Restart"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      <!-- Next Beat -->
      <button 
        @click="nextBeat"
        class="p-2 rounded-lg hover:bg-white/10 transition text-white/80 hover:text-white"
        title="Next beat"
        :disabled="isDone"
        :class="{ 'opacity-50 cursor-not-allowed': isDone }"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5v14l11-7L5 5zm11 0v14h3V5h-3z" />
        </svg>
      </button>

      <!-- Divider -->
      <div class="w-px h-5 bg-white/20" />

      <!-- Speed -->
      <select 
        :value="speed"
        @change="setSpeed(Number($event.target.value))"
        class="bg-transparent text-white/80 text-xs border-none outline-none cursor-pointer"
      >
        <option value="0.5" class="bg-gray-900">0.5x</option>
        <option value="0.75" class="bg-gray-900">0.75x</option>
        <option value="1" class="bg-gray-900">1x</option>
        <option value="1.25" class="bg-gray-900">1.25x</option>
        <option value="1.5" class="bg-gray-900">1.5x</option>
      </select>

      <!-- Beat indicator -->
      <div class="text-white/40 text-xs font-mono ml-2">
        {{ beatLabel }}
      </div>
    </div>

    <!-- Main Stage -->
    <div class="stage relative mx-auto max-w-[1200px] min-h-[640px] bg-gradient-to-br from-gray-950 via-black to-gray-950 border border-white/10 rounded-3xl overflow-hidden">
      <!-- Inner glow -->
      <div class="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-purple-900/5 pointer-events-none" />
      <div class="absolute inset-0 shadow-[inset_0_0_100px_rgba(139,92,246,0.05)] pointer-events-none" />

      <!-- Layer 1: Smart Link Panel -->
      <div 
        class="layer-smart-link absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
        :style="{ 
          opacity: smartLinkOpacity,
          filter: `blur(${smartLinkBlur}px)`,
          transform: smartLinkOpacity < 1 ? 'scale(0.92)' : 'scale(1)'
        }"
      >
        <SmartLinkPanelPlaceholder />
      </div>

      <!-- Layer 2: Shareables Conveyor -->
      <div class="layer-shareables absolute inset-0 pointer-events-none overflow-hidden">
        <TransitionGroup name="card-slide" tag="div" class="relative h-full">
          <div
            v-for="card in visibleCards"
            :key="card._instanceId || card.id"
            class="shareable-card-wrapper absolute top-1/2 transition-all duration-500 ease-out pointer-events-auto"
            :class="{ 'is-featured': featuredCard?._instanceId === card._instanceId && state === 'beat3' }"
            :style="getCardStyle(card)"
          >
            <ShareableCard
              :item="card"
              size="compact"
              @select="() => {}"
              @share="() => {}"
            />
          </div>
        </TransitionGroup>
      </div>

      <!-- Layer 3: Featured Shareable (takeover) -->
      <Transition name="featured-expand">
        <div 
          v-if="state === 'beat3' && featuredCard"
          class="layer-featured absolute inset-0 flex items-center justify-center z-20"
        >
          <div class="featured-card-container transform scale-125">
            <ShareableCard
              :item="featuredCard"
              @select="() => {}"
              @share="() => {}"
            />
          </div>
        </div>
      </Transition>

      <!-- Layer 4: Analytics Overlay -->
      <div 
        v-if="state === 'beat4' || state === 'done'"
        class="layer-analytics absolute inset-0 z-30 p-6 flex flex-col"
      >
        <!-- Top row: Pulse + Stats -->
        <div class="flex gap-4 mb-4">
          <!-- Pulse Card -->
          <Transition name="fade-up">
            <div v-if="showPulse" class="shrink-0">
              <DemoShowtimePulseCardPlaceholder />
            </div>
          </Transition>

          <!-- Stats Row -->
          <Transition name="fade-up">
            <div v-if="showStats" class="flex-1 flex items-start">
              <DemoShowtimeStatsRowPlaceholder />
            </div>
          </Transition>
        </div>

        <!-- Middle: Featured card (smaller) + Cities -->
        <div class="flex-1 flex gap-4 items-center justify-center">
          <!-- Centered featured (scaled down) -->
          <div 
            v-if="featuredCard"
            class="transform scale-75 opacity-60"
          >
            <ShareableCard
              :item="featuredCard"
              size="compact"
              @select="() => {}"
              @share="() => {}"
            />
          </div>

          <!-- Top Cities -->
          <Transition name="fade-left">
            <div v-if="showCities">
              <DemoShowtimeTopCitiesPlaceholder />
            </div>
          </Transition>
        </div>

        <!-- Bottom: Slider -->
        <Transition name="fade-up">
          <div v-if="showSlider" class="mt-auto -mx-6 -mb-6">
            <DemoShowtimeShareablesSliderPlaceholder />
          </div>
        </Transition>
      </div>

      <!-- Idle state: Play button overlay -->
      <Transition name="fade">
        <div 
          v-if="isIdle"
          class="absolute inset-0 flex items-center justify-center bg-black/40 z-40"
        >
          <button
            @click="play"
            class="group flex flex-col items-center gap-4"
          >
            <div class="w-20 h-20 rounded-full bg-purple-600/20 border-2 border-purple-400/50 flex items-center justify-center group-hover:bg-purple-600/30 group-hover:border-purple-400 transition-all duration-300 group-hover:scale-110">
              <svg class="w-8 h-8 text-purple-300 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span class="text-white/80 text-lg font-medium group-hover:text-white transition">Play Showtime</span>
          </button>
        </div>
      </Transition>

      <!-- Done state: Replay button -->
      <Transition name="fade">
        <div 
          v-if="isDone"
          class="absolute bottom-6 left-1/2 -translate-x-1/2 z-40"
        >
          <button
            @click="restart(); play()"
            class="flex items-center gap-2 px-5 py-2.5 bg-purple-600/20 border border-purple-400/50 rounded-full text-purple-200 hover:bg-purple-600/30 hover:border-purple-400 transition-all"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Replay</span>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, computed } from 'vue'
import { useDemoShowtime } from '@/composables/useDemoShowtime'
import ShareableCard from '@/components/shareables/ShareableCard.vue'
import SmartLinkPanelPlaceholder from '@/components/demo/showtime/SmartLinkPanelPlaceholder.vue'

const props = defineProps({
  autoplay: { type: Boolean, default: false }
})

const {
  state,
  speed,
  isPlaying,
  isIdle,
  isDone,
  visibleCards,
  featuredCard,
  showPulse,
  showStats,
  showCities,
  showSlider,
  smartLinkOpacity,
  smartLinkBlur,
  play,
  pause,
  restart,
  nextBeat,
  setSpeed,
} = useDemoShowtime()

const beatLabels = {
  idle: 'Ready',
  beat1: '1/4 · Smart Link',
  beat2: '2/4 · Shareables',
  beat3: '3/4 · Featured',
  beat4: '4/4 · Analytics',
  done: 'Complete',
}

const beatLabel = computed(() => beatLabels[state.value] || state.value)

function getCardStyle(card) {
  const baseRight = 80 // px from right edge for newest
  const offsetPerPosition = 220 // px shift left per position
  const opacityPerPosition = 0.25 // opacity reduction per position

  const translateX = baseRight + (card.position * offsetPerPosition)
  const opacity = Math.max(0.1, 1 - (card.position * opacityPerPosition))
  const scale = 1 - (card.position * 0.08)
  const zIndex = 10 - card.position

  return {
    right: `${translateX}px`,
    transform: `translateY(-50%) scale(${scale})`,
    opacity,
    zIndex,
  }
}

onMounted(() => {
  if (props.autoplay) {
    setTimeout(() => play(), 500)
  }
})
</script>

<style scoped>
.stage {
  box-shadow: 
    0 0 120px rgba(139, 92, 246, 0.08),
    0 50px 100px -30px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Card slide transitions */
.card-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-slide-leave-active {
  transition: all 0.4s ease-out;
}
.card-slide-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(100px) scale(0.9);
}
.card-slide-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-100px) scale(0.8);
}

/* Featured expand */
.featured-expand-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.featured-expand-leave-active {
  transition: all 0.4s ease-out;
}
.featured-expand-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.featured-expand-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

.featured-card-container {
  box-shadow: 0 0 100px rgba(139, 92, 246, 0.3);
}

/* Fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Fade up */
.fade-up-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-up-leave-active {
  transition: all 0.3s ease-out;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Fade left */
.fade-left-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-left-leave-active {
  transition: all 0.3s ease-out;
}
.fade-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.fade-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Featured card in conveyor */
.shareable-card-wrapper.is-featured {
  z-index: 25 !important;
  transform: translateY(-50%) scale(1.1) !important;
  opacity: 1 !important;
}
</style>
