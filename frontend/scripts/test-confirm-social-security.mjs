/**
 * Google / social login security contract.
 * Run: node scripts/test-confirm-social-security.mjs
 *
 * Covers the account-takeover repair: identity comes only from a verified
 * Firebase ID token, and social login never touches an existing password.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runSocialLogin } from '../utils/auth/socialLogin.js'
import {
  decodeJwtSegments,
  parseBearerToken,
  validateFirebaseIdTokenClaims,
} from '../utils/auth/firebaseIdToken.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const routeSrc = fs.readFileSync(path.join(root, 'server/api/stripe/confirm-social.ts'), 'utf8')
const flowSrc = fs.readFileSync(path.join(root, 'utils/auth/socialLogin.js'), 'utf8')
const clientSrc = fs.readFileSync(path.join(root, 'composables/useFirebase.ts'), 'utf8')

const PROJECT_ID = 'musicbizqr-f3261'
const VICTIM = 'victim@example.com'
const ATTACKER_UID = 'attacker-uid'

let passed = 0
let failed = 0
async function test(name, fn) {
  try {
    await fn()
    passed += 1
    console.log(`  ✅ ${name}`)
  } catch (err) {
    failed += 1
    console.log(`  ❌ ${name}`)
    console.log(`     ${err.message}`)
  }
}

/** Records every side effect so tests can assert on what did NOT happen. */
function makeDeps({
  verified = null,
  verifyReason = 'invalid_signature',
  existingUser = null,
  stripeFails = false,
  registerFails = false,
} = {}) {
  const calls = {
    verifyIdToken: [],
    findUserByEmail: [],
    issueJwt: [],
    registerUser: [],
    updateUser: [],
    stripe: [],
    marketer: [],
  }

  return {
    calls,
    log: { info() {}, warn() {}, error() {} },
    generatePassword: () => 'ServerGeneratedRandomPassword-0123456789abcdef!',

    verifyIdToken: async (token) => {
      calls.verifyIdToken.push(token)
      return verified ? { ok: true, identity: verified } : { ok: false, reason: verifyReason }
    },
    findUserByEmail: async (email) => {
      calls.findUserByEmail.push(email)
      return existingUser ? [existingUser] : []
    },
    issueJwt: async (args) => {
      calls.issueJwt.push(args)
      return 'strapi.jwt.value'
    },
    registerUser: async (body) => {
      calls.registerUser.push(body)
      if (registerFails) throw new Error('register failed')
      return { id: 501, email: body.email, username: body.username, confirmed: true }
    },
    updateUser: async (userId, data) => {
      calls.updateUser.push({ userId, data })
      return { ok: true }
    },
    createStripeCustomerAndTrial: async (user) => {
      calls.stripe.push(user)
      if (stripeFails) throw new Error('stripe down')
      return {
        id: 'cus_new',
        subscriptionId: 'sub_new',
        status: 'trialing',
        subscriptionStatus: 'trialing',
        trialEndsAt: '2026-10-12T00:00:00.000Z',
      }
    },
    findMarketerByCode: async (code) => {
      calls.marketer.push(code)
      return null
    },
  }
}

function verifiedIdentity(overrides = {}) {
  return {
    uid: 'firebase-uid-abc',
    email: 'real@artist.com',
    displayName: 'Real Artist',
    emailVerified: true,
    signInProvider: 'google.com',
    ...overrides,
  }
}

function allWrites(calls) {
  return [
    ...calls.registerUser,
    ...calls.updateUser.map((c) => c.data),
  ]
}

/**
 * Strip comments, then string literals, so source assertions inspect real code
 * instead of prose. Template literals are kept so `${interpolations}` show up.
 */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
}

function segment(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

function fakeToken(header, payload) {
  return `${segment(header)}.${segment(payload)}.c2lnbmF0dXJl`
}

const nowSeconds = Math.floor(Date.now() / 1000)
function goodClaims(overrides = {}) {
  return {
    aud: PROJECT_ID,
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    sub: 'firebase-uid-abc',
    email: 'real@artist.com',
    email_verified: true,
    iat: nowSeconds - 60,
    exp: nowSeconds + 3600,
    ...overrides,
  }
}

console.log('\n=== confirm-social security contract ===\n')

// 1. Forged identity without a valid Firebase token
await test('forged body email/uid with no Authorization header is rejected with no side effects', async () => {
  const deps = makeDeps({ existingUser: { id: 9, email: VICTIM, customerId: 'cus_victim' } })
  const res = await runSocialLogin({
    authorizationHeader: '',
    body: { email: VICTIM, name: 'Attacker', uid: ATTACKER_UID },
    deps,
  })

  assert.equal(res.ok, false)
  assert.equal(res.statusCode, 401)
  assert.equal(res.error, 'invalid_firebase_token')
  assert.equal(res.reason, 'missing_token')
  assert.equal(res.jwt, undefined)
  assert.deepEqual(deps.calls.findUserByEmail, [])
  assert.deepEqual(deps.calls.issueJwt, [])
  assert.deepEqual(deps.calls.updateUser, [])
  assert.deepEqual(deps.calls.registerUser, [])
})

await test('forged body identity with an unverifiable token is rejected with no side effects', async () => {
  const deps = makeDeps({
    verified: null,
    verifyReason: 'invalid_signature',
    existingUser: { id: 9, email: VICTIM, customerId: 'cus_victim' },
  })
  const res = await runSocialLogin({
    authorizationHeader: `Bearer ${fakeToken({ alg: 'RS256', kid: 'k1' }, goodClaims({ email: VICTIM }))}`,
    body: { email: VICTIM, uid: ATTACKER_UID },
    deps,
  })

  assert.equal(res.statusCode, 401)
  assert.equal(res.reason, 'invalid_signature')
  assert.deepEqual(deps.calls.issueJwt, [])
  assert.deepEqual(deps.calls.findUserByEmail, [])
})

await test('self-signed / alg-swapped / wrong-project tokens never validate', () => {
  const cases = [
    ['unsupported_algorithm', { alg: 'none', kid: 'k1' }, goodClaims()],
    ['unsupported_algorithm', { alg: 'HS256', kid: 'k1' }, goodClaims()],
    ['missing_key_id', { alg: 'RS256' }, goodClaims()],
    ['wrong_audience', { alg: 'RS256', kid: 'k1' }, goodClaims({ aud: 'attacker-project' })],
    [
      'wrong_issuer',
      { alg: 'RS256', kid: 'k1' },
      goodClaims({ iss: 'https://securetoken.google.com/attacker-project' }),
    ],
    ['expired_token', { alg: 'RS256', kid: 'k1' }, goodClaims({ exp: nowSeconds - 3600 })],
    ['future_token', { alg: 'RS256', kid: 'k1' }, goodClaims({ iat: nowSeconds + 3600 })],
    ['missing_subject', { alg: 'RS256', kid: 'k1' }, goodClaims({ sub: '' })],
    ['missing_email', { alg: 'RS256', kid: 'k1' }, goodClaims({ email: 'not-an-email' })],
  ]

  for (const [expected, header, payload] of cases) {
    const decoded = decodeJwtSegments(fakeToken(header, payload))
    const result = validateFirebaseIdTokenClaims({
      header: decoded.header,
      payload: decoded.payload,
      projectId: PROJECT_ID,
      nowSeconds,
    })
    assert.equal(result.ok, false, `${expected} should not validate`)
    assert.equal(result.reason, expected)
  }

  assert.equal(decodeJwtSegments('header.payload'), null)
  assert.equal(decodeJwtSegments('not-a-token'), null)
  assert.equal(parseBearerToken('Bearer '), null)
  assert.equal(parseBearerToken('token-without-scheme'), null)
})

// 2. Body email cannot override the verified token email
await test('verified token email wins; body email is never used for lookup or JWT', async () => {
  const existingUser = { id: 77, email: 'real@artist.com', customerId: 'cus_real' }
  const deps = makeDeps({ verified: verifiedIdentity(), existingUser })

  const res = await runSocialLogin({
    authorizationHeader: 'Bearer valid-token',
    body: { email: VICTIM, name: 'Attacker', uid: ATTACKER_UID, refCode: 'promo1' },
    deps,
  })

  assert.equal(res.ok, true)
  assert.deepEqual(deps.calls.findUserByEmail, ['real@artist.com'])
  assert.deepEqual(deps.calls.issueJwt, [{ email: 'real@artist.com', userId: 77 }])

  const everything = JSON.stringify({ calls: deps.calls, res })
  assert.ok(!everything.includes(VICTIM), 'body email must never reach any dependency')
  assert.ok(!everything.includes(ATTACKER_UID), 'body uid must never reach any dependency')
})

await test('token email is normalised to lower case before lookup', async () => {
  const deps = makeDeps({
    verified: verifiedIdentity({ email: 'Mixed.Case@Artist.COM' }),
    existingUser: { id: 5, email: 'mixed.case@artist.com', customerId: 'cus_5' },
  })
  await runSocialLogin({ authorizationHeader: 'Bearer valid-token', body: {}, deps })
  assert.deepEqual(deps.calls.findUserByEmail, ['mixed.case@artist.com'])
})

// 3. Existing user passwords are never written
await test('social login never writes a password for an existing user', async () => {
  for (const existingUser of [
    { id: 1, email: 'real@artist.com', customerId: 'cus_1' },
    { id: 2, email: 'real@artist.com', plan: 'free', subscriptionStatus: 'unpaid' },
    { id: 3, email: 'real@artist.com' },
  ]) {
    for (const stripeFails of [false, true]) {
      const deps = makeDeps({ verified: verifiedIdentity(), existingUser, stripeFails })
      const res = await runSocialLogin({
        authorizationHeader: 'Bearer valid-token',
        body: { password: 'attacker-chosen', email: VICTIM, uid: ATTACKER_UID },
        deps,
      })

      assert.deepEqual(deps.calls.registerUser, [], 'existing user must not be re-registered')
      for (const write of allWrites(deps.calls)) {
        assert.ok(!('password' in write), 'no write may contain a password')
        assert.ok(!('provider' in write), 'no write may change the provider')
        assert.ok(!('confirmed' in write), 'no write may change confirmation state')
      }
      assert.ok(!JSON.stringify(res).includes('password'), 'response must not expose a password')
    }
  }
})

await test('existing-user source path contains no password or auth/local usage', () => {
  const flowCode = codeOnly(flowSrc)
  const existingBranch = flowCode.slice(
    flowCode.indexOf('async function existingUserFlow'),
    flowCode.indexOf('async function newUserFlow')
  )
  assert.ok(existingBranch.length > 0)
  assert.doesNotMatch(existingBranch, /password/i)
  assert.doesNotMatch(flowSrc, /auth\/local/)
  assert.doesNotMatch(routeSrc, /auth\/local/)
  assert.doesNotMatch(routeSrc, /_firebase/)
})

// 4. Unverified Firebase email
await test('unverified Firebase email is rejected with no side effects', async () => {
  const deps = makeDeps({
    verified: verifiedIdentity({ emailVerified: false }),
    existingUser: { id: 9, email: 'real@artist.com', customerId: 'cus_9' },
  })
  const res = await runSocialLogin({ authorizationHeader: 'Bearer valid-token', body: {}, deps })

  assert.equal(res.ok, false)
  assert.equal(res.statusCode, 401)
  assert.equal(res.reason, 'email_not_verified')
  assert.deepEqual(deps.calls.findUserByEmail, [])
  assert.deepEqual(deps.calls.issueJwt, [])

  const claims = validateFirebaseIdTokenClaims({
    header: { alg: 'RS256', kid: 'k1' },
    payload: goodClaims({ email_verified: false }),
    projectId: PROJECT_ID,
    nowSeconds,
  })
  assert.equal(claims.ok, false)
  assert.equal(claims.reason, 'email_not_verified')
})

// 5. New signup fails closed when Stripe fails
await test('new social signup fails closed when Stripe fails: no JWT, status left unpaid', async () => {
  const deps = makeDeps({ verified: verifiedIdentity(), existingUser: null, stripeFails: true })
  const res = await runSocialLogin({
    authorizationHeader: 'Bearer valid-token',
    body: {},
    deps,
  })

  assert.equal(res.ok, false)
  assert.equal(res.statusCode, 503)
  assert.equal(res.error, 'billing_setup_failed')
  assert.equal(res.retryable, true)
  assert.equal(res.jwt, undefined)
  assert.deepEqual(deps.calls.issueJwt, [], 'no JWT may be issued when billing fails')
  assert.deepEqual(deps.calls.updateUser, [{ userId: 501, data: { subscriptionStatus: 'unpaid' } }])
})

await test('new signup password is server-generated, not uid-derived, and never returned', async () => {
  const identity = verifiedIdentity()
  const deps = makeDeps({ verified: identity, existingUser: null })
  const res = await runSocialLogin({ authorizationHeader: 'Bearer valid-token', body: {}, deps })

  assert.equal(res.ok, true)
  assert.equal(deps.calls.registerUser.length, 1)
  const { password } = deps.calls.registerUser[0]
  assert.ok(password && password.length >= 24, 'password must be long')
  assert.ok(!password.includes(identity.uid), 'password must not be derived from the uid')
  assert.ok(!JSON.stringify(res).includes(password), 'password must never be returned')
  assert.equal(res.user.password, undefined)

  assert.doesNotMatch(codeOnly(routeSrc), /uid/i, 'route code must never reference a uid')
  assert.match(routeSrc, /randomBytes/)
})

// 6. Ambassador never touches Stripe
await test('verified existing ambassador authenticates and never triggers Stripe', async () => {
  const deps = makeDeps({
    verified: verifiedIdentity(),
    existingUser: { id: 4, email: 'real@artist.com', plan: 'free', subscriptionStatus: 'unpaid' },
  })
  const res = await runSocialLogin({ authorizationHeader: 'Bearer valid-token', body: {}, deps })

  assert.equal(res.ok, true)
  assert.equal(res.jwt, 'strapi.jwt.value')
  assert.equal(res.billingReady, true)
  assert.equal(res.billingExempt, true)
  assert.deepEqual(deps.calls.stripe, [], 'ambassador must never hit Stripe')
  assert.deepEqual(deps.calls.updateUser, [])
})

// 7. Billed user survives temporary Stripe trouble
await test('verified existing billed user authenticates during Stripe trouble', async () => {
  const deps = makeDeps({
    verified: verifiedIdentity(),
    existingUser: { id: 1, email: 'real@artist.com', customerId: 'cus_1' },
    stripeFails: true,
  })
  const res = await runSocialLogin({ authorizationHeader: 'Bearer valid-token', body: {}, deps })

  assert.equal(res.ok, true)
  assert.equal(res.jwt, 'strapi.jwt.value')
  assert.equal(res.billingReady, true)
  assert.deepEqual(deps.calls.stripe, [], 'billed user needs no Stripe call to sign in')
})

// Login must stay open for unpaid identities: Faneqo offers a free basic
// account after trial expiry, so billing state must never gate authentication.
await test('unpaid, past-due, canceled and expired-trial users can still sign in', async () => {
  for (const subscriptionStatus of ['unpaid', 'past_due', 'canceled', 'incomplete_expired']) {
    const deps = makeDeps({
      verified: verifiedIdentity(),
      existingUser: { id: 8, email: 'real@artist.com', customerId: 'cus_8', subscriptionStatus },
    })
    const res = await runSocialLogin({ authorizationHeader: 'Bearer valid-token', body: {}, deps })

    assert.equal(res.ok, true, `${subscriptionStatus} must still authenticate`)
    assert.equal(res.jwt, 'strapi.jwt.value')
    assert.equal(res.statusCode, undefined)
    assert.deepEqual(deps.calls.stripe, [], 'sign-in must not require Stripe')
  }
})

await test('verified incomplete user keeps identity login but is never marked Pro', async () => {
  const deps = makeDeps({
    verified: verifiedIdentity(),
    existingUser: { id: 3, email: 'real@artist.com' },
    stripeFails: true,
  })
  const res = await runSocialLogin({ authorizationHeader: 'Bearer valid-token', body: {}, deps })

  assert.equal(res.ok, true)
  assert.equal(res.jwt, 'strapi.jwt.value')
  assert.equal(res.billingReady, false)
  assert.equal(res.user.subscriptionStatus, 'unpaid')
  assert.equal(deps.calls.stripe.length, 1)
})

// Identity verification must be unconditional and fail closed
await test('a verifier outage rejects sign-in instead of trusting the body', async () => {
  const deps = makeDeps({ existingUser: { id: 1, email: VICTIM, customerId: 'cus_1' } })
  deps.verifyIdToken = async () => {
    throw new Error('cert endpoint unreachable')
  }
  const res = await runSocialLogin({
    authorizationHeader: 'Bearer valid-token',
    body: { email: VICTIM },
    deps,
  })
  assert.equal(res.statusCode, 401)
  assert.equal(res.reason, 'verifier_unavailable')
  assert.deepEqual(deps.calls.issueJwt, [])
})

await test('route verifies the token before any user lookup and requires project id', () => {
  assert.match(routeSrc, /verifyFirebaseIdToken/)
  assert.match(routeSrc, /firebaseProjectId/)
  assert.match(routeSrc, /FIREBASE_PROJECT_ID not configured/)
  assert.ok(
    routeSrc.indexOf('verifyIdToken') < routeSrc.indexOf('by-email'),
    'verification must be wired before lookup'
  )
  assert.match(flowSrc, /parseBearerToken/)
  assert.ok(
    flowSrc.indexOf('verifyIdToken') < flowSrc.indexOf('findUserByEmail'),
    'flow must verify before lookup'
  )
})

// 9. No sensitive logging
await test('route and flow never log tokens, bodies, emails or credentials', () => {
  assert.doesNotMatch(routeSrc, /console\.log/)

  // Only the literal message text may mention anything; no sensitive value may
  // be passed as an argument or interpolated into a log call.
  for (const src of [routeSrc, flowSrc]) {
    const logCalls = codeOnly(src).match(/(?:console|log)\.(?:log|info|warn|error)\([^\n]*/g) || []
    for (const call of logCalls) {
      assert.doesNotMatch(call, /body|token|password|email|identity|uid|user\b/i, call)
    }
  }

  assert.doesNotMatch(routeSrc, /API Token present/)
  assert.doesNotMatch(routeSrc, /Stack:/)
})

await test('client sends only the ID token plus refCode, and logs no payload', () => {
  assert.match(clientSrc, /Authorization: `Bearer \$\{idToken\}`/)
  assert.match(clientSrc, /body: \{ refCode \}/)
  assert.doesNotMatch(clientSrc, /uid: user\.uid/)
  assert.doesNotMatch(clientSrc, /email: user\.email/)
  assert.doesNotMatch(clientSrc, /POST →/)
  assert.doesNotMatch(clientSrc, /RESP ←/)
})

console.log(
  `\n=== confirm-social security: ${passed} passed${failed ? `, ${failed} FAILED` : ''} ===\n`
)
if (failed) process.exit(1)
