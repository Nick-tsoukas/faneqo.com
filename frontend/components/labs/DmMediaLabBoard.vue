<template>
  <div class="dmlab">
    <p class="dmlab__lede">
      Direct messages keep a conversational presentation. Shared MediaItem,
      queue, picker, preview, bubble grid, and lightbox. Max 4. No cover.
      Ready is implicit.
    </p>

    <div class="dmlab__toolbar">
      <span class="dmlab__label">Width</span>
      <div class="dmlab__pills" role="group" aria-label="Preview width">
        <button
          v-for="w in widths"
          :key="w"
          type="button"
          class="dmlab__pill"
          :class="{ 'is-on': width === w }"
          :aria-pressed="width === w"
          @click="width = w"
        >
          {{ w }}
        </button>
      </div>
    </div>

    <section class="dmlab__block">
      <header class="dmlab__head">
        <p class="dmlab__kicker">Composer</p>
        <h2>Send them a photo</h2>
      </header>
      <div class="dmlab__stage-wrap">
        <div class="dmlab__stage" :style="{ width: `${width}px` }">
          <div class="dmlab__thread">
            <p class="dmlab__peer">Sarah</p>
            <p class="dmlab__hint">Last night was wild</p>
          </div>
          <FaneqoMediaPreview compact :items="previewStates" @retry="() => {}" @remove="() => {}" />
          <FaneqoMessageComposer conversation-id="lab" placeholder="Write a message…" />
        </div>
      </div>
    </section>

    <section class="dmlab__block">
      <header class="dmlab__head">
        <p class="dmlab__kicker">Bubbles</p>
        <h2>1–4 conversational</h2>
      </header>
      <div class="dmlab__stage-wrap">
        <div class="dmlab__stage is-thread" :style="{ width: `${width}px` }">
          <article v-for="count in [1, 2, 3, 4]" :key="`n-${count}`" class="dmlab__msg is-mine">
            <p class="dmlab__count">{{ count }}</p>
            <div class="dmlab__bubble">
              <FaneqoMediaGrid
                variant="bubble"
                :items="items(count)"
                @open="openFrom(items(count), $event)"
              />
            </div>
          </article>
          <article class="dmlab__msg">
            <p class="dmlab__count">portrait</p>
            <div class="dmlab__bubble">
              <FaneqoMediaGrid variant="bubble" :items="portrait" @open="openFrom(portrait, $event)" />
            </div>
          </article>
          <article class="dmlab__msg is-mine">
            <p class="dmlab__count">wide</p>
            <div class="dmlab__bubble">
              <FaneqoMediaGrid variant="bubble" :items="wide" @open="openFrom(wide, $event)" />
            </div>
          </article>
        </div>
      </div>
    </section>

    <FaneqoMediaLightbox
      :open="!!lightbox"
      :items="lightbox?.items || []"
      :start-index="lightbox?.index || 0"
      title="Sarah"
      @close="lightbox = null"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FaneqoMediaGrid from '@/components/media/FaneqoMediaGrid.vue'
import FaneqoMediaLightbox from '@/components/media/FaneqoMediaLightbox.vue'
import FaneqoMediaPreview from '@/components/media/FaneqoMediaPreview.vue'
import FaneqoMessageComposer from '@/components/messages/FaneqoMessageComposer.vue'
import { galleryLabItems, galleryLabSet } from '@/config/galleryLab'

const widths = [390, 430, 768, 1280]
const width = ref(390)
const lightbox = ref(null)
const cache = new Map()
const portrait = galleryLabSet('portrait').slice(0, 1)
const wide = galleryLabSet('landscape').slice(0, 1)

const previewStates = [
  { localId: 'ready-1', previewUrl: '/__dev/gallery/square-mark.svg', state: 'ready', error: null },
  { localId: 'up-1', previewUrl: '/__dev/gallery/portrait-crowd.svg', state: 'uploading', error: null },
  { localId: 'fail-1', previewUrl: '/__dev/gallery/wide-haze.svg', state: 'failed', error: 'Failed' },
]

function items(count) {
  if (!cache.has(count)) cache.set(count, galleryLabItems(count))
  return cache.get(count)
}

function openFrom(list, { index } = {}) {
  lightbox.value = { items: list, index: Math.max(0, Number(index) || 0) }
}
</script>

<style scoped>
.dmlab {
  font-family: Poppins, sans-serif;
  color: #f7f9fc;
}
.dmlab__lede {
  margin: 0 0 1.25rem;
  max-width: 40rem;
  color: #9aa6b5;
  font-size: 0.92rem;
  line-height: 1.55;
}
.dmlab__toolbar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1.4rem;
}
.dmlab__label {
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.dmlab__pills { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.dmlab__pill {
  min-height: 2.75rem;
  padding: 0 0.75rem;
  border: 1px solid rgba(247, 249, 252, 0.12);
  background: #111217;
  color: #f7f9fc;
  cursor: pointer;
}
.dmlab__pill.is-on {
  border-color: #39ff14;
  color: #39ff14;
}
.dmlab__block { margin: 0 0 2rem; }
.dmlab__kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #39ff14;
}
.dmlab__head h2 {
  margin: 0.2rem 0 0.35rem;
  font-size: 1.15rem;
}
.dmlab__stage-wrap {
  overflow: auto;
  padding: 0.5rem 0 1rem;
}
.dmlab__stage {
  background: #0a0b0e;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 1rem;
  padding: 0.7rem 0.7rem 0;
}
.dmlab__stage.is-thread {
  padding: 0.85rem 0.7rem 1.1rem;
}
.dmlab__thread {
  padding: 0.4rem 0.3rem 0.8rem;
}
.dmlab__peer {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
}
.dmlab__hint {
  margin: 0.15rem 0 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.8rem;
}
.dmlab__msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin: 0 0 0.85rem;
}
.dmlab__msg.is-mine { align-items: flex-end; }
.dmlab__count {
  margin: 0;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}
.dmlab__bubble {
  max-width: min(72vw, 18.75rem);
}
</style>
