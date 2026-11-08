<template>
  <Teleport to="body">
    <div v-if="open && recap" class="ins" role="dialog" aria-modal="true" aria-labelledby="ins-title">
      <button type="button" class="ins__backdrop" aria-label="Close" @click="$emit('close')" />
      <div class="ins__sheet">
        <header class="ins__head">
          <h2 id="ins-title">Show insights</h2>
          <button type="button" class="ins__x" @click="$emit('close')">Close</button>
        </header>
        <div class="ins__body">
          <section>
            <h3>Attendance</h3>
            <dl>
              <div><dt>{{ recap.checkedInShowCount || 0 }}</dt><dd>checked in</dd></div>
              <div><dt>{{ recap.newFanCheckIns ?? recap.fansCaptured ?? 0 }}</dt><dd>new</dd></div>
              <div><dt>{{ recap.knownFanCheckIns || 0 }}</dt><dd>returning</dd></div>
              <div v-if="recap.averageCheckInConfidence">
                <dt>{{ recap.averageCheckInConfidence }}%</dt><dd>confidence</dd>
              </div>
            </dl>
          </section>
          <section>
            <h3>Engagement</h3>
            <dl>
              <div><dt>{{ recap.interactionCount || 0 }}</dt><dd>interactions</dd></div>
              <div v-if="recap.averageEngagementScore != null">
                <dt>{{ recap.averageEngagementScore || 0 }}</dt><dd>quality</dd>
              </div>
              <div v-if="recap.superfanSignalCount || recap.engagedFanCount || recap.warmFanCount">
                <dt>{{ recap.superfanSignalCount || 0 }}</dt><dd>superfan</dd>
              </div>
              <div v-if="recap.engagedFanCount"><dt>{{ recap.engagedFanCount }}</dt><dd>engaged</dd></div>
              <div v-if="recap.warmFanCount"><dt>{{ recap.warmFanCount }}</dt><dd>warm</dd></div>
            </dl>
            <ul v-if="actionRows.length" class="ins__list">
              <li v-for="row in actionRows" :key="row[0]">{{ row[0] }} <span>{{ row[1] }}</span></li>
            </ul>
          </section>
          <section v-if="surfaces.length || cities.length">
            <h3>Discovery</h3>
            <p class="ins__kicker">Capture surfaces</p>
            <ul class="ins__list">
              <li v-for="row in surfaces" :key="row[0]">{{ formatSurface(row[0]) }} <span>{{ row[1] }}</span></li>
            </ul>
            <p v-if="cities.length" class="ins__kicker">Top cities</p>
            <ul v-if="cities.length" class="ins__list">
              <li v-for="row in cities" :key="row[0]">{{ row[0] }} <span>{{ row[1] }}</span></li>
            </ul>
          </section>
          <section v-if="people.length">
            <h3>People from this show</h3>
            <ul class="ins__list">
              <li v-for="fan in people" :key="fan.id">
                {{ fan.firstName || fan.city || 'Fan' }}
                <span>{{ fan.engagementScore }} · {{ formatTier(fan.engagementTier) }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  recap: { type: Object, default: null },
})
defineEmits(['close'])

const actionRows = computed(() => {
  const r = props.recap || {}
  const rows = [
    ['Spotify', r.spotifyClicks],
    ['Apple Music', r.appleMusicClicks],
    ['YouTube', r.youtubeClicks],
    ['Tickets', r.ticketClicks],
    ['Merch', r.merchClicks],
    ['Shares', r.shareClicks],
    ['Follows', r.followClicks],
    ['Song plays', r.featuredSongPlays],
    ['Videos', r.videoClicks],
  ]
  return rows.filter((row) => (row[1] || 0) > 0)
})

const surfaces = computed(() => {
  const entries = Object.entries(props.recap?.captureSurfaceBreakdown || {})
  entries.sort((a, b) => b[1] - a[1])
  return entries.slice(0, 5)
})

const cities = computed(() => {
  const entries = Object.entries(props.recap?.cityBreakdown || {})
  entries.sort((a, b) => b[1] - a[1])
  return entries.slice(0, 5)
})

const people = computed(() => (props.recap?.topFans || []).slice(0, 10))

function formatSurface(surface) {
  const labels = {
    qr_scan: 'QR Scan',
    direct_link: 'Direct Link',
    social_share: 'Social Share',
    merch_table: 'Merch Table',
    stage_display: 'Stage Display',
    flyer: 'Flyer',
    business_card: 'Business Card',
    website: 'Website',
    email: 'Email',
    sms: 'SMS',
    unknown: 'Unknown',
  }
  return labels[surface] || String(surface || '').replace(/_/g, ' ')
}

function formatTier(tier) {
  const labels = { superfan_signal: 'Superfan', engaged: 'Engaged', warm: 'Warm', new: 'New' }
  return labels[tier] || tier
}
</script>

<style scoped>
.ins {
  position: fixed;
  inset: 0;
  z-index: 88;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.ins__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.64);
}
.ins__sheet {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #050506;
}
.ins__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0.35rem 1rem;
  padding-top: calc(0.35rem + env(safe-area-inset-top, 0px));
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.ins__head h2 { margin: 0; font-size: 1.05rem; letter-spacing: -0.02em; }
.ins__x {
  min-height: 44px;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.62);
  font: inherit;
  cursor: pointer;
}
.ins__body {
  flex: 1;
  overflow: auto;
  padding: 1.1rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
}
.ins__body h3 {
  margin: 1.5rem 0 0.7rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}
.ins__body section:first-child h3 { margin-top: 0.2rem; }
.ins__body dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
  margin: 0;
}
.ins__body dt { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.03em; }
.ins__body dd { margin: 0.15rem 0 0; color: rgba(245, 245, 246, 0.42); }
.ins__kicker { margin: 0.9rem 0 0.35rem; color: rgba(245, 245, 246, 0.45); font-size: 0.85rem; }
.ins__list { margin: 0; padding: 0; list-style: none; }
.ins__list li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(245, 245, 246, 0.72);
}
.ins__x:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
@media (min-width: 768px) {
  .ins__sheet {
    left: auto;
    width: min(32rem, 100vw);
    border-left: 1px solid rgba(255, 255, 255, 0.07);
  }
}
</style>
