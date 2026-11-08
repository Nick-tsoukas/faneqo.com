<template>
  <div class="show-recap-card">
    <!-- Empty State -->
    <div v-if="!recap" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <h3 class="empty-title">No Show Recaps Yet</h3>
      <p class="empty-text">After your next show, you'll see a recap of how it performed as a fan growth event.</p>
      <NuxtLink to="/fans/recaps" class="archive-link">Show recap history</NuxtLink>
    </div>

    <!-- Recap Content -->
    <div v-else class="recap-content">
      <div class="recap-header">
        <div class="recap-badge">Last Show Recap</div>
        <h3 class="recap-title">{{ recap.showTitle || 'Live Show' }}</h3>
        <p class="recap-venue" v-if="recap.venue || recap.city">
          {{ recap.venue }}<span v-if="recap.venue && recap.city"> — </span>{{ recap.city }}
        </p>
        <p class="recap-date" v-if="recap.recapGeneratedAt">
          {{ formatDate(recap.recapGeneratedAt) }}
        </p>
      </div>

      <div class="recap-metrics">
        <!-- Primary Metric -->
        <div class="metric-primary">
          <span class="metric-value">{{ recap.fansCaptured || 0 }}</span>
          <span class="metric-label">Fans Captured</span>
        </div>

        <!-- Secondary Metrics Grid -->
        <div class="metrics-grid">
          <div class="metric-item" v-if="recap.topCaptureSurface">
            <span class="metric-icon">📍</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ formatSurface(recap.topCaptureSurface) }}</span>
              <span class="metric-label-sm">Top Surface</span>
            </span>
          </div>

          <div class="metric-item" v-if="recap.topCity">
            <span class="metric-icon">🏙️</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.topCity }}</span>
              <span class="metric-label-sm">Top City</span>
            </span>
          </div>

          <div class="metric-item" v-if="recap.spotifyClicks > 0">
            <span class="metric-icon">🎧</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.spotifyClicks }}</span>
              <span class="metric-label-sm">Spotify Clicks</span>
            </span>
          </div>

          <div class="metric-item" v-if="recap.merchClicks > 0">
            <span class="metric-icon">👕</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.merchClicks }}</span>
              <span class="metric-label-sm">Merch Clicks</span>
            </span>
          </div>

          <div class="metric-item" v-if="recap.shareClicks > 0">
            <span class="metric-icon">📤</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.shareClicks }}</span>
              <span class="metric-label-sm">Shares</span>
            </span>
          </div>

          <div class="metric-item">
            <span class="metric-icon">⚡</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.averageEngagementScore || 0 }}</span>
              <span class="metric-label-sm">Avg Engagement</span>
            </span>
          </div>

          <div class="metric-item check-in-metric" v-if="recap.checkedInShowCount > 0">
            <span class="metric-icon">✓</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.checkedInShowCount }}</span>
              <span class="metric-label-sm">Verified Check-ins</span>
            </span>
          </div>

          <div class="metric-item" v-if="recap.newFanCheckIns > 0">
            <span class="metric-icon">⭐</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.newFanCheckIns }}</span>
              <span class="metric-label-sm">New Fan Check-ins</span>
            </span>
          </div>

          <div class="metric-item" v-if="recap.superfanSignalCount > 0">
            <span class="metric-icon">🔥</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.superfanSignalCount }}</span>
              <span class="metric-label-sm">Superfan Signals</span>
            </span>
          </div>

          <div class="metric-item" v-if="recap.interactionCount > 0">
            <span class="metric-icon">👆</span>
            <span class="metric-text">
              <span class="metric-value-sm">{{ recap.interactionCount }}</span>
              <span class="metric-label-sm">Interactions</span>
            </span>
          </div>
        </div>
      </div>

      <div class="recap-footer">
        <NuxtLink :to="`${recapPath}?from=fans`" class="view-details-btn">
          View Full Recap
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </NuxtLink>
        <NuxtLink
          v-if="recap.checkedInShowCount > 0"
          :to="`${recapPath}?message=1&from=fans`"
          class="message-room-btn"
        >
          Message the Room
        </NuxtLink>
        <!-- Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable. -->
        <!--
        <NuxtLink
          :to="sharePhotosPath"
          class="message-room-btn"
        >
          Share Photos
        </NuxtLink>
        -->
        <p v-if="!(recap.checkedInShowCount > 0)" class="no-room-note">
          No one checked in at this show, so there's nobody to message yet.
        </p>
        <NuxtLink to="/fans/recaps" class="archive-link">See all show recaps</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatCalendarDate } from '~/utils/dates/calendarDate';

const props = defineProps({
  recap: {
    type: Object,
    default: null,
  },
});

const recapPath = computed(() => `/fans/recaps/${props.recap?.recapId || props.recap?.id}`);
// Artist Updates temporarily hidden from product UI. Keep implementation intact for re-enable.
// const sharePhotosPath = computed(() => {
//   const recap = props.recap || {}
//   const recapId = recap.recapId || recap.id
//   const show = recap.city || recap.venue || recap.showTitle || ''
//   const query = new URLSearchParams({
//     ...(recapId ? { recapId: String(recapId) } : {}),
//     ...(recap.eventId ? { eventId: String(recap.eventId) } : {}),
//     ...(show ? { show } : {}),
//     from: recapPath.value,
//   })
//   return `/updates/new?${query.toString()}`
// })

const formatDate = (dateStr) => {
  return formatCalendarDate(dateStr);
};

const formatSurface = (surface) => {
  if (!surface) return '';
  const surfaceLabels = {
    'qr_scan': 'QR Scan',
    'direct_link': 'Direct Link',
    'social_share': 'Social Share',
    'merch_table': 'Merch Table',
    'stage_display': 'Stage Display',
    'flyer': 'Flyer',
    'business_card': 'Business Card',
    'website': 'Website',
    'email': 'Email',
    'sms': 'SMS',
    'unknown': 'Unknown',
  };
  return surfaceLabels[surface] || surface.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};
</script>

<style scoped>
.show-recap-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 24px;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-icon {
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: rgba(255, 255, 255, 0.9);
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  max-width: 280px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Recap Content */
.recap-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recap-header {
  text-align: center;
}

.recap-badge {
  display: inline-block;
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 12px;
}

.recap-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #fff;
}

.recap-venue {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 4px;
}

.recap-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* Metrics */
.recap-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-primary {
  text-align: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.metric-primary .metric-value {
  display: block;
  font-size: 48px;
  font-weight: 700;
  color: #10b981;
  line-height: 1;
}

.metric-primary .metric-label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.metric-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.metric-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.metric-value-sm {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-label-sm {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.metric-item.check-in-metric {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.metric-item.check-in-metric .metric-icon {
  color: #10b981;
}

/* Footer */
.recap-footer {
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-details-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-details-btn:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: rgba(139, 92, 246, 0.5);
}

.message-room-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.message-room-btn:hover {
  background: rgba(16, 185, 129, 0.25);
  border-color: rgba(16, 185, 129, 0.5);
}

.no-room-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
}

.archive-link {
  display: block;
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
  transition: color 0.2s ease;
}

.archive-link:hover {
  color: #c4b5fd;
}

/* Responsive */
@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .metric-primary .metric-value {
    font-size: 40px;
  }
}
</style>
