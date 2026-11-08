<template>
  <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
    <div class="flex items-start gap-3 mb-4">
      <div class="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <div>
        <div class="text-xs text-violet-400 uppercase tracking-wide mb-1">Suggested Playbook</div>
        <h3 class="text-white font-semibold">{{ playbook.name }}</h3>
        <p class="text-gray-400 text-sm mt-1">{{ playbook.description }}</p>
      </div>
    </div>

    <!-- Steps -->
    <div class="space-y-2">
      <div 
        v-for="(step, idx) in playbook.steps" 
        :key="idx"
        class="flex items-start gap-3 p-2 bg-gray-800/30 rounded-lg"
      >
        <div class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
          {{ idx + 1 }}
        </div>
        <span class="text-sm text-gray-300">{{ step }}</span>
      </div>
    </div>

    <!-- Action -->
    <button 
      v-if="showCreateTask"
      @click="$emit('createTask')"
      class="w-full mt-4 px-4 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Create Task from Playbook
    </button>
  </div>
</template>

<script setup>
defineProps({
  playbook: {
    type: Object,
    required: true
  },
  showCreateTask: {
    type: Boolean,
    default: true
  }
})

defineEmits(['createTask'])
</script>
