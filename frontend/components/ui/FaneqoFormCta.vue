<template>
  <button
    type="button"
    class="fq-form-cta"
    :class="[`is-${status}`, { 'is-idle': status === 'idle' }]"
    :disabled="locked"
    :aria-busy="status === 'loading' ? 'true' : 'false'"
    @click="onClick"
  >
    <span class="fq-form-cta__inner">
      <span v-if="status === 'loading'" class="fq-form-cta__spin" aria-hidden="true" />
      <svg
        v-else-if="status === 'success'"
        class="fq-form-cta__check"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>{{ visibleLabel }}</span>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'idle',
    validator: (v) => ['idle', 'loading', 'success'].includes(v),
  },
  idleLabel: { type: String, default: 'Add' },
  loadingLabel: { type: String, default: 'Adding…' },
  successLabel: { type: String, default: 'Added' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const locked = computed(() => props.disabled || props.status !== 'idle')
const visibleLabel = computed(() => {
  if (props.status === 'loading') return props.loadingLabel
  if (props.status === 'success') return props.successLabel
  return props.idleLabel
})

function onClick() {
  if (locked.value) return
  emit('click')
}
</script>

<style scoped>
.fq-form-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 10.5rem;
  min-height: 2.75rem;
  padding: 0.625rem 1.05rem;
  border: 0;
  border-radius: 0.75rem;
  background: var(--fq-gradient-form-cta, linear-gradient(135deg, #45D6A7 0%, #23C7C3 100%));
  color: var(--fq-ink-on-form-cta, #06251F);
  font-size: 0.875rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.2;
  cursor: pointer;
  transition: filter 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.fq-form-cta.is-idle:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.fq-form-cta.is-idle:active:not(:disabled) {
  transform: scale(0.99);
  filter: brightness(0.98);
}

.fq-form-cta.is-loading {
  filter: brightness(0.96) saturate(0.92);
  cursor: wait;
}

.fq-form-cta.is-success {
  filter: brightness(1.02) saturate(0.95);
  cursor: default;
}

.fq-form-cta:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  transform: none;
  filter: none;
}

.fq-form-cta.is-loading:disabled,
.fq-form-cta.is-success:disabled {
  opacity: 1;
  cursor: default;
}

.fq-form-cta__inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  white-space: nowrap;
}

.fq-form-cta__spin {
  width: 0.95rem;
  height: 0.95rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 2px solid rgba(6, 37, 31, 0.22);
  border-top-color: rgba(6, 37, 31, 0.92);
  animation: fq-form-cta-spin 0.7s linear infinite;
}

.fq-form-cta__check {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  animation: fq-form-cta-check 280ms ease;
}

@keyframes fq-form-cta-spin {
  to { transform: rotate(360deg); }
}

@keyframes fq-form-cta-check {
  from { transform: scale(0.78); opacity: 0.4; }
  to { transform: scale(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .fq-form-cta,
  .fq-form-cta.is-idle:hover:not(:disabled),
  .fq-form-cta.is-idle:active:not(:disabled) {
    transition: none;
    transform: none;
  }
  .fq-form-cta__spin,
  .fq-form-cta__check {
    animation: none;
  }
}
</style>
