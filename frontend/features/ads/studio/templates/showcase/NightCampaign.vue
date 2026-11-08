<template>
  <div class="night" :style="filmStyle">
    <div class="stage">
      <PhotoField
        v-for="(frame, index) in frames"
        :key="frame.url + index"
        class="stage__photo"
        :class="`is-${index}`"
        :media="frame"
        fade="bottom"
      />
      <div v-if="!frames.length" class="stage__empty">
        <p>No public gallery on this page.</p>
        <p>This needs photographs from a gallery.</p>
      </div>
    </div>

    <div class="mark">
      <img src="/faneqo-wordmark.svg" alt="Faneqo" />
    </div>

    <header class="type">
      <p class="who">{{ name }}</p>
      <p v-if="galleryTitle" class="kicker">{{ galleryTitle }}</p>
      <h1 :style="{ fontSize: `calc(var(--h1) * ${headlineScale([c.headlineTop, c.headlineAccent])})` }">
        <span class="line">{{ c.headlineTop }}</span>
        <span v-if="c.headlineAccent" class="line line--accent">{{ c.headlineAccent }}</span>
      </h1>
      <p v-if="c.support" class="support">{{ c.support }}</p>
      <!-- The action belongs with the words, not in a corner. -->
      <p v-if="c.cta" class="go">{{ c.cta }} <i aria-hidden="true">→</i></p>
    </header>

    <div v-if="strip.length" class="strip">
      <PhotoField v-for="(frame, index) in strip" :key="`s-${frame.url}-${index}`" class="strip__photo" :media="frame" fade="none" />
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import PhotoField from '@/features/ads/studio/primitives/PhotoField.vue'
import { headlineScale } from '@/features/ads/studio/board.js'
import { campaignGalleryTitle, galleryPhotos } from '@/features/ads/studio/campaigns.js'

/**
 * Gallery campaign. One photograph leads. The others are the same gallery,
 * not a card slideshow. A page with no gallery says so.
 */
const props = defineProps({
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  pose: { type: Object, default: null },
})

const c = computed(() => props.content || {})
const name = computed(() => props.snapshot?.name || 'Artist')
const galleryTitle = computed(() => campaignGalleryTitle(props.snapshot))
const frames = computed(() => galleryPhotos(props.snapshot).slice(0, 3))
const strip = computed(() => frames.value.slice(1, 3))
const filmStyle = computed(() => {
  const pose = props.pose
  if (!pose) return null
  return {
    '--nt-a': pose.a,
    '--nt-b': pose.b,
    '--nt-c': pose.c,
    '--nt-type': pose.type,
    '--nt-strip': pose.strip,
    '--nt-close': pose.close,
    '--nt-close-y': `${pose.closeY}px`,
  }
})
</script>

<style scoped>
.night {
  position: absolute;
  inset: 0;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.stage { position: absolute; inset: 0; }
.stage__photo { position: absolute; inset: 0; }
.stage__photo.is-0 { opacity: var(--nt-a, 1); }
.stage__photo.is-1 { opacity: var(--nt-b, 0); }
.stage__photo.is-2 { opacity: var(--nt-c, 0); }

.stage__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  padding: var(--safe-bottom) var(--safe-x);
  background: #050507;
  color: rgba(247, 249, 252, 0.78);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.25;
}
.stage__empty p { margin: 0; }
.stage__empty p + p { color: rgba(247, 249, 252, 0.5); font-size: 18px; font-weight: 500; }

.type {
  position: absolute;
  right: var(--safe-x);
  bottom: calc(var(--safe-bottom) + 220px);
  left: var(--safe-x);
  z-index: 2;
  opacity: var(--nt-type, 1);
}

.who {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.kicker {
  margin: 0 0 12px;
  color: #7ee7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.92;
}

.line { display: block; }
.line--accent {
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 55%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.support {
  max-width: 16em;
  margin: 16px 0 0;
  color: rgba(247, 249, 252, 0.78);
  font-size: 22px;
  line-height: 1.35;
}

.strip {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--safe-bottom);
  left: var(--safe-x);
  z-index: 2;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 10px;
  height: 120px;
  opacity: var(--nt-strip, 1);
}

.strip__photo { height: 120px; }

.mark {
  position: absolute;
  top: var(--safe-top);
  right: var(--safe-x);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.mark img { height: 22px; }

.go {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 22px 0 0;
  padding: 12px 22px;
  border: 1.5px solid rgba(247, 249, 252, 0.5);
  border-radius: 999px;
  color: #f7f9fc;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.go i { font-style: normal; }
</style>
