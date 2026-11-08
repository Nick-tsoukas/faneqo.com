/**
 * Homepage hero wake-up tokens.
 * Run: node scripts/test-home-hero-wake-up.mjs
 */
import assert from 'node:assert/strict'
import {
  HOME_HERO_WAKE,
  homeHeroFrameMotion,
  homeHeroImageMotion,
  homeHeroMusicMotion,
  homeHeroPhoneMotion,
  homeHeroTitleMotion,
  homeHeroWakeMusicDelay,
  homeHeroWakePlayCueDelay,
  homeHeroWakeSettleStart,
} from '../utils/ui/homeHeroWakeUp.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('phone entrance is a short fade/slide, not a 3D gimmick', () => {
  const motion = homeHeroPhoneMotion(false)
  assert.equal(motion.initial.opacity, 0)
  assert.equal(motion.initial.y, 18)
  assert.equal(motion.initial.scale, 0.985)
  assert.equal(motion.initial.rotate, undefined)
  assert.ok(motion.transition.delay >= 0.3)
  assert.ok(motion.transition.delay <= 0.4)
  assert.ok(motion.transition.duration >= 0.45)
  assert.ok(motion.transition.duration <= 0.55)
})

test('internal hero heights stay in the phone-prototype range', () => {
  assert.ok(HOME_HERO_WAKE.arrivalHeight >= 330)
  assert.ok(HOME_HERO_WAKE.arrivalHeight <= 370)
  assert.ok(HOME_HERO_WAKE.settledHeight >= 220)
  assert.ok(HOME_HERO_WAKE.settledHeight <= 260)
  assert.ok(HOME_HERO_WAKE.settledHeight < HOME_HERO_WAKE.arrivalHeight)
  const arrival = homeHeroFrameMotion(false, false)
  const settled = homeHeroFrameMotion(false, true)
  assert.equal(arrival.animate.height, `${HOME_HERO_WAKE.arrivalHeight}px`)
  assert.equal(settled.animate.height, `${HOME_HERO_WAKE.settledHeight}px`)
})

test('reduced motion renders the settled hero immediately', () => {
  const frame = homeHeroFrameMotion(true, false)
  const phone = homeHeroPhoneMotion(true)
  const music = homeHeroMusicMotion(true)
  const title = homeHeroTitleMotion(true, false)
  assert.equal(frame.animate.height, `${HOME_HERO_WAKE.settledHeight}px`)
  assert.equal(frame.transition.duration, 0)
  assert.equal(phone.initial.opacity, 1)
  assert.equal(music.initial.opacity, 1)
  assert.equal(title.animate.y, -HOME_HERO_WAKE.titleShift)
})

test('full sequence stays near two seconds', () => {
  const settleStart = homeHeroWakeSettleStart()
  const playCue = homeHeroWakePlayCueDelay()
  assert.ok(settleStart >= 1.2)
  assert.ok(settleStart <= 1.45)
  assert.ok(HOME_HERO_WAKE.hold >= 0.5)
  assert.ok(HOME_HERO_WAKE.hold <= 0.75)
  assert.ok(playCue <= 2.05)
  assert.ok(homeHeroWakeMusicDelay() > settleStart)
})

test('hero image scale is a no-op so the first hero does not zoom', () => {
  const image = homeHeroImageMotion(false, true)
  assert.equal(image.initial.scale, 1)
  assert.equal(image.animate.scale, 1)
})

console.log(`\nhome-hero-wake-up: ${passed} tests passed`)
