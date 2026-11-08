/**
 * Cybered public-profile bottom-nav hysteresis.
 * Run: node scripts/test-cybered-profile-chrome.mjs
 */
import assert from 'node:assert/strict'
import {
  CYBERED_HERO_NAV_HIDE_RATIO,
  CYBERED_HERO_NAV_SHOW_RATIO,
  nextCyberedHeroOpening,
} from '../utils/ui/cyberedProfileChrome.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('hero filling the viewport keeps the opening active', () => {
  assert.equal(CYBERED_HERO_NAV_HIDE_RATIO, 0.7)
  assert.equal(nextCyberedHeroOpening(true, 1), true)
  assert.equal(nextCyberedHeroOpening(false, 0.7), true)
  assert.equal(nextCyberedHeroOpening(true, 0.85), true)
})

test('hero receding into content reveals the nav', () => {
  assert.equal(CYBERED_HERO_NAV_SHOW_RATIO, 0.45)
  assert.equal(nextCyberedHeroOpening(true, 0.45), false)
  assert.equal(nextCyberedHeroOpening(true, 0.2), false)
  assert.equal(nextCyberedHeroOpening(false, 0), false)
})

test('hysteresis ignores small moves around the threshold', () => {
  assert.equal(nextCyberedHeroOpening(true, 0.55), true)
  assert.equal(nextCyberedHeroOpening(true, 0.6), true)
  assert.equal(nextCyberedHeroOpening(false, 0.55), false)
  assert.equal(nextCyberedHeroOpening(false, 0.5), false)
})

test('returning to a strong hero intersection hides the nav again', () => {
  assert.equal(nextCyberedHeroOpening(false, 0.7), true)
  assert.equal(nextCyberedHeroOpening(false, 1), true)
})

test('unmeasured hero and invalid ratios do not flicker', () => {
  assert.equal(nextCyberedHeroOpening(true, 0, { height: 0 }), true)
  assert.equal(nextCyberedHeroOpening(true, Number.NaN), true)
  assert.equal(nextCyberedHeroOpening(false, undefined), false)
})

console.log(`\ncybered-profile-chrome: ${passed} tests passed`)
