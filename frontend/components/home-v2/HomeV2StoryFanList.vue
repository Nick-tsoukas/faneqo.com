<template>
  <div
    class="v2-list"
    role="img"
    :aria-label="`Fan list, ${demo.fanCountAfter} fans. ${demo.fan.name} joined tonight.`"
  >
    <div class="v2-list__rows">
      <div class="v2-list__row v2-list__row--muted">
        <span class="v2-list__av">{{ above.initials }}</span>
        <div class="v2-list__meta">
          <p class="v2-list__name">{{ above.name }}</p>
          <p class="v2-list__sub">{{ above.city }} · {{ above.showsLabel }}</p>
        </div>
      </div>

      <div class="v2-list__row v2-list__row--sarah" data-sarah-to></div>

      <div
        v-for="fan in below"
        :key="fan.initials"
        class="v2-list__row v2-list__row--muted"
      >
        <span class="v2-list__av">{{ fan.initials }}</span>
        <div class="v2-list__meta">
          <p class="v2-list__name">{{ fan.name }}</p>
          <p class="v2-list__sub">{{ fan.city }} · {{ fan.showsLabel }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  demo: { type: Object, required: true },
})

const above = computed(() => props.demo.neighbors[0])
const below = computed(() => props.demo.neighbors.slice(1, 2))
</script>

<style scoped>
.v2-list {
  width: 100%;
}

.v2-list__rows {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.v2-list__row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.15rem;
  padding: 0.3rem 0.1rem;
}

.v2-list__row--muted {
  opacity: 0.22;
}

.v2-list__row--sarah {
  min-height: 0;
  padding: 0;
}

.v2-list__row--sarah:not(:empty) {
  min-height: 3.65rem;
  padding: 0.3rem 0.45rem;
  border-radius: 0.65rem;
  background: rgba(69, 214, 167, 0.08);
}

.v2-list__av {
  display: flex;
  height: 2.15rem;
  width: 2.15rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #111217;
  font-size: 0.62rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.38);
}

.v2-list__name {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
}

.v2-list__sub {
  margin: 0.1rem 0 0;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.28);
}
</style>
