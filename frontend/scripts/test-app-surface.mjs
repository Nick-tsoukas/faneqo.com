/**
 * Application material routing must never attach to public artist pages.
 * Run: node scripts/test-app-surface.mjs
 */
import assert from 'node:assert/strict'
import { isFaneqoAppPath, isImmersiveShowRecapPath } from '../utils/ui/appSurface.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('workspace routes are application surfaces', () => {
  for (const path of [
    '/messages',
    '/messages/inbox/12',
    '/dashboard',
    '/nights',
    '/fans',
    '/account',
    '/createband',
    '/editband/9',
    '/fan',
    '/fan/messages',
    '/fan/profile',
  ]) {
    assert.equal(isFaneqoAppPath(path), true, path)
  }
})

test('public artist and marketing pages stay off the app material', () => {
  for (const path of [
    '/',
    '/badflower',
    '/burningthunder',
    '/signup',
    '/login',
    '/article/qr-code-strategy/foo',
    '/bands/all',
  ]) {
    assert.equal(isFaneqoAppPath(path), false, path)
  }
})

test('/fans is app and /fan is app without colliding with slugs', () => {
  assert.equal(isFaneqoAppPath('/fans'), true)
  assert.equal(isFaneqoAppPath('/fan'), true)
  assert.equal(isFaneqoAppPath('/faneqo'), false)
})

test('Show Recap hides mobile site header without leaving the artist app', () => {
  assert.equal(isImmersiveShowRecapPath('/fans/recaps/88'), true)
  assert.equal(isImmersiveShowRecapPath('/__dev/artist-recap'), true)
  assert.equal(isImmersiveShowRecapPath('/fans'), false)
  assert.equal(isImmersiveShowRecapPath('/fans/recaps'), false)
  assert.equal(isImmersiveShowRecapPath('/dashboard'), false)
})

console.log(`\n=== app surface: ${passed} passed ===`)
