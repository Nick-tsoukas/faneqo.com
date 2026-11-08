<template>
  <section class="njc" :class="[`is-${kind}`, { 'is-tall': tall }]">
    <div class="njc__margin">
      <p v-if="identity.dateline" class="njc__date">{{ identity.dateline }}</p>
      <h2 class="njc__headline">{{ identity.headline }}</h2>
      <p v-if="identity.place" class="njc__place">{{ identity.place }}</p>
      <p v-if="context" class="njc__context">{{ context }}</p>
      <a
        v-if="nightHref"
        class="njc__night"
        :href="nightHref"
        @click="onNight"
      >View Night</a>
    </div>

    <div class="njc__field">
      <NightJournalPlate
        v-for="(gallery, index) in shelf.galleries"
        :key="gallery.id"
        :item="gallery"
        :role="roles[index] || 'support'"
        :priority="priority && index < 2"
        :style="plateStyle(index)"
        @open="(item, payload) => emit('open', item, payload)"
      />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import NightJournalPlate from './NightJournalPlate.vue'
import {
  chapterContext,
  chapterIdentity,
  journalChapterKind,
  journalPlateRoles,
  SHELF_GRIDS,
  shelfPlan,
} from './nightJournal.js'

const props = defineProps({
  shelf: { type: Object, required: true },
  priority: { type: Boolean, default: false },
  linksLive: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'night'])

const count = computed(() => (props.shelf?.galleries || []).length)
const kind = computed(() => journalChapterKind(count.value))
const roles = computed(() => journalPlateRoles(count.value))
const identity = computed(() => chapterIdentity(props.shelf))
const context = computed(() => chapterContext(props.shelf))
const nightHref = computed(() => props.shelf?.recapHref || '')
/* Only a tall field earns a travelling dateline. A single print does not. */
const tall = computed(() => count.value >= 3)

/* Each breakpoint lays the shelf on its own grid, so each needs its own plan. */
const plans = computed(() => (kind.value === 'shelf'
  ? SHELF_GRIDS.map((grid) => ({ ...grid, ...shelfPlan(count.value, grid.tracks, grid.unit) }))
  : null))

function plateStyle(index) {
  if (!plans.value) return undefined
  const style = {}
  for (const plan of plans.value) {
    style[`--span-${plan.key}`] = String(plan.spans[index] || plan.unit)
    style[`--cap-${plan.key}`] = plan.caps[index] ? '60%' : '100%'
  }
  return style
}

function onNight(event) {
  if (props.linksLive) return
  event.preventDefault()
  emit('night', props.shelf)
}
</script>

<style scoped>
/*
 * A chapter, not a section card. Chronology and typography do the grouping.
 * Desktop puts the Night in the journal margin and gives the whole width to
 * the photographs.
 */
.njc {
  display: grid;
  gap: 1.5rem;
}

.njc__date {
  margin: 0;
  color: rgba(245, 245, 246, 0.44);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.njc__headline {
  margin: 0.5rem 0 0;
  color: #f5f5f6;
  font-size: clamp(1.7rem, 6.4vw, 2.15rem);
  font-weight: 600;
  letter-spacing: -0.042em;
  line-height: 1.04;
  text-wrap: balance;
}
.njc__place {
  margin: 0.42rem 0 0;
  color: rgba(245, 245, 246, 0.58);
  font-size: 0.98rem;
  letter-spacing: -0.01em;
}
.njc__context {
  margin: 0.85rem 0 0;
  color: rgba(245, 245, 246, 0.36);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
}
.njc__night {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 0.25rem;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.86rem;
  font-weight: 560;
  letter-spacing: -0.01em;
  text-decoration: none;
  text-underline-offset: 0.32em;
  transition: color 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.njc__night:hover {
  color: #f5f5f6;
  text-decoration: underline;
  text-decoration-color: rgba(245, 245, 246, 0.35);
}
.njc__night:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 4px;
  border-radius: 2px;
}

.njc__field {
  display: grid;
  gap: 2.1rem 1.05rem;
  min-width: 0;
}

/* ---- mobile rhythm: no two chapters breathe the same way ---- */

.njc.is-pair .njc__field > *:nth-child(2) {
  width: 82%;
  margin-left: auto;
  margin-top: 0.5rem;
}
.njc.is-spread .njc__field,
.njc.is-shelf .njc__field {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.njc.is-spread .njc__field > *:first-child {
  grid-column: 1 / -1;
}
/*
 * A shelf is a lead print over a contact sheet. The lead is sized by height
 * (`--njp-hero`) rather than by how many columns the remainder left it, so the
 * Night's main gallery is always the largest photograph in its chapter. On
 * mobile the lead simply takes the field.
 */
.njc.is-shelf .njc__field > * {
  --njp-hero: 60rem;
  --njp-cap: var(--cap-a, 100%);
  grid-column: span var(--span-a, 1);
}

@media (min-width: 430px) {
  .njc.is-pair .njc__field > *:nth-child(2) {
    width: 76%;
  }
}

/* ---- desktop: journal margin + wide photographic field ---- */

@media (min-width: 1080px) {
  .njc {
    grid-template-columns: minmax(12rem, 16.5rem) minmax(0, 1fr);
    gap: clamp(2.75rem, 4.6vw, 5rem);
    align-items: start;
  }
  .njc.is-tall .njc__margin {
    position: sticky;
    top: clamp(5rem, 12vh, 8rem);
  }
  .njc__headline {
    font-size: clamp(1.55rem, 1.9vw, 2rem);
  }
  .njc__field {
    gap: clamp(2.4rem, 3.2vw, 3.4rem) clamp(1.3rem, 2vw, 2.1rem);
  }

  /*
   * One gallery — the largest print on the page. The plate keeps the whole
   * measure so its annotation line runs the full width; only the photograph
   * is capped, because a portrait print that filled 1400px would be absurd.
   */
  .njc.is-solo .njc__field {
    grid-template-columns: minmax(0, 1fr);
  }

  /* two — a composed pair, offset so it reads as a spread, not a row */
  .njc.is-pair .njc__field {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 54rem;
  }
  .njc.is-pair .njc__field > *:nth-child(2) {
    width: 100%;
    margin-left: 0;
    margin-top: clamp(2rem, 3.6vw, 3.6rem);
  }

  /* three — lead print beside two supports */
  .njc.is-spread .njc__field {
    grid-template-columns: 1.62fr 1fr;
    align-items: start;
  }
  .njc.is-spread .njc__field > *:first-child {
    grid-column: 1;
    grid-row: 1 / span 2;
  }

  /* four or more — an intentional shelf led by one print, every row closed */
  .njc.is-shelf .njc__field {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .njc.is-shelf .njc__field > * {
    /* Tall enough that no print closing a row can ever out-tower the lead. */
    --njp-hero: max(44rem, 52vw);
    --njp-cap: var(--cap-b, 100%);
    grid-column: span var(--span-b, 1);
  }
}

@media (min-width: 1600px) {
  .njc {
    grid-template-columns: minmax(14rem, 19rem) minmax(0, 1fr);
  }
  .njc.is-pair .njc__field {
    max-width: 64rem;
  }
  .njc.is-shelf .njc__field {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
  .njc.is-shelf .njc__field > * {
    --njp-hero: 50rem;
    --njp-cap: var(--cap-c, 100%);
    grid-column: span var(--span-c, 1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .njc__night {
    transition: none;
  }
  .njc.is-tall .njc__margin {
    position: static;
  }
}
</style>
