<template>
  <div class="p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Execution</h1>
          <p class="text-white/50">Track projects and tasks</p>
        </div>
        <button 
          @click="showNewModal = true"
          class="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ activeTab === 'projects' ? 'New Project' : 'New Task' }}
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-white/5 rounded-xl p-1 mb-6 w-fit">
        <button 
          @click="activeTab = 'projects'"
          :class="activeTab === 'projects' ? 'bg-purple-500 text-white' : 'text-white/60 hover:text-white'"
          class="px-4 py-2 rounded-lg font-medium transition"
        >
          Projects
        </button>
        <button 
          @click="activeTab = 'tasks'"
          :class="activeTab === 'tasks' ? 'bg-purple-500 text-white' : 'text-white/60 hover:text-white'"
          class="px-4 py-2 rounded-lg font-medium transition"
        >
          Tasks
        </button>
      </div>

      <!-- Projects View -->
      <div v-if="activeTab === 'projects'" class="space-y-4">
        <div v-if="projects.length === 0" class="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-white font-semibold mb-2">No projects yet</h3>
          <p class="text-white/40 text-sm">Create your first project to start tracking execution</p>
        </div>

        <div 
          v-for="project in projects" 
          :key="project.id"
          @click="selectProject(project)"
          class="bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:border-purple-500/50 hover:bg-white/[0.07] transition-all"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div 
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-emerald-400': project.status === 'Active',
                  'bg-amber-400': project.status === 'Paused',
                  'bg-white/30': project.status === 'Done'
                }"
              ></div>
              <div>
                <h3 class="text-white font-semibold">{{ project.title }}</h3>
                <p class="text-white/40 text-sm">{{ project.owner || 'Unassigned' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span 
                class="text-xs font-medium px-2 py-1 rounded-full"
                :class="{
                  'bg-emerald-500/20 text-emerald-400': project.status === 'Active',
                  'bg-amber-500/20 text-amber-400': project.status === 'Paused',
                  'bg-white/10 text-white/50': project.status === 'Done'
                }"
              >
                {{ project.status }}
              </span>
              <span class="text-white/30 text-sm">{{ getProjectTaskCount(project.id) }} tasks</span>
              <svg class="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks View (Kanban) -->
      <div v-else class="grid grid-cols-3 gap-6">
        <div 
          v-for="column in taskColumns" 
          :key="column.status"
          class="bg-white/5 border border-white/10 rounded-2xl p-4"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-white font-semibold flex items-center gap-2">
              <div 
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-white/40': column.status === 'Backlog',
                  'bg-amber-400': column.status === 'Doing',
                  'bg-emerald-400': column.status === 'Done'
                }"
              ></div>
              {{ column.status }}
            </h3>
            <span class="text-white/30 text-sm">{{ getTasksByStatus(column.status).length }}</span>
          </div>
          
          <div class="space-y-3">
            <div 
              v-for="task in getTasksByStatus(column.status)" 
              :key="task.id"
              class="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition cursor-pointer"
              @click="selectTask(task)"
            >
              <h4 class="text-white font-medium mb-2">{{ task.title }}</h4>
              <div class="flex items-center justify-between">
                <span class="text-white/40 text-xs">{{ task.owner || 'Unassigned' }}</span>
                <span v-if="task.dueDate" class="text-white/30 text-xs">{{ task.dueDate }}</span>
              </div>
            </div>

            <div v-if="getTasksByStatus(column.status).length === 0" class="text-center py-8">
              <p class="text-white/30 text-sm">No tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Detail Drawer -->
    <Transition name="drawer">
      <div v-if="selectedProject" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="selectedProject = null"></div>
        <div class="relative w-full max-w-lg bg-gray-900 border-l border-white/10 h-full overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-white">{{ selectedProject.title }}</h2>
              <button @click="selectedProject = null" class="text-white/50 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <!-- Status -->
              <div>
                <label class="text-white/50 text-sm mb-2 block">Status</label>
                <div class="flex gap-2">
                  <button 
                    v-for="status in ['Active', 'Paused', 'Done']"
                    :key="status"
                    @click="updateProjectStatus(selectedProject.id, status)"
                    :class="selectedProject.status === status ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'"
                    class="px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    {{ status }}
                  </button>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="text-white/50 text-sm mb-2 block">Description</label>
                <p class="text-white/80">{{ selectedProject.description || 'No description' }}</p>
              </div>

              <!-- Tasks -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="text-white/50 text-sm">Tasks</label>
                  <button 
                    @click="addTaskToProject"
                    class="text-purple-400 text-sm hover:text-purple-300"
                  >
                    + Add Task
                  </button>
                </div>
                <div class="space-y-2">
                  <div 
                    v-for="task in getProjectTasks(selectedProject.id)" 
                    :key="task.id"
                    class="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                  >
                    <span class="text-white">{{ task.title }}</span>
                    <span 
                      class="text-xs px-2 py-0.5 rounded"
                      :class="{
                        'bg-white/10 text-white/50': task.status === 'Backlog',
                        'bg-amber-500/20 text-amber-400': task.status === 'Doing',
                        'bg-emerald-500/20 text-emerald-400': task.status === 'Done'
                      }"
                    >
                      {{ task.status }}
                    </span>
                  </div>
                  <div v-if="getProjectTasks(selectedProject.id).length === 0" class="text-white/30 text-sm text-center py-4">
                    No tasks yet
                  </div>
                </div>
              </div>

              <!-- Delete -->
              <button 
                @click="deleteProject(selectedProject.id)"
                class="w-full py-2 text-red-400 hover:text-red-300 text-sm"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- New Project/Task Modal -->
    <Transition name="modal">
      <div v-if="showNewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showNewModal = false"></div>
        <div class="relative bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
          <h2 class="text-xl font-bold text-white mb-6">
            {{ activeTab === 'projects' ? 'New Project' : 'New Task' }}
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-white/50 text-sm mb-2 block">Title</label>
              <input 
                v-model="newItem.title"
                type="text"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none"
                :placeholder="activeTab === 'projects' ? 'Project name' : 'Task name'"
              />
            </div>

            <div v-if="activeTab === 'projects'">
              <label class="text-white/50 text-sm mb-2 block">Description</label>
              <textarea 
                v-model="newItem.description"
                rows="3"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none resize-none"
                placeholder="Project description"
              ></textarea>
            </div>

            <div>
              <label class="text-white/50 text-sm mb-2 block">Owner</label>
              <input 
                v-model="newItem.owner"
                type="text"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none"
                placeholder="Owner name"
              />
            </div>

            <div v-if="activeTab === 'tasks'">
              <label class="text-white/50 text-sm mb-2 block">Project</label>
              <select 
                v-model="newItem.projectId"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">No project</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
              </select>
            </div>

            <div v-if="activeTab === 'tasks'">
              <label class="text-white/50 text-sm mb-2 block">Due Date (optional)</label>
              <input 
                v-model="newItem.dueDate"
                type="date"
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button 
              @click="showNewModal = false"
              class="flex-1 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button 
              @click="createItem"
              :disabled="!newItem.title"
              class="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'corvana'
})

const activeTab = ref('projects')
const showNewModal = ref(false)
const selectedProject = ref(null)
const selectedTask = ref(null)

const projects = ref([])
const tasks = ref([])

const taskColumns = [
  { status: 'Backlog' },
  { status: 'Doing' },
  { status: 'Done' }
]

const newItem = ref({
  title: '',
  description: '',
  owner: '',
  projectId: '',
  dueDate: ''
})

// Load from localStorage
onMounted(() => {
  loadData()
})

const loadData = () => {
  try {
    projects.value = JSON.parse(localStorage.getItem('corvana_projects') || '[]')
    tasks.value = JSON.parse(localStorage.getItem('corvana_tasks') || '[]')
  } catch (e) {
    projects.value = []
    tasks.value = []
  }
}

const saveData = () => {
  localStorage.setItem('corvana_projects', JSON.stringify(projects.value))
  localStorage.setItem('corvana_tasks', JSON.stringify(tasks.value))
}

const createItem = () => {
  if (!newItem.value.title) return

  if (activeTab.value === 'projects') {
    const project = {
      id: Date.now().toString(),
      title: newItem.value.title,
      description: newItem.value.description,
      owner: newItem.value.owner,
      status: 'Active',
      createdAt: new Date().toISOString()
    }
    projects.value.push(project)
  } else {
    const task = {
      id: Date.now().toString(),
      title: newItem.value.title,
      owner: newItem.value.owner,
      projectId: newItem.value.projectId,
      dueDate: newItem.value.dueDate,
      status: 'Backlog',
      createdAt: new Date().toISOString()
    }
    tasks.value.push(task)
  }

  saveData()
  showNewModal.value = false
  newItem.value = { title: '', description: '', owner: '', projectId: '', dueDate: '' }
}

const selectProject = (project) => {
  selectedProject.value = project
}

const selectTask = (task) => {
  selectedTask.value = task
}

const updateProjectStatus = (projectId, status) => {
  const project = projects.value.find(p => p.id === projectId)
  if (project) {
    project.status = status
    selectedProject.value = { ...project }
    saveData()
  }
}

const deleteProject = (projectId) => {
  projects.value = projects.value.filter(p => p.id !== projectId)
  tasks.value = tasks.value.filter(t => t.projectId !== projectId)
  selectedProject.value = null
  saveData()
}

const getProjectTasks = (projectId) => {
  return tasks.value.filter(t => t.projectId === projectId)
}

const getProjectTaskCount = (projectId) => {
  return tasks.value.filter(t => t.projectId === projectId).length
}

const getTasksByStatus = (status) => {
  return tasks.value.filter(t => t.status === status)
}

const addTaskToProject = () => {
  newItem.value.projectId = selectedProject.value.id
  activeTab.value = 'tasks'
  selectedProject.value = null
  showNewModal.value = true
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
