<template>
  <div class="glab">
    <p class="glab__lede">
      Production <code>FaneqoMediaGrid</code> gallery variant. Cover =
      <code>media[0]</code>. 5+ mounts four cells and a +N count; the lightbox keeps the full ordered set. Artist Updates and
      Show Photos stay hidden. Bubble is the DM presentation.
    </p>

    <ol class="glab__order">
      <li>Story</li>
      <li>Hierarchy</li>
      <li>Media</li>
      <li>Typography</li>
      <li>Space</li>
      <li>Interaction</li>
      <li>Motion</li>
      <li>Decoration</li>
    </ol>

    <div class="glab__toolbar">
      <span class="glab__label">Width</span>
      <div class="glab__pills" role="group" aria-label="Preview width">
        <button
          v-for="w in widths"
          :key="w"
          type="button"
          class="glab__pill"
          :class="{ 'is-on': width === w }"
          :aria-pressed="width === w"
          @click="width = w"
        >
          {{ w }}
        </button>
      </div>
    </div>

    <section class="glab__block">
      <header class="glab__head">
        <p class="glab__kicker">Artist galleries</p>
        <h2>Index cards</h2>
        <p>Same collage language, inside a predictable 16 / 10 media frame.</p>
      </header>
      <div class="glab__stage-wrap">
        <div class="glab__stage" :style="{ width: `${width}px` }">
          <ul class="glab__cards">
            <li v-for="card in indexCards" :key="card.title" class="glab__card">
              <div class="glab__card-media">
                <FaneqoMediaGrid :items="card.items" variant="gallery" :interactive="false" />
              </div>
              <div class="glab__card-copy">
                <div>
                  <p class="glab__card-context">{{ card.context }}</p>
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.meta }}</p>
                </div>
                <div class="glab__card-actions">
                  <span>View</span>
                  <span>Send to fans</span>
                  <span>Share</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="glab__block">
      <header class="glab__head">
        <p class="glab__kicker">Production gallery</p>
        <h2>Music-editorial compositions</h2>
        <p>1 editorial · 2 pair · 3 hero + support · 4 mosaic · 5+ opening + count · 60-photo concert set / 4-cell opening.</p>
      </header>
      <div class="glab__stage-wrap">
        <div class="glab__stage" :style="{ width: `${width}px` }">
          <article v-for="count in counts" :key="`g-${count}`" class="glab__case">
            <h3>{{ caseTitle(count) }}</h3>
            <FaneqoMediaGrid :items="items(count)" variant="gallery" @open="openFrom(items(count), $event)" />
          </article>
        </div>
      </div>
    </section>

    <section class="glab__block">
      <header class="glab__head">
        <p class="glab__kicker">Orientation</p>
        <h2>Aspect-ratio rules</h2>
        <p>Portrait-heavy, landscape-heavy, mixed. Same component, different MediaItem ratios.</p>
      </header>
      <div class="glab__stage-wrap">
        <div class="glab__stage" :style="{ width: `${width}px` }">
          <article class="glab__case">
            <h3>Portrait 3</h3>
            <FaneqoMediaGrid :items="portrait" variant="gallery" @open="openFrom(portrait, $event)" />
          </article>
          <article class="glab__case">
            <h3>Landscape 2</h3>
            <FaneqoMediaGrid :items="landscape" variant="gallery" @open="openFrom(landscape, $event)" />
          </article>
          <article class="glab__case">
            <h3>Mixed 4</h3>
            <FaneqoMediaGrid :items="mixed" variant="gallery" @open="openFrom(mixed, $event)" />
          </article>
        </div>
      </div>
    </section>

    <section class="glab__block">
      <header class="glab__head">
        <p class="glab__kicker">Update context</p>
        <h2>Photography beside metadata</h2>
        <p>Gallery does not own titles. Type sits above. Photography remains the field.</p>
      </header>
      <div class="glab__stage-wrap">
        <div class="glab__stage" :style="{ width: `${width}px` }">
          <p class="glab__show">Nashville</p>
          <p class="glab__venue">The Basement East</p>
          <p class="glab__there">You were there</p>
          <FaneqoMediaGrid :items="items(3)" variant="gallery" @open="openFrom(items(3), $event)" />
        </div>
      </div>
    </section>

    <section class="glab__block">
      <header class="glab__head">
        <p class="glab__kicker">Profile strip</p>
        <h2>Compact artist context</h2>
        <p>Same gallery, narrower story. Not a public profile change.</p>
      </header>
      <div class="glab__stage-wrap">
        <div class="glab__stage" :style="{ width: `${width}px` }">
          <div class="glab__profile">
            <img class="glab__avatar" :src="band.bandImg.url" :alt="band.name" width="72" height="72" />
            <div>
              <p class="glab__artist">{{ band.name }}</p>
              <p class="glab__meta">Latest from the road</p>
            </div>
          </div>
          <FaneqoMediaGrid :items="items(3)" variant="gallery" @open="openFrom(items(3), $event)" />
        </div>
      </div>
    </section>

    <section class="glab__block">
      <header class="glab__head">
        <p class="glab__kicker">DM bubble</p>
        <h2>Must not inherit editorial layout</h2>
      </header>
      <div class="glab__stage-wrap">
        <div class="glab__stage" :style="{ width: `${width}px` }">
          <article v-for="count in [1, 2, 3, 4]" :key="`b-${count}`" class="glab__case">
            <h3>{{ count }} · bubble</h3>
            <FaneqoMediaGrid :items="items(count)" variant="bubble" @open="openFrom(items(count), $event)" />
          </article>
        </div>
      </div>
    </section>

    <FaneqoMediaLightbox
      :open="!!lightbox"
      :items="lightbox?.items || []"
      :start-index="lightbox?.index || 0"
      title="Gallery lab"
      zoomable
      @close="lightbox = null"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FaneqoMediaGrid from '@/components/media/FaneqoMediaGrid.vue'
import FaneqoMediaLightbox from '@/components/media/FaneqoMediaLightbox.vue'
import { neonStaticBandFixture } from '@/config/bandProfileLab'
import {
  GALLERY_LAB_COUNTS,
  GALLERY_LAB_WIDTHS,
  galleryLabItems,
  galleryLabSet,
} from '@/config/galleryLab'

const widths = GALLERY_LAB_WIDTHS
const counts = GALLERY_LAB_COUNTS
const width = ref(390)
const band = neonStaticBandFixture
const lightbox = ref(null)
const cache = new Map()
const portrait = galleryLabSet('portrait')
const landscape = galleryLabSet('landscape')
const mixed = galleryLabSet('mixed')
const indexCards = [
  { title: 'Nashville', context: 'The Basement East · Oct 18', meta: '5 photos · Show attendees · published', items: items(5) },
  { title: 'Studio session', context: 'General gallery', meta: '3 photos · Public · published', items: items(3) },
]

function items(count) {
  if (!cache.has(count)) cache.set(count, galleryLabItems(count))
  return cache.get(count)
}

function caseTitle(count) {
  if (count === 60) return '60-photo concert set · 4-cell opening'
  if (count >= 5) return `${count} · +${count - 4}`
  return String(count)
}

function openFrom(list, { index } = {}) {
  lightbox.value = { items: list, index: Math.max(0, Number(index) || 0) }
}
</script>

<style scoped>
.glab {
  font-family: Poppins, sans-serif;
  color: #f7f9fc;
}
.glab__lede {
  margin: 0 0 1.25rem;
  max-width: 42rem;
  color: #9aa6b5;
  font-size: 0.92rem;
  line-height: 1.55;
}
.glab__lede code {
  color: #f7f9fc;
  font-size: 0.85em;
}
.glab__order {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.85rem;
  margin: 0 0 1.5rem;
  padding: 0;
  list-style: none;
  counter-reset: step;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.glab__order li { counter-increment: step; }
.glab__order li::before {
  content: counter(step) '. ';
  color: #ff4fd8;
}
.glab__toolbar { margin: 0 0 2rem; }
.glab__label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.glab__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.glab__pill {
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: 0 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0b0e14;
  color: #9aa6b5;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}
.glab__pill.is-on {
  color: #f7f9fc;
  border-color: rgba(255, 255, 255, 0.28);
}
.glab__block { margin: 0 0 3rem; }
.glab__kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.glab__head h2 {
  margin: 0.3rem 0 0.4rem;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.glab__head p {
  margin: 0 0 1.1rem;
  max-width: 40rem;
  color: #9aa6b5;
  font-size: 0.88rem;
}
.glab__stage-wrap {
  overflow-x: auto;
  padding-bottom: 0.5rem;
}
.glab__stage { background: #050608; }
.glab__case { margin: 0 0 1.75rem; }
.glab__case h3 {
  margin: 0 0 0.55rem;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.glab__show {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}
.glab__venue {
  margin: 0.2rem 0 0;
  color: #9aa6b5;
  font-size: 0.88rem;
}
.glab__there {
  margin: 0.35rem 0 0.9rem;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #45e3ae;
  font-weight: 600;
}
.glab__profile {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin: 0 0 1rem;
}
.glab__avatar {
  width: 3.25rem;
  height: 3.25rem;
  object-fit: cover;
  background: #0b0e14;
}
.glab__artist {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.glab__meta {
  margin: 0.15rem 0 0;
  color: #9aa6b5;
  font-size: 0.82rem;
}
.glab__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.35rem;
  margin: 0;
  padding: 0.85rem;
  list-style: none;
}
.glab__card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  overflow: hidden;
  background: #0b0c10;
}
.glab__card-media {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #0b0e14;
}
.glab__card-media :deep(.fq-media-grid) {
  height: 100%;
  min-height: 100%;
}
.glab__card-media :deep(.fq-media-grid.is-gallery) {
  overflow: hidden;
}
.glab__card-media :deep(.fq-media-grid__cell img) {
  object-fit: cover;
  height: 100%;
}
.glab__card-copy {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex: 1;
  min-height: 6.6rem;
  padding: 0.95rem 1rem 1rem;
}
.glab__card-copy h3 {
  margin: 0.12rem 0 0;
  font-size: 1.05rem;
}
.glab__card-copy p:not(.glab__card-context) {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.44);
  font-size: 0.72rem;
}
.glab__card-context {
  margin: 0;
  color: #39d5ff;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.glab__card-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: wrap;
  color: #39d5ff;
  font-size: 0.74rem;
  font-weight: 700;
}
.glab__card-actions span:first-child {
  color: #7bf1ca;
  font-weight: 800;
}
@media (max-width: 760px) {
  .glab__cards { grid-template-columns: 1fr; gap: 1rem; }
  .glab__card-copy { display: grid; min-height: 0; gap: 0.45rem; }
  .glab__card-actions { justify-content: flex-start; }
}
</style>
