<template>
  <div class="awi" :class="[`is-${size}`]">
    <component
      :is="to ? 'NuxtLink' : 'span'"
      :to="to || undefined"
      class="awi__face"
      :aria-label="name"
    >
      <span class="awi__circle" aria-hidden="true">
        <img
          v-if="src && !broken"
          :src="src"
          alt=""
          :style="focalStyle"
          @error="broken = true"
        >
        <span v-else class="awi__mark">{{ initial }}</span>
      </span>
    </component>
    <div class="awi__meta">
      <component
        :is="to ? 'NuxtLink' : 'span'"
        :to="to || undefined"
        class="awi__name"
      >{{ name }}</component>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getArtistFocalStyle } from '~/utils/media/artistImage'

const props = defineProps({
  name: { type: String, default: 'Artist' },
  to: { type: String, default: '' },
  image: { type: String, default: '' },
  focalX: { type: [Number, String], default: 50 },
  focalY: { type: [Number, String], default: 50 },
  size: { type: String, default: 'page' },
})

const broken = ref(false)
const src = computed(() => String(props.image || '').trim())
const initial = computed(() => {
  const letter = String(props.name || '').trim().match(/[A-Za-z0-9]/)
  return letter ? letter[0].toUpperCase() : 'A'
})
const focalStyle = computed(() => getArtistFocalStyle({
  positionX: props.focalX,
  positionY: props.focalY,
}))

watch(src, () => {
  broken.value = false
})
</script>

<style scoped>
.awi {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 100%;
}
.awi__face {
  flex: 0 0 auto;
  color: inherit;
  text-decoration: none;
}
.awi__circle {
  display: block;
  width: 3rem;
  height: 3rem;
  overflow: hidden;
  border-radius: 50%;
  background: #111318;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.awi__circle img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.awi__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f5f5f6;
}
.awi__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}
.awi__name {
  min-width: 0;
  max-width: 100%;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.1;
  text-transform: uppercase;
  color: #f5f5f6;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.awi.is-end {
  gap: 0.65rem;
}
.awi.is-end .awi__circle {
  width: 2.5rem;
  height: 2.5rem;
}
.awi.is-end .awi__name {
  font-size: 0.82rem;
  color: rgba(245, 245, 246, 0.72);
}
.awi.is-viewer {
  gap: 0.55rem;
}
.awi.is-viewer .awi__circle {
  width: 2.25rem;
  height: 2.25rem;
}
.awi.is-viewer .awi__name {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
}
.awi__face:focus-visible,
.awi__name:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 768px) {
  .awi.is-page .awi__circle {
    width: 3.5rem;
    height: 3.5rem;
  }
  .awi.is-page .awi__name {
    font-size: 0.98rem;
  }
  .awi.is-end .awi__circle {
    width: 2.75rem;
    height: 2.75rem;
  }
  .awi.is-viewer .awi__circle {
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>
