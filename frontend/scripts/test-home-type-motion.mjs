/**
 * Homepage typography motion tests.
 * Run: node scripts/test-home-type-motion.mjs
 */
import assert from 'node:assert/strict'
import {
  HOME_TYPE_DELAY,
  HOME_TYPE_DURATION,
  homePhraseMotion,
  homeSectionTypeMotion,
  homeSupportMotion,
  isHomeTypeReduced,
} from '../utils/ui/homeTypeMotion.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('reduced motion has no travel', () => {
  assert.equal(isHomeTypeReduced('reduce'), true)
  const phrase = homePhraseMotion(true, 0.2)
  assert.equal(phrase.initial.y, 0)
  assert.equal(phrase.transition.duration, 0)
  assert.equal(homeSupportMotion(true).initial.y, 0)
  assert.equal(homeSectionTypeMotion(true).initial.y, 0)
})

test('phrase units stagger as thoughts, not words', () => {
  const one = homePhraseMotion(false, 0)
  const two = homePhraseMotion(false, HOME_TYPE_DELAY.thought2)
  assert.equal(one.initial.y, '105%')
  assert.equal(two.transition.delay, 0.08)
  assert.ok(two.transition.delay < 0.12)
  assert.ok(one.transition.duration <= 0.55)
  assert.ok(one.transition.duration >= 0.45)
})

test('support copy follows the second thought', () => {
  const support = homeSupportMotion(false)
  assert.ok(support.transition.delay > HOME_TYPE_DELAY.thought2)
  assert.ok(support.transition.delay + support.transition.duration < 0.7)
  assert.equal(support.initial.y, 8)
})

test('section reveal is once-style and quiet', () => {
  const section = homeSectionTypeMotion(false, 0.06)
  assert.equal(section.transition.duration, HOME_TYPE_DURATION.section)
  assert.equal(section.transition.delay, 0.06)
  assert.ok(section.initial.y <= 16)
  assert.equal(section.initial.scale, undefined)
  assert.ok(HOME_TYPE_DELAY.sectionHeading >= 0.08)
  assert.ok(HOME_TYPE_DELAY.sectionHeading <= 0.16)
})

console.log(`\nhome-type-motion: ${passed} tests passed`)
