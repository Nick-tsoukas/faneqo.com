/**
 * Which payment buttons a fan may see on an artist page.
 *
 * The server decides readiness: `paymentsEnabled` is true only while the
 * band's Stripe account has submitted its details, Stripe allows charges, and
 * the band isn't suspended. An artist can switch buttons on in the editor
 * before finishing Stripe setup; those saved choices stay untouched here, but
 * fans see nothing until payments are live, so no button ever ends in
 * "Payments not enabled for this band".
 *
 * Fails closed: a missing or non-true flag hides every button.
 */

export function paymentsAreLive(band) {
  return band?.paymentsEnabled === true
}

export function livePaymentButtons(band) {
  if (!paymentsAreLive(band)) return []
  const btns = band?.paymentButtons
  return Array.isArray(btns) ? btns.filter((b) => b && b.enabled === true) : []
}
