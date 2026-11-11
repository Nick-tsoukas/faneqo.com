import { consentErrorOf } from '~/composables/useBillingConsent'

/**
 * Server calls for the Payments panel: eligibility, Start Pro, and the
 * return-from-Stripe confirm. Every function degrades to null / a thrown
 * user-facing message; the editor keeps working without them.
 */
export function usePaymentActivation() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const api = (path) => `${config.public.strapiUrl}/api${path}`
  const auth = () => ({ Authorization: `Bearer ${token.value}` })

  /** The panel state for a band the user owns, or null when it can't be read. */
  async function fetchEligibility(bandId) {
    if (!token.value || !bandId) return null
    try {
      const res = await fetch(api(`/bands/${bandId}/payments/eligibility`), { headers: auth(), cache: 'no-store' })
      if (!res.ok) return null
      const json = await res.json()
      return typeof json?.state === 'string' ? json : null
    } catch {
      return null
    }
  }

  /**
   * The signed-in artist's subscription from /stripe/billing ({ status, price }),
   * so the panel quotes the price they're actually charged (a legacy $7 member
   * stays at $7). null = no subscription; undefined = couldn't be read, and the
   * panel then words charges without an amount.
   */
  async function fetchBillingSubscription() {
    if (!token.value) return undefined
    try {
      const res = await fetch(api('/stripe/billing'), { headers: auth(), cache: 'no-store' })
      if (!res.ok) return undefined
      const json = await res.json()
      const sub = json?.subscription
      if (sub === null) return null
      return sub && typeof sub.status === 'string' ? { status: sub.status, price: sub.price || null } : undefined
    } catch {
      return undefined
    }
  }

  /**
   * The Stripe-hosted page to pay for Pro (setup, subscription Checkout,
   * or an invoice). Throws a user-facing Error; `code` is set on a 409.
   */
  async function startProUrl(bandId, consent = null) {
    if (!token.value) throw new Error('Your session ended. Log in again to start Pro.')
    let res
    let json = null
    try {
      res = await fetch(api('/stripe/start-pro'), {
        method: 'POST',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        // Billing A: the consent to the server's own terms (version + termsKey); the server re-checks it.
        body: JSON.stringify({ bandId: bandId || null, consent: consent || undefined }),
      })
      json = await res.json().catch(() => null)
    } catch {
      throw new Error('Checkout didn’t open. Check your connection and try again.')
    }
    // Billing A: consent missing or stale. The caller shows the returned terms again.
    const refusal = consentErrorOf(json)
    if (refusal) {
      const err = new Error(refusal.code === 'terms_changed' ? 'The billing terms changed. Please review them and confirm again.' : 'Please confirm the billing terms first.')
      err.code = refusal.code
      err.consentRefusal = json
      throw err
    }
    if (res.status === 409) {
      const err = new Error(json?.error?.message || 'Your membership doesn’t need a payment right now.')
      err.code = json?.error?.details?.code || 'conflict'
      throw err
    }
    if (!res.ok || !json?.url) throw new Error('Checkout didn’t open. Try again in a moment.')
    return json.url
  }

  /** Verify a returning Checkout Session with the server (never the URL). */
  async function confirmReturn(sessionId) {
    if (!token.value || !sessionId) return { outcome: 'error' }
    try {
      const res = await fetch(api(`/stripe/start-pro/confirm?session_id=${encodeURIComponent(sessionId)}`), { headers: auth(), cache: 'no-store' })
      if (!res.ok) return { outcome: 'error' }
      return await res.json()
    } catch {
      return { outcome: 'error' }
    }
  }

  return { fetchEligibility, fetchBillingSubscription, startProUrl, confirmReturn }
}
