/**
 * Create Artist: a band-limit refusal reads as words, not "Forbidden".
 * Run: node scripts/test-create-band-limit-message.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript } from '@vue/compiler-sfc'
import { BAND_LIMIT_MESSAGE, createBandErrorMessage } from '../utils/bands/createBandError.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

// Exactly what production returned for a second band on 2026-11-09.
const PROD_LIMIT_REFUSAL = { data: null, error: { status: 403, name: 'ForbiddenError', message: 'Forbidden', details: {} } }

test('the production 403 refusal becomes the band-limit explanation', () => {
  assert.equal(createBandErrorMessage(PROD_LIMIT_REFUSAL), BAND_LIMIT_MESSAGE)
})

test('other generic 403 refusal texts also get the explanation', () => {
  for (const message of ['Forbidden access', 'Policy Failed', '', 'FORBIDDEN']) {
    assert.equal(createBandErrorMessage({ error: { status: 403, name: 'PolicyError', message } }), BAND_LIMIT_MESSAGE)
  }
})

test('the policy text, if it ever arrives, gets the same explanation (1 or agency 10)', () => {
  for (const n of [1, 10]) {
    assert.equal(
      createBandErrorMessage({ error: { status: 403, name: 'PolicyError', message: `You may only create up to ${n} band(s).` } }),
      BAND_LIMIT_MESSAGE
    )
  }
})

test('a 403 with its own specific message is shown as sent (e.g. a future subscription refusal)', () => {
  const msg = 'Your subscription is not active. Please subscribe to use this feature.'
  assert.equal(createBandErrorMessage({ error: { status: 403, name: 'ForbiddenError', message: msg } }), msg)
})

test('other create errors keep their existing message', () => {
  assert.equal(
    createBandErrorMessage({ error: { status: 400, name: 'ValidationError', message: 'That artist name is already in use. Choose a different name.' } }),
    'That artist name is already in use. Choose a different name.'
  )
  assert.equal(createBandErrorMessage({ error: { status: 500, message: 'Internal Server Error' } }), 'Internal Server Error')
})

test('network failures and empty bodies fall back to "Creation failed"', () => {
  assert.equal(createBandErrorMessage(new TypeError('Failed to fetch')), 'Creation failed')
  assert.equal(createBandErrorMessage(undefined), 'Creation failed')
  assert.equal(createBandErrorMessage({}), 'Creation failed')
})

test('the explanation is plain and gives a next step', () => {
  assert.doesNotMatch(BAND_LIMIT_MESSAGE, /forbidden/i)
  assert.match(BAND_LIMIT_MESSAGE, /Team Access/)
  assert.match(BAND_LIMIT_MESSAGE, /pat@faneqo\.com/)
  assert.doesNotMatch(BAND_LIMIT_MESSAGE, /one artist/i, 'agency accounts have a higher limit, so the copy never states a number')
})

test('Create Artist uses it for every failed create', () => {
  const file = path.join(root, 'pages/createband.vue')
  const src = fs.readFileSync(file, 'utf8')
  assert.match(src, /import \{ createBandErrorMessage \} from "@\/utils\/bands\/createBandError"/)
  assert.match(src, /alert\(createBandErrorMessage\(err\)\)/)
  assert.doesNotMatch(src, /alert\(err\?\.error\?\.message/)
  const { descriptor, errors } = parse(src, { filename: file })
  assert.equal(errors.length, 0)
  compileScript(descriptor, { id: 'createband' })
})

console.log(`\n${passed} create band limit message checks passed`)
