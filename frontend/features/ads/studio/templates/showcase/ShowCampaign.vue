<template>
  <div class="show">
    <PhotoField class="show__photo" :media="photo" fade="deep" />
    <div class="show__veil" aria-hidden="true" />

    <header class="type">
      <p v-if="c.kicker" class="kicker">{{ c.kicker }}</p>
      <p class="who">{{ name }}</p>
      <h1 :style="{ fontSize: `calc(var(--h1) * ${headlineScale([c.headlineTop, c.headlineAccent])})` }">
        <span class="line">{{ c.headlineTop }}</span>
        <span v-if="c.headlineAccent" class="line line--accent">{{ c.headlineAccent }}</span>
      </h1>
    </header>

    <div v-if="show" class="date">
      <p class="date__month">{{ parts.month }}</p>
      <p class="date__day">{{ parts.day }}</p>
      <p class="date__where">{{ where }}</p>
      <p v-if="show.ticketLabel" class="date__ticket">{{ show.ticketLabel }}</p>
    </div>
    <div v-else class="empty">
      <p>No show on this page.</p>
      <p>A real date and venue are required.</p>
    </div>

    <footer class="end">
      <img src="/faneqo-wordmark.svg" alt="Faneqo" />
      <span v-if="c.cta">{{ c.cta }}</span>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PhotoField from '@/features/ads/studio/primitives/PhotoField.vue'
import { headlineScale } from '@/features/ads/studio/board.js'
import { campaignShow } from '@/features/ads/studio/campaigns.js'

/**
 * Show campaign. The date is the one on the artist page. A page with no
 * upcoming show says so, instead of borrowing another artist's night.
 */
const props = defineProps({
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const c = computed(() => props.content || {})
const name = computed(() => props.snapshot?.name || 'Artist')
const show = computed(() => campaignShow(props.snapshot))
const photo = computed(() => show.value?.image || c.value.photo || props.snapshot?.hero || null)
const parts = computed(() => {
  const match = String(show.value?.date || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return { month: '', day: '' }
  return { month: MONTHS[Number(match[2]) - 1] || '', day: String(Number(match[3])) }
})
const where = computed(() => [show.value?.venue || show.value?.title, [show.value?.city, show.value?.state].filter(Boolean).join(', ')].filter(Boolean).join(' · '))
</script>

<style scoped>
.show {
  position: absolute;
  inset: 0;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.show__photo { position: absolute; inset: 0; }
.show__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 7, 0.15) 0%, rgba(5, 5, 7, 0.25) 40%, #050507 100%);
}

.type {
  position: absolute;
  top: var(--type-top);
  right: var(--safe-x);
  left: var(--safe-x);
}

.kicker,
.who {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.kicker { color: #7ee7ff; }
.who { color: rgba(247, 249, 252, 0.78); }

h1 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.92;
}

.line { display: block; }
.line--accent {
  background: linear-gradient(90deg, #ff4ad8, #c084fc 50%, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.date,
.empty {
  position: absolute;
  right: var(--safe-x);
  bottom: calc(var(--safe-bottom) + 72px);
  left: var(--safe-x);
}

.date__month {
  margin: 0;
  color: #7ee7ff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.date__day {
  margin: 0;
  font-size: 128px;
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 0.84;
}

.date__where {
  margin: 8px 0 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.date__ticket {
  margin: 14px 0 0;
  color: rgba(247, 249, 252, 0.7);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.empty p {
  margin: 0;
  color: rgba(247, 249, 252, 0.78);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}
.empty p + p {
  margin-top: 8px;
  color: rgba(247, 249, 252, 0.5);
  font-size: 18px;
  font-weight: 500;
}

.end {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--safe-bottom);
  left: var(--safe-x);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.end img { height: 26px; }
.end span { color: rgba(247, 249, 252, 0.8); font-size: 16px; font-weight: 600; }
</style>
