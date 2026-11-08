/**
 * Emergency security repair — regression tests for server/api/admin.
 *
 * POST /api/admin/reset-user-password used to accept an anonymous
 * `{ email, newPassword }` body, look the user up with the Strapi API token,
 * and overwrite their password with `confirmed: true`. Anyone who knew an
 * address owned that account. It also logged the victim's email and returned a
 * distinct 404 for unknown addresses, so it doubled as an enumeration oracle.
 *
 * Nuxt routes are file-based, so the fix is the absence of the file: the route
 * is not registered at all. These tests prove it stays gone, that no other
 * server route writes a password, and that the real customer reset flow
 * (Strapi's emailed-token reset) was not disturbed.
 *
 * Run: node scripts/test-admin-route-security.mjs
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(repoRoot, rel))

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  PASS  ${name}`)
  } catch (err) {
    failed += 1
    console.error(`  FAIL  ${name}`)
    console.error(`        ${err.message}`)
  }
}

/**
 * Strip comments, then string literals. Comments first: a doc block explaining
 * "never write a password here" must not satisfy or break a code assertion.
 */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
}

/** Every server route file, so a reintroduction anywhere is caught. */
function serverRouteFiles() {
  const roots = ['server', 'pages', 'composables', 'utils', 'components']
  const skip = new Set(['node_modules', '.nuxt', '.output', 'dist', 'coverage', '.git'])
  const files = []

  const walk = (dir) => {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(vue|ts|js|mjs|cjs)$/.test(entry.name)) files.push(full)
    }
  }

  for (const r of roots) walk(path.join(repoRoot, r))
  return files
}

console.log('\n[1] The unauthenticated admin password-reset route is gone')

test('server/api/admin/reset-user-password.ts is not registered', () => {
  assert.equal(
    exists('server/api/admin/reset-user-password.ts'),
    false,
    'the route file must not exist — Nuxt registers routes by file path'
  )
  assert.equal(exists('server/api/admin/reset-user-password.js'), false)
  assert.equal(exists('server/api/admin/reset-user-password.post.ts'), false)
})

test('no route anywhere resurrects an admin password-reset path', () => {
  const offenders = serverRouteFiles().filter((f) => /reset-user-password/i.test(path.basename(f)))
  assert.deepEqual(offenders.map((f) => path.relative(repoRoot, f)), [])
})

// The one server route allowed to handle a password: social signup mints a
// random one for a brand new Strapi user. That it never writes an *existing*
// user's password is proven in detail by test-confirm-social-security.mjs.
const PASSWORD_HANDLING_ALLOWLIST = ['server/api/stripe/confirm-social.ts']

test('a public request cannot reset a password: only one route handles one', () => {
  const offenders = []
  for (const file of serverRouteFiles()) {
    if (!file.includes(path.join(repoRoot, 'server'))) continue
    const rel = path.relative(repoRoot, file).split(path.sep).join('/')
    if (PASSWORD_HANDLING_ALLOWLIST.includes(rel)) continue
    const code = codeOnly(fs.readFileSync(file, 'utf8'))
    if (/password/i.test(code) && /\$fetch|fetch\(/.test(code)) {
      offenders.push(rel)
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `unreviewed server route(s) combining a password with an outbound call: ${offenders.join(', ')}`
  )
})

test('the one password-handling route is still covered by its own guard test', () => {
  for (const rel of PASSWORD_HANDLING_ALLOWLIST) {
    assert.equal(exists(rel), true, `${rel} is allowlisted but missing`)
  }
  assert.equal(
    exists('scripts/test-confirm-social-security.mjs'),
    true,
    'the allowlist is only safe while its dedicated regression suite exists'
  )
})

test('a public request cannot confirm an account or alter a user record', () => {
  const offenders = []
  for (const file of serverRouteFiles()) {
    if (!file.includes(path.join(repoRoot, 'server', 'api', 'admin'))) continue
    const code = codeOnly(fs.readFileSync(file, 'utf8'))
    if (/confirmed/i.test(code)) offenders.push(path.relative(repoRoot, file))
    if (/\/api\/users/i.test(code)) offenders.push(path.relative(repoRoot, file))
  }
  assert.deepEqual(offenders, [], `admin route(s) touching user records: ${offenders.join(', ')}`)
})

test('a public request cannot enumerate whether an email exists', () => {
  const adminDir = path.join(repoRoot, 'server/api/admin')
  if (!fs.existsSync(adminDir)) return
  for (const file of fs.readdirSync(adminDir)) {
    if (!/\.(ts|js)$/.test(file)) continue
    const code = codeOnly(fs.readFileSync(path.join(adminDir, file), 'utf8'))
    assert.doesNotMatch(
      code,
      /filters\[email\]|email\]\[\$eq\]/i,
      `${file} looks up a user by email on an admin route`
    )
  }
})

test('no admin route returns or logs a secret', () => {
  const adminDir = path.join(repoRoot, 'server/api/admin')
  if (!fs.existsSync(adminDir)) return
  for (const file of fs.readdirSync(adminDir)) {
    if (!/\.(ts|js)$/.test(file)) continue
    const raw = fs.readFileSync(path.join(adminDir, file), 'utf8')
    const code = codeOnly(raw)
    const returned = code.slice(code.indexOf('return'))
    assert.doesNotMatch(
      returned,
      /strapiApiToken|userAdminSecret|apiToken\b/,
      `${file} may return a credential to the caller`
    )
    // Logging a token or an email address is how the old route leaked.
    const logged = [...raw.matchAll(/console\.\w+\(([^)]*)\)/g)].map((m) => m[1]).join(' ')
    assert.doesNotMatch(logged, /apiToken|Secret|user\.email/i, `${file} logs sensitive data`)
  }
})

console.log('\n[2] Nothing calls the retired route')

test('no source file requests /api/admin/reset-user-password', () => {
  const offenders = serverRouteFiles()
    .filter((f) => !f.endsWith('test-admin-route-security.mjs'))
    .filter((f) => fs.readFileSync(f, 'utf8').includes('/api/admin/reset-user-password'))
    .map((f) => path.relative(repoRoot, f))
  assert.deepEqual(offenders, [], `unexpected caller(s): ${offenders.join(', ')}`)
})

console.log('\n[3] The real customer reset flow still works')

test('forgot-password page still posts to Strapi forgot-password', () => {
  const src = read('pages/forgot-password.vue')
  assert.match(src, /\/api\/auth\/forgot-password/, 'must use the emailed-token flow')
  assert.doesNotMatch(src, /\/api\/admin\//, 'must not use any admin route')
})

test('reset-password page still posts to Strapi reset-password with a code', () => {
  const src = read('pages/reset-password.vue')
  assert.match(src, /\/api\/auth\/reset-password/)
  assert.match(src, /code/, 'the reset must be proven by the emailed code, not by an email address')
  assert.doesNotMatch(src, /\/api\/admin\//)
})

test('the login page still offers the forgot-password entry point', () => {
  const src = read('pages/login.vue')
  assert.match(src, /forgot-password/, 'customers must keep a way to recover an account')
})

test('the reset pages call Strapi directly, not a privileged server route', () => {
  for (const page of ['pages/forgot-password.vue', 'pages/reset-password.vue']) {
    const code = codeOnly(read(page))
    assert.doesNotMatch(code, /strapiApiToken|userAdminSecret/, `${page} must not hold a secret`)
  }
})

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
