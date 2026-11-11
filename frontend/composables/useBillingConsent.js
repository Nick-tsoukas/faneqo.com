/**
 * Billing A+B: explicit consent before anything that authorizes recurring
 * charges. The SERVER describes the terms (price, timing, renewal, how to
 * cancel) and binds them to a `termsKey`; this only shows them, keeps the
 * unticked checkbox, and echoes the key back. The server re-checks everything,
 * so nothing here is trusted for the price.
 *
 *   kind 'start_pro' → GET /stripe/start-pro/terms      (Start Pro / Restart / Update payment)
 *   kind 'portal'    → GET /stripe/billing-portal/terms (Add card in trial, pay when past due)
 */
import { computed, ref } from 'vue'

/**
 * The exact disclosure an agreement applies to: version, key and action. An
 * agreement given to one disclosure never authorizes a different one.
 */
export function termsIdentity(terms) {
  if (!terms?.consentRequired) return null
  return `${terms.version}|${terms.termsKey}|${terms.action || ''}`
}

export function consentPayload(terms, agreed) {
  if (!terms?.consentRequired) return null
  if (agreed !== true) return null
  return { accepted: true, version: terms.version, termsKey: terms.termsKey }
}

/** The error the server returns when consent is missing or stale, as { code, terms } or null. */
export function consentErrorOf(json) {
  // useStrapiClient throws the response body itself; a raw FetchError keeps it under `.data`.
  const details = json?.error?.details ?? json?.data?.error?.details
  if (!details || !['consent_required', 'terms_changed'].includes(details.code)) return null
  return { code: details.code, terms: details.terms || null }
}

export function useBillingConsent(kind) {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const api = (path) => `${config.public.strapiUrl}/api${path}`
  const auth = () => ({ Authorization: `Bearer ${token.value}` })

  const terms = ref(null)
  const loading = ref(false)
  // Acceptance is bound to the exact terms it was given for (termsIdentity). When the
  // terms change (reload, refusal, another account or action), `agreed` reads false
  // again immediately, with no watcher timing involved.
  const agreedFor = ref(null)
  const agreed = computed({
    get: () => agreedFor.value !== null && agreedFor.value === termsIdentity(terms.value),
    set: (on) => { agreedFor.value = on === true ? termsIdentity(terms.value) : null },
  })
  const notice = ref('')

  const needsConsent = computed(() => Boolean(terms.value?.consentRequired))
  const ready = computed(() => Boolean(terms.value) && (!needsConsent.value || agreed.value))

  /** Loads the server's terms; leaves `terms` null (and the action disabled) if they can't be read. */
  async function load({ bandId = null } = {}) {
    // A fresh load always needs a fresh tick: no agreement carries across loads, accounts or actions.
    agreedFor.value = null
    if (!token.value) return null
    loading.value = true
    try {
      const path = kind === 'portal' ? '/stripe/billing-portal/terms' : `/stripe/start-pro/terms${bandId ? `?bandId=${encodeURIComponent(bandId)}` : ''}`
      const res = await fetch(api(path), { headers: auth(), cache: 'no-store' })
      // Rollout safety: before the backend with these routes is deployed they 404. The old backend
      // doesn't ask for consent, so the action proceeds as before. Once the backend is live the
      // route answers and the SERVER enforces consent, so this can't be used to skip it.
      if (res.status === 404) {
        terms.value = { consentRequired: false, legacyBackend: true }
        return terms.value
      }
      const json = await res.json().catch(() => null)
      terms.value = res.ok && json && typeof json.consentRequired === 'boolean' ? json : null
    } catch {
      terms.value = null
    } finally {
      loading.value = false
    }
    return terms.value
  }

  /** The consent to send with the action, or null when none is needed (or not given). */
  function payload() {
    return consentPayload(terms.value, agreed.value)
  }

  /**
   * After a 400/409 consent refusal: show the server's current terms again and
   * untick, so the artist re-reads them. Returns true when handled.
   */
  function handleRefusal(json) {
    const refusal = consentErrorOf(json)
    if (!refusal) return false
    if (refusal.terms) terms.value = refusal.terms
    agreedFor.value = null
    notice.value = refusal.code === 'terms_changed'
      ? 'The billing terms changed. Please review them and confirm again.'
      : 'Please confirm the billing terms first.'
    return true
  }

  return { terms, loading, agreed, notice, needsConsent, ready, load, payload, handleRefusal }
}
