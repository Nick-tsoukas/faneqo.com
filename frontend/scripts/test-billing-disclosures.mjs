/**
 * C3: billing and trial disclosures appear wherever a trial starts or a card can be charged.
 * Run: node scripts/test-billing-disclosures.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SIGNUP_TERMS,
  GOOGLE_NEW_ACCOUNT_TERMS,
  TRIAL_DAYS,
  PRO_PRICE_LABEL,
  priceLabelFrom,
  trialBannerText,
  pastDueChargeNote,
  accountBillingTerms,
} from '../utils/billing/billingTerms.js'
import { activationView, chargeBasis, chargeCanShow, DISCLOSURE_START, DISCLOSURE_RESTART, DISCLOSURE_UPDATE, DISCLOSURE_CONTINUE } from '../utils/payments/paymentActivation.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const PRICE = { unitAmount: 1200, currency: 'usd', interval: 'month', intervalCount: 1 }
const PRICE7 = { ...PRICE, unitAmount: 700 }
// /stripe/billing's subscription: { status, price }
const sub = (status, price = PRICE) => ({ status, price })
const panel = (state, billing, subscription, opts = {}) =>
  activationView({ state, enforced: true, billing }, { subscription, ...opts })

test('signup terms: 30-day free trial, no card, $12/month, renewal, when billing starts, how to cancel', () => {
  assert.equal(TRIAL_DAYS, 30)
  assert.equal(PRO_PRICE_LABEL, '$12/month')
  assert.match(SIGNUP_TERMS, /30-day free trial/)
  assert.match(SIGNUP_TERMS, /no card needed/)
  assert.match(SIGNUP_TERMS, /\$12\/month/)
  assert.match(SIGNUP_TERMS, /renews monthly/)
  assert.match(SIGNUP_TERMS, /only once you add a card/)
  assert.match(SIGNUP_TERMS, /No card, no charge/)
  assert.match(SIGNUP_TERMS, /Cancel anytime from Account → Manage Billing Info/)
})

test('signup page shows the terms before both signup buttons and ties them to Create account', () => {
  const page = read('pages/signup.vue')
  const template = page.slice(0, page.indexOf('</template>'))
  const terms = template.indexOf('data-testid="signup-billing-terms"')
  assert.ok(terms > 0, 'terms rendered')
  assert.ok(terms < template.indexOf('type="submit"'), 'before Create account')
  assert.ok(terms < template.indexOf('<AuthSocialButton'), 'before Google sign-up')
  assert.match(template, /aria-describedby="signup-billing-terms"/)
  assert.match(page, /import \{ SIGNUP_TERMS \} from "~\/utils\/billing\/billingTerms"/)
  assert.doesNotMatch(template, /v-if="[^"]*"[^>]*signup-billing-terms/, 'never conditionally hidden')
})

test('price label comes from the real Stripe price and is never invented', () => {
  assert.equal(priceLabelFrom(PRICE), '$12/month')
  assert.equal(priceLabelFrom({ ...PRICE, unitAmount: 700 }), '$7/month')
  assert.equal(priceLabelFrom({ ...PRICE, unitAmount: 1250 }), '$12.50/month')
  assert.equal(priceLabelFrom({ ...PRICE, intervalCount: 3 }), '$12 every 3 months')
  for (const bad of [null, {}, { ...PRICE, unitAmount: null }, { ...PRICE, currency: '' }, { ...PRICE, interval: null }, { ...PRICE, unitAmount: 0 }]) {
    assert.equal(priceLabelFrom(bad), null)
  }
})

test('trial banner: no charge today, price from the trial end, renewal, never an invented amount', () => {
  const t = trialBannerText('$12/month')
  assert.match(t, /won’t be charged today/)
  assert.match(t, /\$12\/month from the day your trial ends/)
  assert.match(t, /until you cancel/)
  assert.doesNotMatch(trialBannerText(null), /\$/)
})

test('past-due note warns about an immediate charge, never states the amount due, renews at the real price', () => {
  assert.equal(pastDueChargeNote('$12/month'), 'This may charge the amount that’s due right away. After that, Pro renews at $12/month until you cancel.')
  assert.equal(pastDueChargeNote('$7/month'), 'This may charge the amount that’s due right away. After that, Pro renews at $7/month until you cancel.')
  assert.doesNotMatch(pastDueChargeNote('$7/month'), /\$12/)
  assert.doesNotMatch(pastDueChargeNote(null), /\$/)
  assert.match(pastDueChargeNote(null), /right away/)
})

test('account terms: by status; Lifetime Pro and ended subscriptions get none', () => {
  assert.deepEqual(accountBillingTerms({ status: 'trialing', priceLabel: '$12/month', billingExempt: true }), [])
  for (const s of ['canceled', 'incomplete_expired', 'free', '', null]) assert.deepEqual(accountBillingTerms({ status: s, priceLabel: '$12/month' }), [])

  const trial = accountBillingTerms({ status: 'trialing', priceLabel: '$12/month' })
  assert.match(trial[0], /trial is free.*renews at \$12\/month when the trial ends.*Without one, nothing is charged/)
  assert.match(trial.at(-1), /Cancel anytime in Manage Billing Info/)

  const noCard = accountBillingTerms({ status: 'past_due', priceLabel: '$12/month', hasPaymentMethod: false })
  assert.match(noCard[0], /^Adding a card may charge the amount that’s due right away/)
  assert.match(accountBillingTerms({ status: 'past_due', priceLabel: '$7/month' })[0], /renews at \$7\/month/)
  const failed = accountBillingTerms({ status: 'pastDue', priceLabel: '$12/month', hasPaymentMethod: true })
  assert.match(failed[0], /^Paying the invoice may charge/)

  const active = accountBillingTerms({ status: 'active', priceLabel: '$12/month' })
  assert.equal(active.length, 1)
  assert.match(active[0], /end of your current trial or billing period and won’t renew after that. Any balance that’s already due may still be collected./)
  // Cancelling stops renewal; it does not forgive a balance already due, so never claim no further charges.
  for (const st of ['trialing', 'active', 'past_due', 'unpaid']) {
    assert.doesNotMatch(accountBillingTerms({ status: st, priceLabel: '$12/month' }).join(' '), /charged again|never be charged/, st)
  }
  assert.doesNotMatch(accountBillingTerms({ status: 'trialing' }).join(' '), /\$/, 'no invented amount')
})

// Every Stripe status the panel can meet, at $7 (legacy), $12, and with no price; plus none and unknown.
const SUBSCRIPTIONS = [undefined, null]
for (const status of ['trialing', 'active', 'past_due', 'unpaid', 'incomplete', 'canceled', 'incomplete_expired']) {
  for (const price of [PRICE, PRICE7, null]) SUBSCRIPTIONS.push(sub(status, price))
}

test('panel: every charging view has a disclosure with renewal and cancellation, at the price actually charged', () => {
  const states = ['upgrade', 'trial_ended', 'canceled', 'past_due', 'payout_setup', 'stripe_review', 'security_review', 'live', 'review', 'unavailable']
  const standings = ['trial', 'trial_ended', 'canceled', 'past_due', 'paid', 'grace', 'exception', 'lifetime', 'unverified']
  let checked = 0
  for (const state of states) for (const standing of standings) for (const enforced of [true, false]) for (const keptTrial of [true, false]) for (const subscription of SUBSCRIPTIONS) {
    const v = activationView(
      { state, enforced, billing: { standing, trialEndsAt: '2099-01-01T00:00:00Z', graceEndsAt: null, exceptionExpiresAt: standing === 'exception' ? '2099-01-01T00:00:00Z' : null } },
      { keptTrial, subscription }
    )
    if (!['start_pro', 'update_payment'].includes(v?.primaryAction)) continue
    checked++
    const where = `${state}/${standing}/${keptTrial}/${subscription?.status}/${subscription?.price?.unitAmount}`
    assert.ok(v.disclosure, `${where} has a disclosure`)
    assert.match(v.disclosure, /until you cancel/, where)
    assert.match(v.disclosure, /Cancel anytime from Account → Manage Billing Info/, where)
    assert.doesNotMatch(v.disclosure, /\$\d+ that’s due/, `${where}: never states the amount due`)
    const basis = chargeBasis(subscription, state === 'trial_ended' || state === 'canceled' ? 'new' : 'unknown')
    const amounts = (v.disclosure + ' ' + v.primary + ' ' + v.body).match(/\$\d+(\.\d\d)?/g) || []
    if (basis.kind === 'new') {
      // A new subscription is at the current price, and says so (a previous $7 may be named as the old rate).
      assert.ok(amounts.every((a) => a === '$12' || a === '$7'), where)
      assert.match(v.disclosure, /\$12 today, then \$12\/month until you cancel/, where)
    } else if (basis.label) {
      // An existing subscription is quoted at its own price only: $7 stays $7.
      const own = basis.amount
      assert.ok(amounts.length > 0 && amounts.every((a) => a === own), `${where}: only ${own}, got ${amounts}`)
    } else {
      assert.deepEqual(amounts, [], `${where}: no amount when the price isn't known`)
    }
  }
  assert.ok(checked >= 100, `covered ${checked} charging views`)
})

test('panel: legacy $7 subscriber keeps $7 (trial end, past due, exception)', () => {
  const trial = panel('upgrade', { standing: 'trial' }, sub('trialing', PRICE7))
  assert.equal(trial.primary, 'Start Pro — $7/month')
  assert.match(trial.disclosure, /^Starting Pro ends the rest of your free trial and charges \$7 today, then \$7\/month until you cancel\./)
  const pastDue = panel('past_due', { standing: 'past_due' }, sub('past_due', PRICE7))
  assert.equal(pastDue.primary, 'Update payment')
  assert.match(pastDue.disclosure, /^Paying settles the amount that’s due now\. After that, Pro renews at \$7\/month until you cancel\./)
  assert.doesNotMatch(JSON.stringify(pastDue), /\$12/)
  const exception = panel('live', { standing: 'exception', exceptionExpiresAt: '2099-01-01T00:00:00Z' }, sub('past_due', PRICE7))
  assert.equal(exception.primary, 'Start Pro — $7/month')
  assert.doesNotMatch(JSON.stringify(exception), /\$12/)
})

test('panel: $12 subscriber and new subscriptions use the current $12', () => {
  const trial = panel('upgrade', { standing: 'trial' }, sub('trialing'))
  assert.equal(trial.primary, 'Start Pro — $12/month')
  assert.equal(trial.disclosure, DISCLOSURE_START)
  assert.match(DISCLOSURE_START, /ends the rest of your free trial and charges \$12 today, then \$12\/month until you cancel/)
  const ended = panel('trial_ended', { standing: 'trial_ended' }, undefined)
  assert.equal(ended.primary, 'Start Pro — $12/month')
  assert.equal(ended.disclosure, DISCLOSURE_RESTART)
  assert.match(DISCLOSURE_RESTART, /^Starting Pro begins a new membership: \$12 today, then \$12\/month until you cancel/)
  const none = panel('upgrade', { standing: 'trial' }, null)
  assert.match(none.disclosure, /new membership: \$12 today/)
})

test('panel: a canceled $7 member restarting is told the new $12 rate', () => {
  const v = panel('canceled', { standing: 'canceled' }, sub('canceled', PRICE7))
  assert.equal(v.primary, 'Restart Pro — $12/month')
  assert.match(v.disclosure, /^Pro is now \$12\/month; your previous membership was \$7\/month\. Restarting Pro begins a new membership at the current price: \$12 today, then \$12\/month until you cancel\./)
  const same = panel('canceled', { standing: 'canceled' }, sub('canceled'))
  assert.match(same.disclosure, /^Restarting Pro begins a new membership at the current price: \$12 today/)
  assert.doesNotMatch(same.disclosure, /previous/)
})

test('panel: missing price or unknown subscription words the charge without an amount', () => {
  for (const subscription of [undefined, sub('trialing', null), sub('trialing', { ...PRICE, unitAmount: null })]) {
    const v = panel('upgrade', { standing: 'trial' }, subscription, { keptTrial: true })
    assert.equal(v.primary, 'Start Pro')
    assert.match(v.disclosure, /^Starting Pro ends the rest of your free trial and charges your Pro membership today at your plan’s price, then it renews until you cancel\./)
    assert.doesNotMatch(JSON.stringify(v), /\$\d/)
  }
  const pastDue = panel('past_due', { standing: 'past_due' }, undefined)
  assert.match(pastDue.disclosure, /^Paying settles the amount that’s due now\. After that, Pro renews at your plan’s price until you cancel\./)
  assert.doesNotMatch(JSON.stringify(pastDue), /\$\d/)
  assert.ok(pastDue.foot, 'past-due foot kept alongside')
  assert.match(pastDue.body, /Your last Pro payment didn’t go through/)
})

test('panel: exception and approval sentences; price is read only where a charge can show', () => {
  const exception = panel('live', { standing: 'exception', exceptionExpiresAt: '2099-01-01T00:00:00Z' }, sub('active'))
  assert.equal(exception.disclosure, DISCLOSURE_CONTINUE)
  assert.doesNotMatch(DISCLOSURE_CONTINUE, /go live after/, 'payments are already live there')
  assert.equal(DISCLOSURE_UPDATE, 'Paying settles the amount that’s due now. After that, Pro renews at $12/month until you cancel. Cancel anytime from Account → Manage Billing Info.')
  for (const d of [DISCLOSURE_START, DISCLOSURE_RESTART]) assert.match(d, /paying for Pro does not activate them on its own/)
  assert.equal(chargeCanShow({ state: 'payout_setup' }), false)
  assert.equal(chargeCanShow({ state: 'live', billing: { standing: 'paid' } }), false)
  for (const state of ['upgrade', 'trial_ended', 'canceled', 'past_due']) assert.equal(chargeCanShow({ state }), true)
  assert.equal(chargeCanShow({ state: 'live', billing: { standing: 'exception' } }), true)
})

test('editor and Create Artist read the real subscription before showing a charging view', () => {
  const comp = read('composables/usePaymentActivation.js')
  assert.match(comp, /api\('\/stripe\/billing'\)/)
  assert.match(comp, /if \(sub === null\) return null/)
  const edit = read('pages/editband/[id].vue')
  assert.match(edit, /subscription: billingSubscription\.value/)
  assert.ok(edit.indexOf('billingSubscription.value = await fetchBillingSubscription()') < edit.indexOf('if (answer) eligibility.value = answer'), 'price read before the panel shows')
  const create = read('pages/createband.vue')
  assert.match(create, /subscription: billingSubscription\.value/)
  assert.match(create, /chargeCanShow\(answer\)/)
})

test('login: Google can create an account, so new-account terms sit with the Google button', () => {
  assert.match(GOOGLE_NEW_ACCOUNT_TERMS, /^First time here\? Continuing with Google creates your account\. /)
  assert.ok(GOOGLE_NEW_ACCOUNT_TERMS.endsWith(SIGNUP_TERMS))
  const page = read('pages/login.vue')
  const tpl = page.slice(0, page.lastIndexOf('</template>'))
  assert.match(tpl, /<AuthSocialButton[^>]*aria-describedby="login-google-terms"/)
  const btn = tpl.indexOf('<AuthSocialButton')
  const terms = tpl.indexOf('data-testid="login-google-terms"')
  assert.ok(terms > btn && terms - btn < 400, 'directly with the Google button')
  assert.doesNotMatch(tpl, /v-if="[^"]*"[^>]*login-google-terms/, 'never conditionally hidden')
  assert.match(page, /import \{ GOOGLE_NEW_ACCOUNT_TERMS \} from "~\/utils\/billing\/billingTerms"/)
  // Google mechanics unchanged: same helper, same handler.
  assert.match(page, /await loginWithGoogle\(\{ postLoginPath: resolvePostLoginPath\(\) \}\)/)
})

test('panel: Lifetime Pro and plain live views carry no charge or disclosure', () => {
  for (const state of ['payout_setup', 'live', 'security_review']) {
    const v = activationView({ state, enforced: true, billing: { standing: 'lifetime' } })
    assert.equal(v.disclosure ?? null, null)
    assert.ok(!/\$12/.test(JSON.stringify(v)))
  }
  assert.equal(activationView({ state: 'live', enforced: true, billing: { standing: 'paid' } }).disclosure ?? null, null)
})

test('panel template renders the disclosure in every layout and no longer hides the foot', () => {
  const panel = read('components/payments/PaymentsActivationPanel.vue')
  const tpl = panel.slice(0, panel.indexOf('</template>'))
  assert.equal((tpl.match(/data-testid="payments-activation-disclosure"/g) || []).length, 3, 'collapsed, live and full panel')
  assert.doesNotMatch(tpl, /v-else-if="view\.foot"/)
})

test('banners and account page are wired to the shared terms and the real price', () => {
  const trial = read('components/TrialBanner.vue')
  assert.match(trial, /trialBannerText\(priceLabel\)/)
  assert.doesNotMatch(trial.slice(0, trial.indexOf('</template>')), /\$\d/, 'no hardcoded amount')
  const pastDue = read('components/PastDueBanner.vue')
  assert.match(pastDue, /pastDueChargeNote\(props\.priceLabel\)/)
  assert.match(pastDue, /data-testid="past-due-charge-note"/)
  const dash = read('pages/dashboard/index.vue')
  assert.match(dash, /priceLabelFrom\(billingInfo\.value\?\.subscription\?\.price\)/)
  assert.equal((dash.match(/:price-label="billingPriceLabel"/g) || []).length, 2, 'both banners get the real price')
  const account = read('pages/account.vue')
  assert.match(account, /data-testid="account-billing-terms"/)
  assert.ok(account.indexOf('data-testid="account-billing-terms"') < account.indexOf('@click="goToBillingPortal()"'), 'terms before the billing button')
  assert.match(account, /priceLabelFrom\(billingData\.value\?\.subscription\?\.price\)/)
  assert.match(account, /billingExempt: isAmbassador\.value/)
})

console.log(`\n=== billing disclosures: ${passed} passed ===`)
