/**
 * Business facts shown on the Terms of Service and Privacy Policy, in one place.
 *
 * DRAFT (2026-11-11). Nothing here may be guessed:
 *   - null means the founder has not confirmed it yet; the pages show a visible
 *     "to confirm" marker instead of inventing a value.
 *   - Faneqo is run by an individual sole proprietor in Illinois. It is NOT an
 *     LLC or a corporation. Never add "LLC", "Inc." or a registered entity here
 *     until one actually exists.
 *   - `effectiveDate` stays null until publication is approved; the pages then
 *     read "Draft, not yet in effect".
 */

export const LEGAL_INFO = Object.freeze({
  brand: 'Faneqo',
  formerName: 'MusicBizQR',
  operatorLegalName: 'Nikolaos Tsoukas', // confirmed by the founder 2026-11-11
  operatorStructure: 'an individual sole proprietor based in Illinois, USA',
  supportEmail: 'support@faneqo.com', // intended address, confirmed by the founder 2026-11-11
  // Mailbox set up in Proton; inbound and outbound delivery NOT verified yet.
  // Delivery test is an outstanding operational item, not claimed completed.
  supportEmailVerified: false,
  mailingAddress: null, // No public address for now; review with counsel
  governingLaw: 'Illinois', // ATTORNEY REVIEW
  // No age verification or artist age gate introduced by this release.
  effectiveDate: 'November 10, 2026', // founder-approved publication date
  proPrice: '$12/month',
  trialDays: 30,
  platformFeePercent: 2,
  cancelPath: 'Account → Manage Billing Info',
})

/** Ready to publish without claiming email deliverability or legal review is complete. */
export function legalReadyToPublish(info = LEGAL_INFO) {
  return Boolean(info.operatorLegalName && info.supportEmail && info.effectiveDate)
}
export function legalMissingFields(info = LEGAL_INFO) {
  return ['operatorLegalName', 'supportEmail', 'effectiveDate'].filter((k) => info[k] == null)
}
