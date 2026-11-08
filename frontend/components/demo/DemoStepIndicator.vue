<template>
  <div class="flex items-center gap-1 sm:gap-2">
    <template v-for="(scene, idx) in scenes" :key="scene.key">
      <button
        type="button"
        :class="[
          'px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-all duration-200',
          idx === currentIndex
            ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
            : idx < currentIndex
              ? 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/15'
              : 'bg-black/20 text-white/40 border border-white/10 hover:bg-white/10',
        ]"
        @click="$emit('go', scene.key)"
      >
        <span class="hidden sm:inline">{{ scene.label }}</span>
        <span class="sm:hidden">{{ idx + 1 }}</span>
      </button>
      <div
        v-if="idx < scenes.length - 1"
        :class="[
          'w-4 sm:w-6 h-px transition-colors duration-200',
          idx < currentIndex ? 'bg-purple-400/50' : 'bg-white/20',
        ]"
      />
    </template>
  </div>
</template>

<script setup>
defineProps({
  scenes: {
    type: Array,
    required: true,
  },
  currentIndex: {
    type: Number,
    default: 0,
  },
})

defineEmits(['go'])
</script>
