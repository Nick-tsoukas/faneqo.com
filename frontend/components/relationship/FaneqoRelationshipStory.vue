<template>
  <article class="rel">
    <h1 class="rel__names">{{ pairLine }}</h1>
    <p class="rel__nights">{{ nightsLine }}</p>
    <p v-if="sinceLine" class="rel__since">{{ sinceLine }}</p>

    <ol v-if="storyItems.length" class="rel__line">
      <li
        v-for="item in storyItems"
        :key="item.id"
        class="rel__beat"
        :class="beatClass(item)"
      >
        <template v-if="item.kind === 'night'">
          <p
            v-for="line in heroLines(item)"
            :key="line.id"
            class="rel__mark rel__mark--hero"
          >
            {{ line.text }}
          </p>
          <header class="rel__caption">
            <h2 class="rel__place">{{ placeLine(item.moment) }}</h2>
            <p v-if="whereLine(item.moment)" class="rel__where">{{ whereLine(item.moment) }}</p>
          </header>
          <div v-if="nightMedia(item.moment).length" class="rel__media">
            <FaneqoMediaGrid
              :items="nightMedia(item.moment)"
              variant="gallery"
              @open="openMedia(nightMedia(item.moment), $event)"
            />
          </div>
          <p
            v-for="line in quietLines(item)"
            :key="line.id"
            class="rel__mark rel__mark--quiet"
          >
            {{ line.text }}
          </p>
        </template>

        <template v-else-if="item.kind === 'night-milestone'">
          <p v-if="item.tone === 'hero'" class="rel__mark rel__mark--hero">
            {{ item.text }}
          </p>
          <header class="rel__caption">
            <h2 class="rel__place">{{ milestonePlace(item.milestone) }}</h2>
            <p v-if="milestoneWhere(item.milestone)" class="rel__where">{{ milestoneWhere(item.milestone) }}</p>
          </header>
          <p v-if="item.tone !== 'hero'" class="rel__mark" :class="markClass(item)">
            {{ item.text }}
          </p>
        </template>

        <template v-else>
          <p class="rel__mark rel__mark--quiet">{{ item.text }}</p>
          <p v-if="replyWhen(item)" class="rel__when">{{ replyWhen(item) }}</p>
        </template>
      </li>
    </ol>
    <p v-else class="rel__empty">The first night is still ahead.</p>

    <p v-if="commLine" class="rel__comm">{{ commLine }}</p>

    <FaneqoMediaLightbox
      :open="lightboxOpen"
      :items="lightboxItems"
      :start-index="lightboxIndex"
      :title="artistName"
      zoomable
      @close="lightboxOpen = false"
    />
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import FaneqoMediaGrid from '~/components/media/FaneqoMediaGrid.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import { formatJoinedMonthYear, formatShowNightDate } from '~/utils/shows/formatShowNightDate'
import { presentationForMilestone } from '~/utils/milestones/milestonePresentation'

const props = defineProps({
  artistName: { type: String, default: '' },
  fanName: { type: String, default: '' },
  joinedAt: { type: [String, Date], default: null },
  shows: { type: Object, default: () => ({ count: 0, returning: false }) },
  communication: { type: Object, default: () => ({}) },
  moments: { type: Array, default: () => [] },
  milestones: { type: Array, default: () => [] },
})

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxItems = ref([])

const artistName = computed(() => String(props.artistName || '').trim() || 'Artist')
const fanName = computed(() => String(props.fanName || '').trim() || 'Fan')

const pairLine = computed(() => `${artistName.value} × ${fanName.value}`)

const sinceLine = computed(() => {
  const when = formatJoinedMonthYear(props.joinedAt)
  return when ? `Connected since ${when}` : ''
})

const nightsLine = computed(() => {
  const n = Number(props.shows?.count) || 0
  if (n === 0) return 'No nights together yet'
  if (n === 1) return '1 night together'
  return `${n} nights together`
})

const showMoments = computed(() => {
  return (props.moments || []).filter((row) => row && row.kind === 'show')
})

const hasFirstReplyMilestone = computed(() => {
  return (props.milestones || []).some((row) => row?.type === 'fan_artist.first_reply' && row.status !== 'archived')
})

const commLine = computed(() => {
  if (hasFirstReplyMilestone.value) return ''
  const replies = Number(props.communication?.fanReplies) || 0
  const sent = Number(props.communication?.artistMessagesSent) || 0
  if (replies) {
    const when = formatShowNightDate(props.communication.lastReplyAt)
    return when ? `Replied · ${when}` : 'Replied'
  }
  if (sent) return 'A message was sent'
  return ''
})

const storyItems = computed(() => {
  const nights = showMoments.value.map((moment) => ({
    id: `night-${moment.id}`,
    kind: 'night',
    occurredAt: moment.occurredAt,
    moment,
    lines: [],
  }))
  const byAttendance = new Map()
  for (const night of nights) {
    const sourceId = night.moment?.sourceId
    if (sourceId != null) byAttendance.set(String(sourceId), night)
  }

  const extras = []
  for (const row of props.milestones || []) {
    if (!row || row.status === 'archived') continue
    const presented = presentationForMilestone(row.type)
    if (!presented) continue
    const line = {
      id: `ms-${row.id}`,
      type: row.type,
      text: presented.line,
      tone: presented.tone,
      occurredAt: row.occurredAt,
      milestone: row,
    }
    if (row.type === 'fan_artist.first_reply') {
      extras.push({ ...line, kind: 'reply' })
      continue
    }
    const attendanceId = row.evidence?.attendanceId || row.relatedShow?.attendanceId
    const night = attendanceId ? byAttendance.get(String(attendanceId)) : null
    if (night) {
      night.lines.push(line)
      continue
    }
    extras.push({ ...line, kind: 'night-milestone' })
  }

  return [...nights, ...extras].sort((a, b) => {
    const ta = new Date(a.occurredAt || 0).getTime()
    const tb = new Date(b.occurredAt || 0).getTime()
    if (ta !== tb) return ta - tb
    const rank = { night: 0, 'night-milestone': 1, reply: 2 }
    return (rank[a.kind] || 9) - (rank[b.kind] || 9)
  })
})

function replyWhen(item) {
  return formatShowNightDate(item?.occurredAt)
}

function placeLine(item) {
  const ctx = item?.showContext || {}
  return String(ctx.city || '').trim()
    || String(ctx.venue || '').trim()
    || String(ctx.title || '').trim()
    || 'A night together'
}

function whereLine(item) {
  const ctx = item?.showContext || {}
  const venue = String(ctx.venue || '').trim()
  const date = formatShowNightDate(ctx.date || item?.occurredAt)
  const place = placeLine(item)
  const parts = []
  if (venue && venue !== place) parts.push(venue)
  if (date) parts.push(date)
  return parts.join(' · ')
}

function milestonePlace(milestone) {
  const show = milestone?.relatedShow || {}
  return String(show.city || '').trim()
    || String(show.venue || '').trim()
    || String(show.title || '').trim()
    || 'A night together'
}

function milestoneWhere(milestone) {
  const show = milestone?.relatedShow || {}
  const venue = String(show.venue || '').trim()
  const date = formatShowNightDate(show.date || milestone?.occurredAt)
  const place = milestonePlace(milestone)
  const parts = []
  if (venue && venue !== place) parts.push(venue)
  if (date) parts.push(date)
  return parts.join(' · ')
}

function beatClass(item) {
  if (item.kind === 'night') {
    return { 'has-media': nightMedia(item.moment).length, 'is-return': item.lines.some((line) => line.tone === 'hero') }
  }
  if (item.kind === 'night-milestone') return { 'is-return': item.tone === 'hero' }
  return { 'is-reply': true }
}

function heroLines(item) {
  return (item?.lines || []).filter((line) => line.tone === 'hero')
}

function quietLines(item) {
  return (item?.lines || []).filter((line) => line.tone !== 'hero')
}

function markClass(line) {
  return {
    'rel__mark--hero': line.tone === 'hero',
    'rel__mark--quiet': line.tone === 'quiet',
  }
}

function nightMedia(item) {
  const updates = item?.artistUpdates || []
  const media = []
  for (const update of updates) {
    if (update?.locked) continue
    for (const row of update.media || []) media.push(row)
  }
  return media
}

function openMedia(items, { index } = {}) {
  lightboxItems.value = items || []
  lightboxIndex.value = index || 0
  lightboxOpen.value = true
}
</script>

<style scoped>
.rel {
  --rel-ink: #f7f9fc;
  --rel-mute: rgba(247, 249, 252, 0.62);
  --rel-faint: rgba(247, 249, 252, 0.42);
  --rel-return: #39D5FF;
  color: var(--rel-ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  max-width: min(100%, 56rem);
}

.rel__names {
  margin: 0;
  font-size: clamp(1.85rem, 7vw, 2.7rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.rel__nights {
  margin: 0.65rem 0 0;
  font-size: 1.08rem;
  font-weight: 500;
  color: var(--rel-mute);
}

.rel__since {
  margin: 0.28rem 0 0;
  font-size: 0.86rem;
  font-weight: 400;
  color: var(--rel-faint);
}

.rel__line {
  list-style: none;
  margin: 2.4rem 0 0;
  padding: 0;
}

.rel__beat {
  margin: 0 0 2.8rem;
  padding: 0;
}

.rel__beat.has-media {
  margin-bottom: 3.4rem;
}

.rel__beat.is-reply {
  margin: 0 0 2.4rem;
  padding: 0.35rem 0 0.45rem;
}

.rel__beat:not(.is-return) .rel__place {
  font-size: clamp(1.55rem, 5.2vw, 2.15rem);
}

.rel__beat.has-media .rel__mark--quiet {
  margin-top: 0.95rem;
}

.rel__beat.is-return .rel__mark--hero {
  margin: 0 0 0.85rem;
}

.rel__beat.is-return .rel__caption {
  margin-top: 0;
}

.rel__media {
  margin: 0.95rem 0 0;
}

.rel__caption {
  margin-top: 0;
}

.rel__beat.is-reply + .rel__beat {
  margin-top: 0.4rem;
}

.rel__place {
  margin: 0;
  font-size: clamp(1.05rem, 3.2vw, 1.35rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.rel__where {
  margin: 0.28rem 0 0;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--rel-mute);
}

.rel__mark {
  margin: 0.7rem 0 0;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.rel__mark--quiet {
  font-size: clamp(0.92rem, 2.4vw, 1.05rem);
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--rel-mute);
}

.rel__mark--hero {
  margin-top: 0;
  font-size: clamp(2.05rem, 7.6vw, 2.85rem);
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--rel-return);
}

.rel__beat.is-reply .rel__mark {
  margin-top: 0;
  font-size: clamp(0.98rem, 2.6vw, 1.12rem);
}

.rel__when {
  margin: 0.28rem 0 0;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--rel-mute);
}

@media (min-width: 768px) {
  .rel__beat.has-media {
    margin-bottom: 4.4rem;
  }

  .rel__beat.is-reply,
  .rel__beat.is-return {
    margin-bottom: 3.4rem;
  }
}

.rel__empty,
.rel__comm {
  margin: 2.2rem 0 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--rel-mute);
}

.rel__comm {
  margin-top: 0.2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--rel-faint);
  font-size: 0.86rem;
}

@media (prefers-reduced-motion: reduce) {
  .rel * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
