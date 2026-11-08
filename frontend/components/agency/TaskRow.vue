<template>
  <div 
    class="flex items-center gap-3 p-3 bg-gray-900/60 border border-gray-800 rounded-xl hover:border-gray-700 transition-all"
    :class="rowClass"
  >
    <!-- Checkbox -->
    <button 
      @click="$emit('toggle', task.id)"
      class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
      :class="checkboxClass"
    >
      <svg v-if="status === 'done'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span 
          class="text-sm font-medium"
          :class="status === 'done' ? 'text-gray-500 line-through' : 'text-white'"
        >
          {{ task.title }}
        </span>
        <span 
          v-if="status === 'overdue'"
          class="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
        >
          Overdue
        </span>
      </div>
      <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
        <span v-if="band">{{ band.name }}</span>
        <span v-if="task.dueAt">Due {{ formatDate(task.dueAt) }}</span>
        <span v-if="owner">{{ owner.name.split(' ')[0] }}</span>
      </div>
    </div>

    <!-- Edit Button -->
    <button 
      @click="$emit('edit', task)"
      class="p-2 text-gray-500 hover:text-white transition-colors"
      title="Edit Task"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    default: 'open'
  }
})

defineEmits(['toggle', 'edit'])

const store = useAgencyPortalStore()

const band = computed(() => store.getBandById(props.task.bandId))
const owner = computed(() => store.members.find(m => m.id === props.task.ownerId))

const rowClass = computed(() => {
  if (props.status === 'done') return 'opacity-60'
  if (props.status === 'overdue') return 'border-red-500/30'
  return ''
})

const checkboxClass = computed(() => {
  if (props.status === 'done') {
    return 'border-emerald-500 bg-emerald-500 text-white'
  }
  if (props.status === 'overdue') {
    return 'border-red-500 hover:bg-red-500/20'
  }
  return 'border-gray-600 hover:border-violet-500'
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays < -1) return `${Math.abs(diffDays)}d ago`
  if (diffDays <= 7) return `in ${diffDays}d`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
