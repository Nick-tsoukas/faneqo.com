<template>
  <figure class="event-poster">
    <button
      type="button"
      class="event-poster__hit"
      :aria-label="`View full poster${alt ? `: ${alt}` : ''}`"
      @click="$emit('open')"
    >
      <img
        :src="src"
        :alt="alt || 'Event poster'"
        :loading="priority ? 'eager' : 'lazy'"
        decoding="async"
        class="event-poster__img"
      />
      <span class="event-poster__hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path stroke-linecap="round" d="M20 20l-3-3" />
          <path stroke-linecap="round" d="M11 8v6M8 11h6" />
        </svg>
        Tap to zoom &amp; read
      </span>
    </button>
  </figure>
</template>

<script setup>
defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  priority: { type: Boolean, default: false },
})

defineEmits(['open'])
</script>

<style scoped>
.event-poster {
  margin: 0;
  display: flex;
  justify-content: center;
}

.event-poster__hit {
  position: relative;
  display: block;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.15rem;
  background: #08080c;
  cursor: zoom-in;
  box-shadow:
    0 28px 64px -20px rgba(0, 0, 0, 0.85),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.event-poster__hit:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.event-poster__img {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: min(78vh, 52rem);
  margin: 0 auto;
  object-fit: contain;
  object-position: center top;
  background: #050508;
}

.event-poster__hint {
  position: absolute;
  right: 0.7rem;
  bottom: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.72);
  color: #f7f9fc;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  backdrop-filter: blur(10px);
}

.event-poster__hint svg {
  width: 0.9rem;
  height: 0.9rem;
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .event-poster__hit:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .event-poster__hit:hover .event-poster__img {
    filter: brightness(1.04);
  }
}
</style>
