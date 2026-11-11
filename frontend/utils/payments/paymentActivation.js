/**
 * What the Support section's Payments panel shows, from the server's
 * eligibility answer (GET /bands/:id/payments/eligibility). Pure.
 *
 * The server decides; this only turns its state into words and actions.
 * Fraud and security rules are never named: blocked owners, suspended bands and
 * Stripe-rejected accounts all read as "unavailable".
 *
 * Returns null when there is no answer (older backend, not the owner, offline):
 * the editor then keeps its previous payout UI unchanged.
 */

import { CANCEL_HOW, PRO_PRICE_AMOUNT, PRO_PRICE_LABEL, priceAmountFrom, priceLabelFrom } from '../billing/billingTerms.js'

export const PRICE_LABEL = PRO_PRICE_LABEL

// DRAFT copy for development; final billing and fee wording needs legal review.
// Every view whose button can lead to a charge carries a disclosure (C3).
export const FEE_AND_APPROVAL =
  'On fan payments, Faneqo’s fee is 2% plus Stripe processing fees. ' +
  'Payments go live after Stripe setup and approval by the Faneqo team; paying for Pro does not activate them on its own.'

// Subscription statuses Start Pro charges in place (qrserver startPro.js decideStartPro):
// trialing ends the trial; past_due / unpaid / incomplete pay the open invoice.
const LIVE_SUBSCRIPTION = new Set(['trialing', 'active', 'past_due', 'unpaid', 'incomplete'])

/**
 * What a Start Pro / Update payment click is charged at.
 * `subscription` is /stripe/billing's `subscription` ({ status, price }):
 * undefined = not known, null = none.
 *   - a live subscription is charged at its OWN Stripe price, so a legacy $7
 *     subscriber stays at $7; amount and label are null when Stripe gave none;
 *   - none, or an ended one, starts a new subscription at the current price.
 * `fallback` applies when the subscription isn't known.
 */
export function chargeBasis(subscription, fallback = 'unknown') {
  if (subscription === undefined) {
    return fallback === 'new'
      ? { kind: 'new', amount: PRO_PRICE_AMOUNT, label: PRO_PRICE_LABEL, previousLabel: null }
      : { kind: 'unknown', amount: null, label: null }
  }
  if (subscription && LIVE_SUBSCRIPTION.has(subscription.status)) {
    const amount = priceAmountFrom(subscription.price)
    const label = priceLabelFrom(subscription.price)
    return { kind: 'existing', amount: amount && label ? amount : null, label: amount && label ? label : null }
  }
  const previousLabel = subscription ? priceLabelFrom(subscription.price) : null
  return {
    kind: 'new',
    amount: PRO_PRICE_AMOUNT,
    label: PRO_PRICE_LABEL,
    previousLabel: previousLabel && previousLabel !== PRO_PRICE_LABEL ? previousLabel : null,
  }
}

/** The charge sentence for Start Pro / Restart Pro, never with an invented amount. */
function startSentence(basis, { endsTrial = false, restart = false } = {}) {
  if (basis.kind === 'new') {
    const verb = restart ? 'Restarting Pro' : 'Starting Pro'
    const was = basis.previousLabel ? `Pro is now ${basis.label}; your previous membership was ${basis.previousLabel}. ` : ''
    const at = restart || basis.previousLabel ? ' at the current price' : ''
    return `${was}${verb} begins a new membership${at}: ${basis.amount} today, then ${basis.label} until you cancel.`
  }
  const lead = endsTrial ? 'Starting Pro ends the rest of your free trial and charges' : 'Starting Pro charges'
  if (basis.amount) return `${lead} ${basis.amount} today, then ${basis.label} until you cancel.`
  return `${lead} your Pro membership today at your plan’s price, then it renews until you cancel.`
}

/** Past due: the open invoice's amount isn't known here, so it's never stated. */
function updateSentence(basis) {
  if (basis.kind === 'new') return startSentence(basis)
  const renew = basis.label ? `Pro renews at ${basis.label}` : 'Pro renews at your plan’s price'
  return `Paying settles the amount that’s due now. After that, ${renew} until you cancel.`
}

export function disclosureStart(basis, { endsTrial = true } = {}) {
  return `${startSentence(basis, { endsTrial })} ${CANCEL_HOW} ${FEE_AND_APPROVAL}`
}
export function disclosureRestart(basis, { restart = false } = {}) {
  return `${startSentence(basis, { restart })} ${CANCEL_HOW} ${FEE_AND_APPROVAL}`
}
export function disclosureUpdate(basis) {
  return `${updateSentence(basis)} ${CANCEL_HOW}`
}
/** Payments already live on a dated exception: no approval sentence, they're on. */
export function disclosureContinue(basis, { endsTrial = false } = {}) {
  return `${startSentence(basis, { endsTrial })} ${CANCEL_HOW}`
}

// Reference wordings at the current price ($12): a $12 trial, a new membership.
const CURRENT = { kind: 'existing', amount: PRO_PRICE_AMOUNT, label: PRO_PRICE_LABEL }
export const DISCLOSURE_START = disclosureStart(CURRENT)
export const DISCLOSURE_RESTART = disclosureRestart(chargeBasis(null))
export const DISCLOSURE_UPDATE = disclosureUpdate(CURRENT)
export const DISCLOSURE_CONTINUE = disclosureContinue(CURRENT)

const DAY = 24 * 60 * 60 * 1000
const UPGRADE_BODY = 'Give fans more ways to support your music. Start Faneqo Pro to unlock payment setup for your artist page.'
const KEPT_BODY = 'Your artist page, events and fans are still here.'

/** Whole days left in a trial (0 once it has ended), or null without a date. */
export function trialDaysLeft(trialEndsAt, now = Date.now()) {
  const end = Date.parse(trialEndsAt || '')
  if (!Number.isFinite(end)) return null
  return Math.max(0, Math.ceil((end - now) / DAY))
}

function shortDate(iso) {
  const t = Date.parse(iso || '')
  if (!Number.isFinite(t)) return null
  return new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
}

function base() {
  return {
    kind: 'panel',
    step: null,
    firstLabel: 'Pro',
    eyebrow: 'Payments',
    eyebrowCheck: false,
    title: '',
    body: '',
    status: null,
    primary: null,
    primaryAction: null,
    secondary: null,
    secondaryAction: null,
    quiet: null,
    quietAction: null,
    badge: 'Locked',
    badgeTone: 'muted',
    previewLock: true,
    disclosure: null,
    foot: null,
    rowsLocked: true,
    rowNote: null,
    showTiles: false,
    liveNote: null,
  }
}

const ENTITLED = new Set(['lifetime', 'exception', 'paid', 'grace'])

function proEyebrow(billing) {
  const standing = billing?.standing
  if (standing === 'lifetime') return { eyebrow: 'Included with Lifetime Pro', eyebrowCheck: true, firstLabel: 'Lifetime Pro' }
  if (standing === 'paid' || standing === 'grace') return { eyebrow: 'Faneqo Pro is active', eyebrowCheck: true }
  if (standing === 'exception') return { eyebrow: 'Payments included for now', eyebrowCheck: true }
  return { eyebrow: 'Payments', eyebrowCheck: false }
}

/**
 * @param {object|null} eligibility server answer: { state, eligible, billing, enforced }
 * @param {{ now?: number, keptTrial?: boolean, subscription?: object|null }} options
 *   subscription: /stripe/billing's subscription ({ status, price }), null for
 *   none, undefined when unknown. Prices and charges follow it (see chargeBasis).
 */
export function activationView(eligibility, { now = Date.now(), keptTrial = false, subscription } = {}) {
  if (!eligibility || typeof eligibility.state !== 'string') return null
  const { state, billing = {} } = eligibility
  const enforced = eligibility.enforced === true
  // Before enforcement, artists without Pro still follow today's flow: no Pro step to show.
  const showRail = enforced || ENTITLED.has(billing.standing)
  const v = base()
  const days = trialDaysLeft(billing.trialEndsAt, now)
  // Trial, past due and exception charge the existing subscription; an ended
  // membership (trial_ended / canceled) starts a new one at the current price.
  const basis = chargeBasis(subscription, state === 'trial_ended' || state === 'canceled' ? 'new' : 'unknown')
  const priced = (verb) => (basis.label ? `${verb} — ${basis.label}` : verb)
  const endsTrial = basis.kind === 'existing' ? subscription?.status === 'trialing' : basis.kind === 'unknown' && state === 'upgrade'

  switch (state) {
    case 'upgrade': {
      if (keptTrial) {
        return { ...v, kind: 'collapsed', title: 'Payments unlock with Pro', body: days != null ? `${days} ${days === 1 ? 'day' : 'days'} left in your free trial` : 'You’re on the free trial', primary: 'Start Pro', primaryAction: 'start_pro', disclosure: disclosureStart(basis, { endsTrial }) }
      }
      return {
        ...v,
        step: 0,
        eyebrow: days != null && days > 0 ? `Faneqo Pro · ${days} ${days === 1 ? 'day' : 'days'} left in your trial` : 'Faneqo Pro · Free trial',
        title: 'Ready to start earning?',
        body: UPGRADE_BODY,
        primary: priced('Start Pro'),
        primaryAction: 'start_pro',
        secondary: 'Keep my free trial',
        secondaryAction: 'keep_trial',
        disclosure: disclosureStart(basis, { endsTrial }),
      }
    }
    case 'trial_ended':
      return {
        ...v,
        step: 0,
        eyebrow: 'Faneqo Pro · Your free trial has ended',
        title: 'Ready to start earning?',
        body: `${KEPT_BODY} Start Faneqo Pro to unlock payment setup for your artist page.`,
        primary: priced('Start Pro'),
        primaryAction: 'start_pro',
        disclosure: disclosureRestart(basis),
      }
    case 'canceled':
      return {
        ...v,
        step: 0,
        eyebrow: 'Faneqo Pro · Membership ended',
        title: 'Restart Pro to accept payments',
        body: `${KEPT_BODY} Restart Faneqo Pro to turn payments back on.`,
        primary: priced('Restart Pro'),
        primaryAction: 'start_pro',
        disclosure: disclosureRestart(basis, { restart: true }),
        rowNote: 'Your payment options are kept and come back when you restart Pro.',
      }
    case 'past_due': {
      const pause = shortDate(billing.graceEndsAt)
      const paused = !billing.graceEndsAt || Date.parse(billing.graceEndsAt) <= now
      return {
        ...v,
        step: 0,
        eyebrow: 'Faneqo Pro · Payment needed',
        title: 'Update your membership payment',
        body: paused || !pause
          ? 'Your last Pro payment didn’t go through, so payments are paused until it’s resolved.'
          : `Your last Pro payment didn’t go through. Payments pause on ${pause} unless it’s resolved.`,
        primary: 'Update payment',
        primaryAction: 'update_payment',
        disclosure: disclosureUpdate(basis),
        foot: 'Your artist page, events and fans aren’t affected.',
        rowNote: 'Your payment options are kept and come back as soon as the payment goes through.',
      }
    }
    case 'payout_setup':
      return {
        ...v,
        ...proEyebrow(billing),
        step: showRail ? 1 : null,
        title: 'Connect your payouts',
        body: 'Link a Stripe account so fan payments go straight to your bank. It takes about five minutes.',
        primary: 'Set up payouts',
        primaryAction: 'setup_payouts',
        badge: 'Not live yet',
        foot: 'Stripe confirms your identity and bank details, then brings you back here. Payments go live once the Faneqo team approves your account.',
        rowsLocked: false,
        rowNote: 'Options you turn on appear on your artist page as soon as payments are live.',
      }
    case 'stripe_review':
      return {
        ...v,
        ...proEyebrow(billing),
        step: showRail ? 2 : null,
        title: 'We’re verifying your account',
        body: 'Stripe is confirming your details, usually within minutes. The Faneqo team then reviews your account before fans can pay you.',
        status: 'Stripe verification in progress',
        quiet: 'Check status',
        quietAction: 'check_status',
        secondary: 'Payout settings',
        secondaryAction: 'payout_settings',
        badge: 'In review',
        badgeTone: 'progress',
        rowsLocked: false,
        rowNote: 'Options you turn on appear on your artist page as soon as payments are live.',
      }
    case 'security_review':
      return {
        ...v,
        ...proEyebrow(billing),
        step: showRail ? 2 : null,
        title: 'Your account is in review',
        body: 'Stripe has confirmed your details. The Faneqo team reviews every new payments account before fans can pay you. You don’t need to do anything; this page updates as soon as you’re approved.',
        status: 'Faneqo team review in progress',
        quiet: 'Check status',
        quietAction: 'check_status',
        badge: 'In review',
        badgeTone: 'progress',
        rowsLocked: false,
        rowNote: 'Options you turn on appear on your artist page as soon as payments are live.',
      }
    case 'live': {
      const until = billing.standing === 'exception' ? shortDate(billing.exceptionExpiresAt) : null
      return {
        ...v,
        kind: 'live',
        title: 'Payments are live',
        body: 'Fans can pay you from your artist page.',
        rowsLocked: false,
        showTiles: true,
        previewLock: false,
        liveNote: until ? `Your payments continue while you move to Faneqo Pro, until ${until}.` : null,
        primary: until ? priced('Start Pro') : null,
        primaryAction: until ? 'start_pro' : null,
        disclosure: until ? disclosureContinue(basis, { endsTrial }) : null,
      }
    }
    case 'review':
      return {
        ...v,
        kind: 'restricted',
        title: 'A quick review is in progress',
        body: 'We paused new payments while we review recent activity on your page. Most reviews finish within one business day. Your artist page, events and fans aren’t affected.',
        quiet: 'Contact support',
        quietAction: 'contact_support',
        rowNote: 'Your payment options are kept and come back when the review finishes.',
      }
    case 'unavailable':
    default:
      return {
        ...v,
        kind: 'restricted',
        title: 'Payments are unavailable for this account',
        body: 'If you think this is a mistake, our team can review it with you. Your artist page, events and fans aren’t affected.',
        quiet: 'Contact support',
        quietAction: 'contact_support',
        hideRows: true,
      }
  }
}

/**
 * Create Artist has no band to ask the server about yet, so it builds the same
 * shape from the signed-in account, for display only (the server still decides
 * at checkout). Returns null unless the paid requirement is enforced, so the
 * create page keeps today's flow until then. Mirrors billingStanding() in
 * qrserver utils/payments/paymentEligibility.js.
 */
export function createPageEligibility(user, { enforced = false, now = Date.now() } = {}) {
  if (!enforced || !user) return null
  const status = String(user.subscriptionStatus || '').trim()
  const paidOnce = Boolean(user.firstPaidAt)
  let standing
  if (String(user.plan || '').trim() === 'free' || status === 'free') standing = 'lifetime'
  else if (status === 'active') standing = paidOnce ? 'paid' : 'unverified'
  else if (status === 'pastDue' || status === 'past_due') {
    const start = Date.parse(user.gracePeriodStart || '')
    standing = paidOnce && Number.isFinite(start) && now <= start + 3 * DAY ? 'grace' : 'past_due'
  } else if (status === 'trialing') standing = 'trial'
  else standing = paidOnce ? 'canceled' : 'trial_ended'

  const STATE = { trial: 'upgrade', trial_ended: 'trial_ended', canceled: 'canceled', unverified: 'canceled', past_due: 'past_due' }
  const state = ENTITLED.has(standing) ? 'payout_setup' : STATE[standing]
  return { state, eligible: false, enforced: true, billing: { standing, trialEndsAt: user.trialEndsAt || null, graceEndsAt: null } }
}

/** One line after returning from Stripe Checkout (from the confirm call or ?billing=). */
export function billingReturnNotice(result) {
  switch (result?.outcome) {
    case 'paid':
      return { tone: 'success', text: 'Faneqo Pro is active. Your $12 payment went through.' }
    case 'requires_action':
      return { tone: 'info', text: 'Your bank needs you to approve the $12 payment. Your free trial continues until you do.', action: 'Approve payment', url: result.invoiceUrl || null }
    case 'declined':
      return { tone: 'error', text: 'Your card was declined, so nothing was charged. Your free trial continues.' }
    case 'pending':
      return { tone: 'info', text: 'Stripe is still confirming your payment. This usually takes a few seconds.' }
    case 'canceled':
    case 'open':
    case 'expired':
      return { tone: 'neutral', text: 'Checkout wasn’t completed, so no charge was made.' }
    case 'error':
      return { tone: 'error', text: 'We couldn’t confirm with Stripe yet. Check again in a moment.' }
    default:
      return null
  }
}

/** `?billing=` values Stripe returns with; anything else is ignored. */
export function billingReturnKind(query) {
  const v = Array.isArray(query?.billing) ? query.billing[0] : query?.billing
  return v === 'return' || v === 'canceled' ? v : null
}

/** Initials for the artist-page preview when the artist has no photo. */
export function artistInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '♪'
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]
  return letters.toUpperCase()
}

/** Remembered per band for this browser session only: "Keep my free trial" never changes billing. */
export function keptTrialKey(bandId) {
  return `fq-keep-trial-${bandId}`
}

/** Whether this eligibility answer can show a button that charges (so the price is worth reading). */
export function chargeCanShow(eligibility) {
  const state = eligibility?.state
  if (['upgrade', 'trial_ended', 'canceled', 'past_due'].includes(state)) return true
  return state === 'live' && eligibility?.billing?.standing === 'exception'
}
