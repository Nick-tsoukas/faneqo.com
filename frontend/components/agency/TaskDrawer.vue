<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />
        
        <!-- Drawer -->
        <div class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-gray-900 border-l border-gray-800 flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 class="text-white font-semibold">{{ editingTask ? 'Edit Task' : 'Create Task' }}</h2>
              <p v-if="band" class="text-gray-400 text-sm">{{ band.name }}</p>
            </div>
            <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4">
            <form @submit.prevent="saveTask" class="space-y-4">
              <!-- Title -->
              <div>
                <label class="block text-sm text-gray-400 mb-2">Task Title</label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="e.g., Follow up on Austin momentum"
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  required
                />
              </div>

              <!-- Signal Context -->
              <div v-if="signal" class="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                <div class="text-xs text-gray-500 mb-1">Related Signal</div>
                <div class="text-sm text-white font-medium">{{ signal.headline }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ signal.proof }}</div>
              </div>

              <!-- Assignee -->
              <div>
                <label class="block text-sm text-gray-400 mb-2">Assign To</label>
                <select
                  v-model="form.ownerId"
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Unassigned</option>
                  <option v-for="member in agents" :key="member.id" :value="member.id">
                    {{ member.name }}
                  </option>
                </select>
              </div>

              <!-- Due Date -->
              <div>
                <label class="block text-sm text-gray-400 mb-2">Due Date</label>
                <input
                  v-model="form.dueAt"
                  type="date"
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm text-gray-400 mb-2">Notes (optional)</label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  placeholder="Additional context or instructions..."
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
                >
                  {{ editingTask ? 'Save Changes' : 'Create Task' }}
                </button>
              </div>
            </form>

            <!-- Delete Button (edit mode) -->
            <button
              v-if="editingTask"
              @click="deleteTask"
              class="w-full mt-4 px-4 py-3 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
            >
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

const props = defineProps({
  isOpen: Boolean,
  bandId: String,
  signal: Object,
  editingTask: Object
})

const emit = defineEmits(['close', 'created', 'updated', 'deleted'])

const store = useAgencyPortalStore()

const defaultForm = () => ({
  title: '',
  ownerId: '',
  dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: ''
})

const form = ref(defaultForm())

watch(() => props.isOpen, (open) => {
  if (open) {
    if (props.editingTask) {
      form.value = {
        title: props.editingTask.title,
        ownerId: props.editingTask.ownerId || '',
        dueAt: props.editingTask.dueAt?.split('T')[0] || '',
        notes: props.editingTask.notes || ''
      }
    } else {
      form.value = defaultForm()
      if (props.signal) {
        form.value.title = `Follow up: ${props.signal.headline}`
      }
    }
  }
})

const band = computed(() => {
  const id = props.bandId || props.editingTask?.bandId
  if (!id) return null
  return store.getBandById(id)
})

const agents = computed(() => {
  return store.members.filter(m => ['admin', 'agent'].includes(m.role))
})

function saveTask() {
  if (props.editingTask) {
    store.updateTask(props.editingTask.id, {
      title: form.value.title,
      ownerId: form.value.ownerId || null,
      dueAt: form.value.dueAt ? new Date(form.value.dueAt).toISOString() : null,
      notes: form.value.notes
    })
    emit('updated', props.editingTask.id)
  } else {
    const task = store.createTask({
      title: form.value.title,
      bandId: props.bandId,
      signalId: props.signal?.id,
      ownerId: form.value.ownerId || null,
      dueAt: form.value.dueAt ? new Date(form.value.dueAt).toISOString() : null,
      notes: form.value.notes
    })
    emit('created', task)
  }
  emit('close')
}

function deleteTask() {
  if (props.editingTask && confirm('Delete this task?')) {
    store.deleteTask(props.editingTask.id)
    emit('deleted', props.editingTask.id)
    emit('close')
  }
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>
