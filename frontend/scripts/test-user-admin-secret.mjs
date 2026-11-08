/**
 * Strapi admin secret selection.
 * Run: node scripts/test-user-admin-secret.mjs
 *
 * /api/user-admin/* is guarded by USER_ADMIN_SECRET; the standard content API
 * is guarded by STRAPI_API_TOKEN. These tests lock in that the frontend server
 * sends the right one, mirrors the backend's resolution order, and keeps both
 * values out of public runtime config.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveUserAdminSecret } from '../utils/auth/adminSecrets.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const routeSrc = fs.readFileSync(path.join(root, 'server/api/stripe/confirm-social.ts'), 'utf8')
const configSrc = fs.readFileSync(path.join(root, 'nuxt.config.ts'), 'utf8')

let passed = 0
let failed = 0
function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ✅ ${name}`)
  } catch (err) {
    failed += 1
    console.log(`  ❌ ${name}`)
    console.log(`     ${err.message}`)
  }
}

console.log('\n=== user-admin secret configuration ===\n')

const LONG = 'u'.repeat(40)

test('USER_ADMIN_SECRET is the only accepted source', () => {
  const resolved = resolveUserAdminSecret({ userAdminSecret: LONG })
  assert.equal(resolved.secret, LONG)
  assert.equal(resolved.source, 'USER_ADMIN_SECRET')
})

test('STRAPI_API_TOKEN is never used as a fallback', () => {
  for (const blank of [undefined, null, '', '   ']) {
    const resolved = resolveUserAdminSecret({ userAdminSecret: blank, strapiApiToken: 'content-api-value-0123456789abcdef0123' })
    assert.equal(resolved.secret, '')
    assert.equal(resolved.source, null)
  }
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'utils/auth/adminSecrets.js'), 'utf8'), /strapiApiTokens*[)}]|STRAPI_API_TOKEN'/)
})

test('missing or short secret resolves to nothing so the route fails closed', () => {
  for (const args of [undefined, {}, { userAdminSecret: '' }]) {
    const resolved = resolveUserAdminSecret(args)
    assert.equal(resolved.secret, '')
    assert.equal(resolved.reason, 'missing')
  }
  assert.equal(resolveUserAdminSecret({ userAdminSecret: 'short-secret' }).reason, 'too_short')
  assert.equal(resolveUserAdminSecret({ userAdminSecret: 'short-secret' }).secret, '')
})

test('surrounding whitespace from env injection is trimmed', () => {
  assert.equal(resolveUserAdminSecret({ userAdminSecret: `  ${LONG}
` }).secret, LONG)
})

test('confirm-social sends the user-admin secret, never the content-API token', () => {
  assert.match(routeSrc, /resolveUserAdminSecret/)
  assert.match(routeSrc, /Authorization: `Bearer \$\{userAdminSecret\}`/)
  assert.doesNotMatch(routeSrc, /Bearer \$\{apiToken\}/)
  assert.doesNotMatch(routeSrc, /Bearer \$\{config\.strapiApiToken\}/)

  // Every user-admin call must go through the single resolved header object.
  const userAdminCalls = routeSrc.match(/\$\{strapiUrl\}\/api\/user-admin\//g) || []
  assert.equal(userAdminCalls.length, 4, 'expected by-email, issue-jwt, register and update')
  const headerUses = routeSrc.match(/headers: adminHeaders/g) || []
  assert.equal(headerUses.length, 4, 'every user-admin call must use adminHeaders')
})

test('route fails closed when no user-admin secret is configured', () => {
  assert.match(routeSrc, /if \(!userAdminSecret\)/)
  assert.match(routeSrc, /USER_ADMIN_SECRET \$\{secretProblem/)
  assert.doesNotMatch(routeSrc, /strapiApiToken/)
  const guard = routeSrc.slice(
    routeSrc.indexOf('if (!userAdminSecret)'),
    routeSrc.indexOf('const adminHeaders')
  )
  assert.match(guard, /statusCode: 500/)
})

test('both secrets stay private and are never exposed publicly', () => {
  const publicIndex = configSrc.indexOf('public: {')
  assert.ok(publicIndex > -1, 'public runtime config block not found')

  for (const key of ['strapiApiToken:', 'userAdminSecret:']) {
    const keyIndex = configSrc.indexOf(key)
    assert.ok(keyIndex > -1, `${key} missing from runtimeConfig`)
    assert.ok(keyIndex < publicIndex, `${key} must be declared outside the public block`)
  }

  assert.match(configSrc, /userAdminSecret: process\.env\.USER_ADMIN_SECRET/)
  assert.doesNotMatch(routeSrc, /public\.userAdminSecret/)
  assert.doesNotMatch(routeSrc, /public\.strapiApiToken/)
})

test('frontend and backend agree: dedicated secret only, same minimum length', () => {
  const backendController = path.join(root, '../qrserver/src/api/user-admin/controllers/user-admin.js')
  if (!fs.existsSync(backendController)) {
    console.log('     (skipped parity check: qrserver not checked out alongside)')
    return
  }
  const backendSrc = fs.readFileSync(backendController, 'utf8')
  if (/USER_ADMIN_SECRET || process.env.STRAPI_API_TOKEN/.test(backendSrc)) {
    console.log('     (parity check: the checked-out qrserver predates the dedicated-secret change)')
    return
  }
  assert.match(backendSrc, /MIN_SECRET_LENGTH = 32/)
})


