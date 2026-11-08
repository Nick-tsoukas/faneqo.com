/**
 * The one way the app opens Stripe payout setup and checks where it stands.
 * Used by the band editor, create band and the dashboard.
 *
 * `from` tells the server where Stripe should send the artist back:
 * 'editband' → /editband/:id?payouts=return, 'dashboard' → /dashboard?bandId=:id&payouts=return.
 */
export function usePayoutSetup() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()

  /** Returns the Stripe onboarding URL; throws with a user-facing message. */
  async function payoutSetupUrl(bandId, from) {
    if (!token.value) throw new Error('Your session ended. Log in again to set up payouts.')
    let res
    let json = null
    try {
      res = await fetch(`${config.public.strapiUrl}/api/bands/${bandId}/payments/onboard`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from }),
      })
      json = await res.json().catch(() => null)
    } catch {
      throw new Error("Stripe payout setup didn't open. Check your connection and try again.")
    }
    if (!res.ok || !json?.url) {
      console.error('Payout setup error:', res.status, json?.error?.message || 'missing url')
      throw new Error("Stripe payout setup didn't open. Try again in a moment.")
    }
    return json.url
  }

  /** Sends the browser to Stripe; throws with a user-facing message on failure. */
  async function openPayoutSetup(bandId, from) {
    const url = await payoutSetupUrl(bandId, from)
    window.location.href = url
  }

  /**
   * Back button from Stripe can restore this page from the browser cache with
   * its "Opening Stripe…" state still on; `reset` clears it.
   */
  function onBackFromStripe(reset) {
    const handler = (e) => { if (e.persisted) reset() }
    onMounted(() => window.addEventListener('pageshow', handler))
    onBeforeUnmount(() => window.removeEventListener('pageshow', handler))
  }

  /**
   * Fresh setup stage from the server, or null when it can't answer
   * (not the owner, offline, older backend). Callers fall back to stored flags.
   */
  async function fetchPayoutStatus(bandId) {
    if (!token.value || !bandId) return null
    try {
      const res = await fetch(`${config.public.strapiUrl}/api/bands/${bandId}/payments/status`, {
        headers: { Authorization: `Bearer ${token.value}` },
        cache: 'no-store',
      })
      if (!res.ok) return null
      const json = await res.json()
      return typeof json?.stage === 'string' ? json : null
    } catch {
      return null
    }
  }

  return { payoutSetupUrl, openPayoutSetup, fetchPayoutStatus, onBackFromStripe }
}

/** `?payouts=` values Stripe returns with; anything else is ignored. */
export function payoutReturnKind(query) {
  const v = Array.isArray(query?.payouts) ? query.payouts[0] : query?.payouts
  return v === 'return' || v === 'refresh' || v === 'error' ? v : null
}
