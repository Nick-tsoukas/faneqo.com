<template>
  <footer class="close" :class="[`is-${align}`, { 'is-compact': compact }]">
    <img class="close__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
    <span v-if="cta || site" class="close__rule" />
    <div v-if="cta || site" class="close__action">
      <div v-if="cta" class="close__cta">
        <span>{{ cta }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
        </svg>
      </div>
      <p v-if="site" class="close__site">{{ site }}</p>
    </div>
  </footer>
</template>

<script setup>
/**
 * The brand close every creative ends with: one wordmark, a hairline, a
 * restrained CTA, and the destination. Never a second logo anywhere else.
 */
defineProps({
  cta: { type: String, default: '' },
  site: { type: String, default: 'faneqo.com' },
  align: { type: String, default: 'row' }, // row | center
  compact: { type: Boolean, default: false },
})
</script>

<style scoped>
.close {
  display: grid;
  grid-template-columns: auto 1px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  width: 100%;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.close.is-center {
  grid-template-columns: none;
  grid-auto-flow: row;
  justify-items: center;
  gap: 18px;
}

.close__mark {
  width: var(--close-mark, 168px);
  height: auto;
}

.close__rule {
  width: 1px;
  height: 52px;
  background: rgba(255, 255, 255, 0.14);
}

.is-center .close__rule {
  width: 52px;
  height: 1px;
}

.close__action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.is-center .close__action {
  align-items: center;
}

.close__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.close__cta svg {
  width: 16px;
  height: 16px;
}

.close__site {
  margin: 0;
  color: rgba(247, 249, 252, 0.42);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.is-compact .close__mark { width: var(--close-mark, 136px); }
.is-compact .close__rule { height: 40px; }
.is-compact .close__cta { height: 44px; padding: 0 16px; font-size: 16px; }
</style>
