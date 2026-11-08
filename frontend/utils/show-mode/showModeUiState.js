/**
 * Dashboard Show Mode presentation states.
 *
 * Backend may still store `scheduled`. That is leftover infrastructure, not a
 * product state. Daily UI never renders automatic-activation copy.
 *
 * Recap generating/ready/timeout are frontend watch states, not band columns.
 */

export const SHOW_MODE_UI_STATES = Object.freeze({
  LIVE: 'live',
  RECAP_GENERATING: 'recap_generating',
  RECAP_READY: 'recap_ready',
  RECAP_TIMEOUT: 'recap_timeout',
  IDLE: 'idle',
})

export function isShowModeLiveStatus(status) {
  return !!(status && status.status === 'live' && status.enabled)
}

/**
 * @param {{
 *   status?: { status?: string, enabled?: boolean } | null,
 *   recapState?: 'generating' | 'ready' | 'timeout' | null,
 *   recapAlertVisible?: boolean,
 *   loading?: boolean,
 * }} input
 */
export function resolveShowModeUiState({
  status = null,
  recapState = null,
  recapAlertVisible = false,
  loading = false,
} = {}) {
  if (loading && !status) return 'loading'
  if (isShowModeLiveStatus(status)) return SHOW_MODE_UI_STATES.LIVE
  if (recapAlertVisible && recapState === 'generating') return SHOW_MODE_UI_STATES.RECAP_GENERATING
  if (recapAlertVisible && recapState === 'ready') return SHOW_MODE_UI_STATES.RECAP_READY
  if (recapAlertVisible && recapState === 'timeout') return SHOW_MODE_UI_STATES.RECAP_TIMEOUT
  return SHOW_MODE_UI_STATES.IDLE
}

export function isFirstTimeIdle(latestRecap) {
  return !latestRecap
}

export function showModeTakesDashboardLead(status) {
  return isShowModeLiveStatus(status) || !!(status && status.isLive)
}

export function alreadyLiveFromResponse(response, body) {
  return Number(response?.status) === 409 || body?.error?.name === 'already_live'
}
