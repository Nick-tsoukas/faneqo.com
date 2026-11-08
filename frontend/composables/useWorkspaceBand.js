import { computed, watch } from 'vue'
import { useBandTeam } from '~/composables/useBandTeam'
import {
  WORKSPACE_MODE,
  resolveActiveWorkspaceBand,
  withActiveBand,
} from '~/utils/ui/artistWorkspace'

/**
 * The one active-workspace helper. Every artist surface resolves its band
 * here so no screen invents its own "first owned band" rule.
 *
 * Hint order is route query, then the last band this user actually opened.
 * Both are hints: the answer is only ever a row returned by
 * GET /api/me/band-access for this JWT. A hint that matches nothing
 * authorized resolves to the picker, never to another artist.
 *
 * Single-band users never see a picker and their URLs are unchanged.
 */

export const ACTIVE_BAND_STORAGE_KEY = 'faneqo_active_band_id'

/** Shared with Header's existing useAsyncData call so access is fetched once. */
const ACCESS_KEY = 'user-band-access'

export function readStoredActiveBandId() {
  if (!process.client) return null
  try {
    return localStorage.getItem(ACTIVE_BAND_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredActiveBandId(bandId) {
  if (!process.client) return
  try {
    if (bandId == null) localStorage.removeItem(ACTIVE_BAND_STORAGE_KEY)
    else localStorage.setItem(ACTIVE_BAND_STORAGE_KEY, String(bandId))
  } catch {
    // private mode / quota — a missing hint only costs a picker step
  }
}

/**
 * Re-ask the server which bands this account can work on. Call after anything
 * that changes the answer without changing the user or token, such as creating
 * a band; otherwise the header keeps the old answer and shows fan navigation.
 * Also refreshes the mobile dock's owned-band lookup.
 */
export function refreshWorkspaceAccess() {
  return refreshNuxtData([ACCESS_KEY, 'user-band-nav'])
}

export function useWorkspaceBand(options = {}) {
  const { permission = null } = options

  const route = useRoute()
  const user = useStrapiUser()
  const token = useStrapiToken()
  const { getMyBandAccess } = useBandTeam()

  /**
   * One definition for the whole app. Client-only: /api/me/band-access needs
   * the existing JWT, and an SSR pass without one would cache an empty payload
   * and strand a logged-in artist until user.id changed. Watching the token
   * means a hydrated session is enough.
   *
   * Defining this in two places with the same key is a trap — Nuxt keeps
   * whichever handler registered first, so the two would silently diverge.
   *
   * Each answer is stamped with the account it was fetched for, so after a
   * logout or account switch the previous account's answer never counts.
   */
  const { data: access, refresh: refreshAccess, status } = useAsyncData(
    ACCESS_KEY,
    async () => {
      const userId = user.value?.id
      if (!userId || !token.value) return { owned: [], teamAccess: [] }
      try {
        const payload = await getMyBandAccess()
        return { ...payload, forUserId: userId }
      } catch {
        // Unstamped: capability stays unresolved rather than guessing "fan"
        return { owned: [], teamAccess: [] }
      }
    },
    {
      server: false,
      immediate: true,
      watch: [() => user.value?.id, () => token.value],
    }
  )

  /** True only once the server has answered for the account signed in now. */
  const accessResolved = computed(() =>
    !!user.value?.id && String(access.value?.forUserId ?? '') === String(user.value.id)
  )

  /** Query wins over the remembered band so a link always means what it says. */
  const hint = computed(() => route.query.bandId ?? readStoredActiveBandId())

  const resolved = computed(() =>
    resolveActiveWorkspaceBand(access.value, hint.value, permission)
  )

  const band = computed(() => resolved.value.band)
  const bandId = computed(() => resolved.value.band?.bandId ?? null)
  const slug = computed(() => resolved.value.band?.slug ?? null)
  const mode = computed(() => resolved.value.mode)
  const bands = computed(() => resolved.value.bands)
  const isMultiBand = computed(() => resolved.value.bands.length > 1)
  const needsPicker = computed(() => resolved.value.mode === WORKSPACE_MODE.PICKER)
  /** Artist capability, independent of whether a band is chosen yet. */
  const hasWorkspaceAccess = computed(() => resolved.value.bands.length > 0)

  /** Append ?bandId= to a workspace link, but only for multi-band users. */
  function linkTo(path) {
    return withActiveBand(path, resolved.value)
  }

  /** Remember the opened band so the next page keeps this workspace. */
  function rememberActiveBand() {
    if (resolved.value.mode === WORKSPACE_MODE.SCOPED) {
      writeStoredActiveBandId(resolved.value.band?.bandId)
    }
  }

  /**
   * Access must be settled before anything resolves, or a page mounting while
   * the request is still in flight would see zero bands and behave as if the
   * user had none. Joins the in-flight call rather than issuing a second one.
   */
  async function ensureAccess() {
    if (accessResolved.value) return access.value
    if (status.value === 'pending') {
      await new Promise((done) => {
        const stop = watch(status, (next) => {
          if (next !== 'pending') {
            stop()
            done()
          }
        })
      })
      if (accessResolved.value) return access.value
    }
    await refreshAccess()
    return access.value
  }

  /**
   * Resolve the band for a page that needs one. Returns null and sends a
   * multi-band user to the picker rather than opening a different artist.
   */
  async function requireActiveBand() {
    await ensureAccess()
    if (resolved.value.mode === WORKSPACE_MODE.PICKER) {
      await navigateTo('/dashboard')
      return null
    }
    rememberActiveBand()
    return resolved.value.band
  }

  return {
    access,
    accessResolved,
    refreshAccess,
    resolved,
    hint,
    band,
    bandId,
    slug,
    mode,
    bands,
    isMultiBand,
    needsPicker,
    hasWorkspaceAccess,
    linkTo,
    ensureAccess,
    rememberActiveBand,
    requireActiveBand,
  }
}
