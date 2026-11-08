/**
 * What the artist sees about payout setup in the band editor and dashboard.
 *
 * Fans only see payment options while payments are live (the server's
 * `paymentsEnabled`). An artist can switch options on before that, and those
 * choices are kept; this tells them why fans can't see them yet and what to do.
 * No prices here: Stripe shows the real terms during setup.
 */

/** Stages returned by GET /bands/:id/payments/status (read fresh from Stripe). */
export const PAYOUT_STAGES = ['live', 'not_started', 'in_progress', 'review', 'paused']

/** Stage from the band's stored flags, for when the server hasn't answered. */
export function stageFromFlags({ stripeAccountId = null, stripeOnboardingComplete = false, paymentsEnabled = false } = {}) {
  if (paymentsEnabled === true) return 'live'
  if (!stripeAccountId) return 'not_started'
  if (stripeOnboardingComplete !== true) return 'in_progress'
  return 'paused'
}

/**
 * `stage` (the server's fresh answer) wins over the stored flags when present.
 *
 * @returns {{ state: 'live'|'not_started'|'in_progress'|'review'|'paused', tone: 'ready'|'action',
 *             title: string, body: string, action: string|null }}
 */
export function paymentSetupStatus({
  stripeAccountId = null,
  stripeOnboardingComplete = false,
  paymentsEnabled = false,
  enabledOptionCount = 0,
  stage = null,
} = {}) {
  const state = PAYOUT_STAGES.includes(stage)
    ? stage
    : stageFromFlags({ stripeAccountId, stripeOnboardingComplete, paymentsEnabled })
  const n = Number(enabledOptionCount) || 0
  const options = n === 1 ? '1 payment option' : `${n} payment options`

  if (state === 'live') {
    return {
      state,
      tone: 'ready',
      title: 'Fans can pay you',
      body: n > 0
        ? `${options} ${n === 1 ? 'shows' : 'show'} on your artist page.`
        : 'Payouts are ready. Switch on a payment option below to show it on your artist page.',
      action: null,
    }
  }

  const kept = n > 0 ? ` Your ${options} ${n === 1 ? 'is' : 'are'} saved and will appear as soon as payouts are ready.` : ''

  if (state === 'not_started') {
    return {
      state,
      tone: 'action',
      title: n > 0 ? "Fans can't see your payment options yet" : 'Set up payouts to accept support',
      body: `Connect a Stripe account so fans can pay you and the money reaches your bank. It takes a few minutes.${kept}`,
      action: 'Set up payouts',
    }
  }

  if (state === 'in_progress') {
    return {
      state,
      tone: 'action',
      title: 'Finish payout setup',
      body: `Stripe still needs a few details before fans can pay you.${kept}`,
      action: 'Continue payout setup',
    }
  }

  if (state === 'review') {
    return {
      state,
      tone: 'action',
      title: 'Stripe is reviewing your details',
      body: `This usually takes a few minutes, occasionally a day or two. If Stripe needs anything else, you'll find it in payout setup.${kept}`,
      action: 'Check payout setup',
    }
  }

  return {
    state: 'paused',
    tone: 'action',
    title: 'Payments are paused',
    body: `Stripe needs more information, or your account is under review. Open payout setup to see what's missing.${kept}`,
    action: 'Check payout setup',
  }
}

/**
 * The message an artist sees right after coming back from Stripe.
 * `action` is what the primary button does: 'options' opens the payment
 * options in the band editor, 'setup' reopens Stripe, null shows no button.
 *
 * @returns {{ tone: 'ready'|'action', title: string, body: string, actionLabel: string|null, action: 'options'|'setup'|null }}
 */
export function payoutReturnNotice(stage, { bandName = '', expired = false, verified = true } = {}) {
  const who = bandName ? `${bandName}: ` : ''
  // Stripe couldn't be reached: never claim a fresh result, good or bad.
  if (!verified) {
    if (expired) return payoutReturnNotice('in_progress', { bandName, expired: true })
    return {
      tone: 'action',
      title: "We couldn't confirm your payout status yet",
      body: `${who}Stripe didn't answer just now. Your status will update shortly; check back in a few minutes.`,
      actionLabel: null,
      action: null,
    }
  }
  if (stage === 'live') {
    return {
      tone: 'ready',
      title: 'Your payments are ready!',
      body: `${who}fans can now support you from your artist page. Choose which payment options they see.`,
      actionLabel: 'Choose payment options',
      action: 'options',
    }
  }
  if (stage === 'review') {
    return {
      tone: 'action',
      title: 'Stripe is reviewing your details',
      body: `${who}your details are submitted. Payment options appear on your artist page as soon as Stripe finishes, usually within minutes.`,
      actionLabel: null,
      action: null,
    }
  }
  if (stage === 'paused') {
    return {
      tone: 'action',
      title: 'Payments are paused',
      body: `${who}Stripe needs more information, or your account is under review.`,
      actionLabel: 'Check payout setup',
      action: 'setup',
    }
  }
  return {
    tone: 'action',
    title: expired ? 'Your setup link expired' : 'Payout setup isn’t finished',
    body: `${who}${expired ? 'pick up where you left off.' : 'Stripe still needs a few details before fans can pay you.'} Your saved payment options are kept.`,
    actionLabel: 'Continue payout setup',
    action: 'setup',
  }
}
