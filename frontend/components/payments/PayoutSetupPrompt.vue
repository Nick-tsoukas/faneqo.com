<template>
  <Teleport to="body">
    <Transition name="payout-prompt">
      <div
        v-if="open"
        class="payout-prompt fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-4"
        data-testid="payout-setup-prompt"
        @keydown.esc.prevent="emit('dismiss')"
        @keydown.tab="trapFocus"
      >
        <div class="absolute inset-0 bg-black/75 backdrop-blur-sm" @click="emit('dismiss')"></div>

        <div
          ref="panel"
          class="payout-prompt__panel relative w-full sm:max-w-md bg-neutral-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-prompt-title"
          aria-describedby="payout-prompt-body"
        >
          <div class="p-6 pb-5">
            <div class="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4" aria-hidden="true">
              <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 id="payout-prompt-title" class="text-xl font-bold text-white">Ready to accept payments?</h2>
            <p id="payout-prompt-body" class="text-white/70 text-sm mt-2 leading-relaxed">
              Set up secure payouts with Stripe to activate this payment option.
            </p>
            <p class="text-white/50 text-sm mt-3 leading-relaxed">
              {{ isCreate
                ? "We'll create your band first, then take you to Stripe. It takes a few minutes."
                : "We'll save your changes first, then take you to Stripe. It takes a few minutes." }}
            </p>
          </div>

          <div class="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              class="payout-prompt__btn flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition"
              @click="emit('dismiss')"
            >
              Not Now
            </button>
            <button
              ref="primary"
              type="button"
              class="payout-prompt__btn flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition"
              @click="emit('setup')"
            >
              Set Up Payouts
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * Asked when an artist switches on a payment option before payouts are ready.
 * The parent decides what "Set Up Payouts" does (save or create first, then
 * Stripe) and what "Not Now" leaves behind (choices are always kept).
 */
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'edit' }, // 'edit' | 'create'
})
const emit = defineEmits(['setup', 'dismiss'])

const isCreate = computed(() => props.mode === 'create')
const panel = ref(null)
const primary = ref(null)
let returnFocusTo = null

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocusTo = document.activeElement
      await nextTick()
      primary.value?.focus()
    } else if (returnFocusTo?.focus) {
      returnFocusTo.focus()
      returnFocusTo = null
    }
  }
)

function trapFocus(e) {
  const buttons = panel.value ? [...panel.value.querySelectorAll('button')] : []
  if (!buttons.length) return
  const first = buttons[0]
  const last = buttons[buttons.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
</script>

<style scoped>
.payout-prompt__panel {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.payout-prompt__btn:focus-visible {
  outline: 2px solid rgb(52 211 153);
  outline-offset: 2px;
}
.payout-prompt-enter-active,
.payout-prompt-leave-active {
  transition: opacity 0.2s ease;
}
.payout-prompt-enter-active .payout-prompt__panel,
.payout-prompt-leave-active .payout-prompt__panel {
  transition: transform 0.25s ease;
}
.payout-prompt-enter-from,
.payout-prompt-leave-to {
  opacity: 0;
}
.payout-prompt-enter-from .payout-prompt__panel,
.payout-prompt-leave-to .payout-prompt__panel {
  transform: translateY(24px);
}
@media (prefers-reduced-motion: reduce) {
  .payout-prompt-enter-active,
  .payout-prompt-leave-active,
  .payout-prompt-enter-active .payout-prompt__panel,
  .payout-prompt-leave-active .payout-prompt__panel {
    transition: none;
  }
}
</style>
