<template>
  <div class="setup-mobile">
    <button
      type="button"
      class="setup-mobile__btn"
      :aria-expanded="open"
      aria-controls="setup-mobile-jump"
      @click="$emit('toggle')"
    >
      <span class="setup-mobile__copy">
        <span class="setup-mobile__label">{{ current?.label || 'Artist details' }}</span>
        <span class="setup-mobile__meta">{{ position.current }} of {{ position.total }}</span>
      </span>
      <svg class="setup-mobile__chevron" :class="{ 'is-open': open }" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div class="setup-mobile__track" aria-hidden="true">
      <div class="setup-mobile__fill" :style="{ width: fillWidth }" />
    </div>
    <div v-if="open" id="setup-mobile-jump" class="setup-mobile__menu" role="listbox" aria-label="Jump to section">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="setup-mobile__option"
        :class="{ 'is-current': item.current, 'is-error': item.error }"
        :aria-current="item.current ? 'step' : undefined"
        @click="$emit('jump', item.id)"
      >
        <span>{{ item.label }}</span>
        <span v-if="item.status === 'complete'" class="setup-mobile__done">Done</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  current: { type: Object, default: null },
  position: { type: Object, required: true },
  open: { type: Boolean, default: false },
})

defineEmits(['toggle', 'jump'])

const fillWidth = computed(() => {
  const total = props.position.total || 1
  const current = props.position.current || 1
  return `${Math.round((current / total) * 100)}%`
})
</script>

<style scoped>
.setup-mobile {
  position: sticky;
  top: var(--header-height);
  z-index: 30;
  margin: 0 -1.5rem 1.25rem;
  padding: 0.65rem 1.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.92);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}

.setup-mobile__btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  text-align: left;
  cursor: pointer;
}

.setup-mobile__btn:focus-visible {
  outline: 2px solid #39ff14;
  outline-offset: 3px;
}

.setup-mobile__copy {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.setup-mobile__label {
  font-size: 0.8125rem;
  font-weight: 600;
}

.setup-mobile__meta {
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.45);
}

.setup-mobile__chevron {
  width: 1rem;
  height: 1rem;
  color: rgba(255, 255, 255, 0.5);
  transition: transform 180ms ease;
}

.setup-mobile__chevron.is-open {
  transform: rotate(180deg);
}

.setup-mobile__track {
  margin-top: 0.55rem;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.setup-mobile__fill {
  height: 100%;
  background: #39ff14;
}

.setup-mobile__menu {
  display: grid;
  gap: 0.15rem;
  margin-top: 0.7rem;
}

.setup-mobile__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.55rem 0.15rem;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
}

.setup-mobile__option.is-current {
  color: #39ff14;
}

.setup-mobile__option.is-error {
  color: #fca5a5;
}

.setup-mobile__done {
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}
</style>
