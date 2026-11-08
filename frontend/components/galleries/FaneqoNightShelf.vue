<template>
  <section class="fq-nshelf" :data-kind="kind" :class="{ 'is-lead': lead }">
    <p v-if="yearLabel" class="fq-nshelf__year">{{ yearLabel }}</p>
    <div class="fq-nshelf__row" :data-plates="plateDensity">
      <header class="fq-nshelf__id">
        <p v-if="marker" class="fq-nshelf__marker">{{ marker }}</p>
        <p v-if="showDate" class="fq-nshelf__date">{{ dateLabel }}</p>
        <h2 class="fq-nshelf__name">{{ heading }}</h2>
        <p v-if="showCity" class="fq-nshelf__city">{{ city }}</p>
        <p v-if="blurb" class="fq-nshelf__blurb">{{ blurb }}</p>
        <NuxtLink v-if="nightHref" :to="nightHref" class="fq-nshelf__night">
          <span>View Night</span>
          <span class="fq-nshelf__arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </header>
      <div class="fq-nshelf__plates">
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  kind: { type: String, default: 'night' },
  kicker: { type: String, default: '' },
  dateLabel: { type: String, default: '' },
  city: { type: String, default: '' },
  venue: { type: String, default: '' },
  blurb: { type: String, default: '' },
  yearLabel: { type: String, default: '' },
  nightHref: { type: String, default: '' },
  lead: { type: Boolean, default: false },
  marker: { type: String, default: '' },
  plates: { type: Number, default: 0 },
})

/**
 * The rail always carries a real heading so the document never skips from the
 * page h1 to a plate h3, even for a Night with no place name recorded.
 */
const heading = computed(() => (
  props.venue || props.city || props.dateLabel || props.kicker || 'Night'
))
const showDate = computed(() => !!props.dateLabel && props.dateLabel !== heading.value)
const showCity = computed(() => !!props.city && props.city !== heading.value)

/**
 * Sparse Nights are composed, not stretched: one gallery becomes a single large
 * plate beside its identity instead of one cell in an empty three-track row.
 */
const plateDensity = computed(() => {
  if (props.plates === 1) return 'one'
  if (props.plates === 2) return 'two'
  return 'many'
})
</script>

<style scoped>
.fq-nshelf {
  margin: 0;
}

/* Year marker rules the sheet, so a long archive reads as chronology. */
.fq-nshelf__year {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin: 0 0 1.5rem;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.2em;
}
.fq-nshelf__year::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.fq-nshelf__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.15rem;
  padding-top: 1.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
}

/* ---- identity rail ---- */
.fq-nshelf__id {
  display: grid;
  justify-items: start;
  align-content: start;
  gap: 0;
  min-width: 0;
}
.fq-nshelf__date {
  margin: 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
/* Says why the opening Night is composed larger than the rows beneath it. */
.fq-nshelf__marker {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  margin: 0 0 0.5rem;
  color: rgba(245, 245, 246, 0.72);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.fq-nshelf__marker::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #39d5ff;
}
.fq-nshelf__name {
  margin: 0.3rem 0 0;
  color: #f5f5f6;
  font-size: clamp(1.3rem, 4.6vw, 1.6rem);
  font-weight: 620;
  letter-spacing: -0.035em;
  line-height: 1.12;
  overflow-wrap: anywhere;
}
.fq-nshelf__city {
  margin: 0.28rem 0 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.92rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.fq-nshelf__blurb {
  margin: 0.4rem 0 0;
  max-width: 22ch;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.86rem;
  line-height: 1.45;
}
.fq-nshelf__night {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  margin-top: 0.15rem;
  color: rgba(245, 245, 246, 0.72);
  font-size: 0.84rem;
  font-weight: 620;
  text-decoration: none;
}
.fq-nshelf__arrow {
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.fq-nshelf__night:hover {
  color: #f5f5f6;
}
.fq-nshelf__night:hover .fq-nshelf__arrow {
  transform: translateX(2px);
}
.fq-nshelf__night:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 3px;
  border-radius: 0.2rem;
}

/* ---- plate band ---- */
.fq-nshelf__plates {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.9rem 1.05rem;
  min-width: 0;
  overflow: visible;
}

@media (min-width: 600px) {
  .fq-nshelf__plates {
    grid-template-columns: repeat(auto-fit, minmax(12.5rem, 1fr));
  }
  .fq-nshelf__row[data-plates='one'] .fq-nshelf__plates {
    grid-template-columns: minmax(0, 24rem);
  }
  .fq-nshelf.is-lead .fq-nshelf__row[data-plates='one'] .fq-nshelf__plates {
    grid-template-columns: minmax(0, 30rem);
  }
}

/* The rail moves beside the photography once there is room for both.
   Plate scale carries the chronology: the opening Night is always the largest
   thing on the page, and a sparse Night reads as a deliberate single plate
   rather than one cell of an unfinished row. */
@media (min-width: 1080px) {
  .fq-nshelf__row {
    grid-template-columns: minmax(10.5rem, 13rem) minmax(0, 1fr);
    gap: 2.4rem;
    padding-top: 1.7rem;
  }
  .fq-nshelf__plates {
    grid-template-columns: repeat(auto-fit, minmax(14.5rem, 1fr));
    gap: 2.1rem 1.35rem;
  }
  /* A sparse Night is composed as a spread rather than stretched: its identity
     takes the left of the sheet and its prints sit against the same right
     margin every crowded row uses, so nothing looks like a missing card. */
  .fq-nshelf__row[data-plates='two'] {
    grid-template-columns: minmax(0, 1fr) minmax(0, 40rem);
  }
  .fq-nshelf__row[data-plates='two'] .fq-nshelf__plates {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .fq-nshelf__row[data-plates='one'] {
    grid-template-columns: minmax(0, 1fr) minmax(0, 26rem);
  }
  .fq-nshelf__row[data-plates='one'] .fq-nshelf__plates {
    grid-template-columns: minmax(0, 1fr);
  }
  .fq-nshelf__row[data-plates='one'] .fq-nshelf__name,
  .fq-nshelf__row[data-plates='two'] .fq-nshelf__name {
    max-width: 24ch;
    font-size: clamp(1.7rem, 2.6vw, 2.3rem);
  }
  .fq-nshelf__row[data-plates='one'] .fq-nshelf__city,
  .fq-nshelf__row[data-plates='two'] .fq-nshelf__city {
    font-size: 1rem;
  }
  /* The opening Night keeps no rail. Its identity sits above the sheet and its
     photography takes the full width, which is what makes it read as an
     opening without borrowing a marketing hero. */
  .fq-nshelf.is-lead .fq-nshelf__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.7rem;
    padding-top: 0;
    border-top: 0;
  }
  .fq-nshelf.is-lead .fq-nshelf__plates {
    grid-template-columns: repeat(auto-fit, minmax(26rem, 1fr));
  }
  .fq-nshelf.is-lead .fq-nshelf__row[data-plates='two'] .fq-nshelf__plates {
    grid-template-columns: repeat(2, minmax(0, 32rem));
  }
  .fq-nshelf.is-lead .fq-nshelf__row[data-plates='one'] .fq-nshelf__plates {
    grid-template-columns: minmax(0, 42rem);
  }
  .fq-nshelf.is-lead .fq-nshelf__name,
  .fq-nshelf.is-lead .fq-nshelf__row[data-plates='one'] .fq-nshelf__name,
  .fq-nshelf.is-lead .fq-nshelf__row[data-plates='two'] .fq-nshelf__name {
    max-width: 26ch;
    font-size: clamp(2.2rem, 3.6vw, 3.1rem);
  }
  .fq-nshelf.is-lead .fq-nshelf__city {
    font-size: 1.05rem;
  }
}

@media (min-width: 1700px) {
  .fq-nshelf__row {
    grid-template-columns: minmax(12rem, 15rem) minmax(0, 1fr);
    gap: 3rem;
  }
  .fq-nshelf__plates {
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }
  .fq-nshelf__row[data-plates='two'] {
    grid-template-columns: minmax(0, 1fr) minmax(0, 46rem);
  }
  .fq-nshelf__row[data-plates='one'] {
    grid-template-columns: minmax(0, 1fr) minmax(0, 30rem);
  }
  .fq-nshelf.is-lead .fq-nshelf__plates {
    grid-template-columns: repeat(auto-fit, minmax(30rem, 1fr));
  }
  .fq-nshelf.is-lead .fq-nshelf__row[data-plates='two'] .fq-nshelf__plates {
    grid-template-columns: repeat(2, minmax(0, 38rem));
  }
  .fq-nshelf.is-lead .fq-nshelf__row[data-plates='one'] .fq-nshelf__plates {
    grid-template-columns: minmax(0, 50rem);
  }
}

/* The opening Night stands clear of the ruled rows beneath it. */
.fq-nshelf.is-lead .fq-nshelf__row {
  padding-top: 0;
  border-top: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fq-nshelf__arrow,
  .fq-nshelf__night:hover .fq-nshelf__arrow {
    transition: none;
    transform: none;
  }
}
</style>
