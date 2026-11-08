// ~/composables/useVideoModeToggles.js
// Reactive toggles for marketer video mode (persisted in localStorage)
// Used by Header.vue (toggle controls) and dashboard.vue (show/hide cards)

import { ref, watch } from 'vue'

const STORAGE_KEY = 'mbq_video_mode'

// Module-level singletons so all consumers share the same reactive state
const hideMetrics = ref(false)
const showDemoRecap = ref(false)
const initialized = ref(false)

function loadFromStorage() {
  if (initialized.value) return
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      hideMetrics.value = !!parsed.hideMetrics
      showDemoRecap.value = !!parsed.showDemoRecap
    }
  } catch (e) {
    // ignore
  }
  initialized.value = true
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      hideMetrics: hideMetrics.value,
      showDemoRecap: showDemoRecap.value,
    }))
  } catch (e) {
    // ignore
  }
}

export function useVideoModeToggles() {
  loadFromStorage()

  watch([hideMetrics, showDemoRecap], () => {
    persist()
  })

  return {
    hideMetrics,
    showDemoRecap,
  }
}
