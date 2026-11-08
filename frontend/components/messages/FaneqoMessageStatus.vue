<template>
  <span class="fq-status" :data-state="state">
    <template v-if="state === 'sending'">Sending</template>
    <template v-else-if="state === 'sent'">
      <component :is="icons.check" :size="13" :stroke-width="2" aria-hidden="true" />
      Sent
    </template>
    <template v-else-if="state === 'seen'">
      <component :is="icons.checkCheck" :size="13" :stroke-width="2" aria-hidden="true" />
      Seen
    </template>
    <template v-else-if="state === 'failed'">
      Couldn't send
      <button v-if="showRetry" type="button" class="fq-status__retry" @click="$emit('retry')">
        Retry
      </button>
    </template>
  </span>
</template>

<script setup>
/**
 * Visual model for Phase 2 truth: sending → sent → seen | failed.
 * Do not invent Delivered.
 */
import { faneqoIcons } from '~/utils/messages/faneqoIcons'

defineProps({
  state: { type: String, default: 'sent' }, // sending | sent | seen | failed
  showRetry: { type: Boolean, default: true },
})

defineEmits(['retry'])

const icons = faneqoIcons
</script>

<style scoped>
.fq-status {
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.38);
  letter-spacing: 0.01em;
}

.fq-status[data-state='seen'] {
  color: rgba(255, 255, 255, 0.42);
}

.fq-status[data-state='failed'] {
  color: rgba(252, 165, 165, 0.85);
}

.fq-status__retry {
  border: 0;
  background: none;
  color: var(--fq-accent-mint, #45E3AE);
  font-weight: 600;
  cursor: pointer;
  padding: 0 0.1rem;
  min-height: 28px;
}

.fq-status__retry:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 2px;
}
</style>
