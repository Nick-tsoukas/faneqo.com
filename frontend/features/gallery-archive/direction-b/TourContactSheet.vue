<template>
  <div class="tcs">
    <div class="tcs__inner">
      <header class="tcs__head">
        <p class="tcs__kicker">Galleries</p>
        <div class="tcs__title">
          <h1 class="tcs__artist">{{ artistName || 'Contact sheet' }}</h1>
          <a v-if="canCreate && !isEmpty" class="tcs__create" :href="createHref" @click="onCreate">Create gallery</a>
        </div>
        <p class="tcs__ledger">
          <span class="tcs__sheet">Tour contact sheet</span>
          <span v-if="ledger" class="tcs__totals">{{ ledger }}</span>
        </p>
      </header>

      <p v-if="loading" class="tcs__state" role="status">Pulling the sheet…</p>

      <div v-else-if="!canCreate" class="tcs__state tcs__state--block">
        <h2>Artist access required</h2>
        <p>Sign in as the band owner or an authorized team member.</p>
      </div>

      <div v-else-if="error" class="tcs__state tcs__state--block" role="alert">
        <h2>Couldn’t pull the sheet.</h2>
        <p>The frames are still there. This was a connection problem.</p>
        <button type="button" class="tcs__retry" @click="emit('retry')">Try again</button>
      </div>

      <div v-else-if="isEmpty" class="tcs__empty">
        <h2>Nothing is printed yet.</h2>
        <p>Photographs from a show stamp themselves onto this sheet under the Night they came from. Anything else prints as a loose set.</p>
        <a class="tcs__create tcs__create--empty" :href="createHref" @click="onCreate">Create gallery</a>
      </div>

      <div v-else class="tcs__body">
        <nav class="tcs__index" aria-label="Tour index">
          <ol>
            <li v-for="entry in index" :key="entry.id">
              <p v-if="entry.year" class="tcs__ix-year">{{ entry.year }}</p>
              <a
                class="tcs__ix"
                :class="{ 'is-on': entry.id === active, 'is-general': entry.kind === 'general' }"
                :href="`#${entry.id}`"
              >
                <span class="tcs__ix-day">{{ entry.day }}</span>
                <span class="tcs__ix-place">{{ entry.place }}</span>
              </a>
            </li>
          </ol>
        </nav>

        <div ref="sheetRef" class="tcs__sheets">
          <ContactBand
            v-for="(shelf, i) in nightShelves"
            :key="shelf.key"
            :shelf="shelf"
            :priority="i === 0"
            :links-live="linksLive"
            @open="onOpen"
            @night="onNight"
          />
          <ContactBand
            v-if="generalShelf"
            :key="generalShelf.key"
            :shelf="generalShelf"
            variant="general"
            :links-live="linksLive"
            @open="onOpen"
          />
        </div>
      </div>

      <p v-if="note" class="tcs__note" role="status">{{ note }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import ContactBand from './ContactBand.vue'
import { sheetLedger, sheetTotals, tourIndex } from './contactSheet.js'
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
const active = ref('')
const sheetRef = ref(null)
const shelves = computed(() => groupArchiveShelves(props.items))
const nightShelves = computed(() => shelves.value.filter((shelf) => shelf.kind === 'night'))
const generalShelf = computed(() => shelves.value.find((shelf) => shelf.kind === 'general') || null)
const isEmpty = computed(() => !shelves.value.length)
const ledger = computed(() => sheetLedger(sheetTotals(shelves.value)))
const index = computed(() => tourIndex([...nightShelves.value, ...(generalShelf.value ? [generalShelf.value] : [])]))

/* The index has to say where you are, or it is a list and not an index. */
let observer = null

function watchBands() {
  if (typeof IntersectionObserver === 'undefined') return
  observer?.disconnect()
  const root = sheetRef.value
  if (!root) return
  observer = new IntersectionObserver((entries) => {
    const hit = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
    if (hit?.target?.id) active.value = hit.target.id
  }, { rootMargin: '-4% 0px -72% 0px', threshold: 0 })
  root.querySelectorAll('section[id]').forEach((band) => observer.observe(band))
}

watch(() => props.items, async () => {
  await nextTick()
  watchBands()
}, { immediate: true, flush: 'post' })

onBeforeUnmount(() => observer?.disconnect())

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
/*
 * DIRECTION B — the page is one sheet. A compact printed header, a
 * chronological index down the left, and photography from there to the bottom.
 */
.tcs {
  min-height: 100dvh;
  background: #050506;
  color: #f5f5f6;
}
.tcs__inner {
  max-width: 124rem;
  margin: 0 auto;
  padding: clamp(1.1rem, 2.6vw, 2.2rem) clamp(1rem, 3vw, 3.5rem) clamp(4rem, 10vh, 7rem);
}

/* ---- printed header ---- */

.tcs__kicker {
  margin: 0;
  color: rgba(245, 245, 246, 0.4);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.tcs__title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.3rem;
}
.tcs__artist {
  margin: 0;
  font-size: clamp(1.75rem, 4.4vw, 2.9rem);
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1;
}
.tcs__ledger {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.9rem;
  margin: 0.55rem 0 0;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}
.tcs__sheet {
  color: rgba(245, 245, 246, 0.72);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.tcs__totals {
  color: rgba(245, 245, 246, 0.42);
  letter-spacing: 0.02em;
}
.tcs__create {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 1rem;
  border-radius: 0.5rem;
  background: #f5f5f6;
  color: #08090a;
  font-size: 0.82rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
}
.tcs__create:hover {
  background: #ffffff;
}
.tcs__create:focus-visible,
.tcs__retry:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}

/* ---- sheet body ---- */

.tcs__body {
  display: grid;
  gap: clamp(2.2rem, 5vw, 3.4rem);
  margin-top: clamp(1.2rem, 2.4vw, 1.8rem);
}
.tcs__sheets {
  display: grid;
  gap: clamp(2.4rem, 4.5vw, 3.6rem);
  min-width: 0;
}

/* The index is desktop navigation; on mobile the stamps travel instead. */
.tcs__index {
  display: none;
}
.tcs__index ol {
  margin: 0;
  padding: 0;
  list-style: none;
}
.tcs__ix {
  display: grid;
  gap: 0.05rem;
  padding: 0.42rem 0 0.42rem 0.7rem;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  text-decoration: none;
  transition: border-color 160ms ease, color 160ms ease;
}
.tcs__ix-day {
  color: rgba(245, 245, 246, 0.42);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
}
.tcs__ix-place {
  color: rgba(245, 245, 246, 0.52);
  font-size: 0.78rem;
  letter-spacing: -0.012em;
}
.tcs__ix:hover .tcs__ix-place,
.tcs__ix:hover .tcs__ix-day {
  color: rgba(245, 245, 246, 0.8);
}
.tcs__ix.is-on {
  border-left-color: #f5f5f6;
}
.tcs__ix.is-on .tcs__ix-day {
  color: rgba(245, 245, 246, 0.62);
}
.tcs__ix.is-on .tcs__ix-place {
  color: #f5f5f6;
}
.tcs__ix:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 2px;
}
.tcs__ix-year {
  margin: 1.1rem 0 0.3rem;
  color: rgba(245, 245, 246, 0.28);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  font-variant-numeric: tabular-nums;
}
.tcs__ix.is-general {
  margin-top: 0.9rem;
}

/* ---- states ---- */

.tcs__state,
.tcs__empty {
  max-width: 34rem;
  margin: clamp(2.4rem, 7vw, 4.5rem) 0 0;
  color: rgba(245, 245, 246, 0.5);
  font-size: 0.92rem;
  line-height: 1.5;
}
.tcs__state--block h2,
.tcs__empty h2 {
  margin: 0;
  color: #f5f5f6;
  font-size: clamp(1.4rem, 4.6vw, 1.85rem);
  font-weight: 600;
  letter-spacing: -0.038em;
  line-height: 1.12;
}
.tcs__state--block p,
.tcs__empty p {
  margin: 0.65rem 0 0;
}
.tcs__retry {
  min-height: 44px;
  margin-top: 0.4rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f6;
  font-size: 0.88rem;
  font-weight: 620;
  cursor: pointer;
}
.tcs__create--empty {
  margin-top: 1.3rem;
}
.tcs__note {
  margin: 2.2rem 0 0;
  color: rgba(245, 245, 246, 0.38);
  font-size: 0.76rem;
}

@media (max-width: 759px) {
  .tcs__title {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.8rem;
  }
}

@media (min-width: 1080px) {
  .tcs__body {
    grid-template-columns: minmax(8rem, 10.5rem) minmax(0, 1fr);
    align-items: start;
    gap: clamp(1.8rem, 2.6vw, 3rem);
  }
  .tcs__index {
    display: block;
    position: sticky;
    top: 1.4rem;
    max-height: calc(100dvh - 3rem);
    overflow-y: auto;
    scrollbar-width: thin;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tcs__ix {
    transition: none;
  }
}
</style>
