/**
 * Corvana admin APIs fail closed in production (security fix, 2026-11-11).
 * Run: node scripts/test-corvana-auth.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp, defineEventHandler, getHeader, getRequestURL, setResponseStatus, toNodeListener } from 'h3'
import { corvanaAuthDecision, corvanaRefusalBody, isGuardedCorvanaPath, CORVANA_TOKEN_HEADER } from '../server/utils/corvanaAuthDecision.js'
import { escapeHtml, stateMatches } from '../server/utils/corvanaOAuthState.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
let passed = 0
async function test(name, fn) {
  await fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const PROD = 'production'
const TOKEN = 'corvana-test-token-not-real-0123456789'

await test('production with no CORVANA_ADMIN_TOKEN denies everyone (403), even with a header', () => {
  for (const configuredToken of [undefined, null, '', '   ']) {
    for (const providedToken of [undefined, '', TOKEN, 'anything']) {
      assert.deepEqual(corvanaAuthDecision({ nodeEnv: PROD, configuredToken, providedToken }), { ok: false, status: 403, code: 'not_configured' })
    }
  }
})

await test('production: missing, blank or wrong credentials → 401; the right token → allowed', () => {
  for (const providedToken of [undefined, null, '', '  ']) {
    assert.equal(corvanaAuthDecision({ nodeEnv: PROD, configuredToken: TOKEN, providedToken }).code, 'missing_credentials')
  }
  for (const providedToken of ['wrong', `${TOKEN}x`, TOKEN.slice(0, -1), TOKEN.toUpperCase()]) {
    assert.deepEqual(corvanaAuthDecision({ nodeEnv: PROD, configuredToken: TOKEN, providedToken }), { ok: false, status: 401, code: 'invalid_credentials' })
  }
  assert.deepEqual(corvanaAuthDecision({ nodeEnv: PROD, configuredToken: TOKEN, providedToken: TOKEN }), { ok: true })
  assert.deepEqual(corvanaAuthDecision({ nodeEnv: PROD, configuredToken: ` ${TOKEN} `, providedToken: [TOKEN] }), { ok: true })
})

await test('local development stays open (unchanged)', () => {
  assert.deepEqual(corvanaAuthDecision({ nodeEnv: 'development', configuredToken: '', providedToken: '' }), { ok: true })
})

await test('refusals never echo or hint at the token', () => {
  for (const code of ['not_configured', 'missing_credentials', 'invalid_credentials']) {
    const body = JSON.stringify(corvanaRefusalBody({ ok: false, status: 401, code }))
    assert.doesNotMatch(body, /CORVANA_ADMIN_TOKEN|token=|corvana-test/i)
  }
})

await test('every Corvana API file is guarded by the middleware; only the OAuth callback is exempt', () => {
  const files = []
  const walk = (d) => { for (const e of fs.readdirSync(path.join(root, d), { withFileTypes: true })) e.isDirectory() ? walk(`${d}/${e.name}`) : files.push(`${d}/${e.name}`) }
  walk('server/api/corvana')
  assert.ok(files.length >= 16, `found ${files.length}`)
  for (const f of files) {
    const route = '/' + f.replace(/^server\//, '').replace(/\.(get|post|put|delete|patch)?\.?ts$/, '').replace(/\/index$/, '')
    const guarded = isGuardedCorvanaPath(route)
    assert.equal(guarded, route !== '/api/corvana/google/callback', `${f} → ${route}`)
  }
  for (const p of ['/api/corvana', '/API/Corvana/debug-env', '/api/corvana//seo/upgrades/mark', '/api/corvana/seo/upgrades/mark/']) assert.equal(isGuardedCorvanaPath(p), true, p)
  for (const p of ['/corvana/seo', '/api/stripe/billing', '/api/corvanax', '/api/sitemap/artists']) assert.equal(isGuardedCorvanaPath(p), false, p)
})

await test('real HTTP: refusals are actual 401/403 responses and the endpoint never runs', async () => {
  // Same logic as server/middleware/corvana-auth.ts, in front of a stand-in endpoint.
  let endpointRuns = 0
  const makeApp = (configuredToken) => {
    const app = createApp()
    app.use(defineEventHandler((event) => {
      if (!isGuardedCorvanaPath(getRequestURL(event).pathname)) return
      const decision = corvanaAuthDecision({ nodeEnv: PROD, configuredToken, providedToken: getHeader(event, CORVANA_TOKEN_HEADER) })
      if (decision.ok) return
      setResponseStatus(event, decision.status)
      return corvanaRefusalBody(decision)
    }))
    app.use(defineEventHandler(() => { endpointRuns += 1; return { report: 'internal data' } }))
    return app
  }
  const call = (app, url, headers = {}, method = 'GET') => new Promise((resolve, reject) => {
    const server = http.createServer(toNodeListener(app)).listen(0, () => {
      const req = http.request({ port: server.address().port, path: url, method, headers }, (res) => {
        let body = ''
        res.on('data', (c) => { body += c })
        res.on('end', () => { server.close(); resolve({ status: res.statusCode, body }) })
      })
      req.on('error', (e) => { server.close(); reject(e) })
      req.end()
    })
  })
  const unconfigured = makeApp('')
  const configured = makeApp(TOKEN)
  for (const [app, url, headers, method, status] of [
    [unconfigured, '/api/corvana/seo/articles/inventory', {}, 'GET', 403],
    [unconfigured, '/api/corvana/debug-env', { [CORVANA_TOKEN_HEADER]: TOKEN }, 'GET', 403],
    [configured, '/api/corvana/seo/articles/inventory', {}, 'GET', 401],
    [configured, '/api/corvana/seo/upgrades/mark', { [CORVANA_TOKEN_HEADER]: 'wrong' }, 'POST', 401],
    [configured, `/api/corvana/seo/export/snapshot?token=${TOKEN}`, {}, 'GET', 401],
  ]) {
    const r = await call(app, url, headers, method)
    assert.equal(r.status, status, `${method} ${url}`)
    assert.doesNotMatch(r.body, /internal data/)
  }
  assert.equal(endpointRuns, 0, 'no refused request reached an endpoint')
  const ok = await call(configured, '/api/corvana/seo/articles/inventory', { [CORVANA_TOKEN_HEADER]: TOKEN })
  assert.equal(ok.status, 200)
  assert.match(ok.body, /internal data/)
})

await test('middleware and helper both use the one decision; the token is header-only, never the query string', () => {
  const mw = read('server/middleware/corvana-auth.ts')
  assert.match(mw, /if \(!isGuardedCorvanaPath\(getRequestURL\(event\)\.pathname\)\) return/)
  assert.match(mw, /corvanaAuthDecision\(\{\s*nodeEnv: process\.env\.NODE_ENV,\s*configuredToken: process\.env\.CORVANA_ADMIN_TOKEN,\s*providedToken: getHeader\(event, CORVANA_TOKEN_HEADER\),/)
  assert.match(mw, /setResponseStatus\(event, decision\.status\)/)
  const helper = read('server/utils/corvanaAuth.ts')
  assert.match(helper, /corvanaAuthDecision\(/)
  assert.doesNotMatch(helper + mw, /getQuery|allowing access|return true/)
  for (const f of ['seo/articles/inventory.get.ts', 'seo/upgrades/mark.post.ts']) {
    assert.match(read(`server/api/corvana/${f}`), /setResponseStatus\(event, auth\.status \|\| 401\)/)
  }
})

await test('OAuth: connect needs the admin token, issues a one-time httpOnly state; callback refuses a missing or wrong state before storing anything', () => {
  const connect = read('server/api/corvana/google/connect.get.ts')
  assert.match(connect, /randomBytes\(24\)\.toString\('base64url'\)/)
  assert.match(connect, /httpOnly: true/)
  assert.match(connect, /path: '\/api\/corvana\/google'/)
  assert.match(connect, /return \{ url: generateAuthUrl\(oauth2Client, state\) \}/)
  assert.doesNotMatch(connect, /sendRedirect/)
  assert.match(read('server/utils/corvanaGoogleOAuth.ts'), /include_granted_scopes: true,\s*state\s*\}/)
  const callback = read('server/api/corvana/google/callback.get.ts')
  const guard = callback.indexOf('if (!stateMatches(query.state, expectedState))')
  assert.ok(guard > 0)
  assert.ok(guard < callback.indexOf('exchangeCodeForTokens(oauth2Client, code)'), 'state checked before the code exchange')
  assert.ok(guard < callback.indexOf('await storeRefreshToken('), 'state checked before storing a token')
  assert.equal(stateMatches('a'.repeat(32), 'a'.repeat(32)), true)
  for (const [r, e] of [['', 'a'.repeat(32)], ['a'.repeat(32), ''], ['a'.repeat(32), 'b'.repeat(32)], [undefined, undefined], ['short', 'short']]) assert.equal(stateMatches(r, e), false)
})

await test('callback page escapes reflected values (no XSS from ?error= / ?error_description=)', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>"\''), '&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;')
  const callback = read('server/api/corvana/google/callback.get.ts')
  assert.match(callback, /<h1>\$\{escapeHtml\(title\)\}<\/h1>\s*<p>\$\{escapeHtml\(message\)\}<\/p>/)
  assert.match(callback, /query\.error_description \? escapeHtml\(String\(query\.error_description\)\) : undefined/)
})

await test('dashboard sends the token as a header from this tab only; no hardcoded secret anywhere', () => {
  const page = read('pages/corvana/seo.vue')
  assert.match(page, /headers\['x-corvana-admin-token'\] = adminToken\.value\.trim\(\)/)
  assert.match(page, /sessionStorage\.setItem\(TOKEN_KEY/)
  assert.doesNotMatch(page, /localStorage|[?&]token=/)
  assert.doesNotMatch(page, /await fetch\(/, 'every API call carries the header')
  for (const f of ['server/utils/corvanaAuth.ts', 'server/utils/corvanaAuthDecision.js', 'server/middleware/corvana-auth.ts', 'pages/corvana/seo.vue']) {
    assert.doesNotMatch(read(f), /CORVANA_ADMIN_TOKEN\s*[=:]\s*['"`][^'"`]+['"`]/, f)
  }
})

console.log(`\n=== corvana auth: ${passed} passed ===`)
