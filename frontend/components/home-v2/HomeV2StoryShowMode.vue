<template>
  <div class="v2-show" role="img" :aria-label="ariaLabel">
    <div class="v2-show__sarah">
      <HomeV2StorySarahIdentity :fan="demo.fan" variant="show" />
    </div>
    <p class="v2-show__when">{{ demo.artist.name }} · {{ demo.artist.city }}</p>
    <div class="fq-check-btn" aria-hidden="true">
      <span class="fq-check-fill"></span>
      <span class="fq-check-idle">I’m here</span>
      <span class="fq-check-done">
        <span class="fq-check-mark">✓</span>
        You’re checked in.
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import HomeV2StorySarahIdentity from '@/components/home-v2/HomeV2StorySarahIdentity.vue'

const props = defineProps({
  demo: { type: Object, required: true },
})

const ariaLabel = computed(
  () => `${props.demo.fan.name} checks in to ${props.demo.artist.name} in ${props.demo.artist.city}`
)
</script>

<style scoped>
.v2-show {
  width: min(100%, 16.5rem);
}

.v2-show__sarah {
  margin: 0 0 0.7rem;
}

.v2-show__when {
  margin: 0 0 1.05rem;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.32);
}

.fq-check-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3.1rem;
  overflow: hidden;
  background: #15161c;
  font-size: 0.92rem;
  font-weight: 650;
}

.fq-check-fill {
  position: absolute;
  inset: 0;
  transform: scaleX(0);
  transform-origin: left center;
  background: rgba(69, 214, 167, 0.16);
  pointer-events: none;
}

.fq-check-idle,
.fq-check-done {
  position: relative;
  z-index: 1;
}

.fq-check-idle {
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 700;
}

.fq-check-done {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  opacity: 0;
  visibility: hidden;
}

.fq-check-mark {
  color: #39ff14;
  font-weight: 700;
}
</style>
