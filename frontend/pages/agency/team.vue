<template>
  <AgencyLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white mb-2">Team</h1>
        <p class="text-gray-400">Your organization's team members</p>
      </div>

      <!-- Org Info -->
      <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <span class="text-white font-bold text-xl">{{ store.org.name.charAt(0) }}</span>
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">{{ store.org.name }}</h2>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-sm text-gray-400">{{ store.members.length }} members</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30">
                {{ store.org.plan }} plan
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Members -->
      <div class="space-y-3">
        <div 
          v-for="member in store.members" 
          :key="member.id"
          class="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center gap-4"
        >
          <!-- Avatar -->
          <div 
            class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium"
            :class="avatarClass(member.role)"
          >
            {{ member.name.split(' ').map(n => n[0]).join('') }}
          </div>

          <!-- Info -->
          <div class="flex-1">
            <div class="text-white font-medium">{{ member.name }}</div>
            <div class="text-sm text-gray-500">{{ member.email }}</div>
          </div>

          <!-- Role Badge -->
          <span 
            class="text-xs px-3 py-1.5 rounded-full font-medium"
            :class="roleClass(member.role)"
          >
            {{ member.role }}
          </span>

          <!-- Stats -->
          <div class="hidden sm:flex items-center gap-4 text-center">
            <div>
              <div class="text-lg font-bold text-white">{{ getAssignedCount(member.id) }}</div>
              <div class="text-xs text-gray-500">Artists</div>
            </div>
            <div>
              <div class="text-lg font-bold text-white">{{ getTaskCount(member.id) }}</div>
              <div class="text-xs text-gray-500">Tasks</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Role Legend -->
      <div class="mt-8 p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
        <h3 class="text-sm font-medium text-gray-400 mb-3">Role Permissions</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2"></span>
            <span class="text-amber-400 font-medium">Admin</span>
            <p class="text-gray-500 text-xs mt-1">Full access, manage team</p>
          </div>
          <div>
            <span class="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
            <span class="text-blue-400 font-medium">Agent</span>
            <p class="text-gray-500 text-xs mt-1">Manage assigned artists</p>
          </div>
          <div>
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
            <span class="text-emerald-400 font-medium">Analyst</span>
            <p class="text-gray-500 text-xs mt-1">View analytics, reports</p>
          </div>
          <div>
            <span class="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
            <span class="text-gray-400 font-medium">Viewer</span>
            <p class="text-gray-500 text-xs mt-1">Read-only access</p>
          </div>
        </div>
      </div>

      <!-- Mock Notice -->
      <div class="mt-6 p-4 bg-violet-600/10 border border-violet-500/30 rounded-xl text-center">
        <p class="text-violet-400 text-sm">
          Team management is view-only in V1 (Mock). 
          Invite and role changes coming in future release.
        </p>
      </div>
    </div>
  </AgencyLayout>
</template>

<script setup>
import { useAgencyPortalStore } from '~/stores/agencyPortal'

definePageMeta({
  layout: 'agency'
})

useHead({
  title: 'Team - Agency Portal',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const store = useAgencyPortalStore()

function avatarClass(role) {
  const classes = {
    admin: 'bg-amber-600/20 text-amber-400',
    agent: 'bg-blue-600/20 text-blue-400',
    analyst: 'bg-emerald-600/20 text-emerald-400',
    viewer: 'bg-gray-600/20 text-gray-400'
  }
  return classes[role] || classes.viewer
}

function roleClass(role) {
  const classes = {
    admin: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    agent: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    analyst: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    viewer: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
  }
  return classes[role] || classes.viewer
}

function getAssignedCount(memberId) {
  let count = 0
  store.rosterBands.forEach(band => {
    const ownerId = store.assignments[band.bandId] || band.ownerId
    if (ownerId === memberId) count++
  })
  return count
}

function getTaskCount(memberId) {
  return store.tasks.filter(t => t.ownerId === memberId && t.status !== 'done').length
}
</script>
