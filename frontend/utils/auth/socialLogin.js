/**
 * Social (Google) login flow for artists.
 *
 * Identity comes only from a verified Firebase ID token. The request body is
 * never trusted for email, name or uid, and this flow never reads, writes or
 * derives any Strapi password for an existing user.
 *
 * All I/O is injected so the flow can be exercised directly by focused tests.
 */

import {
  classifySocialUser,
  defaultBlockedSubscriptionStatus,
  shouldAttemptStripeProvision,
  shouldFailClosedWithoutJwt,
} from '../billing/socialSignupPolicy.js'
import { mapStripeStatusForUserRow } from '../billing/stripeSubscriptionSelect.js'
import { parseBearerToken } from './firebaseIdToken.js'

const PUBLIC_USER_FIELDS = [
  'id',
  'username',
  'email',
  'customerId',
  'subscriptionId',
  'subscriptionStatus',
  'plan',
  'trialEndsAt',
  'confirmed',
]

const noopLog = { info() {}, warn() {}, error() {} }

/** Never let password/reset/confirmation fields reach the client. */
export function publicUser(user) {
  const out = {}
  for (const field of PUBLIC_USER_FIELDS) {
    if (user?.[field] !== undefined) out[field] = user[field]
  }
  return out
}

export function billingFromCustomer(customer) {
  return {
    customerId: customer.id,
    subscriptionId: customer.subscriptionId,
    subscriptionStatus: customer.subscriptionStatus || mapStripeStatusForUserRow(customer.status),
    trialEndsAt: customer.trialEndsAt,
  }
}

function rejected(statusCode, error, extra = {}) {
  return { ok: false, statusCode, error, ...extra }
}

function identityRejected(reason) {
  return rejected(401, 'invalid_firebase_token', { reason })
}

async function persistBlockedStatus(deps, user, log) {
  if (user?.subscriptionStatus === defaultBlockedSubscriptionStatus()) return
  try {
    await deps.updateUser(user.id, { subscriptionStatus: defaultBlockedSubscriptionStatus() })
  } catch {
    log.error('[confirm-social] Failed to persist unpaid status')
  }
}

async function attachMarketerAttribution(deps, registerBody, refCode, log) {
  const normalizedCode = refCode.trim().toLowerCase()
  if (!normalizedCode) return

  try {
    const marketerId = await deps.findMarketerByCode(normalizedCode)
    if (marketerId) {
      registerBody.referredByMarketer = marketerId
      registerBody.marketerCodeUsed = normalizedCode
      registerBody.referredAt = new Date().toISOString()
    }
  } catch {
    log.warn('[confirm-social] Marketer lookup failed, continuing')
  }
}

async function existingUserFlow({ deps, log, user, email }) {
  const classification = classifySocialUser(user)

  // The JWT is minted by the backend against the verified email. No password
  // is read, set or reset here — that was the account-takeover path.
  let jwt
  try {
    jwt = await deps.issueJwt({ email, userId: user.id })
  } catch {
    log.error('[confirm-social] JWT issue failed for existing user')
    return rejected(502, 'jwt_issue_failed')
  }
  if (!jwt) return rejected(502, 'jwt_issue_failed')

  if (classification === 'existing_ambassador') {
    log.info('[confirm-social] Billing-exempt lifetime Pro, skipping Stripe repair')
    return { ok: true, jwt, billingReady: true, billingExempt: true, user: publicUser(user) }
  }

  if (!shouldAttemptStripeProvision(classification)) {
    log.info('[confirm-social] Existing user already has Stripe customer')
    return { ok: true, jwt, billingReady: true, user: publicUser(user) }
  }

  log.info('[confirm-social] Existing incomplete user has no Stripe customer, creating one')
  try {
    const customer = await deps.createStripeCustomerAndTrial({
      id: user.id,
      email,
      username: user.username || email,
    })
    const billing = billingFromCustomer(customer)
    await deps.updateUser(user.id, billing)
    return { ok: true, jwt, billingReady: true, user: publicUser({ ...user, ...billing }) }
  } catch {
    log.error('[confirm-social] Stripe error for existing user')
    await persistBlockedStatus(deps, user, log)
    return {
      ok: true,
      jwt,
      billingReady: false,
      user: publicUser({
        ...user,
        customerId: user.customerId || null,
        subscriptionStatus: defaultBlockedSubscriptionStatus(),
      }),
    }
  }
}

async function newUserFlow({ deps, log, email, displayName, refCode }) {
  log.info('[confirm-social] Registering new user')

  const registerBody = {
    username: email,
    email,
    // Server-generated, never returned to the client and never derived from uid.
    password: deps.generatePassword(),
    confirmed: true,
    provider: 'local',
  }
  if (refCode) await attachMarketerAttribution(deps, registerBody, refCode, log)

  let user
  try {
    user = await deps.registerUser(registerBody)
  } catch {
    log.error('[confirm-social] Registration failed')
    return rejected(502, 'registration_failed')
  }
  if (!user?.id) return rejected(502, 'registration_failed')

  log.info('[confirm-social] Creating Stripe customer for new user')
  let billingPersisted = false
  try {
    const customer = await deps.createStripeCustomerAndTrial({
      id: user.id,
      email,
      // Stripe customer display name: verified token name, never a body value.
      username: displayName || email,
    })
    const billing = billingFromCustomer(customer)
    await deps.updateUser(user.id, billing)
    billingPersisted = true

    const jwt = await deps.issueJwt({ email, userId: user.id })
    if (!jwt) throw new Error('jwt_issue_failed')

    return {
      ok: true,
      jwt,
      billingReady: true,
      accountCreated: true,
      trialStarted: true,
      user: publicUser({ ...user, ...billing }),
    }
  } catch {
    log.error('[confirm-social] Stripe setup failed for new user')
    if (!billingPersisted) await persistBlockedStatus(deps, user, log)
    if (!shouldFailClosedWithoutJwt('new')) {
      log.error('[confirm-social] fail-closed policy disabled for new signup; refusing anyway')
    }
    return rejected(503, 'billing_setup_failed', { retryable: true })
  }
}

export async function runSocialLogin({ authorizationHeader, body = {}, deps }) {
  const log = deps.log || noopLog

  const token = parseBearerToken(authorizationHeader)
  if (!token) return identityRejected('missing_token')

  let verification
  try {
    verification = await deps.verifyIdToken(token)
  } catch {
    return identityRejected('verifier_unavailable')
  }
  if (!verification?.ok) return identityRejected(verification?.reason || 'invalid_token')

  const identity = verification.identity
  if (identity?.emailVerified !== true) return identityRejected('email_not_verified')

  const email = String(identity.email || '').trim().toLowerCase()
  if (!email) return identityRejected('missing_email')
  if (!String(identity.uid || '').trim()) return identityRejected('missing_subject')

  // Only non-identity attribution is taken from the body.
  const refCode = typeof body?.refCode === 'string' ? body.refCode : ''

  let existing
  try {
    existing = await deps.findUserByEmail(email)
  } catch {
    log.error('[confirm-social] User lookup failed')
    return rejected(502, 'user_lookup_failed')
  }

  const user = Array.isArray(existing) ? existing[0] : existing
  if (user?.id) return existingUserFlow({ deps, log, user, email })

  return newUserFlow({ deps, log, email, displayName: identity.displayName, refCode })
}
