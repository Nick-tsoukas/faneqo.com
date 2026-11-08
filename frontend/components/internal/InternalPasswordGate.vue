<template>
  <div v-if="!isAuthed" class="min-h-screen bg-black flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="bg-gray-900 rounded-2xl border border-white/10 p-8">
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-white">MBQ Internal</h1>
          <p class="text-white/50 text-sm mt-1">Enter password to continue</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <input
              v-model="password"
              type="password"
              placeholder="Password"
              class="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
              :class="{ 'border-red-500': error }"
              autofocus
            />
            <p v-if="error" class="text-red-400 text-xs mt-2">{{ error }}</p>
          </div>

          <button
            type="submit"
            class="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-500 hover:to-blue-500 transition-all"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  </div>

  <slot v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'mbq_internal_shareables_authed'
const CORRECT_PASSWORD = 'password101'

const isAuthed = ref(false)
const password = ref('')
const error = ref('')

onMounted(() => {
  if (typeof window !== 'undefined') {
    isAuthed.value = localStorage.getItem(STORAGE_KEY) === 'true'
  }
})

function handleSubmit() {
  error.value = ''
  
  if (password.value === CORRECT_PASSWORD) {
    localStorage.setItem(STORAGE_KEY, 'true')
    isAuthed.value = true
  } else {
    error.value = 'Incorrect password'
    password.value = ''
  }
}
</script>
