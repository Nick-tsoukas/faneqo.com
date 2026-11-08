/**
 * Google / social signup fail-closed + existing-user login.
 * Run: node scripts/test-confirm-social-fail-closed.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  classifySocialUser,
  shouldAttemptStripeProvision,
  shouldFailClosedWithoutJwt,
  shouldReturnJwtOnStripeFailure,
  defaultBlockedSubscriptionStatus,
} from '../utils/billing/socialSignupPolicy.js'
import { mapStripeStatusForUserRow } from '../utils/billing/stripeSubscriptionSelect.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const confirmSrc = fs.readFileSync(path.join(root, 'server/api/stripe/confirm-social.ts'), 'utf8')
// The flow moved into a dependency-injected module during the P0 social login
// security repair; the route is now a thin verified adapter over it.
const flowSrc = fs.readFileSync(path.join(root, 'utils/auth/socialLogin.js'), 'utf8')
const trialSrc = fs.readFileSync(path.join(root, 'server/utils/stripe-trial.ts'), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

console.log('\n=== Google / social fail-closed ===\n')

test('NEW Google + Stripe success persists billing then returns JWT', () => {
  assert.match(flowSrc, /billingFromCustomer/)
  assert.match(flowSrc, /Creating Stripe customer for new user/)
  const newBranch = flowSrc.slice(flowSrc.indexOf('Registering new user'))
  assert.match(newBranch, /deps\.updateUser\(user\.id, billing\)/)
  assert.match(newBranch, /deps\.issueJwt/)
  assert.match(newBranch, /billingReady: true/)
  assert.match(newBranch, /createStripeCustomerAndTrial/)
  // Billing must be persisted before the JWT is requested.
  assert.ok(newBranch.indexOf('billingPersisted = true') < newBranch.indexOf('deps.issueJwt'))
})

test('NEW Google + Stripe failure returns no JWT and no trialing escape', () => {
  assert.equal(shouldFailClosedWithoutJwt('new'), true)
  assert.equal(shouldReturnJwtOnStripeFailure('new'), false)
  const fail = flowSrc.slice(flowSrc.indexOf('Stripe setup failed for new user'))
  assert.match(fail, /503/)
  assert.match(fail, /billing_setup_failed/)
  assert.doesNotMatch(fail, /jwt/)
  assert.match(fail, /persistBlockedStatus/)
  assert.doesNotMatch(fail, /subscriptionStatus: 'trialing'/)
  // The route turns any non-ok result into an error response, never a JWT.
  assert.match(confirmSrc, /if \(!result\.ok\)/)
  assert.match(confirmSrc, /createError/)
  assert.match(confirmSrc, /statusCode: result\.statusCode/)
})

test('partial new user remains blocked/unpaid if retained', () => {
  assert.equal(defaultBlockedSubscriptionStatus(), 'unpaid')
  assert.match(flowSrc, /persistBlockedStatus/)
  assert.match(flowSrc, /defaultBlockedSubscriptionStatus/)
})

test('retry can repair incomplete signup without treating it as billed', () => {
  assert.equal(classifySocialUser({ id: 3 }), 'existing_incomplete')
  assert.equal(shouldAttemptStripeProvision('existing_incomplete'), true)
  assert.match(flowSrc, /Existing incomplete user has no Stripe customer/)
  assert.match(trialSrc, /pickBestReusableSubscription/)
})

test('ambassador Google login does not attempt Stripe repair', () => {
  assert.equal(classifySocialUser({ id: 4, plan: 'free', subscriptionStatus: 'unpaid' }), 'existing_ambassador')
  assert.equal(shouldAttemptStripeProvision('existing_ambassador'), false)
  assert.match(flowSrc, /existing_ambassador/)
  assert.match(flowSrc, /skipping Stripe repair/)
  const skip = flowSrc.slice(
    flowSrc.indexOf("classification === 'existing_ambassador'"),
    flowSrc.indexOf('Existing incomplete user has no Stripe customer')
  )
  assert.doesNotMatch(skip, /createStripeCustomerAndTrial/)
})

test('existing legitimate user with customerId still logs in', () => {
  assert.equal(classifySocialUser({ id: 1, customerId: 'cus_1' }), 'existing_billed')
  assert.equal(shouldAttemptStripeProvision('existing_billed'), false)
  assert.equal(shouldReturnJwtOnStripeFailure('existing_billed'), true)
  assert.match(flowSrc, /Existing user already has Stripe customer/)
  assert.match(flowSrc, /billingReady: true/)
})

test('existing user with temporary Stripe error keeps identity login, never fabricates Pro', () => {
  assert.equal(shouldReturnJwtOnStripeFailure('existing_incomplete'), true)
  assert.equal(mapStripeStatusForUserRow('nope'), 'unpaid')
  const repairFail = flowSrc.slice(flowSrc.indexOf('Stripe error for existing user'))
  assert.match(repairFail, /billingReady: false/)
  assert.match(repairFail, /subscriptionStatus: defaultBlockedSubscriptionStatus\(\)/)
  assert.doesNotMatch(repairFail, /subscriptionStatus: 'trialing'/)
})

test('user with no Stripe truth cannot inherit trialing from schema default', () => {
  assert.equal(mapStripeStatusForUserRow(undefined), 'unpaid')
  assert.equal(mapStripeStatusForUserRow(''), 'unpaid')
  assert.doesNotMatch(flowSrc, /subscriptionStatus: 'trialing'/)
  assert.doesNotMatch(confirmSrc, /subscriptionStatus: 'trialing'/)
})

test('social login is gated on a verified Firebase identity', () => {
  assert.match(confirmSrc, /verifyFirebaseIdToken/)
  assert.match(flowSrc, /parseBearerToken/)
  assert.doesNotMatch(flowSrc, /auth\/local/)
  assert.doesNotMatch(confirmSrc, /auth\/local/)
})

test('retries reuse existing customer/subscription instead of always creating', () => {
  assert.match(trialSrc, /pickBestReusableSubscription/)
  assert.match(trialSrc, /status: 'all'/)
  assert.match(trialSrc, /limit: 20/)
})

console.log(`\n=== google social fail-closed: ${passed} passed ===`)
