<template>
  <div class="v2-pt-show" aria-hidden="true">
    <div class="v2-pt-show__card">
      <p class="v2-pt-show__live">
        <span class="v2-pt-show__dot"></span>
        Show Mode
      </p>
      <p class="v2-pt-show__artist">{{ show.artist }}</p>
      <p class="v2-pt-show__meta">{{ show.when }} · {{ show.city }}</p>
      <p class="v2-pt-show__line">{{ show.venueLine }}</p>
      <div class="v2-pt-show__cta">I’m here</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { HOME_V2_STORY_DEMO } from '~/utils/home-v2/relationshipStoryDemo.js'

const props = defineProps({
  artist: { type: Object, required: true },
})

const show = computed(() => ({
  artist: props.artist.name || HOME_V2_STORY_DEMO.artist.name,
  when: HOME_V2_STORY_DEMO.artist.when,
  city: HOME_V2_STORY_DEMO.artist.city,
  venueLine: HOME_V2_STORY_DEMO.artist.venueLine,
}))
</script>

<style scoped>
.v2-pt-show {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
}

.v2-pt-show__card {
  width: min(100%, 28rem);
  padding: 1.7rem 1.35rem 1.45rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b0c10;
  text-align: center;
}

.v2-pt-show__live {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.9rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(69, 214, 167, 0.82);
}

.v2-pt-show__dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: #45d6a7;
}

.v2-pt-show__artist {
  margin: 0;
  font-size: clamp(1.7rem, 5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.v2-pt-show__meta {
  margin: 0.4rem 0 0;
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.46);
}

.v2-pt-show__line {
  margin: 0.75rem 0 1.15rem;
  color: rgba(255, 255, 255, 0.52);
}

.v2-pt-show__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3.1rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(69, 214, 167, 0.42);
  background: #111217;
  font-weight: 650;
  color: #f5f5f6;
}
</style>
