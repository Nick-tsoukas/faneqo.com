<template>
  <div
    class="v2-pt-fans"
    role="img"
    :aria-label="`Fan list, ${demo.fanCountAfter} fans. ${demo.fan.name} joined tonight.`"
  >
    <p class="v2-pt-kicker">Fan Intelligence</p>
    <p class="v2-pt-fans__title">All fans · {{ demo.fanCountAfter }}</p>
    <div class="v2-pt-fans__rows">
      <div class="v2-pt-fan-row v2-pt-fan-row--sarah">
        <span class="v2-pt-fan-row__av">{{ demo.fan.initials }}</span>
        <div>
          <p class="v2-pt-fan-row__name">{{ demo.fan.name }}</p>
          <p class="v2-pt-fan-row__sub">
            {{ demo.fan.city }} · {{ demo.fan.showsLabel }}
            <span>{{ demo.fan.joinedLabel }}</span>
          </p>
        </div>
      </div>
      <div
        v-for="(fan, index) in neighbors"
        :key="fan.initials"
        class="v2-pt-fan-row"
        :class="{ 'v2-pt-fan-row--extra': index > 0 }"
      >
        <span class="v2-pt-fan-row__av">{{ fan.initials }}</span>
        <div>
          <p class="v2-pt-fan-row__name">{{ fan.name }}</p>
          <p class="v2-pt-fan-row__sub">{{ fan.city }} · {{ fan.showsLabel }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { HOME_V2_STORY_DEMO } from '~/utils/home-v2/relationshipStoryDemo.js'

defineProps({
  artist: { type: Object, default: null },
})

const demo = HOME_V2_STORY_DEMO
const neighbors = computed(() => demo.neighbors.slice(0, 2))
</script>

<style scoped>
.v2-pt-fans {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-height: 0;
}

.v2-pt-kicker {
  margin: 0 0 0.4rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(69, 214, 167, 0.78);
}

.v2-pt-fans__title {
  margin: 0 0 1.1rem;
  font-size: clamp(1.35rem, 4vw, 1.85rem);
  font-weight: 750;
  letter-spacing: -0.03em;
}

.v2-pt-fans__rows {
  display: grid;
  gap: 0.55rem;
}

.v2-pt-fan-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0c0c10;
}

.v2-pt-fan-row--sarah {
  border-color: rgba(168, 85, 247, 0.32);
  background: linear-gradient(180deg, rgba(88, 28, 135, 0.28), #0c0c10 70%);
}

.v2-pt-fan-row__av {
  width: 2.35rem;
  height: 2.35rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.v2-pt-fan-row--sarah .v2-pt-fan-row__av {
  background: rgba(216, 180, 254, 0.18);
}

.v2-pt-fan-row__name {
  margin: 0;
  font-weight: 650;
}

.v2-pt-fan-row__sub {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.48);
}

.v2-pt-fan-row__sub span {
  margin-left: 0.4rem;
  color: rgba(69, 214, 167, 0.8);
}

@media (max-width: 1023px) {
  .v2-pt-fan-row--extra {
    display: none;
  }
}
</style>
