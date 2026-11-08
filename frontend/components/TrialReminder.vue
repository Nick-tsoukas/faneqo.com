<!-- ~/components/TrialReminder.vue
-------------------------------------------------------------------
Dismissible pop‑up that reminds the user how many days remain
in their free trial and links to your billing page.
------------------------------------------------------------------- -->
<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <div
          class="w-11/12 max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          @click.stop
        >
          <h2 class="mb-2 text-xl font-semibold text-gray-900">
            {{ headline }}
          </h2>

          <p class="mb-6 text-gray-700">
            {{ message }}
          </p>

          <div class="flex justify-end gap-2">
            <button
              class="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              @click="skipForToday"
            >
              Remind me later
            </button>

            <!-- Adjust this link to wherever users upgrade -->
            <NuxtLink
              to="/account/billing"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
            >
              Upgrade now
            </NuxtLink>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTrial } from '~/composables/useTrial'

/* -------------------------------------------
   Trial countdown
------------------------------------------- */
const { daysLeft } = useTrial()

/* -------------------------------------------
   Modal visibility logic
------------------------------------------- */
const show = ref(false)
const SKIP_KEY = 'trial-reminder-dismissed' // sessionStorage key

const shouldShow = () => {
  if (typeof window === 'undefined') return false
  if (!daysLeft.value || daysLeft.value < 0) return false
  if (sessionStorage.getItem(SKIP_KEY)) return false
  return true
}

const skipForToday = () => {
  sessionStorage.setItem(SKIP_KEY, '1')
  show.value = false
}

onMounted(() => {
  show.value = shouldShow()
})

/* -------------------------------------------
   Text helpers
------------------------------------------- */
const headline = computed(() =>
  daysLeft.value === 0
    ? 'Trial expired'
    : `Only ${daysLeft.value} day${daysLeft.value === 1 ? '' : 's'} left!`
)

const message = computed(() =>
  daysLeft.value === 0
    ? 'Your 30‑day free trial has ended. Subscribe now to keep all features.'
    : 'Enjoying the app? Upgrade before your trial ends to keep uninterrupted access.'
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
