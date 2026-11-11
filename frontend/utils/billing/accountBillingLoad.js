/**
 * Loads the Account page's billing block from GET /stripe/billing. Pure apart
 * from the injected `fetchBilling`.
 *
 * Why this exists (2026-11-11): the Account page used `useFetch()` inside an
 * async `onMounted`. Outside component setup that call never sent a request
 * in production and returned no data and no error, so neither "Subscription
 * Status" nor "unavailable" rendered. The page now uses the same authenticated
 * client call as the dashboard (useStrapiClient → /stripe/billing).
 *
 * @param {() => Promise<any>} fetchBilling   resolves the /stripe/billing JSON
 * @param {{ billingExemptUser?: boolean }} opts Lifetime Pro per the signed-in user
 * @returns {Promise<{ billingData: object|null, billingUnavailable: boolean }>}
 *   - billingData: the response (subscription, hasPaymentMethod, trialEndsAt,
 *     or the ambassador payload); null when it couldn't be read
 *   - billingUnavailable: true only when a billable account's billing couldn't
 *     be read; never for Lifetime Pro, who has no Stripe billing at all
 */
export async function loadAccountBilling(fetchBilling, { billingExemptUser = false } = {}) {
  try {
    const data = await fetchBilling()
    if (!data || typeof data !== 'object') {
      return { billingData: null, billingUnavailable: !billingExemptUser }
    }
    return { billingData: data, billingUnavailable: false }
  } catch {
    return { billingData: null, billingUnavailable: !billingExemptUser }
  }
}
