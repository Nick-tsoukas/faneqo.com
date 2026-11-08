/**
 * Anonymous first-party Faneqo fan identity.
 *
 * Reuses localStorage `_vid` (same key as analytics visitor id) so we do not
 * mint a competing browser identifier. Server stores only a hash.
 *
 * Token = recognition only. Never authorization. Never stores email/PII here.
 */

import { useVisitorSession } from '~/composables/useVisitorSession'

const STORAGE_KEY = '_vid'
const STATE_KEY = 'faneqo-fan-identity'

function persistToken(token) {
  if (typeof window === 'undefined' || !token) return
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    /* private mode */
  }
}

function readToken() {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function useFanIdentity() {
  const config = useRuntimeConfig()
  const { getOrCreateVisitorId } = useVisitorSession()

  const state = useState(STATE_KEY, () => ({
    ready: false,
    loading: false,
    visitorToken: null,
    isNew: false,
    firstSeenAt: null,
    lastSeenAt: null,
    visitCount: 0,
    joinedArtistCount: 0,
    showAttendanceCount: 0,
    promptEligibility: null,
    /** anonymous | known_fan — authenticated states come from useFanAccountConversion */
    accountState: 'anonymous',
    error: null,
  }))

  /**
   * Ensure a local opaque token exists (creates `_vid` if needed).
   * Prefer stronger tokens for brand-new browsers while accepting legacy UUIDs.
   */
  function ensureLocalToken() {
    if (typeof window === 'undefined') return null

    let token = readToken()
    if (token && token.length >= 16) return token

    // Prefer cryptographically random opaque string for new identities.
    try {
      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    } catch {
      token = getOrCreateVisitorId()
    }

    persistToken(token)
    return token
  }

  /**
   * Establish/refresh server anonymous session.
   * Safe response only — no emails / fan ids.
   */
  async function ensureSession({ force = false } = {}) {
    if (typeof window === 'undefined') return state.value
    if (state.value.loading) return state.value
    if (state.value.ready && !force) return state.value

    state.value.loading = true
    state.value.error = null

    const localToken = ensureLocalToken()

    try {
      const response = await $fetch(`${config.public.strapiUrl}/api/fan-identity/session`, {
        method: 'POST',
        body: { visitorToken: localToken },
      })

      const data = response?.data || {}
      if (data.visitorToken) {
        persistToken(data.visitorToken)
      }

      const joined = data.joinedArtistCount || 0
      state.value = {
        ready: true,
        loading: false,
        visitorToken: data.visitorToken || localToken,
        isNew: !!data.isNew,
        firstSeenAt: data.firstSeenAt || null,
        lastSeenAt: data.lastSeenAt || null,
        visitCount: data.visitCount || 0,
        joinedArtistCount: joined,
        showAttendanceCount: data.showAttendanceCount || 0,
        promptEligibility: data.promptEligibility || null,
        accountState: joined > 0 ? 'known_fan' : 'anonymous',
        error: null,
      }
    } catch (err) {
      console.warn('[FanIdentity] session failed', err)
      state.value = {
        ...state.value,
        ready: true,
        loading: false,
        visitorToken: localToken,
        error: 'session_failed',
      }
    }

    return state.value
  }

  function getVisitorToken() {
    return state.value.visitorToken || ensureLocalToken()
  }

  /**
   * Session-level eligibility snapshot. Prefer useFanAccountConversion.evaluateEligibility
   * for live selection with context (save / message click).
   */
  function getFanAccountPromptEligibility() {
    const base =
      state.value.promptEligibility || {
        canEvaluate: false,
        cooldownActive: false,
        dismissCount: 0,
        availableTriggers: [],
        selected: null,
        signals: {
          returnVisit: false,
          multiArtist: false,
          repeatShow: false,
          joinedArtistCount: state.value.joinedArtistCount || 0,
          showAttendanceCount: state.value.showAttendanceCount || 0,
          visitCount: state.value.visitCount || 0,
        },
      }

    if (base.selected) return base.selected
    return base
  }

  return {
    state,
    STORAGE_KEY,
    ensureLocalToken,
    ensureSession,
    getVisitorToken,
    getFanAccountPromptEligibility,
  }
}
