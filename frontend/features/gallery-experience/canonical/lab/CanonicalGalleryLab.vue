<template>
  <div class="lab">
    <!-- Dev harness only. Hidden while a photograph is open. -->
    <div class="lab__bar" :class="{ 'is-hidden': hidden }">
      <button
        v-for="state in states"
        :key="state.key"
        type="button"
        class="lab__chip"
        :class="{ 'is-on': state.key === active }"
        @click="active = state.key"
      >
        {{ state.label }}
      </button>
      <span class="lab__meta">{{ model.photos.length }} in model · {{ model.visibility }}{{ model.locked ? ' · locked' : '' }}</span>
    </div>

    <GalleryOverview :key="active" :model="model" origin="https://faneqo.com" />
  </div>
</template>

<script setup>
/**
 * Canonical gallery lab.
 *
 * Renders the production components against the production payload contract,
 * with the state matrix the brief requires: 1 / 12 / 100 photographs, mixed
 * orientations, missing caption, long caption, missing band image, low
 * resolution, no linked show, restricted, attendee-only and empty.
 *
 * `:key="active"` forces a clean remount per state so no viewer state leaks
 * between fixtures — that is a lab affordance, not production behaviour.
 */
import { computed, ref } from 'vue'
import GalleryOverview from '../GalleryOverview.vue'
import { normalizeGalleryModel } from '../galleryMediaModel.js'
import { canonicalGalleryPayload, CANONICAL_GALLERY_STATES } from './canonicalGalleryFixture.js'

const props = defineProps({
  state: { type: String, default: '12' },
  hidden: { type: Boolean, default: false },
})

const states = CANONICAL_GALLERY_STATES
const active = ref(props.state)

const model = computed(() => {
  const found = states.find((row) => row.key === active.value) || states[0]
  return normalizeGalleryModel(
    canonicalGalleryPayload(found.options),
    { bandSlug: 'badflower' },
  )
})
</script>

<style scoped>
.lab {
  min-height: 100vh;
  background: #050608;
  color: rgb(247, 249, 252);
}

.lab__bar {
  position: fixed;
  z-index: 40;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
  background: rgba(5, 6, 8, 0.94);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.lab__bar.is-hidden {
  display: none;
}

.lab__chip {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.62);
  font: inherit;
  font-size: 11.5px;
  padding: 5px 10px;
  cursor: pointer;
}

.lab__chip.is-on {
  background: rgba(247, 249, 252, 0.94);
  border-color: transparent;
  color: #05060a;
}

.lab__meta {
  margin-left: auto;
  font-size: 11px;
  color: rgba(247, 249, 252, 0.4);
  font-variant-numeric: tabular-nums;
}
</style>
