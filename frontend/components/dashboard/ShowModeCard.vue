<template>
  <div
    id="dashboard-show-mode"
    class="show-mode-card"
    :class="`is-${uiState}`"
  >
    <div v-if="uiState === 'loading'" class="sm-loading">Loading…</div>

    <template v-else-if="uiState === 'live'">
      <div class="live">
        <div class="live__kicker">
          <span class="live__dot" aria-hidden="true" />
          LIVE
        </div>
        <h3 class="live__title">{{ livePlace.headline }}</h3>
        <p v-if="livePlace.place" class="live__place">{{ livePlace.place }}</p>

        <div class="live__stats">
          <div>
            <span class="live__num">{{ checkInsThisSession }}</span>
            <span class="live__label">checked in</span>
          </div>
          <div>
            <span class="live__num">{{ fansCapturedThisSession }}</span>
            <span class="live__label">new fans</span>
          </div>
        </div>

        <p v-if="endsLabel" class="live__ends">Ends {{ endsLabel }}</p>

        <div class="live__actions">
          <NuxtLink :to="showLivePath" class="sm-primary">Open Live View</NuxtLink>
          <button type="button" class="sm-end" :disabled="actionLoading" @click="confirmEnd = true">
            End Show
          </button>
        </div>
      </div>
    </template>

    <template v-else-if="uiState === 'recap_generating'">
      <div class="after">
        <p class="after__kicker">Preparing your Night</p>
        <h3 class="after__title">{{ lastSession.headline || 'Preparing your Night…' }}</h3>
        <p v-if="lastSession.place" class="after__meta">{{ lastSession.place }}</p>
        <p v-if="lastSession.hasCounts" class="after__counts after__counts--live">
          {{ lastSession.checkIns }} {{ lastSession.checkIns === 1 ? 'was' : 'were' }} there
          <span aria-hidden="true"> · </span>
          {{ lastSession.fansCaptured }} new
        </p>
        <p class="after__copy">
          We're collecting attendance, fan activity and show details.
        </p>
      </div>
    </template>

    <template v-else-if="uiState === 'recap_ready'">
      <div class="after">
        <p class="after__kicker">Your Night is ready.</p>
        <h3 class="after__title">{{ readyLine.title }}</h3>
        <p v-if="readyLine.meta" class="after__meta">{{ readyLine.meta }}</p>
        <p class="after__counts">
          {{ readyCheckIns }} {{ readyCheckIns === 1 ? 'was' : 'were' }} there
          <span aria-hidden="true"> · </span>
          {{ readyNewFans }} new
        </p>

        <div class="after__actions">
          <NuxtLink :to="`/fans/recaps/${endedRecap.id}?from=dashboard`" class="sm-primary">
            View Night
          </NuxtLink>
          <div class="after__secondary">
            <NuxtLink v-if="addPhotosPath" :to="addPhotosPath" class="sm-text">Add photos</NuxtLink>
            <NuxtLink
              v-if="readyCheckIns > 0"
              :to="`/fans/recaps/${endedRecap.id}?message=1&from=dashboard`"
              class="sm-text"
            >
              Message attendees
            </NuxtLink>
          </div>
          <button type="button" class="sm-text after__dismiss" @click="dismissRecapPanel">Done</button>
        </div>
      </div>
    </template>

    <template v-else-if="uiState === 'recap_timeout'">
      <div class="after">
        <p class="after__kicker">Still preparing</p>
        <h3 class="after__title">Your Night is still being prepared.</h3>
        <p class="after__copy">Check-ins are safe. Try again in a moment.</p>
        <div class="after__actions">
          <button type="button" class="sm-primary" :disabled="retrying" @click="retryRecap">
            <span v-if="retrying" class="btn-spinner" />
            <span v-else>Try again</span>
          </button>
          <NuxtLink to="/nights" class="sm-text">View all Nights</NuxtLink>
          <button type="button" class="sm-text" @click="dismissRecapPanel">Done</button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="idle">
        <p class="idle__kicker">Show Mode</p>
        <h3 class="idle__title">Playing tonight?</h3>
        <p v-if="isFirstTime" class="idle__help">Fans check in. You keep the connection.</p>
        <button
          type="button"
          class="sm-primary"
          aria-label="Set up tonight"
          :disabled="actionLoading"
          @click="openSetup"
        >
          Set up tonight
        </button>
        <LatestShowRecapPanel
          v-if="latestRecap"
          class="idle__recent"
          :recap="latestRecap"
        />
      </div>
    </template>

    <p v-if="error" class="sm-error">{{ error }}</p>

    <ShowModeSetupSheet
      :open="setupOpen"
      :busy="actionLoading"
      @close="setupOpen = false"
      @start="activateShowMode"
    />

    <Teleport to="body">
      <div v-if="confirmEnd" class="end" role="dialog" aria-modal="true" aria-labelledby="end-title">
        <button type="button" class="end__backdrop" aria-label="Keep Show Live" @click="confirmEnd = false" />
        <div ref="endSheetRef" class="end__sheet" tabindex="-1">
          <h2 id="end-title">End Show?</h2>
          <p>Fan check-in closes.</p>
          <p>Faneqo prepares your Night.</p>
          <div class="end__actions">
            <button type="button" class="sm-primary" :disabled="actionLoading" @click="deactivateShowMode">
              <span v-if="actionLoading" class="btn-spinner" />
              <span v-else>End Show</span>
            </button>
            <button type="button" class="sm-secondary" @click="confirmEnd = false">Keep Show Live</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import LatestShowRecapPanel from '~/components/dashboard/show-mode/LatestShowRecapPanel.vue'
import ShowModeSetupSheet from '~/components/dashboard/show-mode/ShowModeSetupSheet.vue'
import { useFocusTrap } from '~/composables/useFocusTrap'
import { buildSharePhotosPath } from '~/utils/updates/sharePhotosFromRecap'
import { alreadyLiveFromResponse, isFirstTimeIdle, isShowModeLiveStatus, resolveShowModeUiState } from '~/utils/show-mode/showModeUiState'
import { formatEndsTime, livePlaceLine, recentShowLine } from '~/utils/show-mode/showModeTiming'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'
import { dashboardPathForBand } from '~/utils/ui/dashboardWorkspace'
import { useWorkspaceBand } from '~/composables/useWorkspaceBand'

const props = defineProps({
  bandId: { type: [Number, String], required: true },
  bandSlug: { type: String, default: '' },
  refreshTick: { type: Number, default: 0 },
  preview: { type: Object, default: null },
})

const emit = defineEmits(['status'])

const config = useRuntimeConfig()
const token = useStrapiToken()
// Live View must open the band whose card was clicked, not the first owned one.
const { linkTo: workspaceLinkTo } = useWorkspaceBand()
const showLivePath = computed(() => workspaceLinkTo('/show-live'))

const loading = ref(true)
const actionLoading = ref(false)
const error = ref('')
const showModeStatus = ref(null)
const setupOpen = ref(false)
const confirmEnd = ref(false)
const endSheetRef = ref(null)
const END_LOCK = 'show-mode-end'
const { activate: activateEndTrap, deactivate: deactivateEndTrap } = useFocusTrap(endSheetRef, {
  onEscape: () => { confirmEnd.value = false },
})

const fansCapturedThisSession = computed(() => Number(showModeStatus.value?.fansCaptured) || 0)
const checkInsThisSession = computed(() => Number(showModeStatus.value?.checkIns) || 0)
const isLive = computed(() => isShowModeLiveStatus(showModeStatus.value))
const livePlace = computed(() => livePlaceLine(showModeStatus.value))
const endsLabel = computed(() => formatEndsTime(
  showModeStatus.value?.effectiveEndsAt || showModeStatus.value?.endsAt,
))

const recapState = ref(null)
const endedRecap = ref(null)
const endedCampaignId = ref(null)
const retrying = ref(false)
const latestRecap = ref(null)
const dismissedCampaignId = ref(null)
const isFirstTime = computed(() => isFirstTimeIdle(latestRecap.value))
const lastSession = ref({
  headline: '',
  place: '',
  checkIns: 0,
  fansCaptured: 0,
  hasCounts: false,
})

function rememberLiveSession(status = showModeStatus.value) {
  const place = livePlaceLine(status)
  lastSession.value = {
    headline: place.headline,
    place: place.place,
    checkIns: Number(status?.checkIns) || 0,
    fansCaptured: Number(status?.fansCaptured) || 0,
    hasCounts: true,
  }
}

const alertPanel = computed(() => {
  if (recapState.value === null) return false
  if (!endedCampaignId.value) return true
  return endedCampaignId.value !== dismissedCampaignId.value
})

const uiState = computed(() => {
  if (props.preview?.uiState) return props.preview.uiState
  return resolveShowModeUiState({
    status: showModeStatus.value,
    recapState: recapState.value,
    recapAlertVisible: alertPanel.value,
    loading: loading.value,
  })
})

const readyLine = computed(() => recentShowLine(endedRecap.value))
const readyCheckIns = computed(() => Number(endedRecap.value?.checkedInShowCount) || 0)
const readyNewFans = computed(() => Number(
  endedRecap.value?.newFanCheckIns ?? endedRecap.value?.fansCaptured,
) || 0)
const addPhotosPath = computed(() => buildSharePhotosPath(endedRecap.value, {
  from: endedRecap.value?.id
    ? `/fans/recaps/${endedRecap.value.id}?from=dashboard`
    : dashboardPathForBand(props.bandId),
}))

watch(
  [isLive, showModeStatus],
  () => emit('status', {
    isLive: isLive.value,
    isScheduled: false,
    eventId: showModeStatus.value?.eventId || null,
  }),
  { immediate: true },
)

watch(
  () => props.refreshTick,
  (next, previous) => {
    if (props.preview) return
    if (next && next !== previous) fetchStatus({ silent: true })
  },
)

async function fetchStatus({ silent = false } = {}) {
  if (props.preview) return
  const wasLive = isLive.value
  const priorCampaignId = showModeStatus.value?.campaignId || null
  if (!silent) loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${config.public.strapiUrl}/api/bands/${props.bandId}/show-mode`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (!response.ok) throw new Error('Failed to fetch show mode status')
    const result = await response.json()
    if (wasLive && result.data && !isShowModeLiveStatus(result.data)) {
      rememberLiveSession(showModeStatus.value)
    }
    showModeStatus.value = result.data
    maybeStartRecapAfterAutoEnd(wasLive, priorCampaignId)
  } catch (err) {
    console.error('Error fetching show mode status:', err)
    if (!silent) error.value = 'Failed to load show mode status'
  } finally {
    if (!silent) loading.value = false
  }
}

function maybeStartRecapAfterAutoEnd(wasLive, priorCampaignId) {
  if (!wasLive || isLive.value) return
  if (!priorCampaignId || recapState.value) return
  if (priorCampaignId === dismissedCampaignId.value) return
  beginRecapWatch(priorCampaignId)
}

function openSetup() {
  error.value = ''
  setupOpen.value = true
}

async function activateShowMode(payload) {
  actionLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`${config.public.strapiUrl}/api/bands/${props.bandId}/show-mode/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(payload),
    })
    const body = await response.json().catch(() => null)

    if (alreadyLiveFromResponse(response, body)) {
      setupOpen.value = false
      error.value = 'Show Mode is already live.'
      await fetchStatus()
      return
    }

    if (!response.ok) {
      throw new Error(body?.error?.message || 'Failed to activate show mode')
    }

    setupOpen.value = false
    await fetchStatus()
  } catch (err) {
    console.error('Error activating show mode:', err)
    error.value = err?.message || 'Failed to activate show mode'
  } finally {
    actionLoading.value = false
  }
}

async function deactivateShowMode() {
  actionLoading.value = true
  error.value = ''
  const priorCampaignId = showModeStatus.value?.campaignId || null
  rememberLiveSession()

  try {
    const response = await fetch(`${config.public.strapiUrl}/api/bands/${props.bandId}/show-mode/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (!response.ok) throw new Error('Failed to deactivate show mode')
    const result = await response.json().catch(() => null)
    const campaignId = result?.data?.campaignId || priorCampaignId
    confirmEnd.value = false
    await fetchStatus()
    if (campaignId && recapState.value === null) beginRecapWatch(campaignId)
  } catch (err) {
    console.error('Error deactivating show mode:', err)
    error.value = 'Failed to deactivate show mode'
  } finally {
    actionLoading.value = false
  }
}

const RECAP_POLL_MS = 2500
const RECAP_TIMEOUT_MS = 45000
const pendingKey = computed(() => `mbq_pending_recap:${props.bandId}`)
const dismissedKey = computed(() => `mbq_recap_alert_dismissed:${props.bandId}`)
const { getLatestRecap, generateRecap } = useShowRecaps()

let recapPollTimer = null
let recapDeadline = 0
let recapStartedAt = 0

function readLocal(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

function writeLocal(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {}
}

function readPending() {
  try {
    const raw = readLocal(pendingKey.value)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writePending(value) {
  writeLocal(pendingKey.value, value ? JSON.stringify(value) : null)
}

function pendingPayload(campaignId, startedAt = recapStartedAt) {
  return {
    campaignId,
    startedAt,
    lastSession: lastSession.value?.hasCounts ? lastSession.value : null,
  }
}

async function loadLatestRecap() {
  try {
    const latest = await getLatestRecap(props.bandId)
    if (latest) latestRecap.value = latest
  } catch {}
}

function matchesEndedCampaign(recap) {
  if (!recap) return false
  if (endedCampaignId.value) return recap.campaignId === endedCampaignId.value
  return true
}

async function checkForRecap() {
  try {
    const latest = await getLatestRecap(props.bandId)
    if (matchesEndedCampaign(latest)) {
      endedRecap.value = latest
      latestRecap.value = latest
      recapState.value = 'ready'
      stopRecapPolling()
      writePending({
        ...pendingPayload(endedCampaignId.value, recapStartedAt),
        recapId: latest.id,
      })
      return
    }
  } catch {}

  if (Date.now() > recapDeadline) {
    recapState.value = 'timeout'
    stopRecapPolling()
  }
}

function stopRecapPolling() {
  if (recapPollTimer) clearInterval(recapPollTimer)
  recapPollTimer = null
}

function beginRecapWatch(campaignId, { persist = true, startedAt = Date.now() } = {}) {
  endedCampaignId.value = campaignId
  endedRecap.value = null
  recapState.value = 'generating'
  recapStartedAt = startedAt
  recapDeadline = Date.now() + RECAP_TIMEOUT_MS
  if (persist) writePending(pendingPayload(campaignId, startedAt))
  stopRecapPolling()
  checkForRecap()
  recapPollTimer = setInterval(checkForRecap, RECAP_POLL_MS)
}

async function retryRecap() {
  if (!endedCampaignId.value || retrying.value) return
  retrying.value = true
  try {
    await generateRecap(endedCampaignId.value, props.bandId)
    beginRecapWatch(endedCampaignId.value)
  } catch (err) {
    console.error('Failed to generate recap:', err)
    recapState.value = 'timeout'
  } finally {
    retrying.value = false
  }
}

function dismissRecapPanel() {
  if (endedCampaignId.value) {
    dismissedCampaignId.value = endedCampaignId.value
    writeLocal(dismissedKey.value, endedCampaignId.value)
  }
  recapState.value = null
  stopRecapPolling()
  writePending(null)
  if (!latestRecap.value) loadLatestRecap()
}

function resumePendingRecap() {
  const pending = readPending()
  if (!pending?.campaignId) return
  if (pending.campaignId === dismissedCampaignId.value) {
    writePending(null)
    return
  }
  const age = Date.now() - (pending.startedAt || 0)
  if (age > 6 * 60 * 60 * 1000) {
    writePending(null)
    return
  }
  if (pending.lastSession) lastSession.value = pending.lastSession
  beginRecapWatch(pending.campaignId, { persist: false, startedAt: pending.startedAt || Date.now() })
}

const POLL_INTERVAL_MS = 60000
let pollTimer = null

function startPolling() {
  if (pollTimer || props.preview) return
  pollTimer = setInterval(() => {
    if (actionLoading.value) return
    fetchStatus({ silent: true })
  }, POLL_INTERVAL_MS)
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}

watch(isLive, (live) => {
  if (live) startPolling()
  else stopPolling()
})

function applyPreview() {
  const preview = props.preview
  if (!preview) return
  loading.value = false
  showModeStatus.value = preview.status || null
  latestRecap.value = preview.latestRecap || null
  endedRecap.value = preview.endedRecap || null
  recapState.value = preview.recapState || null
  endedCampaignId.value = preview.endedCampaignId || preview.endedRecap?.campaignId || 'preview'
  setupOpen.value = !!preview.setupOpen
  confirmEnd.value = !!preview.confirmEnd
  if (preview.status) rememberLiveSession(preview.status)
}

watch(confirmEnd, async (open) => {
  if (open) {
    lockOverlayScroll(END_LOCK)
    await nextTick()
    activateEndTrap()
    return
  }
  deactivateEndTrap()
  unlockOverlayScroll(END_LOCK)
})

watch(() => props.preview, applyPreview, { immediate: true, deep: true })

onMounted(() => {
  if (props.preview) {
    applyPreview()
    return
  }
  fetchStatus()
  dismissedCampaignId.value = readLocal(dismissedKey.value)
  resumePendingRecap()
  loadLatestRecap()
})

onUnmounted(() => {
  stopPolling()
  stopRecapPolling()
  deactivateEndTrap()
  unlockOverlayScroll(END_LOCK)
})
</script>

<style scoped>
.show-mode-card {
  width: 100%;
  min-width: 0;
  overflow-x: clip;
  padding: 18px 16px;
  border-radius: 1rem;
  background: var(--fq-surface, #0b0c10);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.08));
}

.show-mode-card.is-live {
  border-color: rgba(57, 213, 255, 0.22);
}

.sm-loading {
  padding: 0.5rem 0;
  color: rgba(245, 245, 246, 0.4);
  font-size: 0.9375rem;
}

.idle,
.live,
.after {
  min-width: 0;
}

.idle__kicker,
.live__kicker,
.after__kicker {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.62);
}

.idle__title,
.live__title,
.after__title {
  margin: 0.35rem 0 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: #f5f5f6;
}

.idle__help,
.after__copy,
.after__meta,
.live__place,
.live__ends {
  margin: 0.4rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: rgba(245, 245, 246, 0.62);
}

.idle .sm-primary {
  width: 100%;
  margin-top: 14px;
}

.idle__recent {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.live__kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #39d5ff;
}

.live__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #39d5ff;
  box-shadow: 0 0 8px rgba(57, 213, 255, 0.55);
  animation: sm-breathe 2.4s ease-in-out infinite;
}

.live__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 16px 0 0;
}

.live__num {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #f5f5f6;
  font-variant-numeric: tabular-nums;
}

.live__label {
  display: block;
  margin-top: 5px;
  font-size: 0.875rem;
  color: rgba(245, 245, 246, 0.62);
}

.live__actions,
.after__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.live__actions {
  gap: 14px;
}

.after__counts {
  margin: 10px 0 0;
  font-size: 1rem;
  font-weight: 550;
  color: #f5f5f6;
}

.after__secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.after__dismiss {
  align-self: flex-start;
}

.sm-primary,
.sm-secondary,
.sm-end,
.sm-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 0.975rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  text-decoration: none;
  cursor: pointer;
}

.sm-primary {
  border: 0;
  background: #f3f3f4;
  color: #08090a;
}

.sm-secondary {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #f5f5f6;
}

.sm-end {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(245, 245, 246, 0.72);
}

.sm-danger {
  border: 0;
  background: #b91c1c;
  color: #fff5f5;
}

.sm-text {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.9375rem;
  font-weight: 550;
  text-decoration: none;
}

.sm-text:hover,
.sm-primary:hover,
.sm-secondary:hover {
  filter: brightness(1.04);
}

.sm-primary:disabled,
.sm-end:disabled,
.sm-danger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.sm-primary:focus-visible,
.sm-secondary:focus-visible,
.sm-end:focus-visible,
.sm-danger:focus-visible,
.sm-text:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.7);
  outline-offset: 2px;
}

.end {
  position: fixed;
  inset: 0;
  z-index: 82;
}

.end__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.72);
}

.end__sheet {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  padding: 1.15rem 1.15rem 1rem;
  border-radius: 1rem;
  background: #111318;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.end__sheet h2 {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: -0.03em;
  color: #f5f5f6;
}

.end__sheet p {
  margin: 0.45rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.45;
  color: rgba(245, 245, 246, 0.62);
}

.end__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 1rem;
}

.sm-error {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f8a4a4;
  font-size: 0.875rem;
}

.btn-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: sm-spin 0.8s linear infinite;
}

@keyframes sm-spin {
  to { transform: rotate(360deg); }
}

@keyframes sm-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

@media (min-width: 768px) {
  .show-mode-card {
    padding: 20px 24px;
  }

  .live {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 28px;
    align-items: start;
  }

  .live__kicker,
  .live__title,
  .live__place,
  .live__stats,
  .live__ends {
    grid-column: 1;
  }

  .live__actions {
    grid-column: 2;
    grid-row: 1 / 6;
    width: 220px;
    margin-top: 0;
  }

  .idle {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 24px;
    align-items: start;
  }

  .idle .sm-primary {
    grid-column: 2;
    grid-row: 1 / 4;
    width: 220px;
    margin-top: 0;
  }

  .idle__recent {
    grid-column: 1 / -1;
  }

  .end__sheet {
    left: 50%;
    right: auto;
    bottom: auto;
    top: 50%;
    width: min(26rem, calc(100vw - 2rem));
    transform: translate(-50%, -50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .live__dot,
  .btn-spinner { animation: none; }
}
</style>
