<template>
  <nav class="setup-rail" aria-label="Artist page setup">
    <p class="setup-rail__kicker">Your artist page</p>
    <ol class="setup-rail__list">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="setup-rail__item"
          :class="{
            'is-current': item.current,
            'is-complete': item.status === 'complete' && !item.current,
            'is-error': item.error,
          }"
          :aria-current="item.current ? 'step' : undefined"
          @click="$emit('jump', item.id)"
        >
          <span class="setup-rail__mark" aria-hidden="true">
            <svg
              v-if="item.error"
              class="setup-rail__icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M12 9v4m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
            </svg>
            <svg
              v-else-if="item.status === 'complete'"
              class="setup-rail__icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else class="setup-rail__dot" />
          </span>
          <span class="setup-rail__label">{{ item.label }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
})
defineEmits(['jump'])
</script>

<style scoped>
.setup-rail {
  position: sticky;
  top: calc(var(--header-height) + 1.25rem);
  width: 13.5rem;
  padding-right: 0.5rem;
}

.setup-rail__kicker {
  margin: 0 0 0.85rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}

.setup-rail__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.15rem;
}

.setup-rail__item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.45rem 0.5rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.48);
  text-align: left;
  cursor: pointer;
}

.setup-rail__item:hover,
.setup-rail__item:focus-visible {
  color: #fff;
  background: var(--fq-surface-hover, #14161B);
  outline: none;
}

.setup-rail__item.is-current {
  color: #39ff14;
}

.setup-rail__item.is-complete {
  color: rgba(255, 255, 255, 0.78);
}

.setup-rail__item.is-error {
  color: #fca5a5;
}

.setup-rail__mark {
  display: grid;
  place-items: center;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.setup-rail__dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  border: 1.5px solid currentColor;
}

.setup-rail__item.is-current .setup-rail__dot {
  background: #39ff14;
  border-color: #39ff14;
}

.setup-rail__icon {
  width: 0.95rem;
  height: 0.95rem;
}

.setup-rail__label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.2;
}
</style>
