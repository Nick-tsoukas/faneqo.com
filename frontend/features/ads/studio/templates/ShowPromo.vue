<template>
  <article
    class="board"
    :class="[`v-${variant}`, { 'has-photo': Boolean(photo) }]"
    :data-format="formatId"
    :style="vars"
    :aria-label="`${artistName} live${place ? ' in ' + place : ''}${show.date ? ' on ' + longDate : ''}.`"
  >
    <PhotoField v-if="variant === 'poster'" class="field" :media="photo" :focal="focal" fade="both" />
    <PhotoField v-else class="band" :media="photo" :focal="focal" fade="bottom" />

    <header class="top">
      <p class="kicker">{{ c.kicker }}</p>
    </header>

    <div class="lower">
      <p v-if="c.headline" class="headline">{{ c.headline }}</p>
      <h1 :style="{ fontSize: `calc(var(--h1) * ${nameScale(artistName, { short: 9, medium: 14, long: 22 })})` }">{{ artistName }}</h1>

      <!-- Date and room are one unit under the name: when, then where. -->
      <div v-if="hasDetails" class="details" :class="{ 'is-ticket': variant === 'ticket' }">
        <div v-if="variant === 'ticket'" class="stub" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div class="when">
          <div v-if="show.date" class="date">
            <strong>{{ day }}</strong>
            <span>{{ month }}<em v-if="weekday">{{ weekday }}</em></span>
          </div>
          <div class="where" :class="{ 'has-date': Boolean(show.date) }">
            <p v-if="show.venue" class="venue">{{ show.venue }}</p>
            <p v-if="place || show.time || show.doorsTime" class="meta">
              <span v-if="place">{{ place }}</span>
              <span v-if="show.doorsTime">Doors {{ clock(show.doorsTime) }}</span>
              <span v-if="show.time">Show {{ clock(show.time) }}</span>
            </p>
            <p v-if="show.priceLine || show.ageRestriction" class="meta meta--soft">
              <span v-if="show.priceLine">{{ show.priceLine }}</span>
              <span v-if="show.ageRestriction">{{ show.ageRestriction }}</span>
            </p>
          </div>
        </div>
      </div>
      <!-- No show: the board stays honest and quiet. The editor says what is missing. -->
    </div>

    <CreativeClose class="foot" :cta="c.cta" :site="c.site" />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import CreativeClose from '@/features/ads/studio/primitives/CreativeClose.vue'
import PhotoField from '@/features/ads/studio/primitives/PhotoField.vue'
import { boardVars, nameScale } from '@/features/ads/studio/board.js'
import { isAdFormat } from '@/features/ads/formats.js'

/**
 * Show / Event Promotion. A poster, not a dashboard: photograph, a big date,
 * the artist name, venue and city, the close. Details come from the event
 * record; missing details are left out, never invented.
 * Variants: poster (full-bleed photo), ticket (photo band + stub details).
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

const LAYOUTS = {
  post: { 'top-top': 96, h1: 118, date: 132, 'band-h': 720, 'lower-bottom': 232, 'foot-bottom': 96 },
  feed: { 'top-top': 96, h1: 112, date: 124, 'band-h': 640, 'lower-bottom': 232, 'foot-bottom': 96 },
  // Story: the photo band starts under the platform chrome so faces never sit beneath it.
  story: { 'top-top': 290, h1: 128, date: 148, 'band-top': 120, 'band-h': 1100, 'lower-bottom': 480, 'foot-bottom': 344 },
  square: { 'top-top': 80, h1: 96, date: 108, 'band-h': 580, 'lower-bottom': 190, 'foot-bottom': 80 },
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))
const vars = computed(() => boardVars(formatId.value, LAYOUTS))
const c = computed(() => props.content || {})
const variant = computed(() => (c.value.variant === 'ticket' ? 'ticket' : 'poster'))
const show = computed(() => c.value.show || {})
const artistName = computed(() => c.value.artistName || props.snapshot?.name || 'Artist')
const photo = computed(() => c.value.photo || show.value.image || props.snapshot?.hero || null)
const focal = computed(() => c.value.focal || photo.value?.focal || null)
const place = computed(() => [show.value.city, show.value.state].filter(Boolean).join(', '))
const dateParts = computed(() => {
  const m = String(show.value.date || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return { day: Number(m[3]), month: MONTHS[Number(m[2]) - 1], weekday: DAYS[d.getUTCDay()], year: m[1] }
})
const day = computed(() => dateParts.value?.day ?? '')
const month = computed(() => (dateParts.value?.month || '').slice(0, 3))
const weekday = computed(() => (dateParts.value?.weekday || '').slice(0, 3))
const longDate = computed(() => (dateParts.value ? `${dateParts.value.month} ${dateParts.value.day}` : ''))
const hasDetails = computed(() => Boolean(show.value.venue || place.value || show.value.date))

function clock(value) {
  const m = String(value || '').match(/^(\d{1,2}):(\d{2})/)
  if (!m) return String(value || '')
  const h = Number(m[1])
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m[2] === '00' ? `${hour} ${suffix}` : `${hour}:${m[2]} ${suffix}`
}
</script>

<style scoped>
.board {
  position: relative;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1440px);
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.field {
  position: absolute;
  inset: 0;
}

.band {
  position: absolute;
  top: var(--band-top, 0px);
  right: 0;
  left: 0;
  height: var(--band-h);
}

.top {
  position: absolute;
  top: var(--top-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.kicker {
  margin: 6px 0 0;
  color: #7ee7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.when {
  display: flex;
  align-items: stretch;
  gap: 30px;
}

.date {
  display: flex;
  flex: none;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
}

.date strong {
  font-size: var(--date, 104px);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 0.8;
}

.date span {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 6px;
  font-size: calc(var(--date, 104px) * 0.24);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.date em {
  color: rgba(247, 249, 252, 0.55);
  font-size: calc(var(--date, 104px) * 0.15);
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.lower {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--lower-bottom);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.headline {
  margin: 0;
  color: rgba(247, 249, 252, 0.78);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  padding-top: 0.04em;
  font-weight: 800;
  letter-spacing: -0.055em;
  /* Caps need room: a two-line name never touches itself or the line above. */
  line-height: 0.94;
  text-wrap: balance;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.details {
  margin-top: 14px;
}

.where {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.where.has-date {
  padding-left: 30px;
  border-left: 2px solid rgba(247, 249, 252, 0.22);
}

.details.is-ticket {
  position: relative;
  padding: 26px 0 0;
}

.stub {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.stub i {
  flex: 1;
  height: 2px;
  background: rgba(247, 249, 252, 0.35);
}

.venue {
  margin: 0;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 26px;
  margin: 0;
  color: rgba(247, 249, 252, 0.78);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.meta--soft {
  color: rgba(247, 249, 252, 0.52);
  font-size: 20px;
}

.foot {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--foot-bottom);
  left: var(--safe-x);
  z-index: 2;
  width: auto;
}
</style>
