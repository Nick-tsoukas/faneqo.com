<template>
  <AgencyLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">Tasks & Accountability</h1>
          <p class="text-gray-400">Track and manage tasks across your roster</p>
        </div>
        <button 
          @click="openCreateTask"
          class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-amber-400">{{ tasksByStatus.open.length }}</div>
          <div class="text-sm text-gray-500">Open</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-red-400">{{ tasksByStatus.overdue.length }}</div>
          <div class="text-sm text-gray-500">Overdue</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
          <div class="text-3xl font-bold text-emerald-400">{{ tasksByStatus.done.length }}</div>
          <div class="text-sm text-gray-500">Done</div>
        </div>
      </div>

      <!-- Overdue Tasks -->
      <div v-if="tasksByStatus.overdue.length" class="mb-6">
        <h2 class="text-red-400 font-semibold mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Overdue ({{ tasksByStatus.overdue.length }})
        </h2>
        <div class="space-y-2">
          <AgencyTaskRow 
            v-for="task in tasksByStatus.overdue" 
            :key="task.id" 
            :task="task"
            status="overdue"
            @toggle="toggleTask"
            @edit="editTask"
          />
        </div>
      </div>

      <!-- Open Tasks -->
      <div class="mb-6">
        <h2 class="text-white font-semibold mb-3">Open Tasks ({{ tasksByStatus.open.length }})</h2>
        <div class="space-y-2">
          <AgencyTaskRow 
            v-for="task in tasksByStatus.open" 
            :key="task.id" 
            :task="task"
            status="open"
            @toggle="toggleTask"
            @edit="editTask"
          />
        </div>
        <div v-if="!tasksByStatus.open.length && !tasksByStatus.overdue.length" class="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl">
          No open tasks. Create one to get started.
        </div>
      </div>

      <!-- Completed Tasks -->
      <div v-if="tasksByStatus.done.length">
        <button 
          @click="showCompleted = !showCompleted"
          class="flex items-center gap-2 text-gray-400 hover:text-white mb-3 transition-colors"
        >
          <svg 
            class="w-4 h-4 transition-transform" 
            :class="{ 'rotate-90': showCompleted }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          Completed ({{ tasksByStatus.done.length }})
        </button>
        <div v-if="showCompleted" class="space-y-2">
          <AgencyTaskRow 
            v-for="task in tasksByStatus.done" 
            :key="task.id" 
            :task="task"
            status="done"
            @toggle="toggleTask"
            @edit="editTask"
          />
        </div>
      </div>
    </div>

    <!-- Task Drawer -->
    <AgencyTaskDrawer
      :is-open="taskDrawerOpen"
      :band-id="selectedBandId"
      :editing-task="editingTask"
      @close="closeTaskDrawer"
    />

    <!-- Band Selector Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="bandSelectorOpen" class="fixed inset-0 z-50">
          <div class="absolute inset-0 bg-black/60" @click="bandSelectorOpen = false" />
          <div class="absolute inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-gray-900 border border-gray-800 rounded-2xl flex flex-col max-h-[80vh]">
            <div class="p-4 border-b border-gray-800">
              <h3 class="text-white font-semibold">Select Artist</h3>
              <input
                v-model="bandSearch"
                type="text"
                placeholder="Search artists..."
                class="w-full mt-3 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div class="flex-1 overflow-y-auto p-2">
              <button
                v-for="band in filteredBands"
                :key="band.bandId"
                @click="selectBandForTask(band.bandId)"
                class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <div class="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
                  <span class="text-gray-300 font-medium">{{ band.name.charAt(0) }}</span>
                </div>
                <div class="text-left">
                  <div class="text-white font-medium text-sm">{{ band.name }}</div>
                  <div class="text-gray-500 text-xs">{{ band.genre }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AgencyLayout>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

definePageMeta({
  layout: 'agency'
})

useHead({
  title: 'Tasks - Agency Portal',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const router = useRouter()
const store = useAgencyPortalStore()

const showCompleted = ref(false)
const taskDrawerOpen = ref(false)
const bandSelectorOpen = ref(false)
const selectedBandId = ref(null)
const editingTask = ref(null)
const bandSearch = ref('')

const tasksByStatus = computed(() => store.tasksByStatus)

const filteredBands = computed(() => {
  if (!bandSearch.value) return store.rosterBands
  const q = bandSearch.value.toLowerCase()
  return store.rosterBands.filter(b => 
    b.name.toLowerCase().includes(q) || 
    b.genre?.toLowerCase().includes(q)
  )
})

function openCreateTask() {
  bandSelectorOpen.value = true
  bandSearch.value = ''
}

function selectBandForTask(bandId) {
  selectedBandId.value = bandId
  bandSelectorOpen.value = false
  editingTask.value = null
  taskDrawerOpen.value = true
}

function editTask(task) {
  editingTask.value = task
  selectedBandId.value = task.bandId
  taskDrawerOpen.value = true
}

function closeTaskDrawer() {
  taskDrawerOpen.value = false
  editingTask.value = null
  selectedBandId.value = null
}

function toggleTask(task) {
  if (task.status === 'done') {
    store.updateTask(task.id, { status: 'open' })
  } else {
    store.completeTask(task.id)
  }
}

// TaskRow component inline
const TaskRow = {
  props: ['task', 'status'],
  emits: ['toggle', 'edit'],
  setup(props, { emit }) {
    const store = useAgencyPortalStore()
    const band = computed(() => store.getBandById(props.task.bandId))
    const owner = computed(() => store.getMemberById(props.task.ownerId))
    
    const statusClass = computed(() => {
      if (props.status === 'overdue') return 'border-red-500/30 bg-red-500/5'
      if (props.status === 'done') return 'opacity-60'
      return ''
    })

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return () => h('div', {
      class: ['flex items-center gap-3 p-3 bg-gray-900/60 border border-gray-800 rounded-xl', statusClass.value]
    }, [
      h('button', {
        onClick: () => emit('toggle', props.task),
        class: ['w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
          props.task.status === 'done' ? 'bg-emerald-600 border-emerald-600' : 'border-gray-600 hover:border-gray-500']
      }, props.task.status === 'done' ? [
        h('svg', { class: 'w-3 h-3 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M5 13l4 4L19 7' })
        ])
      ] : null),
      h('div', { class: 'flex-1 min-w-0' }, [
        h('div', { 
          class: ['text-sm text-white', props.task.status === 'done' ? 'line-through' : '']
        }, props.task.title),
        h('div', { class: 'flex items-center gap-2 mt-1 text-xs text-gray-500' }, [
          band.value ? h('span', {}, band.value.name) : null,
          props.task.dueAt ? h('span', {}, `Due ${formatDate(props.task.dueAt)}`) : null,
          owner.value ? h('span', {}, owner.value.name.split(' ')[0]) : null
        ].filter(Boolean))
      ]),
      h('button', {
        onClick: () => emit('edit', props.task),
        class: 'p-1.5 text-gray-500 hover:text-gray-300'
      }, [
        h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' })
        ])
      ])
    ])
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
