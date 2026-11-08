<template>
  <div
    class="auth-mode"
    role="tablist"
    aria-label="Sign in as"
  >
    <button
      type="button"
      role="tab"
      class="auth-mode__tab"
      :class="{ 'is-active': modelValue === 'artist' }"
      :aria-selected="modelValue === 'artist'"
      :tabindex="modelValue === 'artist' ? 0 : -1"
      @click="$emit('update:modelValue', 'artist')"
      @keydown="onKey($event, 'artist')"
    >
      Artist &amp; Team
    </button>
    <button
      type="button"
      role="tab"
      class="auth-mode__tab"
      :class="{ 'is-active': modelValue === 'fan' }"
      :aria-selected="modelValue === 'fan'"
      :tabindex="modelValue === 'fan' ? 0 : -1"
      @click="$emit('update:modelValue', 'fan')"
      @keydown="onKey($event, 'fan')"
    >
      Fan
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: 'artist' },
})
const emit = defineEmits(['update:modelValue'])

function onKey(event, current) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const next =
    event.key === 'Home' ? 'artist'
    : event.key === 'End' ? 'fan'
    : current === 'artist' ? 'fan' : 'artist'
  emit('update:modelValue', next)
  const tabs = event.currentTarget?.parentElement?.querySelectorAll('[role="tab"]')
  tabs?.[next === 'artist' ? 0 : 1]?.focus()
}
</script>

<style scoped>
.auth-mode {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin: 0 0 2rem;
}

.auth-mode__tab {
  position: relative;
  min-height: 44px;
  padding: 0.3rem 0.15rem 0.65rem;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.58);
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: color 0.16s ease;
}

.auth-mode__tab.is-active {
  color: #f5f5f6;
}

.auth-mode__tab.is-active::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 48px;
  height: 2px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #ff4d9a, #a855f7, #39d5ff);
  transition: opacity 0.16s ease;
}

.auth-mode__tab:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
  border-radius: 8px;
}

@media (min-width: 1024px) {
  .auth-mode {
    margin-bottom: 1.75rem;
  }

  .auth-mode__tab.is-active::after {
    width: 2.75rem;
    box-shadow: none;
    filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-mode__tab {
    transition: none;
  }
}
</style>
