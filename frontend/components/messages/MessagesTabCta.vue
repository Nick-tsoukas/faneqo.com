<template>
  <button
    type="button"
    class="msg-cta"
    :aria-label="label"
    @click="$emit('click')"
  >
    <component
      :is="icons.plus"
      :size="16"
      :stroke-width="2.3"
      aria-hidden="true"
    />
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'

const props = defineProps({
  tab: { type: String, default: 'inbox' },
  label: { type: String, default: 'New conversation' },
})

defineEmits(['click'])

const icons = faneqoIcons
const label = computed(() => props.label)
</script>

<style scoped>
.msg-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.32rem;
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.38rem 0.35rem;
  border: 0;
  border-radius: 0.5rem;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), color 0.14s ease,
    background 0.14s ease;
}

.msg-cta:hover {
  background: transparent;
  color: var(--fq-text-primary, #F5F5F6);
}

.msg-cta:active {
  transform: scale(0.98);
}

.msg-cta:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .msg-cta {
    transition: none;
  }
  .msg-cta:active {
    transform: none;
  }
}
</style>
