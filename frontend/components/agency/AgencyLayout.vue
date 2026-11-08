<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
    <!-- Main Layout -->
    <div class="flex min-h-screen">
      <!-- Desktop Sidebar -->
      <AgencySidebar class="hidden lg:flex" />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-h-screen lg:ml-64">
        <!-- Header -->
        <header class="sticky top-0 z-40 bg-gray-950 backdrop-blur-md border-b border-gray-800">
          <div class="px-4 lg:px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button 
                @click="mobileMenuOpen = true"
                class="lg:hidden p-2 text-gray-400 hover:text-white"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 class="text-lg font-semibold text-white">{{ store.org.name }}</h1>
                <span class="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">V1 (Mock)</span>
              </div>
            </div>
<!-- Demo badge -->
            <span class="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">Demo Mode</span>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 pt-2">
          <slot />
        </main>
      </div>

      <!-- Mobile Navigation -->
      <AgencyMobileNav />

      <!-- Mobile Menu Overlay -->
      <Teleport to="body">
        <Transition name="fade">
          <div 
            v-if="mobileMenuOpen" 
            class="fixed inset-0 z-50 lg:hidden"
          >
            <div class="absolute inset-0 bg-black/60" @click="mobileMenuOpen = false" />
            <div class="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800">
              <AgencySidebar @navigate="mobileMenuOpen = false" :is-mobile="true" />
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

const store = useAgencyPortalStore()
const mobileMenuOpen = ref(false)
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
