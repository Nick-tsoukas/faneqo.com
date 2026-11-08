<template>
  <section
    class="payout-notice"
    :class="notice.tone === 'ready' ? 'payout-notice--ready' : 'payout-notice--action'"
    role="status"
    aria-live="polite"
    data-testid="payout-return-notice"
  >
    <div class="min-w-0 flex-1">
      <p class="payout-notice__title">{{ notice.title }}</p>
      <p class="payout-notice__body">{{ notice.body }}</p>
      <p v-if="error" class="payout-notice__error" role="alert">{{ error }}</p>
    </div>
    <div class="payout-notice__actions">
      <button
        v-if="notice.actionLabel"
        type="button"
        class="payout-notice__primary"
        :disabled="loading"
        @click="emit('action', notice.action)"
      >
        {{ loading ? 'Opening Stripe…' : notice.actionLabel }}
      </button>
      <button type="button" class="payout-notice__dismiss" @click="emit('dismiss')">
        {{ notice.actionLabel ? 'Later' : 'Got it' }}
      </button>
    </div>
  </section>
</template>

<script setup>
/** What an artist sees on the dashboard right after coming back from Stripe. */
defineProps({
  notice: { type: Object, required: true }, // payoutReturnNotice()
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})
const emit = defineEmits(['action', 'dismiss'])
</script>

<style scoped>
.payout-notice {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.125rem;
  border-radius: 0.875rem;
  border: 1px solid;
}
@media (min-width: 640px) {
  .payout-notice {
    flex-direction: row;
    align-items: center;
  }
}
.payout-notice--action {
  border-color: rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.08);
}
.payout-notice--ready {
  border-color: rgba(52, 211, 153, 0.35);
  background: rgba(52, 211, 153, 0.08);
}
.payout-notice__title {
  margin: 0;
  font-weight: 600;
  color: #fff;
}
.payout-notice__body {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.68);
}
.payout-notice__error {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #fca5a5;
}
.payout-notice__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.payout-notice__primary,
.payout-notice__dismiss {
  min-height: 44px;
  padding: 0.625rem 1.125rem;
  border-radius: 0.75rem;
  font-weight: 600;
  color: #fff;
}
.payout-notice__primary {
  flex: 1;
  background: linear-gradient(90deg, #059669, #0d9488);
  transition: filter 0.15s ease;
}
.payout-notice__primary:hover:not(:disabled) {
  filter: brightness(1.12);
}
.payout-notice__primary:disabled {
  opacity: 0.6;
}
.payout-notice__dismiss {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.payout-notice__primary:focus-visible,
.payout-notice__dismiss:focus-visible {
  outline: 2px solid #5eead4;
  outline-offset: 2px;
}
</style>
