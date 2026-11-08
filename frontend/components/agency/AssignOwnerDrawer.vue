<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />
        
        <!-- Drawer -->
        <div class="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-gray-900 border-l border-gray-800 flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 class="text-white font-semibold">Assign Owner</h2>
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
            <div class="space-y-2">
              <button
                v-for="member in agents"
                :key="member.id"
                @click="assignMember(member.id)"
                class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all"
                :class="[
                  currentOwnerId === member.id
                    ? 'bg-violet-600/20 border-violet-500/50 text-white'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                ]"
              >
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                  :class="[
                    currentOwnerId === member.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  ]"
                >
                  {{ member.name.split(' ').map(n => n[0]).join('') }}
                </div>
                <div class="flex-1 text-left">
                  <div class="font-medium">{{ member.name }}</div>
                  <div class="text-xs text-gray-500">{{ member.email }}</div>
                </div>
                <span 
                  class="text-xs px-2 py-1 rounded-full"
                  :class="roleClass(member.role)"
                >
                  {{ member.role }}
                </span>
                <svg 
                  v-if="currentOwnerId === member.id"
                  class="w-5 h-5 text-violet-400" 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>

            <!-- Unassign Option -->
            <button
              v-if="currentOwnerId"
              @click="unassign"
              class="w-full mt-4 p-3 text-center text-sm text-gray-400 hover:text-gray-300 border border-dashed border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
            >
              Remove assignment
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

const props = defineProps({
  isOpen: Boolean,
  bandId: String
})

const emit = defineEmits(['close', 'assigned'])

const store = useAgencyPortalStore()

const band = computed(() => {
  if (!props.bandId) return null
  return store.getBandById(props.bandId)
})

const agents = computed(() => {
  return store.members.filter(m => ['admin', 'agent'].includes(m.role))
})

const currentOwnerId = computed(() => {
  if (!props.bandId) return null
  return store.assignments[props.bandId] || band.value?.ownerId
})

function roleClass(role) {
  const classes = {
    admin: 'bg-amber-500/20 text-amber-400',
    agent: 'bg-blue-500/20 text-blue-400',
    analyst: 'bg-emerald-500/20 text-emerald-400',
    viewer: 'bg-gray-500/20 text-gray-400'
  }
  return classes[role] || classes.viewer
}

function assignMember(memberId) {
  store.assignBand(props.bandId, memberId)
  emit('assigned', memberId)
  emit('close')
}

function unassign() {
  store.assignBand(props.bandId, null)
  emit('assigned', null)
  emit('close')
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
