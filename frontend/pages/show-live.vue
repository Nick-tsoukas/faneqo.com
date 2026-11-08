<template>
  <div class="min-h-screen bg-black text-white">
    <div class="max-w-3xl mx-auto px-5 py-6 pt-[calc(var(--header-height)+1rem)]">
      <!-- Top bar -->
      <div class="flex items-center justify-between gap-4 mb-8">
        <NuxtLink
          to="/dashboard"
          class="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </NuxtLink>

        <div v-if="isLive" class="flex items-center gap-2">
          <span class="live-dot"></span>
          <span class="text-xs font-semibold tracking-[0.2em] text-emerald-400">LIVE</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-24 flex justify-center">
        <div class="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>

      <!-- No band -->
      <div v-else-if="!bandId" class="py-20 text-center">
        <p class="text-white/60">No artist page found on this account.</p>
      </div>

      <!-- Nothing live -->
      <div v-else-if="!isLive" class="py-20 text-center">
        <div class="text-5xl mb-6">🎤</div>
        <h1 class="text-2xl font-bold mb-3">No show is live right now</h1>
        <p class="text-white/60 mb-8 max-w-sm mx-auto">
          Start Show Mode from your dashboard and this screen turns into your live check-in counter.
        </p>
        <NuxtLink
          to="/dashboard"
          class="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"
        >
          Go to Dashboard
        </NuxtLink>
      </div>

      <!-- Live -->
      <template v-else>
        <div class="text-center mb-10">
          <h1 class="text-xl font-bold">{{ status.title || bandName }}</h1>
          <p v-if="venueLine" class="text-white/50 text-sm mt-1">{{ venueLine }}</p>
        </div>

        <div class="counter-card mb-4">
          <div class="counter-value">{{ checkIns }}</div>
          <div class="counter-label">check-ins tonight</div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-10">
          <div class="stat-tile">
            <div class="stat-number">{{ fansCaptured }}</div>
            <div class="stat-caption">new fans</div>
          </div>
          <div class="stat-tile">
            <div class="stat-number">{{ autoOffLabel }}</div>
            <div class="stat-caption">auto-off</div>
          </div>
        </div>

        <!-- Live feed -->
        <div class="feed">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold tracking-wide text-white/70 uppercase">Just checked in</h2>
            <span v-if="refreshing" class="text-[0.7rem] text-white/40">updating…</span>
          </div>

          <div v-if="!recentCheckIns.length" class="py-10 text-center text-white/40 text-sm">
            No check-ins yet. They'll appear here the moment someone scans.
          </div>

          <ul v-else class="space-y-2">
            <li v-for="entry in recentCheckIns" :key="entry.id" class="feed-row">
              <span class="feed-name">{{ entry.label }}</span>
              <span class="feed-time">{{ entry.relativeTime }}</span>
            </li>
          </ul>
        </div>

        <div class="mt-10 flex flex-col items-center gap-3">
          <NuxtLink
            v-if="bandSlug"
            :to="`/${bandSlug}`"
            target="_blank"
            class="text-purple-300 hover:text-purple-200 text-sm underline underline-offset-4"
          >
            Open your artist page
          </NuxtLink>
          <p v-if="wakeLockActive" class="text-white/30 text-xs">Screen kept awake</p>
        </div>
      </template>

      <p v-if="error" class="mt-8 text-center text-red-400 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWorkspaceBand } from '~/composables/useWorkspaceBand';

definePageMeta({
  middleware: 'auth',
});

const config = useRuntimeConfig();
const token = useStrapiToken();
const { requireActiveBand } = useWorkspaceBand();

const POLL_INTERVAL_MS = 20000;

const loading = ref(true);
const refreshing = ref(false);
const error = ref('');
const bandId = ref(null);
const bandName = ref('');
const bandSlug = ref('');
const status = ref(null);
const interactions = ref([]);
const nowTs = ref(Date.now());
const wakeLockActive = ref(false);

let pollTimer = null;
let clockTimer = null;
let wakeLock = null;

const isLive = computed(() => status.value?.status === 'live' && status.value?.enabled);
const checkIns = computed(() => status.value?.checkIns ?? 0);
const fansCaptured = computed(() => status.value?.fansCaptured ?? 0);

const venueLine = computed(() => {
  const parts = [status.value?.venue, status.value?.city].filter(Boolean);
  return parts.join(' · ');
});

const autoOffLabel = computed(() => {
  const endsAt = status.value?.endsAt ? new Date(status.value.endsAt) : null;
  if (!endsAt || Number.isNaN(endsAt.getTime())) return '—';
  return endsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
});

/** Only show the fan a room can see: a first name, or a masked address. */
function displayLabel(entry) {
  if (entry.fanName) return entry.fanName;
  if (!entry.fanEmail) return 'Someone';

  const [local, domain] = entry.fanEmail.split('@');
  if (!domain) return 'Someone';
  return `${local.slice(0, 1)}•••@${domain}`;
}

function relativeTime(timestamp) {
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.max(0, Math.round((nowTs.value - then) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  return `${Math.round(minutes / 60)}h ago`;
}

const recentCheckIns = computed(() => {
  const campaignId = status.value?.campaignId;
  if (!campaignId) return [];

  return interactions.value
    .filter((entry) => entry.campaignId === campaignId && entry.interactionType === 'checked_in_show')
    .slice(0, 12)
    .map((entry) => ({
      id: entry.id,
      label: displayLabel(entry),
      relativeTime: relativeTime(entry.timestamp),
    }));
});

/**
 * Show Mode drives a live room, so the wrong band here is the worst kind of
 * mistake. The old `/bands?sort=updatedAt:desc&pageSize=1` fallback is gone:
 * a multi-band artist now chooses instead of being guessed at.
 */
async function fetchBand() {
  try {
    const band = await requireActiveBand();
    if (!band?.bandId) return;
    bandId.value = band.bandId;
    bandName.value = band.name || '';
    bandSlug.value = band.slug || '';
  } catch (err) {
    error.value = 'Could not load your artist page.';
  }
}

async function fetchStatus() {
  if (!bandId.value) return;

  try {
    const result = await $fetch(`${config.public.strapiUrl}/api/bands/${bandId.value}/show-mode`, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    status.value = result?.data || null;
  } catch (err) {
    error.value = 'Could not load show status.';
  }
}

async function fetchInteractions() {
  if (!bandId.value || !isLive.value) return;

  try {
    const result = await $fetch(
      `${config.public.strapiUrl}/api/fan-interactions/recent/${bandId.value}?limit=50`,
      { headers: { Authorization: `Bearer ${token.value}` } }
    );
    interactions.value = Array.isArray(result?.data) ? result.data : [];
  } catch (err) {
    // The counter is the important part — a missing feed shouldn't show an error.
  }
}

async function refresh() {
  refreshing.value = true;
  try {
    await fetchStatus();
    await fetchInteractions();
  } finally {
    refreshing.value = false;
  }
}

/** Merch table phones lock their screens. Ask to keep it on while a show runs. */
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLockActive.value = true;
    wakeLock.addEventListener('release', () => {
      wakeLockActive.value = false;
    });
  } catch (err) {
    wakeLockActive.value = false;
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    if (isLive.value && !wakeLockActive.value) requestWakeLock();
    refresh();
  }
}

onMounted(async () => {
  await fetchBand();
  await refresh();
  loading.value = false;

  if (isLive.value) requestWakeLock();

  pollTimer = setInterval(refresh, POLL_INTERVAL_MS);
  clockTimer = setInterval(() => {
    nowTs.value = Date.now();
  }, 30000);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  if (clockTimer) clearInterval(clockTimer);
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
});

useHead({
  title: 'Show Mode Live',
});
</script>

<style scoped>
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.9);
  animation: live-pulse 1.6s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.85); }
}

.counter-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(168, 85, 247, 0.12) 100%);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 1.5rem;
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.counter-value {
  font-size: clamp(4.5rem, 22vw, 8rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  color: #34d399;
  text-shadow: 0 0 40px rgba(52, 211, 153, 0.35);
}

.counter-label {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.6);
}

.stat-tile {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.25rem 1rem;
  text-align: center;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stat-caption {
  margin-top: 0.25rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.45);
}

.feed {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  padding: 1.25rem;
}

.feed-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.feed-row:last-child {
  border-bottom: none;
}

.feed-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.feed-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}
</style>
