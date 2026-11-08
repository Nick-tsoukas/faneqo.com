<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[1000] flex items-center justify-center"
        @keydown.esc="close"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm"
          @click="close"
          aria-hidden="true"
        ></div>

        <!-- Modal -->
        <div
          ref="modalEl"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelId"
          class="relative z-10 w-11/12 max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-neutral-900 to-black p-6 shadow-2xl"
          tabindex="-1"
        >
          <!-- Close button -->
          <button
            type="button"
            class="absolute top-4 right-4 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close"
            @click="close"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Header -->
          <div class="pr-8">
            <h2 :id="labelId" class="text-xl font-bold text-white">
              Stay connected with {{ bandName }}
            </h2>
            <p class="mt-1 text-sm text-white/70">
              Choose where you want to follow.
            </p>
          </div>

          <!-- Platform groups -->
          <div class="mt-6 space-y-5 max-h-[50vh] overflow-y-auto">
            <!-- Streaming -->
            <div v-if="streamingPlatforms.length">
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                Streaming
              </h3>
              <div class="space-y-2">
                <button
                  v-for="p in streamingPlatforms"
                  :key="p.id"
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  :class="
                    selected.has(p.id)
                      ? 'border-cyan-400/40 bg-[#111722]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  "
                  @click="toggle(p.id)"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"
                  >
                    <img
                      v-if="p.icon"
                      :src="p.icon"
                      :alt="p.name"
                      class="h-6 w-6 object-contain"
                    />
                    <span v-else class="text-lg">🎵</span>
                  </span>
                  <span class="flex-1 font-medium text-white">{{ p.name }}</span>
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-full border transition"
                    :class="
                      selected.has(p.id)
                        ? 'border-cyan-400 bg-[#39D5FF] text-[#050608]'
                        : 'border-white/20 bg-transparent'
                    "
                  >
                    <svg
                      v-if="selected.has(p.id)"
                      class="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            <!-- Social -->
            <div v-if="socialPlatforms.length">
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                Social
              </h3>
              <div class="space-y-2">
                <button
                  v-for="p in socialPlatforms"
                  :key="p.id"
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                  :class="
                    selected.has(p.id)
                      ? 'border-cyan-400/40 bg-[#111722]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  "
                  @click="toggle(p.id)"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"
                  >
                    <img
                      v-if="p.icon"
                      :src="p.icon"
                      :alt="p.name"
                      class="h-6 w-6 object-contain"
                    />
                    <span v-else class="text-lg">📱</span>
                  </span>
                  <span class="flex-1 font-medium text-white">{{ p.name }}</span>
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-full border transition"
                    :class="
                      selected.has(p.id)
                        ? 'border-cyan-400 bg-[#39D5FF] text-[#050608]'
                        : 'border-white/20 bg-transparent'
                    "
                  >
                    <svg
                      v-if="selected.has(p.id)"
                      class="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Select all (only if 3+ platforms) -->
          <div v-if="allPlatforms.length >= 3" class="mt-4 flex items-center gap-2">
            <button
              type="button"
              class="text-sm text-[#9AA6B5] hover:text-[#F7F9FC] focus:outline-none focus:underline"
              @click="selectAll"
            >
              {{ allSelected ? 'Deselect all' : 'Select all' }}
            </button>
          </div>

          <!-- Tip -->
          <p class="mt-4 text-xs text-white/50">
            Tip: pick the ones you actually use.
          </p>

          <!-- Fan Capture Section -->
          <div v-if="fanCaptureEnabled" class="mt-6 pt-5 border-t border-white/10">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-[#39D5FF]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span class="text-sm font-semibold text-white">{{ fanCaptureHeadline }}</span>
            </div>
            <p class="text-xs text-white/60 mb-3">{{ fanCaptureMessage }}</p>
            <div class="flex gap-2">
              <input
                v-model="fanEmail"
                type="email"
                placeholder="Enter your email"
                :disabled="fanLoading || fanSuccess"
                class="flex-1 px-3 py-2.5 rounded-lg bg-[#050608] border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50 disabled:opacity-60"
              />
              <button
                v-if="!fanSuccess"
                type="button"
                :disabled="fanLoading || !fanEmail"
                class="px-4 py-2.5 rounded-lg bg-[#111722] border border-cyan-400/35 text-white text-sm font-semibold transition hover:border-cyan-400/55 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                @click="handleFanSubscribe"
              >
                <span v-if="fanLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span v-else>{{ fanCaptureButtonLabel }}</span>
              </button>
              <div v-else class="px-4 py-2.5 rounded-lg bg-[#62F29D]/10 border border-[#62F29D]/30 text-[#62F29D] text-sm font-semibold flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                </svg>
                {{ fanCaptureSuccessMessage }}
              </div>
            </div>
            <p v-if="fanError" class="mt-2 text-xs text-red-400">{{ fanError }}</p>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex items-center gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl bg-[#111722] border border-white/15 px-4 py-3 font-semibold text-white transition hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="selected.size === 0"
              @click="confirmFollow"
            >
              Follow Selected
            </button>
            <button
              type="button"
              class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              @click="close"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  bandName: { type: String, default: '' },
  bandId: { type: [Number, String], default: null },
  bandSlug: { type: String, default: '' },
  platforms: {
    type: Array,
    default: () => [],
    // Each item: { id, name, url, category: 'streaming'|'social', icon? }
  },
  fanCaptureEnabled: { type: Boolean, default: true },
  fanCaptureHeadline: { type: String, default: 'Join the fan list' },
  fanCaptureMessage: { type: String, default: 'Get exclusive updates and first access to new releases.' },
  fanCaptureButtonLabel: { type: String, default: 'Join' },
  fanCaptureSuccessMessage: { type: String, default: "You're on the list!" },
})

const emit = defineEmits(['close', 'confirm', 'track', 'fan-subscribed'])

const config = useRuntimeConfig()

const labelId = `follow-modal-label-${Math.random().toString(36).slice(2, 9)}`
const modalEl = ref(null)
const selected = ref(new Set())

// Fan capture state
const fanEmail = ref('')
const fanLoading = ref(false)
const fanSuccess = ref(false)
const fanError = ref('')

async function handleFanSubscribe() {
  if (!fanEmail.value || fanLoading.value || fanSuccess.value) return

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(fanEmail.value)) {
    fanError.value = 'Please enter a valid email'
    return
  }

  fanLoading.value = true
  fanError.value = ''

  try {
    const { ensureSession, getVisitorToken } = useFanIdentity()
    await ensureSession().catch(() => {})

    const response = await fetch(`${config.public.strapiUrl}/api/fans/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fanEmail.value.trim().toLowerCase(),
        bandId: props.bandId,
        source: 'follow_modal',
        visitorToken: getVisitorToken() || undefined,
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result?.error?.message || 'Failed to subscribe')
    }

    fanSuccess.value = true
    emitTrack('fan_subscribe', { source: 'follow_modal' })
    emit('fan-subscribed', { email: fanEmail.value })
  } catch (err) {
    fanError.value = err.message || 'Something went wrong'
  } finally {
    fanLoading.value = false
  }
}

const streamingPlatforms = computed(() =>
  props.platforms.filter((p) => p.category === 'streaming')
)
const socialPlatforms = computed(() =>
  props.platforms.filter((p) => p.category === 'social')
)
const allPlatforms = computed(() => props.platforms)

const allSelected = computed(
  () => allPlatforms.value.length > 0 && selected.value.size === allPlatforms.value.length
)

function toggle(id) {
  const next = new Set(selected.value)
  if (next.has(id)) {
    next.delete(id)
    emitTrack('follow_platform_toggle', { platformId: id, action: 'deselect' })
  } else {
    next.add(id)
    emitTrack('follow_platform_toggle', { platformId: id, action: 'select' })
  }
  selected.value = next
}

function selectAll() {
  if (allSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(allPlatforms.value.map((p) => p.id))
  }
}

function close() {
  emit('close')
}

function confirmFollow() {
  const ids = Array.from(selected.value)
  emitTrack('follow_confirm', { platformIds: ids })
  emit('confirm', ids)
}

function emitTrack(eventName, payload = {}) {
  emit('track', {
    event: eventName,
    bandId: props.bandId,
    bandSlug: props.bandSlug,
    ...payload,
    timestamp: new Date().toISOString(),
  })
}

// Focus trap + ESC handling
let previousActiveElement = null

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      previousActiveElement = document.activeElement
      selected.value = new Set()
      fanEmail.value = ''
      fanSuccess.value = false
      fanError.value = ''
      emitTrack('follow_modal_open', {})
      await nextTick()
      modalEl.value?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  }
)

function handleKeydown(e) {
  if (!props.isOpen) return
  if (e.key === 'Escape') {
    close()
  }
  // Basic focus trap
  if (e.key === 'Tab' && modalEl.value) {
    const focusable = modalEl.value.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
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
