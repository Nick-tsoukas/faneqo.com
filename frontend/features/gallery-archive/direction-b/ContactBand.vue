<template>
  <section :id="anchor" class="cb" :class="`is-${variant}`" :style="scaleVars">
    <header class="cb__stamp">
      <p class="cb__when">
        <span class="cb__day">{{ stamp.day }}</span>
        <span v-if="stamp.year" class="cb__year">{{ stamp.year }}</span>
      </p>
      <h2 class="cb__head">{{ stamp.headline }}</h2>
      <p v-if="stamp.place" class="cb__place">{{ stamp.place }}</p>
      <span class="cb__rule" aria-hidden="true" />
      <p class="cb__tally">{{ tally }}</p>
      <a
        v-if="nightHref"
        class="cb__night"
        :href="nightHref"
        @click="onNight"
      >View Night</a>
    </header>

    <div class="cb__sheet">
      <template v-for="(gallery, index) in galleries" :key="gallery.id">
        <ContactPrint
          :item="gallery"
          :index="index"
          :lead="index === 0 && variant === 'night'"
          :priority="priority && index < 3"
          @open="(item, payload) => emit('open', item, payload)"
        />
        <!--
          Ends the opening strip. Each breakpoint opens on a different number of
          frames, so each gets its own marker and CSS shows exactly one.
        -->
        <span
          v-for="tier in breaksAfter(index)"
          :key="`${gallery.id}-${tier}`"
          class="cb__break"
          :class="`is-${tier}`"
          aria-hidden="true"
        />
      </template>
      <!--
        Absorbs the slack in the closing strip so a part-used strip prints at
        strip height instead of stretching. A Night that never fills a strip
        gets no spacer at all, so its few galleries print large rather than
        looking like the leftovers of a sheet.
      -->
      <span
        v-for="tier in fillTiers"
        :key="`fill-${tier}`"
        class="cb__fill"
        :class="`is-${tier}`"
        aria-hidden="true"
      />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ContactPrint from './ContactPrint.vue'
import { bandAnchor, FRAME_CAP, nightStamp, nightTally, SHEET_SCALE, stripBreak } from './contactSheet.js'

const props = defineProps({
  shelf: { type: Object, required: true },
  variant: { type: String, default: 'night' },
  priority: { type: Boolean, default: false },
  linksLive: { type: Boolean, default: false },
})

const emit = defineEmits(['open', 'night'])

const galleries = computed(() => props.shelf?.galleries || [])
const anchor = computed(() => bandAnchor(props.shelf))
const nightHref = computed(() => (props.variant === 'night' ? (props.shelf?.recapHref || '') : ''))
const stamp = computed(() => (props.variant === 'general'
  ? { day: 'No date', year: '', headline: 'Loose prints', place: 'Not from a show' }
  : nightStamp(props.shelf)))
const tally = computed(() => nightTally(props.shelf))

/* One source of truth for sheet geometry: the tiers CSS switches between. */
const scaleVars = computed(() => ({
  '--frame-cap': FRAME_CAP,
  ...Object.fromEntries(SHEET_SCALE.flatMap((tier) => [
    [`--strip-${tier.key}`, tier.strip],
    [`--gutter-${tier.key}`, tier.gutter],
  ])),
}))

function breaksAfter(index) {
  /* Loose prints have no lead, so they print as one even sheet. */
  if (props.variant === 'general') return []
  return SHEET_SCALE.filter((tier) => stripBreak(index, galleries.value.length, tier)).map((tier) => tier.key)
}

const fillTiers = computed(() => SHEET_SCALE
  .filter((tier) => props.variant === 'general' || galleries.value.length > tier.open)
  .map((tier) => tier.key))

function onNight(event) {
  if (props.linksLive) return
  event.preventDefault()
  emit('night', props.shelf)
}
</script>

<style scoped>
/*
 * A Night is a stamped strip of the sheet, not a chapter. The stamp is one
 * printed line — date, venue, city, a rule, the tally — and everything under
 * it is photography.
 */
.cb {
  scroll-margin-top: 3.5rem;
}
.cb.is-general {
  padding-top: clamp(1.4rem, 3vw, 2.2rem);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.cb__stamp {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.1rem 0.7rem;
  padding: 0.5rem 0 0.7rem;
  background: #050506;
}
.cb__when {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  color: #f5f5f6;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
}
.cb__year {
  color: rgba(245, 245, 246, 0.34);
}
.cb__head {
  margin: 0;
  color: #f5f5f6;
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: -0.026em;
}
.cb__place {
  margin: 0;
  color: rgba(245, 245, 246, 0.46);
  font-size: 0.82rem;
  letter-spacing: -0.008em;
}
.cb__rule {
  flex: 1 1 1.5rem;
  height: 1px;
  min-width: 1.5rem;
  transform: translateY(-0.28em);
  background: rgba(255, 255, 255, 0.14);
}
.cb__tally {
  margin: 0;
  color: rgba(245, 245, 246, 0.42);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
.cb__night {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin: -0.7rem 0;
  color: rgba(245, 245, 246, 0.6);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  transition: color 160ms cubic-bezier(0.22, 1, 0.36, 1);
}
.cb__night:hover {
  color: #f5f5f6;
  text-decoration: underline;
  text-underline-offset: 0.3em;
  text-decoration-color: rgba(245, 245, 246, 0.35);
}
.cb__night:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
}

/*
 * The sheet itself. Frames keep their native shape and wrap into strips; every
 * frame in a strip shares one height, because each one's width is grown from
 * its own ratio over the same measure. Nothing is squared off and no frame is
 * ever left standing taller than the strip it sits in.
 *
 * Hierarchy is the strip, not the frame: the opening strip holds a fixed, small
 * number of frames over the full measure, so the Night opens big and proves
 * itself in the denser runs underneath.
 */
.cb__sheet {
  --sheet-strip: var(--strip-a);
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.15rem var(--gutter-a);
}
.cb__sheet > :deep(.cp) {
  --cp-h: var(--sheet-strip);
  --cp-cap: var(--frame-cap, 30rem);
}
/*
 * Loose prints get their own handwriting: one even sheet at a slightly smaller
 * strip, with more air between frames. No lead, no opening — nothing here came
 * from a Night, so nothing here opens one.
 */
.cb.is-general .cb__sheet {
  --sheet-strip: calc(var(--strip-a) * 1.05);
  gap: 1.3rem calc(var(--gutter-a) * 1.8);
}

/* Exactly one marker is live at a time; the others are not in the flow. */
.cb__break {
  flex: 0 0 100%;
  height: 0;
  margin-block: -0.3rem;
}
.cb__break.is-b,
.cb__break.is-c {
  display: none;
}
.cb__fill {
  flex: 999999 1 0;
  min-width: 0;
  height: 0;
}
.cb__fill.is-b,
.cb__fill.is-c {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  /* Hovering one print quiets the sheet around it, the way a loupe does. */
  .cb__sheet:hover :deep(.cp) {
    opacity: 0.52;
    transition: opacity 180ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .cb__sheet:hover :deep(.cp:hover),
  .cb__sheet :deep(.cp:focus-within) {
    opacity: 1;
  }
}

@media (min-width: 760px) {
  .cb__stamp {
    gap: 0.1rem 0.9rem;
  }
}

@media (min-width: 1080px) {
  .cb {
    scroll-margin-top: 1.5rem;
  }
  .cb__stamp {
    position: static;
    padding: 0 0 0.9rem;
    background: transparent;
  }
  .cb__sheet {
    --sheet-strip: var(--strip-b);
    gap: 1.35rem var(--gutter-b);
  }
  .cb.is-general .cb__sheet {
    --sheet-strip: calc(var(--strip-b) * 1.05);
    gap: 1.6rem calc(var(--gutter-b) * 1.8);
  }
  .cb__break.is-a,
  .cb__fill.is-a {
    display: none;
  }
  .cb__break.is-b,
  .cb__fill.is-b {
    display: block;
  }
  .cb__head {
    font-size: 1.12rem;
  }
}

@media (min-width: 1600px) {
  .cb__sheet {
    --sheet-strip: var(--strip-c);
    gap: 1.5rem var(--gutter-c);
  }
  .cb.is-general .cb__sheet {
    --sheet-strip: calc(var(--strip-c) * 1.05);
    gap: 1.7rem calc(var(--gutter-c) * 1.8);
  }
  .cb__break.is-b,
  .cb__fill.is-b {
    display: none;
  }
  .cb__break.is-c,
  .cb__fill.is-c {
    display: block;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cb__night {
    transition: none;
  }
  .cb__sheet:hover :deep(.cp) {
    transition: none;
  }
}
</style>
