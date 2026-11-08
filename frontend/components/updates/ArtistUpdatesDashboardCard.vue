<template>
  <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
  <section v-if="false" class="audc">
    <div class="audc__copy">
      <p class="audc__kicker">Artist Updates</p>
      <h2>Share photos with your fans</h2>
      <p>Galleries live on your artist page. Manage them in one place.</p>
    </div>
    <div class="audc__actions">
      <NuxtLink to="/updates" class="audc__btn is-ghost">View Updates</NuxtLink>
      <NuxtLink :to="newPath" class="audc__btn">New Update</NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  bandId: { type: [String, Number], default: null },
})

const newPath = computed(() => {
  const query = new URLSearchParams({
    from: '/dashboard',
    ...(props.bandId ? { bandId: String(props.bandId) } : {}),
  })
  return `/updates/new?${query.toString()}`
})
</script>

<style scoped>
.audc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.1rem 1.2rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}
.audc__kicker {
  margin: 0;
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #39ff14;
}
.audc h2 {
  margin: 0.15rem 0 0;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 750;
}
.audc p {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}
.audc__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}
.audc__btn {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 0 0.9rem;
  border-radius: 0.8rem;
  background: #39ff14;
  color: #052e16;
  font-weight: 750;
  text-decoration: none;
}
.audc__btn.is-ghost {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.14);
}
@media (max-width: 639px) {
  .audc {
    flex-direction: column;
    align-items: stretch;
  }
  .audc__actions {
    flex-direction: column;
  }
  .audc__btn {
    justify-content: center;
  }
}
</style>
