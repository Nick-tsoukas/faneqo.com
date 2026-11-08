<template>
  <div class="nj">
    <div class="nj__inner">
      <header class="nj__masthead">
        <p class="nj__kicker">Galleries</p>
        <h1 class="nj__title">Your Nights,<br>in pictures.</h1>
        <div class="nj__ledger">
          <p class="nj__facts">
            <span v-if="artistName" class="nj__artist">{{ artistName }}</span>
            <span v-if="artistName && ledger" class="nj__dot" aria-hidden="true">·</span>
            <span v-if="ledger">{{ ledger }}</span>
          </p>
          <!-- The empty state owns the only Create action when there is nothing to show. -->
          <a v-if="canCreate && !isEmpty" class="nj__create" :href="createHref" @click="onCreate">Create gallery</a>
        </div>
      </header>

      <p v-if="loading" class="nj__state" role="status">Gathering your Nights…</p>

      <div v-else-if="!canCreate" class="nj__state nj__state--block">
        <h2>Artist access required</h2>
        <p>Sign in as the band owner or an authorized team member.</p>
      </div>

      <div v-else-if="error" class="nj__state nj__state--block" role="alert">
        <h2>Couldn’t load your Nights.</h2>
        <p>The archive is still there. This was a connection problem.</p>
        <button type="button" class="nj__retry" @click="emit('retry')">Try again</button>
      </div>

      <div v-else-if="isEmpty" class="nj__empty">
        <h2>The first Night goes here.</h2>
        <p>Photographs from a show become a chapter in this journal. Anything else becomes a gallery of its own.</p>
        <a class="nj__create nj__create--empty" :href="createHref" @click="onCreate">Create gallery</a>
      </div>

      <template v-else>
        <div v-if="nightChapters.length" class="nj__journal">
          <template v-for="(shelf, index) in nightChapters" :key="shelf.key">
            <p v-if="shelf.yearLabel" class="nj__year">{{ shelf.yearLabel }}</p>
            <NightJournalChapter
              :shelf="shelf"
              :priority="index === 0"
              :links-live="linksLive"
              @open="onOpen"
              @night="onNight"
            />
          </template>
        </div>

        <section v-if="generalGalleries.length" class="njo">
          <header class="njo__head">
            <h2 class="njo__title">Outside the Night</h2>
            <p class="njo__sub">{{ outsideContext }}</p>
          </header>
          <div class="njo__field">
            <NightJournalPlate
              v-for="gallery in generalGalleries"
              :key="gallery.id"
              :item="gallery"
              role="general"
              @open="onOpen"
            />
          </div>
        </section>
      </template>

      <p v-if="note" class="nj__note" role="status">{{ note }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import NightJournalChapter from './NightJournalChapter.vue'
import NightJournalPlate from './NightJournalPlate.vue'
import { archiveSummary, chapterContext, summaryLine } from './nightJournal.js'
import { galleryTitle, groupArchiveShelves } from '~/utils/galleries/archiveShelves'

const props = defineProps({
  items: { type: Array, default: () => [] },
  artistName: { type: String, default: '' },
  canCreate: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  linksLive: { type: Boolean, default: false },
  createHref: { type: String, default: '/galleries/new' },
})

const emit = defineEmits(['retry'])

const note = ref('')
const shelves = computed(() => groupArchiveShelves(props.items))
const nightChapters = computed(() => shelves.value.filter((shelf) => shelf.kind === 'night'))
const generalShelf = computed(() => shelves.value.find((shelf) => shelf.kind === 'general') || null)
const generalGalleries = computed(() => generalShelf.value?.galleries || [])
const isEmpty = computed(() => !nightChapters.value.length && !generalGalleries.value.length)
const ledger = computed(() => summaryLine(archiveSummary(shelves.value)))
const outsideContext = computed(() => {
  const totals = generalShelf.value ? chapterContext(generalShelf.value) : ''
  return totals ? `Not from a show · ${totals}` : 'Not from a show'
})

/* The lab keeps navigation inert so a rendered state can be judged in place. */
function say(text) {
  if (props.linksLive) return
  note.value = text
}

function onOpen(item) {
  say(`Would open “${galleryTitle(item)}”`)
}

function onNight(shelf) {
  say(`Would open the Night at ${shelf?.venue || shelf?.show?.city || 'this show'}`)
}

function onCreate(event) {
  if (props.linksLive) return
  event.preventDefault()
  say('Would open Create gallery')
}
</script>

<style scoped>
.nj {
  min-height: 100dvh;
  background: #050506;
  color: #f5f5f6;
}
.nj__inner {
  max-width: 100rem;
  margin: 0 auto;
  padding: clamp(1.6rem, 5vw, 4rem) clamp(1.05rem, 4.2vw, 5rem) clamp(5rem, 12vh, 9rem);
}

/* ---- masthead ---- */

.nj__kicker {
  margin: 0;
  color: rgba(245, 245, 246, 0.42);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.nj__title {
  margin: 0.6rem 0 0;
  font-size: clamp(2.35rem, 8.6vw, 4.6rem);
  font-weight: 600;
  letter-spacing: -0.05em;
  line-height: 0.98;
}
.nj__ledger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.9rem 1.5rem;
  margin-top: clamp(1.8rem, 4vw, 2.8rem);
  padding-top: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.nj__facts {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem;
  margin: 0;
  color: rgba(245, 245, 246, 0.5);
  font-size: 0.86rem;
  font-variant-numeric: tabular-nums;
}
.nj__artist {
  color: rgba(245, 245, 246, 0.82);
  font-weight: 560;
}
.nj__dot {
  color: rgba(245, 245, 246, 0.28);
}
.nj__create {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 1.1rem;
  border-radius: 0.6rem;
  background: #f5f5f6;
  color: #08090a;
  font-size: 0.88rem;
  font-weight: 650;
  letter-spacing: -0.012em;
  text-decoration: none;
  white-space: nowrap;
}
.nj__create:hover {
  background: #ffffff;
}
.nj__create:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}

/* ---- chronology ---- */

.nj__journal {
  display: grid;
  gap: clamp(4rem, 9vw, 7.5rem);
  margin-top: clamp(2.8rem, 7vw, 5rem);
}
.nj__year {
  margin: clamp(1.4rem, 3vw, 2.4rem) 0 0;
  padding-top: 0.7rem;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
  color: rgba(245, 245, 246, 0.3);
  font-size: 0.76rem;
  font-weight: 650;
  letter-spacing: 0.24em;
  font-variant-numeric: tabular-nums;
}
.nj__journal > .nj__year + * {
  margin-top: clamp(-2.4rem, -4vw, -1.4rem);
}

/* ---- outside the Night ---- */

.njo {
  margin-top: clamp(5rem, 12vw, 9rem);
  padding-top: clamp(1.6rem, 3vw, 2.4rem);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.njo__title {
  margin: 0;
  color: rgba(245, 245, 246, 0.86);
  font-size: clamp(1.1rem, 3.2vw, 1.28rem);
  font-weight: 600;
  letter-spacing: -0.028em;
}
.njo__sub {
  margin: 0.35rem 0 0;
  color: rgba(245, 245, 246, 0.36);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}
.njo__field {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.9rem 1.05rem;
  margin-top: clamp(1.6rem, 3.5vw, 2.4rem);
}

@media (min-width: 760px) {
  .njo__field {
    grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
    gap: 2.2rem 1.6rem;
  }
}
@media (min-width: 1080px) {
  .njo__field {
    max-width: 62rem;
  }
}

/* ---- states ---- */

.nj__state,
.nj__empty {
  max-width: 34rem;
  margin: clamp(3rem, 9vw, 6rem) 0 0;
  color: rgba(245, 245, 246, 0.5);
  font-size: 0.95rem;
  line-height: 1.5;
}
.nj__state--block h2,
.nj__empty h2 {
  margin: 0;
  color: #f5f5f6;
  font-size: clamp(1.5rem, 5.4vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.nj__state--block p,
.nj__empty p {
  margin: 0.7rem 0 0;
}
.nj__retry {
  min-height: 44px;
  margin-top: 0.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f6;
  font-size: 0.9rem;
  font-weight: 620;
  cursor: pointer;
}
.nj__retry:focus-visible,
.nj__create--empty:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}
.nj__create--empty {
  margin-top: 1.4rem;
}
.nj__note {
  margin: 2.5rem 0 0;
  color: rgba(245, 245, 246, 0.38);
  font-size: 0.78rem;
  letter-spacing: 0.01em;
}

@media (max-width: 759px) {
  .nj__ledger {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
