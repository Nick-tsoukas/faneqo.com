<script setup>
defineProps({
  artist: { type: Object, default: null },
})
</script>

<template>
  <div class="v2-pt-support" aria-hidden="true">
    <div class="v2-pt-support__card">
      <div class="v2-pt-support__icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <p class="v2-pt-support__title">Support the Band</p>
      <p class="v2-pt-support__copy">Tips &amp; payments on the page</p>
      <div class="v2-pt-support__amounts">
        <span>$5</span>
        <span>$10</span>
        <span>$20</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.v2-pt-support {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
}

.v2-pt-support__card {
  width: min(100%, 26rem);
  padding: 1.6rem 1.35rem 1.4rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(69, 214, 167, 0.22);
  background: rgba(69, 214, 167, 0.06);
  text-align: center;
}

.v2-pt-support__icon {
  width: 2.6rem;
  height: 2.6rem;
  display: grid;
  place-items: center;
  margin: 0 auto 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(69, 214, 167, 0.28);
  background: rgba(69, 214, 167, 0.12);
  color: #45d6a7;
}

.v2-pt-support__icon svg {
  width: 1.1rem;
  height: 1.1rem;
}

.v2-pt-support__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 750;
}

.v2-pt-support__copy {
  margin: 0.35rem 0 1.1rem;
  font-size: 0.84rem;
  color: rgba(255, 255, 255, 0.48);
}

.v2-pt-support__amounts {
  display: flex;
  justify-content: center;
  gap: 0.45rem;
}

.v2-pt-support__amounts span {
  min-width: 3.4rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.82rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.82);
}
</style>
