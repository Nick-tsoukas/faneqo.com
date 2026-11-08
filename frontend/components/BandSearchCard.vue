<template>
  <component
    :is="linkResults ? 'NuxtLink' : 'button'"
    :to="linkResults ? `/${band.slug}` : undefined"
    :type="linkResults ? undefined : 'button'"
    class="group relative block w-full text-left overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
    @click="$emit('select', band)"
  >
    <!-- Glow effect on hover -->
    <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
      <div class="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-purple-600/20 blur-xl"></div>
    </div>

    <!-- Card content -->
    <div class="relative flex items-center gap-4 p-4">
      <!-- Band image with glow -->
      <div class="relative shrink-0">
        <div class="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-gray-900 ring-2 ring-white/10 group-hover:ring-purple-500/50 transition-all duration-300">
          <img
            v-if="band.imageUrl"
            :src="band.imageUrl"
            :alt="band.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg class="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Band info -->
      <div class="flex-1 min-w-0">
        <h3 class="text-white font-bold text-lg md:text-xl truncate group-hover:text-purple-300 transition-colors duration-300">
          {{ band.name }}
        </h3>
        
        <!-- Genre tag -->
        <div v-if="band.genre" class="mt-1">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {{ band.genre }}
          </span>
        </div>

        <!-- Bio preview -->
        <p v-if="band.bio" class="mt-2 text-white/50 text-sm line-clamp-2 leading-relaxed">
          {{ band.bio }}
        </p>
      </div>

      <!-- Arrow indicator -->
      <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <div class="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Bottom gradient accent -->
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </component>
</template>

<script setup>
defineProps({
  band: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  linkResults: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['select'])
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
